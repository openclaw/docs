---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, heartbeat, contenido multimedia, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajuste del comportamiento de las sesiones, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados del agente, enrutamiento multiagente y configuración de sesiones, mensajes y conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-14T13:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f32cd37bd152935ae7602d40733cec63273d31b5bc89fc6a9a8390927ac8c95
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración específicas del agente en `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para los canales, las herramientas, el entorno de ejecución del Gateway y otras
claves de nivel superior, consulte la [referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados de los agentes

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

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se establece, OpenClaw la detecta automáticamente ascendiendo desde el espacio de trabajo.

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
      { id: "docs", skills: ["docs-search"] }, // sustituye los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para permitir todas las Skills de forma predeterminada.
- Omita `agents.list[].skills` para heredar los valores predeterminados.
- Establezca `agents.list[].skills: []` para no permitir ninguna Skill.
- Una lista no vacía de `agents.list[].skills` constituye el conjunto final para ese agente;
  no se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos de arranque del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Omite la creación de determinados archivos opcionales del espacio de trabajo, pero sigue escribiendo los archivos de arranque obligatorios (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` y `IDENTITY.md`.

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
- `"never"`: desactiva la inyección del arranque del espacio de trabajo y de los archivos de contexto en cada turno. Utilice esta opción únicamente para agentes que controlen por completo el ciclo de vida de su prompt (motores de contexto personalizados, entornos de ejecución nativos que construyan su propio contexto o flujos de trabajo especializados sin arranque). Los turnos de Heartbeat y de recuperación de Compaction también omiten la inyección.

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

### Anulaciones del perfil de arranque por agente

Utilice anulaciones del perfil de arranque por agente cuando uno de ellos necesite un comportamiento de
inyección del prompt diferente de los valores predeterminados compartidos. Los campos omitidos heredan de
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
- `"always"`: inyecta un aviso conciso en cada ejecución cuando hay truncamiento (recomendado).

Los recuentos detallados de datos sin procesar e inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
los informes de contexto/estado y los registros; el contexto habitual de usuario y entorno de ejecución de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de responsabilidades de los presupuestos de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de gran volumen, que se
dividen intencionadamente por subsistema en lugar de gestionarse todos mediante un único
control genérico.

| Presupuesto                                                     | Incluye                                                                                                                                                         |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inyección normal del arranque del espacio de trabajo                                                                                                            |
| `agents.defaults.startupContext.*`                             | Preámbulo de una sola ejecución del modelo al restablecer/iniciar, incluidos los archivos `memory/*.md` diarios recientes. Los comandos de chat sin contenido `/new` y `/reset` se confirman sin invocar el modelo |
| `skills.limits.*`                                              | La lista compacta de Skills inyectada en el prompt del sistema                                                                                                  |
| `agents.defaults.contextLimits.*`                              | Extractos acotados del entorno de ejecución y bloques inyectados propiedad de este                                                                              |
| `memory.qmd.limits.*`                                          | Tamaño del fragmento indexado de búsqueda en memoria y de su inyección                                                                                           |

Anulaciones correspondientes por agente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preámbulo de inicio del primer turno que se inyecta en las ejecuciones del modelo durante un restablecimiento o inicio.
Los comandos de chat sin contenido `/new` y `/reset` confirman el restablecimiento sin invocar
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

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de añadir los
  metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite
  `lines`.
- `toolResultMaxChars`: límite máximo avanzado de los resultados de herramientas en vivo utilizado para los
  resultados persistidos y la recuperación de desbordamientos. Déjelo sin establecer para usar el límite automático del contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres con 100K+ tokens y `64000`
  caracteres con 200K+ tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue restringido a aproximadamente el 30 % de
  la ventana de contexto del modelo. `openclaw doctor --deep` muestra el límite efectivo,
  y doctor solo advierte cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md utilizado durante la inyección de
  actualización posterior a Compaction.

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

Límite global de la lista compacta de Skills inyectada en el prompt del sistema. Esto
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

Los valores inferiores suelen reducir el uso de tokens de visión y el tamaño de la carga útil de las solicitudes en ejecuciones con muchas capturas de pantalla.
Los valores superiores conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de la herramienta de imágenes para imágenes cargadas desde rutas de archivos, URL y referencias multimedia.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imágenes seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL y los modelos de visión Llama 4 alojados pueden utilizar imágenes más grandes que las rutas de visión de alto detalle antiguas/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en el modo `auto` para controlar el coste de tokens y la latencia.

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

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Utiliza como alternativa la zona horaria del host.

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
- `utilityModel`: referencia o alias `provider/model` opcional para tareas internas breves. Actualmente se utiliza para los títulos generados de las sesiones de la interfaz de control, los títulos de temas de mensajes directos de Telegram, los títulos automáticos de hilos de Discord y la [narración de borradores de progreso](/es/concepts/progress-drafts#narrated-status). Si no se establece, OpenClaw obtiene el modelo pequeño predeterminado declarado por el proveedor principal, si existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, las tareas de títulos recurren al modelo principal del agente y la narración permanece desactivada. Establezca `utilityModel: ""` para desactivar por completo el enrutamiento de utilidades. `agents.list[].utilityModel` anula el valor predeterminado (un valor vacío por agente lo desactiva para ese agente), y una anulación de modelo específica de la operación tiene prioridad sobre ambos. Las tareas de utilidad realizan llamadas de modelo independientes y envían contenido específico de la tarea al proveedor de modelos seleccionado. La generación de títulos del panel envía como máximo los primeros 1.000 caracteres del primer mensaje que no sea un comando; la narración envía la solicitud entrante junto con resúmenes compactos y expurgados de las herramientas. Elija un proveedor que se ajuste a sus requisitos de coste y tratamiento de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de la herramienta `image` lo utiliza como configuración del modelo de visión cuando el modelo activo no puede aceptar imágenes. En cambio, los modelos con visión nativa reciben directamente los bytes de las imágenes cargadas.
  - También se utiliza como enrutamiento de reserva cuando el modelo seleccionado o predeterminado no puede aceptar entradas de imagen.
  - Se prefieren referencias `provider/model` explícitas. Se aceptan identificadores sin calificar por compatibilidad; si un identificador sin calificar coincide de forma única con una entrada configurada que admite imágenes en `models.providers.*.models`, OpenClaw lo califica con ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta o Plugin que genere imágenes.
  - Valores habituales: `google/gemini-3.1-flash-image-preview` para la generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images o `openai/gpt-image-1.5` para la salida PNG/WebP de OpenAI con fondo transparente.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación correspondiente del proveedor (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores de generación de imágenes registrados, en el orden de sus identificadores.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores habituales: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores de generación de música registrados, en el orden de sus identificadores.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación o clave de API correspondiente del proveedor.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo utilizan la capacidad compartida de generación de vídeo y la herramienta integrada `video_generate`.
  - Valores habituales: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, después, los demás proveedores de generación de vídeo registrados, en el orden de sus identificadores.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación o clave de API correspondiente del proveedor.
  - El Plugin oficial de generación de vídeo de Qwen admite hasta 1 vídeo de salida, 1 imagen de entrada, 4 vídeos de entrada, 10 segundos de duración y las opciones de nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo utiliza para el enrutamiento de modelos.
  - Si se omite, la herramienta de PDF recurre a `imageModel` y, después, al modelo resuelto de la sesión o predeterminado.
- `pdfMaxBytesMb`: límite de tamaño de PDF predeterminado para la herramienta `pdf` cuando no se proporciona `maxBytesMb` en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas que tiene en cuenta el modo de extracción de reserva de la herramienta `pdf`.
- `verboseDefault`: nivel de detalle predeterminado para los agentes. Valores: `"off"`, `"on"`, `"full"`. Valor predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para los resúmenes de herramientas de `/verbose` y las líneas de herramientas de los borradores de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (añade el comando o detalle sin procesar cuando está disponible). El valor `agents.list[].toolProgressDetail` por agente anula este valor predeterminado.
- `reasoningDefault`: visibilidad predeterminada del razonamiento para los agentes. Valores: `"off"`, `"on"`, `"stream"`. El valor `agents.list[].reasoningDefault` por agente anula este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican a propietarios, remitentes autorizados o contextos de administrador del operador del Gateway cuando no se establece ninguna anulación de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para los agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Valor predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej., `openai/gpt-5.6-sol` para el acceso OAuth de Codex). Si se omite el proveedor, OpenClaw prueba primero un alias, después una coincidencia única de proveedor configurado para ese identificador exacto de modelo y solo entonces recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, por lo que se prefiere `provider/model` explícito). Si ese proveedor ya no ofrece el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: el catálogo de modelos y la lista de permitidos configurados para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específico del proveedor, por ejemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilice entradas `provider/*`, como `"openai/*": {}` o `"vllm/*": {}`, para mostrar todos los modelos detectados de los proveedores seleccionados sin enumerar manualmente cada identificador de modelo.
  - Añada `agentRuntime` a una entrada `provider/*` cuando todos los modelos detectados dinámicamente para ese proveedor deban utilizar el mismo entorno de ejecución. La política de entorno de ejecución `provider/model` exacta sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras: utilice `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza las sustituciones que eliminarían entradas existentes de la lista de permitidos, salvo que se proporcione `--replace`.
  - Los flujos de configuración e incorporación específicos del proveedor combinan los modelos del proveedor seleccionado en este mapa y conservan los proveedores no relacionados que ya estén configurados.
  - Para los modelos directos de OpenAI Responses, la Compaction del lado del servidor se activa automáticamente. Utilice `params.responsesServerCompaction: false` para dejar de inyectar `context_management` o `params.responsesCompactThreshold` para anular el umbral. Consulte [Compaction de OpenAI del lado del servidor](/es/providers/openai#advanced-configuration).
- `params`: parámetros globales predeterminados del proveedor aplicados a todos los modelos. Se establece en `agents.defaults.params` (p. ej., `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) se sustituye por `agents.defaults.models["provider/model"].params` (por modelo) y, después, `agents.list[].params` (identificador de agente coincidente) sustituye los valores por clave. Consulte [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener más información.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw la reenvía al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente sustituyen los valores por clave. Consulte [Enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado de transferencia directa que se combina en los cuerpos de solicitud `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, prevalece el cuerpo adicional; las rutas de completado no nativas siguen eliminando después `store`, exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI que se combinan en los cuerpos de solicitud `api: "openai-completions"` de nivel superior. Para `vllm/nemotron-3-*` con el razonamiento desactivado, el Plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; los valores `chat_template_kwargs` explícitos sustituyen los valores predeterminados generados, y `extra_body.chat_template_kwargs` sigue teniendo la precedencia final. Los modelos de razonamiento Qwen y Nemotron configurados para vLLM ofrecen opciones binarias `/think` (`off`, `on`) en lugar de la escala de esfuerzo de varios niveles.
- `compat.thinkingFormat`: estilo de carga útil de razonamiento compatible con OpenAI. Utilice `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` de nivel superior al estilo de Qwen o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admitan argumentos de plantilla de chat en el nivel de la solicitud, como vLLM. OpenClaw asigna el razonamiento desactivado a `false` y el razonamiento activado a `true`, y los modelos Qwen configurados para vLLM ofrecen opciones binarias `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzo de razonamiento compatible con OpenAI por modelo. Incluya `"xhigh"` para puntos de conexión personalizados que realmente lo acepten; OpenClaw muestra entonces `/think xhigh` en los menús de comandos, las filas de sesiones del Gateway, la validación de modificaciones de sesión, la validación de la CLI del agente y la validación de `llm-task` para ese proveedor/modelo configurado. Utilice `compat.reasoningEffortMap` cuando el backend requiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: activación opcional exclusiva de Z.AI para conservar el razonamiento. Cuando está activada y el razonamiento está habilitado, OpenClaw envía `thinking.clear_thinking: false` y vuelve a reproducir los `reasoning_content` anteriores; consulte [Razonamiento y razonamiento conservado de Z.AI](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional de nivel de proveedor para servidores de modelos locales o autoalojados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw sondea `healthUrl` (o `baseUrl + "/models"`), inicia `command` con `args` si el punto de conexión no está disponible, espera hasta `readyTimeoutMs` y, después, envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw termina; un valor positivo detiene el proceso iniciado por OpenClaw después de esa cantidad de milisegundos de inactividad. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- La política de tiempo de ejecución corresponde a los proveedores o modelos, no a `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para reglas aplicables a todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para reglas específicas del modelo. Un prefijo de proveedor/modelo por sí solo nunca selecciona un arnés. Cuando el tiempo de ejecución no está establecido o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Responses de la plataforma o Responses de ChatGPT, sin ninguna anulación definida en la solicitud. Consulte [Tiempo de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).
- Los generadores de configuración que modifican estos campos (por ejemplo, `/models set`, `/models set-image` y los comandos para añadir o eliminar alternativas) guardan la forma de objeto canónica y conservan las listas de alternativas existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones de agentes en paralelo entre sesiones (cada sesión sigue ejecutándose en serie). Valor predeterminado: `4`.

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

- `id`: `"auto"`, `"openclaw"`, un id de arnés de Plugin registrado o un alias de backend de CLI compatible. El Plugin Codex incluido registra `codex`; el Plugin Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los arneses de Plugin registrados reclamen rutas efectivas que declaren o satisfagan de otro modo su contrato de compatibilidad, y utiliza OpenClaw cuando ningún arnés coincide. Un runtime de Plugin explícito como `id: "codex"` requiere ese arnés y una ruta efectiva compatible; aplica un cierre seguro si cualquiera de ellos no está disponible o si la ejecución falla.
- `id: "pi"` solo se acepta como alias obsoleto de `openclaw` para preservar las configuraciones publicadas en v2026.5.22 y versiones anteriores. Las configuraciones nuevas deben usar `openclaw`.
- La precedencia del runtime es: primero, la política exacta del modelo (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`); después, `agents.list[]` / `agents.defaults.models["provider/*"]`; y, por último, la política general del proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves de runtime para todo el agente son heredadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, las fijaciones de runtime de sesión y `OPENCLAW_AGENT_RUNTIME` se ignoran durante la selección del runtime. Ejecute `openclaw doctor --fix` para eliminar los valores obsoletos.
- Las rutas oficiales HTTPS exactas y aptas de OpenAI Responses/ChatGPT que no tengan una sobrescritura de solicitud definida pueden usar implícitamente el arnés Codex. El `agentRuntime.id: "codex"` del proveedor/modelo convierte Codex en un requisito de cierre seguro, pero no hace compatible una ruta incompatible.
- Para implementaciones de Claude CLI, se recomienda usar `model: "anthropic/claude-opus-4-8"` junto con `agentRuntime.id: "claude-cli"` en el ámbito del modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero las configuraciones nuevas deben mantener canónica la selección del proveedor/modelo y colocar el backend de ejecución en la política de runtime del proveedor/modelo.
- Esto solo controla la ejecución de turnos de agente de texto. La generación multimedia, la visión, los PDF, la música, el vídeo y TTS siguen usando sus configuraciones de proveedor/modelo.

**Formas abreviadas de alias integrados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

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

Los alias configurados siempre prevalecen sobre los valores predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento, a menos que se establezca `--thinking off` o se defina manualmente `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas a herramientas. Establezca `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarla.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando se activa explícitamente el razonamiento adaptativo, el valor predeterminado de esfuerzo propiedad del proveedor Anthropic es `high`. Los modelos Claude 4.6 usan de forma predeterminada `adaptive` cuando no se establece un nivel de razonamiento explícito.

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
          // También puede usar systemPromptFileArg cuando la CLI acepte una opción de archivo de prompt.
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
- Se admite el paso directo de imágenes cuando `imageArg` acepta rutas de archivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que un backend recupere sesiones invalidadas de forma segura
  a partir de una cola acotada de la transcripción sin procesar de OpenClaw antes de que exista
  el primer resumen de Compaction. Los cambios de perfil de autenticación o de época de credenciales
  siguen sin volver a inicializarse nunca a partir de datos sin procesar.

### `agents.defaults.promptOverlays`

Superposiciones de prompts independientes del proveedor, aplicadas por familia de modelos a las superficies de prompts ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en las rutas de OpenClaw/proveedor; `personality` solo controla la capa de estilo de interacción cordial. Las rutas nativas del servidor de aplicaciones de Codex conservan las instrucciones base y de modelo propiedad de Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos.

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
        lightContext: false, // valor predeterminado: false; true conserva únicamente HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // valor predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // valor predeterminado: false; true también espera a las vías de subagentes/anidadas de este agente
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
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y no inyecta `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo permitido, en segundos, para un turno de agente de Heartbeat antes de que se cancele. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté definido; de lo contrario, se usa la cadencia de Heartbeat, con un límite de 600 segundos.
- `directPolicy`: política de entrega directa/por mensaje directo. `allow` (valor predeterminado) permite la entrega a destinos directos. `block` suprime la entrega a destinos directos y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan únicamente `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Sigue el mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se aplazan si las vías ocupadas adicionales de ese agente están activas: trabajo de su propio subagente asociado a una clave de sesión o trabajo de comandos anidados. Las vías de Cron siempre aplazan los Heartbeats, incluso sin esta opción.
- Por agente: establezca `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos completos de agente; los intervalos más cortos consumen más tokens.

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
        midTurnPrecheck: { enabled: false }, // comprobación opcional de presión en el bucle de herramientas
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // permite optar por volver a inyectar secciones de AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // sobrescritura opcional del modelo solo para Compaction
        truncateAfterCompaction: true, // rota a un archivo JSONL sucesor más pequeño después de Compaction
        maxActiveTranscriptBytes: "20mb", // desencadenador local opcional de Compaction durante la comprobación previa
        notifyUser: true, // avisa cuando Compaction comienza/finaliza y cuando se degrada el vaciado de memoria (valor predeterminado: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // sobrescritura opcional del modelo solo para el vaciado de memoria
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La sesión se aproxima a Compaction. Almacena ahora los recuerdos duraderos.",
          prompt: "Escribe cualquier nota duradera en memory/YYYY-MM-DD.md; responde con el token silencioso exacto NO_REPLY si no hay nada que almacenar.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulte [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin proveedor de compactación registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar de usar el resumen integrado mediante LLM. Si falla, se recurre al mecanismo integrado. Establecer un proveedor fuerza `mode: "safeguard"`. Consulte [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: cantidad máxima de segundos permitida para una única operación de compactación antes de que OpenClaw la cancele. Valor predeterminado: `180`.
- `reserveTokens`: margen de tokens que se mantiene disponible para la salida del modelo y los futuros resultados de herramientas después de la compactación. Cuando se conoce la ventana de contexto del modelo, OpenClaw limita la reserva efectiva para que no pueda consumir el presupuesto del prompt.
- `reserveTokensFloor`: reserva mínima impuesta por el entorno de ejecución integrado. Establezca `0` para desactivar el límite mínimo. Este límite sigue sujeto al límite activo de la ventana de contexto.
- `keepRecentTokens`: presupuesto del punto de corte del agente para conservar literalmente la parte final más reciente de la transcripción. La operación manual `/compact` respeta este valor cuando se establece explícitamente; de lo contrario, la compactación manual constituye un punto de control estricto.
- `recentTurnsPreserve`: número de turnos más recientes de usuario y asistente que se conservan literalmente fuera del resumen de protección. Valor predeterminado: `3`.
- `maxHistoryShare`: fracción máxima del presupuesto total de contexto permitida para el historial conservado después de la compactación (intervalo `0.1`-`0.9`).
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone orientación integrada para conservar identificadores opacos durante el resumen de compactación.
- `identifierInstructions`: texto personalizado opcional para conservar identificadores que se utiliza cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salidas con formato incorrecto en los resúmenes de protección. Están activadas de forma predeterminada en el modo de protección; establezca `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión del bucle de herramientas. Cuando `enabled: true`, OpenClaw comprueba la presión del contexto después de añadir los resultados de las herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, cancela el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de la comprobación previa existente para truncar los resultados de las herramientas o compactar y reintentar. Funciona con los modos de compactación `default` y `safeguard`. Valor predeterminado: desactivado.
- `postIndexSync`: modo de reindexación de la memoria de sesión posterior a la compactación. Valor predeterminado: `"async"`. Use `"await"` para obtener la máxima actualización, `"async"` para reducir la latencia de compactación o `"off"` solo cuando la sincronización de la memoria de sesión se gestione en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md que se vuelven a insertar después de la compactación. La reinserción se desactiva cuando no se establece este valor o se establece en `[]`. Establecer explícitamente `["Session Startup", "Red Lines"]` activa ese par y conserva el mecanismo alternativo heredado `Every Session`/`Safety`. Active esta opción solo cuando el contexto adicional compense el riesgo de duplicar orientaciones del proyecto que ya se hayan incluido en el resumen de compactación.
- `model`: `provider/model-id` opcional o alias sin calificar de `agents.defaults.models` únicamente para el resumen de compactación. Los alias sin calificar se resuelven antes del envío; los identificadores literales de modelos configurados conservan la prioridad en caso de colisión. Use esta opción cuando la sesión principal deba conservar un modelo, pero los resúmenes de compactación deban ejecutarse en otro; cuando no se establece, la compactación utiliza el modelo principal de la sesión.
- `truncateAfterCompaction`: rota la transcripción de la sesión activa después de la compactación para que los turnos futuros carguen únicamente el resumen y la parte final sin resumir, mientras que la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Valor predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional en bytes (`number` o cadenas como `"20mb"`) que activa la compactación local normal antes de una ejecución cuando el historial de la transcripción supera el umbral. Requiere `truncateAfterCompaction` para que una compactación correcta pueda rotar a una transcripción sucesora más pequeña. Se desactiva cuando no se establece o cuando es `0`.
- `notifyUser`: cuando `true`, envía al usuario avisos breves sobre el mantenimiento del contexto: cuando comienza y termina la compactación (por ejemplo, «Compactando el contexto...» y «Compactación completada»), y cuando se agota el vaciado de memoria previo a la compactación, por lo que la respuesta continúa en un estado degradado (por ejemplo, «El mantenimiento de la memoria ha fallado temporalmente; se continuará con la respuesta.»). Está desactivado de forma predeterminada para mantener estos avisos ocultos.
- `memoryFlush`: turno agéntico silencioso antes de la compactación automática para almacenar recuerdos duraderos. Establezca `model` en un proveedor/modelo exacto, como `ollama/qwen3:8b`, cuando este turno de mantenimiento deba permanecer en un modelo local; la sustitución no hereda la cadena de mecanismos alternativos de la sesión activa. `forceFlushTranscriptBytes` fuerza el vaciado cuando el tamaño de la transcripción alcanza el umbral, incluso si los contadores de tokens están desactualizados. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.runRetries`

Límites de iteraciones de reintento del bucle de ejecución externo para el entorno de ejecución integrado del agente, a fin de evitar bucles de ejecución infinitos durante la recuperación ante fallos. Esta configuración solo se aplica al entorno de ejecución integrado del agente, no a los entornos de ejecución ACP ni CLI.

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
        runRetries: { max: 50 }, // sustituciones opcionales por agente
      },
    ],
  },
}
```

- `base`: número base de iteraciones de reintento de ejecución para el bucle de ejecución externo. Valor predeterminado: `24`.
- `perProfile`: iteraciones adicionales de reintento de ejecución concedidas por cada perfil alternativo candidato. Valor predeterminado: `8`.
- `min`: límite mínimo absoluto de iteraciones de reintento de ejecución. Valor predeterminado: `32`.
- `max`: límite máximo absoluto de iteraciones de reintento de ejecución para evitar ejecuciones descontroladas. Valor predeterminado: `160`.

### `agents.defaults.contextPruning`

Elimina los **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en el disco. Está desactivado de forma predeterminada; establezca `mode: "cache-ttl"` para activarlo.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (predeterminado) | cache-ttl
        ttl: "1h", // duración (ms/s/m/h), unidad predeterminada: minutos; valor predeterminado: 5m
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

- `mode: "cache-ttl"` activa las pasadas de depuración.
- `ttl` controla la frecuencia con la que puede volver a ejecutarse la depuración (después del último acceso a la caché). Valor predeterminado: `5m`.
- La depuración primero recorta parcialmente los resultados de herramientas demasiado grandes y, después, elimina por completo los resultados de herramientas más antiguos si es necesario.
- `softTrimRatio` y `hardClearRatio` aceptan valores desde `0.0` hasta `1.0`; la validación de la configuración rechaza los valores fuera de ese intervalo.

El **recorte parcial** conserva el principio y el final e inserta `...` en el centro.

La **eliminación completa** sustituye todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imágenes nunca se recortan ni eliminan.
- Las proporciones se basan en caracteres (de forma aproximada), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la depuración.

</Accordion>

Consulte [Depuración de sesiones](/es/concepts/session-pruning) para obtener detalles sobre el comportamiento.

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

- Los canales distintos de Telegram requieren `*.streaming.block.enabled: true` explícito para activar las respuestas por bloques. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite respuestas por bloques a menos que `channels.qqbot.streaming.mode` sea `"off"`.
- Sustituciones por canal: `channels.<channel>.streaming.block.coalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack usan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Valor predeterminado: `off`. `natural` = 800-2500ms. `custom` utiliza `minMs`/`maxMs` (recurre al intervalo natural para cualquier límite no establecido). Sustitución por agente: `agents.list[].humanDelay`.

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

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Valor predeterminado de `typingIntervalSeconds`: `6`.
- Sustituciones por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente integrado. Consulte [Aislamiento](/es/gateway/sandboxing) para obtener la guía completa.

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
          // También se admiten SecretRefs y contenido en línea:
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

Los valores predeterminados mostrados arriba (`off`/`docker`/`agent`/`none`/imagen `bookworm-slim``none`/red/etc.) son los valores predeterminados reales de OpenClaw, no meros valores ilustrativos.

<Accordion title="Detalles del entorno aislado">

**Backend:**

- `docker`: entorno de ejecución Docker local (predeterminado)
- `ssh`: entorno de ejecución remoto genérico basado en SSH
- `openshell`: entorno de ejecución OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del entorno de ejecución se traslada a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con el formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta utilizada para los espacios de trabajo de cada ámbito (predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes que se pasan a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido en línea o SecretRefs que OpenClaw materializa en archivos temporales durante la ejecución
- `strictHostKeyChecking` / `updateHostKeys`: opciones de la política de claves de host de OpenSSH (ambas tienen como valor predeterminado `true`)

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del entorno de ejecución de secretos antes de que se inicie la sesión del entorno aislado

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o volver a crearlo
- después mantiene como canónico el espacio de trabajo SSH remoto
- enruta `exec`, las herramientas de archivos y las rutas multimedia mediante SSH
- no sincroniza automáticamente los cambios remotos con el host
- no admite contenedores de navegador del entorno aislado

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo del entorno aislado para cada ámbito bajo `~/.openclaw/sandboxes` (predeterminado)
- `ro`: espacio de trabajo del entorno aislado en `/workspace`, con el espacio de trabajo del agente montado como de solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado con acceso de lectura y escritura en `/workspace`

**Ámbito:**

- `session`: contenedor y espacio de trabajo por sesión
- `agent`: un contenedor y un espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (predeterminado) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional de la política de OpenShell
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

- `mirror`: inicializa el entorno remoto desde el local antes de ejecutar y vuelve a sincronizar después de la ejecución; el espacio de trabajo local permanece como canónico
- `remote`: inicializa el entorno remoto una vez al crear el entorno aislado y después mantiene como canónico el espacio de trabajo remoto

En el modo `remote`, las modificaciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte se realiza mediante SSH hacia el entorno aislado de OpenShell, pero el plugin controla el ciclo de vida del entorno aislado y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Requiere acceso saliente a la red, una raíz con permisos de escritura y el usuario raíz.

**Los contenedores usan `network: "none"` de forma predeterminada**; establézcalo en `"bridge"` (o en una red puente personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada, salvo que se establezca explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergencia).
Los turnos del servidor de aplicaciones Codex en un entorno aislado activo de OpenClaw utilizan esta misma configuración de salida para el acceso a la red de su modo de código nativo.

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`, valor predeterminado `false`): Chromium + CDP en un contenedor. La URL de noVNC se inserta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador mediante noVNC utiliza autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) impide que las sesiones en entornos aislados se dirijan al navegador del host.
- `network` tiene como valor predeterminado `openclaw-sandbox-browser` (red puente dedicada). Establézcalo en `bridge` solo cuando se desee explícitamente conectividad global mediante el puente. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada de CDP en el límite del contenedor a un intervalo CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del navegador del entorno aislado. Cuando se establece (incluido `[]`), sustituye a `docker.binds` para el contenedor del navegador.
- Chromium siempre se inicia con `--no-sandbox --disable-setuid-sandbox` en el contenedor del navegador del entorno aislado (los contenedores no disponen de las primitivas del kernel que necesita el propio entorno aislado de Chrome); no existe ninguna opción de configuración para cambiarlo.
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
  - `--renderer-process-limit=2` de forma predeterminada; se cambia con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establezca `0` para utilizar el
    límite de procesos predeterminado de Chromium.
  - `--headless=new` solo cuando `headless` está habilitado.
  - Los valores predeterminados corresponden a la configuración base de la imagen del contenedor; utilice una imagen de navegador personalizada con un
    punto de entrada personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` solo están disponibles con Docker.

Compile las imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # imagen principal del entorno aislado
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

Para instalaciones con npm sin un checkout del código fuente, consulte [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

### `agents.list` (sustituciones por agente)

Utilice `agents.list[].tts` para asignar a un agente su propio proveedor de TTS, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina de forma profunda sobre la configuración global
`messages.tts`, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras cada
agente sustituye únicamente los campos de voz o proveedor que necesita. La sustitución del agente activo
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
        name: "Agente principal",
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
- `model`: la forma de cadena establece un modelo principal estricto por agente sin modelo alternativo; la forma de objeto `{ primary }` también es estricta, salvo que se añada `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar modelos alternativos para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos Cron que solo anulan `primary` siguen heredando los modelos alternativos predeterminados, salvo que se establezca `fallbacks: []`.
- `utilityModel`: anulación opcional por agente para tareas internas breves, como los títulos generados de sesiones e hilos. Si no está disponible, se recurre a `agents.defaults.utilityModel`, luego al modelo pequeño predeterminado declarado por el proveedor principal y, por último, al modelo principal de este agente. Una cadena vacía deshabilita el enrutamiento de utilidad para este agente.
- `params`: parámetros de flujo por agente que se combinan sobre la entrada del modelo seleccionado en `agents.defaults.models`. Use esta opción para anulaciones específicas del agente, como `cacheRetention`, `temperature` o `maxTokens`, sin duplicar todo el catálogo de modelos.
- `tts`: anulaciones opcionales de texto a voz por agente. El bloque se combina de forma profunda sobre `messages.tts`, por lo que las credenciales compartidas del proveedor y la política de modelos alternativos deben mantenerse en `messages.tts`, y aquí solo deben establecerse valores específicos de la personalidad, como el proveedor, la voz, el modelo, el estilo o el modo automático.
- `skills`: lista de Skills permitidas opcional por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está establecido; una lista explícita sustituye los valores predeterminados en lugar de combinarlos, y `[]` significa que no hay Skills.
- `thinkingDefault`: nivel de pensamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Anula `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna anulación por mensaje o sesión. El perfil del proveedor/modelo seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el pensamiento dinámico gestionado por el proveedor (`thinkingLevel` se omite en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Anula `agents.defaults.reasoningDefault` para este agente cuando no se establece ninguna anulación del razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional del modo rápido por agente (`"auto" | true | false`). Se aplica cuando no se establece ninguna anulación del modo rápido por mensaje o sesión.
- `models`: anulaciones opcionales por agente del catálogo de modelos o del entorno de ejecución, indexadas mediante ids completos de `provider/model`. Use `models["provider/model"].agentRuntime` para excepciones del entorno de ejecución por agente.
- `runtime`: descriptor opcional del entorno de ejecución por agente. Use `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones del arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen locales `identity.avatar` con rutas relativas al espacio de trabajo están limitados a 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban con respecto al límite de tamaño de los archivos locales.
- `identity` deriva los valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de ids de agentes configurados permitidos para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). Incluya el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se haya eliminado son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecute `openclaw doctor --fix` para limpiarlas, o añada una entrada mínima `agents.list[]` si ese destino debe seguir pudiendo iniciarse mientras hereda los valores predeterminados.
- Protección de herencia del entorno aislado: si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos que se ejecutarían sin aislamiento.
- `subagents.requireAgentId`: cuando es verdadero, bloquea las llamadas `sessions_spawn` que omitan `agentId` (obliga a seleccionar explícitamente el perfil; valor predeterminado: falso).
- `subagents.maxConcurrent`: número máximo de ejecuciones simultáneas de agentes secundarios en la ejecución de subagentes. Valor predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: número máximo de agentes secundarios activos que puede iniciar una sola sesión de agente. Valor predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para iniciar subagentes (`1`-`5`). Valor predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: antigüedad tras la cual se archiva el estado completado de un subagente. Valor predeterminado: `60`.

---

## Enrutamiento multiagente

Ejecute varios agentes aislados dentro de un solo Gateway. Consulte [Multiagente](/es/concepts/multi-agent).

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

- `type` (opcional): `route` para el enrutamiento normal (si falta el tipo, el valor predeterminado es route), `acp` para vinculaciones persistentes de conversaciones ACP.
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

Para las entradas `type: "acp"`, OpenClaw resuelve mediante la identidad exacta de la conversación (`match.channel` + cuenta + `match.peer.id`) y no utiliza el orden de niveles de vinculación de rutas anterior.

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
      maxDiskBytes: "500mb", // presupuesto máximo opcional
      highWaterBytes: "400mb", // objetivo de limpieza opcional
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desenfoque automático predeterminado tras inactividad, en horas (`0` lo deshabilita)
      maxAgeHours: 0, // antigüedad máxima absoluta predeterminada, en horas (`0` la deshabilita)
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
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro del contexto de un canal.
  - `global`: todos los participantes en el contexto de un canal comparten una única sesión (usar solo cuando se pretenda compartir el contexto).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aislar por id. de remitente entre canales.
  - `per-channel-peer`: aislar por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aislar por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna identificadores canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento como `/dock_discord` usan la misma asignación para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulte [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `daily` restablece a las `atHour` de la hora local; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, prevalece el que venza primero. La vigencia del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras de eventos del sistema o en segundo plano, como Heartbeat, activaciones de Cron, notificaciones de ejecución y mantenimiento del Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias o por inactividad.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). El valor heredado `dm` se acepta como alias de `direct`.
- **`resetByChannel`**: anulaciones de restablecimiento por canal, cuyas claves son el id. del proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta prevalece por completo sobre `resetByType`/`reset` para esa sesión. Usar solo cuando un canal necesite un comportamiento de restablecimiento distinto de la política por tipo.
- **`mainKey`**: campo heredado. El entorno de ejecución siempre usa `"main"` para el contenedor principal de chats directos.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta entre agentes durante intercambios de agente a agente (entero, intervalo: `0`-`20`, predeterminado: `5`). `0` desactiva el encadenamiento de ida y vuelta.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con el alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Prevalece la primera denegación.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (valor predeterminado: `30d`).
  - `maxEntries`: número máximo de entradas de sesión de SQLite (valor predeterminado: `500`). Las escrituras del entorno de ejecución realizan una limpieza por lotes con un pequeño margen por encima del límite para topes de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.
  - Las sesiones de sondeo de ejecuciones de modelos del Gateway de corta duración usan una retención fija de `24h`, pero la limpieza depende de la presión: solo elimina filas obsoletas de sondeos estrictos de ejecuciones de modelos cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Solo son aptas las claves explícitas de sondeo estricto que coincidan con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilos, Cron, enlaces, Heartbeat, ACP y subagentes no heredan esta retención de 24 h. Cuando se ejecuta la limpieza de ejecuciones de modelos, se realiza antes de la limpieza más amplia de entradas obsoletas de `pruneAfter` y del límite de `maxEntries`.
  - El valor heredado `rotateBytes` se rechaza en el esquema actual; `openclaw doctor --fix` lo elimina de configuraciones anteriores.
  - `resetArchiveRetention`: retención de archivos de transcripciones `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establecer en `false` para desactivarla.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En el modo `warn`, registra advertencias; en el modo `enforce`, elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional tras la limpieza del presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`writeLock`**: controles de bloqueo de escritura de transcripciones de sesiones. Ajustar solo cuando tareas legítimas de preparación de transcripciones, limpieza, Compaction o replicación compitan durante más tiempo que las políticas predeterminadas.
  - `acquireTimeoutMs`: milisegundos que se espera al adquirir un bloqueo antes de informar que la sesión está ocupada. Valor predeterminado: `60000`; anulación mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: milisegundos antes de que un bloqueo existente se considere obsoleto y se recupere. Valor predeterminado: `1800000`; anulación mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: milisegundos que un bloqueo mantenido dentro del proceso puede permanecer retenido antes de que el supervisor lo libere. Valor predeterminado: `300000`; anulación mediante la variable de entorno `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesiones vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: pérdida automática del foco por inactividad predeterminada, en horas (`0` la desactiva; los proveedores pueden anularla)
  - `maxAgeHours`: antigüedad máxima absoluta predeterminada, en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: condición predeterminada para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. El valor predeterminado es `true` cuando las vinculaciones de hilos están activadas; los proveedores/cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto predeterminado de subagente nativo para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

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
      debounceMs: 2000, // 0 desactiva
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

- El valor predeterminado es `identity.emoji` del agente activo; de lo contrario, `"👀"`. Establecer `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → identidad alternativa.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all` o `off`/`none` (desactiva por completo las reacciones de confirmación).
- `removeAckAfterReply`: elimina la confirmación tras responder en canales compatibles con reacciones, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: activa las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Discord, si no se establece, las reacciones de estado permanecen activadas cuando las reacciones de confirmación están activas.
  En Slack, Signal, Telegram y WhatsApp, se debe establecer explícitamente en `true` para activar las reacciones de estado del ciclo de vida.
  Slack usa de forma predeterminada su estado nativo de hilo del asistente y mensajes rotativos de carga para indicar el progreso, mientras mantiene estática la reacción de confirmación configurada.
- `messages.statusReactions.emojis`: anula las claves de emojis del ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` y `stallHard`.
  Telegram solo permite un conjunto fijo de reacciones, por lo que los emojis configurados que no sean compatibles recurren
  a la variante de estado compatible más cercana para ese chat.

### Cola

- `mode`: estrategia de cola para los mensajes entrantes que llegan mientras está activa una ejecución de sesión. Valor predeterminado: `"steer"`.
  - `steer`: inserta la nueva solicitud en la ejecución activa.
  - `followup`: ejecuta la nueva solicitud cuando finaliza la ejecución activa.
  - `collect`: agrupa los mensajes compatibles y los ejecuta juntos más adelante.
  - `interrupt`: cancela la ejecución activa antes de iniciar la solicitud más reciente.
- `debounceMs`: demora antes de enviar un mensaje en cola/dirigido. Valor predeterminado: `500`.
- `cap`: número máximo de mensajes en cola antes de aplicar la política de descarte. Valor predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas, pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: anulaciones de `mode` por canal, cuyas claves son los identificadores de proveedor.
- `debounceMsByChannel`: anulaciones de `debounceMs` por canal, cuyas claves son los identificadores de proveedor.

### Antirrebote de entrada

Agrupa mensajes rápidos que solo contienen texto y proceden del mismo remitente en un único turno del agente. Los archivos multimedia/adjuntos fuerzan el envío inmediato. Los comandos de control omiten el antirrebote. Valor predeterminado de `debounceMs`: `2000`.

### Otras claves de mensajes

- `messages.messagePrefix`: texto de prefijo añadido a los mensajes entrantes del usuario antes de que lleguen al entorno de ejecución del agente. Usar con moderación para marcadores de contexto del canal.
- `messages.visibleReplies`: controla las respuestas visibles al origen en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para producir una salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada de pie de página de `/usage` y modo predeterminado de uso por respuesta (`off | tokens | full`, además del alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: activadores de menciones en mensajes grupales y tamaño de la ventana del historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias de errores de herramientas `⚠️` que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede volver a intentarlo). Valor predeterminado: `false`.

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

- `auto` controla el modo automático de TTS predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` requiere activación explícita.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY` como alternativa.
- Los proveedores de voz incluidos pertenecen a plugins. Si se establece `plugins.allow`, incluya cada plugin de proveedor de TTS que desee utilizar; por ejemplo, `microsoft` para Edge TTS. El identificador de proveedor heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` anula el endpoint de TTS de OpenAI. El orden de resolución es la configuración, después `OPENAI_TTS_BASE_URL` y, por último, `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor de TTS compatible con OpenAI y flexibiliza la validación del modelo y de la voz.

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

- `talk.provider` debe coincidir con una clave de `talk.providers` cuando se configuran varios proveedores de Conversación.
- Las claves planas heredadas de Conversación (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) solo existen por compatibilidad. Ejecute `openclaw doctor --fix` para reescribir la configuración persistida en `talk.providers.<provider>`.
- Los identificadores de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` como alternativa (comportamiento del cliente de Conversación de macOS).
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` solo se aplica cuando no hay configurada ninguna clave de API de Conversación.
- `providers.*.voiceAliases` permite que las directivas de Conversación utilicen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face que utiliza el asistente local de MLX en macOS. Si se omite, macOS utiliza `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento de la ejecución completa del agente de OpenClaw que sustenta las llamadas `openclaw_agent_consult` en tiempo real de Conversación de la interfaz de control. Déjelo sin establecer para conservar el comportamiento normal de la sesión y del modelo.
- `consultFastMode` establece una anulación puntual del modo rápido para las consultas en tiempo real de Conversación de la interfaz de control sin cambiar la configuración habitual del modo rápido de la sesión.
- `speechLocale` establece el identificador de configuración regional BCP 47 que utiliza el reconocimiento de voz de Conversación en iOS/macOS. Déjelo sin establecer para utilizar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Conversación después de que el usuario guarde silencio antes de enviar la transcripción. Si no se establece, se conserva el intervalo de pausa predeterminado de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones del sistema destinadas al proveedor al prompt en tiempo real integrado de OpenClaw, de modo que se pueda configurar el estilo de voz sin perder las indicaciones predeterminadas de `openclaw_agent_consult`.
- `realtime.vadThreshold` establece el umbral de actividad de voz del proveedor desde `0` (mayor sensibilidad) hasta `1` (menor sensibilidad). Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.silenceDurationMs` establece el intervalo de silencio, expresado como un número entero positivo, antes de que el proveedor confirme un turno del usuario en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.prefixPaddingMs` establece la cantidad de audio, expresada como un número entero no negativo, que se conserva antes del inicio de la voz detectada. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.reasoningEffort` establece el nivel de razonamiento específico del proveedor para las sesiones en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.consultRouting`: `"provider-direct"` (valor predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real genera una transcripción final del usuario sin `openclaw_agent_consult`. En su lugar, `"force-agent-consult"` dirige la solicitud finalizada a través de OpenClaw.

---

## Temas relacionados

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas habituales y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
