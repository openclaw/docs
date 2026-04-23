---
read_when:
    - Quieres un respaldo confiable cuando fallen los proveedores de API
    - Estás ejecutando Codex CLI u otros AI CLI locales y quieres reutilizarlos
    - Quieres entender el puente local loopback de MCP para el acceso a herramientas del backend de CLI
summary: 'Backends de CLI: respaldo local de AI CLI con puente de herramientas MCP opcional'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-23T05:15:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de respaldo)

OpenClaw puede ejecutar **AI CLI locales** como un **respaldo solo de texto** cuando los proveedores de API no están disponibles,
están limitados por tasa o presentan un comportamiento incorrecto temporalmente. Esto es intencionalmente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas de Gateway mediante un puente MCP local loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (por lo que los turnos de seguimiento se mantienen coherentes).
- **Las imágenes pueden pasarse** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** en lugar de una ruta principal. Úsalo cuando
quieras respuestas de texto que “siempre funcionen” sin depender de API externas.

Si quieres un runtime de arnés completo con controles de sesión de ACP, tareas en segundo plano,
vinculación de hilo/conversación y sesiones de codificación externas persistentes, usa
[Agentes ACP](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el Plugin OpenAI incluido
registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
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
hace referencia explícita a ese backend en una referencia de modelo o en
`agents.defaults.cliBackends`.

## Uso como respaldo

Agrega un backend de CLI a tu lista de respaldo para que solo se ejecute cuando fallen los modelos principales:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Notas:

- Si usas `agents.defaults.models` (lista permitida), también debes incluir ahí tus modelos del backend de CLI.
- Si falla el proveedor principal (autenticación, límites de tasa, tiempos de espera), OpenClaw
  probará el backend de CLI a continuación.

## Resumen de configuración

Todos los backends de CLI viven en:

```
agents.defaults.cliBackends
```

Cada entrada está indexada por un **id de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
El id de proveedor se convierte en el lado izquierdo de tu referencia de modelo:

```
<provider>/<model>
```

### Ejemplo de configuración

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
          // Las CLI estilo Codex pueden apuntar a un archivo de prompt en su lugar:
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
2. **Construye un prompt del sistema** usando el mismo prompt + contexto del espacio de trabajo de OpenClaw.
3. **Ejecuta la CLI** con un id de sesión (si es compatible) para que el historial se mantenga consistente.
   El backend `claude-cli` incluido mantiene un proceso stdio de Claude activo por
   sesión de OpenClaw y envía los turnos de seguimiento por stdin stream-json.
4. **Analiza la salida** (JSON o texto sin formato) y devuelve el texto final.
5. **Persiste los id de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend `claude-cli` incluido de Anthropic vuelve a ser compatible. El personal de Anthropic
nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata
el uso de `claude -p` como autorizado para esta integración, salvo que Anthropic publique
una nueva política.
</Note>

El backend `codex-cli` incluido de OpenAI pasa el prompt del sistema de OpenClaw mediante
la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una bandera de estilo Claude
`--append-system-prompt`, por lo que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada nueva sesión de Codex CLI.

El backend `claude-cli` incluido de Anthropic recibe la instantánea de Skills de OpenClaw
de dos formas: el catálogo compacto de Skills de OpenClaw en el prompt del sistema añadido, y
un Plugin temporal de Claude Code pasado con `--plugin-dir`. El Plugin contiene
solo las Skills elegibles para ese agente/sesión, por lo que el resolvedor nativo de Skills de Claude Code
ve el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en el
prompt. Las anulaciones de env/claves de API para Skills siguen siendo aplicadas por OpenClaw al
entorno del proceso hijo para la ejecución.

## Sesiones

- Si la CLI admite sesiones, configura `sessionArg` (por ejemplo, `--session-id`) o
  `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse
  en varias banderas.
- Si la CLI usa un **subcomando de reanudación** con banderas diferentes, configura
  `resumeArgs` (reemplaza `args` al reanudar) y opcionalmente `resumeOutput`
  (para reanudaciones que no son JSON).
- `sessionMode`:
  - `always`: envía siempre un id de sesión (un nuevo UUID si no hay ninguno almacenado).
  - `existing`: envía un id de sesión solo si ya había uno almacenado.
  - `none`: nunca envía un id de sesión.
- `claude-cli` usa por defecto `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso activo de Claude mientras
  siga activo. Si Gateway se reinicia o el proceso inactivo finaliza, OpenClaw
  reanuda desde el id de sesión de Claude almacenado.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El reinicio implícito diario
  no las corta; `/reset` y las políticas explícitas de `session.reset` sí.

Notas sobre serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw deja de reutilizar la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio en el id del perfil de autenticación, clave de API estática, token estático o identidad
  de cuenta OAuth cuando la CLI expone una. La rotación de tokens de acceso y actualización de OAuth no corta la sesión de CLI almacenada.
  Si una CLI no expone un id de cuenta OAuth estable, OpenClaw permite que esa CLI imponga los permisos de reanudación.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imagen, configura `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá las imágenes base64 en archivos temporales. Si `imageArg` está configurado, esas
rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw agrega las
rutas de archivo al prompt (inyección de rutas), lo que basta para las CLI que cargan
automáticamente archivos locales a partir de rutas sin formato.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y
  el uso desde `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo, Codex CLI `--json`) y extrae el mensaje final del agente más los identificadores de sesión
  cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de la CLI.
- `input: "stdin"` envía el prompt por stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está configurado, se usa stdin.

## Valores predeterminados (propiedad del Plugin)

El Plugin OpenAI incluido también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El Plugin Google incluido también registra un valor predeterminado para `google-gemini-cli`:

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

Notas sobre JSON de Gemini CLI:

- El texto de la respuesta se lee del campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío.
- `stats.cached` se normaliza en `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
  `stats.input_tokens - stats.cached`.

Reemplázalo solo si es necesario (lo más común: ruta `command` absoluta).

## Valores predeterminados propiedad del Plugin

Los valores predeterminados del backend de CLI ahora forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue reemplazando el valor predeterminado del Plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del Plugin mediante el hook opcional
  `normalizeConfig`.

Los Plugins que necesiten pequeños ajustes de compatibilidad de prompt/mensaje pueden declarar
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
reescribe los deltas transmitidos del asistente y el texto final analizado antes de que OpenClaw maneje
sus propios marcadores de control y la entrega al canal.

Para las CLI que emiten JSONL compatible con stream-json de Claude Code, configura
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones de MCP incluidas

Los backends de CLI **no** reciben llamadas a herramientas de OpenClaw directamente, pero un backend puede
optar por una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento actual incluido:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: anulaciones de configuración en línea para `mcp_servers`
- `google-gemini-cli`: archivo de configuración del sistema Gemini generado

Cuando bundle MCP está habilitado, OpenClaw:

- genera un servidor MCP HTTP loopback que expone herramientas de Gateway al proceso de CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a las herramientas a la sesión, cuenta y contexto de canal actuales
- carga los servidores bundle-MCP habilitados para el espacio de trabajo actual
- los combina con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de inicio usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un
backend opta por bundle MCP para que las ejecuciones en segundo plano permanezcan aisladas.

## Limitaciones

- **No hay llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas de Gateway cuando optan por
  `bundleMcp: true`.
- **El streaming es específico del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta salir.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), lo cual es menos
  estructurado que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  normalmente.

## Solución de problemas

- **CLI no encontrada**: establece `command` en una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para mapear `provider/model` → modelo de la CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté configurado y de que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudar con salida JSON).
- **Imágenes ignoradas**: configura `imageArg` (y verifica que la CLI admita rutas de archivo).
