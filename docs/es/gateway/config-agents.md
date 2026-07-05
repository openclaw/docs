---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, multimedia, Skills)
    - Configurar el enrutamiento y las vinculaciones multiagente
    - Ajustar la sesión, la entrega de mensajes y el comportamiento del modo de conversación
summary: Valores predeterminados de agentes, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-05T11:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75ba6a72eec05731054dd1f7d04cee6f50124375e022d1a51f75e87a453ea3f2
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente en `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, runtime del Gateway y otras
claves de nivel superior, consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de agente

### `agents.defaults.workspace`

Predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está definido; de lo contrario, `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está definido en un perfil no predeterminado).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Usa la variable de entorno para apuntar los agentes
predeterminados a un workspace montado cuando no quieras escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz de repositorio opcional que se muestra en la línea Runtime del prompt del sistema. Si no está definida, OpenClaw la detecta automáticamente subiendo desde el workspace.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Define `agents.list[].skills: []` para no permitir Skills.
- Una lista no vacía de `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del workspace y sigue escribiendo los archivos de bootstrap requeridos (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del workspace, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction aún reconstruyen el contexto.
- `"never"`: desactiva la inyección del bootstrap del workspace y de archivos de contexto en cada turno. Usa esto solo para agentes que controlan por completo el ciclo de vida de su prompt (motores de contexto personalizados, runtimes nativos que crean su propio contexto o workflows especializados sin bootstrap). Los turnos de Heartbeat y de recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Anulación por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo de bootstrap del workspace antes del truncamiento. Predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Anulación por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos de bootstrap del workspace. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Anulación por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Anulaciones de perfil de bootstrap por agente

Usa anulaciones de perfil de bootstrap por agente cuando un agente necesita un comportamiento
de inyección de prompt distinto de los valores predeterminados compartidos. Los campos omitidos heredan de
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

Controla el aviso visible para el agente en el prompt del sistema cuando el contexto de bootstrap se trunca.
Predeterminado: `"always"`.

- `"off"`: nunca inyecta texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyecta un aviso conciso una vez por cada firma de truncamiento única.
- `"always"`: inyecta un aviso conciso en cada ejecución cuando hay truncamiento (recomendado).

Los recuentos detallados sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
informes de contexto/estado y registros; el contexto rutinario de usuario/runtime de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad de presupuestos de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionalmente por subsistema en lugar de fluir todos por un único
control genérico.

| Presupuesto                                                   | Cubre                                                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inyección normal del bootstrap del workspace                                                                                                                                 |
| `agents.defaults.startupContext.*`                             | Preludio de ejecución de modelo de inicio/restablecimiento de una sola vez, incluidos archivos diarios recientes `memory/*.md`. El chat directo `/new` y `/reset` se confirma sin invocar el modelo |
| `skills.limits.*`                                              | La lista compacta de Skills inyectada en el prompt del sistema                                                                                                               |
| `agents.defaults.contextLimits.*`                              | Extractos de runtime acotados y bloques inyectados propiedad del runtime                                                                                                     |
| `memory.qmd.limits.*`                                          | Fragmento de búsqueda de memoria indexada y tamaño de inyección                                                                                                             |

Anulaciones por agente correspondientes:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio de primer turno inyectado en ejecuciones de modelo de restablecimiento/inicio.
Los comandos de chat directos `/new` y `/reset` confirman el restablecimiento sin invocar
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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: límite predeterminado de extracto de `memory_get` antes de que se agreguen
  metadatos de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando `lines` se
  omite.
- `toolResultMaxChars`: límite avanzado de resultados de herramientas en vivo usado para resultados
  persistidos y recuperación de desbordamiento. Déjalo sin definir para el límite automático de contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres a partir de 100K tokens y `64000`
  caracteres a partir de 200K tokens. Se aceptan valores explícitos hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue estando limitado a alrededor del 30% de
  la ventana de contexto del modelo. `openclaw doctor --deep` imprime el límite efectivo,
  y doctor advierte solo cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite de extracto de AGENTS.md usado durante la inyección de
  actualización posterior a Compaction.

#### `agents.list[].contextLimits`

Anulación por agente para los controles compartidos de `contextLimits`. Los campos omitidos heredan
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
          toolResultMaxChars: 8000, // advanced ceiling for this agent
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

Anulación por agente para el presupuesto de prompt de Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imagen de transcript/herramienta antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga de solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de herramientas de imagen para imágenes cargadas desde rutas de archivo, URLs y referencias multimedia.
Predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imagen seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL y los modelos de visión Llama 4 alojados pueden usar imágenes más grandes que las rutas de visión de alto detalle más antiguas/predeterminadas, mientras que los turnos con múltiples imágenes se comprimen de forma más agresiva en modo `auto` para controlar el costo de tokens y latencia.

Valores:

- `auto`: se adapta a los límites del modelo y al recuento de imágenes.
- `efficient`: prefiere imágenes más pequeñas para reducir el uso de tokens y bytes.
- `balanced`: usa la escala estándar intermedia.
- `high`: conserva más detalle para capturas de pantalla, diagramas e imágenes de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para marcas de tiempo de mensajes). Recurre a la zona horaria del host.

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
  - La forma de cadena define solo el modelo principal.
  - La forma de objeto define el principal más modelos ordenados de conmutación por error.
- `utilityModel`: ref o alias opcional `provider/model` para tareas internas breves. Actualmente impulsa los títulos de sesión generados de Control UI, los títulos de temas de MD de Telegram y los títulos de hilos automáticos de Discord. Estas tareas vuelven al modelo principal del agente cuando no se define; `agents.list[].utilityModel` anula el valor predeterminado, y una anulación de modelo específica de la operación prevalece sobre ambos. Las tareas utilitarias hacen llamadas de modelo separadas y envían contenido específico de la tarea al proveedor de modelo seleccionado. La generación de títulos del panel envía como máximo los primeros 1.000 caracteres del primer mensaje que no sea un comando. Elige un proveedor que coincida con tus requisitos de costo y manejo de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de reserva cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere refs explícitas `provider/model`. Los ID simples se aceptan por compatibilidad; si un ID simple coincide de forma única con una entrada configurada compatible con imágenes en `models.providers.*.models`, OpenClaw lo califica para ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, o `openai/gpt-image-1.5` para salida PNG/WebP de OpenAI con fondo transparente.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación del proveedor correspondiente (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores registrados restantes de generación de imágenes en orden de ID de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores registrados restantes de generación de música en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores registrados restantes de generación de video en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
  - El plugin oficial de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la herramienta `pdf` para enrutamiento de modelo.
  - Si se omite, la herramienta PDF vuelve a `imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `pdfMaxBytesMb`: límite de tamaño PDF predeterminado para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: páginas máximas predeterminadas consideradas por el modo de reserva de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramientas de borradores de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (añade comando/detalle sin procesar cuando está disponible). `agents.list[].toolProgressDetail` por agente anula este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente anula este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos de gateway de operador-administrador cuando no se define ninguna anulación de razonamiento por mensaje o por sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej., `openai/gpt-5.5` para clave de API de OpenAI o acceso OAuth de Codex). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese ID exacto de modelo, y solo entonces vuelve al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw vuelve al primer proveedor/modelo configurado en lugar de exponer un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa entradas `provider/*` como `"openai/*": {}` o `"vllm/*": {}` para mostrar todos los modelos descubiertos para proveedores seleccionados sin listar manualmente cada ID de modelo.
  - Añade `agentRuntime` a una entrada `provider/*` cuando cada modelo descubierto dinámicamente para ese proveedor deba usar el mismo runtime. La política de runtime exacta `provider/model` sigue prevaleciendo sobre el comodín.
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos, salvo que pases `--replace`.
  - Los flujos de configuración/incorporación con alcance de proveedor combinan los modelos de proveedor seleccionados en este mapa y preservan los proveedores no relacionados que ya estén configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para anular el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#advanced-configuration).
- `params`: parámetros globales predeterminados de proveedor aplicados a todos los modelos. Se define en `agents.defaults.params` (p. ej., `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) es anulado por `agents.defaults.models["provider/model"].params` (por modelo), y luego `agents.list[].params` (ID de agente coincidente) anula por clave. Consulta [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener detalles.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedor para todo OpenRouter. OpenClaw reenvía esto al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente anulan por clave. Consulta [Enrutamiento de proveedor de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo combinado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si colisiona con claves de solicitud generadas, prevalece el cuerpo extra; las rutas de completions no nativas aún eliminan después `store` exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI combinados en cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con thinking desactivado, el plugin vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito anula los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene la precedencia final. Los modelos de thinking configurados de vLLM Qwen y Nemotron exponen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo multinivel.
- `compat.thinkingFormat`: estilo de carga útil de thinking compatible con OpenAI. Usa `"together"` para `reasoning.enabled` al estilo Together, `"qwen"` para `enable_thinking` de nivel superior al estilo Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. OpenClaw asigna thinking deshabilitado a `false` y thinking habilitado a `true`, y los modelos Qwen configurados de vLLM exponen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento compatible con OpenAI por modelo. Incluye `"xhigh"` para endpoints personalizados que realmente lo acepten; entonces OpenClaw expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend quiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: activación opcional solo para Z.AI para thinking preservado. Cuando está habilitado y thinking está activado, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` previo; consulta [Thinking de Z.AI y thinking preservado](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional de nivel de proveedor para servidores de modelos locales/autohospedados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw prueba `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint está caído, espera hasta `readyTimeoutMs` y luego envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw sale; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos de inactividad. Consulta [Servicios de modelos locales](/es/gateway/local-model-services).
- La política de runtime pertenece a proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas de modelo. Los modelos de agente de OpenAI en el proveedor oficial de OpenAI seleccionan Codex de forma predeterminada.
- Los escritores de configuración que mutan estos campos (por ejemplo, `/models set`, `/models set-image` y comandos para añadir/eliminar reservas) guardan la forma de objeto canónica y preservan las listas de reserva existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: `4`.

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

- `id`: `"auto"`, `"openclaw"`, un id registrado de arnés de plugin o un alias de backend de CLI compatible. El plugin Codex incluido registra `codex`; el plugin Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los arneses de plugin registrados reclamen turnos compatibles y usa OpenClaw cuando ningún arnés coincide. Un runtime de plugin explícito como `id: "codex"` requiere ese arnés y falla de forma cerrada si no está disponible o falla.
- `id: "pi"` solo se acepta como alias obsoleto de `openclaw` para conservar configuraciones distribuidas desde v2026.5.22 y anteriores. La configuración nueva debe usar `openclaw`.
- La precedencia del runtime es primero la política exacta del modelo (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), luego `agents.list[]` / `agents.defaults.models["provider/*"]` y después la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime de agente completo son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, los pines de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` se ignoran en la selección del runtime. Ejecuta `openclaw doctor --fix` para eliminar valores obsoletos.
- Los modelos de agente de OpenAI usan el arnés Codex de forma predeterminada; provider/model `agentRuntime.id: "codex"` sigue siendo válido cuando quieras hacerlo explícito.
- Para despliegues de Claude CLI, prefiere `model: "anthropic/claude-opus-4-8"` más `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero la configuración nueva debe mantener canónica la selección provider/model y poner el backend de ejecución en la política de runtime provider/model.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de medios, visión, PDF, música, video y TTS siguen usando su configuración provider/model.

**Alias abreviados incorporados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

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

Tus alias configurados siempre prevalecen sobre los predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de pensamiento a menos que configures `--thinking off` o definas tú mismo `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Configura `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el pensamiento desactivado de forma predeterminada en OpenClaw; cuando se activa explícitamente el pensamiento adaptativo, el valor predeterminado de esfuerzo propio del proveedor Anthropic es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de pensamiento explícito.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones de reserva solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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
          // O usa systemPromptFileArg cuando la CLI acepta una marca de archivo de prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI priorizan texto; las herramientas siempre están desactivadas.
- Sesiones compatibles cuando `sessionArg` está configurado.
- Paso directo de imágenes compatible cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas seguras
  desde una cola acotada de transcripción sin procesar de OpenClaw antes de que exista
  el primer resumen de compaction. Los cambios de perfil de autenticación o de época de credenciales
  nunca vuelven a sembrar desde datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos en superficies de prompt ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en las rutas OpenClaw/proveedor; `personality` controla solo la capa de estilo de interacción amigable. Las rutas nativas del servidor de aplicaciones Codex mantienen las instrucciones base/de modelo propias de Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad incorporada de Codex para hilos nativos.

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

- `"friendly"` (predeterminado) y `"on"` activan la capa de estilo de interacción amigable.
- `"off"` desactiva solo la capa amigable; el contrato de comportamiento GPT-5 etiquetado permanece activado.
- `plugins.entries.openai.config.personality` heredado todavía se lee cuando esta configuración compartida no está establecida.

### `agents.defaults.heartbeat`

Ejecuciones periódicas de heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desactiva
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predeterminado: true; false omite la sección Heartbeat del prompt del sistema
        lightContext: false, // predeterminado: false; true conserva solo HEARTBEAT.md de los archivos de bootstrap del área de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // predeterminado: false; true también espera los carriles de subagentes/anidados de este agente
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predeterminado) | block
        target: "none", // predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Lee HEARTBEAT.md si existe...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Configúralo en `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de bootstrap. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de errores de herramientas durante las ejecuciones de heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de heartbeat antes de que se aborte. Déjalo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté configurado; de lo contrario, se usa la cadencia de heartbeat con un tope de 600 segundos.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de heartbeat usan contexto de bootstrap ligero y conservan solo `HEARTBEAT.md` de los archivos de bootstrap del área de trabajo.
- `isolatedSession`: cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. El mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el costo de tokens por heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de heartbeat se aplazan en los carriles ocupados adicionales de ese agente: su propio subagente con clave de sesión o trabajo de comandos anidados. Los carriles de cron siempre aplazan heartbeats, incluso sin esta marca.
- Por agente: configura `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- Los heartbeats ejecutan turnos completos de agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un plugin proveedor de compaction registrado (opcional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conserva los IDs de despliegue, IDs de ticket y pares host:port exactamente.", // se usa cuando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // comprobación opcional de presión del bucle de herramientas
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // opta por la reinyección de secciones de AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // anulación opcional de modelo solo para compaction
        truncateAfterCompaction: true, // rotar a un JSONL sucesor más pequeño después de la compaction
        maxActiveTranscriptBytes: "20mb", // activador local opcional de compaction previa
        notifyUser: true, // enviar avisos breves cuando la compaction comienza y termina (predeterminado: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // anulación opcional de modelo solo para volcado de memoria
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La sesión se acerca a la compaction. Guarda ahora los recuerdos duraderos.",
          prompt: "Escribe cualquier nota duradera en memory/YYYY-MM-DD.md; responde con el token silencioso exacto NO_REPLY si no hay nada que guardar.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un Plugin de proveedor de compactación registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen LLM integrado. Recurre al integrado en caso de error. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de compactación antes de que OpenClaw la aborte. Valor predeterminado: `180`.
- `keepRecentTokens`: presupuesto de punto de corte del agente para conservar literalmente la parte final más reciente de la transcripción. `/compact` manual respeta esto cuando se establece explícitamente; de lo contrario, la compactación manual es un punto de control rígido.
- `recentTurnsPreserve`: número de turnos usuario/asistente más recientes que se conservan literalmente fuera del resumen de salvaguarda. Valor predeterminado: `3`.
- `maxHistoryShare`: fracción máxima del presupuesto total de contexto permitida para el historial retenido después de la compactación (rango `0.1`-`0.9`).
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone una guía integrada de retención de identificadores opacos durante el resumen de compactación.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida mal formada para resúmenes de salvaguarda. Habilitado de forma predeterminada en modo safeguard; establece `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión de contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, aborta el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de precomprobación existente para truncar los resultados de herramientas o compactar y reintentar. Funciona con los modos de compactación `default` y `safeguard`. Valor predeterminado: deshabilitado.
- `postIndexSync`: modo de reindexación de memoria de sesión posterior a la compactación. Valor predeterminado: `"async"`. Usa `"await"` para la máxima frescura, `"async"` para menor latencia de compactación, u `"off"` solo cuando la sincronización de memoria de sesión se gestiona en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de la compactación. La reinyección está deshabilitada cuando no se establece o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` habilita ese par y preserva el respaldo heredado `Every Session`/`Safety`. Habilita esto solo cuando el contexto adicional compensa el riesgo de duplicar la guía del proyecto ya capturada en el resumen de compactación.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` solo para el resumen de compactación. Los alias simples se resuelven antes del envío; los IDs literales de modelo configurados conservan prioridad en colisiones. Usa esto cuando la sesión principal deba conservar un modelo, pero los resúmenes de compactación deban ejecutarse en otro; si no se establece, la compactación usa el modelo principal de la sesión.
- `truncateAfterCompaction`: rota el JSONL de la sesión activa después de la compactación para que los turnos futuros carguen solo el resumen y la parte final no resumida, mientras la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Valor predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional de bytes (`number` o cadenas como `"20mb"`) que activa la compactación local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una compactación correcta pueda rotar a una transcripción sucesora más pequeña. Deshabilitado cuando no se establece o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando la compactación empieza y cuando se completa (por ejemplo, "Compactando contexto..." y "Compactación completa"). Deshabilitado de forma predeterminada para mantener la compactación silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la autocompactación para almacenar memorias duraderas. Establece `model` en un proveedor/modelo exacto como `ollama/qwen3:8b` cuando este turno de mantenimiento deba permanecer en un modelo local; la anulación no hereda la cadena de respaldo de la sesión activa. `forceFlushTranscriptBytes` fuerza el volcado cuando el tamaño del archivo de transcripción alcanza el umbral aunque los contadores de tokens estén desactualizados. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteración de reintentos del bucle de ejecución externo para el runtime de agente integrado, a fin de evitar bucles de ejecución infinitos durante la recuperación de errores. Esta configuración solo se aplica al runtime de agente integrado, no a los runtimes ACP o CLI.

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

- `base`: número base de iteraciones de reintento de ejecución para el bucle de ejecución externo. Valor predeterminado: `24`.
- `perProfile`: iteraciones adicionales de reintento de ejecución concedidas por cada candidato de perfil de respaldo. Valor predeterminado: `8`.
- `min`: límite absoluto mínimo para las iteraciones de reintento de ejecución. Valor predeterminado: `32`.
- `max`: límite absoluto máximo para las iteraciones de reintento de ejecución a fin de evitar una ejecución descontrolada. Valor predeterminado: `160`.

### `agents.defaults.contextPruning`

Poda **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco. Deshabilitado de forma predeterminada; establece `mode: "cache-ttl"` para habilitarlo.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` habilita pasadas de poda.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la poda (después del último toque de caché). Valor predeterminado: `5m`.
- La poda primero recorta suavemente los resultados de herramientas demasiado grandes y luego, si es necesario, borra por completo resultados de herramientas más antiguos.
- `softTrimRatio` y `hardClearRatio` aceptan valores de `0.0` a `1.0`; la validación de configuración rechaza valores fuera de ese rango.

**Recorte suave** conserva el principio + el final e inserta `...` en el medio.

**Borrado completo** reemplaza todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes de asistente, la poda se omite.

</Accordion>

Consulta [Poda de sesión](/es/concepts/session-pruning) para detalles de comportamiento.

### Transmisión por bloques

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
- Anulaciones por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack usan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Valor predeterminado: `off`. `natural` = 800-2500 ms. `custom` usa `minMs`/`maxMs` (recurre al rango natural para cualquier límite no establecido). Anulación por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para detalles de comportamiento y fragmentación.

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
- Valor predeterminado de `typingIntervalSeconds`: `6`.
- Anulaciones por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

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

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del runtime se mueven a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por alcance (predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes que se pasan a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos en línea o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: parámetros de política de claves de host de OpenSSH (ambos predeterminados en `true`)

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que se inicie la sesión de sandbox

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crear o recrear
- luego mantiene el espacio de trabajo SSH remoto como canónico
- enruta `exec`, las herramientas de archivos y las rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador en sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de sandbox por alcance bajo `~/.openclaw/sandboxes` (predeterminado)
- `ro`: espacio de trabajo de sandbox en `/workspace`, espacio de trabajo del agente montado como solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado con lectura/escritura en `/workspace`

**Alcance:**

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

**Modo de OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de la ejecución y sincroniza de vuelta después de la ejecución; el espacio de trabajo local permanece como canónico
- `remote`: inicializa el remoto una vez cuando se crea el sandbox y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente al sandbox después del paso de inicialización.
El transporte es SSH hacia el sandbox de OpenShell, pero el Plugin es propietario del ciclo de vida del sandbox y de la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: configúralo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada salvo que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (emergencia).
Los turnos del servidor de aplicaciones Codex en un sandbox activo de OpenClaw usan esta misma configuración de salida para su acceso de red nativo en modo código.

**Los adjuntos entrantes** se preparan en `media/inbound/*` en el espacio de trabajo activo.

**`docker.binds`** monta directorios de host adicionales; los montajes globales y por agente se combinan.

**Navegador en sandbox** (`sandbox.browser.enabled`, predeterminado `false`): Chromium + CDP en un contenedor. URL de noVNC inyectada en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso del observador noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL de token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en sandbox apunten al navegador del host.
- `network` usa `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Configúralo en `bridge` solo cuando quieras explícitamente conectividad bridge global. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios de host adicionales solo en el contenedor del navegador en sandbox. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Chromium del contenedor del navegador en sandbox siempre se inicia con `--no-sandbox --disable-setuid-sandbox` (los contenedores no tienen las primitivas del kernel que necesita el propio sandbox de Chrome); no hay una opción de configuración para esto.
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

Compila imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalaciones npm sin un checkout del código fuente, consulta [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para comandos `docker build` en línea.

### `agents.list` (sobrescrituras por agente)

Usa `agents.list[].tts` para darle a un agente su propio proveedor TTS, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina en profundidad sobre
`messages.tts`, de modo que las credenciales compartidas pueden permanecer en un solo lugar mientras los agentes
individuales sobrescriben solo los campos de voz o proveedor que necesitan. La sobrescritura del agente activo
se aplica a las respuestas habladas automáticas, `/tts audio`, `/tts status` y
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
- `default`: cuando se configuran varios, gana el primero (se registra una advertencia). Si no se configura ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena establece un primario estricto por agente sin reserva de modelo; la forma de objeto `{ primary }` también es estricta salvo que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para habilitar la reserva para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo sobrescriben `primary` siguen heredando las reservas predeterminadas salvo que configures `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas cortas, como títulos generados de sesión e hilo. Recurre a `agents.defaults.utilityModel` y luego al modelo primario de este agente.
- `params`: parámetros de flujo por agente fusionados sobre la entrada del modelo seleccionado en `agents.defaults.models`. Usa esto para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se fusiona en profundidad sobre `messages.tts`, así que conserva las credenciales compartidas del proveedor y la política de reserva en `messages.tts`, y configura aquí solo valores específicos de la persona, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando esté configurado; una lista explícita reemplaza los valores predeterminados en lugar de fusionarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel de razonamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se configura ninguna sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` conserva el razonamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se configura ninguna sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se configura ninguna sobrescritura de modo rápido por mensaje o sesión.
- `models`: sobrescrituras opcionales por agente del catálogo de modelos/runtime, indexadas por ids completos `provider/model`. Usa `models["provider/model"].agentRuntime` para excepciones de runtime por agente.
- `runtime`: descriptor de runtime opcional por agente. Usa `type: "acp"` con valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones de arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales relativos al espacio de trabajo en `identity.avatar` están limitados a 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban contra el límite local de tamaño de archivo.
- `identity` deriva valores predeterminados: `ackReaction` desde `emoji`, `mentionPatterns` desde `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ids de agentes configurados para destinos explícitos `sessions_spawn.agentId` (`["*"]` = cualquier destino configurado; predeterminado: solo el mismo agente). Incluye el id del solicitante cuando deban permitirse llamadas `agentId` autodirigidas. Las entradas obsoletas cuya configuración de agente se eliminó son rechazadas por `sessions_spawn` y omitidas de `agents_list`; ejecuta `openclaw doctor --fix` para limpiarlas, o agrega una entrada mínima `agents.list[]` si ese destino debe seguir pudiendo generarse mientras hereda valores predeterminados.
- Guarda de herencia del entorno aislado: si la sesión solicitante está en entorno aislado, `sessions_spawn` rechaza destinos que se ejecutarían sin entorno aislado.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; predeterminado: false).
- `subagents.maxConcurrent`: máximo de ejecuciones concurrentes de agentes hijos en la ejecución de subagentes. Predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: máximo de hijos activos que puede generar una sola sesión de agente. Predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para generación de subagentes (`1`-`5`). Predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: antigüedad antes de archivar el estado de subagente completado. Predeterminado: `60`.

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

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de vinculación de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin entorno aislado)">

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

<Accordion title="Herramientas de solo lectura + espacio de trabajo">

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

Consulta [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para conocer los detalles de precedencia.

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

<Accordion title="Detalles de campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una sola sesión (usar solo cuando se pretende un contexto compartido).
- **`dmScope`**: cómo se agrupan los MD.
  - `main`: todos los MD comparten la sesión principal.
  - `per-peer`: aislar por id de remitente entre canales.
  - `per-channel-peer`: aislar por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aislar por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Comandos de dock como `/dock_discord` usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal enlazado; consulta [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a la hora local `atHour`; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, vence el que expire primero. La vigencia del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Escrituras en segundo plano o por eventos del sistema, como heartbeat, activaciones de cron, notificaciones de exec y contabilidad del gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias/por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). Se acepta `dm` heredado como alias de `direct`.
- **`resetByChannel`**: anulaciones de restablecimiento por canal, indexadas por id de proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta prevalece por completo sobre `resetByType`/`reset` para esa sesión. Usar solo cuando un canal necesita un comportamiento de restablecimiento distinto de la política a nivel de tipo.
- **`mainKey`**: campo heredado. En tiempo de ejecución siempre se usa `"main"` para el bucket principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta de ida y vuelta entre agentes durante intercambios de agente a agente (entero, rango: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: limpieza del almacén de sesiones + controles de retención.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`). El tiempo de ejecución escribe la limpieza por lotes con un pequeño búfer de marca alta para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - Las sesiones breves de sondeo de ejecuciones de modelo del Gateway usan una retención fija de `24h`, pero la limpieza está condicionada por presión: solo elimina filas obsoletas de sondeos estrictos de ejecuciones de modelo cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Solo son elegibles las claves de sondeo explícitas estrictas que coinciden con `agent:*:explicit:model-run-<uuid>`; las sesiones directas, grupales, de hilo, Cron, hook, Heartbeat, ACP y de subagente normales no heredan esta retención de 24h. Cuando se ejecuta la limpieza de ejecuciones de modelo, se ejecuta antes de la limpieza más amplia de entradas obsoletas de `pruneAfter` y del límite `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. Usa `pruneAfter` de forma predeterminada; establece `false` para desactivar.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. Usa de forma predeterminada el `80%` de `maxDiskBytes`.
- **`writeLock`**: controles de bloqueo de escritura de transcripciones de sesión. Ajustar solo cuando la preparación legítima de transcripciones, la limpieza, Compaction o el trabajo de espejo compiten durante más tiempo que las políticas predeterminadas.
  - `acquireTimeoutMs`: milisegundos que se esperan al adquirir un bloqueo antes de informar que la sesión está ocupada. Predeterminado: `60000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: milisegundos antes de que un bloqueo existente se trate como obsoleto y se reclame. Predeterminado: `1800000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: milisegundos que un bloqueo mantenido en proceso puede permanecer retenido antes de que el watchdog lo libere. Predeterminado: `300000`; anulación por env `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático por inactividad predeterminado en horas (`0` desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: edad máxima estricta predeterminada en horas (`0` desactiva; los proveedores pueden anularlo)
  - `spawnSessions`: puerta predeterminada para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. Usa `true` de forma predeterminada cuando las vinculaciones de hilos están habilitadas; los proveedores/cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado de subagente para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). Usa `"fork"` de forma predeterminada.

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

Resolución (gana lo más específico): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción              | Ejemplo                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nombre corto del modelo  | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor     | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- De forma predeterminada usa `identity.emoji` del agente activo; de lo contrario, `"👀"`. Establece `""` para desactivarla.
- Sustituciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → alternativa de identidad.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all` u `off`/`none` (desactiva por completo las reacciones de confirmación).
- `removeAckAfterReply`: elimina la confirmación después de responder en canales compatibles con reacciones, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: habilita las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Slack y Discord, dejarlo sin definir mantiene habilitadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Signal, Telegram y WhatsApp, establécelo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.
- `messages.statusReactions.emojis`: sustituye las claves de emoji del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emoji configurados no admitidos recurren
  a la variante de estado admitida más cercana para ese chat.

### Cola

- `mode`: estrategia de cola para mensajes entrantes que llegan mientras una ejecución de sesión está activa. Valor predeterminado: `"steer"`.
  - `steer`: inyecta el nuevo prompt en la ejecución activa.
  - `followup`: ejecuta el nuevo prompt después de que termine la ejecución activa.
  - `collect`: agrupa mensajes compatibles y los ejecuta juntos más tarde.
  - `interrupt`: anula la ejecución activa antes de iniciar el prompt más reciente.
- `debounceMs`: retraso antes de despachar un mensaje en cola/dirigido. Valor predeterminado: `500`.
- `cap`: número máximo de mensajes en cola antes de aplicar la política de descarte. Valor predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas, pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: sustituciones de `mode` por canal, indexadas por id de proveedor.
- `debounceMsByChannel`: sustituciones de `debounceMs` por canal, indexadas por id de proveedor.

### Antirrebote de entrada

Agrupa mensajes rápidos de solo texto del mismo remitente en un único turno de agente. Los medios/adjuntos se vacían inmediatamente. Los comandos de control omiten el antirrebote. Valor predeterminado de `debounceMs`: `2000`.

### Otras claves de mensajes

- `messages.messagePrefix`: texto de prefijo antepuesto a los mensajes de usuario entrantes antes de que lleguen al runtime del agente. Úsalo con moderación para marcadores de contexto de canal.
- `messages.visibleReplies`: controla las respuestas visibles de origen en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada de pie de página de `/usage` y modo predeterminado de uso por respuesta (`off | tokens | full`, más el alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: disparadores de mención de mensajes de grupo y ajuste del tamaño de la ventana de historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias de error de herramienta `⚠️` que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede reintentarlo). Valor predeterminado: `false`.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (predeterminado) | always | inbound | tagged
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
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` es opcional.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos son propiedad del Plugin. Si `plugins.allow` está definido, incluye cada Plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El id de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de TTS de OpenAI. El orden de resolución es la configuración, luego `OPENAI_TTS_BASE_URL` y luego `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Talk

Valores predeterminados para el modo Talk (macOS/iOS/Android).

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
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves planas heredadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los IDs de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` (comportamiento del cliente de Talk de macOS).
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` se aplica solo cuando no hay ninguna clave de API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el asistente local MLX de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción MLX de macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real de Talk de Control UI. Déjalo sin definir para conservar el comportamiento normal de sesión/modelo.
- `consultFastMode` establece una anulación puntual de modo rápido para las consultas en tiempo real de Talk de Control UI sin cambiar la configuración normal de modo rápido de la sesión.
- `speechLocale` establece el id de configuración regional BCP 47 usado por el reconocimiento de voz de Talk en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk después del silencio del usuario antes de enviar la transcripción. Si no se define, se mantiene la ventana de pausa predeterminada de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones de sistema dirigidas al proveedor al prompt en tiempo real integrado de OpenClaw, de modo que el estilo de voz pueda configurarse sin perder la orientación predeterminada de `openclaw_agent_consult`.
- `realtime.consultRouting`: `"provider-direct"` (predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real produce una transcripción final del usuario sin `openclaw_agent_consult`. `"force-agent-consult"` enruta la solicitud finalizada a través de OpenClaw en su lugar.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
