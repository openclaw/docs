---
read_when:
    - Quiere una alternativa fiable cuando fallan los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI de IA locales y quieres reutilizarlas
    - Quieres comprender el puente de loopback MCP para el acceso a herramientas del backend de CLI
summary: 'Motores de CLI: alternativa de CLI de IA local con puente opcional de herramientas MCP'
title: Motores de CLI
x-i18n:
    generated_at: "2026-05-06T09:03:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar **CLI de IA locales** como una **alternativa de solo texto** cuando los proveedores de API están caídos,
limitados por tasa o se comportan temporalmente de forma incorrecta. Esto es intencionalmente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del Gateway mediante un puente MCP de loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (por lo que los turnos de seguimiento mantienen la coherencia).
- **Las imágenes pueden pasarse** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando
quieras respuestas de texto que "siempre funcionen" sin depender de API externas.

Si quieres un runtime completo de arnés con controles de sesión ACP, tareas en segundo plano,
vinculación de hilos/conversaciones y sesiones externas persistentes de programación, usa
[Agentes ACP](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido apto para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el Plugin de OpenAI incluido
registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si tu Gateway se ejecuta bajo launchd/systemd y PATH es mínimo, agrega solo la
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
host de Gateway, OpenClaw ahora carga automáticamente el Plugin incluido propietario cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o bajo
`agents.defaults.cliBackends`.

## Usarlo como alternativa

Agrega un backend de CLI a tu lista de alternativas para que se ejecute solo cuando fallen los modelos principales:

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
- Si falla el proveedor principal (autenticación, límites de tasa, tiempos de espera), OpenClaw
  probará el backend de CLI a continuación.

## Resumen de configuración

Todos los backends de CLI se encuentran bajo:

```
agents.defaults.cliBackends
```

Cada entrada está identificada por un **id de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
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
2. **Construye un prompt del sistema** usando el mismo prompt de OpenClaw + contexto del espacio de trabajo.
3. **Ejecuta la CLI** con un id de sesión (si es compatible) para que el historial se mantenga consistente.
   El backend `claude-cli` incluido mantiene vivo un proceso stdio de Claude por cada
   sesión de OpenClaw y envía turnos de seguimiento por stdin stream-json.
4. **Analiza la salida** (JSON o texto sin formato) y devuelve el texto final.
5. **Persiste los ids de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend `claude-cli` de Anthropic incluido vuelve a estar admitido. El personal de Anthropic
nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata
el uso de `claude -p` como autorizado para esta integración a menos que Anthropic publique
una nueva política.
</Note>

El backend `codex-cli` de OpenAI incluido pasa el prompt del sistema de OpenClaw mediante
la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una opción al estilo Claude
`--append-system-prompt`, por lo que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada sesión nueva de Codex CLI.

El backend Anthropic `claude-cli` incluido recibe la instantánea de Skills de OpenClaw de dos maneras: el catálogo compacto de Skills de OpenClaw en el prompt de sistema anexado, y un plugin temporal de Claude Code pasado con `--plugin-dir`. El plugin contiene solo las Skills elegibles para ese agente/sesión, por lo que el solucionador nativo de Skills de Claude Code ve el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en el prompt. OpenClaw sigue aplicando las sobrescrituras de entorno/clave de API de Skills al entorno del proceso hijo para la ejecución.

Claude CLI también tiene su propio modo de permisos no interactivo. OpenClaw lo asigna a la política exec existente en lugar de agregar configuración específica de Claude: cuando la política exec efectiva solicitada es YOLO (`tools.exec.security: "full"` y `tools.exec.ask: "off"`), OpenClaw agrega `--permission-mode bypassPermissions`. La configuración por agente `agents.list[].tools.exec` sobrescribe la configuración global `tools.exec` para ese agente. Para forzar un modo de Claude diferente, define argumentos de backend sin procesar explícitos, como `--permission-mode default` o `--permission-mode acceptEdits`, en `agents.defaults.cliBackends.claude-cli.args` y los `resumeArgs` correspondientes.

El backend Anthropic `claude-cli` incluido también asigna los niveles `/think` de OpenClaw al indicador nativo `--effort` de Claude Code para los niveles distintos de desactivado. `minimal` y `low` se asignan a `low`, `adaptive` y `medium` se asignan a `medium`, y `high`, `xhigh` y `max` se asignan directamente. Otros backends CLI necesitan que su plugin propietario declare un asignador de argv equivalente antes de que `/think` pueda afectar la CLI generada.

Antes de que OpenClaw pueda usar el backend `claude-cli` incluido, Claude Code ya debe tener la sesión iniciada en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude` aún no esté en `PATH`.

## Sesiones

- Si la CLI admite sesiones, define `sessionArg` (por ejemplo, `--session-id`) o `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse en varios indicadores.
- Si la CLI usa un **subcomando de reanudación** con indicadores diferentes, define `resumeArgs` (reemplaza `args` al reanudar) y, opcionalmente, `resumeOutput` (para reanudaciones no JSON).
- `sessionMode`:
  - `always`: enviar siempre un ID de sesión (UUID nuevo si no hay ninguno almacenado).
  - `existing`: enviar un ID de sesión solo si ya había uno almacenado.
  - `none`: no enviar nunca un ID de sesión.
- `claude-cli` usa de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso activo de Claude mientras esté activo. Stdio en caliente es ahora el valor predeterminado, también para configuraciones personalizadas que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo sale, OpenClaw reanuda desde el ID de sesión de Claude almacenado. Los IDs de sesión almacenados se verifican contra una transcripción de proyecto existente y legible antes de reanudar, por lo que los enlaces fantasma se limpian con `reason=transcript-missing` en lugar de iniciar silenciosamente una sesión nueva de Claude CLI con `--resume`.
- Las sesiones en vivo de Claude mantienen guardas acotadas de salida JSONL. Los valores predeterminados permiten hasta 8 MiB y 20 000 líneas JSONL sin procesar por turno. Los turnos de Claude con muchas herramientas pueden aumentarlos por backend con `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` y `maxTurnLines`; OpenClaw limita esas configuraciones a 64 MiB y 100 000 líneas.
- Las sesiones CLI almacenadas son continuidad propiedad del proveedor. El restablecimiento diario implícito de sesión no las corta; `/reset` y las políticas explícitas `session.reset` aún lo hacen.

Notas de serialización:

- `serialize: true` mantiene ordenadas las ejecuciones en el mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw deja de reutilizar sesiones CLI almacenadas cuando cambia la identidad de autenticación seleccionada, incluido un cambio de ID de perfil de autenticación, clave de API estática, token estático o identidad de cuenta OAuth cuando la CLI expone una. La rotación de tokens de acceso y actualización OAuth no corta la sesión CLI almacenada. Si una CLI no expone un ID de cuenta OAuth estable, OpenClaw deja que esa CLI aplique los permisos de reanudación.

## Preludio de reserva de sesiones claude-cli

Cuando un intento de `claude-cli` conmuta por error a un candidato no CLI en [`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw inicializa el siguiente intento con un preludio de contexto recopilado de la transcripción JSONL local de Claude Code en `~/.claude/projects/`. Sin esta semilla, el proveedor de reserva comenzaría en frío porque la transcripción de sesión propia de OpenClaw está vacía para las ejecuciones de `claude-cli`.

- El preludio prefiere el resumen `/compact` más reciente o el marcador `compact_boundary`; después anexa los turnos posteriores al límite más recientes hasta un presupuesto de caracteres. Los turnos anteriores al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se fusionan en pistas compactas `(tool call: name)` y `(tool result: …)` para mantener honesto el presupuesto del prompt. El resumen se etiqueta como `(truncated)` si se desborda.
- Las reservas de `claude-cli` a `claude-cli` del mismo proveedor dependen del propio `--resume` de Claude y omiten el preludio.
- La semilla reutiliza la validación existente de ruta de archivo de sesión de Claude, por lo que no se pueden leer rutas arbitrarias.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imágenes, define `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá imágenes base64 en archivos temporales. Si `imageArg` está definido, esas rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw anexa las rutas de archivo al prompt (inyección de rutas), lo cual basta para las CLI que cargan automáticamente archivos locales desde rutas simples.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + ID de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y el uso de `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo, Codex CLI `--json`) y extrae el mensaje final del agente más identificadores de sesión cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está definido, se usa stdin.

## Valores predeterminados (propiedad del plugin)

El plugin de OpenAI incluido también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El plugin de Google incluido también registra un valor predeterminado para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Requisito previo: la Gemini CLI local debe estar instalada y disponible como `gemini` en `PATH` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas de JSON de Gemini CLI:

- El texto de respuesta se lee desde el campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no está presente o está vacío.
- `stats.cached` se normaliza como `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
  `stats.input_tokens - stats.cached`.

Sobrescribe solo si es necesario (común: ruta absoluta de `command`).

## Valores predeterminados propiedad del Plugin

Los valores predeterminados del backend de la CLI ahora forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración de usuario en `agents.defaults.cliBackends.<id>` todavía sobrescribe el valor predeterminado del Plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del Plugin mediante el hook opcional
  `normalizeConfig`.

Los Plugins que necesiten pequeños shims de compatibilidad de prompts/mensajes pueden declarar
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

`input` reescribe el prompt del sistema y el prompt de usuario pasados a la CLI. `output`
reescribe los deltas transmitidos del asistente y el texto final analizado antes de que OpenClaw gestione
sus propios marcadores de control y la entrega al canal.

Para las CLI que emiten JSONL compatible con Claude Code stream-json, establece
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones MCP del paquete

Los backends de CLI **no** reciben llamadas de herramientas de OpenClaw directamente, pero un backend puede
optar por una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento empaquetado actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: sobrescrituras de configuración en línea para `mcp_servers`; el servidor
  local loopback de OpenClaw generado se marca con el modo de aprobación de herramientas por servidor de Codex
  para que las llamadas MCP no puedan quedarse bloqueadas en prompts de aprobación local
- `google-gemini-cli`: archivo de configuración del sistema Gemini generado

Cuando el paquete MCP está habilitado, OpenClaw:

- inicia un servidor MCP HTTP de local loopback que expone herramientas del Gateway al proceso de la CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas al contexto de la sesión, cuenta y canal actuales
- carga servidores bundle-MCP habilitados para el espacio de trabajo actual
- los fusiona con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de lanzamiento usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw aún inyecta una configuración estricta cuando un
backend opta por el paquete MCP para que las ejecuciones en segundo plano permanezcan aisladas.

Los runtimes MCP empaquetados con alcance de sesión se almacenan en caché para reutilizarlos dentro de una sesión y luego
se recolectan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (valor predeterminado: 10
minutos; establece `0` para deshabilitarlo). Las ejecuciones integradas de una sola vez, como sondeos de autenticación,
generación de slug y recuperación de Active Memory, solicitan limpieza al final de la ejecución para que los hijos stdio
y los flujos Streamable HTTP/SSE no sobrevivan a la ejecución.

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas de herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas del Gateway cuando optan por
  `bundleMcp: true`.
- **El streaming es específico del backend.** Algunos backends transmiten JSONL; otros acumulan en búfer
  hasta salir.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), lo que es menos
  estructurado que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  normalmente.

## Solución de problemas

- **No se encuentra la CLI**: establece `command` en una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para mapear `provider/model` → modelo de la CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté establecido y que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudarse con salida JSON).
- **Imágenes ignoradas**: establece `imageArg` (y verifica que la CLI admita rutas de archivo).

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
