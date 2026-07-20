---
read_when:
    - Se necesita una alternativa fiable cuando fallan los proveedores de API
    - Ejecutas CLI de IA locales y quieres reutilizarlas
    - Quiere comprender el puente de bucle invertido MCP para el acceso a herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa de CLI de IA local con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-20T00:47:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d71300fa7383b021ee12bdeafedfc48cb9f0d7746a02efff5e609544c7b4b081
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de solo texto cuando los proveedores de API no están disponibles, tienen límites de frecuencia o presentan un comportamiento incorrecto. Es intencionadamente conservador:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del Gateway mediante un puente MCP de bucle invertido.
- Transmisión JSONL para las CLI que la admiten.
- Se admiten sesiones, por lo que los turnos posteriores mantienen la coherencia.
- Las imágenes se transfieren si la CLI acepta rutas de imágenes.

Debe usarse como red de seguridad para respuestas de texto que «siempre funcionan», no como ruta principal. Para un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas persistentes de programación, use [Agentes ACP](/es/tools/acp-agents); los backends de CLI no son ACP.

<Tip>
  ¿Está creando un nuevo plugin de backend? Consulte [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página explica cómo configurar y utilizar un backend ya registrado.
</Tip>

## Inicio rápido

El plugin de Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin configuración adicional si Claude Code está instalado y se ha iniciado sesión:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el identificador predeterminado del agente cuando no se configura una lista explícita de agentes; en caso contrario, sustitúyalo por el identificador de su agente.

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

Si utiliza un backend de CLI incluido como proveedor principal de mensajes en un host del Gateway, OpenClaw carga automáticamente el plugin incluido propietario cuando la configuración hace referencia a ese backend en una referencia de modelo o en `agents.defaults.cliBackends`.

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

Las alternativas configuradas siguen siendo aptas cuando falla el proveedor principal (autenticación, límites de frecuencia, tiempos de espera), aunque no estén en `agents.defaults.modelPolicy.allow`. Añada un modelo de backend de CLI a esa política únicamente cuando los usuarios también deban poder seleccionarlo directamente mediante `/model`, una sobrescritura de sesión o `--model`. `agents.defaults.models` solo controla los alias, parámetros y metadatos de cada modelo.

## Configuración

Todos los backends de CLI se encuentran en `agents.defaults.cliBackends`, identificados por el id. del proveedor (por ejemplo, `claude-cli`, `my-cli`). El id. del proveedor se convierte en el lado izquierdo de la referencia del modelo: `<provider>/<model>`.

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
          // Marca específica para el archivo del prompt:
          // systemPromptFileArg: "--system-file",
          // En su lugar, marca de sobrescritura de configuración al estilo de Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Active esta opción únicamente si este backend puede reinicializar sesiones invalidadas
          // a partir del historial sin procesar y acotado de la transcripción de OpenClaw antes de Compaction.
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
2. Genera un prompt del sistema usando el mismo prompt y contexto del espacio de trabajo de OpenClaw.
3. Ejecuta la CLI con un id. de sesión (si se admite) para mantener la coherencia del historial. El backend `claude-cli` incluido mantiene activo un proceso stdio de Claude por cada sesión de OpenClaw y envía los turnos posteriores mediante la entrada estándar stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Conserva los id. de sesión de cada backend para que los turnos posteriores reutilicen la misma sesión de CLI.

## Tiempos de espera y trabajos de larga duración

Los backends de CLI tienen dos límites independientes:

- `agents.defaults.timeoutSeconds` limita todo el turno del agente. Los turnos normales del Gateway heredan el valor predeterminado de 48 horas; `0` hace que el presupuesto del turno sea ilimitado. Una sobrescritura almacenada, como `600`, sustituye ese valor predeterminado.
- El supervisor de ausencia de salida de la CLI detiene un subproceso que permanece en silencio. Utiliza perfiles independientes para ejecuciones nuevas y reanudadas en `agents.defaults.cliBackends.<id>.reliability.watchdog`, y permanece activo aunque el presupuesto total del turno sea ilimitado.

Elimine una sobrescritura breve del tiempo de espera total para volver al valor predeterminado de 48 horas, o establezca un presupuesto explícito, como 12 horas:

```bash
# Volver al valor predeterminado de 48 horas:
openclaw config unset agents.defaults.timeoutSeconds

# O elegir un límite explícito de 12 horas:
openclaw config set agents.defaults.timeoutSeconds 43200
```

El trabajo en segundo plano iniciado dentro de una CLI sigue formando parte del subproceso de esa CLI. Si el turno principal alcanza su límite total, OpenClaw detiene tanto el subproceso como sus tareas internas de CLI en segundo plano. Para trabajos duraderos de larga duración, use un [subagente](/es/tools/subagents) desacoplado o un [agente ACP](/es/tools/acp-agents); los subagentes desacoplados no tienen tiempo de espera de ejecución de forma predeterminada.

El comando `openclaw agent` también tiene su propio plazo de solicitud. Su valor alternativo predeterminado de 600 segundos se aplica a esa invocación del comando, no a los turnos normales del Gateway; consulte [`openclaw agent`](/es/cli/agent).

### Particularidades de Claude CLI

El backend `claude-cli` incluido da preferencia al solucionador nativo de habilidades de Claude Code. Cuando la instantánea actual de habilidades tiene al menos una habilidad seleccionada con una ruta materializada, OpenClaw pasa un plugin temporal de Claude Code mediante `--plugin-dir` y omite el catálogo duplicado de habilidades de OpenClaw en el prompt del sistema añadido. Sin una habilidad de plugin materializada, OpenClaw conserva el catálogo del prompt como alternativa. Las sobrescrituras del entorno o de la clave de API de las habilidades siguen aplicándose al entorno del proceso secundario durante la ejecución.

Claude CLI tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir una configuración específica de Claude. Para las sesiones activas de Claude administradas por OpenClaw, la política de ejecución efectiva es la autoridad: YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`) normalmente inicia Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo inicia con `--permission-mode default`. Los gateways ejecutados como usuario raíz también usan `default` porque Claude Code rechaza el modo de omisión para dicho usuario; OpenClaw sigue respondiendo a las solicitudes de control de herramientas mediante stdio de Claude según la política de ejecución configurada. La configuración `agents.list[].tools.exec` de cada agente sobrescribe `tools.exec` global para ese agente. Los argumentos sin procesar del backend aún pueden incluir `--permission-mode`, pero los inicios activos de Claude normalizan esa marca para que coincida con la política efectiva y la restricción del host.

El backend también asigna los niveles `/think` de OpenClaw a la marca nativa `--effort` de Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, y `high`/`xhigh`/`max` se transfieren directamente. Esto mantiene los mismos niveles de esfuerzo de Fable 5 compatibles para Claude CLI con suscripción y las rutas con clave de API. `adaptive` elimina las marcas `--effort` configuradas y no proporciona ninguna sustitución, por lo que Claude Code determina el esfuerzo efectivo a partir de su propio entorno, configuración y valores predeterminados del modelo. Los demás backends de CLI requieren que su plugin propietario declare un asignador de argv equivalente antes de que `/think` afecte a la CLI iniciada.

Antes de que OpenClaw pueda usar `claude-cli`, se debe haber iniciado sesión en el propio Claude Code en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

En las instalaciones con Docker, Claude Code debe estar instalado y con la sesión iniciada dentro del directorio principal persistente del contenedor, no solo en el host; consulte [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).

Establezca `agents.defaults.cliBackends.claude-cli.command` únicamente cuando el binario `claude` no se encuentre ya en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establezca `sessionArg` (por ejemplo, `--session-id`) o `sessionArgs` (marcador de posición `{sessionId}`) cuando el id. deba incluirse en varias marcas.
- Si la CLI utiliza un subcomando de reanudación con marcas diferentes, establezca `resumeArgs` (sustituye a `args` durante la reanudación) y, opcionalmente, `resumeOutput` para reanudaciones que no usen JSON.
- `sessionMode`:
  - `always`: envía siempre un id. de sesión (un UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un id. de sesión si ya se había almacenado uno.
  - `none`: nunca envía un id. de sesión.
- `claude-cli` utiliza de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` y `input: "stdin"`, por lo que los turnos posteriores reutilizan el proceso activo de Claude mientras permanece en ejecución, incluso en configuraciones personalizadas que omitan los campos de transporte. Si el Gateway se reinicia o el proceso inactivo termina, OpenClaw reanuda la sesión a partir del id. de sesión de Claude almacenado. Antes de reanudar, los id. de sesión almacenados se verifican con una transcripción legible del proyecto; si falta la transcripción, se elimina la vinculación (se registra como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva en `--resume`.
- Las sesiones activas de Claude mantienen límites acotados para la salida JSONL: 8 MiB y 20,000 líneas JSONL sin procesar por turno.
- Las sesiones de CLI almacenadas son una continuidad propiedad del proveedor. El restablecimiento automático está desactivado de forma predeterminada; `/reset` y las políticas explícitas diarias o por inactividad `session.reset` siguen interrumpiéndolas.
- Las sesiones nuevas de CLI normalmente se reinicializan únicamente a partir del resumen de Compaction de OpenClaw y la parte posterior a Compaction. Para recuperar sesiones breves invalidadas antes de Compaction, un backend puede habilitar `reseedFromRawTranscriptWhenUncompacted: true`. La reinicialización a partir de la transcripción sin procesar permanece acotada y limitada a invalidaciones seguras, como una transcripción de CLI ausente, una parte final huérfana de uso de herramientas, cambios en la política de mensajes, el prompt del sistema, el directorio de trabajo o MCP, o un reintento por sesión caducada; los cambios de perfil de autenticación o de época de credenciales nunca reinicializan el historial sin procesar de la transcripción.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones del mismo canal (la mayoría de las CLI se serializan en un canal del proveedor). OpenClaw también deja de reutilizar la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada, incluido un cambio en el id. del perfil de autenticación, la clave de API estática, el token estático o la identidad de la cuenta OAuth cuando la CLI expone una; la rotación de los tokens de acceso o actualización de OAuth por sí sola no interrumpe la sesión. Si una CLI no tiene un id. estable de cuenta OAuth, OpenClaw permite que esa CLI aplique sus propios permisos de reanudación.

## Preámbulo de alternativa procedente de sesiones de claude-cli

Cuando un intento de `claude-cli` pasa a un candidato que no es de CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicializa el siguiente intento con un preámbulo de contexto obtenido de la transcripción JSONL local de Claude Code (en `~/.claude/projects/`, identificada por espacio de trabajo). Sin esta inicialización, el proveedor alternativo comienza sin contexto, ya que la propia transcripción de sesión de OpenClaw está vacía para las ejecuciones de `claude-cli`.

- El preámbulo prefiere el resumen más reciente de `/compact` o el marcador `compact_boundary`, y luego añade los turnos posteriores al límite más recientes hasta alcanzar un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se agrupan en indicaciones compactas de `(tool call: name)` y `(tool result: …)` para respetar el presupuesto del prompt; los resúmenes demasiado grandes se truncan y se etiquetan como `(truncated)`.
- Los fallbacks del mismo proveedor de `claude-cli` a `claude-cli` dependen del propio `--resume` de Claude y omiten el preámbulo.
- La inicialización reutiliza la validación existente de la ruta del archivo de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Si la CLI acepta rutas de imágenes, configure `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe las imágenes en base64 en archivos temporales. Si se establece `imageArg`, esas rutas se pasan como argumentos de la CLI; de lo contrario, OpenClaw añade las rutas de los archivos al prompt (inyección de rutas), lo que funciona con las CLI que cargan automáticamente archivos locales a partir de rutas de texto sin formato.

## Entradas y salidas

- `output: "text"` (valor predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer el texto junto con un identificador de sesión.
- `output: "jsonl"` analiza un flujo JSONL y extrae el mensaje final del agente junto con los identificadores de sesión cuando están presentes.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y el uso de `stats` cuando `usage` no existe o está vacío. El valor predeterminado de Gemini CLI incluido usa `stream-json`; las sustituciones antiguas de `--output-format json` siguen usando el analizador JSON.

Modos de entrada:

- `input: "arg"` (valor predeterminado) pasa el prompt como último argumento de la CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y se establece `maxPromptArgChars`, se usa stdin en su lugar.

## Valores predeterminados propiedad del plugin

Los valores predeterminados del backend de la CLI forman parte de la superficie del plugin:

- Los plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelos.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue sustituyendo el valor predeterminado del plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del plugin mediante el hook opcional `normalizeConfig`.

Anthropic es propietario de `claude-cli` y Google es propietario de `google-gemini-cli`. Las ejecuciones del agente OpenAI Codex usan el arnés del servidor de aplicaciones de Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

El plugin de Anthropic incluido se registra para `claude-cli`:

| Clave                   | Valor                                                                                                                                                                                                         |
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

El plugin de Google incluido se registra para `google-gemini-cli`:

| Clave                       | Valor                                                                                  |
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

Requisito previo: la Gemini CLI local debe estar instalada y disponible en `PATH` como `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas sobre la salida de Gemini CLI:

- El analizador predeterminado `stream-json` lee eventos `message` del asistente, eventos de herramientas, el uso final de `result` y eventos de error fatal de Gemini.
- Si se sustituyen los argumentos de Gemini por `--output-format json`, OpenClaw vuelve a normalizar ese backend a `output: "json"` y lee el texto de respuesta del campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío; `stats.cached` se normaliza en `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se derivan de `stats.input_tokens - stats.cached`.

Sustituya los valores predeterminados solo cuando sea necesario (por lo general, una ruta absoluta de `command`).

## Capas de transformación de texto

Los plugins que necesiten pequeñas capas de compatibilidad para prompts o mensajes pueden declarar transformaciones de texto bidireccionales sin sustituir un proveedor ni un backend de la CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output` reescribe el texto transmitido del asistente y el texto final analizado antes de que OpenClaw procese sus propios marcadores de control y la entrega al canal; para las llamadas a modelos respaldadas por proveedores, también restaura los valores de cadena dentro de los argumentos estructurados de llamadas a herramientas después de reparar el flujo y antes de ejecutar la herramienta. Los fragmentos JSON sin procesar del proveedor no se modifican; los consumidores deben usar la carga útil estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, establezca `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para flujos compatibles con Claude Code y `gemini-stream-json` para eventos `stream-json` de Gemini CLI.

## Propiedad de la Compaction nativa

Algunos backends de la CLI ejecutan un agente que compacta su propia transcripción, por lo que OpenClaw no debe ejecutar contra ellos su resumidor de protección, ya que hacerlo interfiere con la propia Compaction del backend y puede provocar un fallo irrecuperable del turno.

`claude-cli` no tiene un endpoint del arnés (Claude Code realiza la Compaction internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. OpenClaw pasa el presupuesto de contexto efectivo de la ejecución mediante la variable documentada [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) de Claude Code, lo que mantiene la Compaction automática nativa alineada con los límites configurados de `contextTokens` de Anthropic. Las sesiones con arnés nativo, como Codex, siguen dirigiéndose al endpoint de Compaction de su arnés.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` únicamente para un backend que sea realmente propietario de la Compaction: debe limitar de forma fiable su propia transcripción cerca de la ventana de contexto y conservar una sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión diferida puede seguir superando el presupuesto.

## Capas de MCP del paquete

Los backends de la CLI no reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede optar por una capa de configuración MCP generada con `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado.
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado.

Cuando se habilita el MCP del paquete, OpenClaw:

- inicia un servidor MCP HTTP de bucle invertido que expone las herramientas del Gateway al proceso de la CLI, autenticado con una concesión de contexto por ejecución (`OPENCLAW_MCP_TOKEN`) activa únicamente durante el intento de ejecución actual;
- vincula el acceso a las herramientas con la sesión, la cuenta y el contexto del canal seleccionados por el Gateway, en lugar de confiar en los encabezados del proceso secundario;
- carga los servidores MCP del paquete habilitados para el espacio de trabajo actual y los combina con cualquier configuración o estructura de ajustes MCP existente del backend;
- reescribe la configuración de inicio mediante el modo de integración propiedad del backend definido por el plugin propietario.

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un backend opta por el MCP del paquete, para que las ejecuciones en segundo plano permanezcan aisladas.

Los entornos de ejecución MCP incluidos y limitados a una sesión se almacenan en caché para reutilizarlos dentro de esa sesión y se eliminan después de 10 minutos de inactividad. Las ejecuciones integradas de una sola vez, como las comprobaciones de autenticación, la generación de slugs y la recuperación de Active Memory, solicitan la limpieza al finalizar la ejecución para que los procesos secundarios de stdio y los flujos HTTP/SSE transmitibles no sobrevivan a la ejecución.

## Límite del historial de reinicialización

Cuando una nueva sesión de CLI se inicializa a partir de una transcripción anterior de OpenClaw (por ejemplo, después de un reintento de `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización crezcan descontroladamente. El valor predeterminado es de 12,288 caracteres (unos 3,000 tokens).

En cambio, los backends de la CLI de Claude ajustan este límite según la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes reciben una porción mayor del historial anterior, hasta un límite máximo fijo; los demás backends de CLI mantienen el valor predeterminado conservador. Este límite solo controla el bloque de historial anterior del prompt de reinicialización.

## Limitaciones

- Sin llamadas directas a herramientas de OpenClaw: OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven las herramientas del Gateway cuando habilitan `bundleMcp: true`.
- El streaming es específico de cada backend: algunos backends transmiten JSONL, mientras que otros almacenan en búfer hasta finalizar.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma                    | Solución                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------- |
| No se encuentra la CLI     | Establezca `command` en una ruta completa.                                 |
| Nombre de modelo incorrecto | Use `modelAliases` para asignar `provider/model` al id. de modelo de la CLI. |
| Sin continuidad de sesión  | Asegúrese de que `sessionArg` esté establecido y de que `sessionMode` no sea `none`. |
| Se ignoran las imágenes    | Establezca `imageArg` y compruebe que la CLI admita rutas de archivos.       |

## Contenido relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
