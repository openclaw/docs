---
read_when:
    - Quieres entender qué funciones pueden llamar a API de pago
    - Necesitas auditar claves, costos y visibilidad de uso
    - Estás explicando el informe de costos de /status o /usage
summary: Audita qué puede gastar dinero, qué claves se usan y cómo ver el uso
title: Uso y costos de la API
x-i18n:
    generated_at: "2026-07-06T10:53:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mapa de las funciones de OpenClaw que pueden llamar a API de proveedores de pago, dónde lee cada una sus credenciales y dónde aparece el coste resultante.

## Dónde aparecen los costes

**`/status`** (instantánea por sesión)

- Muestra el modelo de la sesión actual, el uso de contexto y los tokens de la última respuesta.
- Añade un **coste estimado** para la última respuesta cuando OpenClaw tiene metadatos de uso y precios locales para el modelo activo, incluidos proveedores sin clave de API con precio explícito, como los modelos Bedrock `aws-sdk`.
- Si la instantánea de la sesión en vivo es escasa, `/status` recupera los contadores de tokens/caché y la etiqueta del modelo activo desde la entrada de uso de la transcripción más reciente. Los valores en vivo existentes que no sean cero prevalecen sobre los datos de transcripción; un total de transcripción del tamaño de un prompt aún puede prevalecer cuando el total almacenado falta o es menor.

**`/usage`** (pie por mensaje)

- `/usage full` añade un pie de uso a cada respuesta, incluido el **coste estimado** cuando los precios locales están configurados y los metadatos de uso están disponibles.
- `/usage tokens` muestra solo tokens. Los runtimes de estilo suscripción con OAuth/token y CLI muestran solo tokens, salvo que proporcionen metadatos de uso compatibles y un precio local explícito.
- `/usage cost` imprime un resumen de coste local; `/usage off` desactiva el pie.
- Nota sobre Gemini CLI: tanto la salida `stream-json` como la salida heredada `json` incluyen el uso en `stats`. OpenClaw normaliza `stats.cached` en `cacheRead` y deriva los tokens de entrada a partir de `stats.input_tokens - stats.cached` cuando hace falta.

**Interfaz de Control → Uso** (análisis entre sesiones)

- Muestra totales de tokens y coste estimado derivados de transcripciones para el intervalo de fechas seleccionado, con desgloses por proveedor, modelo, agente, canal y tipo de token.
- Compara ventanas de calendario más cortas que terminan en la fecha final del intervalo seleccionado. Las fechas faltantes cuentan como días naturales con uso cero; no se omiten para crear una ventana más densa.
- Etiqueta directamente la escala del gráfico diario. Una insignia `√` significa que la compresión de raíz cuadrada mantiene visibles los días de bajo uso.
- Estos totales describen el historial de sesiones local disponible, no una factura del proveedor ni un libro mayor de facturación de por vida. La interfaz advierte cuando faltan precios para algunas entradas.

**Ventanas de uso de CLI** (cuotas de proveedor, no coste por mensaje)

- `openclaw status --usage` y `openclaw channels list` muestran las **ventanas de uso** del proveedor como `X% left`.
- Proveedores actuales con ventana de uso: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (cubre la autenticación OAuth/token de ChatGPT/Codex), Xiaomi y z.ai. Consulta [CLI de modelos](/es/cli/models) y [CLI de canales](/es/cli/channels) para ver la lista completa de proveedores/flags.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax informan la cuota restante, así que OpenClaw los invierte; los campos basados en recuento prevalecen cuando están presentes. Si la respuesta incluye un array `model_remains`, OpenClaw elige la entrada del modelo de chat, deriva la etiqueta de la ventana a partir de marcas de tiempo cuando hace falta e incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso proviene de hooks específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, env o configuración.

Consulta [Uso de tokens y costes](/es/reference/token-use) para ver ejemplos detallados.

<Note>
Anthropic ha confirmado que la reutilización de Claude CLI (incluido `claude -p`) es un patrón de integración autorizado salvo que publique una política nueva. Anthropic no expone una estimación en dólares por mensaje, por lo que `/usage full` no puede mostrar el coste del uso de Claude CLI.
</Note>

## Cómo se descubren las claves

- **Perfiles de autenticación**: por agente, almacenados en `auth-profiles.json`.
- **Variables de entorno**: por ejemplo `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuración**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, que puede exportar la clave al entorno del proceso de la skill.

## Funciones que pueden gastar claves

### Respuestas del modelo principal (chat + herramientas)

Cada respuesta o llamada a herramienta se ejecuta en el proveedor del modelo actual. Esta es la fuente principal de uso y coste, incluidos planes hospedados de estilo suscripción que facturan fuera de la interfaz local de OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan y la ruta de inicio de sesión de Claude de Anthropic con Extra Usage habilitado.

Consulta [Modelos](/es/providers/models) para la configuración de precios y [Uso de tokens y costes](/es/reference/token-use) para la visualización.

### Comprensión de medios (audio/imagen/vídeo)

Los medios entrantes pueden resumirse o transcribirse mediante una API de proveedor antes de que se ejecute el flujo de respuesta. La compatibilidad de proveedores se registra por plugin y cambia a medida que se añaden plugins; consulta [Comprensión de medios](/es/nodes/media-understanding) para ver la lista y la configuración actuales.

### Generación de imágenes y vídeo

`image_generate` y `video_generate` se enrutan al proveedor configurado que esté disponible. La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando `agents.defaults.imageGenerationModel` no está definido; la generación de vídeo requiere un `agents.defaults.videoGenerationModel` explícito (por ejemplo `qwen/wan2.6-t2v`).

Consulta [Generación de imágenes](/es/tools/image-generation) y [Generación de vídeo](/es/tools/video-generation) para ver la lista actual de proveedores.

### Embeddings de memoria y búsqueda semántica

La búsqueda semántica en memoria usa API de embeddings cuando `agents.defaults.memorySearch.provider` nombra un adaptador remoto (por ejemplo `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` o `"ollama"` se ejecuta contra un servidor local/autohospedado y normalmente no tiene facturación hospedada. `memorySearch.provider = "local"` mantiene todo en el dispositivo sin uso de API. Un proveedor opcional `memorySearch.fallback` puede cubrir fallos de embeddings locales.

Consulta [Memoria](/es/concepts/memory).

### Herramienta de búsqueda web

`web_search` puede generar cargos de uso según el proveedor seleccionado. Cada proveedor lee su clave primero desde una variable de entorno y luego desde `plugins.entries.<id>.config.webSearch.apiKey`:

| Proveedor              | Variable(s) de entorno                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                           |
| DuckDuckGo             | sin clave; no oficial, basado en HTML, sin facturación                                                                                                                                    |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                             |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                       |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                          |
| Grok (xAI)             | perfil OAuth de xAI o `XAI_API_KEY`                                                                                                                                                       |
| Kimi (Moonshot)        | `KIMI_API_KEY` o `MOONSHOT_API_KEY`                                                                                                                                                       |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY`                                                                                             |
| Ollama Web Search      | sin clave para un host local accesible con sesión iniciada; la búsqueda directa en `https://ollama.com` usa `OLLAMA_API_KEY`; los hosts protegidos por autenticación reutilizan la autenticación bearer normal del proveedor Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                        |
| Perplexity Search API  | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`                                                                                                                                               |
| SearXNG                | `SEARXNG_BASE_URL`; sin clave/autohospedado, sin facturación hospedada                                                                                                                    |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                          |

Las rutas de configuración heredadas `tools.web.search.*` todavía se cargan mediante un shim de compatibilidad, pero ya no son la superficie recomendada.

**Crédito gratuito de Brave Search**: cada plan incluye 5 USD/mes en crédito gratuito renovable. El plan Search cuesta 5 USD por 1000 solicitudes, por lo que el crédito cubre 1000 solicitudes/mes sin cargo. Define un límite de uso en el panel de Brave para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a Firecrawl con acceso inicial sin clave; añade `FIRECRAWL_API_KEY` (o `plugins.entries.firecrawl.config.webFetch.apiKey`) para límites más altos. Si Firecrawl no está configurado, la herramienta recurre a fetch directo más el plugin incluido `web-readability` (sin API de pago). Desactiva `plugins.entries.web-readability.enabled` para omitir la extracción local de Readability.

Consulta [Herramientas web](/es/tools/web).

### Instantáneas de uso de proveedores (estado/salud)

`openclaw status --usage` y `openclaw models status --json` llaman a endpoints de uso de proveedores para mostrar ventanas de cuota o salud de autenticación. Las llamadas son de bajo volumen, pero aun así llegan a las API del proveedor.

Consulta [CLI de modelos](/es/cli/models).

### Resumen de protección de Compaction

La protección de Compaction puede resumir el historial de sesión usando el modelo actual, lo que invoca API de proveedor cuando se ejecuta.

Consulta [Gestión de sesiones y Compaction](/es/reference/session-management-compaction).

### Escaneo / sondeo de modelos

`openclaw models scan` puede sondear modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando el sondeo está habilitado.

Consulta [CLI de modelos](/es/cli/models).

### Talk (voz)

El modo Talk puede invocar ElevenLabs cuando está configurado: `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`.

Consulta [Modo Talk](/es/nodes/talk).

### Skills (API de terceros)

Skills puede almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una skill usa esa clave contra una API externa, el coste sigue al proveedor de la skill.

Consulta [Skills](/es/tools/skills).

## Relacionado

- [Uso de tokens y costes](/es/reference/token-use)
- [Caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)
