---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, contenido multimedia, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajustar el comportamiento de la sesión, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados del agente, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-05-11T20:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, runtime del Gateway y otras
claves de nivel superior, consulta la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de agente

### `agents.defaults.workspace`

Predeterminado: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos predeterminada opcional de Skills para agentes que no definen
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
- Define `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía de `agents.list[].skills` es el conjunto final para ese agente; no se
  combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de inicialización del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del espacio de trabajo y sigue escribiendo los archivos de inicialización requeridos. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla cuándo se inyectan los archivos de inicialización del espacio de trabajo en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección de la inicialización del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction aún reconstruyen el contexto.
- `"never"`: desactiva la inicialización del espacio de trabajo y la inyección de archivos de contexto en cada turno. Usa esto solo para agentes que controlan por completo su ciclo de vida de prompts (motores de contexto personalizados, runtimes nativos que construyen su propio contexto o flujos de trabajo especializados sin inicialización). Los turnos de Heartbeat y de recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo de inicialización del espacio de trabajo antes del truncamiento. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos de inicialización del espacio de trabajo. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el aviso visible para el agente en el prompt del sistema cuando se trunca el contexto de inicialización.
Predeterminado: `"once"`.

- `"off"`: nunca inyectar texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyectar un aviso conciso una vez por firma de truncamiento única (recomendado).
- `"always"`: inyectar un aviso conciso en cada ejecución cuando existe truncamiento.

Los conteos sin procesar/inyectados detallados y los campos de ajuste de configuración permanecen en diagnósticos como
informes de contexto/estado y registros; el contexto de usuario/runtime rutinario de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionadamente por subsistema en lugar de pasar todos por una única
perilla genérica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección normal de inicialización del espacio de trabajo.
- `agents.defaults.startupContext.*`:
  preludio de ejecución del modelo de reinicio/arranque de una sola vez, incluidos archivos diarios recientes
  `memory/*.md`. Los comandos de chat simples `/new` y `/reset` se
  reconocen sin invocar el modelo.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos acotados de runtime y bloques inyectados propiedad del runtime.
- `memory.qmd.limits.*`:
  tamaño de fragmento de búsqueda de memoria indexada e inyección.

Usa la anulación por agente correspondiente solo cuando un agente necesita un
presupuesto diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de arranque del primer turno inyectado en ejecuciones del modelo de reinicio/arranque.
Los comandos de chat simples `/new` y `/reset` reconocen el reinicio sin invocar
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

- `memoryGetMaxChars`: límite predeterminado de extracto de `memory_get` antes de que se añadan los
  metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: límite de resultado de herramienta en vivo usado para resultados persistidos y
  recuperación de desbordamiento.
- `postCompactionMaxChars`: límite de extracto de AGENTS.md usado durante la inyección de actualización
  posterior a Compaction.

#### `agents.list[].contextLimits`

Anulación por agente para las perillas compartidas de `contextLimits`. Los campos omitidos heredan
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

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imagen de transcript/herramienta antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de carga útil de la solicitud para ejecuciones con muchas capturas de pantalla.
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

Formato de hora en el prompt del sistema. Predeterminado: `auto` (preferencia del sistema operativo).

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
  - La forma de objeto establece el modelo principal más los modelos de conmutación por error ordenados.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento alternativo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere referencias explícitas `provider/model`. Los ID sin prefijo se aceptan por compatibilidad; si un ID sin prefijo coincide de forma única con una entrada configurada compatible con imágenes en `models.providers.*.models`, OpenClaw lo califica con ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/Plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación de imágenes nativa de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, u `openai/gpt-image-1.5` para salida PNG/WebP de OpenAI con fondo transparente.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación del proveedor correspondiente (por ejemplo `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de imágenes en orden de id de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de música en orden de id de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de video en orden de id de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave de API del proveedor correspondiente.
  - El proveedor integrado de generación de video Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la herramienta `pdf` para el enrutamiento de modelos.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `pdfMaxBytesMb`: límite de tamaño PDF predeterminado para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas consideradas por el modo alternativo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramientas de borrador de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (agrega comando/detalle sin procesar cuando esté disponible). `agents.list[].toolProgressDetail` por agente sobrescribe este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente sobrescribe este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos de gateway de administrador-operador cuando no se establece una sobrescritura de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej. `openai/gpt-5.5` para acceso con clave de API de OpenAI o Codex OAuth). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa entradas `provider/*` como `"openai-codex/*": {}` o `"vllm/*": {}` para mostrar todos los modelos descubiertos para proveedores seleccionados sin listar manualmente cada id de modelo.
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para agregar entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos a menos que pases `--replace`.
  - Los flujos de configuración/incorporación con alcance de proveedor fusionan los modelos de proveedor seleccionados en este mapa y conservan los proveedores no relacionados que ya estaban configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para sobrescribir el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros globales predeterminados del proveedor aplicados a todos los modelos. Se establece en `agents.defaults.params` (p. ej. `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) se sobrescribe con `agents.defaults.models["provider/model"].params` (por modelo), luego `agents.list[].params` (id de agente coincidente) sobrescribe por clave. Consulta [almacenamiento en caché de prompts](/es/reference/prompt-caching) para más detalles.
- `params.extra_body`/`params.extraBody`: JSON avanzado de transferencia directa fusionado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo adicional gana; las rutas de completions no nativas siguen eliminando después `store`, exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI fusionados en cuerpos de solicitud `api: "openai-completions"` de nivel superior. Para `vllm/nemotron-3-*` con pensamiento desactivado, el Plugin vLLM integrado envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito sobrescribe los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene precedencia final. Para controles de pensamiento Qwen de vLLM, establece `params.qwenThinkingFormat` en `"chat-template"` o `"top-level"` en esa entrada de modelo.
- `compat.thinkingFormat`: estilo de carga útil de pensamiento compatible con OpenAI. Usa `"qwen"` para `enable_thinking` de nivel superior al estilo Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. OpenClaw asigna el pensamiento deshabilitado a `false` y el pensamiento habilitado a `true`.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento por modelo compatible con OpenAI. Incluye `"xhigh"` para endpoints personalizados que realmente lo aceptan; OpenClaw entonces expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend quiere un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: opción de inclusión exclusiva de Z.AI para pensamiento preservado. Cuando está habilitada y el pensamiento está activado, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` anterior; consulta [pensamiento y pensamiento preservado de Z.AI](/es/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestor de procesos opcional a nivel de proveedor para servidores de modelos locales/autohospedados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw comprueba `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint está caído, espera hasta `readyTimeoutMs` y luego envía la solicitud de modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw sale; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos de inactividad. Consulta [servicios de modelos locales](/es/gateway/local-model-services).
- La política de runtime pertenece a proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas de modelo. Los modelos de agente de OpenAI en el proveedor oficial de OpenAI seleccionan Codex de forma predeterminada.
- Los escritores de configuración que mutan estos campos (por ejemplo `/models set`, `/models set-image` y comandos para agregar/eliminar alternativas) guardan la forma canónica de objeto y conservan las listas de alternativas existentes cuando sea posible.
- `maxConcurrent`: ejecuciones máximas de agentes en paralelo entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### Política de runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un id de harness de Plugin registrado o un alias de backend de CLI compatible. El Plugin Codex integrado registra `codex`; el Plugin Anthropic integrado proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los harnesses de Plugin registrados reclamen turnos compatibles y usa PI cuando ningún harness coincide. Un runtime de Plugin explícito como `id: "codex"` requiere ese harness y falla de forma cerrada si no está disponible o falla.
- Las claves de runtime de agente completo son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, las fijaciones de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` son ignoradas por la selección de runtime. Ejecuta `openclaw doctor --fix` para eliminar valores obsoletos.
- Los modelos de agente de OpenAI usan el harness Codex de forma predeterminada; `agentRuntime.id: "codex"` de proveedor/modelo sigue siendo válido cuando quieres hacerlo explícito.
- Para despliegues de Claude CLI, prefiere `model: "anthropic/claude-opus-4-7"` más `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` siguen funcionando por compatibilidad, pero la configuración nueva debe mantener canónica la selección de proveedor/modelo y poner el backend de ejecución en la política de runtime de proveedor/modelo.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de medios, visión, PDF, música, video y TTS siguen usando sus ajustes de proveedor/modelo.

**Atajos de alias integrados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Los alias configurados siempre tienen prioridad sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento a menos que configures `--thinking off` o definas `agents.defaults.models["zai/<model>"].params.thinking` por tu cuenta.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas a herramientas. Configura `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para deshabilitarlo.
Los modelos Anthropic Claude 4.6 usan de forma predeterminada el razonamiento `adaptive` cuando no se establece un nivel explícito de razonamiento.

### `agents.defaults.cliBackends`

Backends CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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

- Los backends CLI priorizan el texto; las herramientas siempre están deshabilitadas.
- Las sesiones son compatibles cuando se establece `sessionArg`.
- El paso directo de imágenes es compatible cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas seguras desde una cola acotada de transcripción sin procesar de OpenClaw antes de que exista el primer resumen de compaction. Los cambios de perfil de autenticación o de época de credenciales aun así nunca se vuelven a sembrar desde datos sin procesar.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el prompt del sistema ensamblado por OpenClaw con una cadena fija. Configúralo en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; un valor vacío o solo con espacios en blanco se ignora. Útil para experimentos de prompt controlados.

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

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos. Los identificadores de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido entre proveedores; `personality` controla solo la capa de estilo de interacción amistosa.

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

- `"friendly"` (predeterminado) y `"on"` habilitan la capa de estilo de interacción amistosa.
- `"off"` deshabilita solo la capa amistosa; el contrato de comportamiento etiquetado de GPT-5 permanece habilitado.
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

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Configúralo como `0m` para deshabilitarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de bootstrap. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente Heartbeat antes de abortarlo. Déjalo sin establecer para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destinos directos. `block` suprime la entrega a destinos directos y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de bootstrap ligero y conservan solo `HEARTBEAT.md` de los archivos de bootstrap del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Usa el mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el costo de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se difieren en carriles ocupados adicionales: trabajo de subagente o de comandos anidados. Los carriles Cron siempre difieren los Heartbeats, incluso sin esta marca.
- Por agente: configura `agents.list[].heartbeat`. Cuando algún agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos completos de agente: los intervalos más cortos consumen más tokens.

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
- `provider`: identificador de un Plugin proveedor de compaction registrado. Cuando se establece, se llama al `summarize()` del proveedor en lugar de usar el resumen de LLM integrado. Recurre al integrado en caso de fallo. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de compaction antes de que OpenClaw la aborte. Valor predeterminado: `900`.
- `keepRecentTokens`: presupuesto de punto de corte de Pi para conservar textualmente la cola más reciente de la transcripción. `/compact` manual respeta esto cuando se establece explícitamente; de lo contrario, la compaction manual es un punto de control estricto.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone la guía integrada de retención de identificadores opacos durante el resumen de compaction.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida mal formada para resúmenes safeguard. Habilitado de forma predeterminada en modo safeguard; configura `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas de Pi. Cuando `enabled: true`, OpenClaw comprueba la presión del contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, aborta el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de precomprobación existente para truncar resultados de herramientas o compactar y reintentar. Funciona con los modos de compaction `default` y `safeguard`. Valor predeterminado: deshabilitado.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de la compaction. El valor predeterminado es `["Session Startup", "Red Lines"]`; configura `[]` para deshabilitar la reinyección. Cuando no está establecido o se establece explícitamente en ese par predeterminado, los encabezados antiguos `Every Session`/`Safety` también se aceptan como alternativa heredada.
- `model`: anulación opcional `provider/model-id` solo para el resumen de compaction. Usa esto cuando la sesión principal deba conservar un modelo pero los resúmenes de compaction deban ejecutarse en otro; cuando no está establecido, la compaction usa el modelo principal de la sesión.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la compaction local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una compaction correcta pueda rotar a una transcripción sucesora más pequeña. Deshabilitado cuando no está establecido o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando comienza la compaction y cuando se completa (por ejemplo, "Compacting context..." y "Compaction complete"). Deshabilitado de forma predeterminada para mantener la compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la autocompaction para almacenar memorias duraderas. Configura `model` como un proveedor/modelo exacto, como `ollama/qwen3:8b`, cuando este turno de mantenimiento deba permanecer en un modelo local; la anulación no hereda la cadena de reserva de la sesión activa. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Poda **resultados de herramientas antiguos** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco.

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

- `mode: "cache-ttl"` habilita pasadas de poda.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la poda (después del último toque de caché).
- La poda primero recorta de forma suave los resultados de herramientas sobredimensionados y luego borra por completo los resultados de herramientas más antiguos si es necesario.

**Recorte suave** conserva el inicio + el final e inserta `...` en el medio.

**Borrado completo** reemplaza todo el resultado de herramienta por el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes de asistente, se omite la poda.

</Accordion>

Consulta [Poda de sesión](/es/concepts/session-pruning) para obtener detalles del comportamiento.

### Transmisión en bloques

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

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas en bloque.
- Sobrescrituras de canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan `minChars: 1500` de forma predeterminada.
- `humanDelay`: pausa aleatoria entre respuestas en bloque. `natural` = 800-2500 ms. Sobrescritura por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para ver los detalles de comportamiento y fragmentación.

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
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento en sandbox opcional para el agente integrado. Consulta [Aislamiento en sandbox](/es/gateway/sandboxing) para ver la guía completa.

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

<Accordion title="Detalles de sandbox">

**Backend:**

- `docker`: runtime local de Docker (predeterminado)
- `ssh`: runtime remoto genérico respaldado por SSH
- `openshell`: runtime de OpenShell

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del runtime se mueven a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por ámbito
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos inline o SecretRefs que OpenClaw materializa en archivos temporales en runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que se inicie la sesión de sandbox

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o recrearlo
- luego mantiene canónico el espacio de trabajo SSH remoto
- enruta `exec`, herramientas de archivos y rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador de sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de sandbox por ámbito bajo `~/.openclaw/sandboxes`
- `ro`: espacio de trabajo de sandbox en `/workspace`, espacio de trabajo del agente montado como solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado con lectura/escritura en `/workspace`

**Ámbito:**

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

**Modo OpenShell:**

- `mirror`: inicializa el remoto desde local antes de exec, sincroniza de vuelta después de exec; el espacio de trabajo local sigue siendo canónico
- `remote`: inicializa el remoto una vez cuando se crea el sandbox y luego mantiene canónico el espacio de trabajo remoto

En modo `remote`, las ediciones locales del host hechas fuera de OpenClaw no se sincronizan automáticamente con el sandbox después del paso de inicialización.
El transporte es SSH hacia el sandbox de OpenShell, pero el plugin controla el ciclo de vida del sandbox y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: cámbialo a `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada a menos que establezcas explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (uso excepcional).

**Los adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los binds globales y por agente se fusionan.

**Navegador en sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. URL de noVNC inyectada en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en sandbox apunten al navegador del host.
- `network` usa `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Cámbialo a `bridge` solo cuando quieras conectividad bridge global explícitamente.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador de sandbox. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
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
    habilitados de forma predeterminada y pueden deshabilitarse con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar las extensiones si tu flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establece `0` para usar el límite
    de procesos predeterminado de Chromium.
  - además de `--no-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen de contenedor; usa una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador en sandbox y `sandbox.docker.binds` son exclusivos de Docker.

Compila imágenes (desde un checkout de código fuente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalaciones de npm sin checkout de código fuente, consulta [Aislamiento en sandbox § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` inline.

### `agents.list` (sobrescrituras por agente)

Usa `agents.list[].tts` para dar a un agente su propio proveedor de TTS, voz, modelo,
estilo o modo auto-TTS. El bloque del agente se fusiona en profundidad sobre
`messages.tts`, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras los agentes
individuales sobrescriben solo los campos de voz o proveedor que necesitan. La sobrescritura del agente activo
se aplica a respuestas habladas automáticas, `/tts audio`, `/tts status` y
la herramienta de agente `tts`. Consulta [Texto a voz](/es/tools/tts#per-agent-voice-overrides)
para ver ejemplos de proveedores y precedencia.

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
- `model`: la forma de cadena establece un primario estricto por agente sin fallback de modelo; la forma de objeto `{ primary }` también es estricta a menos que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para habilitar fallback en ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos de Cron que solo sobrescriben `primary` siguen heredando los fallbacks predeterminados a menos que configures `fallbacks: []`.
- `params`: parámetros de stream por agente fusionados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Usa esto para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se fusiona en profundidad sobre `messages.tts`, así que mantén las credenciales compartidas del proveedor y la política de fallback en `messages.tts`, y configura aquí solo valores específicos de la persona, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista de permisos opcional de Skill por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de fusionarse, y `[]` significa sin skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se configura ninguna sobrescritura por mensaje o por sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` conserva el pensamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se configura ninguna sobrescritura de razonamiento por mensaje o por sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no se configura ninguna sobrescritura de modo rápido por mensaje o por sesión.
- `models`: catálogo de modelos/sobrescrituras de runtime opcionales por agente indexados por ids completos `provider/model`. Usa `models["provider/model"].agentRuntime` para excepciones de runtime por agente.
- `runtime`: descriptor de runtime opcional por agente. Usa `type: "acp"` con valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar sesiones del arnés ACP de forma predeterminada.
- `identity.avatar`: ruta relativa al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` desde `emoji`, `mentionPatterns` desde `name`/`emoji`.
- `subagents.allowAgents`: lista de permisos de ids de agente para destinos explícitos `sessions_spawn.agentId` (`["*"]` = cualquiera; valor predeterminado: solo el mismo agente). Incluye el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; valor predeterminado: false).

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

### Campos de coincidencia de vinculación

- `type` (opcional): `route` para el enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para vinculaciones de conversación ACP persistentes.
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

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de vinculación de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin sandbox)">

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

<Accordion title="Herramientas de solo lectura + workspace">

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

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver detalles de precedencia.

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

<Accordion title="Detalles de campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes en un contexto de canal comparten una única sesión (úsalo solo cuando se pretenda un contexto compartido).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aislar por id de remitente entre canales.
  - `per-channel-peer`: aislar por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aislar por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos dock, como `/dock_discord`, usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulta [Anclaje de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` se restablece a la hora local `atHour`; `idle` se restablece después de `idleMinutes`. Cuando ambos están configurados, vence el que expire primero. La frescura del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la frescura del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras en segundo plano o de eventos del sistema, como Heartbeat, despertares Cron, notificaciones de ejecución y contabilidad del Gateway, pueden actualizar `updatedAt`, pero no mantienen frescas las sesiones diarias o por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). Se acepta el `dm` heredado como alias de `direct`.
- **`mainKey`**: campo heredado. En tiempo de ejecución siempre se usa `"main"` para el depósito principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta de ida y vuelta entre agentes durante intercambios de agente a agente (entero, rango: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincidencia por `channel`, `chatType` (`direct|group|channel`, con el alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `warn` solo emite advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`). En tiempo de ejecución, la limpieza por lotes se escribe con un pequeño búfer de marca alta para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establece `false` para desactivarlo.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza de presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor predeterminado maestro (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: edad máxima absoluta predeterminada en horas (`0` desactiva; los proveedores pueden anularlo)
  - `spawnSessions`: puerta predeterminada para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y creaciones de hilos ACP. El valor predeterminado es `true` cuando las vinculaciones de hilos están activadas; los proveedores/cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado del subagente para creaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

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

Anulaciones por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (gana la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción                  | Ejemplo                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor         | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- De forma predeterminada usa `identity.emoji` del agente activo; si no existe, `"👀"`. Establece `""` para desactivar.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina la confirmación después de responder en canales con capacidad de reacción como Slack, Discord, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: activa reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, si no está configurado, mantiene activadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Telegram, establécelo explícitamente en `true` para activar las reacciones de estado del ciclo de vida.

### Antirrebote de entrada

Agrupa mensajes rápidos de solo texto del mismo remitente en un único turno del agente. Los medios/adjuntos se envían inmediatamente. Los comandos de control omiten el antirrebote.

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

- `auto` controla el modo automático predeterminado de TTS: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está activado de forma predeterminada; `modelOverrides.allowProvider` tiene el valor predeterminado `false` (activación opcional).
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos son propiedad del Plugin. Si se establece `plugins.allow`, incluye cada Plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. Se acepta el id de proveedor heredado `edge` como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint TTS de OpenAI. El orden de resolución es configuración, luego `OPENAI_TTS_BASE_URL`, luego `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Conversación

Valores predeterminados para el modo Conversación (macOS/iOS/Android).

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Conversación.
- Las claves planas heredadas de Conversación (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los ids de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- El respaldo de `ELEVENLABS_API_KEY` se aplica solo cuando no hay ninguna clave de API de Conversación configurada.
- `providers.*.voiceAliases` permite que las directivas de Conversación usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el asistente MLX local de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción MLX de macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento para la ejecución completa del agente OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real de Conversación de la interfaz de control. Déjalo sin establecer para conservar el comportamiento normal de sesión/modelo.
- `consultFastMode` establece una anulación de modo rápido de un solo uso para consultas en tiempo real de Conversación de la interfaz de control sin cambiar la configuración normal de modo rápido de la sesión.
- `speechLocale` establece el id de locale BCP 47 usado por el reconocimiento de voz de Conversación de iOS/macOS. Déjalo sin establecer para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto espera el modo Conversación después del silencio del usuario antes de enviar la transcripción. Si no se establece, conserva la ventana de pausa predeterminada de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` agrega instrucciones de sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw, de modo que el estilo de voz pueda configurarse sin perder la guía predeterminada de `openclaw_agent_consult`.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
