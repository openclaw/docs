---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, contenido multimedia, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajuste del comportamiento de las sesiones, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados de los agentes, enrutamiento multiagente y configuración de sesiones, mensajes y conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-20T11:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b42bd47b953d5e970a125df8250f76ae70891fc5bd12fee3120f03365b5af597
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con ámbito de agente en `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para los canales, las herramientas, el entorno de ejecución del Gateway y otras
claves de nivel superior, consulte la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados del agente

### `agents.defaults.workspace`

Valor predeterminado: `OPENCLAW_WORKSPACE_DIR` cuando está establecido; de lo contrario, `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está establecido en un perfil no predeterminado).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valor explícito de `agents.defaults.workspace` tiene prioridad sobre
`OPENCLAW_WORKSPACE_DIR`. Utilice la variable de entorno para dirigir los agentes predeterminados
a un espacio de trabajo montado cuando no se desee escribir esa ruta en la configuración.

### `agents.defaults.repoRoot`

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se establece, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos predeterminada y opcional de Skills para los agentes que no establecen
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
- Una lista no vacía de `agents.list[].skills` constituye el conjunto definitivo para ese agente;
  no se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de los archivos de inicialización del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de determinados archivos opcionales del espacio de trabajo, pero continúa escribiendo los archivos de inicialización obligatorios (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` y `IDENTITY.md`.

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

Controla cuándo se insertan los archivos de inicialización del espacio de trabajo en el prompt del sistema. Valor predeterminado: `"always"`.

- `"continuation-skip"`: los turnos de continuación seguros (después de una respuesta completada del asistente) omiten la reinserción de la inicialización del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a la Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva la inicialización del espacio de trabajo y la inserción de archivos de contexto en cada turno. Utilice esta opción únicamente para agentes que controlen por completo el ciclo de vida de su prompt (motores de contexto personalizados, entornos de ejecución nativos que construyen su propio contexto o flujos de trabajo especializados sin inicialización). Los turnos de Heartbeat y de recuperación de la Compaction también omiten la inserción.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Anulación por agente: `agents.list[].contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Número máximo de caracteres por archivo de inicialización del espacio de trabajo antes del truncamiento. Valor predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Anulación por agente: `agents.list[].bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Número máximo total de caracteres insertados entre todos los archivos de inicialización del espacio de trabajo. Valor predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Anulación por agente: `agents.list[].bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Anulaciones del perfil de inicialización por agente

Utilice anulaciones del perfil de inicialización por agente cuando un agente necesite un comportamiento de
inserción del prompt diferente de los valores predeterminados compartidos. Los campos omitidos heredan de
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

Controla el aviso visible para el agente en el prompt del sistema cuando se trunca el contexto de inicialización.
Valor predeterminado: `"always"`.

- `"off"`: nunca inserta texto de aviso de truncamiento en el prompt del sistema.
- `"once"`: inserta un aviso conciso una vez por cada firma de truncamiento única.
- `"always"`: inserta un aviso conciso en cada ejecución cuando existe truncamiento (recomendado).

Los recuentos detallados de datos sin procesar e insertados y los campos de ajuste de la configuración permanecen en diagnósticos como
los informes de contexto/estado y los registros; el contexto rutinario de usuario/entorno de ejecución de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad de los presupuestos de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de gran volumen, que se
dividen intencionadamente por subsistema en lugar de canalizarse todos mediante un único
control genérico.

| Presupuesto                                                    | Abarca                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inserción normal de la inicialización del espacio de trabajo                                                                                                    |
| `agents.defaults.startupContext.*`                             | Preámbulo de una sola ejecución del modelo al restablecer/iniciar, incluidos los archivos `memory/*.md` diarios recientes. Los comandos de chat simples `/new` y `/reset` se confirman sin invocar el modelo |
| `skills.limits.*`                                              | La lista compacta de Skills insertada en el prompt del sistema                                                                                                  |
| `agents.defaults.contextLimits.*`                              | Fragmentos acotados del entorno de ejecución y bloques insertados propiedad del entorno de ejecución                                                           |
| `memory.qmd.limits.*`                                          | Dimensionamiento del fragmento indexado de búsqueda en memoria y de su inserción                                                                                 |

Anulaciones por agente correspondientes:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preámbulo de inicio del primer turno que se inserta en las ejecuciones del modelo al restablecer/iniciar.
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

Valores predeterminados compartidos para superficies acotadas del contexto del entorno de ejecución.

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

- `memoryGetMaxChars`: límite predeterminado del fragmento de `memory_get` antes de añadir
  los metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se
  omite `lines`.
- `toolResultMaxChars`: límite avanzado de resultados de herramientas en vivo utilizado para los
  resultados persistentes y la recuperación de desbordamiento. Déjelo sin establecer para usar el límite automático del contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres con 100K+ tokens y `64000`
  caracteres con 200K+ tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue restringido a aproximadamente el 30 % de
  la ventana de contexto del modelo. `openclaw doctor --deep` muestra el límite efectivo,
  y doctor solo advierte cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite del fragmento de AGENTS.md utilizado durante la
  inserción de actualización posterior a la Compaction.

#### `agents.list[].contextLimits`

Anulación por agente de los controles compartidos de `contextLimits`. Los campos omitidos heredan
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

Límite global para la lista compacta de Skills insertada en el prompt del sistema. Esto
no afecta a la lectura bajo demanda de los archivos `SKILL.md`.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Anulación por agente del presupuesto del prompt de Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles del lado más largo de la imagen en los bloques de imágenes de transcripciones/herramientas antes de las llamadas al proveedor.
Valor predeterminado: `1200`.

Los valores inferiores suelen reducir el uso de tokens de visión y el tamaño de la carga de la solicitud en ejecuciones con muchas capturas de pantalla.
Los valores superiores conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de la herramienta de imágenes para imágenes cargadas desde rutas de archivos, URL y referencias multimedia.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imágenes seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL y los modelos de visión Llama 4 alojados pueden utilizar imágenes más grandes que las rutas de visión detallada anteriores/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en el modo `auto` para controlar el coste de tokens y latencia.

Valores:

- `auto`: se adapta a los límites del modelo y al número de imágenes.
- `efficient`: prefiere imágenes más pequeñas para reducir el uso de tokens y bytes.
- `balanced`: utiliza la escala estándar de equilibrio intermedio.
- `high`: conserva más detalle para capturas de pantalla, diagramas e imágenes de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Si no se establece, se utiliza la zona horaria del host.

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
        fallbacks: ["google/gemini-3.1-flash-image"],
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
- `utilityModel`: referencia o alias `provider/model` opcional para tareas internas breves. Actualmente se utiliza para generar los títulos de sesión de la interfaz de control, los títulos de temas de mensajes directos de Telegram, los títulos automáticos de hilos de Discord y la [narración de borradores de progreso](/es/concepts/progress-drafts#narrated-status). Cuando no se establece, OpenClaw obtiene el modelo pequeño predeterminado declarado por el proveedor principal si existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, las tareas de títulos usan el modelo principal del agente y la narración permanece desactivada. Si un modelo de utilidad distinto no puede preparar o completar un título generado, OpenClaw vuelve a intentar ese título una vez con el modelo principal. Para los títulos del panel, la obtención automática del modelo de utilidad y la conmutación por error habitual usan el proveedor y el perfil de autenticación efectivos de la sesión; un modelo de utilidad explícito conserva su proveedor y autenticación configurados. Establezca `utilityModel: ""` para omitir la ruta de utilidad alternativa; la generación de títulos del panel continúa directamente con el modelo habitual de la sesión. `agents.list[].utilityModel` anula el valor predeterminado, y una anulación de modelo específica de la operación tiene prioridad sobre ambos. Las tareas de utilidad realizan llamadas de modelo independientes y envían contenido específico de la tarea al proveedor del modelo seleccionado. La generación de títulos del panel envía como máximo los primeros 1,000 caracteres del primer mensaje que no sea un comando; la narración envía la solicitud entrante junto con resúmenes compactos y censurados de las herramientas. Elija un proveedor que se ajuste a sus requisitos de coste y tratamiento de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de la herramienta `image` lo utiliza como configuración del modelo de visión cuando el modelo activo no admite imágenes. En cambio, los modelos con visión nativa reciben directamente los bytes de las imágenes cargadas.
  - También se utiliza como ruta de conmutación por error cuando el modelo seleccionado o predeterminado no admite la entrada de imágenes.
  - Se prefieren referencias `provider/model` explícitas. Se aceptan identificadores sin calificar por compatibilidad; si uno coincide de forma única con una entrada configurada que admite imágenes en `models.providers.*.models`, OpenClaw lo califica con ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de imágenes y en cualquier futura superficie de herramientas o plugins que genere imágenes.
  - Valores habituales: `google/gemini-3.1-flash-image` para la generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images o `openai/gpt-image-1.5` para la salida PNG/WebP de OpenAI con fondo transparente.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación correspondiente del proveedor (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de imágenes en orden de identificador de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de música y en la herramienta integrada `music_generate`.
  - Valores habituales: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de música en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación o clave de API correspondiente del proveedor.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de vídeo y en la herramienta integrada `video_generate`.
  - Valores habituales: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores registrados de generación de vídeo en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación o clave de API correspondiente del proveedor.
  - El plugin oficial de generación de vídeo de Qwen admite hasta 1 vídeo de salida, 1 imagen de entrada, 4 vídeos de entrada, 10 segundos de duración y las opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo utiliza para el enrutamiento de modelos.
  - Si se omite, la herramienta de PDF recurre a `imageModel` y, después, al modelo resuelto de la sesión o predeterminado.
- `pdfMaxBytesMb`: límite de tamaño de PDF predeterminado para la herramienta `pdf` cuando no se proporciona `maxBytesMb` al realizar la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas que tiene en cuenta el modo de extracción alternativo de la herramienta `pdf`.
- `verboseDefault`: nivel de detalle predeterminado para los agentes. Valores: `"off"`, `"on"`, `"full"`. Valor predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para los resúmenes de la herramienta `/verbose` y las líneas de herramientas de los borradores de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (añade el comando o detalle sin procesar cuando está disponible). El valor `agents.list[].toolProgressDetail` de cada agente anula este valor predeterminado.
- `reasoningDefault`: visibilidad predeterminada del razonamiento para los agentes. Valores: `"off"`, `"on"`, `"stream"`. El valor `agents.list[].reasoningDefault` de cada agente anula este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican a propietarios, remitentes autorizados o contextos del Gateway con administración de operador cuando no se ha establecido ninguna anulación de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para los agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Valor predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo, `openai/gpt-5.6-sol` para el acceso mediante OAuth de Codex). Si se omite el proveedor, OpenClaw prueba primero un alias, después una coincidencia única entre los proveedores configurados para ese identificador de modelo exacto y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, por lo que se recomienda usar `provider/model` explícito). Si ese proveedor deja de ofrecer el modelo predeterminado configurado, OpenClaw recurre al primer proveedor y modelo configurados en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: alias configurados y ajustes por modelo. Cada entrada puede incluir `alias` (acceso directo) y `params` (específico del proveedor; por ejemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`). Añadir entradas no restringe las anulaciones de modelo.
  - Utilice entradas `provider/*`, como `"openai/*": {}` o `"vllm/*": {}`, para mostrar todos los modelos detectados de los proveedores seleccionados sin enumerar manualmente cada identificador de modelo.
  - Añada `agentRuntime` a una entrada `provider/*` cuando todos los modelos detectados dinámicamente de ese proveedor deban usar el mismo entorno de ejecución. La política de entorno de ejecución `provider/model` exacta sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras de metadatos: utilice `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza los reemplazos que eliminarían entradas existentes, a menos que se proporcione `--replace`.
- `modelPolicy.allow`: lista explícita de anulaciones permitidas. Acepta alias, referencias `provider/model` exactas y comodines de prefijo finales como `openai/*` o `clawrouter/anthropic/*`. Omítala o utilice `[]` para permitir cualquier modelo. `agents.list[].modelPolicy.allow` sustituye la política predeterminada de ese agente; una lista vacía explícita permite que ese agente use cualquier modelo.
  - Los flujos de configuración e incorporación limitados a un proveedor combinan los modelos del proveedor seleccionado en este mapa y conservan los proveedores no relacionados que ya estén configurados.
  - Para los modelos directos de OpenAI Responses, la compactación del lado del servidor se activa automáticamente. Utilice `params.responsesServerCompaction: false` para dejar de insertar `context_management`, o `params.responsesCompactThreshold` para anular el umbral. Consulte [Compactación del lado del servidor de OpenAI](/es/providers/openai#advanced-configuration).
- `params`: parámetros globales predeterminados del proveedor que se aplican a todos los modelos. Se establecen en `agents.defaults.params` (por ejemplo, `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) es anulada por `agents.defaults.models["provider/model"].params` (por modelo) y, después, `agents.list[].params` (identificador de agente coincidente) anula por clave. Consulte [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener más información.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw la reenvía al objeto `provider` de la solicitud de OpenRouter; los valores `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente anulan por clave. Consulte [Enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo que se combina en los cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo adicional tiene prioridad; posteriormente, las rutas de completado no nativas siguen eliminando `store`, que es exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI que se combinan en los cuerpos de solicitud `api: "openai-completions"` de nivel superior. Para `vllm/nemotron-3-*` con el razonamiento desactivado, el plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; los valores `chat_template_kwargs` explícitos anulan los valores predeterminados generados y `extra_body.chat_template_kwargs` sigue teniendo la prioridad final. Los modelos de razonamiento Qwen y Nemotron configurados para vLLM ofrecen opciones binarias `/think` (`off`, `on`) en lugar de la escala de esfuerzo de varios niveles.
- `compat.thinkingFormat`: estilo de la carga útil de razonamiento compatible con OpenAI. Utilice `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` de nivel superior al estilo de Qwen, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admiten argumentos de palabra clave de plantilla de chat en las solicitudes, como vLLM. OpenClaw asigna el razonamiento desactivado a `false` y el activado a `true`; los modelos Qwen configurados para vLLM ofrecen opciones binarias `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento compatible con OpenAI por modelo. Incluya `"xhigh"` para los endpoints personalizados que realmente lo acepten; OpenClaw mostrará entonces `/think xhigh` en los menús de comandos, las filas de sesión del Gateway, la validación de parches de sesión, la validación de la CLI del agente y la validación de `llm-task` para ese proveedor y modelo configurados. Utilice `compat.reasoningEffortMap` cuando el backend requiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: opción exclusiva de Z.AI para activar la conservación del razonamiento. Cuando está activada y el razonamiento está habilitado, OpenClaw envía `thinking.clear_thinking: false` y reproduce los `reasoning_content` anteriores; consulte [Razonamiento y conservación del razonamiento de Z.AI](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional a nivel de proveedor para servidores de modelos locales o autoalojados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el endpoint no está disponible, espera hasta `readyTimeoutMs` y, a continuación, envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw finaliza; un valor positivo detiene el proceso iniciado por OpenClaw tras esa cantidad de milisegundos de inactividad. Consulta [Servicios de modelos locales](/es/gateway/local-model-services).
- La política de ejecución corresponde a los proveedores o modelos, no a `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` para reglas aplicables a todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas del modelo. Un prefijo de proveedor/modelo por sí solo nunca selecciona un entorno de ejecución. Si el entorno de ejecución no está definido o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna modificación explícita de la solicitud. Consulta [Entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).
- Los escritores de configuración que modifican estos campos (por ejemplo, `/models set`, `/models set-image` y los comandos para añadir o eliminar alternativas) guardan la forma de objeto canónica y conservan las listas de alternativas existentes cuando es posible.
- `maxConcurrent`: número máximo de ejecuciones de agentes en paralelo entre sesiones (cada sesión sigue ejecutándose de forma serializada). Valor predeterminado: `4`.

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

- `id`: `"auto"`, `"openclaw"`, un id de arnés de plugin registrado o un alias de backend de CLI compatible. El plugin de Codex incluido registra `codex`; el plugin de Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los arneses de plugin registrados reclamen rutas efectivas que declaren o satisfagan de otro modo su contrato de compatibilidad, y usa OpenClaw cuando ningún arnés coincide. Un runtime de plugin explícito como `id: "codex"` requiere ese arnés y una ruta efectiva compatible; aplica un cierre por error si alguno no está disponible o si la ejecución falla.
- `id: "pi"` solo se acepta como alias obsoleto de `openclaw` para conservar las configuraciones publicadas de v2026.5.22 y versiones anteriores. Las configuraciones nuevas deben usar `openclaw`.
- La precedencia del runtime es primero la política de modelo exacta (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), después `agents.list[]` / `agents.defaults.models["provider/*"]` y, por último, la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime de todo el agente son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, las fijaciones de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` se ignoran durante la selección del runtime. Ejecute `openclaw doctor --fix` para eliminar los valores obsoletos.
- Las rutas oficiales HTTPS exactas y aptas de OpenAI Responses/ChatGPT que no tengan una sobrescritura de solicitud definida pueden usar implícitamente el arnés de Codex. El `agentRuntime.id: "codex"` de proveedor/modelo convierte Codex en un requisito con cierre por error, pero no hace compatible una ruta incompatible.
- Para implementaciones de Claude CLI, se recomienda `model: "anthropic/claude-opus-4-8"` junto con `agentRuntime.id: "claude-cli"` limitado al modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero las configuraciones nuevas deben mantener canónica la selección de proveedor/modelo y colocar el backend de ejecución en la política de runtime del proveedor/modelo.
- Esto solo controla la ejecución de turnos del agente de texto. La generación multimedia, la visión, los PDF, la música, el vídeo y TTS siguen usando sus configuraciones de proveedor/modelo.

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

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento, a menos que se establezca `--thinking off` o se defina `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas a herramientas. Establezca `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando se activa explícitamente el razonamiento adaptativo, el valor predeterminado de esfuerzo controlado por el proveedor de Anthropic es `high`. Los modelos Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.

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
          // O use systemPromptFileArg cuando la CLI acepte una opción de archivo de prompt.
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
- Las sesiones son compatibles cuando se establece `sessionArg`.
- Se admite el traspaso de imágenes cuando `imageArg` acepta rutas de archivos.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas de forma segura
  a partir de una cola limitada de la transcripción sin procesar de OpenClaw antes de que exista
  el primer resumen de Compaction. Los cambios de perfil de autenticación o de época de credenciales
  nunca vuelven a inicializarse a partir de datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompts independientes del proveedor aplicadas por familia de modelos en las superficies de prompts ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en las rutas de OpenClaw/proveedor; `personality` solo controla la capa de estilo de interacción amistosa. Las rutas nativas del servidor de aplicaciones de Codex conservan las instrucciones base y de modelo controladas por Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos.

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

- `"friendly"` (valor predeterminado) y `"on"` activan la capa de estilo de interacción amistosa.
- `"off"` solo desactiva la capa amistosa; el contrato de comportamiento GPT-5 etiquetado permanece activado.
- El valor heredado `plugins.entries.openai.config.personality` todavía se lee cuando esta configuración compartida no está establecida.

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
        includeSystemPromptSection: true, // valor predeterminado: true; false omite la sección Heartbeat del prompt del sistema
        lightContext: false, // valor predeterminado: false; true conserva solo HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // valor predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // valor predeterminado: false; true también espera a los carriles de subagentes/anidados de este agente
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (valor predeterminado) | block
        target: "none", // valor predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Lea HEARTBEAT.md si existe...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación mediante clave de API) o `1h` (autenticación OAuth). Establézcalo en `0m` para desactivarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y no inyecta `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo, en segundos, permitido para un turno del agente de Heartbeat antes de que se cancele. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté establecido; de lo contrario, se usa la cadencia de Heartbeat con un límite de 600 segundos.
- `directPolicy`: política de entrega directa/por mensaje directo. `allow` (valor predeterminado) permite la entrega a destinos directos. `block` suprime la entrega a destinos directos y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y solo conservan `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Sigue el mismo patrón de aislamiento que `sessionTarget: "isolated"` de Cron. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se aplazan mientras estén ocupados los carriles adicionales de ese agente: el trabajo de sus propios subagentes vinculados a una clave de sesión o de comandos anidados. Los carriles de Cron siempre aplazan los Heartbeats, incluso sin esta opción.
- Por agente: establezca `agents.list[].heartbeat`. Cuando algún agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos completos del agente: los intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un plugin proveedor de Compaction registrado (opcional)
        thinkingLevel: "low", // sobrescritura opcional del razonamiento solo para Compaction
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conserve exactamente los ids de implementación, los ids de tickets y los pares host:puerto.", // se usa cuando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // comprobación opcional de presión del bucle de herramientas
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // habilita la reinyección de secciones de AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // sobrescritura opcional del modelo solo para Compaction
        truncateAfterCompaction: true, // rota a un JSONL sucesor más pequeño después de Compaction
        maxActiveTranscriptBytes: "20mb", // activador opcional de Compaction local previa
        notifyUser: true, // avisos cuando comienza/finaliza Compaction y cuando se degrada el volcado de memoria (valor predeterminado: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // sobrescritura opcional del modelo solo para el volcado de memoria
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La sesión se acerca a Compaction. Almacene ahora los recuerdos duraderos.",
          prompt: "Escriba cualquier nota duradera en memory/YYYY-MM-DD.md; responda con el token silencioso exacto NO_REPLY si no hay nada que almacenar.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulte [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin proveedor de Compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen integrado mediante LLM. En caso de error, se recurre al sistema integrado. Establecer un proveedor fuerza `mode: "safeguard"`. Consulte [Compaction](/es/concepts/compaction).
- `thinkingLevel`: nivel de razonamiento opcional utilizado solo para los resúmenes de Compaction integrados de OpenClaw (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`). Sustituye el nivel de razonamiento actual de la sesión y se limita según el modelo o entorno de ejecución de Compaction seleccionado. Déjelo sin establecer para heredar el nivel de la sesión. La Compaction nativa del servidor de aplicaciones de Codex ignora este ajuste porque la solicitud de compactación nativa no permite sustituir el razonamiento en cada operación; OpenClaw registra una advertencia cuando está configurado.
- `timeoutSeconds`: número máximo de segundos permitidos para una sola operación de Compaction antes de que OpenClaw la cancele. Valor predeterminado: `180`.
- `keepRecentTokens`: presupuesto del punto de corte del agente para conservar literalmente la parte final más reciente de la transcripción. La operación manual `/compact` lo respeta cuando se establece explícitamente; de lo contrario, la Compaction manual es un punto de control estricto.
- `recentTurnsPreserve`: número de turnos recientes del usuario y el asistente que se conservan literalmente fuera del resumen de protección. Valor predeterminado: `3`.
- `identifierPolicy`: `strict` (valor predeterminado), `off` o `custom`. `strict` antepone indicaciones integradas para conservar identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto personalizado opcional para conservar identificadores que se utiliza cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones para volver a intentarlo cuando el resultado de los resúmenes de protección tiene un formato incorrecto. Están habilitadas de forma predeterminada en el modo de protección; establezca `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de la presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión del contexto después de añadir los resultados de las herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, cancela el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de la comprobación previa existente para truncar los resultados de las herramientas o ejecutar Compaction y volver a intentarlo. Funciona con los modos de Compaction `default` y `safeguard`. Valor predeterminado: deshabilitada.
- `postIndexSync`: modo de reindexación de la memoria de sesión posterior a Compaction. Valor predeterminado: `"async"`. Utilice `"await"` para obtener la máxima actualización, `"async"` para reducir la latencia de Compaction o `"off"` solo cuando la sincronización de la memoria de sesión se gestione en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md que se reinyectarán después de la Compaction. La reinyección se deshabilita cuando no se establece o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` habilita ese par y conserva la alternativa heredada `Every Session`/`Safety`. Habilite esta opción únicamente cuando el contexto adicional compense el riesgo de duplicar las indicaciones del proyecto ya incluidas en el resumen de Compaction.
- `model`: `provider/model-id` opcional o alias sin formato de `agents.defaults.models` solo para el resumen de Compaction. Los alias sin formato se resuelven antes del envío; los identificadores literales de modelos configurados tienen prioridad en caso de colisión. Utilice esta opción cuando la sesión principal deba conservar un modelo, pero los resúmenes de Compaction deban ejecutarse en otro; cuando no se establece, Compaction utiliza el modelo principal de la sesión.
- `truncateAfterCompaction`: rota la transcripción de la sesión activa después de la Compaction para que los turnos futuros carguen únicamente el resumen y la parte final no resumida, mientras la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Valor predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la Compaction local normal antes de una ejecución cuando el historial de la transcripción supera el umbral. Requiere `truncateAfterCompaction` para que una Compaction correcta pueda rotar a una transcripción sucesora más pequeña. Se deshabilita cuando no se establece o es `0`.
- `notifyUser`: cuando `true`, envía al usuario avisos breves sobre el mantenimiento del contexto: cuando la Compaction comienza y termina (por ejemplo, «Compactando el contexto...» y «Compaction completada»), y cuando se agota un vaciado de memoria previo a Compaction, por lo que la respuesta continúa en un estado degradado (por ejemplo, «El mantenimiento de la memoria ha fallado temporalmente; se continúa con la respuesta.»). Está deshabilitado de forma predeterminada para mantener estos avisos en silencio.
- `memoryFlush`: turno silencioso del agente antes de la Compaction automática para almacenar recuerdos persistentes. Establezca `model` en un proveedor/modelo exacto, como `ollama/qwen3:8b`, cuando este turno de mantenimiento deba permanecer en un modelo local; la sustitución no hereda la cadena de alternativas de la sesión activa. `forceFlushTranscriptBytes` fuerza el vaciado cuando el tamaño de la transcripción alcanza el umbral, incluso si los contadores de tokens están desactualizados. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Elimina los **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en disco. Está deshabilitado de forma predeterminada; establezca `mode: "cache-ttl"` para habilitarlo.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // desactivado (predeterminado) | cache-ttl
      },
    },
  },
}
```

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita las pasadas de eliminación.
- La eliminación primero recorta de forma moderada los resultados de herramientas demasiado grandes y, si es necesario, borra por completo los resultados de herramientas más antiguos.

El **recorte moderado** conserva el principio y el final e inserta `...` en medio.

El **borrado completo** sustituye todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imágenes nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (son aproximadas), no en recuentos exactos de tokens.
- Se conservan los mensajes más recientes del asistente.

</Accordion>

Consulte [Eliminación de sesiones](/es/concepts/session-pruning) para obtener detalles sobre el comportamiento.

### Transmisión por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // activado | desactivado
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // desactivado (predeterminado) | natural | personalizado (use minMs/maxMs)
    },
  },
}
```

- Los canales distintos de Telegram requieren `*.streaming.block.enabled: true` explícito para habilitar las respuestas por bloques. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite respuestas por bloques, salvo que `channels.qqbot.streaming.mode` sea `"off"`.
- Sustituciones por canal: `channels.<channel>.streaming.block.coalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack utilizan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Valor predeterminado: `off`. `natural` = 800-2500ms. `custom` utiliza `minMs`/`maxMs` (recurre al intervalo natural para cualquier límite no establecido). Sustitución por agente: `agents.list[].humanDelay`.

Consulte [Transmisión](/es/concepts/streaming) para obtener detalles sobre el comportamiento y la fragmentación.

### Indicadores de escritura

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // nunca | instantáneo | razonando | mensaje
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Valor predeterminado de `typingIntervalSeconds`: `6`.
- Sustituciones por sesión: `session.typingMode`.

Consulte [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente integrado. Consulte [Aislamiento](/es/gateway/sandboxing) para obtener la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // desactivado (predeterminado) | no principal | todos
        backend: "docker", // docker (predeterminado) | ssh | openshell
        scope: "agent", // sesión | agente (predeterminado) | compartido
        workspaceAccess: "none", // ninguno (predeterminado) | ro | rw
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
          // También se admiten SecretRefs/contenidos insertados:
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

Los valores predeterminados mostrados anteriormente (imagen `off`/`docker`/`agent`/`none`/`bookworm-slim`, red `none`, etc.) son los valores predeterminados reales de OpenClaw, no simples valores ilustrativos.

<Accordion title="Detalles del aislamiento">

**Entorno de ejecución:**

- `docker`: entorno de ejecución local de Docker (predeterminado)
- `ssh`: entorno de ejecución remoto genérico respaldado por SSH
- `openshell`: entorno de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del entorno de ejecución se trasladan a
`plugins.entries.openshell.config`.

**Configuración del entorno de ejecución SSH:**

- `target`: destino SSH con el formato `user@host[:port]`
- `command`: comando del cliente SSH (valor predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta utilizada para los espacios de trabajo por ámbito (valor predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes proporcionados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido insertado o SecretRefs que OpenClaw materializa en archivos temporales durante la ejecución
- `strictHostKeyChecking` / `updateHostKeys`: opciones de la política de claves de host de OpenSSH (ambas tienen como valor predeterminado `true`)

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores de `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del entorno de ejecución de secretos antes de que se inicie la sesión del entorno aislado

**Comportamiento del backend SSH:**

- inicializa una vez el espacio de trabajo remoto después de crearlo o volver a crearlo
- después mantiene como canónico el espacio de trabajo SSH remoto
- enruta `exec`, las herramientas de archivos y las rutas multimedia mediante SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador del entorno aislado

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo del entorno aislado por ámbito en `~/.openclaw/sandboxes` (valor predeterminado)
- `ro`: espacio de trabajo del entorno aislado en `/workspace`, con el espacio de trabajo del agente montado en modo de solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado en modo de lectura y escritura en `/workspace`

**Ámbito:**

- `session`: contenedor y espacio de trabajo por sesión
- `agent`: un contenedor y espacio de trabajo por agente (valor predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // espejo (valor predeterminado) | remoto
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

- `mirror`: inicializa el entorno remoto a partir del local antes de la ejecución y vuelve a sincronizarlo después; el espacio de trabajo local permanece como canónico
- `remote`: inicializa una vez el entorno remoto cuando se crea el entorno aislado y después mantiene como canónico el espacio de trabajo remoto

En el modo `remote`, las modificaciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte se realiza mediante SSH hacia el entorno aislado de OpenShell, pero el plugin gestiona el ciclo de vida del entorno aislado y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Requiere salida de red, raíz con permisos de escritura y usuario raíz.

**Los contenedores usan `network: "none"` de forma predeterminada**; establézcalo en `"bridge"` (o en una red puente personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada, salvo que se establezca explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergencia).
Los turnos del servidor de aplicaciones de Codex en un entorno aislado activo de OpenClaw utilizan esta misma configuración de salida para su acceso nativo a la red en modo de código.

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los enlaces globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`, valor predeterminado `false`): Chromium + CDP en un contenedor. La URL de noVNC se inserta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observación mediante noVNC utiliza autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (valor predeterminado) impide que las sesiones en entornos aislados se dirijan al navegador del host.
- `network` tiene como valor predeterminado `openclaw-sandbox-browser` (red puente dedicada). Establézcalo en `bridge` solo cuando se desee explícitamente conectividad global con la red puente. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada de CDP en el límite del contenedor a un intervalo CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del navegador del entorno aislado. Cuando se establece (incluido `[]`), sustituye a `docker.binds` para el contenedor del navegador.
- Chromium siempre se inicia con `--no-sandbox --disable-setuid-sandbox` en el contenedor del navegador del entorno aislado (los contenedores no disponen de las primitivas del kernel que necesita el entorno aislado propio de Chrome); no hay ninguna opción de configuración para cambiarlo.
- Los valores predeterminados de inicio se definen en `scripts/sandbox-browser-entrypoint.sh` y están optimizados para hosts de contenedores:
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
  - `--renderer-process-limit=2` de forma predeterminada; cámbielo con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establezca `0` para utilizar el
    límite de procesos predeterminado de Chromium.
  - `--headless=new` solo cuando `headless` está habilitado.
  - Los valores predeterminados son la configuración base de la imagen del contenedor; utilice una imagen de navegador personalizada con un
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

Utilice `agents.list[].tts` para asignar a un agente su propio proveedor de TTS, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina de forma profunda sobre la configuración global
`messages.tts`, por lo que las credenciales compartidas pueden mantenerse en un único lugar mientras los agentes
individuales anulan únicamente los campos de voz o proveedor que necesitan. La anulación del agente activo
se aplica a las respuestas habladas automáticas, `/tts audio`, `/tts status` y
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
        skills: ["docs-search"], // sustituye agents.defaults.skills cuando se establece
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
- `default`: cuando se establecen varios, prevalece el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena establece un modelo principal estricto por agente sin modelo alternativo; la forma de objeto `{ primary }` también es estricta, salvo que se añada `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar modelos alternativos para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo sobrescriben `primary` siguen heredando los modelos alternativos predeterminados, salvo que se establezca `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas breves, como la generación de títulos de sesiones e hilos. Si no está disponible, se usa `agents.defaults.utilityModel` y, después, el modelo pequeño predeterminado declarado por el proveedor efectivo de la sesión. Para los títulos del panel, se vuelve a intentar una vez con el modelo normal efectivo de la sesión. Una cadena vacía omite la ruta de utilidad alternativa para este agente sin deshabilitar la generación de títulos del panel.
- `params`: parámetros de transmisión por agente que se combinan sobre la entrada del modelo seleccionada en `agents.defaults.models`. Úselo para sobrescrituras específicas del agente, como `cacheRetention`, `temperature` o `maxTokens`, sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se combina en profundidad sobre `messages.tts`, por lo que las credenciales compartidas del proveedor y la política de respaldo deben mantenerse en `messages.tts`, y aquí solo deben establecerse valores específicos de la personalidad, como el proveedor, la voz, el modelo, el estilo o el modo automático.
- `skills`: lista opcional de Skills permitidas por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está establecido; una lista explícita sustituye los valores predeterminados en lugar de combinarlos, y `[]` significa que no hay Skills.
- `thinkingDefault`: nivel de razonamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado determina qué valores son válidos; para Google Gemini, `adaptive` mantiene el razonamiento dinámico gestionado por el proveedor (`thinkingLevel` se omite en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se establece ninguna sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se establece ninguna sobrescritura del modo rápido por mensaje o sesión.
- `models`: sobrescrituras opcionales por agente del catálogo de modelos o del entorno de ejecución, indexadas por ids completos de `provider/model`. Use `models["provider/model"].agentRuntime` para excepciones del entorno de ejecución por agente.
- `runtime`: descriptor opcional del entorno de ejecución por agente. Use `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones del arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales `identity.avatar` con rutas relativas al espacio de trabajo tienen un límite de 2 MB. Las URL `http(s)` y las URI `data:` no se comprueban con respecto al límite de tamaño de los archivos locales.
- `identity` deriva los valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de ids de agentes configurados permitidos para destinos `sessions_spawn.agentId` explícitos (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). Incluya el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se haya eliminado son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecute `openclaw doctor --fix` para limpiarlas, o añada una entrada mínima `agents.list[]` si ese destino debe poder seguir generándose mientras hereda los valores predeterminados.
- Protección de herencia del entorno aislado: si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos que se ejecutarían sin aislamiento.
- `subagents.requireAgentId`: cuando es verdadero, bloquea las llamadas `sessions_spawn` que omiten `agentId` (obliga a seleccionar explícitamente el perfil; valor predeterminado: falso).
- `subagents.maxConcurrent`: máximo de ejecuciones simultáneas de agentes secundarios durante la ejecución de subagentes. Valor predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: máximo de agentes secundarios activos que puede generar una sola sesión de agente. Valor predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para la generación de subagentes (`1`-`5`). Valor predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: tiempo tras el cual se archiva el estado de los subagentes completados. Valor predeterminado: `60`.

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

### Campos de coincidencia de los enlaces

- `type` (opcional): `route` para el enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para enlaces persistentes de conversaciones ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; si se omite = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico del canal)
- `acp` (opcional; solo para `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden de coincidencia determinista:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin par/gremio/equipo)
5. `match.accountId: "*"` (en todo el canal)
6. Agente predeterminado

Dentro de cada nivel, prevalece la primera entrada `bindings` que coincida.

Para las entradas `type: "acp"`, OpenClaw resuelve mediante la identidad exacta de la conversación (`match.channel` + cuenta + `match.peer.id`) y no utiliza el orden de niveles de enlaces de ruta anterior.

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

Consulte [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para obtener detalles sobre la precedencia.

---

## Sesión

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // principal | por par | por canal y par | por cuenta, canal y par
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // diario | inactivo
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
      mode: "enforce", // aplicar (predeterminado) | advertir
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // límite estricto opcional
      highWaterBytes: "400mb", // objetivo de limpieza opcional
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desenfoque automático predeterminado tras inactividad, en horas (`0` lo deshabilita)
      maxAgeHours: 0, // antigüedad máxima estricta predeterminada en horas (`0` la deshabilita)
    },
    mainKey: "main", // heredado (el entorno de ejecución siempre usa "main")
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalles de los campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro del contexto de un canal.
  - `global`: todos los participantes de un contexto de canal comparten una única sesión (úselo solo cuando se pretenda compartir el contexto).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aísla por id. de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna identificadores canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan la misma asignación para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulte [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `none` desactiva el restablecimiento automático y es el valor predeterminado; Compaction limita en su lugar el contexto activo. `daily` restablece a las `atHour` hora local; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, prevalece el que caduque primero. `/new` y `/reset` permanecen disponibles en todos los modos. La vigencia del restablecimiento diario usa el valor `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras de eventos en segundo plano o del sistema, como Heartbeat, activaciones de Cron, notificaciones de ejecución y mantenimiento del Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias o por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). El valor heredado `dm` se acepta como alias de `direct`.
- **`resetByChannel`**: anulaciones de restablecimiento por canal indexadas por id. de proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta prevalece por completo sobre `resetByType`/`reset` para esa sesión. Úselo solo cuando un canal necesite un comportamiento de restablecimiento distinto de la política del tipo.
- **`mainKey`**: campo heredado. El entorno de ejecución siempre usa `"main"` para el contenedor principal de chat directo.
- **`sendPolicy`**: busca coincidencias por `channel`, `chatType` (`direct|group|channel`, con el alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Prevalece la primera denegación.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (valor predeterminado: `30d`).
  - `maxEntries`: número máximo de entradas de sesión de SQLite (valor predeterminado: `500`). Las escrituras del entorno de ejecución realizan la limpieza por lotes con un pequeño margen sobre el límite superior para topes de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el tope inmediatamente.
  - Las sesiones de sondeo de ejecuciones de modelos del Gateway de corta duración usan una retención fija de `24h`, pero la limpieza depende de la presión: solo elimina las filas obsoletas de sondeos estrictos de ejecuciones de modelos cuando se alcanza la presión de mantenimiento o del límite de entradas de sesión. Solo son aptas las claves de sondeo explícitas estrictas que coincidan con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilos, Cron, enlaces, Heartbeat, ACP y subagentes no heredan esta retención de 24 h. Cuando se ejecuta la limpieza de ejecuciones de modelos, se realiza antes que la limpieza más amplia de entradas obsoletas de `pruneAfter` y el límite de `maxEntries`.
  - El valor heredado `rotateBytes` es rechazado por el esquema actual; `openclaw doctor --fix` lo elimina de configuraciones antiguas.
  - `resetArchiveRetention`: retención basada en antigüedad para archivos de transcripciones restablecidas o eliminadas. De forma predeterminada, los archivos permanecen hasta que se expulsan por el presupuesto de disco; establezca una duración para habilitar la eliminación según el tiempo transcurrido, o `false` para desactivarla explícitamente.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En el modo `warn` registra advertencias; en el modo `enforce` elimina primero los artefactos y las sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza del presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor predeterminado principal (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: antigüedad máxima absoluta predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: control predeterminado para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y creaciones de hilos ACP. El valor predeterminado es `true` cuando están habilitadas las vinculaciones de hilos; los proveedores y las cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado de subagente para creaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

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

Anulaciones por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (prevalece el más específico): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción            | Ejemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo       | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor          | `anthropic`                 |
| `{thinkingLevel}` | Nivel de razonamiento actual | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente    | (igual que `"auto"`)          |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- El valor predeterminado es `identity.emoji` del agente activo; de lo contrario, `"👀"`. Establezca `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → alternativa de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all` o `off`/`none` (desactiva por completo las reacciones de confirmación).
- `removeAckAfterReply`: elimina la confirmación después de responder en canales compatibles con reacciones, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: habilita las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Discord, si no se establece, las reacciones de estado permanecen habilitadas cuando las reacciones de confirmación están activas.
  En Slack, Signal, Telegram y WhatsApp, establézcalo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.
  Slack usa de forma predeterminada el estado nativo de hilo del asistente y mensajes de carga rotatorios para indicar el progreso, mientras mantiene estática la reacción de confirmación configurada.
- `messages.statusReactions.emojis`: anula las claves de emoji del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emoji configurados no compatibles se sustituyen
  por la variante de estado compatible más cercana para ese chat.

### Cola

- `mode`: estrategia de cola para los mensajes entrantes que llegan mientras hay una ejecución de sesión activa. Valor predeterminado: `"steer"`.
  - `steer`: inserta la nueva solicitud en la ejecución activa.
  - `followup`: ejecuta la nueva solicitud después de que termine la ejecución activa.
  - `collect`: agrupa los mensajes compatibles y los ejecuta juntos más adelante.
  - `interrupt`: cancela la ejecución activa antes de iniciar la solicitud más reciente.
- `debounceMs`: retraso antes de enviar un mensaje en cola o redirigido. Valor predeterminado: `500`.
- `cap`: número máximo de mensajes en cola antes de aplicar la política de descarte. Valor predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas, pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: anulaciones de `mode` por canal indexadas por id. de proveedor.
- `debounceMsByChannel`: anulaciones de `debounceMs` por canal indexadas por id. de proveedor.

### Antirrebote de entrada

Agrupa los mensajes rápidos que solo contienen texto y proceden del mismo remitente en un único turno del agente. Los archivos multimedia y adjuntos fuerzan el envío inmediato. Los comandos de control omiten el antirrebote. Valor predeterminado de `debounceMs`: `2000`.

### Otras claves de mensajes

- `channels.whatsapp.messagePrefix`: prefijo exclusivo de WhatsApp que se antepone a los mensajes de usuario entrantes antes de que lleguen al entorno de ejecución del agente.
- `messages.visibleReplies`: controla las respuestas visibles al origen en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para producir una salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada de pie de página de `/usage` y modo predeterminado de uso por respuesta (`off | tokens | full`, además del alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: activadores de mención en mensajes grupales y tamaño de la ventana del historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias de error de herramientas de `⚠️` que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede volver a intentarlo). Valor predeterminado: `false`.

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

- `auto` controla el modo automático de TTS predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` es opcional.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY` como alternativa.
- Los proveedores de voz incluidos pertenecen a plugins. Si se establece `plugins.allow`, se debe incluir cada plugin de proveedor de TTS que se quiera usar, por ejemplo, `microsoft` para Edge TTS. El identificador de proveedor heredado `edge` se acepta como alias de `microsoft`.
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

- `talk.provider` debe coincidir con una clave de `talk.providers` cuando hay varios proveedores de Conversación configurados.
- Las claves planas heredadas de Conversación (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) solo se mantienen por compatibilidad. Se debe ejecutar `openclaw doctor --fix` para reescribir la configuración persistente en `talk.providers.<provider>`.
- Los identificadores de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` como alternativa (comportamiento del cliente de Conversación de macOS).
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` solo se aplica cuando no hay ninguna clave de API de Conversación configurada.
- `providers.*.voiceAliases` permite que las directivas de Conversación utilicen nombres fáciles de recordar.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face que utiliza el asistente local de MLX de macOS. Si se omite, macOS utiliza `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está disponible, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para el desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento de la ejecución completa del agente OpenClaw que sustenta las llamadas `openclaw_agent_consult` en tiempo real de Conversación de la interfaz de control. Se debe dejar sin establecer para conservar el comportamiento normal de la sesión y el modelo.
- `consultFastMode` establece una anulación puntual del modo rápido para las consultas en tiempo real de Conversación de la interfaz de control sin cambiar la configuración normal del modo rápido de la sesión.
- `speechLocale` establece el identificador de configuración regional BCP 47 que utilizan Android, iOS y macOS para el reconocimiento de voz de Conversación. Android también utiliza su componente de idioma para orientar la transcripción de la entrada en tiempo real. Se debe dejar sin establecer para utilizar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Conversación después de que el usuario guarda silencio antes de enviar la transcripción. Si no se establece, se conserva el intervalo de pausa predeterminado de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones del sistema destinadas al proveedor al prompt en tiempo real integrado de OpenClaw, de modo que se pueda configurar el estilo de voz sin perder las indicaciones predeterminadas de `openclaw_agent_consult`.
- `realtime.vadThreshold` establece el umbral de actividad de voz del proveedor entre `0` (máxima sensibilidad) y `1` (mínima sensibilidad). Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.silenceDurationMs` establece el intervalo de silencio expresado como un número entero positivo antes de que el proveedor confirme un turno del usuario en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.prefixPaddingMs` establece la cantidad de audio, expresada como un número entero no negativo, que se conserva antes de que comience el habla detectada. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.reasoningEffort` establece el nivel de razonamiento específico del proveedor para las sesiones en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.consultRouting`: `"provider-direct"` (predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real genera una transcripción final del usuario sin `openclaw_agent_consult`. En cambio, `"force-agent-consult"` enruta la solicitud finalizada a través de OpenClaw.

---

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
