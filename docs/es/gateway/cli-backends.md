---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Estás ejecutando CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente local loopback de MCP para el acceso a herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa de CLI de IA local con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-05T11:17:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3fb55bcb6e6e5aeb1176dea1ce81df394940841f324b5c93ce8a807b134945
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de solo texto cuando los proveedores de API están caídos, limitados por cuota o funcionando mal. Es deliberadamente conservadora:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del gateway mediante un puente MCP de loopback.
- Streaming JSONL para las CLI que lo admiten.
- Se admiten sesiones, por lo que los turnos de seguimiento se mantienen coherentes.
- Las imágenes pasan si la CLI acepta rutas de imágenes.

Úsala como red de seguridad para respuestas de texto que "siempre funcionan", no como ruta principal. Para un runtime de arnés completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas de programación persistentes, usa [Agentes ACP](/es/tools/acp-agents) en su lugar; los backends de CLI no son ACP.

<Tip>
  ¿Estás creando un nuevo Plugin de backend? Consulta [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página cubre la configuración y operación de un backend ya registrado.
</Tip>

## Inicio rápido

El Plugin Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin configuración adicional más allá de tener Claude Code instalado y con sesión iniciada:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el id de agente predeterminado cuando no se configura una lista explícita de agentes; en caso contrario, sustitúyelo por tu propio id de agente.

Si el gateway se ejecuta bajo launchd/systemd con un `PATH` mínimo, apunta explícitamente al binario:

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

Si usas un backend de CLI incluido como proveedor principal de mensajes en un host de gateway, OpenClaw carga automáticamente el Plugin incluido propietario cuando tu configuración referencia ese backend en una referencia de modelo o bajo `agents.defaults.cliBackends`.

## Uso como alternativa

Añade el backend de CLI a tu lista de alternativas para que solo se ejecute cuando fallen los modelos principales:

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

Si usas `agents.defaults.models` como lista de permitidos, incluye también ahí tus modelos de backend de CLI. Cuando falla el proveedor principal (autenticación, límites de cuota, tiempos de espera), OpenClaw prueba después el backend de CLI.

## Configuración

Todos los backends de CLI viven bajo `agents.defaults.cliBackends`, indexados por id de proveedor (p. ej., `claude-cli`, `my-cli`). El id de proveedor se convierte en el lado izquierdo de la referencia de modelo: `<provider>/<model>`.

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
          // Dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style config-override flag instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed invalidated sessions from
          // bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cómo funciona

1. Selecciona un backend por prefijo de proveedor (`claude-cli/...`).
2. Construye un prompt de sistema usando el mismo prompt de OpenClaw y el contexto del espacio de trabajo.
3. Ejecuta la CLI con un id de sesión (si se admite) para que el historial se mantenga consistente. El backend `claude-cli` incluido mantiene vivo un proceso stdio de Claude por sesión de OpenClaw y envía los turnos de seguimiento por stdin stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Persiste los ids de sesión por backend para que los seguimientos reutilicen la misma sesión de CLI.

### Detalles específicos de Claude CLI

El backend `claude-cli` incluido prefiere el resolvedor nativo de Skills de Claude Code. Cuando la instantánea actual de Skills tiene al menos una skill seleccionada con una ruta materializada, OpenClaw pasa un Plugin temporal de Claude Code mediante `--plugin-dir` y omite el catálogo duplicado de Skills de OpenClaw del prompt de sistema añadido. Sin una skill de Plugin materializada, OpenClaw conserva el catálogo del prompt como alternativa. Las anulaciones de entorno/clave de API de skills siguen aplicándose al entorno del proceso hijo para la ejecución.

Claude CLI tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir configuración específica de Claude. Para sesiones live de Claude gestionadas por OpenClaw, la política de ejecución efectiva es autoritativa: YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`) lanza Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo lanza con `--permission-mode default`. La configuración por agente de `agents.list[].tools.exec` anula el `tools.exec` global para ese agente. Los argumentos sin procesar del backend aún pueden incluir `--permission-mode`, pero los lanzamientos live de Claude normalizan esa marca para que coincida con la política efectiva.

El backend también asigna los niveles `/think` de OpenClaw a la marca nativa `--effort` de Claude Code: `minimal`/`low` -> `low`, `adaptive`/`medium` -> `medium`, y `high`/`xhigh`/`max` pasan directamente. Otros backends de CLI necesitan que su Plugin propietario declare un asignador argv equivalente antes de que `/think` afecte a la CLI generada.

Antes de que OpenClaw pueda usar `claude-cli`, Claude Code debe tener sesión iniciada en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones Docker necesitan Claude Code instalado y con sesión iniciada dentro del home persistido del contenedor, no solo en el host; consulta [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).

Define `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude` aún no esté en `PATH`.

## Sesiones

- Si la CLI admite sesiones, define `sessionArg` (p. ej., `--session-id`), o `sessionArgs` (marcador de posición `{sessionId}`) cuando el id deba quedar en varias marcas.
- Si la CLI usa un subcomando de reanudación con marcas diferentes, define `resumeArgs` (reemplaza `args` al reanudar) y opcionalmente `resumeOutput` para reanudaciones no JSON.
- `sessionMode`:
  - `always`: siempre envía un id de sesión (UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un id de sesión si ya había uno almacenado.
  - `none`: nunca envía un id de sesión.
- `claude-cli` usa de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, por lo que los turnos de seguimiento reutilizan el proceso live de Claude mientras está activo, incluso para configuraciones personalizadas que omiten campos de transporte. Si el gateway se reinicia o el proceso inactivo sale, OpenClaw reanuda desde el id de sesión de Claude almacenado. Los ids de sesión almacenados se verifican contra una transcripción de proyecto legible antes de reanudar; una transcripción ausente limpia la vinculación (registrado como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva bajo `--resume`.
- Las sesiones live de Claude mantienen guardas acotadas de salida JSONL: 8 MiB y 20.000 líneas JSONL sin procesar por turno de forma predeterminada. Auméntalas por backend con `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` y `maxTurnLines`; OpenClaw limita esos ajustes a 64 MiB y 100.000 líneas.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El restablecimiento diario implícito de sesión no las corta; `/reset` y las políticas explícitas de `session.reset` sí.
- Las sesiones nuevas de CLI normalmente reseembran solo desde el resumen de Compaction de OpenClaw más la cola posterior a la Compaction. Para recuperar sesiones cortas invalidadas antes de la Compaction, un backend puede optar por hacerlo con `reseedFromRawTranscriptWhenUncompacted: true`. La resiembra desde transcripción sin procesar permanece acotada y limitada a invalidaciones seguras, como una transcripción de CLI ausente, una cola de uso de herramientas huérfana, cambios de política de mensajes/prompt de sistema/cwd/MCP o un reintento por sesión expirada; los cambios de perfil de autenticación o de época de credenciales nunca reseembran historial de transcripción sin procesar.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones del mismo carril (la mayoría de las CLI serializan en un carril de proveedor). OpenClaw también descarta la reutilización de sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada, incluido un id de perfil de autenticación cambiado, una clave de API estática, un token estático o una identidad de cuenta OAuth cuando la CLI expone una; la rotación de tokens OAuth de acceso/actualización por sí sola no corta la sesión. Si una CLI no tiene un id estable de cuenta OAuth, OpenClaw deja que esa CLI aplique sus propios permisos de reanudación.

## Preludio de alternativa desde sesiones claude-cli

Cuando un intento de `claude-cli` conmuta por error a un candidato que no es CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw siembra el siguiente intento con un preludio de contexto recopilado de la transcripción JSONL local de Claude Code (bajo `~/.claude/projects/`, indexada por espacio de trabajo). Sin esta semilla, el proveedor alternativo empieza en frío, ya que la propia transcripción de sesión de OpenClaw está vacía para ejecuciones `claude-cli`.

- El preludio prefiere el resumen `/compact` más reciente o el marcador `compact_boundary`, y luego añade los turnos posteriores al límite más recientes hasta un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se fusionan en indicaciones compactas `(tool call: name)` y `(tool result: …)` para mantener honesto el presupuesto del prompt; un resumen sobredimensionado se trunca y se etiqueta como `(truncated)`.
- Las alternativas del mismo proveedor de `claude-cli` a `claude-cli` dependen del propio `--resume` de Claude y omiten el preludio.
- La semilla reutiliza la validación de ruta de archivo de sesión de Claude existente, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Si tu CLI acepta rutas de imágenes, define `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe imágenes base64 en archivos temporales. Si `imageArg` está definido, esas rutas se pasan como argumentos de CLI; si no, OpenClaw añade las rutas de archivo al prompt (inyección de rutas), lo que funciona para CLI que cargan automáticamente archivos locales desde rutas sin formato.

## Entradas y salidas

- `output: "text"` (predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer texto más un id de sesión.
- `output: "jsonl"` analiza un stream JSONL y extrae el mensaje final del agente más identificadores de sesión cuando están presentes.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y el uso desde `stats` cuando `usage` falta o está vacío. El valor predeterminado incluido de Gemini CLI usa `stream-json`; las anulaciones antiguas de `--output-format json` siguen usando el analizador JSON.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de CLI.
- `input: "stdin"` envía el prompt por stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está definido, se usa stdin en su lugar.

## Valores predeterminados propiedad del Plugin

Los valores predeterminados de backend de CLI forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo de proveedor en las referencias de modelo.
- La configuración de usuario en `agents.defaults.cliBackends.<id>` aún anula el valor predeterminado del Plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del Plugin mediante el hook opcional `normalizeConfig`.

Anthropic es propietario de `claude-cli` y Google es propietario de `google-gemini-cli`. Las ejecuciones de agentes de OpenAI Codex usan el arnés app-server de Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

El Plugin Anthropic incluido registra para `claude-cli`:

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

Requisito previo: la CLI local de Gemini debe estar instalada y estar en `PATH` como `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas de salida de Gemini CLI:

- El analizador predeterminado de `stream-json` lee eventos `message` del asistente, eventos de herramientas, el uso final de `result` y eventos de error fatal de Gemini.
- Si sobrescribes los argumentos de Gemini a `--output-format json`, OpenClaw normaliza ese backend de nuevo a `output: "json"` y lee el texto de respuesta desde el campo JSON `response`.
- El uso recurre a `stats` cuando `usage` falta o está vacío; `stats.cached` se normaliza en `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se derivan de `stats.input_tokens - stats.cached`.

Sobrescribe los valores predeterminados solo si es necesario (lo más habitual es una ruta absoluta de `command`).

## Superposiciones de transformación de texto

Los Plugins que necesitan pequeñas adaptaciones de compatibilidad de prompts/mensajes pueden declarar transformaciones de texto bidireccionales sin reemplazar un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output` reescribe el texto transmitido del asistente y el texto final analizado antes de que OpenClaw gestione sus propios marcadores de control y la entrega del canal; en llamadas a modelos respaldadas por proveedor, también restaura valores de cadena dentro de argumentos estructurados de llamadas a herramientas después de reparar el flujo y antes de ejecutar la herramienta. Los fragmentos JSON sin procesar del proveedor se dejan sin cambios; los consumidores deben usar la carga útil estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, establece `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para flujos compatibles con Claude Code, `gemini-stream-json` para eventos `stream-json` de Gemini CLI.

## Propiedad de Compaction nativa

Algunos backends de CLI ejecutan un agente que compacta su propia transcripción, por lo que OpenClaw no debe ejecutar su resumidor de protección contra ellos: hacerlo entra en conflicto con la propia Compaction del backend y puede hacer que el turno falle de forma definitiva.

`claude-cli` no tiene endpoint de arnés (Claude Code compacta internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. Las sesiones con arnés nativo, como Codex, siguen enrutándose a su endpoint de Compaction de arnés.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declara `ownsNativeCompaction` solo para un backend que realmente sea dueño de la Compaction: debe limitar de forma fiable su propia transcripción cerca de la ventana de contexto y persistir una sesión reanudable (por ejemplo, `--resume` / `--session-id`), o una sesión diferida puede permanecer por encima del presupuesto.

## Superposiciones MCP incluidas

Los backends de CLI no reciben llamadas a herramientas de OpenClaw directamente, pero un backend puede optar por una superposición de configuración MCP generada con `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado.
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado.

Cuando MCP incluido está habilitado, OpenClaw:

- genera un servidor MCP HTTP de loopback que expone herramientas de Gateway al proceso de CLI, autenticado con un token por sesión (`OPENCLAW_MCP_TOKEN`);
- limita el acceso a herramientas a la sesión, la cuenta y el contexto del canal actuales;
- carga los servidores bundle-MCP habilitados para el espacio de trabajo actual y los combina con cualquier forma de configuración/ajustes MCP existente del backend;
- reescribe la configuración de inicio usando el modo de integración propiedad del backend desde el Plugin propietario.

Si no hay servidores MCP habilitados, OpenClaw aún inyecta una configuración estricta cuando un backend opta por MCP incluido, por lo que las ejecuciones en segundo plano permanecen aisladas.

Los runtimes MCP incluidos con ámbito de sesión se almacenan en caché para reutilizarse dentro de una sesión y luego se eliminan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (predeterminado: 10 minutos; establece `0` para deshabilitarlo). Las ejecuciones integradas de un solo uso, como sondeos de autenticación, generación de slugs y recuperación de active-memory, solicitan limpieza al final de la ejecución para que los procesos secundarios stdio y los flujos HTTP/SSE transmitibles no sobrevivan a la ejecución.

## Límite de historial de reseed

Cuando una sesión nueva de CLI se inicializa desde una transcripción previa de OpenClaw (por ejemplo, después de un reintento `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reseed crezcan de forma descontrolada. El valor predeterminado es 12.288 caracteres (aproximadamente 3.000 tokens).

Los backends de Claude CLI escalan este límite con la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes obtienen una porción mayor del historial previo, hasta un techo fijo; otros backends de CLI mantienen el valor predeterminado conservador. Este límite solo rige el bloque de historial previo del prompt de reseed; los límites de salida de sesiones en vivo se ajustan por separado en `reliability.outputLimits` (consulta [Sesiones](#sessions)).

## Limitaciones

- Sin llamadas directas a herramientas de OpenClaw: OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven herramientas de Gateway cuando optan por `bundleMcp: true`.
- La transmisión es específica del backend: algunos backends transmiten JSONL, otros acumulan en búfer hasta salir.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma                    | Corrección                                                               |
| -------------------------- | ------------------------------------------------------------------------ |
| No se encuentra la CLI     | Establece `command` en una ruta completa.                                |
| Nombre de modelo incorrecto | Usa `modelAliases` para asignar `provider/model` al id de modelo de la CLI. |
| Sin continuidad de sesión  | Asegúrate de que `sessionArg` esté establecido y `sessionMode` no sea `none`. |
| Imágenes ignoradas         | Establece `imageArg` y verifica que la CLI admita rutas de archivo.       |

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
