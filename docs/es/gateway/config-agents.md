---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, medios, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajustar el comportamiento de sesión, entrega de mensajes y modo de conversación
summary: Valores predeterminados de agentes, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-05T01:56:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28ffd1dbee664b692993a1029732e6d6cc01031864a8784e5c1efb3bdc0a356d
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, entorno de ejecución de Gateway y otras
claves de nivel superior, consulta la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados del agente

### `agents.defaults.workspace`

Valor predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está definido; de lo contrario, `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Usa la variable de entorno para apuntar los agentes predeterminados
a un espacio de trabajo montado cuando no quieras escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos opcional predeterminada de Skills para agentes que no definen
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

- Omite `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Define `agents.list[].skills: []` para no usar Skills.
- Una lista `agents.list[].skills` no vacía es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de arranque del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del espacio de trabajo mientras sigue escribiendo los archivos de arranque obligatorios. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla cuándo se inyectan los archivos de arranque del espacio de trabajo en el prompt del sistema. Valor predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del arranque del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva la inyección del arranque del espacio de trabajo y de archivos de contexto en todos los turnos. Úsalo solo para agentes que controlan completamente su ciclo de vida del prompt (motores de contexto personalizados, entornos de ejecución nativos que construyen su propio contexto o flujos de trabajo especializados sin arranque). Los turnos de Heartbeat y de recuperación tras Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Anulación por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo de arranque del espacio de trabajo antes del truncamiento. Valor predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Anulación por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos de arranque del espacio de trabajo. Valor predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Anulación por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Anulaciones de perfil de arranque por agente

Usa anulaciones de perfil de arranque por agente cuando un agente necesita un comportamiento de
inyección de prompt distinto de los valores predeterminados compartidos. Los campos omitidos heredan de
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

Controla el aviso visible para el agente en el prompt del sistema cuando se trunca el contexto de arranque.
Valor predeterminado: `"always"`.

- `"off"`: nunca inyecta texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyecta un aviso conciso una vez por firma de truncamiento única.
- `"always"`: inyecta un aviso conciso en cada ejecución cuando existe truncamiento (recomendado).

Los recuentos detallados sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
informes de contexto/estado y registros; el contexto rutinario de usuario/entorno de ejecución de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de gran volumen, y se
dividen intencionalmente por subsistema en lugar de pasar todos por una única
opción genérica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección normal del arranque del espacio de trabajo.
- `agents.defaults.startupContext.*`:
  preludio de ejecución de modelo único en reinicio/inicio, incluidos archivos diarios recientes
  `memory/*.md`. Los comandos de chat simples `/new` y `/reset` se
  reconocen sin invocar el modelo.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos acotados del entorno de ejecución y bloques inyectados propiedad del entorno de ejecución.
- `memory.qmd.limits.*`:
  tamaño de fragmentos de búsqueda de memoria indexada e inyección.

Usa la anulación por agente correspondiente solo cuando un agente necesita un
presupuesto distinto:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones de modelo de reinicio/inicio.
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

Valores predeterminados compartidos para superficies de contexto del entorno de ejecución acotadas.

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

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de que se añadan
  metadatos de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: techo avanzado de resultados de herramientas en vivo usado para resultados persistidos
  y recuperación de desbordamiento. Déjalo sin definir para el límite automático de contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres a partir de 100K tokens y `64000`
  caracteres a partir de 200K tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue limitado a aproximadamente el 30 %
  de la ventana de contexto del modelo. `openclaw doctor --deep` imprime el límite efectivo,
  y doctor solo advierte cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite de extracto de AGENTS.md usado durante la inyección de
  actualización posterior a Compaction.

#### `agents.list[].contextLimits`

Anulación por agente para las opciones compartidas de `contextLimits`. Los campos omitidos heredan
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
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
no afecta a la lectura de archivos `SKILL.md` bajo demanda.

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

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imagen de transcripción/herramienta antes de llamadas al proveedor.
Valor predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de solicitudes para ejecuciones con muchas capturas de pantalla.
Los valores más altos preservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de herramientas de imagen para imágenes cargadas desde rutas de archivo, URLs y referencias de medios.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imagen seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL y los modelos de visión alojados Llama 4 pueden usar imágenes más grandes que las rutas de visión de alto detalle anteriores/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en modo `auto` para controlar el coste de tokens y latencia.

Valores:

- `auto`: se adapta a los límites del modelo y al recuento de imágenes.
- `efficient`: prefiere imágenes más pequeñas para menor uso de tokens y bytes.
- `balanced`: usa la escala estándar de punto medio.
- `high`: preserva más detalle para capturas de pantalla, diagramas e imágenes de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de mensajes). Recurre a la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el prompt del sistema. Valor predeterminado: `auto` (preferencia del SO).

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
      maxConcurrent: 3,
    },
  },
}
```

- `model`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La forma de cadena establece solo el modelo principal.
  - La forma de objeto establece el principal más modelos de conmutación por error ordenados.
- `utilityModel`: referencia opcional `provider/model` o alias para tareas internas breves. Actualmente impulsa los títulos generados de sesiones de Control UI, los títulos de temas de DM de Telegram y los títulos automáticos de hilos de Discord. Estas tareas recurren al modelo principal del agente cuando no está configurado; `agents.list[].utilityModel` reemplaza el valor predeterminado, y una anulación de modelo específica de la operación tiene prioridad sobre ambos.
  Las tareas de utilidad hacen llamadas de modelo separadas y envían contenido específico de la tarea al proveedor de modelos seleccionado. La generación de títulos del panel envía como máximo los primeros 1.000 caracteres del primer mensaje que no sea de comando. Elige un proveedor que coincida con tus requisitos de costo y manejo de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere referencias explícitas `provider/model`. Se aceptan IDs sin prefijo por compatibilidad; si un ID sin prefijo coincide de forma única con una entrada configurada compatible con imágenes en `models.providers.*.models`, OpenClaw lo califica para ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, o `openai/gpt-image-1.5` para salida PNG/WebP de OpenAI con fondo transparente.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación del proveedor correspondiente (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de imágenes en orden de ID de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de música en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores restantes registrados de generación de video en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
  - El plugin oficial de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Usado por la herramienta `pdf` para el enrutamiento de modelos.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: páginas máximas predeterminadas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramientas en borradores de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (anexa comando/detalle sin procesar cuando esté disponible). `agents.list[].toolProgressDetail` por agente reemplaza este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente reemplaza este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos Gateway de administrador operador cuando no hay una anulación de razonamiento por mensaje o sesión configurada.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej., `openai/gpt-5.5` para acceso con clave de API de OpenAI u OAuth de Codex). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese ID de modelo exacto y solo después recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa entradas `provider/*` como `"openai/*": {}` o `"vllm/*": {}` para mostrar todos los modelos descubiertos para proveedores seleccionados sin listar manualmente cada ID de modelo.
  - Agrega `agentRuntime` a una entrada `provider/*` cuando todos los modelos descubiertos dinámicamente para ese proveedor deban usar el mismo runtime. La política de runtime exacta `provider/model` sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para agregar entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos a menos que pases `--replace`.
  - Los flujos de configuración/onboarding con alcance de proveedor combinan los modelos de proveedor seleccionados en este mapa y conservan proveedores no relacionados ya configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para anular el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros globales predeterminados de proveedor aplicados a todos los modelos. Se configuran en `agents.defaults.params` (p. ej. `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) es reemplazado por `agents.defaults.models["provider/model"].params` (por modelo), luego `agents.list[].params` (ID de agente coincidente) reemplaza por clave. Consulta [almacenamiento en caché de prompts](/es/reference/prompt-caching) para más detalles.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw reenvía esto al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros de agente reemplazan por clave. Consulta [enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo combinado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo extra gana; las rutas de completions no nativas siguen eliminando después `store` exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI combinados en cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con pensamiento desactivado, el plugin integrado de vLLM envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito reemplaza los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene precedencia final. Los modelos configurados de pensamiento Qwen y Nemotron de vLLM exponen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo multinivel.
- `compat.thinkingFormat`: estilo de carga útil de pensamiento compatible con OpenAI. Usa `"together"` para `reasoning.enabled` al estilo Together, `"qwen"` para `enable_thinking` de nivel superior al estilo Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. OpenClaw asigna pensamiento deshabilitado a `false` y pensamiento habilitado a `true`, y los modelos Qwen configurados de vLLM exponen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento compatible con OpenAI por modelo. Incluye `"xhigh"` para endpoints personalizados que realmente lo acepten; OpenClaw entonces expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend quiera un valor específico de proveedor para un nivel canónico.
- `params.preserveThinking`: opción explícita solo de Z.AI para pensamiento preservado. Cuando está habilitada y el pensamiento está activado, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` anterior; consulta [pensamiento y pensamiento preservado de Z.AI](/es/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestor de procesos opcional a nivel de proveedor para servidores de modelos locales/autohospedados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint está inactivo, espera hasta `readyTimeoutMs` y luego envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso vivo hasta que OpenClaw sale; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos inactivos. Consulta [servicios de modelos locales](/es/gateway/local-model-services).
- La política de runtime pertenece a proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas de modelo. Los modelos de agente de OpenAI en el proveedor oficial de OpenAI seleccionan Codex de forma predeterminada.
- Los escritores de configuración que mutan estos campos (por ejemplo, `/models set`, `/models set-image` y comandos para agregar/eliminar respaldos) guardan la forma canónica de objeto y conservan las listas de respaldos existentes cuando es posible.
- `maxConcurrent`: ejecuciones máximas de agente en paralelo entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

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

- `id`: `"auto"`, `"openclaw"`, un id de arnés de Plugin registrado o un alias de backend de CLI compatible. El Plugin Codex incluido registra `codex`; el Plugin Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los arneses de Plugin registrados reclamen turnos compatibles y usa OpenClaw cuando ningún arnés coincide. Un runtime de Plugin explícito como `id: "codex"` requiere ese arnés y falla de forma cerrada si no está disponible o falla.
- `id: "pi"` se acepta solo como alias obsoleto de `openclaw` para conservar configuraciones publicadas desde v2026.5.22 y anteriores. La configuración nueva debe usar `openclaw`.
- La precedencia de runtime es primero la política de modelo exacta (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), luego `agents.list[]` / `agents.defaults.models["provider/*"]`, y después la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime de agente completo son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, los pines de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` se ignoran en la selección de runtime. Ejecuta `openclaw doctor --fix` para eliminar valores obsoletos.
- Los modelos de agente de OpenAI usan el arnés Codex de forma predeterminada; `agentRuntime.id: "codex"` de proveedor/modelo sigue siendo válido cuando quieras hacerlo explícito.
- Para despliegues de Claude CLI, prefiere `model: "anthropic/claude-opus-4-8"` más `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` aún funcionan por compatibilidad, pero la configuración nueva debe mantener la selección de proveedor/modelo canónica y colocar el backend de ejecución en la política de runtime de proveedor/modelo.
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

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento a menos que definas `--thinking off` o configures `agents.defaults.models["zai/<model>"].params.thinking` tú mismo.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas a herramientas. Configura `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando el razonamiento adaptativo se activa explícitamente, el valor predeterminado de esfuerzo propiedad del proveedor Anthropic es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se define un nivel de razonamiento explícito.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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

- Los backends de CLI priorizan texto; las herramientas siempre están desactivadas.
- Las sesiones son compatibles cuando `sessionArg` está configurado.
- El paso directo de imágenes es compatible cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas seguras desde una cola acotada de transcripción sin procesar de OpenClaw antes de que exista el primer resumen de Compaction. Los cambios de perfil de autenticación o de época de credenciales nunca vuelven a sembrar desde datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos en superficies de prompt ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en todas las rutas OpenClaw/proveedor; `personality` controla solo la capa de estilo de interacción amigable. Las rutas nativas del servidor de aplicación Codex conservan las instrucciones base/modelo propiedad de Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para hilos nativos.

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
- El valor heredado `plugins.entries.openai.config.personality` todavía se lee cuando esta configuración compartida no está definida.

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

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Configúralo en `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de error de herramienta durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de Heartbeat antes de abortarlo. Déjalo sin definir para usar `agents.defaults.timeoutSeconds` cuando esté configurado; de lo contrario, usa la cadencia de Heartbeat limitada a 600 segundos.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se difieren en los carriles ocupados adicionales de ese agente: su propio subagente con clave de sesión o trabajo de comandos anidado. Los carriles Cron siempre difieren los Heartbeats, incluso sin esta marca.
- Por agente: configura `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos de agente completos: intervalos más cortos consumen más tokens.

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
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` o `safeguard` (resumen fragmentado para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin proveedor de compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen integrado con LLM. Recurre al integrado en caso de error. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de compaction antes de que OpenClaw la aborte. Valor predeterminado: `180`.
- `keepRecentTokens`: presupuesto de punto de corte del agente para conservar literalmente la cola más reciente de la transcripción. `/compact` manual respeta esto cuando se establece explícitamente; de lo contrario, la compaction manual es un punto de control estricto.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone durante el resumen de compaction la guía integrada para retención de identificadores opacos.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores que se usa cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida mal formada para resúmenes de salvaguarda. Activado de forma predeterminada en modo salvaguarda; establece `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión de contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, aborta el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de precomprobación existente para truncar resultados de herramientas o compactar y reintentar. Funciona con los modos de compaction `default` y `safeguard`. Valor predeterminado: desactivado.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de la compaction. La reinyección se desactiva cuando no se establece o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` activa ese par y conserva la alternativa heredada `Every Session`/`Safety`. Activa esto solo cuando el contexto adicional compense el riesgo de duplicar la guía del proyecto ya capturada en el resumen de compaction.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` solo para resumen de compaction. Los alias simples se resuelven antes del despacho; los ID de modelo literales configurados conservan precedencia en caso de colisiones. Usa esto cuando la sesión principal deba mantener un modelo, pero los resúmenes de compaction deban ejecutarse en otro; cuando no se establece, la compaction usa el modelo principal de la sesión.
- `maxActiveTranscriptBytes`: umbral opcional de bytes (`number` o cadenas como `"20mb"`) que desencadena la compaction local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una compaction correcta pueda rotar a una transcripción sucesora más pequeña. Desactivado cuando no se establece o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando empieza la compaction y cuando se completa (por ejemplo, "Compactando contexto..." y "Compaction completa"). Desactivado de forma predeterminada para mantener la compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la compaction automática para almacenar recuerdos duraderos. Establece `model` en un proveedor/modelo exacto como `ollama/qwen3:8b` cuando este turno de mantenimiento deba permanecer en un modelo local; la anulación no hereda la cadena de alternativas de la sesión activa. Se omite cuando el área de trabajo es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteración de reintento del bucle de ejecución externo para el runtime de agente integrado, a fin de evitar bucles de ejecución infinitos durante la recuperación de fallos. Ten en cuenta que esta configuración actualmente solo se aplica al runtime de agente integrado, no a los runtimes ACP ni CLI.

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
        runRetries: { max: 50 }, // anulaciones opcionales por agente
      },
    ],
  },
}
```

- `base`: número base de iteraciones de reintento de ejecución para el bucle de ejecución externo. Valor predeterminado: `24`.
- `perProfile`: iteraciones adicionales de reintento de ejecución concedidas por cada candidato de perfil alternativo. Valor predeterminado: `8`.
- `min`: límite absoluto mínimo para las iteraciones de reintento de ejecución. Valor predeterminado: `32`.
- `max`: límite absoluto máximo para las iteraciones de reintento de ejecución, a fin de evitar ejecuciones descontroladas. Valor predeterminado: `160`.

### `agents.defaults.contextPruning`

Recorta **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duración (ms/s/m/h), unidad predeterminada: minutos
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

- `mode: "cache-ttl"` activa las pasadas de recorte.
- `ttl` controla con qué frecuencia puede volver a ejecutarse el recorte (después del último toque de caché).
- El recorte primero aplica recorte suave a los resultados de herramientas sobredimensionados y luego, si es necesario, borra por completo resultados de herramientas más antiguos.
- `softTrimRatio` y `hardClearRatio` aceptan valores de `0.0` a `1.0`; la validación de configuración rechaza valores fuera de ese rango.

**Recorte suave** conserva el inicio + el final e inserta `...` en el medio.

**Borrado completo** reemplaza todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si hay menos de `keepLastAssistants` mensajes de asistente, se omite el recorte.

</Accordion>

Consulta [Recorte de sesiones](/es/concepts/session-pruning) para detalles de comportamiento.

### Streaming por bloques

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

- Los canales que no sean Telegram requieren `*.blockStreaming: true` explícito para activar respuestas por bloques.
- Anulaciones de canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan de forma predeterminada `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500 ms. Anulación por agente: `agents.list[].humanDelay`.

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
- Anulaciones por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para el agente integrado. Consulta [Sandboxing](/es/gateway/sandboxing) para ver la guía completa.

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

<Accordion title="Detalles del sandbox">

**Backend:**

- `docker`: runtime local de Docker (predeterminado)
- `ssh`: runtime remoto genérico respaldado por SSH
- `openshell`: runtime de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del runtime se mueve a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando de cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para áreas de trabajo por ámbito
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido en línea o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que empiece la sesión de sandbox

**Comportamiento del backend SSH:**

- inicializa el área de trabajo remota una vez tras crear o recrear
- luego mantiene canónica el área de trabajo SSH remota
- enruta `exec`, herramientas de archivos y rutas multimedia por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador de sandbox

**Acceso al área de trabajo:**

- `none`: área de trabajo de sandbox por ámbito bajo `~/.openclaw/sandboxes`
- `ro`: área de trabajo de sandbox en `/workspace`, área de trabajo del agente montada en modo de solo lectura en `/agent`
- `rw`: área de trabajo del agente montada en modo de lectura/escritura en `/workspace`

**Ámbito:**

- `session`: contenedor + área de trabajo por sesión
- `agent`: un contenedor + área de trabajo por agente (predeterminado)
- `shared`: contenedor y área de trabajo compartidos (sin aislamiento entre sesiones)

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
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id de política opcional de OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo de OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de la ejecución, sincroniza de vuelta después de la ejecución; el espacio de trabajo local sigue siendo canónico
- `remote`: inicializa el remoto una vez cuando se crea el sandbox y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente en el sandbox después del paso de inicialización.
El transporte es SSH hacia el sandbox de OpenShell, pero el plugin posee el ciclo de vida del sandbox y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: configúralo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada salvo que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ruptura de emergencia).
Los turnos del servidor de aplicaciones de Codex en un sandbox activo de OpenClaw usan esta misma configuración de salida para su acceso de red nativo en modo de código.

**Los adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los enlaces globales y por agente se fusionan.

**Navegador en sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. URL de noVNC inyectada en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador de noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL de token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) bloquea que las sesiones en sandbox apunten al navegador del host.
- `network` toma `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Configúralo en `bridge` solo cuando quieras explícitamente conectividad bridge global.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador en sandbox. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de lanzamiento se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts de contenedores:
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; configura `0` para usar el
    límite de procesos predeterminado de Chromium.
  - más `--no-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen de contenedor; usa una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` son solo para Docker.

Compila imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # imagen principal del sandbox
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

Para instalaciones npm sin un checkout del código fuente, consulta [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para comandos `docker build` en línea.

### `agents.list` (sobrescrituras por agente)

Usa `agents.list[].tts` para dar a un agente su propio proveedor TTS, voz, modelo,
estilo o modo TTS automático. El bloque del agente se fusiona profundamente sobre
`messages.tts`, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras los agentes individuales
sobrescriben solo los campos de voz o proveedor que necesitan. La sobrescritura del agente activo
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
        model: "anthropic/claude-opus-4-6", // o { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // sobrescritura del nivel de pensamiento por agente
        reasoningDefault: "on", // sobrescritura de visibilidad de razonamiento por agente
        fastModeDefault: false, // sobrescritura de modo rápido por agente
        params: { cacheRetention: "none" }, // sobrescribe por clave los params coincidentes de defaults.models
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // reemplaza agents.defaults.skills cuando se configura
        identity: {
          name: "Samantha",
          theme: "perezoso servicial",
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

- `id`: id estable del agente (obligatorio).
- `default`: cuando se configuran varios, gana el primero (se registra una advertencia). Si no se configura ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena define un primario estricto por agente sin reserva de modelo; la forma de objeto `{ primary }` también es estricta salvo que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para habilitar reserva en ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo sobrescriben `primary` siguen heredando las reservas predeterminadas salvo que configures `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas breves, como títulos generados de sesión e hilo. Recurre a `agents.defaults.utilityModel` y luego al modelo principal de este agente.
- `params`: parámetros de stream por agente fusionados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Úsalo para sobrescrituras específicas del agente, como `cacheRetention`, `temperature` o `maxTokens`, sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se fusiona profundamente sobre `messages.tts`, así que mantén las credenciales compartidas del proveedor y la política de reserva en `messages.tts`, y configura aquí solo valores específicos de la persona, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de fusionarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no hay sobrescritura por mensaje o sesión. El perfil del proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se configura una sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para modo rápido (`"auto" | true | false`). Se aplica cuando no se configura una sobrescritura de modo rápido por mensaje o sesión.
- `models`: catálogo de modelos opcional por agente/sobrescrituras de runtime indexadas por ids completos `provider/model`. Usa `models["provider/model"].agentRuntime` para excepciones de runtime por agente.
- `runtime`: descriptor de runtime opcional por agente. Usa `type: "acp"` con valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones de arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen `identity.avatar` locales relativos al espacio de trabajo están limitados a 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban con el límite local de tamaño de archivo.
- `identity` deriva valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ids de agentes configurados para objetivos explícitos `sessions_spawn.agentId` (`["*"]` = cualquier objetivo configurado; predeterminado: solo el mismo agente). Incluye el id del solicitante cuando se deban permitir llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se eliminó son rechazadas por `sessions_spawn` y omitidas de `agents_list`; ejecuta `openclaw doctor --fix` para limpiarlas, o agrega una entrada mínima `agents.list[]` si ese objetivo debe seguir pudiendo generarse mientras hereda los valores predeterminados.
- Guardia de herencia del sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza objetivos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; predeterminado: false).

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

### Campos de coincidencia de enlaces

- `type` (opcional): `route` para enrutamiento normal (si falta type, el valor predeterminado es route), `acp` para enlaces persistentes de conversación ACP.
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

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de enlaces de ruta anterior.

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

<Accordion title="No filesystem access (messaging only)">

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

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver los detalles de precedencia.

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
      mode: "enforce", // enforce (default) | warn
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

<Accordion title="Session field details">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una sola sesión (úsalo solo cuando se pretenda compartir el contexto).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aísla por id de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para multicuenta).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulta [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a la hora local `atHour`; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, gana el que caduque primero. La vigencia del restablecimiento diario usa el `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras de eventos de fondo/sistema como Heartbeat, activaciones de Cron, notificaciones de exec y contabilidad de Gateway pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias/por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). Se acepta el `dm` heredado como alias de `direct`.
- **`mainKey`**: campo heredado. En tiempo de ejecución siempre se usa `"main"` para el contenedor principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta de ida y vuelta entre agentes durante intercambios de agente a agente (entero, rango: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación prevalece.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`). En tiempo de ejecución se escribe la limpieza por lotes con un pequeño búfer de nivel alto para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite de inmediato.
  - Las sesiones efímeras de sondeo de ejecución de modelos de Gateway usan retención fija de `24h`, pero la limpieza está regulada por presión: solo elimina filas obsoletas estrictas de sondeo de ejecución de modelos cuando se alcanza presión de mantenimiento/límite de entradas de sesión. Solo las claves explícitas estrictas de sondeo que coinciden con `agent:*:explicit:model-run-<uuid>` son elegibles; las sesiones normales directas, grupales, de hilo, Cron, hook, Heartbeat, ACP y de subagente no heredan esta retención de 24 h. Cuando se ejecuta la limpieza de ejecución de modelos, se ejecuta antes de la limpieza más amplia de entradas obsoletas `pruneAfter` y del límite `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. De forma predeterminada usa `pruneAfter`; establece `false` para desactivarla.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. De forma predeterminada es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculada a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: antigüedad máxima estricta predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: puerta predeterminada para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. De forma predeterminada es `true` cuando los vínculos de hilo están activados; los proveedores/cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado de subagente para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). De forma predeterminada es `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
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

Resolución (gana la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción                  | Ejemplo                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor         | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen mayúsculas de minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de acuse

- De forma predeterminada usa `identity.emoji` del agente activo; si no, `"👀"`. Establece `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina el acuse después de responder en canales con soporte de reacciones como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: activa las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Slack y Discord, si no se define, mantiene activadas las reacciones de estado cuando las reacciones de acuse están activas.
  En Signal, Telegram y WhatsApp, establécelo explícitamente en `true` para activar las reacciones de estado del ciclo de vida.
- `messages.statusReactions.emojis`: anula las claves de emoji del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emojis configurados no compatibles recurren
  a la variante de estado compatible más cercana para ese chat.

### Antirrebote de entrada

Agrupa mensajes rápidos solo de texto del mismo remitente en un solo turno del agente. Los medios/adjuntos se envían de inmediato. Los comandos de control omiten el antirrebote.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controla el modo auto-TTS predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede sobrescribir las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` sobrescribe `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada; `modelOverrides.allowProvider` toma `false` como valor predeterminado (activación opcional).
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos son propiedad de cada plugin. Si `plugins.allow` está configurado, incluye cada plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El id de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` sobrescribe el endpoint de TTS de OpenAI. El orden de resolución es configuración, luego `OPENAI_TTS_BASE_URL`, luego `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Hablar

Valores predeterminados para el modo Hablar (macOS/iOS/Android).

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
          speakerVoice: "cedar",
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

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves planas heredadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los ID de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- El recurso a `ELEVENLABS_API_KEY` solo se aplica cuando no hay ninguna clave de API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el asistente local MLX de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción MLX en macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` sobrescribe la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento para la ejecución completa del agente OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real de Talk de Control UI. Déjalo sin configurar para conservar el comportamiento normal de sesión/modelo.
- `consultFastMode` establece una sobrescritura de modo rápido de un solo uso para las consultas en tiempo real de Talk de Control UI sin cambiar la configuración normal de modo rápido de la sesión.
- `speechLocale` establece el id de configuración regional BCP 47 usado por el reconocimiento de voz de Talk en iOS/macOS. Déjalo sin configurar para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk después del silencio del usuario antes de enviar la transcripción. Sin configurar mantiene la ventana de pausa predeterminada de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones de sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw, para que el estilo de voz pueda configurarse sin perder la orientación predeterminada de `openclaw_agent_consult`.
- `realtime.consultRouting` controla la alternativa de retransmisión de Gateway cuando el proveedor en tiempo real produce una transcripción final del usuario sin `openclaw_agent_consult`: `provider-direct` conserva las respuestas directas del proveedor, mientras que `force-agent-consult` enruta la solicitud finalizada a través de OpenClaw.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
