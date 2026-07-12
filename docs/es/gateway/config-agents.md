---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, contenido multimedia, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajuste del comportamiento de las sesiones, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados de los agentes, enrutamiento multiagente y configuración de sesiones, mensajes y conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-12T14:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con ámbito de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, el entorno de ejecución del Gateway y otras
claves de nivel superior, consulte la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de los agentes

### `agents.defaults.workspace`

Valor predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está definida; de lo contrario, `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está definido como un perfil no predeterminado).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Use la variable de entorno para dirigir los agentes predeterminados
a un espacio de trabajo montado cuando no desee escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos de Skills predeterminada y opcional para los agentes que no definen
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

- Omita `agents.defaults.skills` para permitir todas las Skills de forma predeterminada.
- Omita `agents.list[].skills` para heredar los valores predeterminados.
- Establezca `agents.list[].skills: []` para no permitir ninguna Skill.
- Una lista no vacía de `agents.list[].skills` es el conjunto final para ese agente; no
  se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de arranque del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de archivos opcionales seleccionados del espacio de trabajo, pero continúa escribiendo los archivos de arranque obligatorios (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinyección del arranque del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a la Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva la inyección de los archivos de arranque y de contexto del espacio de trabajo en cada turno. Use esta opción únicamente para agentes que controlen por completo el ciclo de vida de su prompt (motores de contexto personalizados, entornos de ejecución nativos que construyan su propio contexto o flujos de trabajo especializados sin arranque). Los turnos de Heartbeat y de recuperación de la Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Modificación por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Número máximo de caracteres por archivo de arranque del espacio de trabajo antes del truncamiento. Valor predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Modificación por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Número total máximo de caracteres inyectados entre todos los archivos de arranque del espacio de trabajo. Valor predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Modificación por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Modificaciones del perfil de arranque por agente

Use modificaciones del perfil de arranque por agente cuando uno de ellos necesite un comportamiento de
inyección del prompt distinto de los valores predeterminados compartidos. Los campos omitidos se heredan de
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
- `"once"`: inyecta un aviso conciso una vez por cada firma de truncamiento única.
- `"always"`: inyecta un aviso conciso en cada ejecución cuando existe truncamiento (recomendado).

Los recuentos detallados de datos sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
los informes de contexto/estado y los registros; el contexto habitual de usuario/entorno de ejecución de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad de los presupuestos de contexto

OpenClaw tiene varios presupuestos de alto volumen para prompts/contexto, que se
dividen intencionadamente por subsistema en lugar de canalizarse todos mediante una única
opción genérica.

| Presupuesto                                                    | Incluye                                                                                                                                                         |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inyección normal del arranque del espacio de trabajo                                                                                                            |
| `agents.defaults.startupContext.*`                             | Preámbulo de una sola ejecución del modelo al restablecer/iniciar, incluidos los archivos `memory/*.md` diarios recientes. Los comandos de chat simples `/new` y `/reset` se confirman sin invocar el modelo |
| `skills.limits.*`                                              | La lista compacta de Skills inyectada en el prompt del sistema                                                                                                  |
| `agents.defaults.contextLimits.*`                              | Extractos acotados del entorno de ejecución y bloques inyectados propiedad del entorno de ejecución                                                             |
| `memory.qmd.limits.*`                                          | Tamaño de los fragmentos indexados de búsqueda en memoria y de la inyección                                                                                      |

Modificaciones correspondientes por agente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preámbulo de inicio del primer turno que se inyecta en las ejecuciones del modelo al restablecer/iniciar.
Los comandos de chat simples `/new` y `/reset` confirman el restablecimiento sin invocar
el modelo, por lo que no cargan este preámbulo.

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

Valores predeterminados compartidos para superficies acotadas de contexto del entorno de ejecución.

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

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de añadir
  los metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite
  `lines`.
- `toolResultMaxChars`: límite avanzado de resultados de herramientas en vivo utilizado para los resultados
  persistidos y la recuperación ante desbordamiento. Déjelo sin definir para usar el límite automático del contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres a partir de 100K tokens y `64000`
  caracteres a partir de 200K tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue restringido a aproximadamente el 30 % de
  la ventana de contexto del modelo. `openclaw doctor --deep` muestra el límite efectivo,
  y doctor solo advierte cuando una modificación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md utilizado durante la inyección
  de actualización posterior a la Compaction.

#### `agents.list[].contextLimits`

Modificación por agente de las opciones compartidas de `contextLimits`. Los campos omitidos se heredan
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
          toolResultMaxChars: 8000, // límite avanzado para este agente
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Límite global de la lista compacta de Skills inyectada en el prompt del sistema. Esto
no afecta a la lectura bajo demanda de archivos `SKILL.md`.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Modificación por agente del presupuesto del prompt de Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles del lado más largo de una imagen en los bloques de imágenes de transcripciones/herramientas antes de las llamadas al proveedor.
Valor predeterminado: `1200`.

Los valores inferiores suelen reducir el uso de tokens de visión y el tamaño de la carga de las solicitudes en ejecuciones con muchas capturas de pantalla.
Los valores superiores conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de la herramienta de imágenes para imágenes cargadas desde rutas de archivos, URL y referencias multimedia.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imágenes seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL y los modelos de visión alojados de Llama 4 pueden usar imágenes más grandes que las rutas de visión de alto detalle antiguas/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en el modo `auto` para controlar el coste de tokens y la latencia.

Valores:

- `auto`: se adapta a los límites del modelo y al número de imágenes.
- `efficient`: prioriza imágenes más pequeñas para reducir el uso de tokens y bytes.
- `balanced`: utiliza la escala intermedia estándar.
- `high`: conserva más detalle en capturas de pantalla, diagramas e imágenes de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Si no se especifica, se usa la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el prompt del sistema. Valor predeterminado: `auto` (preferencia del sistema operativo).

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
      params: { cacheRetention: "long" }, // parámetros globales predeterminados del proveedor
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
  - La forma de cadena establece únicamente el modelo principal.
  - La forma de objeto establece el modelo principal y los modelos de conmutación por error ordenados.
- `utilityModel`: referencia `provider/model` o alias opcional para tareas internas breves. Actualmente se usa para generar los títulos de sesión de la interfaz de control, los títulos de temas de mensajes directos de Telegram, los títulos automáticos de hilos de Discord y la [narración de borradores de progreso](/es/concepts/progress-drafts#narrated-status). Si no se establece, OpenClaw utiliza el modelo pequeño predeterminado declarado por el proveedor principal cuando existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, las tareas de titulación recurren al modelo principal del agente y la narración permanece desactivada. Establezca `utilityModel: ""` para desactivar por completo el enrutamiento de utilidades. `agents.list[].utilityModel` sustituye el valor predeterminado (un valor vacío por agente lo desactiva para ese agente), y una sustitución de modelo específica de la operación prevalece sobre ambos. Las tareas de utilidad realizan llamadas de modelo independientes y envían contenido específico de la tarea al proveedor del modelo seleccionado. La generación de títulos del panel envía como máximo los primeros 1,000 caracteres del primer mensaje que no sea un comando; la narración envía la solicitud entrante junto con resúmenes compactos y censurados de las herramientas. Elija un proveedor que se ajuste a sus requisitos de coste y tratamiento de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de la herramienta `image` lo utiliza como configuración del modelo de visión.
  - También se utiliza como enrutamiento alternativo cuando el modelo seleccionado o predeterminado no admite entradas de imagen.
  - Se recomiendan referencias `provider/model` explícitas. Se aceptan identificadores sin prefijo por compatibilidad; si uno coincide de forma única con una entrada configurada que admite imágenes en `models.providers.*.models`, OpenClaw le añade el proveedor correspondiente. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta/Plugin que genere imágenes.
  - Valores habituales: `google/gemini-3.1-flash-image-preview` para la generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images o `openai/gpt-image-1.5` para generar imágenes PNG/WebP de OpenAI con fondo transparente.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación correspondiente del proveedor (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, y `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado con autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de imágenes en orden de identificador de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores habituales: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado con autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de música en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación o clave de API correspondiente del proveedor.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de vídeo y la herramienta integrada `video_generate`.
  - Valores habituales: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado con autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de vídeo en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación o clave de API correspondiente del proveedor.
  - El Plugin oficial de generación de vídeo de Qwen admite hasta 1 vídeo de salida, 1 imagen de entrada, 4 vídeos de entrada, 10 segundos de duración y opciones `size`, `aspectRatio`, `resolution`, `audio` y `watermark` en el nivel del proveedor.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo utiliza para el enrutamiento de modelos.
  - Si se omite, la herramienta de PDF recurre primero a `imageModel` y, después, al modelo resuelto de la sesión o al predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando no se proporciona `maxBytesMb` en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas que considera el modo alternativo de extracción de la herramienta `pdf`.
- `verboseDefault`: nivel detallado predeterminado para los agentes. Valores: `"off"`, `"on"`, `"full"`. Valor predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para los resúmenes de herramientas de `/verbose` y las líneas de herramientas de los borradores de progreso. Valores: `"explain"` (valor predeterminado, etiquetas humanas compactas) o `"raw"` (añade el comando o detalle sin procesar cuando está disponible). El valor por agente `agents.list[].toolProgressDetail` sustituye este valor predeterminado.
- `reasoningDefault`: visibilidad predeterminada del razonamiento para los agentes. Valores: `"off"`, `"on"`, `"stream"`. El valor por agente `agents.list[].reasoningDefault` sustituye este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican a propietarios, remitentes autorizados o contextos de administrador del operador del Gateway cuando no se ha establecido ninguna sustitución de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para los agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Valor predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo, `openai/gpt-5.6-sol` para acceder mediante OAuth de Codex). Si se omite el proveedor, OpenClaw prueba primero un alias, después una coincidencia única entre los proveedores configurados para ese identificador exacto de modelo y, solo entonces, recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, por lo que se recomienda usar un `provider/model` explícito). Si ese proveedor ya no ofrece el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: catálogo de modelos configurado y lista de permitidos para `/model`. Cada entrada puede incluir `alias` (acceso directo) y `params` (específicos del proveedor; por ejemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Use entradas `provider/*`, como `"openai/*": {}` o `"vllm/*": {}`, para mostrar todos los modelos detectados de los proveedores seleccionados sin tener que enumerar manualmente cada identificador de modelo.
  - Añada `agentRuntime` a una entrada `provider/*` cuando todos los modelos detectados dinámicamente para ese proveedor deban utilizar el mismo entorno de ejecución. La política de entorno de ejecución exacta de `provider/model` sigue prevaleciendo sobre el comodín.
  - Ediciones seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza las sustituciones que eliminarían entradas existentes de la lista de permitidos, salvo que se proporcione `--replace`.
  - Los flujos de configuración/incorporación específicos de un proveedor combinan los modelos seleccionados del proveedor en este mapa y conservan los demás proveedores ya configurados.
  - Para los modelos directos de OpenAI Responses, la Compaction del lado del servidor se activa automáticamente. Use `params.responsesServerCompaction: false` para dejar de insertar `context_management`, o `params.responsesCompactThreshold` para sustituir el umbral. Consulte [Compaction del lado del servidor de OpenAI](/es/providers/openai#advanced-configuration).
- `params`: parámetros globales predeterminados del proveedor que se aplican a todos los modelos. Se establecen en `agents.defaults.params` (por ejemplo, `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) se sustituye por `agents.defaults.models["provider/model"].params` (por modelo) y, después, `agents.list[].params` (identificador de agente coincidente) sustituye los valores por clave. Consulte [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener más información.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw la reenvía al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente sustituyen sus valores por clave. Consulte [Enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de transferencia directa que se combina en los cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, prevalece el cuerpo adicional; posteriormente, las rutas de completado no nativas siguen eliminando `store`, que es exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI que se combinan en los cuerpos de solicitud de nivel superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` con el razonamiento desactivado, el Plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; los valores explícitos de `chat_template_kwargs` sustituyen los valores predeterminados generados, y `extra_body.chat_template_kwargs` conserva la precedencia final. Los modelos de razonamiento Qwen y Nemotron de vLLM configurados exponen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo de varios niveles.
- `compat.thinkingFormat`: estilo de carga útil de razonamiento compatible con OpenAI. Use `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` de nivel superior al estilo de Qwen o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admitan argumentos de plantilla de chat en el nivel de solicitud, como vLLM. OpenClaw asigna el razonamiento desactivado a `false` y el activado a `true`, y los modelos Qwen de vLLM configurados exponen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de niveles de esfuerzo de razonamiento compatibles con OpenAI por modelo. Incluya `"xhigh"` para puntos de conexión personalizados que realmente lo admitan; OpenClaw expondrá entonces `/think xhigh` en los menús de comandos, las filas de sesión del Gateway, la validación de parches de sesión, la validación de la CLI del agente y la validación de `llm-task` para ese proveedor/modelo configurado. Use `compat.reasoningEffortMap` cuando el backend requiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: habilitación opcional exclusiva de Z.AI para conservar el razonamiento. Cuando está activada y el razonamiento está habilitado, OpenClaw envía `thinking.clear_thinking: false` y reproduce el `reasoning_content` anterior; consulte [Razonamiento y conservación del razonamiento de Z.AI](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional en el nivel del proveedor para servidores de modelos locales o autoalojados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el punto de conexión no está disponible, espera hasta `readyTimeoutMs` y, después, envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw finaliza; un valor positivo detiene el proceso iniciado por OpenClaw tras esa cantidad de milisegundos de inactividad. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- La política de entorno de ejecución se define en los proveedores o modelos, no en `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para reglas de todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas del modelo. Un prefijo de proveedor/modelo nunca selecciona por sí solo un arnés. Si el entorno de ejecución no está definido o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una sustitución de solicitud definida manualmente. Consulte [Entorno de ejecución implícito de agentes de OpenAI](/es/providers/openai#implicit-agent-runtime).
- Los escritores de configuración que modifican estos campos (por ejemplo, `/models set`, `/models set-image` y los comandos para añadir o eliminar alternativas) guardan la forma de objeto canónica y conservan las listas de alternativas existentes cuando es posible.
- `maxConcurrent`: número máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue estando serializada). Valor predeterminado: `4`.

### Política de entorno de ejecución

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, el id de un arnés de Plugin registrado o un alias de backend de CLI compatible. El Plugin de Codex incluido registra `codex`; el Plugin de Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los arneses de Plugin registrados reclamen rutas efectivas que declaren o satisfagan de otro modo su contrato de compatibilidad, y utiliza OpenClaw cuando ningún arnés coincide. Un entorno de ejecución de Plugin explícito, como `id: "codex"`, requiere ese arnés y una ruta efectiva compatible; falla de forma cerrada si alguno no está disponible o si la ejecución falla.
- `id: "pi"` se acepta únicamente como alias obsoleto de `openclaw` para conservar las configuraciones publicadas de v2026.5.22 y versiones anteriores. Las configuraciones nuevas deben usar `openclaw`.
- La precedencia del entorno de ejecución es: primero, la política exacta del modelo (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`); después, `agents.list[]` / `agents.defaults.models["provider/*"]`; y, por último, la política para todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de entorno de ejecución para todo el agente son heredadas. La selección del entorno de ejecución ignora `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, las fijaciones del entorno de ejecución de sesión y `OPENCLAW_AGENT_RUNTIME`. Ejecute `openclaw doctor --fix` para eliminar los valores obsoletos.
- Las rutas oficiales de HTTPS de OpenAI Responses/ChatGPT exactas y aptas, sin una sobrescritura de solicitud definida por el autor, pueden usar implícitamente el arnés de Codex. `agentRuntime.id: "codex"` para un proveedor/modelo convierte a Codex en un requisito que falla de forma cerrada, pero no hace compatible una ruta incompatible.
- Para implementaciones de Claude CLI, se recomienda `model: "anthropic/claude-opus-4-8"` junto con `agentRuntime.id: "claude-cli"` limitado al modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero las configuraciones nuevas deben mantener canónica la selección de proveedor/modelo y definir el backend de ejecución en la política del entorno de ejecución del proveedor/modelo.
- Esto solo controla la ejecución de turnos de agente de texto. La generación de contenido multimedia, visión, PDF, música, vídeo y TTS sigue utilizando su configuración de proveedor/modelo.

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

Los alias configurados siempre tienen prioridad sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento, salvo que defina `--thinking off` o configure personalmente `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para transmitir las llamadas a herramientas. Establezca `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando el razonamiento adaptativo se activa explícitamente, el valor predeterminado de esfuerzo, controlado por el proveedor de Anthropic, es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones alternativas solo de texto (sin llamadas a herramientas). Resultan útiles como respaldo cuando fallan los proveedores de API.

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
          // También puede usar systemPromptFileArg cuando la CLI acepte una opción para un archivo de instrucciones.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI priorizan el texto; las herramientas siempre están desactivadas.
- Se admiten sesiones cuando se establece `sessionArg`.
- Se admite el envío directo de imágenes cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones
  invalidadas de forma segura a partir de una cola limitada de la transcripción sin procesar de OpenClaw antes de que
  exista el primer resumen de Compaction. Los cambios en el perfil de autenticación o en la época de las credenciales
  nunca permiten reinicializar desde datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de instrucciones independientes del proveedor que se aplican por familia de modelos en las superficies de instrucciones ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en las rutas de OpenClaw/proveedor; `personality` controla únicamente la capa de estilo de interacción cordial. Las rutas nativas del servidor de aplicaciones de Codex conservan las instrucciones base y de modelo controladas por Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos.

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

- `"friendly"` (valor predeterminado) y `"on"` activan la capa de estilo de interacción cordial.
- `"off"` desactiva únicamente la capa cordial; el contrato de comportamiento GPT-5 etiquetado permanece activado.
- La configuración heredada `plugins.entries.openai.config.personality` se sigue leyendo cuando no se ha establecido esta configuración compartida.

### `agents.defaults.heartbeat`

Ejecuciones periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m lo desactiva
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // valor predeterminado: true; false omite la sección Heartbeat de las instrucciones del sistema
        lightContext: false, // valor predeterminado: false; true conserva solo HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // valor predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // valor predeterminado: false; true también espera a los carriles de subagentes/anidados de este agente
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (valor predeterminado) | block
        target: "none", // valor predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Lee HEARTBEAT.md si existe...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación mediante clave de API) o `1h` (autenticación OAuth). Establézcalo en `0m` para desactivarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat de las instrucciones del sistema y no inyecta `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo permitido, en segundos, para un turno de agente de Heartbeat antes de que se cancele. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté configurado; de lo contrario, se usa la cadencia de Heartbeat, limitada a 600 segundos.
- `directPolicy`: política de entrega directa/por mensaje directo. `allow` (valor predeterminado) permite la entrega a destinos directos. `block` suprime la entrega a destinos directos y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación anterior. Sigue el mismo patrón de aislamiento que `sessionTarget: "isolated"` de Cron. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se aplazan en los carriles ocupados adicionales de ese agente: el trabajo de sus propios subagentes con clave de sesión o de comandos anidados. Los carriles de Cron siempre aplazan los Heartbeat, incluso sin esta opción.
- Por agente: establezca `agents.list[].heartbeat`. Cuando algún agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- Los Heartbeat ejecutan turnos completos de agente; los intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un Plugin proveedor de Compaction registrado (opcional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conserva exactamente los ids de implementación, los ids de incidencias y los pares host:puerto.", // se usa cuando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // comprobación opcional de presión del bucle de herramientas
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // activa la reinyección de secciones de AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // sobrescritura opcional del modelo solo para Compaction
        truncateAfterCompaction: true, // rota a un archivo JSONL sucesor más pequeño después de Compaction
        maxActiveTranscriptBytes: "20mb", // activador opcional de Compaction local en la comprobación previa
        notifyUser: true, // muestra avisos cuando Compaction comienza/termina y cuando se degrada el volcado de memoria (valor predeterminado: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // sobrescritura opcional del modelo solo para el volcado de memoria
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La sesión se acerca a Compaction. Guarda ahora los recuerdos duraderos.",
          prompt: "Escribe las notas perdurables en memory/YYYY-MM-DD.md; responde con el token silencioso exacto NO_REPLY si no hay nada que guardar.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulte [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin de proveedor de compactación registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar de usar el resumen integrado mediante LLM. Si falla, se recurre al mecanismo integrado. Establecer un proveedor fuerza `mode: "safeguard"`. Consulte [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: cantidad máxima de segundos permitida para una sola operación de compactación antes de que OpenClaw la cancele. Valor predeterminado: `180`.
- `reserveTokens`: margen de tokens que se mantiene disponible para la salida del modelo y los resultados futuros de herramientas después de la compactación. Cuando se conoce la ventana de contexto del modelo, OpenClaw limita la reserva efectiva para que no consuma el presupuesto del prompt.
- `reserveTokensFloor`: reserva mínima aplicada por el entorno de ejecución integrado. Establezca `0` para desactivar el mínimo. Este sigue sujeto al límite activo de la ventana de contexto.
- `keepRecentTokens`: presupuesto del punto de corte del agente para conservar literalmente el tramo más reciente de la transcripción. La orden manual `/compact` respeta este valor cuando se establece explícitamente; de lo contrario, la compactación manual constituye un punto de control estricto.
- `recentTurnsPreserve`: número de turnos más recientes de usuario/asistente que se conservan literalmente fuera del resumen de salvaguarda. Valor predeterminado: `3`.
- `maxHistoryShare`: fracción máxima del presupuesto total de contexto permitida para el historial conservado después de la compactación (intervalo `0.1`-`0.9`).
- `identifierPolicy`: `strict` (valor predeterminado), `off` o `custom`. `strict` antepone instrucciones integradas para conservar identificadores opacos durante el resumen de compactación.
- `identifierInstructions`: texto personalizado opcional para conservar identificadores, utilizado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones con reintento cuando la salida de los resúmenes de salvaguarda tiene un formato incorrecto. Se activa de forma predeterminada en el modo de salvaguarda; establezca `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de la presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión del contexto después de añadir los resultados de las herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, cancela el intento actual antes de enviar el prompt y reutiliza la ruta existente de recuperación de la comprobación previa para truncar los resultados de las herramientas o compactar y volver a intentarlo. Funciona con los modos de compactación `default` y `safeguard`. Valor predeterminado: desactivado.
- `postIndexSync`: modo de reindexación de la memoria de sesión posterior a la compactación. Valor predeterminado: `"async"`. Use `"await"` para obtener la máxima actualización, `"async"` para reducir la latencia de compactación u `"off"` solo cuando la sincronización de la memoria de sesión se gestione en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md que se volverán a insertar después de la compactación. La reinserción se desactiva si no se establece este valor o si se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` activa ese par y conserva el comportamiento alternativo heredado de `Every Session`/`Safety`. Active esta opción solo cuando el contexto adicional compense el riesgo de duplicar instrucciones del proyecto ya incluidas en el resumen de compactación.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` únicamente para el resumen de compactación. Los alias simples se resuelven antes del envío; los identificadores literales de modelos configurados mantienen la precedencia en caso de colisión. Use esta opción cuando la sesión principal deba conservar un modelo, pero los resúmenes de compactación deban ejecutarse en otro; si no se establece, la compactación usa el modelo principal de la sesión.
- `truncateAfterCompaction`: rota la transcripción de la sesión activa después de la compactación para que los turnos futuros carguen únicamente el resumen y el tramo no resumido, mientras que la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Valor predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la compactación local normal antes de una ejecución cuando el historial de la transcripción supera el umbral. Requiere `truncateAfterCompaction` para que una compactación correcta pueda rotar a una transcripción sucesora más pequeña. Se desactiva si no se establece o si es `0`.
- `notifyUser`: cuando es `true`, envía al usuario avisos breves sobre el mantenimiento del contexto: cuando comienza y termina la compactación (por ejemplo, «Compactando el contexto...» y «Compactación completada») y cuando se agota el vaciado de memoria previo a la compactación, por lo que la respuesta continúa en un estado degradado (por ejemplo, «El mantenimiento de la memoria ha fallado temporalmente; se continuará con la respuesta»). Está desactivado de forma predeterminada para que estos avisos no se muestren.
- `memoryFlush`: turno agéntico silencioso previo a la compactación automática para almacenar recuerdos duraderos. Establezca `model` en un proveedor/modelo exacto, como `ollama/qwen3:8b`, cuando este turno de mantenimiento deba permanecer en un modelo local; la sobrescritura no hereda la cadena de alternativas de la sesión activa. `forceFlushTranscriptBytes` fuerza el vaciado cuando el tamaño de la transcripción alcanza el umbral, aunque los contadores de tokens estén desactualizados. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteraciones de reintento del bucle de ejecución externo para el entorno de ejecución integrado del agente, a fin de evitar bucles de ejecución infinitos durante la recuperación de errores. Esta configuración solo se aplica al entorno de ejecución integrado del agente, no a los entornos de ejecución ACP ni CLI.

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
        runRetries: { max: 50 }, // sobrescrituras opcionales por agente
      },
    ],
  },
}
```

- `base`: número base de iteraciones de reintento de ejecución para el bucle de ejecución externo. Valor predeterminado: `24`.
- `perProfile`: iteraciones adicionales de reintento de ejecución concedidas por cada perfil alternativo candidato. Valor predeterminado: `8`.
- `min`: límite mínimo absoluto de iteraciones de reintento de ejecución. Valor predeterminado: `32`.
- `max`: límite máximo absoluto de iteraciones de reintento de ejecución para evitar una ejecución descontrolada. Valor predeterminado: `160`.

### `agents.defaults.contextPruning`

Elimina los **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en el disco. Está desactivado de forma predeterminada; establezca `mode: "cache-ttl"` para activarlo.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // desactivado (predeterminado) | cache-ttl
        ttl: "1h", // duración (ms/s/m/h), unidad predeterminada: minutos; valor predeterminado: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Contenido antiguo del resultado de la herramienta eliminado]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` activa las pasadas de eliminación.
- `ttl` controla la frecuencia con la que se puede volver a ejecutar la eliminación (después del último acceso a la caché). Valor predeterminado: `5m`.
- La eliminación primero recorta parcialmente los resultados de herramientas demasiado grandes y, después, elimina por completo los resultados más antiguos si es necesario.
- `softTrimRatio` y `hardClearRatio` aceptan valores de `0.0` a `1.0`; la validación de la configuración rechaza los valores fuera de ese intervalo.

El **recorte parcial** conserva el principio y el final e inserta `...` en medio.

La **eliminación completa** sustituye todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imágenes nunca se recortan ni se eliminan.
- Las proporciones se basan en caracteres (de forma aproximada), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la eliminación.

</Accordion>

Consulte [Eliminación de sesiones](/es/concepts/session-pruning) para obtener detalles sobre el comportamiento.

### Transmisión por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (predeterminado) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Los canales distintos de Telegram requieren `*.blockStreaming: true` explícito para activar las respuestas por bloques.
- Sobrescrituras por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack usan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Valor predeterminado: `off`. `natural` = 800-2500ms. `custom` usa `minMs`/`maxMs` (recurre al intervalo natural para cualquier límite no establecido). Sobrescritura por agente: `agents.list[].humanDelay`.

Consulte [Transmisión](/es/concepts/streaming) para obtener detalles sobre el comportamiento y la fragmentación.

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

- Valores predeterminados: `instant` para chats directos/menciones y `message` para chats grupales sin mención.
- Valor predeterminado de `typingIntervalSeconds`: `6`.
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente integrado. Consulte [Aislamiento](/es/gateway/sandboxing) para ver la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (predeterminado) | non-main | all
        backend: "docker", // docker (predeterminado) | ssh | openshell
        scope: "agent", // session | agent (predeterminado) | shared
        workspaceAccess: "none", // none (predeterminado) | ro | rw
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
          // También se admiten SecretRefs / contenidos insertados:
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

Los valores predeterminados que se muestran arriba (imagen `off`/`docker`/`agent`/`none`/`bookworm-slim`, red `none`, etc.) son los valores predeterminados reales de OpenClaw, no solo valores ilustrativos.

<Accordion title="Detalles del entorno aislado">

**Backend:**

- `docker`: entorno de ejecución local de Docker (predeterminado)
- `ssh`: entorno de ejecución remoto genérico respaldado por SSH
- `openshell`: entorno de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del entorno de ejecución se traslada a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con el formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta utilizada para los espacios de trabajo por ámbito (predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes que se pasan a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido insertado o SecretRefs que OpenClaw materializa en archivos temporales durante la ejecución
- `strictHostKeyChecking` / `updateHostKeys`: controles de la política de claves de host de OpenSSH (ambos tienen como valor predeterminado `true`)

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del entorno de ejecución de secretos antes de que se inicie la sesión del entorno aislado

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o volver a crearlo
- después mantiene como canónico el espacio de trabajo SSH remoto
- enruta `exec`, las herramientas de archivos y las rutas de contenido multimedia mediante SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador del entorno aislado

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo del entorno aislado por ámbito en `~/.openclaw/sandboxes` (predeterminado)
- `ro`: espacio de trabajo del entorno aislado en `/workspace`, con el espacio de trabajo del agente montado en modo de solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado en modo de lectura y escritura en `/workspace`

**Ámbito:**

- `session`: contenedor y espacio de trabajo por sesión
- `agent`: un contenedor y espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // réplica (predeterminado) | remoto
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id. opcional de la política de OpenShell
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

- `mirror`: inicializa el entorno remoto desde el local antes de la ejecución y sincroniza de vuelta después de ella; el espacio de trabajo local permanece como canónico
- `remote`: inicializa el entorno remoto una vez al crear el entorno aislado y después mantiene como canónico el espacio de trabajo remoto

En el modo `remote`, las modificaciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte se realiza mediante SSH hacia el entorno aislado de OpenShell, pero el plugin controla el ciclo de vida del entorno aislado y la sincronización de réplica opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, una raíz con permisos de escritura y el usuario raíz.

**Los contenedores usan `network: "none"` de forma predeterminada**; establézcalo en `"bridge"` (o en una red de puente personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada, salvo que se establezca explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergencia).
Los turnos del servidor de aplicaciones de Codex en un entorno aislado activo de OpenClaw utilizan esta misma configuración de salida para el acceso de red nativo de su modo de código.

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`, valor predeterminado `false`): Chromium + CDP en un contenedor. La URL de noVNC se inserta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observación mediante noVNC utiliza autenticación VNC de forma predeterminada y OpenClaw emite una URL de token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en entorno aislado controlen el navegador del host.
- `network` tiene como valor predeterminado `openclaw-sandbox-browser` (red de puente dedicada). Establézcalo en `bridge` solo cuando se desee explícitamente conectividad global mediante puente. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada de CDP en el límite del contenedor a un intervalo CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del navegador del entorno aislado. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Chromium en el contenedor del navegador del entorno aislado siempre se inicia con `--no-sandbox --disable-setuid-sandbox` (los contenedores no disponen de las primitivas del kernel que necesita el propio entorno aislado de Chrome); no existe ningún control de configuración para esto.
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
    habilitados de forma predeterminada y pueden deshabilitarse con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `--disable-extensions` (habilitado de forma predeterminada); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    vuelve a habilitar las extensiones si el flujo de trabajo depende de ellas.
  - `--renderer-process-limit=2` de forma predeterminada; puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establézcalo en `0` para utilizar el
    límite de procesos predeterminado de Chromium.
  - `--headless=new` solo cuando `headless` está habilitado.
  - Los valores predeterminados son la base de referencia de la imagen del contenedor; utilice una imagen de navegador personalizada con un
    punto de entrada personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` solo están disponibles con Docker.

Compile las imágenes (desde un repositorio de código fuente):

```bash
scripts/sandbox-setup.sh           # imagen principal del entorno aislado
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

Para instalaciones de npm sin un repositorio de código fuente, consulte [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver los comandos `docker build` insertados.

### `agents.list` (anulaciones por agente)

Utilice `agents.list[].tts` para asignar a un agente su propio proveedor, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina en profundidad sobre
`messages.tts`, por lo que las credenciales compartidas pueden permanecer en un único lugar mientras los agentes
individuales anulan únicamente los campos de voz o proveedor que necesitan. La anulación del agente
activo se aplica a las respuestas habladas automáticas, `/tts audio`, `/tts status` y
la herramienta de agente `tts`. Consulte [Texto a voz](/es/tools/tts#per-agent-voice-overrides)
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
        model: "anthropic/claude-opus-4-6", // o { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // anulación del nivel de pensamiento por agente
        reasoningDefault: "on", // anulación de la visibilidad del razonamiento por agente
        fastModeDefault: false, // anulación del modo rápido por agente
        params: { cacheRetention: "none" }, // anula por clave los parámetros coincidentes de defaults.models
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // reemplaza agents.defaults.skills cuando se establece
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
            mode: "persistent", // persistente | ejecución única
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

- `id`: identificador estable del agente (obligatorio).
- `default`: cuando se establecen varios, prevalece el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena establece un modelo principal estricto por agente sin modelo de respaldo; la forma de objeto `{ primary }` también es estricta, a menos que se añada `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar los respaldos para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos de Cron que solo sobrescriben `primary` siguen heredando los respaldos predeterminados, salvo que se establezca `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas breves, como los títulos generados de sesiones e hilos. Si no se establece, se usa `agents.defaults.utilityModel`, después el modelo pequeño predeterminado declarado por el proveedor principal y, por último, el modelo principal de este agente. Una cadena vacía desactiva el enrutamiento de utilidades para este agente.
- `params`: parámetros de transmisión por agente que se combinan sobre la entrada del modelo seleccionado en `agents.defaults.models`. Úselo para sobrescrituras específicas del agente, como `cacheRetention`, `temperature` o `maxTokens`, sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se combina en profundidad sobre `messages.tts`, por lo que las credenciales compartidas del proveedor y la política de respaldo deben mantenerse en `messages.tts`, y aquí solo deben establecerse valores específicos de la personalidad, como el proveedor, la voz, el modelo, el estilo o el modo automático.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está establecido; una lista explícita reemplaza los valores predeterminados en lugar de combinarlos, y `[]` significa que no hay Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se ha establecido ninguna sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico administrado por el proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se ha establecido ninguna sobrescritura del razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se ha establecido ninguna sobrescritura del modo rápido por mensaje o sesión.
- `models`: sobrescrituras opcionales por agente del catálogo de modelos o del entorno de ejecución, indexadas por identificadores completos `provider/model`. Use `models["provider/model"].agentRuntime` para excepciones del entorno de ejecución por agente.
- `runtime`: descriptor opcional del entorno de ejecución por agente. Use `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones del arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales de `identity.avatar` con rutas relativas al espacio de trabajo están limitados a 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban con respecto al límite de tamaño de los archivos locales.
- `identity` deriva valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de identificadores de agentes configurados para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). Incluya el identificador del solicitante cuando deban permitirse las llamadas a `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se haya eliminado son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecute `openclaw doctor --fix` para limpiarlas o añada una entrada mínima de `agents.list[]` si ese destino debe seguir pudiendo generarse mientras hereda los valores predeterminados.
- Protección de herencia del sandbox: si la sesión solicitante está en un sandbox, `sessions_spawn` rechaza los destinos que se ejecutarían fuera de un sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea las llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita del perfil; valor predeterminado: false).
- `subagents.maxConcurrent`: número máximo de ejecuciones simultáneas de agentes secundarios en toda la ejecución de subagentes. Valor predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: número máximo de agentes secundarios activos que puede generar una sola sesión de agente. Valor predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para la generación de subagentes (`1`-`5`). Valor predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: antigüedad necesaria para archivar el estado de los subagentes completados. Valor predeterminado: `60`.

---

## Enrutamiento multiagente

Ejecute varios agentes aislados dentro de un Gateway. Consulte [Multiagente](/es/concepts/multi-agent).

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

- `type` (opcional): `route` para el enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para vinculaciones persistentes de conversaciones ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico del canal)
- `acp` (opcional; solo para `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden de coincidencia determinista:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin par/gremio/equipo)
5. `match.accountId: "*"` (para todo el canal)
6. Agente predeterminado

Dentro de cada nivel, prevalece la primera entrada coincidente de `bindings`.

Para las entradas `type: "acp"`, OpenClaw resuelve según la identidad exacta de la conversación (`match.channel` + cuenta + `match.peer.id`) y no utiliza el orden por niveles de las vinculaciones de ruta indicado anteriormente.

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

Consulte [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para obtener detalles sobre la precedencia.

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
      mode: "enforce", // enforce (predeterminado) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // presupuesto estricto opcional
      highWaterBytes: "400mb", // objetivo de limpieza opcional
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // cancelación automática predeterminada del enfoque por inactividad en horas (`0` la desactiva)
      maxAgeHours: 0, // antigüedad máxima estricta predeterminada en horas (`0` la desactiva)
    },
    mainKey: "main", // heredado (el entorno de ejecución siempre usa "main")
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
  - `global`: todos los participantes de un contexto de canal comparten una única sesión (úselo solo cuando se pretenda compartir el contexto).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aísla por id. de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids. canónicos a interlocutores con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento, como `/dock_discord`, usan la misma asignación para cambiar la ruta de respuesta de la sesión activa a otro interlocutor de canal vinculado; consulte [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a la hora local indicada por `atHour`; `idle` restablece después de `idleMinutes`. Cuando se configuran ambos, prevalece el que venza primero. La vigencia del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras de eventos en segundo plano o del sistema, como Heartbeat, activaciones de Cron, notificaciones de ejecución y mantenimiento de registros del Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias o por inactividad.
- **`resetByType`**: sustituciones por tipo (`direct`, `group`, `thread`). Se acepta el valor heredado `dm` como alias de `direct`.
- **`resetByChannel`**: sustituciones de restablecimiento por canal indexadas por id. de proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta prevalece por completo sobre `resetByType`/`reset` para esa sesión. Úselo solo cuando un canal necesite un comportamiento de restablecimiento diferente de la política por tipo.
- **`mainKey`**: campo heredado. El entorno de ejecución siempre usa `"main"` para el contenedor principal de chats directos.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta entre agentes durante intercambios de agente a agente (entero, intervalo: `0`-`20`, valor predeterminado: `5`). `0` desactiva el encadenamiento de ida y vuelta.
- **`sendPolicy`**: busca coincidencias por `channel`, `chatType` (`direct|group|channel`, con el alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Prevalece la primera denegación.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (valor predeterminado: `30d`).
  - `maxEntries`: número máximo de entradas de sesión de SQLite (valor predeterminado: `500`). Las escrituras del entorno de ejecución realizan la limpieza por lotes con un pequeño margen de límite superior para topes de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - Las sesiones de sondeo de ejecuciones de modelos del Gateway de corta duración usan una retención fija de `24h`, pero la limpieza está condicionada por la presión: solo elimina filas obsoletas de sondeos estrictos de ejecuciones de modelos cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Solo son aptas las claves de sondeo explícitas estrictas que coincidan con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilo, Cron, enlace, Heartbeat, ACP y subagentes no heredan esta retención de 24h. Cuando se ejecuta la limpieza de ejecuciones de modelos, se realiza antes que la limpieza general de entradas obsoletas de `pruneAfter` y el límite de `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` lo elimina de configuraciones anteriores.
  - `resetArchiveRetention`: retención de archivos de transcripciones `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establézcalo en `false` para desactivarla.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En modo `warn`, registra advertencias; en modo `enforce`, elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`writeLock`**: controles del bloqueo de escritura de transcripciones de sesión. Ajústelos solo cuando la preparación, limpieza, Compaction o duplicación legítimas de transcripciones compitan durante más tiempo que las políticas predeterminadas.
  - `acquireTimeoutMs`: milisegundos que se espera para adquirir un bloqueo antes de informar que la sesión está ocupada. Valor predeterminado: `60000`; sustitución mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: milisegundos antes de que un bloqueo existente se considere obsoleto y se recupere. Valor predeterminado: `1800000`; sustitución mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: milisegundos que un bloqueo retenido dentro del proceso puede permanecer retenido antes de que el supervisor lo libere. Valor predeterminado: `300000`; sustitución mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: valores predeterminados globales para las funciones de sesiones vinculadas a hilos.
  - `enabled`: interruptor principal predeterminado (los proveedores pueden sustituirlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: retirada automática predeterminada del foco por inactividad, en horas (`0` la desactiva; los proveedores pueden sustituirla)
  - `maxAgeHours`: antigüedad máxima absoluta predeterminada, en horas (`0` la desactiva; los proveedores pueden sustituirla)
  - `spawnSessions`: control predeterminado para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos de ACP. El valor predeterminado es `true` cuando las vinculaciones de hilos están activadas; los proveedores/cuentas pueden sustituirlo.
  - `defaultSpawnContext`: contexto nativo predeterminado del subagente para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // o "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (predeterminado) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (predeterminado)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 lo desactiva
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefijo de respuesta

Sustituciones por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (prevalece la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción                    | Ejemplo                     |
| ----------------- | ------------------------------ | --------------------------- |
| `{model}`         | Nombre corto del modelo        | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor           | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual   | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)        |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- El valor predeterminado es `identity.emoji` del agente activo; de lo contrario, `"👀"`. Establezca `""` para desactivarla.
- Sustituciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → alternativa de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all` u `off`/`none` (desactiva por completo las reacciones de confirmación).
- `removeAckAfterReply`: elimina la confirmación después de responder en canales compatibles con reacciones, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: activa las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Discord, si no se establece, las reacciones de estado permanecen activadas cuando las reacciones de confirmación están activas.
  En Slack, Signal, Telegram y WhatsApp, establézcalo explícitamente en `true` para activar las reacciones de estado del ciclo de vida.
  Slack usa de forma predeterminada el estado nativo de hilo de su asistente y mensajes de carga rotativos para mostrar el progreso, mientras mantiene estática la reacción de confirmación configurada.
- `messages.statusReactions.emojis`: sustituye las claves de emojis del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emojis configurados no compatibles recurren
  a la variante de estado compatible más cercana para ese chat.

### Cola

- `mode`: estrategia de cola para los mensajes entrantes que llegan mientras hay una ejecución de sesión activa. Valor predeterminado: `"steer"`.
  - `steer`: inyecta la nueva instrucción en la ejecución activa.
  - `followup`: ejecuta la nueva instrucción después de que finalice la ejecución activa.
  - `collect`: agrupa mensajes compatibles y los ejecuta juntos más adelante.
  - `interrupt`: cancela la ejecución activa antes de iniciar la instrucción más reciente.
- `debounceMs`: retraso antes de despachar un mensaje en cola o redirigido. Valor predeterminado: `500`.
- `cap`: número máximo de mensajes en cola antes de aplicar la política de descarte. Valor predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas, pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: sustituciones de `mode` por canal, indexadas por id. de proveedor.
- `debounceMsByChannel`: sustituciones de `debounceMs` por canal, indexadas por id. de proveedor.

### Antirrebote de entrada

Agrupa mensajes rápidos que solo contienen texto y proceden del mismo remitente en un único turno del agente. Los elementos multimedia/adjuntos fuerzan el envío inmediato. Los comandos de control omiten el antirrebote. Valor predeterminado de `debounceMs`: `2000`.

### Otras claves de mensajes

- `messages.messagePrefix`: texto de prefijo antepuesto a los mensajes entrantes del usuario antes de que lleguen al entorno de ejecución del agente. Úselo con moderación para marcadores de contexto del canal.
- `messages.visibleReplies`: controla las respuestas de origen visibles en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para generar una salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada del pie de página de `/usage` y modo predeterminado de uso por respuesta (`off | tokens | full`, además del alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: activadores de menciones en mensajes grupales y tamaño de la ventana del historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias `⚠️` de errores de herramientas que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede volver a intentarlo). Valor predeterminado: `false`.

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

- `auto` controla el modo predeterminado de TTS automático: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` es opcional.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY` como valores alternativos.
- Los proveedores de voz incluidos son propiedad de sus plugins. Si se establece `plugins.allow`, incluya cada plugin de proveedor de TTS que desee usar; por ejemplo, `microsoft` para Edge TTS. El identificador de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de TTS de OpenAI. El orden de resolución es la configuración, después `OPENAI_TTS_BASE_URL` y, por último, `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor de TTS compatible con OpenAI y flexibiliza la validación del modelo y la voz.

---

## Conversación

Valores predeterminados del modo Conversación (macOS/iOS/Android y la interfaz de control del navegador).

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Habla con calidez y mantén las respuestas breves.",
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

- `talk.provider` debe coincidir con una clave de `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves planas heredadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo para compatibilidad. Ejecute `openclaw doctor --fix` para reescribir la configuración persistente en `talk.providers.<provider>`.
- Los identificadores de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` como alternativa (comportamiento del cliente Talk de macOS).
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` se aplica únicamente cuando no hay ninguna clave de API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face que utiliza el asistente local de MLX para macOS. Si se omite, macOS utiliza `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el asistente `openclaw-mlx-tts` incluido cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` sustituye la ruta del asistente para el desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento de la ejecución completa del agente de OpenClaw que gestiona las llamadas `openclaw_agent_consult` en tiempo real de Talk en la interfaz de control. Déjelo sin definir para conservar el comportamiento normal de la sesión y el modelo.
- `consultFastMode` establece una sustitución puntual del modo rápido para las consultas en tiempo real de Talk en la interfaz de control, sin cambiar la configuración normal del modo rápido de la sesión.
- `speechLocale` establece el identificador de configuración regional BCP 47 utilizado por el reconocimiento de voz de Talk en iOS/macOS. Déjelo sin definir para usar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk tras el silencio del usuario antes de enviar la transcripción. Si no se define, se conserva el intervalo de pausa predeterminado de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones del sistema destinadas al proveedor al mensaje en tiempo real integrado de OpenClaw, de modo que se pueda configurar el estilo de voz sin perder las directrices predeterminadas de `openclaw_agent_consult`.
- `realtime.vadThreshold` establece el umbral de actividad de voz del proveedor entre `0` (máxima sensibilidad) y `1` (mínima sensibilidad). Si no se define, se conserva el valor predeterminado del proveedor.
- `realtime.silenceDurationMs` establece el intervalo de silencio, como número entero positivo, antes de que el proveedor confirme un turno del usuario en tiempo real. Si no se define, se conserva el valor predeterminado del proveedor.
- `realtime.prefixPaddingMs` establece la cantidad de audio, como número entero no negativo, que se conserva antes del inicio del habla detectada. Si no se define, se conserva el valor predeterminado del proveedor.
- `realtime.reasoningEffort` establece el nivel de razonamiento específico del proveedor para las sesiones en tiempo real. Si no se define, se conserva el valor predeterminado del proveedor.
- `realtime.consultRouting`: `"provider-direct"` (valor predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real genera una transcripción final del usuario sin `openclaw_agent_consult`. En cambio, `"force-agent-consult"` dirige la solicitud finalizada a través de OpenClaw.

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas habituales y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
