---
read_when:
    - Ajuste de los valores predeterminados del agente (modelos, razonamiento, espacio de trabajo, Heartbeat, contenido multimedia, Skills)
    - Configuración del enrutamiento y las vinculaciones multiagente
    - Ajuste del comportamiento de las sesiones, la entrega de mensajes y el modo de conversación
summary: Valores predeterminados del agente, enrutamiento multiagente y configuración de sesiones, mensajes y conversación
title: Configuración — agentes
x-i18n:
    generated_at: "2026-07-22T13:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 790dcdaf7c891439f24ba2fab9ab6f946c155a0ee24b0007ac9a04ea8dd333c4
    source_path: gateway/config-agents.md
    workflow: 16
---

Claves de configuración con ámbito de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, el entorno de ejecución del Gateway y otras
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

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no se establece, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos de Skills predeterminada y opcional para los agentes que no establezcan
`agents.entries.*.skills`.

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
- Omita `agents.entries.*.skills` para heredar los valores predeterminados.
- Establezca `agents.entries.*.skills: []` para no permitir ninguna Skill.
- Una lista `agents.entries.*.skills` no vacía constituye el conjunto definitivo para ese agente; no
  se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Deshabilita la creación automática de archivos de arranque del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

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
- `"never"`: deshabilita la inyección del arranque del espacio de trabajo y de los archivos de contexto en cada turno. Utilícelo únicamente para agentes que gestionen por completo el ciclo de vida de su prompt (motores de contexto personalizados, entornos de ejecución nativos que construyan su propio contexto o flujos de trabajo especializados sin arranque). Los turnos de Heartbeat y de recuperación de Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Anulación por agente: `agents.entries.*.contextInjection`. Los valores omitidos heredan
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Número máximo de caracteres por archivo de arranque del espacio de trabajo antes del truncamiento. Valor predeterminado: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Anulación por agente: `agents.entries.*.bootstrapMaxChars`. Los valores omitidos heredan
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Número máximo total de caracteres inyectados entre todos los archivos de arranque del espacio de trabajo. Valor predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Anulación por agente: `agents.entries.*.bootstrapTotalMaxChars`. Los valores omitidos
heredan `agents.defaults.bootstrapTotalMaxChars`.

### Anulaciones del perfil de arranque por agente

Utilice anulaciones del perfil de arranque por agente cuando un agente necesite un comportamiento de
inyección del prompt diferente al de los valores predeterminados compartidos. Los campos omitidos heredan de
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

- `"off"`: nunca inyecta el texto del aviso de truncamiento en el prompt del sistema.
- `"once"`: inyecta un aviso conciso una vez por cada firma de truncamiento única.
- `"always"`: inyecta un aviso conciso en cada ejecución cuando existe truncamiento (recomendado).

Los recuentos detallados sin procesar/inyectados y los campos de ajuste de configuración permanecen en diagnósticos como
informes y registros de contexto/estado; el contexto rutinario del usuario y del entorno de ejecución de WebChat solo
recibe el aviso conciso de recuperación.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propiedad de los presupuestos de contexto

OpenClaw tiene varios presupuestos de prompts/contexto de gran volumen, que se
dividen intencionalmente por subsistema en lugar de pasar todos por un único
control genérico.

| Presupuesto                                                    | Cubre                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Inyección normal del arranque del espacio de trabajo                                                                                                            |
| `agents.defaults.startupContext.*`                             | Preámbulo único de ejecución del modelo al restablecer/iniciar, incluidos los archivos `memory/*.md` diarios recientes. Los comandos de chat sin argumentos `/new` y `/reset` se confirman sin invocar el modelo |
| `skills.limits.*`                                              | La lista compacta de Skills inyectada en el prompt del sistema                                                                                                  |
| `agents.defaults.contextLimits.*`                              | Extractos acotados del entorno de ejecución y bloques inyectados que pertenecen al entorno de ejecución                                                        |
| `memory.qmd.limits.*`                                          | Tamaño del fragmento indexado de búsqueda en memoria y de la inyección                                                                                          |

Anulaciones correspondientes por agente:

- `agents.entries.*.skillsLimits.maxSkillsPromptChars`
- `agents.entries.*.contextInjection`
- `agents.entries.*.bootstrapMaxChars`
- `agents.entries.*.bootstrapTotalMaxChars`
- `agents.entries.*.contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preámbulo de inicio del primer turno que se inyecta en las ejecuciones del modelo al restablecer/iniciar.
Los comandos de chat sin argumentos `/new` y `/reset` confirman el restablecimiento sin invocar
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

- `memoryGetMaxChars`: límite predeterminado del extracto `memory_get` antes de que se añadan
  los metadatos de truncamiento y el aviso de continuación.
- `memoryGetDefaultLines`: ventana predeterminada de líneas de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: límite máximo avanzado para los resultados de herramientas en vivo, utilizado en los resultados
  persistidos y la recuperación de desbordamientos. Déjelo sin establecer para usar el límite automático del contexto del modelo:
  `16000` caracteres por debajo de 100K tokens, `32000` caracteres con 100K+ tokens y `64000`
  caracteres con 200K+ tokens. Se aceptan valores explícitos de hasta `1000000` para
  modelos de contexto largo, pero el límite efectivo sigue restringido a aproximadamente el 30 % de
  la ventana de contexto del modelo. `openclaw doctor --deep` muestra el límite efectivo
  y doctor solo advierte cuando una anulación explícita está obsoleta o no tiene efecto.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md utilizado durante la inyección de
  actualización posterior a Compaction.

#### `agents.entries.*.contextLimits`

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

Límite global para la lista compacta de Skills inyectada en el prompt del sistema. Esto
no afecta a la lectura bajo demanda de archivos `SKILL.md`.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.entries.*.skillsLimits.maxSkillsPromptChars`

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

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de las solicitudes en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencia de compresión/detalle de la herramienta de imágenes para imágenes cargadas desde rutas de archivos, URL y referencias multimedia.
Valor predeterminado: `auto`.

OpenClaw adapta la escala de redimensionamiento al modelo de imágenes seleccionado. Por ejemplo, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL y los modelos de visión Llama 4 alojados pueden usar imágenes más grandes que las rutas de visión de alto detalle anteriores/predeterminadas, mientras que los turnos con varias imágenes se comprimen de forma más agresiva en el modo `auto` para controlar el coste de tokens y latencia.

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

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Si no se especifica, se utiliza la zona horaria del host.

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
      mediaModels: {
        image: {
          primary: "openai/gpt-image-2",
          fallbacks: ["google/gemini-3.1-flash-image"],
        },
        video: {
          primary: "qwen/wan2.6-t2v",
          fallbacks: ["qwen/wan2.6-i2v"],
        },
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parámetros globales predeterminados del proveedor
      pdfMaxMb: 10,
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
- `utilityModel`: referencia o alias `provider/model` opcional para tareas internas breves. Actualmente se utiliza para generar títulos de sesiones de la interfaz de control, títulos de temas de mensajes directos de Telegram, títulos automáticos de hilos de Discord y la [narración de borradores de progreso](/es/concepts/progress-drafts#narrated-status). Cuando no se establece, OpenClaw obtiene el modelo pequeño predeterminado declarado por el proveedor principal, si existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, las tareas de títulos utilizan el modelo principal del agente y la narración permanece desactivada. Si un modelo auxiliar distinto no puede preparar o completar un título generado, OpenClaw vuelve a intentar generar ese título una vez con el modelo principal. Para los títulos del panel, la obtención automática del modelo auxiliar y la conmutación por error habitual utilizan el proveedor y el perfil de autenticación efectivos de la sesión; un modelo auxiliar explícito conserva su proveedor y autenticación configurados. Establezca `utilityModel: ""` para omitir la ruta auxiliar alternativa; la generación de títulos del panel continúa directamente con el modelo habitual de la sesión. `agents.entries.*.utilityModel` sustituye el valor predeterminado, y una anulación de modelo específica de la operación tiene prioridad sobre ambos. Las tareas auxiliares realizan llamadas independientes al modelo y envían contenido específico de la tarea al proveedor del modelo seleccionado. La generación de títulos del panel envía como máximo los primeros 1.000 caracteres del primer mensaje que no sea un comando; la narración envía la solicitud entrante junto con resúmenes compactos y censurados de las herramientas. Elija un proveedor que se ajuste a sus requisitos de coste y tratamiento de datos.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La ruta de la herramienta `image` lo utiliza como configuración del modelo de visión cuando el modelo activo no puede aceptar imágenes. En su lugar, los modelos con visión nativa reciben directamente los bytes de las imágenes cargadas.
  - También se utiliza como ruta de conmutación por error cuando el modelo seleccionado o predeterminado no puede aceptar entradas de imagen.
  - Es preferible utilizar referencias `provider/model` explícitas. Se aceptan identificadores sin calificar por compatibilidad; si uno coincide de forma única con una entrada configurada que admita imágenes en `models.providers.*.models`, OpenClaw lo califica con ese proveedor. Las coincidencias configuradas ambiguas requieren un prefijo de proveedor explícito.
- `mediaModels.image`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de imágenes y en cualquier futura superficie de herramienta o plugin que genere imágenes.
  - Valores habituales: `google/gemini-3.1-flash-image` para la generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images o `openai/gpt-image-1.5` para la salida PNG/WebP de OpenAI con fondo transparente.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación correspondiente del proveedor (por ejemplo, `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, y `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, a continuación, los demás proveedores de generación de imágenes registrados en orden de identificador de proveedor.
- `mediaModels.music`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de música y en la herramienta integrada `music_generate`.
  - Valores habituales: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, a continuación, los demás proveedores de generación de música registrados en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación o clave de API correspondiente del proveedor.
- `mediaModels.video`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Se utiliza en la capacidad compartida de generación de vídeo y en la herramienta integrada `video_generate`.
  - Valores habituales: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y, a continuación, los demás proveedores de generación de vídeo registrados en orden de identificador de proveedor.
  - Si selecciona directamente un proveedor o modelo, configure también la autenticación o clave de API correspondiente del proveedor.
  - El plugin oficial de generación de vídeo de Qwen admite hasta 1 vídeo de salida, 1 imagen de entrada, 4 vídeos de entrada, 10 segundos de duración y las opciones de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La herramienta `pdf` lo utiliza para el enrutamiento de modelos.
  - Si se omite, la herramienta de PDF recurre a `imageModel` y, después, al modelo resuelto de la sesión o predeterminado.
- `pdfMaxMb`: límite de tamaño de PDF predeterminado para la herramienta `pdf` cuando no se pasa `maxBytesMb` en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas que tiene en cuenta el modo de extracción alternativo de la herramienta `pdf`.
- `verboseDefault`: nivel de detalle predeterminado para los agentes. Valores: `"off"`, `"on"`, `"full"`. Valor predeterminado: `"off"`.
- `toolProgressDetail`: modo de detalle para los resúmenes de la herramienta `/verbose` y las líneas de herramientas de los borradores de progreso. Valores: `"explain"` (predeterminado, etiquetas humanas compactas) o `"raw"` (añade el comando o detalle sin procesar cuando está disponible). El valor `agents.entries.*.toolProgressDetail` de cada agente sustituye este valor predeterminado.
- `reasoningDefault`: visibilidad predeterminada del razonamiento para los agentes. Valores: `"off"`, `"on"`, `"stream"`. El valor `agents.entries.*.reasoningDefault` de cada agente sustituye este valor predeterminado. Los valores predeterminados de razonamiento configurados solo se aplican a propietarios, remitentes autorizados o contextos de administrador-operador del Gateway cuando no se ha establecido una anulación de razonamiento por mensaje o sesión.
- `elevatedDefault`: nivel predeterminado de salida elevada para los agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Valor predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo, `openai/gpt-5.6-sol` para el acceso OAuth de Codex). Si se omite el proveedor, OpenClaw prueba primero un alias, después una coincidencia única entre los proveedores configurados para ese identificador exacto de modelo y, solo entonces, recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, por lo que se recomienda utilizar un `provider/model` explícito). Si ese proveedor ya no ofrece el modelo predeterminado configurado, OpenClaw recurre al primer proveedor y modelo configurados en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: alias configurados y ajustes por modelo. Cada entrada puede incluir `alias` (acceso directo) y `params` (específico del proveedor, por ejemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, enrutamiento `provider` de OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`). Añadir entradas no restringe las anulaciones de modelos.
  - Utilice entradas `provider/*` como `"openai/*": {}` o `"vllm/*": {}` para mostrar todos los modelos detectados de los proveedores seleccionados sin enumerar manualmente cada identificador de modelo.
  - Añada `agentRuntime` a una entrada `provider/*` cuando todos los modelos detectados dinámicamente de ese proveedor deban utilizar el mismo entorno de ejecución. La política exacta de entorno de ejecución `provider/model` sigue teniendo prioridad sobre el comodín.
  - Ediciones seguras de metadatos: utilice `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza las sustituciones que eliminarían entradas existentes, a menos que se pase `--replace`.
- `modelPolicy.allow`: lista explícita de anulaciones permitidas. Acepta alias, referencias `provider/model` exactas y comodines de prefijo finales como `openai/*` o `clawrouter/anthropic/*`. Omítala o utilice `[]` para permitir cualquier modelo. `agents.entries.*.modelPolicy.allow` sustituye la política predeterminada de ese agente; una lista vacía explícita permite que ese agente use cualquier modelo.
  - Los flujos de configuración e incorporación específicos del proveedor combinan en este mapa los modelos del proveedor seleccionado y conservan los proveedores no relacionados ya configurados.
  - Para los modelos directos de OpenAI Responses, Compaction en el servidor se activa automáticamente. Utilice `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para sustituir el umbral. Consulte [Compaction de OpenAI en el servidor](/es/providers/openai#advanced-configuration).
- `params`: parámetros predeterminados globales del proveedor que se aplican a todos los modelos. Se establecen en `agents.defaults.params` (por ejemplo, `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) se sustituye por `agents.defaults.models["provider/model"].params` (por modelo) y, después, `agents.entries.*.params` (identificador de agente coincidente) sustituye los valores por clave. Consulte [Almacenamiento en caché de prompts](/es/reference/prompt-caching) para obtener más información.
- `models.providers.openrouter.params.provider`: política predeterminada de enrutamiento de proveedores para todo OpenRouter. OpenClaw la reenvía al objeto `provider` de la solicitud de OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo y los parámetros del agente sustituyen sus valores por clave. Consulte [Enrutamiento de proveedores de OpenRouter](/es/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzado transferido directamente que se combina con los cuerpos de las solicitudes `api: "openai-completions"` para proxies compatibles con OpenAI. Si entra en conflicto con claves de solicitud generadas, el cuerpo adicional tiene prioridad; posteriormente, las rutas de finalización no nativas siguen eliminando `store`, que es exclusivo de OpenAI.
- `params.chat_template_kwargs`: argumentos de plantilla de chat compatibles con vLLM/OpenAI que se combinan con los cuerpos de solicitud `api: "openai-completions"` de nivel superior. Para `vllm/nemotron-3-*` con el pensamiento desactivado, el plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true`; los valores explícitos de `chat_template_kwargs` sustituyen los valores predeterminados generados, y `extra_body.chat_template_kwargs` sigue teniendo la prioridad final. Los modelos de pensamiento Qwen y Nemotron de vLLM configurados ofrecen opciones binarias de `/think` (`off`, `on`) en lugar de la escala de esfuerzo de varios niveles.
- `compat.thinkingFormat`: estilo de carga útil de pensamiento compatible con OpenAI. Utilice `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` de nivel superior al estilo de Qwen o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en backends de la familia Qwen que admitan argumentos de plantilla de chat en el nivel de la solicitud, como vLLM. OpenClaw asigna el pensamiento desactivado a `false` y el pensamiento activado a `true`; además, los modelos Qwen de vLLM configurados ofrecen opciones binarias de `/think` para estos formatos.
- `compat.supportedReasoningEfforts`: lista de esfuerzos de razonamiento compatibles con OpenAI por modelo. Incluya `"xhigh"` para puntos de conexión personalizados que realmente lo acepten; OpenClaw muestra entonces `/think xhigh` en los menús de comandos, las filas de sesiones del Gateway, la validación de modificaciones de sesiones, la validación de la CLI del agente y la validación de `llm-task` para ese proveedor y modelo configurados. Utilice `compat.reasoningEffortMap` cuando el backend requiera un valor específico del proveedor para un nivel canónico.
- `params.preserveThinking`: activación opcional exclusiva de Z.AI para conservar el pensamiento. Cuando está activada y el pensamiento está habilitado, OpenClaw envía `thinking.clear_thinking: false` y reproduce los `reasoning_content` anteriores; consulte [Pensamiento y conservación del pensamiento de Z.AI](/es/providers/zai#advanced-configuration).
- `localService`: gestor de procesos opcional a nivel de proveedor para servidores de modelos locales o autoalojados. Cuando el modelo seleccionado pertenece a ese proveedor, OpenClaw comprueba `healthUrl` (o `baseUrl + "/models"`); si el endpoint no está disponible, inicia `command` con `args`, espera hasta `readyTimeoutMs` y, a continuación, envía la solicitud del modelo. `command` debe ser una ruta absoluta. `idleStopMs: 0` mantiene el proceso activo hasta que OpenClaw finaliza; un valor positivo detiene el proceso iniciado por OpenClaw tras esa cantidad de milisegundos de inactividad. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- La política de ejecución corresponde a los proveedores o modelos, no a `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para reglas aplicables a todo el proveedor o `agents.defaults.models["provider/model"].agentRuntime` / `agents.entries.*.models["provider/model"].agentRuntime` para reglas específicas del modelo. Un prefijo de proveedor/modelo por sí solo nunca selecciona un harness. Si el entorno de ejecución no está definido o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna anulación de solicitud definida por el usuario. Consulte [Entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).
- Los escritores de configuración que modifican estos campos (por ejemplo, `/models set`, `/models set-image` y los comandos para añadir o eliminar alternativas) guardan la forma de objeto canónica y conservan las listas de alternativas existentes cuando es posible.
- `maxConcurrent`: número máximo de ejecuciones de agentes en paralelo entre sesiones (cada sesión sigue procesándose en serie). Valor predeterminado: `4`.

### Política de ejecución

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

- `id`: `"auto"`, `"openclaw"`, un id de entorno de Plugin registrado o un alias de backend de CLI compatible. El Plugin de Codex incluido registra `codex`; el Plugin de Anthropic incluido proporciona el backend de CLI `claude-cli`.
- `id: "auto"` permite que los entornos de Plugin registrados asuman las rutas efectivas que declaren o satisfagan de otro modo su contrato de compatibilidad, y utiliza OpenClaw cuando ningún entorno coincide. Un entorno de ejecución de Plugin explícito, como `id: "codex"`, requiere ese entorno y una ruta efectiva compatible; aplica un cierre por error si alguno no está disponible o si la ejecución falla.
- `id: "pi"` solo se acepta como alias obsoleto de `openclaw` para conservar las configuraciones publicadas de v2026.5.22 y versiones anteriores. Las configuraciones nuevas deben usar `openclaw`.
- La precedencia del entorno de ejecución es: primero, la política exacta del modelo (`agents.entries.*.models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`); después, `agents.entries.*` / `agents.defaults.models["provider/*"]`; y, por último, la política de todo el proveedor en `models.providers.<provider>.agentRuntime`.
- Las claves del entorno de ejecución de todo el agente son heredadas. La selección del entorno de ejecución ignora `agents.defaults.agentRuntime`, `agents.entries.*.agentRuntime`, las asignaciones de entorno de ejecución de sesión y `OPENCLAW_AGENT_RUNTIME`. Ejecute `openclaw doctor --fix` para eliminar los valores obsoletos.
- Las rutas HTTPS oficiales exactas y aptas de OpenAI Responses/ChatGPT sin una sustitución de solicitud definida pueden usar implícitamente el entorno de Codex. La opción de proveedor/modelo `agentRuntime.id: "codex"` convierte Codex en un requisito con cierre por error, pero no hace compatible una ruta incompatible.
- Para implementaciones de Claude CLI, se recomienda usar `model: "anthropic/claude-opus-4-8"` junto con `agentRuntime.id: "claude-cli"` en el ámbito del modelo. Las referencias heredadas `claude-cli/<model>` siguen funcionando por compatibilidad, pero las configuraciones nuevas deben mantener canónica la selección de proveedor/modelo y establecer el backend de ejecución en la política del entorno de ejecución del proveedor/modelo.
- Esto solo controla la ejecución de turnos de agente de texto. La generación multimedia, la visión, PDF, música, vídeo y TTS siguen usando sus ajustes de proveedor/modelo.

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

Los modelos Z.AI GLM-4.x activan automáticamente el modo de razonamiento, salvo que se establezca `--thinking off` o se defina `agents.defaults.models["zai/<model>"].params.thinking` manualmente.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas a herramientas. Establezca `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarla.
Anthropic Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw; cuando el razonamiento adaptativo se activa explícitamente, el valor predeterminado de esfuerzo gestionado por el proveedor de Anthropic es `high`. Los modelos Claude 4.6 usan de forma predeterminada `adaptive` cuando no se establece un nivel de razonamiento explícito.

### Selección del backend de CLI

Los mecanismos del adaptador de CLI se registran mediante Plugins, no se configuran en los valores
predeterminados del agente. Seleccione un backend de CLI registrado mediante `agentRuntime.id`
en el ámbito del modelo, como se muestra arriba. Consulte [backends de CLI](/es/gateway/cli-backends) para conocer las operaciones y
[creación de Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para el registro de comandos,
sesiones, imágenes y analizadores.

### `agents.defaults.promptOverlays`

Superposiciones de prompts independientes del proveedor que se aplican por familia de modelos en las superficies de prompts ensambladas por OpenClaw. Los ids de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido en las rutas de OpenClaw/proveedor; `personality` controla únicamente la capa de estilo de interacción cordial. Las rutas nativas del servidor de aplicaciones de Codex conservan las instrucciones base y de modelo gestionadas por Codex en lugar de esta superposición GPT-5 de OpenClaw, y OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos.

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
- `"off"` desactiva únicamente la capa cordial; el contrato de comportamiento etiquetado de GPT-5 permanece activado.
- La opción heredada `plugins.entries.openai.config.personality` sigue leyéndose cuando esta opción compartida no está establecida.

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

- `every`: cadena de duración (ms/s/m/h). Valor predeterminado: `30m` (autenticación mediante clave de API) o `1h` (autenticación OAuth). Establézcalo en `0m` para desactivarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y evita la inserción de `HEARTBEAT.md` en el contexto de arranque. Valor predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo permitido, en segundos, para un turno del agente de Heartbeat antes de que se cancele. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté definido; de lo contrario, se usa la cadencia de Heartbeat, con un límite de 600 segundos.
- `directPolicy`: política de entrega directa/por mensaje directo. `allow` (valor predeterminado) permite la entrega a un destino directo. `block` suprime la entrega a un destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan únicamente `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación anterior. Sigue el mismo patrón de aislamiento que `sessionTarget: "isolated"` de Cron. Reduce el coste de tokens por Heartbeat de ~100K a ~2-5K tokens.
- `skipWhenBusy`: cuando es true, las ejecuciones de Heartbeat se posponen si ese agente tiene ocupados otros canales: el trabajo de sus propios subagentes vinculados a claves de sesión o de comandos anidados. Los canales de Cron siempre posponen los Heartbeats, incluso sin esta opción.
- Por agente: establezca `agents.entries.*.heartbeat`. Cuando algún agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- Los Heartbeats ejecutan turnos completos del agente: los intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        thinkingLevel: "low", // optional compaction-only thinking override
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"],
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulte [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin de proveedor de Compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar de usar el resumen integrado mediante LLM. Si falla, se recurre al mecanismo integrado. Establecer un proveedor fuerza `mode: "safeguard"`. Consulte [Compaction](/es/concepts/compaction).
- `thinkingLevel`: nivel de razonamiento opcional utilizado únicamente para los resúmenes de Compaction integrados de OpenClaw (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`). Sustituye el nivel de razonamiento actual de la sesión y se limita al modelo o entorno de ejecución de Compaction seleccionado. Déjelo sin establecer para heredar el nivel de la sesión. La Compaction nativa del servidor de aplicaciones Codex ignora este ajuste porque la solicitud nativa de compactación no admite una sustitución del razonamiento por operación; OpenClaw registra una advertencia cuando está configurado.
- `timeoutSeconds`: máximo de segundos permitidos para una sola operación de Compaction antes de que OpenClaw la cancele. Valor predeterminado: `180`.
- `keepRecentTokens`: presupuesto del punto de corte del agente para conservar literalmente la parte final más reciente de la transcripción. La operación manual `/compact` lo respeta cuando se establece explícitamente; de lo contrario, la Compaction manual constituye un punto de control estricto.
- `recentTurnsPreserve`: número de turnos más recientes del usuario y el asistente que se conservan literalmente fuera del resumen de protección. Valor predeterminado: `3`.
- `identifierPolicy`: `strict` (predeterminado) o `off`. `strict` antepone directrices integradas para conservar identificadores opacos durante el resumen de Compaction.
- `qualityGuard`: comprobaciones con reintento cuando la salida de los resúmenes de protección tiene un formato incorrecto. Están activadas de forma predeterminada en el modo de protección; establezca `enabled: false` para omitir la auditoría.
- `midTurnPrecheck`: comprobación opcional de presión en el bucle de herramientas. Cuando es `enabled: true`, OpenClaw comprueba la presión del contexto después de añadir los resultados de las herramientas y antes de la siguiente llamada al modelo. Si el contexto ya no cabe, cancela el intento actual antes de enviar el prompt y reutiliza la ruta de recuperación de la comprobación previa existente para truncar los resultados de las herramientas o compactar y volver a intentarlo. Funciona con los modos de Compaction `default` y `safeguard`. Valor predeterminado: desactivada.
- `postIndexSync`: modo de reindexación de la memoria de sesión posterior a la Compaction. Valor predeterminado: `"async"`. Use `"await"` para obtener la máxima actualización, `"async"` para reducir la latencia de Compaction o `"off"` únicamente cuando la sincronización de la memoria de sesión se gestione en otro lugar.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md que se volverán a inyectar después de la Compaction. Déjelo sin establecer o use `[]` para desactivarlo.
- `model`: `provider/model-id` opcional o alias simple de `agents.defaults.models` exclusivamente para el resumen de Compaction. Los alias simples se resuelven antes del envío; los identificadores literales de modelos configurados mantienen la precedencia en caso de colisión. Use esta opción cuando la sesión principal deba mantener un modelo, pero los resúmenes de Compaction deban ejecutarse en otro; cuando no se establece, la Compaction utiliza el modelo principal de la sesión.
- `truncateAfterCompaction`: rota la transcripción de la sesión activa después de la Compaction para que los turnos futuros carguen únicamente el resumen y la parte final sin resumir, mientras la transcripción completa anterior permanece archivada. Evita el crecimiento ilimitado de la transcripción activa en sesiones de larga duración. Valor predeterminado: `false`.
- `maxActiveTranscriptBytes`: umbral opcional de bytes (`number` o cadenas como `"20mb"`) que activa la Compaction local normal antes de una ejecución cuando el historial de la transcripción supera el umbral. Requiere `truncateAfterCompaction` para que una Compaction correcta pueda rotar a una transcripción sucesora más pequeña. Se desactiva cuando no se establece o es `0`.
- `notifyUser`: cuando es `true`, envía al usuario avisos breves de mantenimiento del contexto: cuando la Compaction comienza y finaliza (por ejemplo, «Compactando el contexto...» y «Compaction completada»), y cuando se agota un vaciado de memoria anterior a la Compaction, por lo que la respuesta continúa en un estado degradado (por ejemplo, «El mantenimiento de la memoria ha fallado temporalmente; se continúa con la respuesta»). Está desactivado de forma predeterminada para mantener estos avisos en silencio.
- `memoryFlush`: turno agéntico silencioso antes de la Compaction automática para almacenar recuerdos duraderos. Establezca `model` en un proveedor/modelo exacto, como `ollama/qwen3:8b`, cuando este turno de mantenimiento deba permanecer en un modelo local; la sustitución no hereda la cadena de alternativas de la sesión activa. `forceFlushTranscriptBytes` fuerza el vaciado cuando el tamaño de la transcripción alcanza el umbral, aunque los contadores de tokens estén desactualizados. Se omite cuando el espacio de trabajo es de solo lectura.

Las instrucciones personalizadas de Compaction son propiedad del código. Implemente un plugin de proveedor
de Compaction con `summarize()` para crear resúmenes personalizados y use
`before_prompt_build` cuando sea necesario inyectar el contexto posterior a la Compaction en prompts
posteriores del modelo. Doctor elimina los campos de instrucciones retirados y remite a estos
puntos de integración.

### `agents.defaults.contextPruning`

Elimina los **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en el disco. Está desactivado de forma predeterminada; establezca `mode: "cache-ttl"` para activarlo.

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

- `mode: "cache-ttl"` activa las pasadas de poda.
- La poda primero recorta de forma moderada los resultados de herramientas demasiado grandes y, después, elimina por completo los resultados antiguos de herramientas si es necesario.

El **recorte moderado** conserva el principio y el final e inserta `...` en el medio.

La **eliminación completa** sustituye todo el resultado de la herramienta por el marcador de posición.

Notas:

- Los bloques de imágenes nunca se recortan ni eliminan.
- Las proporciones se basan en caracteres (son aproximadas), no en recuentos exactos de tokens.
- Se conservan los mensajes más recientes del asistente.

</Accordion>

Consulte [Poda de sesiones](/es/concepts/session-pruning) para conocer los detalles del comportamiento.

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

- Los canales distintos de Telegram requieren `*.streaming.block.enabled: true` explícito para activar las respuestas por bloques. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite respuestas por bloques salvo que `channels.qqbot.streaming.mode` sea `"off"`.
- Sustituciones por canal: `channels.<channel>.streaming.block.coalesce` (y variantes por cuenta). Discord, Google Chat, Mattermost, MS Teams, Signal y Slack usan de forma predeterminada `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: límite de fragmento preferido (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatoria entre respuestas por bloques. Valor predeterminado: `off`. `natural` = 800-2500ms. `custom` utiliza `minMs`/`maxMs` (recurre al intervalo natural para cualquier límite que no se haya establecido). Sustitución por agente: `agents.entries.*.humanDelay`.

Consulte [Transmisión](/es/concepts/streaming) para conocer los detalles del comportamiento y la fragmentación.

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

- Valores predeterminados: `instant` para chats directos/menciones y `message` para chats grupales sin menciones.
- Valor predeterminado de `typingIntervalSeconds`: `6`.
- Sustituciones por agente: `agents.entries.*.typingMode` y `agents.entries.*.typingIntervalSeconds`.

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

Los valores predeterminados mostrados anteriormente (imagen `off`/`docker`/`agent`/`none`/`bookworm-slim`, red `none`, etc.) son los valores predeterminados reales de OpenClaw, no simples valores ilustrativos.

<Accordion title="Detalles del aislamiento">

**Entorno de ejecución:**

- `docker`: entorno de ejecución local de Docker (predeterminado)
- `ssh`: entorno de ejecución remoto genérico basado en SSH
- `openshell`: entorno de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, los ajustes específicos del entorno de ejecución se trasladan a
`plugins.entries.openshell.config`.

**Configuración del entorno de ejecución SSH:**

- `target`: destino SSH con el formato `user@host[:port]`
- `command`: comando del cliente SSH (valor predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta utilizada para los espacios de trabajo por ámbito (valor predeterminado: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes que se pasan a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido en línea o SecretRefs que OpenClaw materializa en archivos temporales durante la ejecución
- `strictHostKeyChecking` / `updateHostKeys`: opciones de la política de claves de host de OpenSSH (ambas tienen como valor predeterminado `true`)

**Precedencia de autenticación SSH:**

- `identityData` tiene precedencia sobre `identityFile`
- `certificateData` tiene precedencia sobre `certificateFile`
- `knownHostsData` tiene precedencia sobre `knownHostsFile`
- Los valores de `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del entorno de ejecución de secretos antes de iniciar la sesión de entorno aislado

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o volver a crearlo
- después mantiene como canónico el espacio de trabajo SSH remoto
- enruta `exec`, las herramientas de archivos y las rutas multimedia mediante SSH
- no sincroniza automáticamente los cambios remotos con el host
- no admite contenedores de navegador en entorno aislado

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo del entorno aislado por ámbito en `~/.openclaw/sandboxes` (valor predeterminado)
- `ro`: espacio de trabajo del entorno aislado en `/workspace`, con el espacio de trabajo del agente montado como solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado con acceso de lectura y escritura en `/workspace`

**Ámbito:**

- `session`: contenedor y espacio de trabajo por sesión
- `agent`: un contenedor y espacio de trabajo por agente (valor predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // réplica (valor predeterminado) | remoto
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // identificador opcional de la política de OpenShell
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

- `mirror`: inicializa el entorno remoto desde el local antes de la ejecución y sincroniza los cambios de vuelta después; el espacio de trabajo local permanece como canónico
- `remote`: inicializa el entorno remoto una vez al crear el entorno aislado y después mantiene como canónico el espacio de trabajo remoto

En el modo `remote`, las modificaciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el entorno aislado después del paso de inicialización.
El transporte se realiza mediante SSH al entorno aislado de OpenShell, pero el Plugin gestiona el ciclo de vida del entorno aislado y la sincronización opcional de la réplica.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Requiere salida de red, raíz con permisos de escritura y usuario raíz.

**Los contenedores usan `network: "none"` de forma predeterminada**; configúrelo como `"bridge"` (o como una red puente personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada, salvo que se configure explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergencia).
Los turnos del servidor de aplicaciones de Codex en un entorno aislado activo de OpenClaw utilizan esta misma configuración de salida para el acceso de red nativo de su modo de código.

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los enlaces globales y por agente se combinan.

**Navegador en entorno aislado** (`sandbox.browser.enabled`, valor predeterminado `false`): Chromium + CDP en un contenedor. La URL de noVNC se inserta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador de noVNC utiliza autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (valor predeterminado) impide que las sesiones en entornos aislados accedan al navegador del host.
- `network` tiene como valor predeterminado `openclaw-sandbox-browser` (red puente dedicada). Configúrelo como `bridge` solo cuando se desee explícitamente conectividad global mediante el puente. `"host"` también está bloqueado aquí.
- `cdpSourceRange` restringe opcionalmente la entrada de CDP en el perímetro del contenedor a un intervalo CIDR (por ejemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del navegador en entorno aislado. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Chromium siempre se inicia con `--no-sandbox --disable-setuid-sandbox` en el contenedor del navegador en entorno aislado (los contenedores no disponen de las primitivas del kernel que necesita el propio entorno aislado de Chrome); no existe ninguna opción de configuración para cambiarlo.
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
  - `--renderer-process-limit=2` de forma predeterminada; se puede cambiar con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; configure `0` para utilizar el
    límite de procesos predeterminado de Chromium.
  - `--headless=new` solo cuando `headless` está habilitado.
  - Los valores predeterminados corresponden a la base de la imagen del contenedor; utilice una imagen de navegador personalizada con un
    punto de entrada personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El aislamiento del navegador y `sandbox.docker.binds` solo están disponibles con Docker.

Compile las imágenes (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh           # imagen principal del entorno aislado
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

Para instalaciones de npm sin un checkout del código fuente, consulte [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

### `agents.entries` (anulaciones por agente)

Utilice `agents.entries.*.tts` para asignar a un agente su propio proveedor de TTS, voz, modelo,
estilo o modo de TTS automático. El bloque del agente se combina en profundidad sobre la configuración global
`tts`, por lo que las credenciales compartidas pueden permanecer en un solo lugar mientras cada
agente anula únicamente los campos de voz o proveedor que necesita. La anulación del agente activo
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

- `id`: id estable del agente (obligatorio).
- `default`: cuando se establecen varios, prevalece el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena establece un modelo principal estricto por agente sin reserva de modelo; la forma de objeto `{ primary }` también es estricta, salvo que se añada `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar la reserva para ese agente, o `{ primary, fallbacks: [] }` para hacer explícito el comportamiento estricto. Los trabajos de Cron que solo sobrescriben `primary` siguen heredando las reservas predeterminadas, salvo que se establezca `fallbacks: []`.
- `utilityModel`: sobrescritura opcional por agente para tareas internas breves, como títulos generados de sesiones e hilos. Recurre a `agents.defaults.utilityModel` y, después, al modelo pequeño predeterminado declarado por el proveedor efectivo de la sesión. Los títulos del panel vuelven a intentarlo una vez con el modelo normal efectivo de la sesión. Una cadena vacía omite la ruta de utilidad alternativa para este agente sin deshabilitar la generación de títulos del panel.
- `params`: parámetros de transmisión por agente combinados sobre la entrada del modelo seleccionado en `agents.defaults.models`. Use esta opción para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `tts`: sobrescrituras opcionales de texto a voz por agente. El bloque se combina de forma profunda sobre `tts`, por lo que las credenciales compartidas del proveedor y la política de reserva deben mantenerse en `tts`; establezca aquí únicamente valores específicos de la personalidad, como el proveedor, la voz, el modelo, el estilo o el modo automático.
- `skills`: lista de Skills permitidas opcional por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está establecido; una lista explícita sustituye los valores predeterminados en lugar de combinarlos, y `[]` significa que no hay Skills.
- `thinkingDefault`: nivel de razonamiento predeterminado opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna sobrescritura por mensaje o sesión. El perfil de proveedor/modelo seleccionado determina qué valores son válidos; para Google Gemini, `adaptive` mantiene el razonamiento dinámico gestionado por el proveedor (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Sobrescribe `agents.defaults.reasoningDefault` para este agente cuando no se establece ninguna sobrescritura del razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`"auto" | true | false`). Se aplica cuando no se establece ninguna sobrescritura del modo rápido por mensaje o sesión.
- `models`: sobrescrituras opcionales por agente del catálogo de modelos o del entorno de ejecución, indexadas por ids `provider/model` completos. Use `models["provider/model"].agentRuntime` para las excepciones del entorno de ejecución por agente.
- `runtime`: descriptor opcional del entorno de ejecución por agente. Use `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar de forma predeterminada sesiones del arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- Los archivos de imagen `identity.avatar` locales relativos al espacio de trabajo tienen un límite de 2 MB. Las URL `http(s)` y los URI `data:` no se comprueban con respecto al límite de tamaño de los archivos locales.
- `identity` deriva los valores predeterminados: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de ids de agentes configurados permitidos para destinos `sessions_spawn.agentId` explícitos (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). Incluya el id del solicitante cuando deban permitirse llamadas `agentId` dirigidas a sí mismo. Las entradas obsoletas cuya configuración de agente se haya eliminado son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecute `openclaw doctor --fix` para eliminarlas, o añada una entrada `agents.entries.*` mínima si ese destino debe poder seguir generándose mientras hereda los valores predeterminados.
- Protección de herencia del entorno aislado: si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos que se ejecutarían sin aislamiento.
- `subagents.requireAgentId`: cuando es verdadero, bloquea las llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita del perfil; valor predeterminado: falso).
- `subagents.maxConcurrent`: número máximo de ejecuciones simultáneas de agentes secundarios en toda la ejecución de subagentes. Valor predeterminado: `8`.
- `subagents.maxChildrenPerAgent`: número máximo de agentes secundarios activos que puede generar una sola sesión de agente. Valor predeterminado: `5`.
- `subagents.maxSpawnDepth`: profundidad máxima de anidamiento para la generación de subagentes (`1`-`5`). Valor predeterminado: `1` (sin anidamiento).
- `subagents.archiveAfterMinutes`: tiempo que debe transcurrir antes de archivar el estado de un subagente completado. Valor predeterminado: `60`.

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

Dentro de cada nivel, prevalece la primera entrada `bindings` coincidente.

Para las entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de la conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de vinculación de rutas anterior.

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
      maxDiskBytes: "500mb", // límite estricto opcional
      highWaterBytes: "400mb", // objetivo de limpieza opcional
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desenfoque automático predeterminado por inactividad, en horas (`0` lo deshabilita)
      maxAgeHours: 0, // antigüedad máxima estricta predeterminada, en horas (`0` la deshabilita)
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
  - `global`: todos los participantes de un contexto de canal comparten una única sesión (úsese solo cuando se pretenda compartir el contexto).
- **`dmScope`**: cómo se agrupan los mensajes directos.
  - `main`: todos los mensajes directos comparten la sesión principal.
  - `per-peer`: aislamiento por id. de remitente entre canales.
  - `per-channel-peer`: aislamiento por canal y remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aislamiento por cuenta, canal y remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids. canónicos a pares con prefijo de proveedor para compartir sesiones entre canales. Los comandos de acoplamiento, como `/dock_discord`, usan la misma asignación para cambiar la ruta de respuesta de la sesión activa a otro par de canal vinculado; consulte [Acoplamiento de canales](/es/concepts/channel-docking).
- **`reset`**: política principal de restablecimiento. `none` desactiva el restablecimiento automático y es el valor predeterminado; Compaction limita el contexto activo en su lugar. `daily` restablece a las `atHour` de la hora local; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, prevalece el que venza primero. `/new` y `/reset` permanecen disponibles en todos los modos. La vigencia del restablecimiento diario usa `sessionStartedAt` de la fila de sesión; la vigencia del restablecimiento por inactividad usa `lastInteractionAt`. Las escrituras de eventos en segundo plano o del sistema, como Heartbeat, activaciones de Cron, notificaciones de ejecución y mantenimiento del Gateway, pueden actualizar `updatedAt`, pero no mantienen vigentes las sesiones diarias o por inactividad.
  - **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). Doctor migra las entradas heredadas de `dm` a `direct`; el esquema rechaza `dm`.
- **`resetByChannel`**: anulaciones de restablecimiento por canal, indexadas por el id. del proveedor/canal. Cuando el canal de la sesión tiene una entrada coincidente, esta prevalece por completo sobre `resetByType`/`reset` para esa sesión. Úsese solo cuando un canal necesite un comportamiento de restablecimiento distinto de la política por tipo.
- **`mainKey`**: campo heredado. El entorno de ejecución siempre usa `"main"` para el grupo principal de chats directos.
- **`sendPolicy`**: busca coincidencias por `channel`, `chatType` (`direct|group|channel`, con el alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación prevalece.
- **`maintenance`**: controles de limpieza y retención del almacén de sesiones.
  - `mode`: `enforce` aplica la limpieza y es el valor predeterminado; `warn` solo emite advertencias.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (valor predeterminado: `30d`).
  - `maxEntries`: número máximo de entradas de sesión de SQLite (valor predeterminado: `500`). Las escrituras del entorno de ejecución ejecutan la limpieza por lotes con un pequeño margen por encima del límite máximo para topes de tamaño de producción; `openclaw sessions cleanup --enforce` aplica el tope inmediatamente.
  - Las sesiones efímeras de sondeo de ejecuciones de modelos del Gateway usan una retención fija de `24h`, pero la limpieza depende de la presión: solo elimina las filas obsoletas de sondeos estrictos de ejecuciones de modelos cuando se alcanza la presión de mantenimiento o del límite de entradas de sesión. Solo son aptas las claves de sondeo explícitas y estrictas que coincidan con `agent:*:explicit:model-run-<uuid>`; las sesiones normales directas, grupales, de hilos, Cron, enlaces, Heartbeat, ACP y subagentes no heredan esta retención de 24h. Cuando se ejecuta la limpieza de ejecuciones de modelos, se realiza antes que la limpieza general de entradas obsoletas de `pruneAfter` y el límite de `maxEntries`.
  - El esquema actual rechaza el campo heredado `rotateBytes`; `openclaw doctor --fix` lo elimina de las configuraciones antiguas.
  - `resetArchiveRetention`: retención basada en la antigüedad para archivos de transcripciones restablecidas o eliminadas. De manera predeterminada, los archivos permanecen hasta que se expulsan por el presupuesto de disco; establezca una duración para habilitar la eliminación según el tiempo transcurrido, o `false` para desactivarla explícitamente.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En el modo `warn` registra advertencias; en el modo `enforce` elimina primero los artefactos y las sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza del presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para las funciones de sesiones vinculadas a hilos.
  - `enabled`: interruptor principal para las vinculaciones de hilos de canales compatibles
  - `idleHours`: pérdida automática de foco por inactividad predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `maxAgeHours`: antigüedad máxima absoluta predeterminada en horas (`0` la desactiva; los proveedores pueden anularla)
  - `spawnSessions`: control predeterminado para crear sesiones de trabajo vinculadas a hilos desde `sessions_spawn` y generaciones de hilos ACP. El valor predeterminado es `true` cuando las vinculaciones de hilos están habilitadas; los proveedores y las cuentas pueden anularlo.
  - `defaultSpawnContext`: contexto nativo predeterminado de subagente para generaciones vinculadas a hilos (`"fork"` o `"isolated"`). El valor predeterminado es `"fork"`.

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // o "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
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

Resolución (prevalece la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

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

- El valor predeterminado es `identity.emoji` del agente activo; en caso contrario, `"👀"`. Establezca `""` para desactivarla.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → alternativa de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all` o `off`/`none` (desactiva por completo las reacciones de confirmación).
- `messages.statusReactions.enabled`: habilita las reacciones de estado del ciclo de vida en Slack, Discord, Signal, Telegram y WhatsApp.
  En Discord, si no se establece, las reacciones de estado permanecen habilitadas cuando las reacciones de confirmación están activas.
  En Slack, Signal, Telegram y WhatsApp, establézcalo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.
  De manera predeterminada, Slack usa el estado nativo de los hilos del asistente y mensajes de carga rotativos para indicar el progreso, mientras mantiene estática la reacción de confirmación configurada.

### Cola

- `mode`: estrategia de cola para los mensajes entrantes que llegan mientras hay una ejecución de sesión activa. Valor predeterminado: `"steer"`.
  - `steer`: inyecta la nueva solicitud en la ejecución activa.
  - `followup`: ejecuta la nueva solicitud después de que finalice la ejecución activa.
  - `collect`: agrupa los mensajes compatibles y los ejecuta juntos más adelante.
  - `interrupt`: cancela la ejecución activa antes de iniciar la solicitud más reciente.
- `debounceMs`: demora antes de enviar un mensaje en cola o redirigido. Valor predeterminado: `500`.
- `cap`: cantidad máxima de mensajes en cola antes de aplicar la política de descarte. Valor predeterminado: `20`.
- `drop`: estrategia cuando se supera el límite. `"summarize"` (predeterminado) descarta las entradas más antiguas, pero conserva resúmenes compactos; `"old"` descarta las más antiguas sin resúmenes; `"new"` rechaza el elemento más reciente.
- `byChannel`: anulaciones de `mode` por canal, indexadas por el id. del proveedor.
- `debounceMsByChannel`: anulaciones de `debounceMs` por canal, indexadas por el id. del proveedor.

### Antirrebote de entrada

Agrupa los mensajes rápidos que solo contienen texto y proceden del mismo remitente en un único turno del agente. Los archivos multimedia y adjuntos fuerzan el envío inmediato. Los comandos de control omiten el antirrebote. Valor predeterminado de `debounceMs`: `2000`.

### Otras claves de mensajes

- `channels.whatsapp.responsePrefix`: prefijo de las respuestas salientes de WhatsApp. Doctor mueve aquí el valor de entrada retirado `messagePrefix` solo cuando este valor canónico no está establecido.
- `messages.visibleReplies`: controla las respuestas de origen visibles en conversaciones directas, grupales y de canal (`"message_tool"` requiere `message(action=send)` para generar una salida visible; `"automatic"` publica respuestas normales como antes).
- `messages.usageTemplate` / `messages.responseUsage`: plantilla personalizada de pie de página de `/usage` y modo predeterminado de uso por respuesta (`off | tokens | full`, además del alias heredado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: activadores de menciones en mensajes grupales y dimensionamiento de la ventana del historial.
- `messages.suppressToolErrors`: cuando es `true`, suprime las advertencias de errores de herramientas de `⚠️` que se muestran al usuario (el agente sigue viendo los errores en el contexto y puede volver a intentarlo). Valor predeterminado: `false`.

### TTS (texto a voz)

```json5
{
  tts: {
    auto: "off", // off (predeterminado) | always | inbound | tagged
    mode: "final", // final | all
    provider: "elevenlabs",
    summaryModel: "openai/gpt-5.4-mini",
    modelOverrides: { enabled: true },
    maxTextLength: 4000,
    timeoutMs: 30000,
    providers: {
      elevenlabs: {
        apiKey: "example-elevenlabs-api-key",
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
        apiKey: "example-openai-api-key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        speakerVoice: "coral",
      },
    },
  },
}
```

La ruta de preferencias globales corresponde al estado de la máquina (valor predeterminado:
`~/.openclaw/settings/tts.json`; puede anularse con `OPENCLAW_TTS_PREFS`). Las configuraciones
avanzadas con varios agentes pueden establecer `agents.entries.<id>.tts.prefsPath` para usar almacenes
de preferencias distintos por agente.

- `auto` controla el modo TTS automático predeterminado: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada (`enabled !== false`); `modelOverrides.allowProvider` requiere activación.
- Las claves de API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY` como alternativa.
- Los proveedores de voz incluidos pertenecen a los plugins. Si se establece `plugins.allow`, incluya cada plugin de proveedor de TTS que desee utilizar, por ejemplo, `microsoft` para Edge TTS. El identificador de proveedor heredado `edge` se acepta como alias de `microsoft`.
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
- Las claves planas heredadas de Conversación (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo para compatibilidad. Ejecute `openclaw doctor --fix` para reescribir la configuración persistente en `talk.providers.<provider>`.
- Los identificadores de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` como alternativa (comportamiento del cliente de Conversación de macOS).
- `providers.*.apiKey` acepta cadenas de texto sin formato u objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` solo se aplica cuando no hay ninguna clave de API de Conversación configurada.
- `providers.*.voiceAliases` permite que las directivas de Conversación utilicen nombres descriptivos.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face utilizado por el asistente local de MLX de macOS. Si se omite, macOS utiliza `mlx-community/Soprano-80M-bf16`.
- La reproducción de MLX en macOS se ejecuta mediante el asistente incluido `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` anula la ruta del asistente para el desarrollo.
- `consultThinkingLevel` controla el nivel de razonamiento de la ejecución completa del agente de OpenClaw que sustenta las llamadas `openclaw_agent_consult` en tiempo real de Conversación de la interfaz de control. Déjelo sin establecer para conservar el comportamiento normal de la sesión y el modelo.
- `consultFastMode` establece una anulación puntual del modo rápido para las consultas en tiempo real de Conversación de la interfaz de control sin cambiar la configuración normal del modo rápido de la sesión.
- `speechLocale` establece el identificador de configuración regional BCP 47 utilizado por el reconocimiento de voz de Conversación en Android, iOS y macOS. Android también utiliza su componente de idioma para orientar la transcripción de entrada en tiempo real. Déjelo sin establecer para utilizar el valor predeterminado del dispositivo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Conversación después de que el usuario guarda silencio antes de enviar la transcripción. Si no se establece, se conserva el intervalo de pausa predeterminado de la plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` añade instrucciones del sistema destinadas al proveedor al prompt integrado en tiempo real de OpenClaw, de modo que se pueda configurar el estilo de voz sin perder las indicaciones predeterminadas de `openclaw_agent_consult`.
- `realtime.vadThreshold` establece el umbral de actividad de voz del proveedor entre `0` (máxima sensibilidad) y `1` (mínima sensibilidad). Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.silenceDurationMs` establece el intervalo de silencio expresado como un número entero positivo antes de que el proveedor confirme un turno del usuario en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.prefixPaddingMs` establece la cantidad de audio, expresada como un número entero no negativo, que se conserva antes del inicio del habla detectada. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.reasoningEffort` establece el nivel de razonamiento específico del proveedor para las sesiones en tiempo real. Si no se establece, se conserva el valor predeterminado del proveedor.
- `realtime.consultRouting`: `"provider-direct"` (predeterminado) conserva las respuestas directas del proveedor cuando el proveedor en tiempo real genera una transcripción final del usuario sin `openclaw_agent_consult`. En su lugar, `"force-agent-consult"` enruta la solicitud finalizada a través de OpenClaw.

---

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
