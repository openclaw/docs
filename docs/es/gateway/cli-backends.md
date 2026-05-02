---
read_when:
    - Quieres una alternativa confiable cuando fallan los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente de loopback MCP para el acceso a herramientas del backend de la CLI
summary: 'Backends de CLI: alternativa local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-05-02T20:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar **CLI de IA locales** como **respaldo solo de texto** cuando los proveedores de API están caídos,
limitados por tasa o se comportan mal temporalmente. Esto es intencionalmente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del Gateway mediante un puente MCP de loopback.
- **Streaming JSONL** para CLI que lo admiten.
- **Las sesiones son compatibles** (por lo que los turnos de seguimiento se mantienen coherentes).
- **Las imágenes pueden pasarse directamente** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** en lugar de una ruta principal. Úsalo cuando
quieras respuestas de texto que “siempre funcionen” sin depender de API externas.

Si quieres un runtime de arnés completo con controles de sesión ACP, tareas en segundo plano,
vinculación de hilos/conversaciones y sesiones persistentes externas de programación, usa
[Agentes ACP](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el Plugin de OpenAI incluido
registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si tu gateway se ejecuta bajo launchd/systemd y PATH es mínimo, añade solo la
ruta del comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Eso es todo. No se necesitan claves ni configuración de autenticación adicional más allá de la propia CLI.

Si usas un backend de CLI incluido como **proveedor principal de mensajes** en un
host de gateway, OpenClaw ahora carga automáticamente el Plugin incluido propietario cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o bajo
`agents.defaults.cliBackends`.

## Usarlo como respaldo

Añade un backend de CLI a tu lista de respaldos para que solo se ejecute cuando fallen los modelos principales:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notas:

- Si usas `agents.defaults.models` (lista de permitidos), también debes incluir ahí tus modelos de backend de CLI.
- Si el proveedor principal falla (autenticación, límites de tasa, tiempos de espera), OpenClaw
  probará después el backend de CLI.

## Resumen de configuración

Todos los backends de CLI viven bajo:

```
agents.defaults.cliBackends
```

Cada entrada está indexada por un **id de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
El id de proveedor se convierte en el lado izquierdo de tu referencia de modelo:

```
<provider>/<model>
```

### Configuración de ejemplo

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Cómo funciona

1. **Selecciona un backend** según el prefijo del proveedor (`codex-cli/...`).
2. **Construye un prompt de sistema** usando el mismo prompt de OpenClaw y el contexto del espacio de trabajo.
3. **Ejecuta la CLI** con un id de sesión (si es compatible) para que el historial se mantenga coherente.
   El backend `claude-cli` incluido mantiene vivo un proceso stdio de Claude por
   sesión de OpenClaw y envía turnos de seguimiento mediante stdin stream-json.
4. **Analiza la salida** (JSON o texto sin formato) y devuelve el texto final.
5. **Persiste ids de sesión** por backend, de modo que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend `claude-cli` de Anthropic incluido vuelve a ser compatible. El personal de Anthropic
nos dijo que el uso de Claude CLI al estilo de OpenClaw está permitido de nuevo, por lo que OpenClaw trata
el uso de `claude -p` como sancionado para esta integración salvo que Anthropic publique
una política nueva.
</Note>

El backend `codex-cli` de OpenAI incluido pasa el prompt de sistema de OpenClaw mediante
la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una marca
`--append-system-prompt` al estilo de Claude, por lo que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada sesión nueva de Codex CLI.

El backend `claude-cli` de Anthropic incluido recibe la instantánea de Skills de OpenClaw
de dos maneras: el catálogo compacto de Skills de OpenClaw en el prompt de sistema anexado, y
un Plugin temporal de Claude Code pasado con `--plugin-dir`. El Plugin contiene
solo las Skills elegibles para ese agente/sesión, por lo que el resolvedor nativo de Skills
de Claude Code ve el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en
el prompt. OpenClaw sigue aplicando las anulaciones de entorno/clave de API de Skills al
entorno del proceso hijo para la ejecución.

Claude CLI también tiene su propio modo de permisos no interactivo. OpenClaw lo asigna
a la política de exec existente en lugar de añadir configuración específica de Claude: cuando la
política efectiva de exec solicitada es YOLO (`tools.exec.security: "full"` y
`tools.exec.ask: "off"`), OpenClaw añade `--permission-mode bypassPermissions`.
La configuración por agente `agents.list[].tools.exec` anula `tools.exec` global para
ese agente. Para forzar un modo de Claude distinto, configura argumentos backend sin procesar explícitos
como `--permission-mode default` o `--permission-mode acceptEdits` bajo
`agents.defaults.cliBackends.claude-cli.args` y los `resumeArgs` correspondientes.

Antes de que OpenClaw pueda usar el backend `claude-cli` incluido, Claude Code
ya debe haber iniciado sesión en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude`
no esté ya en `PATH`.

## Sesiones

- Si la CLI admite sesiones, configura `sessionArg` (por ejemplo, `--session-id`) o
  `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse
  en varias marcas.
- Si la CLI usa un **subcomando de reanudación** con marcas distintas, configura
  `resumeArgs` (reemplaza `args` al reanudar) y, opcionalmente, `resumeOutput`
  (para reanudaciones que no sean JSON).
- `sessionMode`:
  - `always`: siempre envía un id de sesión (UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un id de sesión si ya había uno almacenado.
  - `none`: nunca envía un id de sesión.
- `claude-cli` tiene como valores predeterminados `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso vivo de Claude mientras
  esté activo. Stdio caliente es ahora el valor predeterminado, incluso para configuraciones personalizadas
  que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo
  sale, OpenClaw reanuda desde el id de sesión almacenado de Claude. Los ids de sesión
  almacenados se verifican contra una transcripción de proyecto existente y legible antes de
  reanudar, por lo que las vinculaciones fantasma se limpian con `reason=transcript-missing`
  en lugar de iniciar silenciosamente una sesión nueva de Claude CLI bajo `--resume`.
- Las sesiones vivas de Claude mantienen protecciones acotadas de salida JSONL. Los valores predeterminados permiten hasta
  8 MiB y 20.000 líneas JSONL sin procesar por turno. Los turnos de Claude con muchas herramientas pueden elevar
  esos límites por backend con
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  y `maxTurnLines`; OpenClaw limita esos ajustes a 64 MiB y 100.000
  líneas.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El reinicio diario
  implícito de sesión no las corta; `/reset` y las políticas explícitas `session.reset` todavía
  lo hacen.

Notas de serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw deja de reutilizar la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio de id de perfil de autenticación, clave de API estática, token estático o identidad
  de cuenta OAuth cuando la CLI expone una. La rotación de tokens de acceso y actualización
  OAuth no corta la sesión de CLI almacenada. Si una CLI no expone un
  id estable de cuenta OAuth, OpenClaw deja que esa CLI aplique los permisos de reanudación.

## Preludio de respaldo desde sesiones claude-cli

Cuando un intento de `claude-cli` falla y pasa a un candidato que no es CLI en
[`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw siembra
el siguiente intento con un preludio de contexto cosechado de la transcripción JSONL local
de Claude Code en `~/.claude/projects/`. Sin esta semilla, el proveedor de respaldo
empezaría en frío porque la propia transcripción de sesión de OpenClaw está vacía
para las ejecuciones de `claude-cli`.

- El preludio prefiere el resumen `/compact` más reciente o el marcador `compact_boundary`,
  y luego anexa los turnos posteriores al límite más recientes hasta un presupuesto de caracteres.
  Los turnos previos al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se fusionan en pistas compactas `(tool call: name)` y
  `(tool result: …)` para mantener honesto el presupuesto del prompt. El resumen se
  etiqueta como `(truncated)` si se desborda.
- Los respaldos de `claude-cli` a `claude-cli` del mismo proveedor se basan en el propio
  `--resume` de Claude y omiten el preludio.
- La semilla reutiliza la validación existente de rutas de archivos de sesión de Claude, por lo que
  no se pueden leer rutas arbitrarias.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imagen, configura `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá imágenes base64 en archivos temporales. Si `imageArg` está configurado, esas
rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw anexa las
rutas de archivo al prompt (inyección de ruta), lo que basta para CLI que cargan automáticamente
archivos locales desde rutas en texto sin formato.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y
  el uso desde `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza streams JSONL (por ejemplo, Codex CLI `--json`) y extrae el mensaje final del agente más identificadores
  de sesión cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está configurado, se usa stdin.

## Valores predeterminados (propiedad del Plugin)

El Plugin de OpenAI incluido también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El Plugin de Google incluido también registra un valor predeterminado para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Requisito previo: la Gemini CLI local debe estar instalada y disponible como
`gemini` en `PATH` (`brew install gemini-cli` o
`npm install -g @google/gemini-cli`).

Notas de JSON de Gemini CLI:

- El texto de respuesta se lee desde el campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío.
- `stats.cached` se normaliza como `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
  `stats.input_tokens - stats.cached`.

Anula solo si es necesario (común: ruta absoluta de `command`).

## Valores predeterminados propiedad del Plugin

Los valores predeterminados de backend de CLI ahora forman parte de la superficie del Plugin:

- Los plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración de usuario en `agents.defaults.cliBackends.<id>` sigue sobrescribiendo el valor predeterminado del plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del plugin mediante el hook opcional
  `normalizeConfig`.

Los plugins que necesiten pequeños shims de compatibilidad de prompts/mensajes pueden declarar
transformaciones de texto bidireccionales sin reemplazar un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario pasados a la CLI. `output`
reescribe los deltas del asistente transmitidos y el texto final analizado antes de que OpenClaw gestione
sus propios marcadores de control y la entrega al canal.

Para las CLI que emiten JSONL compatible con Claude Code stream-json, establece
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones MCP empaquetadas

Los backends de CLI **no** reciben llamadas a herramientas de OpenClaw directamente, pero un backend puede
optar por una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento empaquetado actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: sobrescrituras de configuración en línea para `mcp_servers`; el servidor
  local loopback generado de OpenClaw se marca con el modo de aprobación de herramientas por servidor de Codex
  para que las llamadas MCP no se queden bloqueadas en prompts de aprobación locales
- `google-gemini-cli`: archivo de configuración del sistema de Gemini generado

Cuando el MCP empaquetado está habilitado, OpenClaw:

- inicia un servidor HTTP MCP de loopback que expone herramientas de gateway al proceso de CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas al contexto de la sesión, cuenta y canal actuales
- carga los servidores bundle-MCP habilitados para el workspace actual
- los combina con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de lanzamiento usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw igualmente inyecta una configuración estricta cuando un
backend opta por el MCP empaquetado para que las ejecuciones en segundo plano permanezcan aisladas.

Los runtimes MCP empaquetados con alcance de sesión se almacenan en caché para reutilizarlos dentro de una sesión y luego
se eliminan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (10
minutos de forma predeterminada; establece `0` para deshabilitarlo). Las ejecuciones integradas de un solo uso, como sondeos de autenticación,
generación de slugs y solicitudes de recuperación de Active Memory, limpian al final de la ejecución para que los procesos secundarios
stdio y los streams HTTP/SSE transmisibles no sobrevivan a la ejecución.

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas de gateway cuando optan por
  `bundleMcp: true`.
- **El streaming es específico del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta salir.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), lo que es menos
  estructurado que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  con normalidad.

## Solución de problemas

- **CLI no encontrada**: establece `command` en una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para asignar `provider/model` → modelo de CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté establecido y que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudar con salida JSON).
- **Imágenes ignoradas**: establece `imageArg` (y verifica que la CLI admita rutas de archivo).

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
