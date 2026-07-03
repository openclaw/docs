---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, multimedia, Skills)
    - Configuración de enrutamiento y vinculaciones multiagente
    - Ajustar el comportamiento de sesión, entrega de mensajes y modo de conversación
summary: Valores predeterminados de agentes, enrutamiento multiagente, sesión, mensajes y configuración de conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-03T13:16:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, runtime de Gateway y otras
claves de nivel superior, consulta la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de agente

### `agents.defaults.workspace`

Valor predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está definido; de lo contrario, `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Usa la variable de entorno para apuntar los agentes
predeterminados a un workspace montado cuando no quieras escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz de repositorio opcional que se muestra en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente subiendo desde el workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist opcional de skill predeterminada para agentes que no configuran
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

- Omite `agents.defaults.skills` para permitir skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Define `agents.list[].skills: []` para no permitir skills.
- Una lista no vacía de `agents.list[].skills` es el conjunto final para ese agente; no
  se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del workspace, pero sigue escribiendo los archivos bootstrap obligatorios. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla cuándo se inyectan los archivos bootstrap del workspace en el prompt del sistema. Valor predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del workspace, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva el bootstrap del workspace y la inyección de archivos de contexto en cada turno. Usa esto solo para agentes que controlan por completo el ciclo de vida de su prompt (motores de contexto personalizados, runtimes nativos que construyen su propio contexto o flujos de trabajo especializados sin bootstrap). Los turnos de Heartbeat y de recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Anulación por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del workspace antes del truncamiento. Valor predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Anulación por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos bootstrap del workspace. Valor predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Anulación por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Anulaciones de perfil bootstrap por agente

Usa anulaciones de perfil bootstrap por agente cuando un agente necesita un comportamiento de
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

Controla el aviso visible para el agente en el prompt del sistema cuando se trunca el contexto bootstrap.
Valor predeterminado: `"always"`.

- `"off"`: nunca inyecta texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inyecta un aviso conciso una vez por cada firma de truncamiento única.
- `"always"`: inyecta un aviso conciso en cada ejecución cuando existe truncamiento (recomendado).

Los conteos detallados sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
informes de contexto/estado y logs; el contexto rutinario de usuario/runtime de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionalmente por subsistema en lugar de pasar todos por una sola
perilla genérica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección normal de bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio de una sola vez para ejecución del modelo en restablecimiento/inicio, incluidos archivos recientes diarios
  `memory/*.md`. Los comandos simples de chat `/new` y `/reset` se
  reconocen sin invocar el modelo.
- `skills.limits.*`:
  la lista compacta de skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  fragmentos acotados de runtime y bloques inyectados propiedad del runtime.
- `memory.qmd.limits.*`:
  tamaño de fragmentos de búsqueda de memoria indexada e inyección.

Usa la anulación por agente correspondiente solo cuando un agente necesite un
presupuesto diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones del modelo de restablecimiento/inicio.
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

- `memoryGetMaxChars`: límite predeterminado del fragmento `memory_get` antes de que se agreguen los
  metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se
  omite `lines`.
- `toolResultMaxChars`: techo avanzado para resultados de herramientas en vivo usado para resultados
  persistidos y recuperación por desbordamiento. Déjalo sin definir para el límite automático del contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres a partir de 100K tokens, y `64000`
  caracteres a partir de 200K tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue estando limitado aproximadamente al 30% de
  la ventana de contexto del modelo. `openclaw doctor --deep` imprime el límite efectivo,
  y doctor advierte solo cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite de fragmento de AGENTS.md usado durante la inyección de actualización
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

Límite global para la lista compacta de skills inyectada en el prompt del sistema. Esto
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

Anulación por agente para el presupuesto del prompt de skills.

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
Valor predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de herramientas de imagen para imágenes cargadas desde rutas de archivo, URLs y referencias multimedia.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imagen seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL y los modelos de visión Llama 4 alojados pueden usar imágenes más grandes que las rutas de visión de alto detalle anteriores/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en modo `auto` para controlar el costo de tokens y la latencia.

Valores:

- `auto`: adaptarse a los límites del modelo y al número de imágenes.
- `efficient`: preferir imágenes más pequeñas para menor uso de tokens y bytes.
- `balanced`: usar la escala intermedia estándar.
- `high`: conservar más detalle para capturas de pantalla, diagramas e imágenes de documentos.

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
  - La forma de cadena define solo el modelo principal.
  - La forma de objeto define el principal más modelos de conmutación por error ordenados.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de reserva cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
  - Prefiere referencias explícitas `provider/model`. Se aceptan ID simples por compatibilidad; si un ID simple coincide de forma única con una entrada configurada compatible con imágenes en `models.providers.*.models`, OpenClaw lo califica para ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de imágenes y cualquier superficie futura de herramienta/Plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, o `openai/gpt-image-1.5` para salida OpenAI PNG/WebP con fondo transparente.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación del proveedor correspondiente (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de imágenes registrados restantes en orden de ID de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de música registrados restantes en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de video registrados restantes en orden de ID de proveedor.
  - Si seleccionas directamente un proveedor/modelo, configura también la autenticación/clave de API del proveedor correspondiente.
  - El Plugin oficial de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la herramienta `pdf` para el enrutamiento de modelos.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando no se pasa `maxBytesMb` en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas consideradas por el modo de reserva de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para resúmenes de herramientas de `/verbose` y líneas de herramienta de borrador de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (anexa comando/detalle sin procesar cuando esté disponible). `agents.list[].toolProgressDetail` por agente anula este valor predeterminado.
- `reasoningDefault`: visibilidad de razonamiento predeterminada para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente anula este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican para propietarios, remitentes autorizados o contextos de Gateway de administrador operador cuando no se define una anulación de razonamiento por mensaje o por sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej., `openai/gpt-5.5` para acceso con clave de API de OpenAI u OAuth de Codex). Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese ID de modelo exacto, y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa entradas `provider/*`, como `"openai/*": {}` o `"vllm/*": {}`, para mostrar todos los modelos descubiertos de proveedores seleccionados sin enumerar manualmente cada ID de modelo.
  - Añade `agentRuntime` a una entrada `provider/*` cuando todos los modelos descubiertos dinámicamente para ese proveedor deban usar el mismo runtime. La política de runtime exacta de `provider/model` sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos, a menos que pases `--replace`.
  - Los flujos de configuración/incorporación con alcance de proveedor fusionan los modelos de proveedor seleccionados en este mapa y conservan los proveedores no relacionados ya configurados.
  - Para modelos directos de OpenAI Responses, la compactación del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para anular el umbral. Consulta [compactación del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros globales predeterminados de proveedor aplicados a todos los modelos. Se define en `agents.defaults.params` (p. ej., `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) es anulado por `agents.defaults.models["provider/model"].params` (por modelo), y luego `agents.list[].params` (ID de agente coincidente) anula por clave. Consulta [almacenamiento en caché de prompts](/es/reference/prompt-caching) para más detalles.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw reenvía esto al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente anulan por clave. Consulta [enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo fusionado en cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si colisiona con claves de solicitud generadas, el cuerpo adicional gana; las rutas de completions no nativas siguen quitando después `store` solo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI fusionados en cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con thinking desactivado, el Plugin integrado de vLLM envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; `chat_template_kwargs` explícito anula los valores predeterminados generados, y `extra_body.chat_template_kwargs` aún tiene la precedencia final. Los modelos configurados de thinking de vLLM Qwen y Nemotron exponen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo multinivel.
- `compat.thinkingFormat`: estilo de carga útil de thinking compatible con OpenAI. Usa `"together"` para `reasoning.enabled` de estilo Together, `"qwen"` para `enable_thinking` de nivel superior estilo Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. OpenClaw asigna thinking desactivado a `false` y thinking activado a `true`, y los modelos vLLM Qwen configurados exponen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento compatible con OpenAI por modelo. Incluye `"xhigh"` para endpoints personalizados que realmente lo acepten; OpenClaw entonces expone `/think xhigh` en menús de comandos, filas de sesión de Gateway, validación de parches de sesión, validación de CLI de agente y validación de `llm-task` para ese proveedor/modelo configurado. Usa `compat.reasoningEffortMap` cuando el backend espera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: opción de aceptación explícita solo para Z.AI para thinking preservado. Cuando está habilitada y thinking está activado, OpenClaw envía `thinking.clear_thinking: false` y reproduce `reasoning_content` previo; consulta [thinking de Z.AI y thinking preservado](/es/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestor opcional de procesos de nivel de proveedor para servidores de modelos locales/autohospedados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint está caído, espera hasta `readyTimeoutMs` y luego envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw sale; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos inactivos. Consulta [servicios de modelos locales](/es/gateway/local-model-services).
- La política de runtime pertenece a proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas del modelo. Los modelos de agente OpenAI del proveedor oficial OpenAI seleccionan Codex de forma predeterminada.
- Los escritores de configuración que mutan estos campos (por ejemplo, `/models set`, `/models set-image` y comandos para añadir/eliminar reservas) guardan la forma de objeto canónica y conservan las listas de reserva existentes cuando sea posible.
- `maxConcurrent`: número máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

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

- `id`: `"auto"`, `"openclaw"`, un id de harness de Plugin registrado o un alias de backend de CLI compatible. El Plugin Codex incluido registra `codex`; el Plugin Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los harnesses de Plugin registrados reclamen turnos compatibles y usa OpenClaw cuando ningún harness coincide. Un runtime de Plugin explícito como `id: "codex"` requiere ese harness y falla de forma cerrada si no está disponible o falla.
- `id: "pi"` se acepta solo como alias obsoleto de `openclaw` para preservar configuraciones publicadas desde v2026.5.22 y anteriores. La configuración nueva debería usar `openclaw`.
- La precedencia del runtime es primero la política de modelo exacta (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), luego `agents.list[]` / `agents.defaults.models["provider/*"]`, y después la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime de agente completo son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, los pins de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` son ignorados por la selección de runtime. Ejecuta `openclaw doctor --fix` para eliminar valores obsoletos.
- Los modelos de agente OpenAI usan el harness Codex de forma predeterminada; provider/model `agentRuntime.id: "codex"` sigue siendo válido cuando quieres hacerlo explícito.
- Para despliegues de Claude CLI, prefiere `model: "anthropic/claude-opus-4-8"` más `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` todavía funcionan por compatibilidad, pero la configuración nueva debería mantener canónica la selección de provider/model y poner el backend de ejecución en la política de runtime de provider/model.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de medios, visión, PDF, música, video y TTS siguen usando sus ajustes de provider/model.

**Atajos de alias integrados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

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

Tus alias configurados siempre prevalecen sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento salvo que configures `--thinking off` o definas `agents.defaults.models["zai/<model>"].params.thinking` tú mismo.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Define `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando el razonamiento adaptativo se activa explícitamente, el valor predeterminado de esfuerzo propiedad del proveedor de Anthropic es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones alternativas solo de texto (sin llamadas a herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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
- Las sesiones son compatibles cuando `sessionArg` está definido.
- El paso directo de imágenes es compatible cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas seguras
  desde una cola delimitada de transcripción sin procesar de OpenClaw antes de que exista el
  primer resumen de Compaction. Los cambios de perfil de autenticación o de época de credenciales
  siguen sin volver a sembrarse nunca desde datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos en superficies de prompt ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en rutas de OpenClaw/proveedor; `personality` controla solo la capa de estilo de interacción amable. Las rutas nativas del servidor de app de Codex mantienen las instrucciones base/modelo propiedad de Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para hilos nativos.

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
- `"off"` desactiva solo la capa amable; el contrato de comportamiento GPT-5 etiquetado sigue activado.
- `plugins.entries.openai.config.personality` heredado todavía se lee cuando este ajuste compartido no está definido.

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

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Defínelo como `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto de arranque. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de Heartbeat antes de que se aborte. Déjalo sin definir para usar `agents.defaults.timeoutSeconds` cuando esté establecido; de lo contrario, la cadencia de Heartbeat se limita a 600 segundos.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Es el mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se posponen en los carriles ocupados adicionales de ese agente: su propio subagente con clave de sesión o trabajo de comando anidado. Los carriles de Cron siempre posponen Heartbeats, incluso sin esta marca.
- Por agente: define `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos de agente completos: los intervalos más cortos consumen más tokens.

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

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un Plugin de proveedor de Compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen LLM integrado. Recurre al integrado en caso de fallo. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de Compaction antes de que OpenClaw la anule. Predeterminado: `180`.
- `keepRecentTokens`: presupuesto de punto de corte del agente para conservar literalmente la cola más reciente de la transcripción. `/compact` manual lo respeta cuando se establece explícitamente; de lo contrario, la Compaction manual es un punto de control rígido.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone una guía integrada de retención de identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto personalizado opcional para preservar identificadores que se usa cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida malformada para resúmenes de safeguard. Habilitado de forma predeterminada en modo safeguard; establece `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión de contexto después de anexar los resultados de herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, anula el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de precomprobación existente para truncar los resultados de herramientas o compactar y reintentar. Funciona con los modos de Compaction `default` y `safeguard`. Predeterminado: deshabilitado.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de la Compaction. La reinyección está deshabilitada cuando no se establece o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` habilita ese par y conserva el fallback heredado `Every Session`/`Safety`. Habilítalo solo cuando el contexto adicional valga el riesgo de duplicar la guía del proyecto ya capturada en el resumen de Compaction.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` solo para el resumen de Compaction. Los alias simples se resuelven antes del envío; los ID de modelo literales configurados conservan la precedencia en caso de colisiones. Úsalo cuando la sesión principal deba mantener un modelo, pero los resúmenes de Compaction deban ejecutarse en otro; cuando no se establece, Compaction usa el modelo principal de la sesión.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la Compaction local normal antes de una ejecución cuando el JSONL activo supera el umbral. Requiere `truncateAfterCompaction` para que una Compaction correcta pueda rotar a una transcripción sucesora más pequeña. Deshabilitado cuando no se establece o es `0`.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando la Compaction empieza y cuando termina (por ejemplo, "Compacting context..." y "Compaction complete"). Deshabilitado de forma predeterminada para mantener la Compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la Compaction automática para almacenar recuerdos duraderos. Establece `model` en un proveedor/modelo exacto como `ollama/qwen3:8b` cuando este turno de mantenimiento deba permanecer en un modelo local; la anulación no hereda la cadena de fallback de la sesión activa. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteraciones de reintento del bucle de ejecución externo para el runtime de agente integrado, a fin de evitar bucles de ejecución infinitos durante la recuperación de fallos. Ten en cuenta que este ajuste actualmente solo se aplica al runtime de agente integrado, no a los runtimes ACP ni CLI.

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

- `base`: número base de iteraciones de reintento de ejecución para el bucle de ejecución externo. Predeterminado: `24`.
- `perProfile`: iteraciones de reintento de ejecución adicionales concedidas por cada candidato de perfil de fallback. Predeterminado: `8`.
- `min`: límite absoluto mínimo para las iteraciones de reintento de ejecución. Predeterminado: `32`.
- `max`: límite absoluto máximo para las iteraciones de reintento de ejecución, para evitar ejecuciones descontroladas. Predeterminado: `160`.

### `agents.defaults.contextPruning`

Poda **resultados de herramientas antiguos** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en disco.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` habilita pasadas de poda.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la poda (después del último toque de caché).
- La poda primero recorta suavemente los resultados de herramientas sobredimensionados y luego, si es necesario, borra por completo los resultados de herramientas más antiguos.
- `softTrimRatio` y `hardClearRatio` aceptan valores de `0.0` a `1.0`; la validación de configuración rechaza los valores fuera de ese rango.

**Recorte suave** conserva el inicio + el final e inserta `...` en el medio.

**Borrado completo** reemplaza todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes de asistente, se omite la poda.

</Accordion>

Consulta [Poda de sesión](/es/concepts/session-pruning) para obtener detalles de comportamiento.

### Transmisión por bloques

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
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500 ms. Anulación por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para obtener detalles de comportamiento y fragmentación.

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

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats de grupo sin mención.
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

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime local de Docker (predeterminado)
- `ssh`: runtime remoto genérico respaldado por SSH
- `openshell`: runtime de OpenShell

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del runtime se mueven a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando de cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por alcance
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido en línea o SecretRefs que OpenClaw materializa en archivos temporales en runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que empiece la sesión de sandbox

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crear o recrear
- luego mantiene canónico el espacio de trabajo SSH remoto
- enruta `exec`, herramientas de archivo y rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador de sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de sandbox por alcance bajo `~/.openclaw/sandboxes`
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

- `mirror`: inicializa el remoto desde el local antes de ejecutar y sincroniza de vuelta después de ejecutar; el espacio de trabajo local sigue siendo el canónico
- `remote`: inicializa el remoto una vez cuando se crea el entorno aislado y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales del host hechas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte es SSH hacia el entorno aislado de OpenShell, pero el Plugin es dueño del ciclo de vida del entorno aislado y de la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de la creación del contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada** — configúralo en `"bridge"` (o en una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada salvo que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (emergencia).
Los turnos de servidor de aplicación de Codex en un entorno aislado activo de OpenClaw usan esta misma configuración de salida para su acceso de red nativo en modo de código.

**Los archivos adjuntos entrantes** se colocan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; las vinculaciones globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. URL de noVNC inyectada en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador de noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en entorno aislado apunten al navegador del host.
- `network` usa `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Configúralo en `bridge` solo cuando quieras explícitamente conectividad bridge global.
- `cdpSourceRange` restringe opcionalmente la entrada CDP en el borde del contenedor a un rango CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador del entorno aislado. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; configúralo en `0` para usar el
    límite de procesos predeterminado de Chromium.
  - además de `--no-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen de contenedor; usa una imagen de navegador personalizada con un
    punto de entrada personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` solo funcionan con Docker.

Construye imágenes (desde un checkout de código fuente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalaciones npm sin un checkout de código fuente, consulta [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

### `agents.list` (anulaciones por agente)

Usa `agents.list[].tts` para darle a un agente su propio proveedor de TTS, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina en profundidad sobre
`messages.tts`, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras los
agentes individuales anulan solo los campos de voz o proveedor que necesitan. La anulación del agente activo
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
- `default`: cuando hay varios configurados, gana el primero (se registra una advertencia). Si no se configura ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena configura un primario estricto por agente sin respaldo de modelo; la forma de objeto `{ primary }` también es estricta salvo que agregues `fallbacks`. Usa `{ primary, fallbacks: [...] }` para hacer que ese agente opte por el respaldo, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo anulan `primary` siguen heredando los respaldos predeterminados salvo que configures `fallbacks: []`.
- `params`: parámetros de flujo por agente combinados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Usa esto para anulaciones específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: anulaciones opcionales de texto a voz por agente. El bloque se combina en profundidad sobre `messages.tts`, así que conserva las credenciales compartidas del proveedor y la política de respaldo en `messages.tts` y configura aquí solo valores específicos de la persona, como proveedor, voz, modelo, estilo o modo automático.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de combinarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Anula `agents.defaults.thinkingDefault` para este agente cuando no hay anulación por mensaje o sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico propiedad del proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad de razonamiento predeterminada opcional por agente (`on | off | stream`). Anula `agents.defaults.reasoningDefault` para este agente cuando no se configura ninguna anulación de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se configura ninguna anulación de modo rápido por mensaje o sesión.
- `models`: catálogo de modelos/anulaciones de runtime opcionales por agente indexados por ids completos `provider/model`. Usa `models["provider/model"].agentRuntime` para excepciones de runtime por agente.
- `runtime`: descriptor de runtime opcional por agente. Usa `type: "acp"` con valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones de arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales relativos al espacio de trabajo de `identity.avatar` están limitados a 2 MB. Las URL `http(s)` y las URI `data:` no se comprueban con el límite de tamaño de archivo local.
- `identity` deriva valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ids de agente configurados para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = cualquier destino configurado; predeterminado: solo el mismo agente). Incluye el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se eliminó son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecuta `openclaw doctor --fix` para limpiarlas, o agrega una entrada mínima `agents.list[]` si ese destino debe seguir pudiendo generarse mientras hereda valores predeterminados.
- Guardia de herencia de aislamiento: si la sesión solicitante está en un entorno aislado, `sessions_spawn` rechaza destinos que se ejecutarían sin aislamiento.
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

### Campos de coincidencia de vinculaciones

- `type` (opcional): `route` para enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para vinculaciones de conversación ACP persistentes.
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

Dentro de cada nivel, gana la primera entrada de `bindings` que coincida.

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden por niveles de vinculación de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin aislamiento)">

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

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para obtener detalles de precedencia.

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

<Accordion title="Detalles de los campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una sola sesión (úsalo solo cuando se pretenda un contexto compartido).
- **`dmScope`**: cómo se agrupan los MD.
  - `main`: todos los MD comparten la sesión principal.
  - `per-peer`: aísla por id de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para multicuenta).
- **`identityLinks`**: asigna ids canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan el mismo mapa para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulta [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a la hora local `atHour`; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, gana el que expire primero. La vigencia del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras en segundo plano/de eventos del sistema, como Heartbeat, activaciones de Cron, notificaciones de ejecución y contabilidad de Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias/por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). El `dm` heredado se acepta como alias de `direct`.
- **`mainKey`**: campo heredado. El runtime siempre usa `"main"` para el contenedor principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: cantidad máxima de turnos de respuesta entre agentes durante intercambios de agente a agente (entero, rango: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: cantidad máxima de entradas en `sessions.json` (predeterminado `500`). El runtime escribe la limpieza por lotes con un pequeño búfer de nivel alto para límites de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - Las sesiones efímeras de sondeo de ejecución de modelo de Gateway usan una retención fija de `24h`, pero la limpieza está limitada por presión: solo elimina filas obsoletas de sondeo estricto de ejecución de modelo cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Solo son elegibles las claves explícitas estrictas de sondeo que coinciden con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilo, Cron, hook, Heartbeat, ACP y de subagente no heredan esta retención de 24 h. Cuando se ejecuta la limpieza de ejecución de modelo, se ejecuta antes de la limpieza más amplia de entradas obsoletas `pruneAfter` y del límite `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establece `false` para desactivarla.
  - `maxDiskBytes`: presupuesto opcional de disco del directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para características de sesión vinculada a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: antigüedad máxima absoluta predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: control predeterminado para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. El valor predeterminado es `true` cuando los enlaces de hilos están habilitados; los proveedores/cuentas pueden anularlo.
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
| `{thinkingLevel}` | Nivel actual de razonamiento | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- De forma predeterminada usa `identity.emoji` del agente activo; si no existe, `"👀"`. Establece `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina la confirmación después de responder en canales con capacidad de reacciones, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: habilita reacciones de estado de ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Slack y Discord, dejarlo sin establecer mantiene habilitadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Signal, Telegram y WhatsApp, establécelo explícitamente en `true` para habilitar reacciones de estado de ciclo de vida.
- `messages.statusReactions.emojis`: anula claves de emoji de ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emoji configurados no compatibles vuelven
  a la variante de estado compatible más cercana para ese chat.

### Debounce de entrada

Agrupa mensajes rápidos solo de texto del mismo remitente en un único turno de agente. Los medios/adjuntos se envían inmediatamente. Los comandos de control omiten el debounce.

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

- `auto` controla el modo auto-TTS predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada; `modelOverrides.allowProvider` tiene `false` como valor predeterminado (participación explícita).
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los proveedores de voz incluidos pertenecen al Plugin. Si `plugins.allow` está configurado, incluye cada Plugin proveedor de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El id de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de OpenAI TTS. El orden de resolución es la configuración, luego `OPENAI_TTS_BASE_URL` y luego `https://api.openai.com/v1`.
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

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Hablar.
- Las claves planas heredadas de Hablar (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los ID de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` se aplica solo cuando no hay ninguna clave de API de Hablar configurada.
- `providers.*.voiceAliases` permite que las directivas de Hablar usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el asistente local de MLX en macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real de Hablar en Control UI. Déjalo sin configurar para conservar el comportamiento normal de sesión/modelo.
- `consultFastMode` establece una anulación puntual de modo rápido para las consultas en tiempo real de Hablar en Control UI sin cambiar la configuración normal de modo rápido de la sesión.
- `speechLocale` establece el id de configuración regional BCP 47 usado por el reconocimiento de voz de Hablar en iOS/macOS. Déjalo sin configurar para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Hablar después del silencio del usuario antes de enviar la transcripción. Sin configurar, mantiene la ventana de pausa predeterminada de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones de sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw, para que el estilo de voz pueda configurarse sin perder la guía predeterminada de `openclaw_agent_consult`.
- `realtime.consultRouting` controla la alternativa de retransmisión de Gateway cuando el proveedor en tiempo real produce una transcripción final del usuario sin `openclaw_agent_consult`: `provider-direct` conserva las respuestas directas del proveedor, mientras que `force-agent-consult` enruta la solicitud finalizada a través de OpenClaw.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
