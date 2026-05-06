---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, medios, Skills)
    - Configuración del enrutamiento multiagente y las vinculaciones
    - Ajuste del comportamiento de la sesión, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados de agentes, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-05-06T17:55:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0467260ad61f3d2a0b52cd952154d617a9341a588cdeda38f54bfae5985fa4f
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, runtime del Gateway y otras
claves de nivel superior, consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de agentes

### `agents.defaults.workspace`

Predeterminado: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raíz de repositorio opcional que se muestra en la línea Runtime del prompt del sistema. Si no se establece, OpenClaw la detecta automáticamente ascendiendo desde el workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predeterminada opcional de Skills para agentes que no establecen
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Establece `agents.list[].skills: []` para no permitir Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del workspace mientras sigue escribiendo los archivos de bootstrap requeridos. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Controla cuándo se inyectan los archivos de bootstrap del workspace en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del workspace, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva el bootstrap del workspace y la inyección de archivos de contexto en cada turno. Úsalo solo para agentes que controlan por completo el ciclo de vida de su prompt (motores de contexto personalizados, runtimes nativos que construyen su propio contexto o flujos de trabajo especializados sin bootstrap). Los turnos de Heartbeat y recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo de bootstrap del workspace antes del truncamiento. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos de bootstrap del workspace. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el aviso visible para el agente en el prompt del sistema cuando se trunca el contexto de bootstrap.
Predeterminado: `"once"`.

- `"off"`: nunca inyectar texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyectar un aviso conciso una vez por cada firma de truncamiento única (recomendado).
- `"always"`: inyectar un aviso conciso en cada ejecución cuando exista truncamiento.

Los recuentos sin procesar/inyectados detallados y los campos de ajuste de configuración permanecen en diagnósticos como
informes de contexto/estado y registros; el contexto rutinario de usuario/runtime de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad de presupuestos de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y se
dividen intencionalmente por subsistema en lugar de pasar todos por un único
control genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección normal del bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio de una sola vez para la ejecución del modelo en reset/inicio, incluidos archivos recientes diarios
  `memory/*.md`. Los comandos de chat simples `/new` y `/reset` se
  reconocen sin invocar el modelo.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos acotados en runtime y bloques inyectados propiedad del runtime.
- `memory.qmd.limits.*`:
  tamaño del fragmento de búsqueda de memoria indexada y de la inyección.

Usa la anulación por agente correspondiente solo cuando un agente necesita un
presupuesto diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones del modelo de reset/inicio.
Los comandos de chat simples `/new` y `/reset` reconocen el reset sin invocar
el modelo, por lo que no cargan este preludio.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valores predeterminados compartidos para superficies de contexto de runtime acotadas.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de añadir los metadatos de truncamiento
  y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: límite de resultados de herramientas en vivo usado para resultados persistidos y
  recuperación de desbordamiento.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md usado durante la inyección de actualización posterior a Compaction.

#### `agents.list[].contextLimits`

Anulación por agente para los controles compartidos de `contextLimits`. Los campos omitidos heredan
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Límite global para la lista compacta de Skills inyectada en el prompt del sistema. Esto
no afecta la lectura de archivos `SKILL.md` bajo demanda.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Anulación por agente para el presupuesto del prompt de Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imágenes de transcripción/herramienta antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de la solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Recurre a la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el prompt del sistema. Predeterminado: `auto` (preferencia del SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La forma de cadena establece solo el modelo principal.
  - La forma de objeto establece el principal más modelos de conmutación por error ordenados.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de la herramienta `image` lo usa como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere referencias explícitas `provider/model`. Los identificadores sin prefijo se aceptan por compatibilidad; si un identificador sin prefijo coincide de forma única con una entrada configurada con capacidad de imagen en `models.providers.*.models`, OpenClaw lo califica con ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/Plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación de imágenes nativa de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, o `openai/gpt-image-1.5` para salida OpenAI PNG/WebP con fondo transparente.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación de proveedor correspondiente (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de imágenes registrados restantes en orden de id de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de música registrados restantes en orden de id de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API de proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de video registrados restantes en orden de id de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API de proveedor correspondiente.
  - El proveedor incluido de generación de video Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo usa para el enrutamiento de modelos.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: páginas máximas predeterminadas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramienta de borrador de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (añade comando/detalle sin procesar cuando está disponible). `agents.list[].toolProgressDetail` por agente anula este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente anula este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos Gateway de operador administrador cuando no se establece una anulación de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo, `openai/gpt-5.5` para acceso con clave de API u `openai-codex/gpt-5.5` para Codex OAuth). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos, salvo que pases `--replace`.
  - Los flujos de configuración/onboarding con ámbito de proveedor fusionan los modelos de proveedor seleccionados en este mapa y conservan proveedores no relacionados que ya estén configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para anular el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros predeterminados globales de proveedor aplicados a todos los modelos. Se establece en `agents.defaults.params` (por ejemplo, `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) es anulado por `agents.defaults.models["provider/model"].params` (por modelo), luego `agents.list[].params` (id de agente coincidente) anula por clave. Consulta [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener detalles.
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo fusionado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo adicional gana; las rutas de completions no nativas aún eliminan después `store` exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI fusionados en cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con thinking desactivado, el Plugin vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito anula los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene precedencia final. Para controles de thinking de Qwen en vLLM, establece `params.qwenThinkingFormat` en `"chat-template"` o `"top-level"` en esa entrada de modelo.
- `compat.supportedReasoningEfforts`: lista de esfuerzos de razonamiento compatibles con OpenAI por modelo. Incluye `"xhigh"` para endpoints personalizados que realmente lo acepten; OpenClaw entonces expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend necesita un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: opción de participación solo de Z.AI para thinking conservado. Cuando está habilitada y thinking está activado, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` anterior; consulta [Thinking y thinking conservado de Z.AI](/es/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: política predeterminada de runtime de agente de bajo nivel. El id omitido usa de forma predeterminada OpenClaw Pi. Usa `id: "pi"` para forzar el arnés PI integrado, `id: "auto"` para permitir que arneses de Plugin registrados reclamen modelos compatibles y usar PI cuando ninguno coincida, un id de arnés registrado como `id: "codex"` para exigir ese arnés, o un alias de backend de CLI compatible como `id: "claude-cli"`. Los runtimes de Plugin explícitos fallan en modo cerrado cuando el arnés no está disponible o falla. Mantén las referencias de modelo canónicas como `provider/model`; selecciona Codex, Claude CLI, Gemini CLI y otros backends de ejecución mediante la configuración de runtime en lugar de prefijos de proveedor de runtime heredados. Consulta [Runtimes de agente](/es/concepts/agent-runtimes) para ver en qué difiere esto de la selección de proveedor/modelo.
- Los escritores de configuración que modifican estos campos (por ejemplo, `/models set`, `/models set-image` y comandos para añadir/eliminar respaldos) guardan la forma de objeto canónica y conservan las listas de respaldos existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controla qué ejecutor de bajo nivel ejecuta los turnos de agente. La mayoría de las
implementaciones deberían mantener el runtime predeterminado OpenClaw Pi. Úsalo cuando un
Plugin de confianza proporcione un arnés nativo, como el arnés de servidor de aplicaciones Codex incluido,
o cuando quieras un backend de CLI compatible como Claude CLI. Para el modelo
mental, consulta [Runtimes de agente](/es/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un id de arnés de Plugin registrado o un alias de backend de CLI compatible. El Plugin Codex incluido registra `codex`; el Plugin Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que arneses de Plugin registrados reclamen turnos compatibles y usa PI cuando ningún arnés coincide. Un runtime de Plugin explícito como `id: "codex"` requiere ese arnés y falla en modo cerrado si no está disponible o falla.
- Anulación de entorno: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` anula `id` para ese proceso.
- Para implementaciones solo con Codex, establece `model: "openai/gpt-5.5"` y `agentRuntime.id: "codex"`.
- Para implementaciones con Claude CLI, prefiere `model: "anthropic/claude-opus-4-7"` más `agentRuntime.id: "claude-cli"`. Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` aún funcionan por compatibilidad, pero la configuración nueva debería mantener canónica la selección de proveedor/modelo y colocar el backend de ejecución en `agentRuntime.id`.
- Las claves de política de runtime anteriores son reescritas a `agentRuntime` por `openclaw doctor --fix`.
- La elección de arnés queda fijada por id de sesión después de la primera ejecución integrada. Los cambios de configuración/entorno afectan a sesiones nuevas o restablecidas, no a una transcripción existente. Las sesiones heredadas con historial de transcripción pero sin pin registrado se tratan como fijadas a PI. `/status` informa el runtime efectivo, por ejemplo `Runtime: OpenClaw Pi Default` o `Runtime: OpenAI Codex`.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de medios, visión, PDF, música, video y TTS siguen usando sus ajustes de proveedor/modelo.

**Abreviaturas de alias integradas** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Tus alias configurados siempre tienen prioridad sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x habilitan automáticamente el modo de razonamiento a menos que establezcas `--thinking off` o definas `agents.defaults.models["zai/<model>"].params.thinking` por tu cuenta.
Los modelos Z.AI habilitan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Establece `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para deshabilitarlo.
Los modelos Anthropic Claude 4.6 usan de forma predeterminada el razonamiento `adaptive` cuando no se establece un nivel de razonamiento explícito.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones de reserva solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI priorizan el texto; las herramientas siempre están deshabilitadas.
- Las sesiones son compatibles cuando `sessionArg` está establecido.
- El paso directo de imágenes es compatible cuando `imageArg` acepta rutas de archivo.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el prompt del sistema ensamblado por OpenClaw por una cadena fija. Establécelo en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; se ignora un valor vacío o que solo contenga espacios en blanco. Útil para experimentos de prompt controlados.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido entre proveedores; `personality` controla solo la capa de estilo de interacción amable.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (predeterminado) y `"on"` habilitan la capa de estilo de interacción amable.
- `"off"` deshabilita solo la capa amable; el contrato de comportamiento GPT-5 etiquetado permanece habilitado.
- El valor heredado `plugins.entries.openai.config.personality` todavía se lee cuando esta configuración compartida no está establecida.

### `agents.defaults.heartbeat`

Ejecuciones periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Establécelo en `0m` para deshabilitarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de Heartbeat antes de abortarlo. Déjalo sin establecer para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destinos directos. `block` suprime la entrega a destinos directos y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. El mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el costo de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se aplazan en vías ocupadas adicionales: trabajo de subagente o de comandos anidados. Las vías de Cron siempre aplazan los Heartbeats, incluso sin esta marca.
- Por agente: establece `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos completos de agente; los intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin de proveedor de Compaction registrado. Cuando está establecido, se llama a `summarize()` del proveedor en lugar del resumen LLM integrado. Vuelve al comportamiento integrado si falla. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de Compaction antes de que OpenClaw la aborte. Valor predeterminado: `900`.
- `keepRecentTokens`: presupuesto de punto de corte de Pi para conservar textualmente la cola más reciente de la transcripción. `/compact` manual respeta esto cuando se establece explícitamente; de lo contrario, la Compaction manual es un punto de control estricto.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone la guía integrada de retención de identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida mal formada para resúmenes de salvaguarda. Habilitado de forma predeterminada en modo de salvaguarda; establece `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas de Pi. Cuando `enabled: true`, OpenClaw comprueba la presión de contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, aborta el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de precomprobación existente para truncar resultados de herramientas o compactar y reintentar. Funciona con los modos de Compaction `default` y `safeguard`. Valor predeterminado: deshabilitado.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para volver a inyectar después de la Compaction. El valor predeterminado es `["Session Startup", "Red Lines"]`; establece `[]` para deshabilitar la reinyección. Cuando no está establecido o se establece explícitamente en ese par predeterminado, los encabezados antiguos `Every Session`/`Safety` también se aceptan como reserva heredada.
- `model`: anulación opcional `provider/model-id` solo para el resumen de Compaction. Úsalo cuando la sesión principal deba mantener un modelo, pero los resúmenes de Compaction deban ejecutarse en otro; cuando no está establecido, la Compaction usa el modelo principal de la sesión.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la Compaction local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una Compaction correcta pueda rotar a una transcripción sucesora más pequeña. Deshabilitado cuando no está establecido o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando comienza la Compaction y cuando se completa (por ejemplo, "Compactando contexto..." y "Compaction completa"). Deshabilitado de forma predeterminada para mantener la Compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la Compaction automática para almacenar memorias duraderas. Establece `model` en un proveedor/modelo exacto como `ollama/qwen3:8b` cuando este turno de mantenimiento deba permanecer en un modelo local; la anulación no hereda la cadena de reserva de la sesión activa. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Recorta **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita pasadas de recorte.
- `ttl` controla con qué frecuencia puede volver a ejecutarse el recorte (después del último contacto con la caché).
- El recorte primero aplica soft-trim a resultados de herramientas sobredimensionados y luego aplica hard-clear a resultados de herramientas más antiguos si es necesario.

**Soft-trim** conserva el inicio + el final e inserta `...` en el medio.

**Hard-clear** reemplaza todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes de asistente, se omite el recorte.

</Accordion>

Consulta [Recorte de sesión](/es/concepts/session-pruning) para obtener detalles del comportamiento.

### Streaming de bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Anulaciones por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan de forma predeterminada `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500ms. Anulación por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para obtener detalles del comportamiento y la fragmentación.

### Indicadores de escritura

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Anulaciones por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente integrado. Consulta [Aislamiento](/es/gateway/sandboxing) para ver la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalles del aislamiento">

**Backend:**

- `docker`: entorno de ejecución local de Docker (predeterminado)
- `ssh`: entorno de ejecución remoto genérico respaldado por SSH
- `openshell`: entorno de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del entorno de ejecución se mueven a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por alcance
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos en línea o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del entorno de ejecución de secretos antes de que se inicie la sesión aislada

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o recrearlo
- luego mantiene el espacio de trabajo SSH remoto como canónico
- enruta `exec`, las herramientas de archivos y las rutas multimedia por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador aislados

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo aislado por alcance bajo `~/.openclaw/sandboxes`
- `ro`: espacio de trabajo aislado en `/workspace`, espacio de trabajo del agente montado en modo solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado en modo lectura/escritura en `/workspace`

**Alcance:**

- `session`: contenedor + espacio de trabajo por sesión
- `agent`: un contenedor + espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo de OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de exec y sincroniza de vuelta después de exec; el espacio de trabajo local permanece como canónico
- `remote`: inicializa el remoto una vez cuando se crea el aislamiento y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales del host hechas fuera de OpenClaw no se sincronizan automáticamente con el aislamiento después del paso de inicialización.
El transporte es SSH hacia el aislamiento de OpenShell, pero el plugin controla el ciclo de vida del aislamiento y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: establécelo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada, a menos que establezcas explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ruptura de emergencia).

**Los adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador aislado** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. La URL de noVNC se inyecta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador de noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL de token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones aisladas apunten al navegador del host.
- `network` usa `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Establécelo en `bridge` solo cuando quieras explícitamente conectividad bridge global.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador aislado. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de inicio se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts de contenedores:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado de forma predeterminada)
  - `--disable-3d-apis`, `--disable-software-rasterizer` y `--disable-gpu` están
    habilitados de forma predeterminada y se pueden deshabilitar con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar las extensiones si tu flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` se puede cambiar con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establece `0` para usar el límite
    de procesos predeterminado de Chromium.
  - además de `--no-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen del contenedor; usa una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` son exclusivos de Docker.

Compila imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalaciones npm sin un checkout del código fuente, consulta [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

### `agents.list` (anulaciones por agente)

Usa `agents.list[].tts` para dar a un agente su propio proveedor, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se fusiona en profundidad sobre el
`messages.tts` global, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras que los
agentes individuales anulan solo los campos de voz o proveedor que necesitan. La anulación del agente activo
se aplica a las respuestas habladas automáticas, `/tts audio`, `/tts status` y
la herramienta de agente `tts`. Consulta [Texto a voz](/es/tools/tts#per-agent-voice-overrides)
para ver ejemplos de proveedores y la precedencia.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id de agente estable (obligatorio).
- `default`: cuando se configuran varios, gana el primero (se registra una advertencia). Si no se configura ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena establece un primario estricto por agente sin alternativa de modelo; la forma de objeto `{ primary }` también es estricta salvo que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para activar alternativas para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo sobrescriben `primary` siguen heredando las alternativas predeterminadas salvo que configures `fallbacks: []`.
- `params`: parámetros de flujo por agente fusionados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Úsalo para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se fusiona en profundidad sobre `messages.tts`, así que mantén las credenciales compartidas del proveedor y la política de alternativas en `messages.tts` y configura aquí solo valores específicos de la personalidad, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista opcional de Skills permitidas por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de fusionarlos, y `[]` significa sin Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se configura ninguna sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se configura ninguna sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no se configura ninguna sobrescritura de modo rápido por mensaje o sesión.
- `agentRuntime`: sobrescritura opcional de política de runtime de bajo nivel por agente. Usa `{ id: "codex" }` para hacer que un agente sea solo Codex mientras otros agentes mantienen la alternativa Pi predeterminada en modo `auto`.
- `runtime`: descriptor de runtime opcional por agente. Usa `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar por defecto sesiones del entorno de ejecución ACP.
- `identity.avatar`: ruta relativa al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` desde `emoji`, `mentionPatterns` desde `name`/`emoji`.
- `subagents.allowAgents`: lista permitida de ids de agente para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = cualquiera; predeterminado: solo el mismo agente). Incluye el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismas.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es verdadero, bloquea las llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; predeterminado: falso).

---

## Enrutamiento multiagente

Ejecuta varios agentes aislados dentro de un Gateway. Consulta [Multiagente](/es/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de coincidencia de bindings

- `type` (opcional): `route` para enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para bindings de conversación ACP persistentes.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico del canal)
- `acp` (opcional; solo para `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden de coincidencia determinista:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin peer/guild/team)
5. `match.accountId: "*"` (en todo el canal)
6. Agente predeterminado

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de binding de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sin acceso al sistema de archivos (solo mensajería)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para obtener detalles sobre la precedencia.

---

## Sesión

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalles de los campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una única sesión (úsalo solo cuando se quiera un contexto compartido).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aísla por id de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulta [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de reinicio. `daily` reinicia a la hora local `atHour`; `idle` reinicia después de `idleMinutes`. Cuando ambos están configurados, gana el que venza primero. La vigencia del reinicio diario usa `sessionStartedAt` de la fila de sesión; la vigencia del reinicio por inactividad usa `lastInteractionAt`. Las escrituras en segundo plano o de eventos del sistema, como Heartbeat, activaciones de Cron, notificaciones de ejecución y contabilidad del Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias o por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). El valor heredado `dm` se acepta como alias de `direct`.
- **`mainKey`**: campo heredado. En tiempo de ejecución siempre se usa `"main"` para el contenedor principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta entre agentes durante intercambios de agente a agente (entero, rango: `0`–`5`). `0` desactiva el encadenamiento de ping-pong.
- **`sendPolicy`**: coincidencia por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `warn` emite solo advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`). En tiempo de ejecución, la limpieza se escribe por lotes con un pequeño búfer de marca alta para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establece `false` para desactivarlo.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos o sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor predeterminado maestro (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: edad máxima estricta predeterminada en horas (`0` desactiva; los proveedores pueden anularlo)
  - `spawnSessions`: puerta predeterminada para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. El valor predeterminado es `true` cuando los enlaces de hilos están habilitados; los proveedores o cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado de subagente para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefijo de respuesta

Sobrescrituras por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (gana lo más específico): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción                    | Ejemplo                     |
| ----------------- | ------------------------------ | --------------------------- |
| `{model}`         | Nombre corto del modelo        | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor           | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual   | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de acuse

- Usa de forma predeterminada `identity.emoji` del agente activo; de lo contrario, `"👀"`. Define `""` para desactivar.
- Sobrescrituras por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → valor de reserva de la identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina el acuse después de la respuesta en canales compatibles con reacciones, como Slack, Discord, Telegram, WhatsApp y BlueBubbles.
- `messages.statusReactions.enabled`: habilita las reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, dejarlo sin definir mantiene habilitadas las reacciones de estado cuando las reacciones de acuse están activas.
  En Telegram, defínelo explícitamente como `true` para habilitar las reacciones de estado del ciclo de vida.

### Antirrebote de entrada

Agrupa mensajes rápidos solo de texto del mismo remitente en un único turno del agente. Los medios/adjuntos se vacían inmediatamente. Los comandos de control omiten el antirrebote.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controla el modo de TTS automática predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está activado de forma predeterminada; `modelOverrides.allowProvider` tiene `false` como valor predeterminado (activación explícita).
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos son propiedad del Plugin. Si `plugins.allow` está definido, incluye cada Plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El id de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de TTS de OpenAI. El orden de resolución es la configuración, luego `OPENAI_TTS_BASE_URL` y luego `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor de TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Habla

Valores predeterminados del modo Habla (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Habla.
- Las claves planas heredadas de Habla (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los ID de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas de texto plano u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` se aplica solo cuando no hay ninguna clave de API de Habla configurada.
- `providers.*.voiceAliases` permite que las directivas de Habla usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el ayudante MLX local de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el ayudante `openclaw-mlx-tts` incluido cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del ayudante para desarrollo.
- `speechLocale` establece el id de configuración regional BCP 47 usado por el reconocimiento de voz de Habla en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Habla después del silencio del usuario antes de enviar la transcripción. Si no se define, se mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
