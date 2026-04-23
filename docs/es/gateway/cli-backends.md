---
read_when:
    - Quieres un fallback fiable cuando fallen los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente MCP de loopback local para el acceso a herramientas del backend de CLI
summary: 'Backends de CLI: fallback local de la CLI de IA con puente opcional de herramientas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-23T14:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

OpenClaw puede ejecutar **CLI de IA locales** como **fallback de solo texto** cuando los proveedores de API no están disponibles, tienen limitación de tasa o se comportan mal temporalmente. Esto es intencionadamente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true` pueden recibir herramientas del gateway mediante un puente MCP de loopback local.
- **Streaming JSONL** para CLI que lo admiten.
- **Las sesiones están admitidas** (para que los turnos de seguimiento sigan siendo coherentes).
- **Las imágenes pueden pasarse** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando quieras respuestas de texto “que siempre funcionen” sin depender de API externas.

Si quieres un runtime harness completo con controles de sesión ACP, tareas en segundo plano, vinculación de hilos/conversaciones y sesiones externas persistentes de programación, usa [ACP Agents](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido apto para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el Plugin OpenAI incluido registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Si tu gateway se ejecuta bajo launchd/systemd y PATH es mínimo, añade solo la ruta del comando:

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

Eso es todo. No hacen falta claves ni configuración extra de autenticación aparte de la propia CLI.

Si usas un backend de CLI incluido como **proveedor principal de mensajes** en un host de gateway, OpenClaw ahora carga automáticamente el Plugin incluido propietario cuando tu configuración hace referencia explícita a ese backend en una referencia de modelo o en `agents.defaults.cliBackends`.

## Usarlo como fallback

Añade un backend de CLI a tu lista de fallback para que solo se ejecute cuando fallen los modelos principales:

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

- Si usas `agents.defaults.models` (lista de permitidos), también debes incluir ahí los modelos de tu backend de CLI.
- Si falla el proveedor principal (autenticación, límites de tasa, tiempos de espera), OpenClaw intentará usar después el backend de CLI.

## Descripción general de configuración

Todos los backends de CLI viven en:

```
agents.defaults.cliBackends
```

Cada entrada está indexada por un **id de proveedor** (p. ej. `codex-cli`, `my-cli`).
El id de proveedor pasa a ser el lado izquierdo de tu referencia de modelo:

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
2. **Compila un prompt del sistema** usando el mismo prompt + contexto de espacio de trabajo de OpenClaw.
3. **Ejecuta la CLI** con un id de sesión (si se admite) para que el historial siga siendo coherente.
   El backend incluido `claude-cli` mantiene vivo un proceso stdio de Claude por sesión de OpenClaw y envía los turnos de seguimiento por stdin stream-json.
4. **Analiza la salida** (JSON o texto plano) y devuelve el texto final.
5. **Conserva ids de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend incluido Anthropic `claude-cli` vuelve a estar admitido. Personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, así que OpenClaw trata el uso de `claude -p` como autorizado para esta integración salvo que Anthropic publique una nueva política.
</Note>

El backend incluido OpenAI `codex-cli` pasa el prompt del sistema de OpenClaw mediante la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone un indicador de estilo Claude `--append-system-prompt`, así que OpenClaw escribe el prompt ensamblado en un archivo temporal para cada sesión nueva de Codex CLI.

El backend incluido Anthropic `claude-cli` recibe la instantánea de Skills de OpenClaw de dos formas: el catálogo compacto de Skills de OpenClaw en el prompt del sistema añadido, y un Plugin temporal de Claude Code pasado con `--plugin-dir`. El Plugin contiene solo las Skills aptas para ese agente/sesión, de modo que el resolvedor nativo de Skills de Claude Code vea el mismo conjunto filtrado que OpenClaw anunciaría de otro modo en el prompt. Las anulaciones de entorno/clave de API de las Skills siguen aplicándose por OpenClaw al entorno del proceso hijo para la ejecución.

## Sesiones

- Si la CLI admite sesiones, establece `sessionArg` (p. ej. `--session-id`) o `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse en varios indicadores.
- Si la CLI usa un **subcomando de reanudación** con indicadores distintos, establece `resumeArgs` (reemplaza `args` al reanudar) y opcionalmente `resumeOutput` (para reanudaciones que no sean JSON).
- `sessionMode`:
  - `always`: enviar siempre un id de sesión (nuevo UUID si no hay ninguno guardado).
  - `existing`: enviar un id de sesión solo si ya se guardó antes.
  - `none`: no enviar nunca un id de sesión.
- `claude-cli` usa por defecto `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso vivo de Claude mientras esté activo. El stdio caliente es ahora el valor predeterminado, incluso para configuraciones personalizadas que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo sale, OpenClaw reanuda desde el id de sesión de Claude guardado. Los ids de sesión guardados se verifican frente a una transcripción de proyecto existente y legible antes de reanudar, de modo que los vínculos fantasma se borran con `reason=transcript-missing` en lugar de iniciar silenciosamente una sesión nueva de Claude CLI bajo `--resume`.
- Las sesiones de CLI guardadas son continuidad propiedad del proveedor. El reinicio implícito diario de sesión no las corta; `/reset` y las políticas explícitas `session.reset` sí lo hacen.

Notas sobre serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw deja de reutilizar la sesión de CLI guardada cuando cambia la identidad de autenticación seleccionada, incluido un id de perfil de autenticación cambiado, una clave API estática, un token estático o la identidad de cuenta OAuth cuando la CLI expone una. La rotación de tokens OAuth de acceso y actualización no corta la sesión de CLI guardada. Si una CLI no expone un id estable de cuenta OAuth, OpenClaw deja que esa CLI aplique los permisos de reanudación.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imagen, establece `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá las imágenes base64 en archivos temporales. Si `imageArg` está configurado, esas rutas se pasarán como argumentos de la CLI. Si falta `imageArg`, OpenClaw añade las rutas de archivo al prompt (inyección de ruta), lo que basta para las CLI que cargan automáticamente archivos locales a partir de rutas simples.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y el uso desde `stats` cuando falta `usage` o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo Codex CLI `--json`) y extrae el mensaje final del agente más los identificadores de sesión cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como último argumento de la CLI.
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

Requisito previo: la CLI local de Gemini debe estar instalada y disponible como `gemini` en `PATH` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Notas sobre JSON de Gemini CLI:

- El texto de respuesta se lee del campo JSON `response`.
- El uso recurre a `stats` cuando `usage` falta o está vacío.
- `stats.cached` se normaliza a `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de `stats.input_tokens - stats.cached`.

Anúlalo solo si es necesario (caso común: ruta `command` absoluta).

## Valores predeterminados propiedad del Plugin

Los valores predeterminados de backend de CLI ahora forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend pasa a ser el prefijo de proveedor en las referencias de modelo.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue anulando el valor predeterminado del Plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del Plugin mediante el hook opcional `normalizeConfig`.

Los Plugins que necesiten pequeñas capas de compatibilidad de prompt/mensaje pueden declarar transformaciones de texto bidireccionales sin reemplazar un proveedor ni un backend de CLI:

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

`input` reescribe el prompt del sistema y el prompt del usuario pasados a la CLI. `output` reescribe los deltas transmitidos del asistente y el texto final analizado antes de que OpenClaw maneje sus propios marcadores de control y la entrega al canal.

Para CLI que emiten JSONL compatible con stream-json de Claude Code, establece `jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones de bundle MCP

Los backends de CLI **no** reciben llamadas a herramientas de OpenClaw directamente, pero un backend puede aceptar una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `codex-cli`: anulaciones de configuración en línea para `mcp_servers`
- `google-gemini-cli`: archivo generado de ajustes del sistema Gemini

Cuando bundle MCP está habilitado, OpenClaw:

- inicia un servidor MCP HTTP de loopback local que expone herramientas del gateway al proceso CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas a la sesión actual, la cuenta y el contexto de canal
- carga los servidores bundle-MCP habilitados para el espacio de trabajo actual
- los fusiona con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de inicio usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un backend acepta bundle MCP para que las ejecuciones en segundo plano sigan aisladas.

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en el protocolo del backend de CLI. Los backends solo ven herramientas del gateway cuando aceptan `bundleMcp: true`.
- **El streaming depende del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer hasta salir.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), que es menos estructurada que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando con normalidad.

## Solución de problemas

- **No se encuentra la CLI**: establece `command` con una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para mapear `provider/model` → modelo de la CLI.
- **No hay continuidad de sesión**: asegúrate de que `sessionArg` esté configurado y de que `sessionMode` no sea `none` (actualmente Codex CLI no puede reanudar con salida JSON).
- **Se ignoran las imágenes**: establece `imageArg` (y verifica que la CLI admita rutas de archivo).
