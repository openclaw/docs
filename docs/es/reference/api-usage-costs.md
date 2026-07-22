---
read_when:
    - Quiere saber qué funciones pueden llamar a API de pago
    - Es necesario auditar las claves, los costes y la visibilidad del uso
    - Estás explicando los informes de costes de /status o /usage
summary: Audita qué puede generar gastos, qué claves se utilizan y cómo consultar el uso
title: Uso y costes de la API
x-i18n:
    generated_at: "2026-07-22T10:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22caad8b8fa168739563223b3663a04adceeef7e83576a53dc9cdf885a35750d
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mapa de las funciones de OpenClaw que pueden llamar a API de proveedores de pago, dónde lee cada una sus credenciales y dónde aparece el coste resultante.

## Dónde aparecen los costes

**`/status`** (instantánea por sesión)

- Muestra el modelo de la sesión actual, el uso del contexto y los tokens de la última respuesta.
- Añade un **coste estimado** para la última respuesta cuando OpenClaw dispone de metadatos de uso y precios locales para el modelo activo, incluidos proveedores sin clave de API con precios explícitos, como los modelos `aws-sdk` de Bedrock.
- Si la instantánea de la sesión activa contiene pocos datos, `/status` recupera los contadores de tokens/caché y la etiqueta del modelo activo de la entrada de uso más reciente de la transcripción. Los valores activos existentes distintos de cero prevalecen sobre los datos de la transcripción; un total de transcripción del tamaño del prompt aún puede prevalecer cuando el total almacenado falta o es menor.

**`/usage`** (pie por mensaje)

- `/usage full` añade un pie de uso a cada respuesta, incluido el **coste estimado** cuando se han configurado precios locales y hay metadatos de uso disponibles.
- `/usage tokens` muestra solo los tokens. Los entornos de ejecución de CLI y OAuth/token de tipo suscripción muestran solo los tokens, salvo que proporcionen metadatos de uso compatibles y un precio local explícito.
- `/usage cost` imprime un resumen local de costes; `/usage off` desactiva el pie.
- Nota sobre Gemini CLI: tanto la salida `stream-json` como la heredada `json` incluyen el uso en `stats`. OpenClaw normaliza `stats.cached` como `cacheRead` y deriva los tokens de entrada de `stats.input_tokens - stats.cached` cuando es necesario.

**Interfaz de control → Uso** (análisis entre sesiones)

- Muestra los totales de tokens y costes estimados derivados de las transcripciones para el intervalo de fechas seleccionado, con desgloses por proveedor, modelo, agente, canal y tipo de token.
- Compara ventanas de calendario más cortas que terminan en la fecha final del intervalo seleccionado. Las fechas ausentes cuentan como días naturales con uso cero; no se omiten para crear una ventana más densa.
- Etiqueta directamente la escala del gráfico diario. Una insignia `√` significa que la compresión por raíz cuadrada mantiene visibles los días de poco uso.
- Estos totales describen el historial de sesiones local disponible, no una factura del proveedor ni un registro de facturación acumulado. La interfaz avisa cuando faltan precios para algunas entradas.

**Ventanas de uso de la CLI** (cuotas del proveedor, no coste por mensaje)

- `openclaw status --usage` y `openclaw channels list` muestran las **ventanas de uso** del proveedor como `X% left`.
- Proveedores actuales de ventanas de uso: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (incluye la autenticación OAuth/token de ChatGPT/Codex), Xiaomi y z.ai. Consulte [CLI de modelos](/es/cli/models) y [CLI de canales](/es/cli/channels) para ver la lista completa de proveedores y opciones.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax indican la cuota restante, por lo que OpenClaw los invierte; los campos basados en recuentos prevalecen cuando están presentes. Si la respuesta incluye una matriz `model_remains`, OpenClaw selecciona la entrada del modelo de chat, deriva la etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso procede de enlaces específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a las credenciales OAuth/clave de API coincidentes de los perfiles de autenticación, el entorno o la configuración.

Consulte [Uso de tokens y costes](/es/reference/token-use) para ver ejemplos detallados.

<Note>
Anthropic ha confirmado que la reutilización de Claude CLI (incluido `claude -p`) es un patrón de integración autorizado, salvo que publique una nueva política. Anthropic no ofrece una estimación monetaria por mensaje, por lo que `/usage full` no puede mostrar el coste del uso de Claude CLI.
</Note>

## Cómo se detectan las claves

- **Perfiles de autenticación**: por agente, almacenados en `auth-profiles.json`.
- **Variables de entorno**: por ejemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuración**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memory.search.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, que puede exportar la clave al entorno del proceso de la skill.

## Funciones que pueden consumir claves

### Respuestas del modelo principal (chat + herramientas)

Cada respuesta o llamada a herramienta se ejecuta en el proveedor del modelo actual. Esta es la principal fuente de uso y costes, incluidos los planes alojados de tipo suscripción que facturan fuera de la interfaz local de OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan y la vía de inicio de sesión de Claude de Anthropic con Extra Usage activado.

Consulte [Modelos](/es/providers/models) para la configuración de precios y [Uso de tokens y costes](/es/reference/token-use) para la visualización.

### Comprensión multimedia (audio/imagen/vídeo)

Los contenidos multimedia entrantes se pueden resumir o transcribir mediante la API de un proveedor antes de que se ejecute el pipeline de respuesta. La compatibilidad con proveedores se registra por Plugin y cambia a medida que se añaden plugins; consulte [Comprensión multimedia](/es/nodes/media-understanding) para conocer la lista y la configuración actuales.

### Generación de imágenes y vídeos

`image_generate` y `video_generate` se dirigen a cualquier proveedor autenticado que esté disponible. Ambos pueden inferir un proveedor predeterminado respaldado por autenticación cuando su entrada `agents.defaults.mediaModels` no está configurada.

Consulte [Generación de imágenes](/es/tools/image-generation) y [Generación de vídeos](/es/tools/video-generation) para conocer la lista actual de proveedores.

### Incrustaciones de memoria y búsqueda semántica

La búsqueda semántica en memoria utiliza API de incrustaciones cuando `memory.search.provider` designa un adaptador remoto (por ejemplo, `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memory.search.provider = "lmstudio"` o `"ollama"` se ejecutan en un servidor local o autoalojado y, por lo general, no generan facturación de alojamiento. `memory.search.provider = "local"` mantiene todo en el dispositivo sin usar API. Un proveedor `memory.search.fallback` opcional puede cubrir los fallos de incrustación local.

Consulte [Memoria](/es/concepts/memory).

### Herramienta de búsqueda web

`web_search` puede generar cargos de uso en función del proveedor seleccionado. Cada proveedor lee primero su clave de una variable de entorno y después de `plugins.entries.<id>.config.webSearch.apiKey`:

| Proveedor              | Variable(s) de entorno                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                     |
| DuckDuckGo             | sin clave; no oficial, basado en HTML, sin facturación                                                                                                                 |
| Exa                    | `EXA_API_KEY`                                                                                                                                                     |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                     |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                     |
| Grok (xAI)             | perfil OAuth de xAI o `XAI_API_KEY`                                                                                                                               |
| Kimi (Moonshot)        | `KIMI_API_KEY` o `MOONSHOT_API_KEY`                                                                                                                               |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY`                                                                                       |
| Ollama Web Search      | sin clave para un host local accesible con sesión iniciada; la búsqueda directa de `https://ollama.com` usa `OLLAMA_API_KEY`; los hosts protegidos por autenticación reutilizan la autenticación de portador normal del proveedor Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`                                                                                                                               |
| SearXNG                | `SEARXNG_BASE_URL`; sin clave/autoalojado, sin facturación de alojamiento                                                                                              |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                     |

Las rutas de configuración heredadas `tools.web.search.*` siguen cargándose mediante una capa de compatibilidad, pero ya no son la superficie recomendada.

**Crédito gratuito de Brave Search**: cada plan incluye $5/mes de crédito gratuito renovable. El plan Search cuesta $5 por cada 1,000 solicitudes, por lo que el crédito cubre 1,000 solicitudes/mes sin coste. Establezca un límite de uso en el panel de Brave para evitar cargos inesperados.

Consulte [Herramientas web](/es/tools/web).

### Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a Firecrawl con acceso inicial sin clave; añada `FIRECRAWL_API_KEY` (o `plugins.entries.firecrawl.config.webFetch.apiKey`) para obtener límites más altos. Si Firecrawl no está configurado, la herramienta recurre a la obtención directa más el Plugin `web-readability` incluido (sin API de pago). Desactive `plugins.entries.web-readability.enabled` para omitir la extracción local mediante Readability.

Consulte [Herramientas web](/es/tools/web).

### Instantáneas de uso del proveedor (estado/salud)

`openclaw status --usage` y `openclaw models status --json` llaman a los endpoints de uso del proveedor para mostrar las ventanas de cuota o el estado de la autenticación. Las llamadas tienen un volumen bajo, pero aun así acceden a las API del proveedor.

Consulte [CLI de modelos](/es/cli/models).

### Resumen preventivo de Compaction

El mecanismo preventivo de Compaction puede resumir el historial de la sesión mediante el modelo actual, lo que invoca las API del proveedor cuando se ejecuta.

Consulte [Gestión de sesiones y Compaction](/es/reference/session-management-compaction).

### Exploración / sondeo de modelos

`openclaw models scan` puede sondear modelos de OpenRouter y utiliza `OPENROUTER_API_KEY` cuando el sondeo está activado.

Consulte [CLI de modelos](/es/cli/models).

### Conversación (voz)

El modo de conversación puede invocar ElevenLabs cuando está configurado: `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`.

Consulte [Modo de conversación](/es/nodes/talk).

### Skills (API de terceros)

Las Skills pueden almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una skill utiliza esa clave con una API externa, el coste corresponde al proveedor de la skill.

Consulte [Skills](/es/tools/skills).

## Relacionado

- [Uso de tokens y costes](/es/reference/token-use)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento del uso](/es/concepts/usage-tracking)
