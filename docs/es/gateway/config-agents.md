---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, medios, Skills)
    - Configuración de enrutamiento y vinculaciones multiagente
    - Ajustar la sesión, la entrega de mensajes y el comportamiento del modo de conversación
summary: Valores predeterminados del agente, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-06T10:49:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c9f5c0cee452a223ca4aab91edd58127cb7b52d905012a86ff45e57261524a8
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, runtime de Gateway y otras
claves de nivel superior, consulta la [Referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados del agente

### `agents.defaults.workspace`

Predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está definido; de lo contrario, `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está definido en un perfil no predeterminado).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Usa la variable de entorno para apuntar los agentes
predeterminados a un espacio de trabajo montado cuando no quieras escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz de repositorio opcional que se muestra en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente subiendo desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos de Skills predeterminada opcional para agentes que no definen
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Define `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía de `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos bootstrap del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del espacio de trabajo, sin dejar de escribir los archivos bootstrap requeridos (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla cuándo se inyectan los archivos bootstrap del espacio de trabajo en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva el bootstrap del espacio de trabajo y la inyección de archivos de contexto en cada turno. Úsalo solo para agentes que controlan por completo el ciclo de vida de su prompt (motores de contexto personalizados, runtimes nativos que construyen su propio contexto o flujos de trabajo especializados sin bootstrap). Los turnos de Heartbeat y recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Sobrescritura por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del espacio de trabajo antes del truncamiento. Predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Sobrescritura por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos bootstrap del espacio de trabajo. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Sobrescritura por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Sobrescrituras de perfil bootstrap por agente

Usa sobrescrituras de perfil bootstrap por agente cuando un agente necesita un comportamiento de
inyección de prompt diferente de los valores predeterminados compartidos. Los campos omitidos heredan de
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el aviso visible para el agente en el prompt del sistema cuando el contexto bootstrap se trunca.
Predeterminado: `"always"`.

- `"off"`: nunca inyectar texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyectar un aviso conciso una vez por firma de truncamiento única.
- `"always"`: inyectar un aviso conciso en cada ejecución cuando exista truncamiento (recomendado).

Los conteos detallados sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
informes y registros de contexto/estado; el contexto rutinario de usuario/runtime de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y se
dividen intencionalmente por subsistema en lugar de pasar todos por un único
control genérico.

| Presupuesto                                                   | Cubre                                                                                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inyección normal del bootstrap del espacio de trabajo                                                                                                      |
| `agents.defaults.startupContext.*`                            | Preludio de ejecución única de modelo al restablecer/iniciar, incluidos archivos recientes diarios `memory/*.md`. Los chats simples `/new` y `/reset` se reconocen sin invocar el modelo |
| `skills.limits.*`                                             | La lista compacta de Skills inyectada en el prompt del sistema                                                                                             |
| `agents.defaults.contextLimits.*`                             | Extractos acotados de runtime y bloques inyectados propiedad del runtime                                                                                   |
| `memory.qmd.limits.*`                                         | Fragmento indexado de búsqueda de memoria y dimensionamiento de inyección                                                                                  |

Sobrescrituras por agente correspondientes:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en las ejecuciones de modelo al restablecer/iniciar.
Los comandos simples de chat `/new` y `/reset` reconocen el restablecimiento sin invocar
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

Valores predeterminados compartidos para superficies acotadas de contexto de runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: límite predeterminado del extracto `memory_get` antes de que se añadan
  metadatos de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: techo avanzado de resultados de herramientas en vivo usado para resultados
  persistidos y recuperación de desbordamiento. Déjalo sin definir para el límite automático de contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres con 100K+ tokens y `64000`
  caracteres con 200K+ tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue estando limitado a alrededor del 30 % de
  la ventana de contexto del modelo. `openclaw doctor --deep` imprime el límite efectivo,
  y doctor solo advierte cuando una sobrescritura explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md usado durante la inyección de actualización
  posterior a Compaction.

#### `agents.list[].contextLimits`

Sobrescritura por agente para los controles compartidos de `contextLimits`. Los campos omitidos heredan
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // techo avanzado para este agente
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
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Sobrescritura por agente para el presupuesto de prompt de Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles para el lado más largo de la imagen en bloques de imagen de transcript/herramienta antes de llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga de solicitud para ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de herramientas de imagen para imágenes cargadas desde rutas de archivo, URLs y referencias multimedia.
Predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imagen seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL y los modelos alojados de visión Llama 4 pueden usar imágenes más grandes que las rutas de visión antiguas/predeterminadas de alto detalle, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en modo `auto` para controlar el coste de tokens y latencia.

Valores:

- `auto`: adaptarse a los límites del modelo y al número de imágenes.
- `efficient`: preferir imágenes más pequeñas para menor uso de tokens y bytes.
- `balanced`: usar la escala estándar intermedia.
- `high`: conservar más detalle para capturas de pantalla, diagramas e imágenes de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
      utilityModel: "openai/gpt-5.4-mini",
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La forma de cadena establece solo el modelo principal.
  - La forma de objeto establece el principal más modelos de conmutación por error ordenados.
- `utilityModel`: referencia o alias opcional `provider/model` para tareas internas breves. Actualmente impulsa los títulos de sesión generados de Control UI, los títulos de tema de DM de Telegram y los títulos automáticos de hilos de Discord. Estas tareas recurren al modelo principal del agente cuando no se configura; `agents.list[].utilityModel` reemplaza el valor predeterminado, y una anulación de modelo específica de la operación tiene prioridad sobre ambos. Las tareas utilitarias hacen llamadas de modelo separadas y envían contenido específico de la tarea al proveedor de modelo seleccionado. La generación de títulos del panel envía como máximo los primeros 1.000 caracteres del primer mensaje que no sea de comando. Elige un proveedor que coincida con tus requisitos de costo y tratamiento de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de herramienta `image` lo usa como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere referencias explícitas `provider/model`. Los identificadores simples se aceptan por compatibilidad; si un identificador simple coincide de forma única con una entrada configurada con capacidad de imagen en `models.providers.*.models`, OpenClaw lo califica para ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/Plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación de imágenes nativa de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, o `openai/gpt-image-1.5` para salida OpenAI PNG/WebP con fondo transparente.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación de proveedor correspondiente (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de imágenes en orden de identificador de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de música en orden de identificador de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de video en orden de identificador de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
  - El Plugin oficial de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo usa para el enrutamiento de modelo.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramientas de borrador de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (anexa comando/detalle sin procesar cuando esté disponible). `agents.list[].toolProgressDetail` por agente reemplaza este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente reemplaza este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos Gateway de operador administrador cuando no se establece ninguna anulación de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej., `openai/gpt-5.5` para clave de API de OpenAI o acceso mediante Codex OAuth). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese identificador exacto de modelo, y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, por lo que es preferible usar `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa entradas `provider/*` como `"openai/*": {}` o `"vllm/*": {}` para mostrar todos los modelos descubiertos para proveedores seleccionados sin listar manualmente cada identificador de modelo.
  - Agrega `agentRuntime` a una entrada `provider/*` cuando todos los modelos descubiertos dinámicamente para ese proveedor deban usar el mismo tiempo de ejecución. La política de tiempo de ejecución exacta `provider/model` sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para agregar entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos a menos que pases `--replace`.
  - Los flujos de configuración/incorporación con alcance de proveedor fusionan los modelos de proveedor seleccionados en este mapa y conservan los proveedores no relacionados que ya estén configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado servidor se activa automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para reemplazar el umbral. Consulta [Compaction del lado servidor de OpenAI](/es/providers/openai#advanced-configuration).
- `params`: parámetros globales predeterminados de proveedor aplicados a todos los modelos. Se establece en `agents.defaults.params` (p. ej., `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) es reemplazado por `agents.defaults.models["provider/model"].params` (por modelo), luego `agents.list[].params` (identificador de agente coincidente) reemplaza por clave. Consulta [almacenamiento en caché de prompts](/es/reference/prompt-caching) para más detalles.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw la reenvía al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros de agente reemplazan por clave. Consulta [enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo fusionado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo extra tiene prioridad; las rutas de completions no nativas todavía eliminan después `store` exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI fusionados en cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con thinking desactivado, el Plugin vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito reemplaza los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene la precedencia final. Los modelos configurados de thinking Qwen y Nemotron de vLLM exponen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo de varios niveles.
- `compat.thinkingFormat`: estilo de carga útil de thinking compatible con OpenAI. Usa `"together"` para `reasoning.enabled` de estilo Together, `"qwen"` para `enable_thinking` de nivel superior de estilo Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. OpenClaw asigna thinking desactivado a `false` y thinking activado a `true`, y los modelos Qwen configurados de vLLM exponen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista por modelo de esfuerzos de razonamiento compatibles con OpenAI. Incluye `"xhigh"` para endpoints personalizados que realmente lo acepten; OpenClaw entonces expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend requiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: habilitación opcional solo de Z.AI para thinking conservado. Cuando está activado y thinking está encendido, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` anterior; consulta [thinking y thinking conservado de Z.AI](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional a nivel de proveedor para servidores de modelos locales/autoalojados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint está inactivo, espera hasta `readyTimeoutMs` y luego envía la solicitud de modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw sale; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos inactivos. Consulta [servicios de modelos locales](/es/gateway/local-model-services).
- La política de tiempo de ejecución pertenece a proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas de modelo. Los modelos de agente de OpenAI en el proveedor oficial de OpenAI seleccionan Codex de forma predeterminada.
- Los escritores de configuración que mutan estos campos (por ejemplo, `/models set`, `/models set-image` y comandos para agregar/quitar respaldos) guardan la forma canónica de objeto y conservan las listas de respaldo existentes cuando es posible.
- `maxConcurrent`: ejecuciones máximas paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: `4`.

### Política de tiempo de ejecución

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, un id de arnés de plugin registrado o un alias de backend CLI compatible. El plugin Codex incluido registra `codex`; el plugin Anthropic incluido proporciona el backend CLI `claude-cli`.
- `id: "auto"` permite que los arneses de plugin registrados reclamen turnos compatibles y usa OpenClaw cuando ningún arnés coincide. Un runtime de plugin explícito como `id: "codex"` requiere ese arnés y falla de forma cerrada si no está disponible o falla.
- `id: "pi"` se acepta solo como alias obsoleto de `openclaw` para preservar configuraciones publicadas desde v2026.5.22 y anteriores. La nueva configuración debe usar `openclaw`.
- La precedencia del runtime es primero la política exacta del modelo (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), luego `agents.list[]` / `agents.defaults.models["provider/*"]`, y luego la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime de agente completo son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, los runtime pins de sesión y `OPENCLAW_AGENT_RUNTIME` se ignoran en la selección de runtime. Ejecuta `openclaw doctor --fix` para eliminar valores obsoletos.
- Los modelos de agente de OpenAI usan el arnés Codex de forma predeterminada; `agentRuntime.id: "codex"` de proveedor/modelo sigue siendo válido cuando quieres hacerlo explícito.
- Para despliegues de Claude CLI, prefiere `model: "anthropic/claude-opus-4-8"` más `agentRuntime.id: "claude-cli"` con ámbito de modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero la nueva configuración debe mantener canónica la selección de proveedor/modelo y poner el backend de ejecución en la política de runtime de proveedor/modelo.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de medios, visión, PDF, música, video y TTS siguen usando sus ajustes de proveedor/modelo.

**Abreviaturas de alias integradas** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Tus alias configurados siempre tienen prioridad sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento a menos que configures `--thinking off` o definas `agents.defaults.models["zai/<model>"].params.thinking` tú mismo.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Configura `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando el razonamiento adaptativo se activa explícitamente, el valor predeterminado de esfuerzo propiedad del proveedor Anthropic es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de razonamiento explícito.

### `agents.defaults.cliBackends`

Backends CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- Los backends CLI priorizan texto; las herramientas siempre están desactivadas.
- Las sesiones son compatibles cuando `sessionArg` está configurado.
- La transferencia directa de imágenes es compatible cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas seguras desde una cola delimitada de transcripción sin procesar de OpenClaw antes de que exista el primer resumen de compaction. Los cambios de perfil de autenticación o de época de credenciales nunca se vuelven a sembrar desde datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos en superficies de prompt ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en rutas OpenClaw/proveedor; `personality` controla solo la capa de estilo de interacción amable. Las rutas nativas de servidor de aplicación Codex conservan las instrucciones base/modelo propiedad de Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para hilos nativos.

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

- `"friendly"` (predeterminado) y `"on"` activan la capa de estilo de interacción amable.
- `"off"` desactiva solo la capa amable; el contrato de comportamiento GPT-5 etiquetado permanece activado.
- El valor heredado `plugins.entries.openai.config.personality` aún se lee cuando esta configuración compartida no está establecida.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Configúralo en `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de arranque. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de error de herramienta durante las ejecuciones de heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente heartbeat antes de abortarlo. Déjalo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté configurado; de lo contrario, se usa la cadencia de heartbeat limitada a 600 segundos.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de heartbeat usan contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del workspace.
- `isolatedSession`: cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. El mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el costo de tokens por heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de heartbeat se difieren en los carriles ocupados adicionales de ese agente: su propio subagente con clave de sesión o trabajo de comando anidado. Los carriles Cron siempre difieren heartbeats, incluso sin esta marca.
- Por agente: configura `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- Los heartbeats ejecutan turnos completos de agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin proveedor de compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen de LLM integrado. Recurre al integrado si falla. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de compaction antes de que OpenClaw la anule. Predeterminado: `180`.
- `reserveTokens`: margen de tokens reservado para la salida del modelo y futuros resultados de herramientas después de compaction. Cuando se conoce la ventana de contexto del modelo, OpenClaw limita la reserva efectiva para que no pueda consumir el presupuesto del prompt.
- `reserveTokensFloor`: reserva mínima aplicada por el runtime integrado. Establece `0` para desactivar el mínimo. El mínimo sigue sujeto al límite activo de la ventana de contexto.
- `keepRecentTokens`: presupuesto del punto de corte del agente para conservar literalmente la cola más reciente de la transcripción. `/compact` manual respeta esto cuando se establece explícitamente; de lo contrario, la compaction manual es un punto de control estricto.
- `recentTurnsPreserve`: número de turnos más recientes de usuario/asistente conservados literalmente fuera del resumen de safeguard. Predeterminado: `3`.
- `maxHistoryShare`: fracción máxima del presupuesto total de contexto permitida para el historial retenido después de compaction (rango `0.1`-`0.9`).
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone la guía integrada de retención de identificadores opacos durante el resumen de compaction.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida mal formada para resúmenes de safeguard. Activado de forma predeterminada en modo safeguard; establece `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión de contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, anula el intento actual antes de enviar el prompt y reutiliza la ruta existente de recuperación de comprobación previa para truncar los resultados de herramientas o compactar y reintentar. Funciona con los modos de compaction `default` y `safeguard`. Predeterminado: desactivado.
- `postIndexSync`: modo de reindexación de memoria de sesión posterior a compaction. Predeterminado: `"async"`. Usa `"await"` para la mayor frescura, `"async"` para menor latencia de compaction, u `"off"` solo cuando la sincronización de memoria de sesión se gestione en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de compaction. La reinyección se desactiva cuando no se establece o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` habilita ese par y preserva la alternativa heredada `Every Session`/`Safety`. Activa esto solo cuando el contexto adicional valga el riesgo de duplicar la guía del proyecto ya capturada en el resumen de compaction.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` solo para el resumen de compaction. Los alias simples se resuelven antes del despacho; los IDs literales de modelo configurados conservan la precedencia en caso de colisiones. Usa esto cuando la sesión principal deba mantener un modelo, pero los resúmenes de compaction deban ejecutarse en otro; si no se establece, compaction usa el modelo principal de la sesión.
- `truncateAfterCompaction`: rota el JSONL de la sesión activa después de compaction para que los turnos futuros carguen solo el resumen y la cola sin resumir, mientras que la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la compaction local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una compaction correcta pueda rotar a una transcripción sucesora más pequeña. Desactivado cuando no se establece o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves de mantenimiento de contexto al usuario: cuando compaction empieza y termina (por ejemplo, "Compactando contexto..." y "Compaction completa"), y cuando se agota un vaciado de memoria previo a compaction, de modo que la respuesta continúa en un estado degradado (por ejemplo, "El mantenimiento de memoria falló temporalmente; se continúa con tu respuesta."). Desactivado de forma predeterminada para mantener estos avisos en silencio.
- `memoryFlush`: turno agentic silencioso antes de auto-compaction para almacenar memorias duraderas. Establece `model` en un proveedor/modelo exacto como `ollama/qwen3:8b` cuando este turno de mantenimiento deba permanecer en un modelo local; la sobrescritura no hereda la cadena de alternativas de la sesión activa. `forceFlushTranscriptBytes` fuerza el vaciado cuando el tamaño del archivo de transcripción alcanza el umbral, incluso si los contadores de tokens están obsoletos. Se omite cuando el workspace es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteración de reintento del bucle externo de ejecución para el runtime de agente integrado, a fin de evitar bucles de ejecución infinitos durante la recuperación de fallos. Este ajuste solo se aplica al runtime de agente integrado, no a los runtimes ACP ni CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: número base de iteraciones de reintento de ejecución para el bucle externo de ejecución. Predeterminado: `24`.
- `perProfile`: iteraciones adicionales de reintento de ejecución concedidas por cada candidato de perfil alternativo. Predeterminado: `8`.
- `min`: límite absoluto mínimo para las iteraciones de reintento de ejecución. Predeterminado: `32`.
- `max`: límite absoluto máximo para las iteraciones de reintento de ejecución, para evitar ejecuciones descontroladas. Predeterminado: `160`.

### `agents.defaults.contextPruning`

Depura **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco. Desactivado de forma predeterminada; establece `mode: "cache-ttl"` para activarlo.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (default) | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes; default: 5m
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

- `mode: "cache-ttl"` habilita pasadas de depuración.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la depuración (después del último acceso a la caché). Predeterminado: `5m`.
- La depuración primero recorta suavemente los resultados de herramientas sobredimensionados y luego borra por completo los resultados de herramientas más antiguos si es necesario.
- `softTrimRatio` y `hardClearRatio` aceptan valores desde `0.0` hasta `1.0`; la validación de configuración rechaza valores fuera de ese rango.

**Recorte suave** conserva el inicio + el final e inserta `...` en el medio.

**Borrado completo** reemplaza todo el resultado de la herramienta con el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes de asistente, se omite la depuración.

</Accordion>

Consulta [Depuración de sesión](/es/concepts/session-pruning) para los detalles de comportamiento.

### Streaming por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Sobrescrituras por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack usan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Predeterminado: `off`. `natural` = 800-2500ms. `custom` usa `minMs`/`maxMs` (vuelve al rango natural para cualquier límite no establecido). Sobrescritura por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para los detalles de comportamiento y fragmentación.

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
- Predeterminado de `typingIntervalSeconds`: `6`.
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente integrado. Consulta [Aislamiento](/es/gateway/sandboxing) para la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

Los valores predeterminados mostrados arriba (imagen `off`/`docker`/`agent`/`none`/`bookworm-slim`/red `none`/etc.) son los valores predeterminados reales de OpenClaw, no solo valores ilustrativos.

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime local de Docker (predeterminado)
- `ssh`: runtime remoto genérico respaldado por SSH
- `openshell`: runtime de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del runtime pasa a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por ámbito (predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos en línea o SecretRefs que OpenClaw materializa en archivos temporales durante el runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH (ambos predeterminados en `true`)

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que comience la sesión del entorno aislado

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crear o recrear
- luego mantiene el espacio de trabajo SSH remoto como canónico
- enruta `exec`, herramientas de archivos y rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador en entorno aislado

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de entorno aislado por ámbito en `~/.openclaw/sandboxes` (predeterminado)
- `ro`: espacio de trabajo de entorno aislado en `/workspace`, espacio de trabajo del agente montado como solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado con lectura/escritura en `/workspace`

**Ámbito:**

- `session`: contenedor + espacio de trabajo por sesión
- `agent`: un contenedor + espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: inicializa el remoto desde el local antes de la ejecución, sincroniza de vuelta después de la ejecución; el espacio de trabajo local permanece canónico
- `remote`: inicializa el remoto una vez cuando se crea el entorno aislado y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte es SSH hacia el entorno aislado de OpenShell, pero el Plugin posee el ciclo de vida del entorno aislado y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de la creación del contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: configúralo en `"bridge"` (o en una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada salvo que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ruptura de emergencia).
Los turnos del servidor de aplicaciones de Codex en un entorno aislado activo de OpenClaw usan esta misma configuración de salida para su acceso de red nativo en modo código.

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`, predeterminado `false`): Chromium + CDP en un contenedor. URL de noVNC inyectada en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en entorno aislado apunten al navegador del host.
- `network` usa de forma predeterminada `openclaw-sandbox-browser` (red bridge dedicada). Configúralo en `bridge` solo cuando quieras explícitamente conectividad bridge global. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador en entorno aislado. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Chromium del contenedor del navegador en entorno aislado siempre se inicia con `--no-sandbox --disable-setuid-sandbox` (los contenedores no tienen las primitivas de kernel que necesita el propio sandbox de Chrome); no hay ningún interruptor de configuración para esto.
- Los valores predeterminados de inicio se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts de contenedores:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` y `--disable-software-rasterizer` están
    habilitados de forma predeterminada y se pueden deshabilitar con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `--disable-extensions` (habilitado de forma predeterminada); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    vuelve a habilitar las extensiones si tu flujo de trabajo depende de ellas.
  - `--renderer-process-limit=2` de forma predeterminada; cámbialo con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, configura `0` para usar el
    límite de procesos predeterminado de Chromium.
  - `--headless=new` solo cuando `headless` está habilitado.
  - Los valores predeterminados son la línea base de la imagen del contenedor; usa una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` son solo para Docker.

Crear imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalaciones npm sin un checkout del código fuente, consulta [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para comandos `docker build` en línea.

### `agents.list` (sobrescrituras por agente)

Usa `agents.list[].tts` para dar a un agente su propio proveedor, voz, modelo,
estilo o modo auto-TTS de TTS. El bloque del agente se fusiona en profundidad sobre
`messages.tts` global, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras los
agentes individuales sobrescriben solo los campos de voz o proveedor que necesitan. La sobrescritura del agente activo
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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
            mode: "persistent", // persistent | oneshot
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

- `id`: id estable del agente (obligatorio).
- `default`: cuando se definen varios, gana el primero (se registra una advertencia). Si no se define ninguno, la primera entrada de la lista es el valor predeterminado.
- `model`: la forma de cadena define un primario estricto por agente sin fallback de modelo; la forma de objeto `{ primary }` también es estricta a menos que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para activar fallback para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo sobrescriben `primary` siguen heredando fallbacks predeterminados a menos que definas `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas breves, como títulos generados de sesión e hilo. Recurre a `agents.defaults.utilityModel` y luego al modelo primario de este agente.
- `params`: parámetros de transmisión por agente combinados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Usa esto para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se combina en profundidad sobre `messages.tts`, así que conserva las credenciales de proveedor compartidas y la política de fallback en `messages.tts`, y define aquí solo valores específicos de la persona, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está definido; una lista explícita reemplaza los valores predeterminados en lugar de combinarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se define una sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se define una sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se define una sobrescritura de modo rápido por mensaje o sesión.
- `models`: sobrescrituras opcionales del catálogo/tiempo de ejecución de modelos por agente, indexadas por ids completos `provider/model`. Usa `models["provider/model"].agentRuntime` para excepciones de tiempo de ejecución por agente.
- `runtime`: descriptor opcional de tiempo de ejecución por agente. Usa `type: "acp"` con valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar sesiones del arnés ACP de forma predeterminada.
- `identity.avatar`: ruta relativa al workspace, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales `identity.avatar` relativos al workspace están limitados a 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban contra el límite de tamaño de archivo local.
- `identity` deriva valores predeterminados: `ackReaction` desde `emoji`, `mentionPatterns` desde `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ids de agente configurados para objetivos explícitos `sessions_spawn.agentId` (`["*"]` = cualquier objetivo configurado; valor predeterminado: solo el mismo agente). Incluye el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se eliminó son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecuta `openclaw doctor --fix` para limpiarlas, o agrega una entrada mínima `agents.list[]` si ese objetivo debe seguir pudiendo generarse mientras hereda valores predeterminados.
- Guardia de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza objetivos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; valor predeterminado: false).
- `subagents.maxConcurrent`: máximo de ejecuciones simultáneas de agentes secundarios durante la ejecución de subagentes. Valor predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: máximo de hijos activos que una sola sesión de agente puede generar. Valor predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para generar subagentes (`1`-`5`). Valor predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: antigüedad antes de archivar el estado de subagente completado. Valor predeterminado: `60`.

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

- `type` (opcional): `route` para enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para vinculaciones persistentes de conversación ACP.
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

Dentro de cada nivel, gana la primera entrada `bindings` que coincida.

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

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para conocer los detalles de precedencia.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
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
  - `global`: todos los participantes en un contexto de canal comparten una sola sesión (úsalo solo cuando se pretende un contexto compartido).
- **`dmScope`**: cómo se agrupan los MD.
  - `main`: todos los MD comparten la sesión principal.
  - `per-peer`: aísla por id de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulta [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a la hora local `atHour`; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, gana el que venza primero. La frescura del restablecimiento diario usa el `sessionStartedAt` de la fila de sesión; la frescura del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras en segundo plano/eventos del sistema como Heartbeat, despertares Cron, notificaciones de ejecución y contabilidad del Gateway pueden actualizar `updatedAt`, pero no mantienen frescas las sesiones diarias/por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). El valor heredado `dm` se acepta como alias de `direct`.
- **`resetByChannel`**: anulaciones de restablecimiento por canal, indexadas por id de proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta gana por completo sobre `resetByType`/`reset` para esa sesión. Úsalo solo cuando un canal necesite un comportamiento de restablecimiento distinto de la política de nivel de tipo.
- **`mainKey`**: campo heredado. En tiempo de ejecución siempre se usa `"main"` para el contenedor principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de respuesta entre agentes durante intercambios de agente a agente (entero, rango: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`). En tiempo de ejecución se escribe la limpieza por lotes con un pequeño margen de nivel alto para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - Las sesiones efímeras de sondeo de ejecución de modelo del Gateway usan una retención fija de `24h`, pero la limpieza está limitada por presión: solo elimina filas obsoletas estrictas de sondeo de ejecución de modelo cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Solo son elegibles las claves de sondeo explícitas y estrictas que coinciden con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilo, Cron, hook, Heartbeat, ACP y de subagente no heredan esta retención de 24 h. Cuando se ejecuta la limpieza de ejecución de modelo, se ejecuta antes de la limpieza más amplia de entradas obsoletas de `pruneAfter` y del límite `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; define `false` para desactivarla.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`writeLock`**: controles del bloqueo de escritura de transcripciones de sesión. Ajústalos solo cuando la preparación legítima de transcripciones, la limpieza, Compaction o el trabajo de espejo compitan durante más tiempo que las políticas predeterminadas.
  - `acquireTimeoutMs`: milisegundos que se espera al adquirir un bloqueo antes de informar que la sesión está ocupada. Predeterminado: `60000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: milisegundos antes de que un bloqueo existente se trate como obsoleto y se reclame. Predeterminado: `1800000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: milisegundos que un bloqueo retenido dentro del proceso puede permanecer retenido antes de que el watchdog lo libere. Predeterminado: `300000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: antigüedad máxima estricta predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: control predeterminado para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. El valor predeterminado es `true` cuando los enlaces de hilo están habilitados; los proveedores/cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo de subagente predeterminado para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (default) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (default)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Resolución (gana el más específico): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción              | Ejemplo                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nombre corto del modelo  | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor     | `anthropic`                 |
| `{thinkingLevel}` | Nivel de pensamiento actual | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen mayúsculas de minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- El valor predeterminado es el `identity.emoji` del agente activo; si no, `"👀"`. Define `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → reserva de identidad.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all` u `off`/`none` (desactiva por completo las reacciones de confirmación).
- `removeAckAfterReply`: elimina la confirmación después de responder en canales con soporte de reacciones como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: habilita reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Discord, si no se define, mantiene habilitadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Slack, Signal, Telegram y WhatsApp, establécelo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.
  Slack usa de forma predeterminada su estado nativo de hilo de asistente y mensajes de carga rotativos para el progreso, mientras mantiene estática la reacción de confirmación configurada.
- `messages.statusReactions.emojis`: anula las claves de emoji del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emoji configurados no admitidos recurren
  a la variante de estado compatible más cercana para ese chat.

### Cola

- `mode`: estrategia de cola para mensajes entrantes que llegan mientras una ejecución de sesión está activa. Predeterminado: `"steer"`.
  - `steer`: inyecta el nuevo prompt en la ejecución activa.
  - `followup`: ejecuta el nuevo prompt después de que termine la ejecución activa.
  - `collect`: agrupa mensajes compatibles y los ejecuta juntos más tarde.
  - `interrupt`: aborta la ejecución activa antes de iniciar el prompt más reciente.
- `debounceMs`: demora antes de despachar un mensaje en cola/dirigido. Predeterminado: `500`.
- `cap`: máximo de mensajes en cola antes de que se aplique la política de descarte. Predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: anulaciones de `mode` por canal, indexadas por id de proveedor.
- `debounceMsByChannel`: anulaciones de `debounceMs` por canal, indexadas por id de proveedor.

### Antirrebote entrante

Agrupa mensajes rápidos solo de texto del mismo remitente en un único turno de agente. Los medios/adjuntos se vacían inmediatamente. Los comandos de control omiten el antirrebote. `debounceMs` predeterminado: `2000`.

### Otras claves de mensajes

- `messages.messagePrefix`: texto de prefijo que se antepone a los mensajes entrantes del usuario antes de que lleguen al runtime del agente. Úsalo con moderación para marcadores de contexto de canal.
- `messages.visibleReplies`: controla respuestas de origen visibles en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada de pie de página de `/usage` y modo de uso predeterminado por respuesta (`off | tokens | full`, además del alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: activadores de mención de mensajes grupales y tamaño de la ventana de historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias de error de herramienta `⚠️` que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede reintentarlo). Predeterminado: `false`.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` controla el modo auto-TTS predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` es opt-in.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos son propiedad de Plugins. Si `plugins.allow` está configurado, incluye cada Plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El id de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de TTS de OpenAI. El orden de resolución es la configuración, luego `OPENAI_TTS_BASE_URL` y luego `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Conversación

Valores predeterminados para el modo Conversación (macOS/iOS/Android y la Control UI del navegador).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_multilingual_v2",
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
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Conversación.
- Las claves planas heredadas de Conversación (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los ids de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` (comportamiento del cliente de Conversación de macOS).
- `providers.*.apiKey` acepta cadenas de texto plano u objetos SecretRef.
- El fallback `ELEVENLABS_API_KEY` se aplica solo cuando no hay configurada ninguna clave de API de Conversación.
- `providers.*.voiceAliases` permite que las directivas de Conversación usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el asistente local MLX de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción MLX de macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas `openclaw_agent_consult` de Conversación en tiempo real de Control UI. Déjalo sin configurar para conservar el comportamiento normal de sesión/modelo.
- `consultFastMode` establece una anulación de modo rápido de un solo uso para las consultas de Conversación en tiempo real de Control UI sin cambiar la configuración normal de modo rápido de la sesión.
- `speechLocale` establece el id de locale BCP 47 usado por el reconocimiento de voz de Conversación de iOS/macOS. Déjalo sin configurar para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Conversación después del silencio del usuario antes de enviar la transcripción. Sin configurar, mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).
- `realtime.instructions` añade instrucciones de sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw, de modo que el estilo de voz pueda configurarse sin perder la guía predeterminada de `openclaw_agent_consult`.
- `realtime.vadThreshold` establece el umbral de actividad de voz del proveedor de `0` (más sensible) a `1` (menos sensible). Sin configurar, mantiene el valor predeterminado del proveedor.
- `realtime.silenceDurationMs` establece la ventana de silencio positiva de número entero antes de que el proveedor confirme un turno de usuario en tiempo real. Sin configurar, mantiene el valor predeterminado del proveedor.
- `realtime.prefixPaddingMs` establece la cantidad no negativa de número entero de audio conservado antes de que comience el habla detectada. Sin configurar, mantiene el valor predeterminado del proveedor.
- `realtime.reasoningEffort` establece el nivel de razonamiento específico del proveedor para sesiones en tiempo real. Sin configurar, mantiene el valor predeterminado del proveedor.
- `realtime.consultRouting`: `"provider-direct"` (predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real produce una transcripción final de usuario sin `openclaw_agent_consult`. `"force-agent-consult"` enruta la solicitud finalizada a través de OpenClaw en su lugar.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
