---
read_when:
    - Quieres una alternativa fiable cuando fallen los proveedores de API
    - Estás ejecutando CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente local loopback de MCP para el acceso de la herramienta de backend de la CLI
summary: 'CLI backends: reserva local de CLI de IA con puente opcional de herramientas MCP'
title: Backends de la CLI
x-i18n:
    generated_at: "2026-06-27T11:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw puede ejecutar **CLI de IA locales** como **fallback solo de texto** cuando los proveedores de API están caídos,
limitados por cuota o fallando temporalmente. Esto es intencionalmente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del gateway mediante un puente MCP de loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (para que los turnos de seguimiento mantengan la coherencia).
- **Las imágenes pueden pasarse directamente** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando
quieras respuestas de texto que "siempre funcionan" sin depender de API externas.

Si quieres un runtime de harness completo con controles de sesión ACP, tareas en segundo plano,
vinculación de hilos/conversaciones y sesiones externas de programación persistentes, usa
[Agentes ACP](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

<Tip>
  ¿Estás creando un nuevo plugin de backend? Usa
  [Plugins de backend de CLI](/es/plugins/cli-backend-plugins). Esta página es para usuarios
  que configuran y operan un backend ya registrado.
</Tip>

## Inicio rápido para principiantes

Puedes usar Claude Code CLI **sin ninguna configuración** (el plugin Anthropic incluido
registra un backend predeterminado):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` es el id de agente predeterminado cuando no se configura una lista explícita de agentes. Si
usas varios agentes, reemplázalo por el id del agente que quieres ejecutar.

Si tu gateway se ejecuta bajo launchd/systemd y PATH es mínimo, agrega solo la
ruta del comando:

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

Eso es todo. No hacen falta claves ni configuración de autenticación adicional más allá de la propia CLI.

Si usas un backend de CLI incluido como **proveedor principal de mensajes** en un
host de gateway, OpenClaw ahora carga automáticamente el plugin incluido propietario cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o en
`agents.defaults.cliBackends`.

## Usarlo como fallback

Agrega un backend de CLI a tu lista de fallback para que solo se ejecute cuando fallen los modelos principales:

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

Notas:

- Si usas `agents.defaults.models` (lista de permitidos), también debes incluir ahí tus modelos de backend de CLI.
- Si el proveedor principal falla (autenticación, límites de cuota, tiempos de espera), OpenClaw
  intentará después con el backend de CLI.

## Resumen de configuración

Todos los backends de CLI viven en:

```
agents.defaults.cliBackends
```

Cada entrada usa como clave un **id de proveedor** (por ejemplo, `claude-cli`, `my-cli`).
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cómo funciona

1. **Selecciona un backend** según el prefijo del proveedor (`claude-cli/...`).
2. **Crea un prompt de sistema** usando el mismo prompt de OpenClaw + contexto del espacio de trabajo.
3. **Ejecuta la CLI** con un id de sesión (si se admite) para que el historial se mantenga coherente.
   El backend `claude-cli` incluido mantiene vivo un proceso stdio de Claude por cada
   sesión de OpenClaw y envía los turnos de seguimiento por stdin stream-json.
4. **Analiza la salida** (JSON o texto plano) y devuelve el texto final.
5. **Persiste los ids de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend Anthropic `claude-cli` incluido vuelve a estar admitido. Personal de Anthropic
nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, así que OpenClaw trata
el uso de `claude -p` como autorizado para esta integración salvo que Anthropic publique
una nueva política.
</Note>

El backend Anthropic `claude-cli` incluido prefiere el resolvedor de skills nativo de Claude Code
para las Skills de OpenClaw. Cuando la instantánea actual de skills incluye al menos
una skill seleccionada con una ruta materializada, OpenClaw pasa un plugin temporal de Claude
Code con `--plugin-dir` y omite el catálogo duplicado de skills de OpenClaw
del prompt de sistema añadido. Si la instantánea no tiene ninguna skill de plugin materializada,
OpenClaw conserva el catálogo del prompt como fallback. Las anulaciones de entorno/API key
de skills siguen siendo aplicadas por OpenClaw al entorno del proceso hijo para la
ejecución.

Claude CLI también tiene su propio modo de permisos no interactivo. OpenClaw lo asigna
a la política exec existente en lugar de agregar configuración de política específica de Claude.
Para las sesiones Claude live gestionadas por OpenClaw, la política exec efectiva de OpenClaw es
autoritativa: YOLO (`tools.exec.security: "full"` y
`tools.exec.ask: "off"`) inicia Claude con
`--permission-mode bypassPermissions`, mientras que una política exec efectiva restrictiva
inicia Claude con `--permission-mode default`. Los ajustes por agente
`agents.list[].tools.exec` anulan `tools.exec` global para ese
agente. Los argumentos sin procesar del backend de Claude aún pueden incluir `--permission-mode`, pero los lanzamientos live
de Claude normalizan esa marca para que coincida con la política exec efectiva de OpenClaw.

El backend Anthropic `claude-cli` incluido también asigna los niveles `/think` de OpenClaw
a la marca nativa `--effort` de Claude Code para los niveles distintos de off. `minimal` y
`low` se asignan a `low`, `adaptive` y `medium` se asignan a `medium`, y `high`,
`xhigh` y `max` se asignan directamente. Otros backends de CLI necesitan que su plugin propietario
declare un asignador argv equivalente antes de que `/think` pueda afectar a la CLI generada.

Antes de que OpenClaw pueda usar el backend `claude-cli` incluido, Claude Code
ya debe haber iniciado sesión en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Las instalaciones de Docker necesitan que Claude Code esté instalado y con sesión iniciada dentro del home persistido
del contenedor, no solo en el host. Consulta
[Backend Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).

Usa `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude`
todavía no esté en `PATH`.

## Sesiones

- Si la CLI admite sesiones, establece `sessionArg` (por ejemplo, `--session-id`) o
  `sessionArgs` (placeholder `{sessionId}`) cuando el ID deba insertarse
  en varias flags.
- Si la CLI usa un **subcomando de reanudación** con flags diferentes, establece
  `resumeArgs` (reemplaza `args` al reanudar) y opcionalmente `resumeOutput`
  (para reanudaciones no JSON).
- `sessionMode`:
  - `always`: envía siempre un id de sesión (nuevo UUID si no hay ninguno almacenado).
  - `existing`: envía un id de sesión solo si ya había uno almacenado.
  - `none`: nunca envía un id de sesión.
- `claude-cli` usa de forma predeterminada `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que los turnos de seguimiento reutilicen el proceso Claude live mientras
  está activo. Stdio cálido es ahora el valor predeterminado, incluso para configuraciones personalizadas
  que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo
  sale, OpenClaw reanuda desde el id de sesión de Claude almacenado. Los ids de sesión
  almacenados se verifican contra una transcripción de proyecto existente y legible antes de
  reanudar, de modo que las vinculaciones fantasma se limpian con `reason=transcript-missing`
  en lugar de iniciar silenciosamente una nueva sesión de Claude CLI con `--resume`.
- Las sesiones Claude live mantienen guardas acotadas de salida JSONL. Los valores predeterminados permiten hasta
  8 MiB y 20.000 líneas JSONL sin procesar por turno. Los turnos de Claude con muchas herramientas pueden aumentarlas
  por backend con
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  y `maxTurnLines`; OpenClaw limita esos ajustes a 64 MiB y 100.000
  líneas.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El restablecimiento diario implícito de sesión
  no las corta; `/reset` y las políticas explícitas `session.reset` aún
  lo hacen.
- Las sesiones nuevas de CLI normalmente se reseembran solo desde el resumen de Compaction de OpenClaw
  más la cola posterior a la compaction. Para recuperar sesiones cortas que se invalidan
  antes de la Compaction, un backend puede optar por esto con
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw todavía mantiene acotada la
  resembra desde transcripción sin procesar y la limita a invalidaciones seguras, como transcripciones
  de CLI faltantes, cambios de prompt de sistema/MCP o reintento por sesión expirada; los cambios de
  perfil de autenticación o de época de credenciales nunca reseembran historial de transcripción sin procesar.

Notas de serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un carril de proveedor.
- OpenClaw descarta la reutilización de sesiones de CLI almacenadas cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio de id de perfil de autenticación, API key estática, token estático o identidad de cuenta
  OAuth cuando la CLI expone una. La rotación de tokens OAuth de acceso y refresco
  no corta la sesión de CLI almacenada. Si una CLI no expone un
  id de cuenta OAuth estable, OpenClaw deja que esa CLI aplique los permisos de reanudación.

## Preludio de fallback desde sesiones claude-cli

Cuando un intento de `claude-cli` hace failover a un candidato que no es CLI en
[`agents.defaults.model.fallbacks`](/es/concepts/model-failover), OpenClaw siembra
el siguiente intento con un preludio de contexto extraído de la transcripción JSONL local
de Claude Code en `~/.claude/projects/`. Sin esta semilla, el proveedor de fallback
empezaría en frío porque la transcripción de sesión propia de OpenClaw está vacía
para ejecuciones de `claude-cli`.

- El preludio prefiere el resumen `/compact` más reciente o el marcador `compact_boundary`,
  luego añade los turnos posteriores al límite más recientes hasta un presupuesto de caracteres.
  Los turnos previos al límite se descartan porque el resumen ya los representa.
- Los bloques de herramientas se fusionan en pistas compactas `(tool call: name)` y
  `(tool result: …)` para mantener honesto el presupuesto del prompt. El resumen se
  etiqueta como `(truncated)` si se desborda.
- Los fallbacks de `claude-cli` a `claude-cli` del mismo proveedor dependen del propio
  `--resume` de Claude y omiten el preludio.
- La semilla reutiliza la validación existente de ruta de archivo de sesión de Claude, así que
  no se pueden leer rutas arbitrarias.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imagen, establece `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá imágenes base64 en archivos temporales. Si `imageArg` está establecido, esas
rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw añade las
rutas de archivo al prompt (inyección de ruta), lo cual basta para las CLI que cargan automáticamente
archivos locales desde rutas en texto plano.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + id de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta desde `response` y el uso
  desde `stats` cuando `usage` falta o está vacío. El valor predeterminado incluido de Gemini CLI
  usa `stream-json`, pero las anulaciones antiguas `--output-format json` siguen usando el
  analizador JSON.
- `output: "jsonl"` analiza streams JSONL y extrae el mensaje final del agente más los
  identificadores de sesión cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como el último argumento de la CLI.
- `input: "stdin"` envía el prompt mediante stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está definido, se usa stdin.

## Valores predeterminados (propiedad del Plugin)

Los valores predeterminados de los backends de CLI incluidos viven con su Plugin propietario. Por ejemplo,
Anthropic posee `claude-cli` y Google posee `google-gemini-cli`. Las ejecuciones de agentes OpenAI Codex
usan el arnés app-server de Codex mediante `openai/*`; OpenClaw ya no
registra un backend `codex-cli` incluido.

El Plugin Anthropic incluido registra un valor predeterminado para `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

El Plugin Google incluido también registra un valor predeterminado para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Requisito previo: la CLI local de Gemini debe estar instalada y disponible como
`gemini` en `PATH` (`brew install gemini-cli` o
`npm install -g @google/gemini-cli`).

Notas sobre la salida de Gemini CLI:

- El analizador `stream-json` predeterminado lee eventos `message` del asistente, eventos de herramientas,
  uso final de `result` y eventos de error fatal de Gemini.
- Si sobrescribes los argumentos de Gemini a `--output-format json`, OpenClaw normaliza ese
  backend de vuelta a `output: "json"` y lee el texto de respuesta desde el campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío.
- `stats.cached` se normaliza en OpenClaw como `cacheRead`.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
  `stats.input_tokens - stats.cached`.

Sobrescribe solo si es necesario (común: ruta absoluta de `command`).

## Valores predeterminados propiedad del Plugin

Los valores predeterminados de los backends de CLI ahora forman parte de la superficie del Plugin:

- Los Plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración de usuario en `agents.defaults.cliBackends.<id>` sigue sobrescribiendo el valor predeterminado del Plugin.
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

`input` reescribe el prompt del sistema y el prompt de usuario que se pasan a la CLI. `output`
reescribe los deltas transmitidos del asistente y el texto final analizado antes de que OpenClaw gestione
sus propios marcadores de control y la entrega por canal.

Para las CLI que emiten eventos JSONL específicos del proveedor, define `jsonlDialect` en la
configuración de ese backend. Los dialectos admitidos son `claude-stream-json` para flujos compatibles con Claude
Code y `gemini-stream-json` para eventos `stream-json` de Gemini CLI.

## Propiedad de Compaction nativa

Algunos backends de CLI ejecutan un agente que compacta su **propia** transcripción, por lo que OpenClaw no debe
ejecutar su resumidor de protección contra ellos; hacerlo entra en conflicto con la Compaction propia del backend
y puede hacer que el turno falle por completo.

`claude-cli` no tiene endpoint de arnés: Claude Code compacta internamente, por lo que declara
`ownsNativeCompaction: true`, y OpenClaw devuelve una operación sin efecto desde la ruta de Compaction.
Las sesiones con arnés nativo, como Codex, siguen enrutándose a su endpoint de Compaction del arnés
en su lugar.

Como el backend posee la Compaction, la solución provisional anterior de definir
`contextTokens: 1_000_000` solo para impedir que la protección de OpenClaw se activara en una
sesión de claude-cli **ya no es necesaria**; la exclusión la reemplaza.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declara `ownsNativeCompaction` solo para un backend que realmente posea su Compaction: debe
limitar de forma fiable su propia transcripción cuando se acerca a su ventana de contexto y persistir una
sesión reanudable (por ejemplo, `--resume` / `--session-id`); de lo contrario, una sesión diferida puede
permanecer por encima del presupuesto. Las sesiones con `agentHarnessId` coincidente siguen enrutándose al endpoint del arnés.

## Superposiciones MCP del paquete

Los backends de CLI **no** reciben llamadas a herramientas de OpenClaw directamente, pero un backend puede
optar por usar una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento incluido actual:

- `claude-cli`: archivo de configuración MCP estricto generado
- `google-gemini-cli`: archivo de configuración del sistema Gemini generado

Cuando bundle MCP está habilitado, OpenClaw:

- inicia un servidor MCP HTTP local loopback que expone herramientas de Gateway al proceso de la CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas a la sesión, cuenta y contexto de canal actuales
- carga los servidores bundle-MCP habilitados para el workspace actual
- los fusiona con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de lanzamiento usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw aun así inyecta una configuración estricta cuando un
backend opta por bundle MCP para que las ejecuciones en segundo plano permanezcan aisladas.

Los runtimes MCP incluidos con alcance de sesión se cachean para reutilizarlos dentro de una sesión y luego
se recolectan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (predeterminado: 10
minutos; define `0` para deshabilitarlo). Las ejecuciones incrustadas de un solo uso, como sondeos de autenticación,
generación de slugs y solicitudes de recuperación de Active Memory, se limpian al final de la ejecución para que los hijos
stdio y los flujos Streamable HTTP/SSE no sobrevivan a la ejecución.

## Límite de historial de reinicialización

Cuando una sesión nueva de CLI se inicializa desde una transcripción previa de OpenClaw (por
ejemplo, después de un reintento por `session_expired`), el bloque
`<conversation_history>` renderizado se limita para evitar que los prompts de reinicialización
crezcan sin control. El valor predeterminado es `12288` caracteres (unos 3000 tokens).

Los backends de Claude CLI usan automáticamente un límite mayor derivado del nivel de contexto
Claude resuelto. Las ejecuciones estándar de Claude con 200K tokens conservan un fragmento de transcripción
mayor, y las ejecuciones Claude de 1M tokens conservan un fragmento aún mayor, mientras que otros backends de CLI
mantienen el valor predeterminado conservador.

- El límite solo rige el bloque de historial previo del prompt de reinicialización. Los límites de salida
  de sesiones activas se ajustan por separado en `reliability.outputLimits`
  (consulta [Sesiones](#sessions)).

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas a herramientas en
  el protocolo del backend de CLI. Los backends solo ven herramientas de Gateway cuando optan por
  `bundleMcp: true`.
- **El streaming es específico del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta salir.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.

## Solución de problemas

- **CLI no encontrada**: define `command` como una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para mapear `provider/model` → modelo de CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté definido y de que `sessionMode` no sea
  `none`.
- **Imágenes ignoradas**: define `imageArg` (y verifica que la CLI admita rutas de archivo).

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
