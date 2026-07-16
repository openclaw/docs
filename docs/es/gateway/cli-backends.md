---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Se están ejecutando CLI de IA locales y se desea reutilizarlas
    - Quieres comprender el puente de bucle invertido MCP para acceder a las herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa de CLI de IA local con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-16T11:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de solo texto cuando los proveedores de API no están disponibles, tienen limitaciones de frecuencia o funcionan incorrectamente. Este mecanismo es intencionadamente conservador:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del Gateway mediante un puente MCP de bucle invertido.
- Transmisión JSONL para las CLI que la admiten.
- Se admiten sesiones, por lo que los turnos posteriores mantienen la coherencia.
- Las imágenes se transfieren si la CLI acepta rutas de imágenes.

Se debe usar como red de seguridad para obtener respuestas de texto que «siempre funcionen», no como ruta principal. Para un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas persistentes de programación, se deben usar en su lugar los [agentes ACP](/es/tools/acp-agents); los backends de CLI no son ACP.

<Tip>
  ¿Se está creando un nuevo plugin de backend? Consulte [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página explica cómo configurar y operar un backend ya registrado.
</Tip>

## Inicio rápido

El plugin de Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin ninguna configuración adicional, siempre que Claude Code esté instalado y se haya iniciado sesión:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el identificador de agente predeterminado cuando no se configura una lista explícita de agentes; de lo contrario, sustitúyalo por el identificador del agente correspondiente.

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

Si se usa un backend de CLI incluido como proveedor principal de mensajes en un host del Gateway, OpenClaw carga automáticamente el plugin incluido propietario cuando la configuración hace referencia a ese backend en una referencia de modelo o bajo `agents.defaults.cliBackends`.

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

Si se usa `agents.defaults.models` como lista de permitidos, incluya también allí los modelos del backend de CLI. Cuando falla el proveedor principal (autenticación, límites de frecuencia o tiempos de espera agotados), OpenClaw prueba a continuación el backend de CLI.

## Configuración

Todos los backends de CLI se encuentran bajo `agents.defaults.cliBackends`, indexados por el identificador del proveedor (por ejemplo, `claude-cli` y `my-cli`). El identificador del proveedor se convierte en el lado izquierdo de la referencia del modelo: `<provider>/<model>`.

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
          // Indicador dedicado para el archivo de instrucciones:
          // systemPromptFileArg: "--system-file",
          // O bien, indicador de sustitución de configuración al estilo de Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Active esta opción únicamente si este backend puede reinicializar
          // sesiones invalidadas a partir del historial sin procesar y acotado
          // de la transcripción de OpenClaw antes de la compactación.
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
2. Crea una instrucción del sistema con la misma instrucción de OpenClaw y el contexto del espacio de trabajo.
3. Ejecuta la CLI con un identificador de sesión (si se admite) para mantener la coherencia del historial. El backend `claude-cli` incluido mantiene activo un proceso stdio de Claude por cada sesión de OpenClaw y envía los turnos posteriores mediante la entrada estándar stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Conserva los identificadores de sesión de cada backend para que los turnos posteriores reutilicen la misma sesión de la CLI.

### Particularidades de Claude CLI

El backend `claude-cli` incluido da prioridad al mecanismo nativo de resolución de Skills de Claude Code. Cuando la instantánea actual de Skills contiene al menos una Skill seleccionada con una ruta materializada, OpenClaw pasa un plugin temporal de Claude Code mediante `--plugin-dir` y omite el catálogo duplicado de Skills de OpenClaw en la instrucción del sistema añadida. Sin una Skill de plugin materializada, OpenClaw conserva el catálogo en la instrucción como alternativa. Las sustituciones de variables de entorno o claves de API de las Skills se siguen aplicando al entorno del proceso secundario durante la ejecución.

Claude CLI tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir una configuración específica de Claude. Para las sesiones activas de Claude administradas por OpenClaw, la política de ejecución efectiva es vinculante: YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`) normalmente inicia Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo inicia con `--permission-mode default`. Los Gateways ejecutados como usuario raíz también usan `default` porque Claude Code rechaza el modo de omisión para el usuario raíz; OpenClaw sigue respondiendo a las solicitudes de control de herramientas mediante stdio de Claude conforme a la política de ejecución configurada. La configuración `agents.list[].tools.exec` de cada agente sustituye a la configuración global `tools.exec` para ese agente. Los argumentos sin procesar del backend aún pueden incluir `--permission-mode`, pero los inicios de Claude en vivo normalizan ese indicador para ajustarlo a la política efectiva y a la restricción del host.

El backend también asigna los niveles `/think` de OpenClaw al indicador nativo `--effort` de Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, mientras que `high`/`xhigh`/`max` se transfieren directamente. Esto mantiene los mismos niveles de esfuerzo admitidos de Fable 5 para las rutas de Claude CLI respaldadas por suscripción y para las rutas con clave de API. `adaptive` elimina los indicadores `--effort` configurados y no proporciona ningún sustituto, por lo que Claude Code determina el esfuerzo efectivo a partir de su propio entorno, configuración y valores predeterminados del modelo. Los demás backends de CLI necesitan que su plugin propietario declare un asignador de argumentos equivalente antes de que `/think` afecte a la CLI iniciada.

Antes de que OpenClaw pueda usar `claude-cli`, se debe haber iniciado sesión en el propio Claude Code en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones con Docker necesitan que Claude Code esté instalado y tenga una sesión iniciada dentro del directorio personal persistente del contenedor, no solo en el host; consulte [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).

Establezca `agents.defaults.cliBackends.claude-cli.command` únicamente cuando el binario `claude` aún no esté en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establezca `sessionArg` (por ejemplo, `--session-id`) o `sessionArgs` (marcador de posición `{sessionId}`) cuando el identificador deba incluirse en varios indicadores.
- Si la CLI usa un subcomando de reanudación con indicadores diferentes, establezca `resumeArgs` (sustituye a `args` al reanudar) y, opcionalmente, `resumeOutput` para reanudaciones que no usen JSON.
- `sessionMode`:
  - `always`: siempre envía un identificador de sesión (un UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un identificador de sesión si ya había uno almacenado.
  - `none`: nunca envía un identificador de sesión.
- `claude-cli` usa de manera predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` y `input: "stdin"`, de modo que los turnos posteriores reutilizan el proceso activo de Claude mientras siga en ejecución, incluso en configuraciones personalizadas que omitan los campos de transporte. Si el Gateway se reinicia o finaliza el proceso inactivo, OpenClaw reanuda la sesión a partir del identificador almacenado de Claude. Antes de reanudar, los identificadores de sesión almacenados se verifican con una transcripción legible del proyecto; si falta la transcripción, se borra la vinculación (registrado como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva bajo `--resume`.
- Las sesiones activas de Claude mantienen límites acotados para la salida JSONL: de forma predeterminada, 8 MiB y 20,000 líneas JSONL sin procesar por turno. Estos límites se pueden aumentar para cada backend mediante `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` y `maxTurnLines`; OpenClaw limita esos valores a 64 MiB y 100,000 líneas.
- Las sesiones de CLI almacenadas representan una continuidad propiedad del proveedor. El restablecimiento diario implícito de la sesión no las interrumpe; las políticas `/reset` y las políticas explícitas `session.reset` sí lo hacen.
- Normalmente, las sesiones nuevas de CLI solo se reinicializan a partir del resumen de Compaction de OpenClaw y la parte posterior a la Compaction. Para recuperar sesiones cortas invalidadas antes de la Compaction, un backend puede activar `reseedFromRawTranscriptWhenUncompacted: true`. La reinicialización mediante la transcripción sin procesar permanece acotada y limitada a invalidaciones seguras, como la ausencia de una transcripción de la CLI, una parte final huérfana del uso de herramientas, cambios en la política de mensajes, la instrucción del sistema, el directorio de trabajo o MCP, o un reintento tras caducar la sesión; los cambios de perfil de autenticación o de época de credenciales nunca reinicializan el historial sin procesar de la transcripción.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones de una misma vía (la mayoría de las CLI serializan en una sola vía del proveedor). OpenClaw también descarta la reutilización de la sesión almacenada de la CLI cuando cambia la identidad de autenticación seleccionada, incluidos los cambios en el identificador del perfil de autenticación, la clave de API estática, el token estático o la identidad de la cuenta OAuth cuando la CLI expone una; la rotación de los tokens de acceso o actualización de OAuth por sí sola no interrumpe la sesión. Si una CLI no tiene un identificador estable de cuenta OAuth, OpenClaw permite que esa CLI aplique sus propios permisos de reanudación.

## Preámbulo de alternativa de sesiones de claude-cli

Cuando un intento `claude-cli` pasa a un candidato que no es de CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicializa el siguiente intento con un preámbulo de contexto obtenido de la transcripción JSONL local de Claude Code (bajo `~/.claude/projects/`, indexada por espacio de trabajo). Sin esta inicialización, el proveedor alternativo comienza sin contexto, ya que la propia transcripción de sesión de OpenClaw está vacía para las ejecuciones `claude-cli`.

- El preámbulo da prioridad al resumen `/compact` o al marcador `compact_boundary` más reciente y, a continuación, añade los turnos posteriores al límite más recientes hasta alcanzar un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se combinan en indicaciones compactas `(tool call: name)` y `(tool result: …)` para respetar el presupuesto de la instrucción; los resúmenes demasiado grandes se truncan y se etiquetan como `(truncated)`.
- Las alternativas del mismo proveedor de `claude-cli` a `claude-cli` dependen del propio `--resume` de Claude y omiten el preámbulo.
- La inicialización reutiliza la validación existente de la ruta del archivo de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Si la CLI acepta rutas de imágenes, establezca `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe las imágenes base64 en archivos temporales. Si se establece `imageArg`, esas rutas se pasan como argumentos de la CLI; de lo contrario, OpenClaw añade las rutas de archivo a la instrucción (inyección de rutas), lo que funciona con las CLI que cargan automáticamente archivos locales a partir de rutas sin formato.

## Entradas y salidas

- `output: "text"` (valor predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer el texto junto con un identificador de sesión.
- `output: "jsonl"` analiza un flujo JSONL y extrae el mensaje final del agente junto con los identificadores de sesión cuando están presentes.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y el uso de `stats` cuando `usage` falta o está vacío. El valor predeterminado de Gemini CLI incluido usa `stream-json`; las sustituciones antiguas `--output-format json` siguen usando el analizador JSON.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como último argumento de la CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y se establece `maxPromptArgChars`, se utiliza stdin en su lugar.

## Valores predeterminados propiedad del Plugin

Los valores predeterminados del backend de la CLI forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelos.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue prevaleciendo sobre el valor predeterminado del Plugin.
- La limpieza de la configuración específica del backend sigue siendo propiedad del Plugin mediante el hook opcional `normalizeConfig`.

Anthropic es propietario de `claude-cli` y Google es propietario de `google-gemini-cli`. Las ejecuciones del agente OpenAI Codex utilizan el arnés del servidor de aplicaciones de Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

El Plugin de Anthropic incluido registra para `claude-cli`:

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

El Plugin de Google incluido registra para `google-gemini-cli`:

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

- El analizador `stream-json` predeterminado lee los eventos `message` del asistente, los eventos de herramientas, el uso final de `result` y los eventos de errores fatales de Gemini.
- Si se reemplazan los argumentos de Gemini por `--output-format json`, OpenClaw normaliza de nuevo ese backend a `output: "json"` y lee el texto de respuesta del campo `response` del JSON.
- El uso recurre a `stats` cuando `usage` está ausente o vacío; `stats.cached` se normaliza como `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se derivan de `stats.input_tokens - stats.cached`.

Reemplace los valores predeterminados solo si es necesario (lo más habitual es una ruta absoluta para `command`).

## Capas de transformación de texto

Los Plugins que necesitan pequeñas adaptaciones de compatibilidad para prompts o mensajes pueden declarar transformaciones de texto bidireccionales sin reemplazar un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output` reescribe el texto del asistente transmitido y el texto final analizado antes de que OpenClaw procese sus propios marcadores de control y la entrega al canal; para las llamadas a modelos respaldadas por proveedores, también restaura los valores de cadena dentro de los argumentos estructurados de llamadas a herramientas después de reparar la transmisión y antes de ejecutar la herramienta. Los fragmentos JSON sin procesar del proveedor no se modifican; los consumidores deben utilizar la carga útil estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, establezca `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para transmisiones compatibles con Claude Code y `gemini-stream-json` para eventos `stream-json` de la CLI de Gemini.

## Propiedad de la Compaction nativa

Algunos backends de CLI ejecutan un agente que realiza la Compaction de su propia transcripción, por lo que OpenClaw no debe ejecutar su resumidor de protección sobre ellos; hacerlo entra en conflicto con la Compaction propia del backend y puede provocar un fallo irrecuperable del turno.

`claude-cli` no tiene un endpoint de arnés (Claude Code realiza la Compaction internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. OpenClaw pasa el presupuesto de contexto efectivo de la ejecución mediante la variable documentada de Claude Code [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars), lo que mantiene la Compaction automática nativa alineada con los límites de `contextTokens` configurados para Anthropic. En cambio, las sesiones con arnés nativo, como Codex, siguen dirigiéndose al endpoint de Compaction de su arnés.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` únicamente para un backend que sea realmente propietario de la Compaction: debe limitar de manera fiable su propia transcripción cerca de la ventana de contexto y conservar una sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión aplazada puede permanecer por encima del presupuesto.

## Capas de MCP incluidas

Los backends de CLI no reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede optar por una capa de configuración de MCP generada mediante `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración estricta de MCP generado.
- `google-gemini-cli`: archivo de ajustes del sistema de Gemini generado.

Cuando el MCP incluido está habilitado, OpenClaw:

- inicia un servidor HTTP MCP de bucle invertido que expone las herramientas del Gateway al proceso de la CLI, autenticado con una concesión de contexto por ejecución (`OPENCLAW_MCP_TOKEN`) activa únicamente durante el intento de ejecución actual;
- vincula el acceso a las herramientas con el contexto de sesión, cuenta y canal seleccionado por el Gateway, en lugar de confiar en los encabezados del proceso secundario;
- carga los servidores MCP incluidos habilitados para el espacio de trabajo actual y los combina con cualquier configuración o estructura de ajustes MCP existente del backend;
- reescribe la configuración de inicio mediante el modo de integración propiedad del Plugin correspondiente.

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un backend opta por el MCP incluido, para que las ejecuciones en segundo plano permanezcan aisladas.

Los entornos de ejecución MCP incluidos y con ámbito de sesión se almacenan en caché para reutilizarlos dentro de una sesión y, después, se eliminan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (10 minutos de forma predeterminada; establezca `0` para deshabilitarlo). Las ejecuciones integradas de una sola vez, como las comprobaciones de autenticación, la generación de slugs y la recuperación de Active Memory, solicitan la limpieza al finalizar la ejecución para que los procesos secundarios de stdio y las transmisiones HTTP/SSE transmitibles no sobrevivan a la ejecución.

## Límite del historial de reinicialización

Cuando se inicializa una sesión nueva de CLI a partir de una transcripción anterior de OpenClaw (por ejemplo, después de un reintento de `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización crezcan desmesuradamente. El valor predeterminado es de 12,288 caracteres (aproximadamente 3,000 tokens).

En su lugar, los backends de la CLI de Claude ajustan este límite según la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes reciben una porción mayor del historial anterior, hasta un límite máximo fijo; los demás backends de CLI mantienen el valor predeterminado conservador. Este límite solo controla el bloque de historial anterior del prompt de reinicialización; los límites de salida de la sesión activa se ajustan por separado en `reliability.outputLimits` (consulte [Sesiones](#sessions)).

## Limitaciones

- Sin llamadas directas a herramientas de OpenClaw: OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven las herramientas del Gateway cuando optan por `bundleMcp: true`.
- La transmisión depende del backend: algunos backends transmiten JSONL, mientras que otros almacenan la salida hasta que finalizan.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma               | Solución                                                               |
| --------------------- | ----------------------------------------------------------------- |
| No se encuentra la CLI | Establezca `command` en una ruta completa.                                     |
| Nombre de modelo incorrecto | Utilice `modelAliases` para asignar `provider/model` al identificador de modelo de la CLI. |
| Sin continuidad de sesión | Asegúrese de que `sessionArg` esté establecido y que `sessionMode` no sea `none`.       |
| Imágenes ignoradas        | Establezca `imageArg` y verifique que la CLI admita rutas de archivos.            |

## Contenido relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
