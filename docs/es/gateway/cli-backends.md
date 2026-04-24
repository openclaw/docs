---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI locales de IA y quieres reutilizarlas
    - Quieres entender el puente MCP local loopback para el acceso a herramientas desde el backend de CLI
summary: 'Backends de CLI: alternativa local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-24T05:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime alternativo)

OpenClaw puede ejecutar **CLI locales de IA** como una **alternativa solo de texto** cuando los proveedores de API no están disponibles,
están limitados por cuota o se comportan mal temporalmente. Esto es intencionadamente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del gateway mediante un puente MCP local loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (para que los turnos de seguimiento sigan siendo coherentes).
- **Las imágenes pueden pasarse** si la CLI acepta rutas de imágenes.

Está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando
quieras respuestas de texto “que siempre funcionen” sin depender de API externas.

Si quieres un runtime completo con controles de sesión ACP, tareas en segundo plano,
vinculación de hilos/conversaciones y sesiones externas persistentes de programación, usa
[Agentes ACP](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el plugin incluido de OpenAI
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

Eso es todo. No se necesitan claves ni configuración adicional de autenticación aparte de la propia CLI.

Si usas un backend de CLI incluido como **proveedor principal de mensajes** en un
host del gateway, OpenClaw ahora carga automáticamente el plugin incluido correspondiente cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o en
`agents.defaults.cliBackends`.

## Usarlo como alternativa

Añade un backend de CLI a tu lista de alternativas para que solo se ejecute cuando fallen los modelos principales:

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

- Si usas `agents.defaults.models` (lista de permitidos), también debes incluir ahí los modelos de tu backend de CLI.
- Si el proveedor principal falla (autenticación, límites de velocidad, tiempos de espera), OpenClaw
  probará a continuación con el backend de CLI.

## Resumen de configuración

Todos los backends de CLI viven en:

```text
agents.defaults.cliBackends
```

Cada entrada está indexada por un **id de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
El id del proveedor se convierte en la parte izquierda de la referencia de modelo:

```text
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
2. **Construye un prompt del sistema** usando el mismo prompt + contexto de espacio de trabajo de OpenClaw.
3. **Ejecuta la CLI** con un id de sesión (si es compatible) para mantener un historial coherente.
   El backend incluido `claude-cli` mantiene un proceso stdio de Claude activo por
   sesión de OpenClaw y envía los turnos de seguimiento por stdin stream-json.
4. **Analiza la salida** (JSON o texto sin formato) y devuelve el texto final.
5. **Conserva ids de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend incluido `claude-cli` de Anthropic vuelve a ser compatible. Personal de Anthropic
nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que OpenClaw trata
el uso de `claude -p` como autorizado para esta integración salvo que Anthropic publique
una política nueva.
</Note>

El backend incluido `codex-cli` de OpenAI pasa el prompt del sistema de OpenClaw
mediante la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una marca al estilo de Claude
`--append-system-prompt`, por lo que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada sesión nueva de Codex CLI.

El backend incluido `claude-cli` de Anthropic recibe la instantánea de Skills de OpenClaw
de dos formas: el catálogo compacto de Skills de OpenClaw en el prompt del sistema anexado, y
un plugin temporal de Claude Code pasado con `--plugin-dir`. El plugin contiene
solo las Skills elegibles para ese agente/sesión, por lo que el resolvedor nativo de Skills de Claude Code ve el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en el prompt. Las anulaciones de env/clave de API de Skills siguen siendo aplicadas por OpenClaw al entorno del proceso hijo para la ejecución.

Claude CLI también tiene su propio modo no interactivo de permisos. OpenClaw lo asigna
a la política de ejecución existente en lugar de añadir configuración específica de Claude: cuando la
política de ejecución efectiva solicitada es YOLO (`tools.exec.security: "full"` y
`tools.exec.ask: "off"`), OpenClaw añade `--permission-mode bypassPermissions`.
La configuración `agents.list[].tools.exec` por agente anula `tools.exec` global para
ese agente. Para forzar un modo distinto de Claude, establece argumentos sin procesar explícitos del backend
como `--permission-mode default` o `--permission-mode acceptEdits` en
`agents.defaults.cliBackends.claude-cli.args` y los correspondientes `resumeArgs`.

Antes de que OpenClaw pueda usar el backend incluido `claude-cli`, Claude Code
ya debe haber iniciado sesión en el mismo host:

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
  - `existing`: solo envía un id de sesión si ya se almacenó antes.
  - `none`: nunca envía un id de sesión.
- `claude-cli` usa de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"`
  e `input: "stdin"`, por lo que los turnos de seguimiento reutilizan el proceso activo de Claude mientras
  esté activo. El stdio persistente es ahora el valor predeterminado, incluso para configuraciones personalizadas
  que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo
  termina, OpenClaw reanuda desde el id de sesión de Claude almacenado. Los ids de sesión almacenados se verifican frente a una transcripción de proyecto existente y legible antes
  de reanudar, por lo que las vinculaciones fantasma se limpian con `reason=transcript-missing`
  en lugar de iniciar silenciosamente una sesión nueva de Claude CLI con `--resume`.
- Las sesiones CLI almacenadas son continuidad propiedad del proveedor. El restablecimiento diario implícito
  de sesión no las corta; `/reset` y las políticas explícitas de `session.reset` sí lo hacen.

Notas sobre serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril por proveedor.
- OpenClaw descarta la reutilización de sesiones CLI almacenadas cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio del id del perfil de autenticación, clave de API estática, token estático o identidad de cuenta OAuth cuando la CLI expone una. La rotación de token de acceso y de actualización de OAuth no corta la sesión CLI almacenada. Si una CLI no expone un id estable de cuenta OAuth, OpenClaw deja que esa CLI imponga los permisos de reanudación.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imágenes, establece `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá imágenes base64 en archivos temporales. Si `imageArg` está establecido, esas
rutas se pasan como argumentos de la CLI. Si falta `imageArg`, OpenClaw añade las
rutas de archivo al prompt (inyección de ruta), lo cual es suficiente para las CLI que cargan automáticamente
archivos locales a partir de rutas simples.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y
  el uso de `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo Codex CLI `--json`) y extrae el mensaje final del agente más
  identificadores de sesión cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como último argumento de la CLI.
- `input: "stdin"` envía el prompt por stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está establecido, se usa stdin.

## Valores predeterminados (propiedad del plugin)

El plugin incluido de OpenAI también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El plugin incluido de Google también registra un valor predeterminado para `google-gemini-cli`:

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

- El texto de respuesta se lee del campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío.
- `stats.cached` se normaliza como `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
  `stats.input_tokens - stats.cached`.

Anula solo si es necesario (lo más común: ruta absoluta de `command`).

## Valores predeterminados propiedad del plugin

Los valores predeterminados de backend de CLI ahora forman parte de la superficie del plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue anulando el valor predeterminado del plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del plugin mediante el hook opcional `normalizeConfig`.

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

`input` reescribe el prompt del sistema y el prompt del usuario que se pasan a la CLI. `output`
reescribe los deltas del asistente en streaming y el texto final analizado antes de que OpenClaw procese
sus propios marcadores de control y la entrega por canal.

Para CLI que emitan JSONL compatible con stream-json de Claude Code, establece
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones MCP incluidas

Los backends de CLI **no** reciben directamente llamadas a herramientas de OpenClaw, pero un backend puede
activar una superposición generada de configuración MCP con `bundleMcp: true`.

Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: anulaciones de configuración en línea para `mcp_servers`; el
  servidor local loopback generado de OpenClaw se marca con el modo de aprobación por servidor de herramientas de Codex
  para que las llamadas MCP no se bloqueen por solicitudes locales de aprobación
- `google-gemini-cli`: archivo generado de configuración del sistema de Gemini

Cuando MCP incluido está habilitado, OpenClaw:

- inicia un servidor MCP HTTP local loopback que expone herramientas del gateway al proceso de la CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas al contexto actual de sesión, cuenta y canal
- carga los servidores MCP de bundle habilitados para el espacio de trabajo actual
- los combina con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de arranque usando el modo de integración propiedad del backend desde la extensión correspondiente

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un
backend activa MCP incluido, para que las ejecuciones en segundo plano permanezcan aisladas.

## Limitaciones

- **No hay llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas del gateway cuando activan
  `bundleMcp: true`.
- **El streaming depende del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta finalizar.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), lo cual es menos
  estructurado que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  normalmente.

## Solución de problemas

- **CLI no encontrada**: establece `command` con una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para mapear `provider/model` → modelo de CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté configurado y de que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudar con salida JSON).
- **Imágenes ignoradas**: establece `imageArg` (y verifica que la CLI admita rutas de archivo).

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
