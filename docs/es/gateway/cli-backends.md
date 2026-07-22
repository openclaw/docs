---
read_when:
    - Se necesita una alternativa fiable cuando fallen los proveedores de API
    - Se están ejecutando CLI de IA locales y se desea reutilizarlas
    - Quiere comprender el puente de bucle invertido MCP para el acceso a herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-22T10:32:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f4e32b34985aeb1df1adbf6bf638e9300dd672e5de49c45abe82d7bc181d5f5a
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar una CLI de IA local como alternativa de solo texto cuando los proveedores de API no están disponibles, tienen limitaciones de frecuencia o presentan un funcionamiento incorrecto. Su diseño es deliberadamente conservador:

- Las herramientas de OpenClaw no se inyectan directamente, pero un backend con `bundleMcp: true` puede recibir herramientas del Gateway mediante un puente MCP de bucle invertido.
- Transmisión JSONL para las CLI que la admiten.
- Se admiten sesiones, por lo que los turnos posteriores mantienen la coherencia.
- Las imágenes se transfieren si la CLI acepta rutas de imágenes.

Debe utilizarse como red de seguridad para obtener respuestas de texto que «siempre funcionen», no como ruta principal. Para disponer de un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas persistentes de programación, utilice en su lugar [agentes ACP](/es/tools/acp-agents); los backends de CLI no son ACP.

<Tip>
  ¿Está creando un nuevo plugin de backend? Consulte [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página explica cómo configurar y utilizar un backend ya registrado.
</Tip>

## Inicio rápido

El plugin Anthropic incluido registra un backend `claude-cli` predeterminado, por lo que funciona sin ninguna configuración aparte de tener Claude Code instalado y con una sesión iniciada:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el identificador de agente predeterminado cuando no se configura una lista explícita de agentes; de lo contrario, sustitúyalo por el identificador de su agente.

El servicio Gateway debe tener la CLI en su `PATH`. Si un despliegue necesita una
ruta de ejecutable o argumentos no estándar, registre ese adaptador en un
[plugin de backend de CLI](/es/plugins/cli-backend-plugins) en lugar de incluir la mecánica
de inicio en `openclaw.json`.

OpenClaw carga automáticamente el plugin incluido propietario cuando la selección del modelo o un
`agentRuntime.id` específico del modelo hace referencia a su backend.

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

Las alternativas configuradas siguen siendo aptas cuando falla el proveedor principal (autenticación, límites de frecuencia, tiempos de espera), aunque no estén en `agents.defaults.modelPolicy.allow`. Añada un modelo de backend de CLI a esa política solo cuando los usuarios también deban poder seleccionarlo directamente mediante `/model`, una sustitución de sesión o `--model`. `agents.defaults.models` solo contiene alias, parámetros y metadatos por modelo.

## Configuración

Los usuarios eligen un backend registrado mediante la política del modelo y del entorno de ejecución. Mantenga
canónica la referencia del modelo y seleccione el entorno de ejecución de CLI para cada modelo:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Las credenciales permanecen en los perfiles de autenticación de OpenClaw o en la configuración del plugin propietario.
La mecánica del comando, argv, entorno, análisis, sesión, imágenes y vigilancia
es código del plugin registrado con `api.registerCliBackend(...)`.

## Funcionamiento

1. Selecciona un backend mediante el prefijo del proveedor (`claude-cli/...`).
2. Genera un prompt del sistema utilizando el mismo prompt y contexto del espacio de trabajo de OpenClaw.
3. Ejecuta la CLI con un identificador de sesión (si se admite) para mantener la coherencia del historial. El backend `claude-cli` incluido mantiene activo un proceso stdio de Claude por sesión de OpenClaw y envía los turnos posteriores mediante la entrada estándar stream-json.
4. Analiza la salida (JSON o texto sin formato) y devuelve el texto final.
5. Conserva los identificadores de sesión por backend para que los turnos posteriores reutilicen la misma sesión de CLI.

## Tiempos de espera y trabajos de larga duración

Los backends de CLI tienen dos límites independientes:

- `agents.defaults.timeoutSeconds` limita todo el turno del agente. Los turnos normales del Gateway heredan el valor predeterminado de 48 horas; `0` hace que el límite del turno sea ilimitado. Una sustitución almacenada como `600` reemplaza ese valor predeterminado.
- El vigilante de ausencia de salida de la CLI detiene un subproceso que permanece en silencio. Cada plugin de backend posee perfiles independientes para sesiones nuevas y reanudadas, y el vigilante permanece activo incluso cuando el límite total del turno es ilimitado.

Elimine una sustitución de tiempo de espera total breve para volver al valor predeterminado de 48 horas, o establezca un límite explícito, como 12 horas:

```bash
# Volver al valor predeterminado de 48 horas:
openclaw config unset agents.defaults.timeoutSeconds

# O elegir un límite explícito de 12 horas:
openclaw config set agents.defaults.timeoutSeconds 43200
```

El trabajo en segundo plano iniciado dentro de una CLI sigue formando parte de ese subproceso de la CLI. Si el turno principal alcanza su límite total, OpenClaw detiene conjuntamente el subproceso y sus tareas internas en segundo plano. Para trabajos duraderos, utilice un [subagente](/es/tools/subagents) desacoplado de OpenClaw o un [agente ACP](/es/tools/acp-agents); los subagentes desacoplados no tienen un tiempo de espera de ejecución predeterminado.

El comando `openclaw agent` también tiene su propio plazo de solicitud. Su valor alternativo predeterminado de 600 segundos se aplica a la invocación de ese comando, no a los turnos normales del Gateway; consulte [`openclaw agent`](/es/cli/agent).

### Particularidades de la CLI de Claude

El backend `claude-cli` incluido prefiere el solucionador nativo de habilidades de Claude Code. Cuando la instantánea actual de habilidades tiene al menos una habilidad seleccionada con una ruta materializada, OpenClaw pasa un plugin temporal de Claude Code mediante `--plugin-dir` y omite del prompt del sistema añadido el catálogo duplicado de habilidades de OpenClaw. Sin una habilidad de plugin materializada, OpenClaw mantiene el catálogo del prompt como alternativa. Las sustituciones de variables de entorno o claves de API de las habilidades siguen aplicándose al entorno del proceso secundario durante la ejecución.

La CLI de Claude tiene su propio modo de permisos no interactivo; OpenClaw lo asigna a la política de ejecución existente en lugar de añadir una configuración específica de Claude. En las sesiones activas de Claude gestionadas por OpenClaw, la política de ejecución efectiva es la autoridad: YOLO (`tools.exec.mode: "full"`) normalmente inicia Claude con `--permission-mode bypassPermissions`, mientras que una política restrictiva lo inicia con `--permission-mode default`. Los gateways ejecutados como root también utilizan `default` porque Claude Code rechaza el modo de omisión para root; OpenClaw sigue respondiendo a las solicitudes de control de herramientas por stdio de Claude según la política de ejecución configurada. Los ajustes `agents.entries.*.tools.exec` por agente sustituyen los ajustes globales `tools.exec` para ese agente. El plugin Anthropic normaliza los indicadores de permisos de Claude para que coincidan con la política efectiva y la restricción del host.

El backend también asigna los niveles `/think` de OpenClaw al indicador nativo `--effort` de Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, y `high`/`xhigh`/`max` se transfieren directamente. Esto mantiene los mismos niveles de esfuerzo admitidos de Fable 5 para las rutas de la CLI de Claude respaldadas por suscripción y las rutas con clave de API. `adaptive` elimina los indicadores `--effort` configurados y no proporciona ningún reemplazo, por lo que Claude Code determina el esfuerzo efectivo a partir de su propio entorno, ajustes y valores predeterminados del modelo. Otros backends de CLI necesitan que su plugin propietario declare un asignador de argv equivalente antes de que `/think` afecte a la CLI iniciada.

Antes de que OpenClaw pueda utilizar `claude-cli`, Claude Code debe tener iniciada una sesión en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones de Docker necesitan que Claude Code esté instalado y tenga iniciada una sesión dentro del directorio principal persistente del contenedor, no solo en el host; consulte [Backend de la CLI de Claude en Docker](/es/install/docker#claude-cli-backend-in-docker).

El servicio Gateway debe resolver `claude` en `PATH`. Para una ruta no estándar,
registre un pequeño plugin de backend contenedor.

## Sesiones

- Si la CLI admite sesiones, establezca `sessionArgs` con un marcador de posición `{sessionId}` (por ejemplo, `["--session-id", "{sessionId}"]`).
- Si la CLI utiliza un subcomando de reanudación con indicadores diferentes, establezca `resumeArgs` (reemplaza a `args` al reanudar) y, opcionalmente, `resumeOutput` para reanudaciones que no sean JSON.
- `sessionMode`:
  - `always`: envía siempre un identificador de sesión (un UUID nuevo si no hay ninguno almacenado).
  - `existing`: envía un identificador de sesión solo si ya había uno almacenado.
  - `none`: nunca envía un identificador de sesión.
- `claude-cli` utiliza de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` y `input: "stdin"`, por lo que los turnos posteriores reutilizan el proceso activo de Claude mientras permanezca activo, incluso en configuraciones personalizadas que omitan los campos de transporte. Si el Gateway se reinicia o el proceso inactivo finaliza, OpenClaw reanuda la sesión a partir del identificador de sesión de Claude almacenado. Antes de reanudar, los identificadores de sesión almacenados se verifican con una transcripción legible del proyecto; si falta la transcripción, se elimina la vinculación (registrada como `reason=transcript-missing`) en lugar de iniciar silenciosamente una sesión nueva bajo `--resume`.
- Las sesiones activas de Claude mantienen límites de protección para la salida JSONL: 8 MiB y 20,000 líneas JSONL sin procesar por turno.
- Las sesiones de CLI almacenadas proporcionan una continuidad propiedad del proveedor. El restablecimiento automático está desactivado de forma predeterminada; `/reset` y las políticas `session.reset` explícitas, diarias o por inactividad, siguen interrumpiéndolas.
- Por lo general, las sesiones nuevas de CLI solo se reinicializan a partir del resumen de Compaction de OpenClaw y la parte posterior a la compactación. Para recuperar sesiones breves invalidadas antes de la compactación, un backend puede habilitar `reseedFromRawTranscriptWhenUncompacted: true`. La reinicialización con la transcripción sin procesar permanece limitada y restringida a invalidaciones seguras, como la ausencia de una transcripción de la CLI, una cola huérfana de uso de herramientas, cambios en la política de mensajes, el prompt del sistema, cwd o MCP, o un reintento por sesión caducada; los cambios de perfil de autenticación o de época de credenciales nunca reinicializan el historial de la transcripción sin procesar.

Serialización: `serialize: true` mantiene ordenadas las ejecuciones del mismo canal (la mayoría de las CLI serializan en un canal del proveedor). OpenClaw también descarta la reutilización de la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada, incluido un cambio del identificador del perfil de autenticación, la clave de API estática, el token estático o la identidad de la cuenta OAuth cuando la CLI expone una; la mera rotación de los tokens de acceso o actualización de OAuth no interrumpe la sesión. Si una CLI no dispone de un identificador estable de cuenta OAuth, OpenClaw permite que esa CLI aplique sus propios permisos de reanudación.

## Preámbulo alternativo de sesiones de claude-cli

Cuando un intento `claude-cli` conmuta a un candidato que no es de CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicializa el siguiente intento con un preámbulo de contexto obtenido de la transcripción JSONL local de Claude Code (en `~/.claude/projects/`, con una clave por espacio de trabajo). Sin esta inicialización, el proveedor alternativo comienza sin contexto, ya que la propia transcripción de sesión de OpenClaw está vacía para las ejecuciones `claude-cli`.

- El preámbulo prioriza el resumen `/compact` o el marcador `compact_boundary` más reciente y, a continuación, añade los turnos posteriores al límite más recientes hasta alcanzar un límite de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se agrupan en indicaciones compactas `(tool call: name)` y `(tool result: …)` para mantener preciso el límite del prompt; los resúmenes excesivamente grandes se truncan y se etiquetan como `(truncated)`.
- Las alternativas del mismo proveedor de `claude-cli` a `claude-cli` dependen del propio `--resume` de Claude y omiten el preámbulo.
- La inicialización reutiliza la validación existente de la ruta del archivo de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes

Los autores de plugins declaran la compatibilidad con rutas de imágenes mediante `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribe las imágenes en base64 en archivos temporales. Si se establece `imageArg`, esas rutas se pasan como argumentos de la CLI; de lo contrario, OpenClaw añade las rutas de los archivos al prompt (inyección de rutas), lo que funciona con las CLI que cargan automáticamente archivos locales a partir de rutas sin formato.

## Entradas y salidas

- `output: "text"` (predeterminado) trata stdout como la respuesta final.
- `output: "json"` intenta analizar JSON y extraer el texto junto con un id de sesión.
- `output: "jsonl"` analiza un flujo JSONL y extrae el mensaje final del agente junto con los identificadores de sesión cuando están presentes.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y el uso de `stats` cuando `usage` falta o está vacío. El adaptador de Gemini CLI incluido usa `stream-json`.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como último argumento de la CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está configurado, se usa stdin en su lugar.

## Valores predeterminados gestionados por el Plugin

Los valores predeterminados del backend de la CLI forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelos.
- El comportamiento del comando, argv, entorno, analizador, sesión y supervisor permanece en el código del Plugin.
- La normalización específica del backend sigue siendo responsabilidad del Plugin mediante el enlace opcional `normalizeConfig`.

Anthropic gestiona `claude-cli` y Google gestiona `google-gemini-cli`. Las ejecuciones del agente OpenAI Codex usan el entorno de app-server de Codex mediante `openai/*`; OpenClaw ya no registra un backend `codex-cli` incluido.

El Plugin de Anthropic incluido registra lo siguiente para `claude-cli`:

| Clave                 | Valor                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArgs`         | `["--session-id", "{sessionId}"]`                                                                                                                                                                             |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

El Plugin de Google incluido registra lo siguiente para `google-gemini-cli`:

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

Requisito previo: la Gemini CLI local debe estar instalada y disponible en `PATH` como `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas sobre la salida de Gemini CLI:

- El analizador `stream-json` predeterminado lee los eventos `message` del asistente, los eventos de herramientas, el uso final de `result` y los eventos de error fatal de Gemini.
- El uso recurre a `stats` cuando `usage` está ausente o vacío; `stats.cached` se normaliza en `cacheRead` de OpenClaw y, si falta `stats.input`, los tokens de entrada se derivan de `stats.input_tokens - stats.cached`.

## Capas de transformación de texto

Los Plugins que necesiten pequeñas capas de compatibilidad para prompts o mensajes pueden declarar transformaciones de texto bidireccionales sin sustituir un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output` reescribe el texto transmitido del asistente y el texto final analizado antes de que OpenClaw gestione sus propios marcadores de control y la entrega al canal; en las llamadas a modelos respaldadas por proveedores, también restaura los valores de cadena dentro de los argumentos estructurados de llamadas a herramientas después de reparar el flujo y antes de ejecutar la herramienta. Los fragmentos JSON sin procesar del proveedor no se modifican; los consumidores deben usar la carga estructurada parcial, final o de resultado.

Para las CLI que emiten eventos JSONL específicos del proveedor, configure `jsonlDialect` en la configuración de ese backend: `claude-stream-json` para flujos compatibles con Claude Code y `gemini-stream-json` para eventos `stream-json` de Gemini CLI.

## Propiedad de la Compaction nativa

Algunos backends de CLI ejecutan un agente que compacta su propia transcripción, por lo que OpenClaw no debe ejecutar su resumidor de protección sobre ellos; hacerlo entra en conflicto con la propia Compaction del backend y puede provocar un fallo definitivo del turno.

`claude-cli` no tiene un endpoint del entorno (Claude Code realiza la Compaction internamente), por lo que declara `ownsNativeCompaction: true` y la ruta de Compaction de OpenClaw devuelve la entrada de sesión sin cambios. OpenClaw pasa el presupuesto de contexto efectivo de la ejecución mediante la variable documentada [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) de Claude Code, lo que mantiene la Compaction automática nativa alineada con los límites `contextTokens` configurados de Anthropic. Las sesiones con entorno nativo, como Codex, siguen dirigiéndose al endpoint de Compaction de su entorno.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` únicamente para un backend que gestione realmente la Compaction: debe limitar de forma fiable su propia transcripción cerca de la ventana de contexto y conservar una sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión diferida puede permanecer por encima del presupuesto.

## Capas de MCP incluido

Los backends de CLI no reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede optar por una capa de configuración MCP generada mediante `bundleMcp: true`. Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado.
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado.

Cuando MCP incluido está habilitado, OpenClaw:

- inicia un servidor MCP HTTP de bucle invertido que expone las herramientas del Gateway al proceso de la CLI, autenticado con una concesión de contexto por ejecución (`OPENCLAW_MCP_TOKEN`) activa únicamente durante el intento de ejecución actual;
- vincula el acceso a las herramientas con el contexto de sesión, cuenta y canal seleccionado por el Gateway, en lugar de confiar en los encabezados del proceso hijo;
- carga los servidores de MCP incluido habilitados para el espacio de trabajo actual y los combina con cualquier estructura existente de configuración o ajustes MCP del backend;
- reescribe la configuración de inicio usando el modo de integración del backend definido por el Plugin propietario.

Las ejecuciones restringidas, como los trabajos de Cron con `toolsAllow`, requieren una traducción exacta
gestionada por el backend. El backend `claude-cli` incluido deshabilita las
herramientas nativas de Claude y las personalizaciones del usuario, del proyecto y locales, incluidos los enlaces,
Plugins, agentes, Skills y `CLAUDE.md`. A continuación, expone todas las herramientas
permitidas de OpenClaw mediante el servidor MCP limitado por la concesión. Esto mantiene las políticas del sistema de archivos,
los procesos, la ejecución, la aprobación y el entorno aislado dentro de OpenClaw, en lugar de ampliar
la autoridad a las herramientas nativas de Claude o a los procesos de personalización. La misma lista de MCP
se aplica en la configuración generada de Claude y de nuevo en el Gateway durante el listado
y la ejecución de herramientas. Antes de emitir la concesión, el núcleo rechaza las
traducciones del backend que indiquen cualquier permiso MCP fuera de la lista de permitidos original.
Los backends sin una traducción exacta siguen generando un fallo seguro.

Si no hay ningún servidor MCP habilitado, OpenClaw sigue inyectando una configuración estricta cuando un backend opta por MCP incluido, de modo que las ejecuciones en segundo plano permanezcan aisladas.

Los runtimes de MCP incluido con ámbito de sesión se almacenan en caché para reutilizarlos dentro de una sesión y se eliminan después de 10 minutos de inactividad. Las ejecuciones integradas de un solo uso, como las comprobaciones de autenticación, la generación de identificadores y la recuperación de Active Memory, solicitan la limpieza al finalizar la ejecución para que los procesos hijos de stdio y los flujos HTTP/SSE transmisibles no sobrevivan a la ejecución.

Para `claude-cli`, se reenvía a ese proceso hijo de Claude un perfil compatible
de OAuth/token de OpenClaw seleccionado u ordenado. Esto hace que los perfiles por agente sean autoritativos
durante el turno, a la vez que conserva el inicio de sesión nativo de Claude en el host cuando no existe
ningún perfil compatible.

## Límite del historial de reinicialización

Cuando se inicializa una sesión nueva de la CLI a partir de una transcripción anterior de OpenClaw (por ejemplo, después de un reintento de `session_expired`), el bloque `<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización crezcan desmesuradamente. El valor predeterminado es de 12,288 caracteres (unos 3,000 tokens).

Los backends de Claude CLI ajustan este límite según la ventana de contexto de Claude resuelta: las ventanas de contexto más grandes obtienen una porción mayor del historial anterior, hasta un límite máximo fijo; los demás backends de CLI mantienen el valor predeterminado conservador. Este límite solo controla el bloque de historial anterior del prompt de reinicialización.

## Limitaciones

- OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de la CLI. Los backends solo ven las herramientas del Gateway cuando habilitan `bundleMcp: true`.
- El streaming es específico de cada backend: algunos backends transmiten JSONL, mientras que otros almacenan en búfer hasta finalizar.
- Las salidas estructuradas dependen del formato JSON propio de la CLI.

## Solución de problemas

| Síntoma                  | Solución                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| No se encuentra la CLI   | Añada la CLI al `PATH` del servicio del Gateway o actualice el comando registrado del plugin propietario. |
| Nombre de modelo erróneo | Actualice la asignación `modelAliases` del plugin.                                                                 |
| Sin continuidad de sesión | Compruebe `sessionArgs` y `sessionMode` del plugin.                                                         |
| Imágenes ignoradas       | Compruebe `imageArg` del plugin y la compatibilidad de la CLI con rutas de archivos.                           |

## Contenido relacionado

- [Manual de operaciones del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
