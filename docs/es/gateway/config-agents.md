---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, thinking, espacio de trabajo, Heartbeat, medios, Skills)
    - Configurar el enrutamiento multiagente y los bindings
    - Ajustar la sesión, la entrega de mensajes y el comportamiento del modo talk
summary: Valores predeterminados del agente, enrutamiento multiagente, sesión, mensajes y configuración de talk
title: Configuración — agentes
x-i18n:
    generated_at: "2026-04-24T05:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, tiempo de ejecución del gateway y otras
claves de nivel superior, consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados del agente

### `agents.defaults.workspace`

Predeterminado: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raíz opcional del repositorio mostrada en la línea Runtime del prompt del sistema. Si no se define, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

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
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para Skills sin restricciones por defecto.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Establece `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Deshabilita la creación automática de archivos bootstrap del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla cuándo se inyectan los archivos bootstrap del espacio de trabajo en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos seguros de continuación (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del espacio de trabajo, reduciendo el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del espacio de trabajo antes del truncamiento. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados entre todos los archivos bootstrap del espacio de trabajo. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el texto de advertencia visible para el agente cuando el contexto bootstrap se trunca.
Predeterminado: `"once"`.

- `"off"`: nunca inyecta texto de advertencia en el prompt del sistema.
- `"once"`: inyecta la advertencia una vez por firma de truncamiento única (recomendado).
- `"always"`: inyecta la advertencia en cada ejecución cuando exista truncamiento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionadamente por subsistema en lugar de pasar todos por un único
control genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección bootstrap normal del espacio de trabajo.
- `agents.defaults.startupContext.*`:
  preludio de inicio de una sola vez para ejecuciones `/new` y `/reset`, incluidos
  archivos recientes diarios `memory/*.md`.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos acotados en tiempo de ejecución y bloques inyectados propiedad del tiempo de ejecución.
- `memory.qmd.limits.*`:
  tamaño de fragmentos e inyección de búsqueda en memoria indexada.

Usa la sobrescritura correspondiente por agente solo cuando un agente necesite un
presupuesto distinto:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones `/new` y `/reset`
sin contenido.

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

Valores predeterminados compartidos para superficies de contexto acotadas en tiempo de ejecución.

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

- `memoryGetMaxChars`: límite predeterminado del extracto `memory_get` antes de que se agreguen
  metadatos de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana predeterminada de líneas de `memory_get` cuando `lines` se
  omite.
- `toolResultMaxChars`: límite activo de resultado de herramienta usado para resultados persistidos y
  recuperación de desbordamiento.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md usado durante la inyección de actualización
  posterior a Compaction.

#### `agents.list[].contextLimits`

Sobrescritura por agente para los controles compartidos de `contextLimits`. Los campos omitidos heredan
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

Sobrescritura por agente para el presupuesto del prompt de Skills.

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

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imagen de transcripción/herramienta antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de la solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos preservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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
      embeddedHarness: {
        runtime: "auto", // auto | pi | id de arnés registrado, p. ej. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - La forma de objeto establece el principal más los modelos de conmutación por error en orden.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la ruta de herramienta `image` como configuración de su modelo de visión.
  - También se usa como enrutamiento alternativo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes con Gemini, `fal/fal-ai/flux/dev` para fal, o `openai/gpt-image-2` para OpenAI Images.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación correspondiente del proveedor (por ejemplo `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero intenta con el proveedor predeterminado actual y luego con los demás proveedores de generación de imágenes registrados en orden por ID de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.5+`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero intenta con el proveedor predeterminado actual y luego con los demás proveedores de generación de música registrados en orden por ID de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave API correspondiente del proveedor.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero intenta con el proveedor predeterminado actual y luego con los demás proveedores de generación de video registrados en orden por ID de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave API correspondiente del proveedor.
  - El proveedor incluido de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones a nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la herramienta `pdf` para el enrutamiento de modelos.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño PDF para la herramienta `pdf` cuando no se pasa `maxBytesMb` al invocarla.
- `pdfMaxPages`: máximo predeterminado de páginas consideradas por el modo alternativo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel verbose predeterminado para los agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `elevatedDefault`: nivel predeterminado de salida elevada para los agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo `openai/gpt-5.4` para acceso con clave API u `openai-codex/gpt-5.5` para OAuth de Codex). Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única de proveedor configurado para ese ID exacto de modelo y solo después recurre al proveedor predeterminado configurado (comportamiento heredado obsoleto de compatibilidad, así que se prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: el catálogo de modelos configurado y allowlist para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`).
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para agregar entradas. `config set` rechaza reemplazos que eliminen entradas existentes de la allowlist, salvo que pases `--replace`.
  - Los flujos de configuración/incorporación con alcance de proveedor fusionan los modelos seleccionados del proveedor en este mapa y preservan los proveedores no relacionados ya configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para sobrescribir el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros globales predeterminados del proveedor aplicados a todos los modelos. Se establecen en `agents.defaults.params` (por ejemplo `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) es sobrescrito por `agents.defaults.models["provider/model"].params` (por modelo), y luego `agents.list[].params` (ID de agente coincidente) sobrescribe por clave. Consulta [Prompt Caching](/es/reference/prompt-caching) para más detalles.
- `embeddedHarness`: política predeterminada de tiempo de ejecución de bajo nivel para agentes integrados. Usa `runtime: "auto"` para permitir que los arneses registrados por plugins reclamen modelos compatibles, `runtime: "pi"` para forzar el arnés integrado PI, o un ID de arnés registrado como `runtime: "codex"`. Establece `fallback: "none"` para deshabilitar la alternativa automática a PI.
- Los escritores de configuración que modifican estos campos (por ejemplo `/models set`, `/models set-image` y comandos de agregar/quitar fallback) guardan la forma canónica de objeto y preservan las listas de fallback existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones paralelas del agente entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qué ejecutor de bajo nivel ejecuta los turnos integrados del agente.
La mayoría de los despliegues deberían mantener el valor predeterminado `{ runtime: "auto", fallback: "pi" }`.
Úsalo cuando un Plugin de confianza proporcione un arnés nativo, como el arnés
incluido de servidor de apps de Codex.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` o un ID de arnés de Plugin registrado. El Plugin incluido de Codex registra `codex`.
- `fallback`: `"pi"` o `"none"`. `"pi"` mantiene el arnés integrado PI como alternativa de compatibilidad cuando no se selecciona ningún arnés de Plugin. `"none"` hace que una selección faltante o no compatible de arnés de Plugin falle en lugar de usar PI silenciosamente. Los fallos del arnés de Plugin seleccionado siempre se muestran directamente.
- Sobrescrituras por entorno: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sobrescribe `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` deshabilita la alternativa a PI para ese proceso.
- Para despliegues solo con Codex, establece `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` y `embeddedHarness.fallback: "none"`.
- La elección del arnés se fija por ID de sesión después de la primera ejecución integrada. Los cambios de config/env afectan a sesiones nuevas o reiniciadas, no a una transcripción existente. Las sesiones heredadas con historial de transcripción pero sin fijación registrada se tratan como fijadas a PI. `/status` muestra IDs de arnés no PI, como `codex`, junto a `Fast`.
- Esto solo controla el arnés de chat integrado. La generación de medios, visión, PDF, música, video y TTS siguen usando su configuración de proveedor/modelo.

**Atajos de alias incluidos** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` o GPT-5.5 con OAuth de Codex configurado |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Tus alias configurados siempre tienen prioridad sobre los predeterminados.

Los modelos GLM-4.x de z.ai habilitan automáticamente el modo thinking salvo que establezcas `--thinking off` o definas tú mismo `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos de z.ai habilitan `tool_stream` por defecto para streaming de llamadas de herramientas. Establece `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para deshabilitarlo.
Los modelos Claude 4.6 de Anthropic usan `adaptive` thinking por defecto cuando no se establece un nivel explícito de thinking.

### `agents.defaults.cliBackends`

Backends opcionales de CLI para ejecuciones alternativas solo de texto (sin llamadas de herramientas). Útiles como respaldo cuando fallan los proveedores de API.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI son de texto primero; las herramientas siempre están deshabilitadas.
- Las sesiones son compatibles cuando se establece `sessionArg`.
- El paso directo de imágenes es compatible cuando `imageArg` acepta rutas de archivo.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el prompt del sistema ensamblado por OpenClaw con una cadena fija. Se establece en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; un valor vacío o solo con espacios se ignora. Útil para experimentos controlados de prompts.

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

Superposiciones de prompt independientes del proveedor aplicadas por familia de modelos. Los IDs de modelo de la familia GPT-5 reciben el contrato compartido de comportamiento entre proveedores; `personality` controla solo la capa de estilo de interacción amistosa.

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
- El valor heredado `plugins.entries.openai.config.personality` sigue leyéndose cuando esta configuración compartida no está establecida.

### `agents.defaults.heartbeat`

Ejecuciones periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deshabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predeterminado: true; false omite la sección Heartbeat del prompt del sistema
        lightContext: false, // predeterminado: false; true mantiene solo HEARTBEAT.md de los archivos bootstrap del espacio de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predeterminado) | block
        target: "none", // predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave API) o `1h` (autenticación OAuth). Establece `0m` para deshabilitar.
- `includeSystemPromptSection`: cuando es `false`, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto bootstrap. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es `true`, suprime las cargas útiles de advertencia de error de herramienta durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno del agente de Heartbeat antes de abortarlo. Déjalo sin definir para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite entrega con destino directo. `block` suprime la entrega con destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es `true`, las ejecuciones de Heartbeat usan contexto bootstrap ligero y conservan solo `HEARTBEAT.md` de los archivos bootstrap del espacio de trabajo.
- `isolatedSession`: cuando es `true`, cada Heartbeat se ejecuta en una sesión nueva sin historial previo de conversación. Mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce el coste por Heartbeat de ~100K a ~2-5K tokens.
- Por agente: establece `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- Los Heartbeats ejecutan turnos completos del agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un Plugin de proveedor de Compaction registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // se usa cuando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deshabilita la reinyección
        model: "openrouter/anthropic/claude-sonnet-4-6", // sobrescritura opcional del modelo solo para Compaction
        notifyUser: true, // envía avisos breves cuando Compaction comienza y termina (predeterminado: false)
        memoryFlush: {
          enabled: true,
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
- `provider`: id de un Plugin de proveedor de Compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen LLM integrado. Recurre al integrado en caso de fallo. Establecer un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para una sola operación de Compaction antes de que OpenClaw la aborte. Predeterminado: `900`.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone orientación integrada para conservar identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto opcional personalizado de conservación de identificadores usado cuando `identifierPolicy=custom`.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de Compaction. Predeterminado `["Session Startup", "Red Lines"]`; establece `[]` para deshabilitar la reinyección. Cuando no se define o se define explícitamente ese par predeterminado, también se aceptan los encabezados antiguos `Every Session`/`Safety` como alternativa heredada.
- `model`: sobrescritura opcional `provider/model-id` solo para el resumen de Compaction. Úsalo cuando la sesión principal deba mantener un modelo pero los resúmenes de Compaction deban ejecutarse con otro; cuando no se define, Compaction usa el modelo principal de la sesión.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando Compaction empieza y cuando termina (por ejemplo, "Compacting context..." y "Compaction complete"). Está deshabilitado por defecto para mantener Compaction silencioso.
- `memoryFlush`: turno agentivo silencioso antes de la autocompactación para almacenar memorias duraderas. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Poda **resultados antiguos de herramientas** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de la sesión en disco.

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

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita las pasadas de poda.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la poda (después del último toque de caché).
- La poda primero recorta suavemente los resultados sobredimensionados de herramientas y luego vacía por completo los más antiguos si es necesario.

**Soft-trim** conserva el comienzo + final e inserta `...` en el medio.

**Hard-clear** reemplaza todo el resultado de la herramienta con el marcador.

Notas:

- Los bloques de imagen nunca se recortan ni se vacían.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la poda.

</Accordion>

Consulta [Poda de sesión](/es/concepts/session-pruning) para ver detalles del comportamiento.

### Streaming por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Sobrescrituras por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan por defecto `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500 ms. Sobrescritura por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para ver el comportamiento y detalles de fragmentación.

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

- Predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para el agente integrado. Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa.

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
          // SecretRefs / contenido inline también compatibles:
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

- `docker`: tiempo de ejecución local de Docker (predeterminado)
- `ssh`: tiempo de ejecución remoto genérico respaldado por SSH
- `openshell`: tiempo de ejecución OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del tiempo de ejecución se mueve a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por alcance
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido inline o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del tiempo de ejecución de secretos antes de que comience la sesión de sandbox

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crear o recrear
- luego mantiene el espacio de trabajo remoto SSH como canónico
- enruta `exec`, herramientas de archivo y rutas de medios mediante SSH
- no sincroniza automáticamente de vuelta al host los cambios remotos
- no admite contenedores de navegador en sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de sandbox por alcance bajo `~/.openclaw/sandboxes`
- `ro`: espacio de trabajo de sandbox en `/workspace`, espacio de trabajo del agente montado de solo lectura en `/agent`
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
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional de política de OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de `exec`, sincroniza de vuelta después de `exec`; el espacio de trabajo local sigue siendo el canónico
- `remote`: inicializa el remoto una vez cuando se crea el sandbox y luego mantiene el espacio de trabajo remoto como canónico

En modo `remote`, las ediciones locales en el host hechas fuera de OpenClaw no se sincronizan automáticamente con el sandbox después del paso inicial.
El transporte es SSH hacia el sandbox de OpenShell, pero el Plugin es propietario del ciclo de vida del sandbox y de la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez tras la creación del contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan por defecto `network: "none"`**: establécelo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado por defecto salvo que establezcas explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergencia).

**Los adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se fusionan.

**Navegador en sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. La URL de noVNC se inyecta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observación noVNC usa autenticación VNC por defecto y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) bloquea que las sesiones en sandbox apunten al navegador del host.
- `network` usa por defecto `openclaw-sandbox-browser` (red bridge dedicada). Establécelo en `bridge` solo cuando quieras conectividad global del bridge explícitamente.
- `cdpSourceRange` restringe opcionalmente el ingreso CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador en sandbox. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de lanzamiento se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts con contenedores:
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
  - `--disable-extensions` (habilitado por defecto)
  - `--disable-3d-apis`, `--disable-software-rasterizer` y `--disable-gpu` están
    habilitados por defecto y pueden deshabilitarse con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar extensiones si tu flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establece `0` para usar el
    límite predeterminado de procesos de Chromium.
  - además `--no-sandbox` y `--disable-setuid-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la base de la imagen del contenedor; usa una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El sandboxing del navegador y `sandbox.docker.binds` son solo para Docker.

Construir imágenes:

```bash
scripts/sandbox-setup.sh           # imagen principal de sandbox
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

### `agents.list` (sobrescrituras por agente)

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
        thinkingDefault: "high", // sobrescritura por agente del nivel de thinking
        reasoningDefault: "on", // sobrescritura por agente de la visibilidad del razonamiento
        fastModeDefault: false, // sobrescritura por agente del modo rápido
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sobrescribe por clave los params coincidentes de defaults.models
        skills: ["docs-search"], // reemplaza agents.defaults.skills cuando se establece
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

- `id`: ID estable del agente (obligatorio).
- `default`: cuando se establecen varios, gana el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena sobrescribe solo `primary`; la forma de objeto `{ primary, fallbacks }` sobrescribe ambos (`[]` deshabilita los fallbacks globales). Los trabajos Cron que solo sobrescriben `primary` siguen heredando los fallbacks predeterminados salvo que establezcas `fallbacks: []`.
- `params`: parámetros de stream por agente fusionados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Úsalo para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `skills`: allowlist opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está definido; una lista explícita reemplaza los valores predeterminados en lugar de fusionarse, y `[]` significa sin Skills.
- `thinkingDefault`: valor predeterminado opcional por agente para el nivel de thinking (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna sobrescritura por mensaje o sesión.
- `reasoningDefault`: valor predeterminado opcional por agente para la visibilidad del razonamiento (`on | off | stream`). Se aplica cuando no se establece ninguna sobrescritura por mensaje o sesión del razonamiento.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no se establece ninguna sobrescritura por mensaje o sesión del modo rápido.
- `embeddedHarness`: sobrescritura opcional por agente de la política de arnés de bajo nivel. Usa `{ runtime: "codex", fallback: "none" }` para hacer que un agente sea solo Codex mientras otros agentes conservan la alternativa predeterminada a PI.
- `runtime`: descriptor opcional de tiempo de ejecución por agente. Usa `type: "acp"` con valores predeterminados en `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar por defecto sesiones de arnés ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de IDs de agente para `sessions_spawn` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es `true`, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza selección explícita de perfil; predeterminado: false).

---

## Enrutamiento multiagente

Ejecuta varios agentes aislados dentro de un Gateway. Consulta [Multi-Agent](/es/concepts/multi-agent).

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

### Campos de coincidencia de binding

- `type` (opcional): `route` para enrutamiento normal (si falta, el valor predeterminado es route), `acp` para bindings persistentes de conversación ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específicos del canal)
- `acp` (opcional; solo para entradas `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden determinista de coincidencia:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin peer/guild/team)
5. `match.accountId: "*"` (en todo el canal)
6. Agente predeterminado

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden por niveles de route binding descrito arriba.

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

<Accordion title="Herramientas + espacio de trabajo de solo lectura">

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
    parentForkMaxTokens: 100000, // omitir bifurcación del hilo padre por encima de este recuento de tokens (0 deshabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // presupuesto rígido opcional
      highWaterBytes: "400mb", // objetivo opcional de limpieza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desfoco automático predeterminado por inactividad en horas (`0` deshabilita)
      maxAgeHours: 0, // antigüedad máxima rígida predeterminada en horas (`0` deshabilita)
    },
    mainKey: "main", // heredado (el tiempo de ejecución siempre usa "main")
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
  - `global`: todos los participantes en un contexto de canal comparten una sola sesión (úsalo solo cuando el contexto compartido sea intencional).
- **`dmScope`**: cómo se agrupan los DM.
  - `main`: todos los DM comparten la sesión principal.
  - `per-peer`: aísla por id de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ids canónicos a peers con prefijo de proveedor para compartir sesiones entre canales.
- **`reset`**: política principal de reinicio. `daily` reinicia a `atHour` hora local; `idle` reinicia tras `idleMinutes`. Cuando ambas están configuradas, gana la que caduque primero.
- **`resetByType`**: sobrescrituras por tipo (`direct`, `group`, `thread`). Se acepta `dm` heredado como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` de la sesión padre permitido al crear una sesión de hilo bifurcada (predeterminado `100000`).
  - Si `totalTokens` del padre supera este valor, OpenClaw inicia una nueva sesión de hilo en lugar de heredar el historial de transcripción del padre.
  - Establece `0` para deshabilitar esta protección y permitir siempre la bifurcación desde el padre.
- **`mainKey`**: campo heredado. El tiempo de ejecución siempre usa `"main"` para el bucket principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de respuesta mutua entre agentes durante intercambios agente a agente (entero, rango: `0`–`5`). `0` deshabilita el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Gana la primera regla deny.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `warn` solo emite advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`).
  - `rotateBytes`: rota `sessions.json` cuando supera este tamaño (predeterminado `10mb`).
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. Por defecto usa `pruneAfter`; establece `false` para deshabilitar.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. Por defecto es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden sobrescribirlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desfoco automático predeterminado por inactividad en horas (`0` deshabilita; los proveedores pueden sobrescribirlo)
  - `maxAgeHours`: antigüedad máxima rígida predeterminada en horas (`0` deshabilita; los proveedores pueden sobrescribirlo)

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // o "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 deshabilita
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

Resolución (gana el más específico): cuenta → canal → global. `""` deshabilita y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción             | Ejemplo                     |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor    | `anthropic`                 |
| `{thinkingLevel}` | Nivel actual de thinking | `high`, `low`, `off`       |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)   |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- Usa por defecto `identity.emoji` del agente activo; en caso contrario `"👀"`. Establece `""` para deshabilitar.
- Sobrescrituras por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → alternativa desde identity.
- Alcance: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina la confirmación tras responder en Slack, Discord y Telegram.
- `messages.statusReactions.enabled`: habilita reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, dejarlo sin definir mantiene habilitadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Telegram, establécelo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.

### Debounce de entrada

Agrupa mensajes rápidos solo de texto del mismo remitente en un único turno del agente. Los medios/adjuntos se vacían inmediatamente. Los comandos de control omiten el debounce.

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla el modo predeterminado de TTS automático: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede sobrescribir las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` sobrescribe `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado por defecto; `modelOverrides.allowProvider` usa por defecto `false` (requiere habilitación explícita).
- Las claves API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- `openai.baseUrl` sobrescribe el endpoint TTS de OpenAI. El orden de resolución es config, luego `OPENAI_TTS_BASE_URL`, luego `https://api.openai.com/v1`.
- Cuando `openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Talk

Valores predeterminados para el modo Talk (macOS/iOS/Android).

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves heredadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad y se migran automáticamente a `talk.providers.<provider>`.
- Los IDs de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas en texto plano o objetos SecretRef.
- La alternativa `ELEVENLABS_API_KEY` se aplica solo cuando no hay una clave API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres amigables.
- `silenceTimeoutMs` controla cuánto espera el modo Talk después del silencio del usuario antes de enviar la transcripción. Si no se define, mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
