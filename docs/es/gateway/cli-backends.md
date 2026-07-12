---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Estás ejecutando CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente MCP de local loopback para acceder a las herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de la CLI
x-i18n:
    generated_at: "2026-07-11T23:05:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de respaldo de solo texto cuando los proveedores de API no están disponibles, tienen límites de frecuencia o presentan un comportamiento incorrecto. Es deliberadamente conservador:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del Gateway mediante un puente MCP de local loopback.
- Transmisión JSONL para las CLI que la admiten.
- Se admiten sesiones, por lo que los turnos de seguimiento mantienen la coherencia.
- Las imágenes se transfieren si la CLI acepta rutas de imágenes.

Úselo como red de seguridad para respuestas de texto que «siempre funcionan», no como ruta principal. Para un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas persistentes de programación, use [agentes ACP](/es/tools/acp-agents); los backends de CLI no son ACP.

<Tip>
  ¿Está creando un nuevo Plugin de backend? Consulte [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página explica cómo configurar y operar un backend ya registrado.
</Tip>

## Inicio rápido

El Plugin de Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin configuración adicional, aparte de tener Claude Code instalado y con la sesión iniciada:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el identificador de agente predeterminado cuando no se configura una lista explícita de agentes; de lo contrario, sustitúyalo por su propio identificador de agente.

Si el Gateway se ejecuta mediante launchd/systemd con un `PATH` mínimo, indique explícitamente la ruta del binario:

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

Si usa un backend de CLI incluido como proveedor principal de mensajes en un host del Gateway, OpenClaw carga automáticamente el Plugin incluido propietario cuando la configuración hace referencia a ese backend en una referencia de modelo o dentro de `agents.defaults.cliBackends`.

## Uso como alternativa de respaldo

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

Si usa `agents.defaults.models` como lista de permitidos, incluya también allí los modelos del backend de CLI. Cuando falla el proveedor principal (autenticación, límites de frecuencia o tiempos de espera), OpenClaw prueba a continuación el backend de CLI.

## Configuración

Todos los backends de CLI se encuentran en `agents.defaults.cliBackends`, indexados por el identificador del proveedor (por ejemplo, `claude-cli` o `my-cli`). El identificador del proveedor se convierte en el lado izquierdo de la referencia del modelo: `<provider>/<model>`.

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
          // Marca específica para el archivo de instrucciones:
          // systemPromptFileArg: "--system-file",
          // En su lugar, marca de sobrescritura de configuración al estilo de Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Active esta opción solo si este backend puede reinicializar sesiones invalidadas
          // a partir del historial sin procesar y acotado de la transcripción de OpenClaw antes de la Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cómo funciona

1. Selecciona un backend según el prefijo del proveedor (`claude-cli/...`).
2. Crea unas instrucciones del sistema mediante las mismas instrucciones y el mismo contexto del espacio de trabajo de OpenClaw.
3. Ejecuta la CLI con un identificador de sesión (si se admite) para mantener la coherencia del historial. El backend `claude-cli` incluido mantiene activo un proceso stdio de Claude por sesión de OpenClaw y envía los turnos de seguimiento mediante la entrada estándar de stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Conserva los identificadores de sesión por backend para que los turnos de seguimiento reutilicen la misma sesión de CLI.

### Particularidades de la CLI de Claude

El backend `claude-cli` incluido da preferencia al resolvedor nativo de habilidades de Claude Code. Cuando la instantánea actual de Skills tiene al menos una habilidad seleccionada con una ruta materializada, OpenClaw pasa un Plugin temporal de Claude Code mediante `--plugin-dir` y omite el catálogo duplicado de Skills de OpenClaw de las instrucciones del sistema añadidas. Sin una habilidad de Plugin materializada, OpenClaw conserva el catálogo de las instrucciones como alternativa de respaldo. Las sobrescrituras de variables de entorno y claves de API de las habilidades siguen aplicándose al entorno del proceso secundario durante la ejecución.

La CLI de Claude tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir configuración específica de Claude. En las sesiones activas de Claude administradas por OpenClaw, la política de ejecución efectiva es la autoridad: YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`) inicia Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo inicia con `--permission-mode default`. La configuración `agents.list[].tools.exec` de cada agente prevalece sobre la configuración global `tools.exec` para ese agente. Los argumentos sin procesar del backend aún pueden incluir `--permission-mode`, pero los inicios activos de Claude normalizan esa marca para que coincida con la política efectiva.

El backend también asigna los niveles de `/think` de OpenClaw a la marca nativa `--effort` de Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, y `high`/`xhigh`/`max` se transfieren directamente. `adaptive` elimina las marcas `--effort` configuradas y no proporciona ningún reemplazo, por lo que Claude Code determina el esfuerzo efectivo a partir de su propio entorno, configuración y valores predeterminados del modelo. Otros backends de CLI necesitan que su Plugin propietario declare un asignador de argumentos equivalente antes de que `/think` afecte a la CLI iniciada.

Antes de que OpenClaw pueda usar `claude-cli`, Claude Code debe tener iniciada la sesión en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones con Docker necesitan que Claude Code esté instalado y tenga la sesión iniciada dentro del directorio principal persistente del contenedor, no solo en el host; consulte [Backend de la CLI de Claude en Docker](/es/install/docker#claude-cli-backend-in-docker).

Establezca `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude` aún no esté en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establezca `sessionArg` (por ejemplo, `--session-id`) o `sessionArgs` (marcador `{sessionId}`) cuando el identificador deba incluirse en varias marcas.
- Si la CLI usa un subcomando de reanudación con marcas diferentes, establezca `resumeArgs` (reemplaza `args` al reanudar) y, opcionalmente, `resumeOutput` para reanudaciones que no sean JSON.
- `sessionMode`:
  - `always`: envía siempre un identificador de sesión (un UUID nuevo si no hay ninguno almacenado).
  - `existing`: envía un identificador de sesión solo si ya había uno almacenado.
  - `none`: nunca envía un identificador de sesión.
- `claude-cli` usa de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, por lo que los turnos de seguimiento reutilizan el proceso activo de Claude mientras permanezca activo, incluso en configuraciones personalizadas que omitan los campos de transporte. Si el Gateway se reinicia o el proceso inactivo termina, OpenClaw reanuda la sesión a partir del identificador almacenado de Claude. Antes de reanudar, los identificadores de sesión almacenados se verifican con una transcripción legible del proyecto; si falta la transcripción, se elimina la vinculación (registrada como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva con `--resume`.
- Las sesiones activas de Claude conservan límites acotados para la salida JSONL: 8 MiB y 20 000 líneas JSONL sin procesar por turno de forma predeterminada. Auméntelos para cada backend mediante `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` y `maxTurnLines`; OpenClaw limita esos valores a 64 MiB y 100 000 líneas.
- Las sesiones de CLI almacenadas representan una continuidad propiedad del proveedor. El restablecimiento diario implícito de la sesión no las interrumpe; `/reset` y las políticas explícitas de `session.reset` sí lo hacen.
- Normalmente, las sesiones nuevas de CLI solo se reinicializan a partir del resumen de Compaction de OpenClaw y la parte posterior a la Compaction. Para recuperar sesiones breves invalidadas antes de la Compaction, un backend puede activarlo con `reseedFromRawTranscriptWhenUncompacted: true`. La reinicialización desde la transcripción sin procesar permanece acotada y limitada a invalidaciones seguras, como la ausencia de una transcripción de la CLI, una cola de uso de herramientas huérfana, cambios en la política de mensajes, las instrucciones del sistema, el directorio de trabajo o MCP, o un reintento por sesión caducada; los cambios en el perfil de autenticación o en la época de las credenciales nunca reinicializan el historial sin procesar de la transcripción.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones del mismo carril (la mayoría de las CLI serializan en un carril del proveedor). OpenClaw también descarta la reutilización de la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada, incluido un cambio en el identificador del perfil de autenticación, la clave de API estática, el token estático o la identidad de la cuenta OAuth cuando la CLI expone una; la rotación por sí sola de los tokens de acceso o actualización de OAuth no interrumpe la sesión. Si una CLI no tiene un identificador estable de cuenta OAuth, OpenClaw permite que esa CLI aplique sus propios permisos de reanudación.

## Preámbulo de la alternativa de respaldo desde sesiones de claude-cli

Cuando un intento con `claude-cli` cambia a un candidato que no es de CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicializa el siguiente intento con un preámbulo de contexto obtenido de la transcripción JSONL local de Claude Code (en `~/.claude/projects/`, indexada por espacio de trabajo). Sin esta inicialización, el proveedor alternativo comienza sin contexto, ya que la propia transcripción de sesión de OpenClaw está vacía en las ejecuciones de `claude-cli`.

- El preámbulo da preferencia al resumen más reciente de `/compact` o al marcador `compact_boundary` y, a continuación, añade los turnos más recientes posteriores al límite hasta alcanzar un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se combinan en indicaciones compactas `(tool call: name)` y `(tool result: …)` para respetar el presupuesto de las instrucciones; los resúmenes demasiado grandes se truncan y etiquetan como `(truncated)`.
- Las alternativas de `claude-cli` a `claude-cli` con el mismo proveedor dependen del propio `--resume` de Claude y omiten el preámbulo.
- La inicialización reutiliza la validación existente de rutas de archivos de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Si la CLI acepta rutas de imágenes, establezca `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe las imágenes base64 en archivos temporales. Si se establece `imageArg`, esas rutas se pasan como argumentos de la CLI; si no, OpenClaw añade las rutas de archivo a las instrucciones (inyección de rutas), lo que funciona con las CLI que cargan automáticamente archivos locales a partir de rutas en texto sin formato.

## Entradas y salidas

- `output: "text"` (predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer el texto junto con un identificador de sesión.
- `output: "jsonl"` analiza un flujo JSONL y extrae el mensaje final del agente junto con los identificadores de sesión cuando están presentes.
- Para la salida JSON de la CLI de Gemini, OpenClaw lee el texto de respuesta de `response` y el uso de `stats` cuando `usage` no está presente o está vacío. El valor predeterminado de la CLI de Gemini incluida usa `stream-json`; las sobrescrituras antiguas de `--output-format json` siguen usando el analizador JSON.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa las instrucciones como último argumento de la CLI.
- `input: "stdin"` envía las instrucciones mediante stdin.
- Si las instrucciones son muy largas y se establece `maxPromptArgChars`, se usa stdin en su lugar.

## Valores predeterminados propiedad del Plugin

Los valores predeterminados del backend de CLI forman parte de la superficie del Plugin:

- Los Plugins los registran mediante `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelos.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue prevaleciendo sobre el valor predeterminado del Plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del Plugin mediante el enlace opcional `normalizeConfig`.

Anthropic es propietario de `claude-cli` y Google es propietario de `google-gemini-cli`. Las ejecuciones del agente OpenAI Codex usan el entorno del servidor de aplicaciones Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

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

- El analizador predeterminado de `stream-json` lee los eventos `message` del asistente, los eventos de herramientas, el uso del `result` final y los eventos de errores fatales de Gemini.
- Si sobrescribe los argumentos de Gemini con `--output-format json`, OpenClaw vuelve a normalizar ese backend como `output: "json"` y lee el texto de la respuesta del campo `response` del JSON.
- Cuando `usage` no existe o está vacío, se usa `stats` como alternativa; `stats.cached` se normaliza como `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se calculan mediante `stats.input_tokens - stats.cached`.

Sobrescriba los valores predeterminados solo si es necesario (lo más habitual es especificar una ruta absoluta en `command`).

## Capas de transformación de texto

Los Plugins que necesiten pequeñas adaptaciones de compatibilidad para prompts o mensajes pueden declarar transformaciones de texto bidireccionales sin sustituir un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario enviados a la CLI. `output` reescribe el texto transmitido por el asistente y el texto final analizado antes de que OpenClaw procese sus propios marcadores de control y la entrega al canal; en las llamadas a modelos respaldadas por proveedores, también restaura los valores de cadena dentro de los argumentos estructurados de las llamadas a herramientas después de reparar el flujo y antes de ejecutar las herramientas. Los fragmentos JSON sin procesar del proveedor permanecen sin cambios; los consumidores deben usar la carga útil estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, configure `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para flujos compatibles con Claude Code y `gemini-stream-json` para eventos `stream-json` de la CLI de Gemini.

## Propiedad de la Compaction nativa

Algunos backends de CLI ejecutan un agente que compacta su propia transcripción, por lo que OpenClaw no debe ejecutar su resumidor de protección sobre ellos, ya que hacerlo interfiere con la Compaction propia del backend y puede provocar un fallo definitivo del turno.

`claude-cli` no tiene un endpoint del entorno de ejecución (Claude Code realiza la Compaction internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. En cambio, las sesiones con entorno de ejecución nativo, como Codex, continúan dirigiéndose al endpoint de Compaction de su entorno.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` únicamente para un backend que realmente sea responsable de la Compaction: debe limitar de forma fiable su propia transcripción cerca de la ventana de contexto y conservar una sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión aplazada puede permanecer por encima del límite.

## Capas de MCP incluido

Los backends de CLI no reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede habilitar una capa de configuración de MCP generada mediante `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado.
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado.

Cuando el MCP incluido está habilitado, OpenClaw:

- inicia un servidor HTTP MCP en local loopback que expone las herramientas del Gateway al proceso de la CLI, autenticado mediante una concesión de contexto por ejecución (`OPENCLAW_MCP_TOKEN`) activa únicamente durante el intento de ejecución actual;
- vincula el acceso a las herramientas con el contexto de sesión, cuenta y canal seleccionado por el Gateway, en lugar de confiar en los encabezados del proceso secundario;
- carga los servidores MCP incluidos habilitados para el espacio de trabajo actual y los combina con cualquier estructura de configuración o ajustes MCP ya existente del backend;
- reescribe la configuración de inicio mediante el modo de integración propio del backend definido por el Plugin responsable.

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un backend habilita el MCP incluido, de modo que las ejecuciones en segundo plano permanezcan aisladas.

Los entornos de ejecución MCP incluidos y limitados a la sesión se almacenan en caché para reutilizarlos dentro de una sesión y después se eliminan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (10 minutos de forma predeterminada; establezca `0` para deshabilitarlo). Las ejecuciones integradas de un solo uso, como las comprobaciones de autenticación, la generación de identificadores y la recuperación de Active Memory, solicitan la limpieza al finalizar la ejecución para que los procesos secundarios stdio y los flujos HTTP/SSE transmitibles no sobrevivan a la ejecución.

## Límite del historial de reinicialización

Cuando una sesión nueva de la CLI se inicializa a partir de una transcripción anterior de OpenClaw (por ejemplo, después de un reintento por `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización crezcan descontroladamente. El valor predeterminado es de 12 288 caracteres (unos 3 000 tokens).

En cambio, los backends de la CLI de Claude ajustan este límite según la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes reciben una porción mayor del historial anterior, hasta alcanzar un límite máximo fijo; los demás backends de CLI mantienen el valor predeterminado conservador. Este límite solo controla el bloque de historial anterior del prompt de reinicialización; los límites de salida de la sesión activa se ajustan por separado en `reliability.outputLimits` (consulte [Sesiones](#sessions)).

## Limitaciones

- Sin llamadas directas a herramientas de OpenClaw: OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven las herramientas del Gateway cuando habilitan `bundleMcp: true`.
- La transmisión depende del backend: algunos backends transmiten JSONL, mientras que otros almacenan la salida hasta finalizar.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma                     | Solución                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| No se encuentra la CLI      | Establezca `command` en una ruta completa.                                  |
| Nombre de modelo incorrecto | Use `modelAliases` para asignar `provider/model` al identificador de modelo de la CLI. |
| Sin continuidad de sesión   | Asegúrese de que `sessionArg` esté definido y que `sessionMode` no sea `none`. |
| Imágenes ignoradas          | Establezca `imageArg` y verifique que la CLI admita rutas de archivos.       |

## Contenido relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
