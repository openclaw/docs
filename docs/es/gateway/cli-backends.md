---
read_when:
    - Quieres un respaldo confiable cuando fallen los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente MCP de local loopback para el acceso a herramientas del backend de CLI
summary: 'Backends de CLI: respaldo de CLI de IA local con puente de herramientas MCP opcional'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-23T14:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de respaldo)

OpenClaw puede ejecutar **CLI de IA locales** como un **respaldo solo de texto** cuando los proveedores de API no están disponibles,
están limitados por tasa o se comportan mal temporalmente. Esto es intencionalmente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del gateway mediante un puente MCP de local loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (para que los turnos de seguimiento mantengan la coherencia).
- **Las imágenes se pueden transferir** si la CLI acepta rutas de imágenes.

Esto está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando
quieras respuestas de texto de “siempre funciona” sin depender de APIs externas.

Si quieres un runtime de arnés completo con controles de sesión ACP, tareas en segundo plano,
vinculación de hilos/conversaciones y sesiones externas de programación persistentes, usa
[ACP Agents](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el plugin OpenAI incluido
registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Si tu gateway se ejecuta bajo launchd/systemd y PATH es mínimo, agrega solo la
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
host de gateway, OpenClaw ahora carga automáticamente el plugin incluido propietario cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o en
`agents.defaults.cliBackends`.

## Uso como respaldo

Agrega un backend de CLI a tu lista de respaldos para que solo se ejecute cuando fallen los modelos principales:

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

- Si usas `agents.defaults.models` (lista de permitidos), debes incluir también allí los modelos de tu backend de CLI.
- Si el proveedor principal falla (autenticación, límites de tasa, tiempos de espera), OpenClaw
  probará después el backend de CLI.

## Resumen de configuración

Todos los backends de CLI viven en:

```
agents.defaults.cliBackends
```

Cada entrada está indexada por un **id de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
El id del proveedor pasa a ser el lado izquierdo de tu referencia de modelo:

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
          // Las CLI de estilo Codex pueden apuntar a un archivo de prompt en su lugar:
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
2. **Construye un prompt de sistema** usando el mismo prompt de OpenClaw + el contexto del espacio de trabajo.
3. **Ejecuta la CLI** con un id de sesión (si es compatible) para que el historial se mantenga coherente.
   El backend incluido `claude-cli` mantiene vivo un proceso stdio de Claude por cada
   sesión de OpenClaw y envía los turnos de seguimiento por stream-json stdin.
4. **Analiza la salida** (JSON o texto plano) y devuelve el texto final.
5. **Persiste los ids de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend incluido Anthropic `claude-cli` vuelve a ser compatible. Personal de Anthropic
nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata el uso de
`claude -p` como autorizado para esta integración, a menos que Anthropic publique
una nueva política.
</Note>

El backend incluido OpenAI `codex-cli` pasa el prompt de sistema de OpenClaw mediante
la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una marca de estilo Claude
`--append-system-prompt`, por lo que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada nueva sesión de Codex CLI.

El backend incluido Anthropic `claude-cli` recibe la instantánea de Skills de OpenClaw
de dos maneras: el catálogo compacto de Skills de OpenClaw en el prompt de sistema agregado, y
un Plugin temporal de Claude Code pasado con `--plugin-dir`. El Plugin contiene
solo los Skills aptos para ese agent/session, de modo que el resolvedor nativo de Skills de Claude Code
ve el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en
el prompt. Las anulaciones de env/API key de Skills siguen siendo aplicadas por OpenClaw al
entorno del proceso hijo para la ejecución.

Antes de que OpenClaw pueda usar el backend incluido `claude-cli`, Claude Code
debe haber iniciado sesión previamente en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude`
no esté ya en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establece `sessionArg` (por ejemplo, `--session-id`) o
  `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse
  en varias marcas.
- Si la CLI usa un **subcomando de reanudación** con marcas diferentes, establece
  `resumeArgs` (reemplaza `args` al reanudar) y opcionalmente `resumeOutput`
  (para reanudaciones que no sean JSON).
- `sessionMode`:
  - `always`: siempre envía un id de sesión (UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un id de sesión si ya había uno almacenado.
  - `none`: nunca envía un id de sesión.
- `claude-cli` usa por defecto `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso activo de Claude mientras
  siga activo. stdio en caliente es ahora el valor predeterminado, incluso para configuraciones personalizadas
  que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo
  finaliza, OpenClaw reanuda desde el id de sesión de Claude almacenado. Los ids de sesión almacenados
  se verifican contra una transcripción de proyecto legible existente antes de
  reanudar, de modo que las vinculaciones fantasma se eliminan con `reason=transcript-missing`
  en lugar de iniciar silenciosamente una nueva sesión de Claude CLI con `--resume`.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El reinicio implícito
  diario de la sesión no las corta; `/reset` y las políticas explícitas de `session.reset` sí lo hacen.

Notas de serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw descarta la reutilización de la sesión de CLI almacenada cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio en el id del perfil de autenticación, la API key estática, el token estático
  o la identidad de la cuenta OAuth cuando la CLI expone una. La rotación de los tokens de acceso y actualización
  de OAuth no corta la sesión de CLI almacenada. Si una CLI no expone un id de cuenta OAuth estable,
  OpenClaw permite que esa CLI aplique los permisos de reanudación.

## Imágenes (transferencia directa)

Si tu CLI acepta rutas de imágenes, establece `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá las imágenes base64 en archivos temporales. Si `imageArg` está establecido, esas
rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw agrega las
rutas de archivo al prompt (inyección de rutas), lo cual es suficiente para las CLI que cargan automáticamente
archivos locales a partir de rutas sin formato.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y
  el uso desde `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo, Codex CLI `--json`) y extrae el mensaje final del agent más los identificadores de sesión
  cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está establecido, se usa stdin.

## Valores predeterminados (propiedad del plugin)

El plugin OpenAI incluido también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El plugin Google incluido también registra un valor predeterminado para `google-gemini-cli`:

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

- El texto de respuesta se lee desde el campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no está presente o está vacío.
- `stats.cached` se normaliza en OpenClaw `cacheRead`.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
  `stats.input_tokens - stats.cached`.

Anula esto solo si es necesario (común: ruta `command` absoluta).

## Valores predeterminados propiedad del plugin

Los valores predeterminados del backend de CLI ahora forman parte de la superficie del plugin:

- Los plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend pasa a ser el prefijo del proveedor en las referencias de modelo.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue anulando el valor predeterminado del plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del plugin mediante el hook opcional
  `normalizeConfig`.

Los plugins que necesitan pequeños ajustes de compatibilidad de prompt/mensaje pueden declarar
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

`input` reescribe el prompt de sistema y el prompt de usuario pasados a la CLI. `output`
reescribe los deltas transmitidos del assistant y el texto final analizado antes de que OpenClaw procese
sus propios marcadores de control y la entrega del canal.

Para las CLI que emiten JSONL compatible con stream-json de Claude Code, establece
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones de MCP incluidas

Los backends de CLI **no** reciben directamente llamadas de herramientas de OpenClaw, pero un backend puede
optar por una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: anulaciones de configuración en línea para `mcp_servers`
- `google-gemini-cli`: archivo generado de ajustes del sistema de Gemini

Cuando bundle MCP está habilitado, OpenClaw:

- genera un servidor MCP HTTP de local loopback que expone herramientas del gateway al proceso de la CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas a la sesión, cuenta y contexto de canal actuales
- carga los servidores bundle-MCP habilitados para el espacio de trabajo actual
- los fusiona con cualquier forma existente de configuración/ajustes de MCP del backend
- reescribe la configuración de inicio usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un
backend opta por bundle MCP para que las ejecuciones en segundo plano permanezcan aisladas.

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas del gateway cuando optan por
  `bundleMcp: true`.
- **El streaming es específico del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta la salida.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), que es menos
  estructurada que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  con normalidad.

## Solución de problemas

- **CLI no encontrada**: establece `command` con una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para asignar `provider/model` → modelo de CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté configurado y de que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudarse con salida JSON).
- **Las imágenes se ignoran**: establece `imageArg` (y verifica que la CLI admita rutas de archivo).
