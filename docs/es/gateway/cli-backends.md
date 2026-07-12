---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Está ejecutando CLI de IA locales y quiere reutilizarlas
    - Quieres comprender el puente de bucle invertido MCP para acceder a las herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-12T14:27:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de solo texto cuando los proveedores de API no están disponibles, tienen limitación de frecuencia o presentan un comportamiento incorrecto. Se ha diseñado de forma intencionadamente conservadora:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del Gateway mediante un puente MCP de bucle invertido.
- Transmisión JSONL para las CLI que la admiten.
- Se admiten sesiones, por lo que los turnos de seguimiento mantienen la coherencia.
- Las imágenes se transfieren si la CLI acepta rutas de imágenes.

Úselo como red de seguridad para obtener respuestas de texto que «siempre funcionen», no como vía principal. Para disponer de un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos y conversaciones, y sesiones externas persistentes de programación, use [Agentes ACP](/es/tools/acp-agents); los backends de CLI no son ACP.

<Tip>
  ¿Está creando un nuevo Plugin de backend? Consulte [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página explica cómo configurar y operar un backend ya registrado.
</Tip>

## Inicio rápido

El Plugin de Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin más configuración que tener Claude Code instalado y con la sesión iniciada:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el id de agente predeterminado cuando no se configura una lista explícita de agentes; en caso contrario, sustitúyalo por su propio id de agente.

Si el Gateway se ejecuta mediante launchd/systemd con un `PATH` mínimo, indique explícitamente la ubicación del binario:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Si usa un backend de CLI incluido como proveedor principal de mensajes en un host del Gateway, OpenClaw carga automáticamente el Plugin incluido propietario cuando la configuración hace referencia a ese backend en una referencia de modelo o en `agents.defaults.cliBackends`.

## Uso como alternativa

Añada el backend de CLI a la lista de alternativas para que solo se ejecute cuando fallen los modelos principales:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Si usa `agents.defaults.models` como lista de permitidos, incluya también en ella los modelos del backend de CLI. Cuando falla el proveedor principal (autenticación, límites de frecuencia o tiempos de espera), OpenClaw prueba a continuación el backend de CLI.

## Configuración

Todos los backends de CLI se encuentran en `agents.defaults.cliBackends`, identificados mediante el id del proveedor (por ejemplo, `claude-cli` o `my-cli`). El id del proveedor pasa a ser el lado izquierdo de la referencia del modelo: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Opción específica para el archivo de instrucciones:
          // systemPromptFileArg: "--system-file",
          // Como alternativa, opción de anulación de configuración al estilo de Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Habilítelo solo si este backend puede reinicializar sesiones invalidadas a partir
          // del historial sin procesar y acotado de la transcripción de OpenClaw antes de la Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Funcionamiento

1. Selecciona un backend según el prefijo del proveedor (`claude-cli/...`).
2. Crea unas instrucciones del sistema utilizando las mismas instrucciones de OpenClaw y el mismo contexto del espacio de trabajo.
3. Ejecuta la CLI con un id de sesión (si se admite) para mantener la coherencia del historial. El backend `claude-cli` incluido mantiene activo un proceso stdio de Claude por cada sesión de OpenClaw y envía los turnos de seguimiento mediante la entrada estándar stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Conserva los id de sesión de cada backend para que los seguimientos reutilicen la misma sesión de CLI.

### Particularidades de la CLI de Claude

El backend `claude-cli` incluido da preferencia al mecanismo nativo de resolución de Skills de Claude Code. Cuando la instantánea actual de Skills contiene al menos una Skill seleccionada con una ruta materializada, OpenClaw proporciona un Plugin temporal de Claude Code mediante `--plugin-dir` y omite el catálogo duplicado de Skills de OpenClaw de las instrucciones del sistema añadidas. Si no hay una Skill de Plugin materializada, OpenClaw conserva el catálogo de las instrucciones como alternativa. Las anulaciones de variables de entorno y claves de API de la Skill siguen aplicándose al entorno del proceso secundario durante la ejecución.

La CLI de Claude tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir una configuración específica de Claude. En las sesiones activas de Claude gestionadas por OpenClaw, la política de ejecución efectiva es la autoridad: YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`) inicia Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo inicia con `--permission-mode default`. La configuración `agents.list[].tools.exec` de cada agente prevalece sobre la configuración global `tools.exec` para ese agente. Los argumentos sin procesar del backend pueden seguir incluyendo `--permission-mode`, pero los inicios de sesiones activas de Claude normalizan esa opción para que coincida con la política efectiva.

El backend también asigna los niveles de `/think` de OpenClaw al indicador nativo `--effort` de Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, y `high`/`xhigh`/`max` se transfieren directamente. `adaptive` elimina los indicadores `--effort` configurados y no proporciona ningún sustituto, por lo que Claude Code determina el nivel de esfuerzo efectivo a partir de su propio entorno, configuración y valores predeterminados del modelo. Los demás backends de CLI requieren que el Plugin propietario declare un asignador de argumentos equivalente antes de que `/think` afecte a la CLI iniciada.

Antes de que OpenClaw pueda usar `claude-cli`, es necesario iniciar sesión en Claude Code en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones de Docker requieren que Claude Code esté instalado y que se haya iniciado sesión dentro del directorio de inicio persistente del contenedor, no solo en el host; consulte [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).

Establezca `agents.defaults.cliBackends.claude-cli.command` únicamente cuando el binario `claude` aún no se encuentre en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establezca `sessionArg` (p. ej., `--session-id`) o `sessionArgs` (marcador de posición `{sessionId}`) cuando el identificador deba incluirse en varias opciones.
- Si la CLI utiliza un subcomando de reanudación con opciones diferentes, establezca `resumeArgs` (sustituye a `args` al reanudar) y, opcionalmente, `resumeOutput` para reanudaciones sin JSON.
- `sessionMode`:
  - `always`: siempre envía un identificador de sesión (un UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un identificador de sesión si ya se había almacenado uno.
  - `none`: nunca envía un identificador de sesión.
- `claude-cli` utiliza de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, por lo que los turnos posteriores reutilizan el proceso activo de Claude mientras siga en ejecución, incluso con configuraciones personalizadas que omitan los campos de transporte. Si el Gateway se reinicia o el proceso inactivo termina, OpenClaw reanuda desde el identificador de sesión de Claude almacenado. Antes de reanudar, los identificadores de sesión almacenados se verifican mediante una transcripción legible del proyecto; si falta la transcripción, se elimina la vinculación (se registra como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva con `--resume`.
- Las sesiones activas de Claude mantienen límites acotados para la salida JSONL: 8 MiB y 20,000 líneas JSONL sin procesar por turno de forma predeterminada. Auméntelos para cada backend mediante `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` y `maxTurnLines`; OpenClaw limita esos ajustes a 64 MiB y 100,000 líneas.
- La continuidad de las sesiones de CLI almacenadas pertenece al proveedor. El reinicio diario implícito de la sesión no las interrumpe; `/reset` y las políticas explícitas de `session.reset` sí lo hacen.
- Las sesiones nuevas de CLI normalmente se reinicializan solo a partir del resumen de Compaction de OpenClaw y del tramo posterior a la Compaction. Para recuperar sesiones cortas invalidadas antes de la Compaction, un backend puede habilitar `reseedFromRawTranscriptWhenUncompacted: true`. La reinicialización desde la transcripción sin procesar permanece acotada y limitada a invalidaciones seguras, como la ausencia de una transcripción de la CLI, un tramo huérfano de uso de herramientas, cambios en la política de mensajes, el prompt del sistema, el directorio de trabajo o MCP, o un reintento por sesión expirada; los cambios en el perfil de autenticación o en la época de credenciales nunca reinicializan el historial de la transcripción sin procesar.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones del mismo carril (la mayoría de las CLI serializan en un solo carril del proveedor). OpenClaw también deja de reutilizar la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada, incluido un cambio en el identificador del perfil de autenticación, la clave de API estática, el token estático o la identidad de la cuenta OAuth cuando la CLI expone una; la mera rotación del token de acceso o actualización de OAuth no interrumpe la sesión. Si una CLI no dispone de un identificador estable de cuenta OAuth, OpenClaw permite que esa CLI aplique sus propios permisos de reanudación.

## Preámbulo de recuperación de las sesiones de claude-cli

Cuando un intento de `claude-cli` conmuta por error a un candidato que no es de CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicia el siguiente intento con un preámbulo de contexto extraído de la transcripción JSONL local de Claude Code (en `~/.claude/projects/`, con una clave por espacio de trabajo). Sin esta información inicial, el proveedor de respaldo comienza sin contexto, ya que la transcripción de sesión de OpenClaw está vacía para las ejecuciones de `claude-cli`.

- El preámbulo prioriza el resumen más reciente de `/compact` o el marcador `compact_boundary` y, a continuación, añade los turnos posteriores al límite más recientes hasta alcanzar un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se agrupan en indicaciones compactas de `(tool call: name)` y `(tool result: …)` para respetar el presupuesto del prompt; los resúmenes demasiado grandes se truncan y se etiquetan como `(truncated)`.
- Los mecanismos de respaldo del mismo proveedor de `claude-cli` a `claude-cli` utilizan el propio `--resume` de Claude y omiten el preámbulo.
- La semilla reutiliza la validación existente de la ruta del archivo de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Si la CLI acepta rutas de imágenes, establece `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe las imágenes en base64 en archivos temporales. Si se establece `imageArg`, esas rutas se pasan como argumentos de la CLI; de lo contrario, OpenClaw añade las rutas de los archivos al prompt (inyección de rutas), lo que funciona con las CLI que cargan automáticamente archivos locales a partir de rutas simples.

## Entradas y salidas

- `output: "text"` (valor predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer el texto junto con un identificador de sesión.
- `output: "jsonl"` analiza un flujo JSONL y extrae el mensaje final del agente junto con los identificadores de sesión cuando están presentes.
- Para la salida JSON de la CLI de Gemini, OpenClaw lee el texto de la respuesta desde `response` y el uso desde `stats` cuando `usage` no está presente o está vacío. La configuración predeterminada incluida de la CLI de Gemini utiliza `stream-json`; las sustituciones antiguas con `--output-format json` siguen utilizando el analizador JSON.

Modos de entrada:

- `input: "arg"` (valor predeterminado) pasa el prompt como último argumento de la CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y se establece `maxPromptArgChars`, se utiliza stdin en su lugar.

## Valores predeterminados propiedad del Plugin

Los valores predeterminados del backend de la CLI forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelos.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue prevaleciendo sobre el valor predeterminado del Plugin.
- La limpieza de la configuración específica del backend sigue siendo responsabilidad del Plugin mediante el hook opcional `normalizeConfig`.

Anthropic es responsable de `claude-cli` y Google es responsable de `google-gemini-cli`. Las ejecuciones del agente OpenAI Codex utilizan el arnés del servidor de aplicaciones de Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

El Plugin de Anthropic incluido registra lo siguiente para `claude-cli`:

| Clave                 | Valor                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

El Plugin de Google incluido se registra para `google-gemini-cli`:

| Clave                     | Valor                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | igual, con `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Requisito previo: la CLI local de Gemini debe estar instalada y disponible en `PATH` como `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas sobre la salida de la CLI de Gemini:

- El analizador predeterminado de `stream-json` lee los eventos `message` del asistente, los eventos de herramientas, el uso del `result` final y los eventos de error fatal de Gemini.
- Si se reemplazan los argumentos de Gemini por `--output-format json`, OpenClaw vuelve a normalizar ese backend a `output: "json"` y lee el texto de la respuesta del campo `response` del JSON.
- El uso recurre a `stats` cuando `usage` está ausente o vacío; `stats.cached` se normaliza como `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se derivan de `stats.input_tokens - stats.cached`.

Reemplace los valores predeterminados solo si es necesario (lo más habitual es una ruta absoluta para `command`).

## Superposiciones de transformación de texto

Los Plugins que necesiten pequeños adaptadores de compatibilidad para prompts o mensajes pueden declarar transformaciones de texto bidireccionales sin reemplazar un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output` reescribe el texto transmitido del asistente y el texto final analizado antes de que OpenClaw procese sus propios marcadores de control y la entrega al canal; en las llamadas a modelos respaldadas por un proveedor, también restaura los valores de cadena dentro de los argumentos estructurados de llamadas a herramientas después de reparar el flujo y antes de ejecutar la herramienta. Los fragmentos JSON sin procesar del proveedor permanecen sin cambios; los consumidores deben usar la carga útil estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, establezca `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para flujos compatibles con Claude Code y `gemini-stream-json` para eventos `stream-json` de la CLI de Gemini.

## Propiedad de la Compaction nativa

Algunos backends de CLI ejecutan un agente que compacta su propia transcripción, por lo que OpenClaw no debe ejecutar su resumidor de protección sobre ellos: hacerlo interfiere con la Compaction propia del backend y puede provocar un fallo irreversible del turno.

`claude-cli` no tiene un endpoint del arnés (Claude Code realiza la Compaction internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. En cambio, las sesiones con arnés nativo, como Codex, siguen dirigiéndose al endpoint de Compaction de su arnés.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` únicamente para un backend que realmente sea responsable de la Compaction: debe limitar de forma fiable su propia transcripción cerca de la ventana de contexto y conservar una sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión aplazada puede seguir excediendo el presupuesto.

## Superposiciones de MCP incluido

Los backends de CLI no reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede habilitar una superposición de configuración de MCP generada mediante `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado.
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado.

Cuando MCP incluido está habilitado, OpenClaw:

- inicia un servidor HTTP MCP de bucle invertido que expone las herramientas del Gateway al proceso de la CLI, autenticado mediante una concesión de contexto por ejecución (`OPENCLAW_MCP_TOKEN`) activa únicamente durante el intento de ejecución actual;
- vincula el acceso a las herramientas con el contexto de sesión, cuenta y canal seleccionado por el Gateway, en lugar de confiar en los encabezados del proceso secundario;
- carga los servidores MCP incluidos habilitados para el espacio de trabajo actual y los combina con cualquier estructura de configuración de MCP existente del backend;
- reescribe la configuración de inicio mediante el modo de integración del backend definido por el Plugin propietario.

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un backend habilita MCP incluido, para que las ejecuciones en segundo plano permanezcan aisladas.

Los entornos de ejecución MCP incluidos y limitados a la sesión se almacenan en caché para reutilizarlos dentro de una sesión y, después, se eliminan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (valor predeterminado: 10 minutos; establezca `0` para deshabilitarlo). Las ejecuciones integradas de un solo uso, como las comprobaciones de autenticación, la generación de identificadores cortos y la recuperación de Active Memory, solicitan la limpieza al finalizar la ejecución para que los procesos secundarios stdio y los flujos HTTP/SSE transmitibles no sobrevivan a la ejecución.

## Límite del historial de reinicialización

Cuando una sesión nueva de CLI se inicializa a partir de una transcripción anterior de OpenClaw (por ejemplo, después de un reintento por `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización crezcan desmesuradamente. El valor predeterminado es de 12,288 caracteres (unos 3,000 tokens).

En su lugar, los backends de la CLI de Claude ajustan este límite en función de la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes reciben una porción mayor del historial anterior, hasta un máximo fijo; los demás backends de CLI mantienen el valor predeterminado conservador. Este límite solo controla el bloque de historial anterior del prompt de reinicialización; los límites de salida de la sesión activa se ajustan por separado en `reliability.outputLimits` (consulte [Sesiones](#sessions)).

## Limitaciones

- Sin llamadas directas a herramientas de OpenClaw: OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven las herramientas del Gateway cuando habilitan `bundleMcp: true`.
- La transmisión depende del backend: algunos backends transmiten JSONL y otros almacenan la salida en búfer hasta finalizar.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma                         | Solución                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------- |
| No se encuentra la CLI          | Establezca `command` en una ruta completa.                                      |
| Nombre de modelo incorrecto     | Use `modelAliases` para asignar `provider/model` al id. de modelo de la CLI.     |
| Sin continuidad de la sesión    | Asegúrese de que `sessionArg` esté establecido y `sessionMode` no sea `none`.    |
| Se ignoran las imágenes         | Establezca `imageArg` y verifique que la CLI admita rutas de archivos.           |

## Temas relacionados

- [Guía operativa del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
