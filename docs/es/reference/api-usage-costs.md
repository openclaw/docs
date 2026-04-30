---
read_when:
    - Quieres comprender qué funcionalidades pueden invocar API de pago
    - Debe auditar las claves, los costos y la visibilidad del uso
    - Estás explicando los informes de costos de /status o /usage
summary: Audita qué puede gastar dinero, qué claves se usan y cómo ver el uso
title: Uso de la API y costos
x-i18n:
    generated_at: "2026-04-30T06:00:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# Uso y costos de API

Este documento enumera **funciones que pueden invocar claves de API** y dónde aparecen sus costos. Se centra en
funciones de OpenClaw que pueden generar uso de proveedores o llamadas a API pagadas.

## Dónde aparecen los costos (chat + CLI)

**Instantánea de costo por sesión**

- `/status` muestra el modelo de la sesión actual, el uso de contexto y los tokens de la última respuesta.
- Si el modelo usa **autenticación con clave de API**, `/status` también muestra el **costo estimado** de la última respuesta.
- Si los metadatos de la sesión en vivo son escasos, `/status` puede recuperar contadores de tokens/caché
  y la etiqueta del modelo de runtime activo desde la entrada de uso más reciente de la transcripción.
  Los valores en vivo no nulos existentes siguen teniendo prioridad, y los totales de transcripción
  del tamaño del prompt pueden ganar cuando faltan los totales almacenados o son menores.

**Pie de costo por mensaje**

- `/usage full` añade un pie de uso a cada respuesta, incluido el **costo estimado** (solo clave de API).
- `/usage tokens` muestra solo tokens; los flujos de OAuth/token y CLI de estilo suscripción ocultan el costo en dólares.
- Nota sobre Gemini CLI: cuando la CLI devuelve salida JSON, OpenClaw lee el uso desde
  `stats`, normaliza `stats.cached` a `cacheRead` y deriva los tokens de entrada
  desde `stats.input_tokens - stats.cached` cuando es necesario.

Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw
vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como
autorizados para esta integración salvo que Anthropic publique una política nueva.
Anthropic aún no expone una estimación en dólares por mensaje que OpenClaw pueda
mostrar en `/usage full`.

**Ventanas de uso de CLI (cuotas de proveedores)**

- `openclaw status --usage` y `openclaw channels list` muestran **ventanas de uso** de proveedores
  (instantáneas de cuota, no costos por mensaje).
- La salida legible para humanos se normaliza como `X% left` en todos los proveedores.
- Proveedores actuales de ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.
- Nota sobre MiniMax: sus campos sin procesar `usage_percent` / `usagePercent` significan cuota restante,
  por lo que OpenClaw los invierte antes de mostrarlos. Los campos basados en conteo siguen teniendo prioridad
  cuando están presentes. Si el proveedor devuelve `model_remains`, OpenClaw prefiere la entrada
  del modelo de chat, deriva la etiqueta de la ventana a partir de marcas de tiempo cuando es necesario e
  incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso para esas ventanas de cuota proviene de hooks específicos del proveedor cuando
  están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes
  desde perfiles de autenticación, entorno o configuración.

Consulta [Uso de tokens y costos](/es/reference/token-use) para ver detalles y ejemplos.

## Cómo se descubren las claves

OpenClaw puede recoger credenciales desde:

- **Perfiles de autenticación** (por agente, almacenados en `auth-profiles.json`).
- **Variables de entorno** (p. ej., `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuración** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), que pueden exportar claves al entorno del proceso de la skill.

## Funciones que pueden gastar claves

### 1) Respuestas del modelo central (chat + herramientas)

Cada respuesta o llamada a herramienta usa el **proveedor de modelo actual** (OpenAI, Anthropic, etc.). Esta es la
fuente principal de uso y costo.

Esto también incluye proveedores alojados de estilo suscripción que igualmente facturan fuera
de la UI local de OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** y
la ruta de inicio de sesión Claude de OpenClaw en Anthropic con **Extra Usage** habilitado.

Consulta [Modelos](/es/providers/models) para la configuración de precios y [Uso de tokens y costos](/es/reference/token-use) para la visualización.

### 2) Comprensión de medios (audio/imagen/video)

Los medios entrantes pueden resumirse/transcribirse antes de que se ejecute la respuesta. Esto usa API de modelos/proveedores.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Imagen: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Consulta [Comprensión de medios](/es/nodes/media-understanding).

### 3) Generación de imágenes y video

Las capacidades de generación compartidas también pueden gastar claves de proveedores:

- Generación de imágenes: OpenAI / Google / DeepInfra / fal / MiniMax
- Generación de video: DeepInfra / Qwen

La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando
`agents.defaults.imageGenerationModel` no está definido. La generación de video actualmente
requiere un `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulta [Generación de imágenes](/es/tools/image-generation), [Qwen Cloud](/es/providers/qwen)
y [Modelos](/es/concepts/models).

### 4) Embeddings de memoria + búsqueda semántica

La búsqueda semántica en memoria usa **API de embeddings** cuando está configurada para proveedores remotos:

- `memorySearch.provider = "openai"` → embeddings de OpenAI
- `memorySearch.provider = "gemini"` → embeddings de Gemini
- `memorySearch.provider = "voyage"` → embeddings de Voyage
- `memorySearch.provider = "mistral"` → embeddings de Mistral
- `memorySearch.provider = "deepinfra"` → embeddings de DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings de LM Studio (local/autoalojado)
- `memorySearch.provider = "ollama"` → embeddings de Ollama (local/autoalojado; normalmente sin facturación de API alojada)
- Reserva opcional a un proveedor remoto si fallan los embeddings locales

Puedes mantenerlo local con `memorySearch.provider = "local"` (sin uso de API).

Consulta [Memoria](/es/concepts/memory).

### 5) Herramienta de búsqueda web

`web_search` puede generar cargos de uso según tu proveedor:

- **Brave Search API**: `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sin clave para un host local Ollama accesible con sesión iniciada; la búsqueda directa en `https://ollama.com` usa `OLLAMA_API_KEY`, y los hosts protegidos por autenticación pueden reutilizar la autenticación bearer normal del proveedor Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: reserva sin clave (sin facturación de API, pero no oficial y basada en HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (sin clave/autoalojado; sin facturación de API alojada)

Las rutas de proveedor heredadas `tools.web.search.*` aún se cargan mediante el shim de compatibilidad temporal, pero ya no son la superficie de configuración recomendada.

**Crédito gratuito de Brave Search:** Cada plan de Brave incluye \$5/mes en crédito gratuito renovable. El plan Search cuesta \$5 por 1.000 solicitudes, por lo que el crédito cubre 1.000 solicitudes/mes sin cargo. Configura tu límite de uso en el panel de Brave para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### 5) Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a **Firecrawl** cuando hay una clave de API presente:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl no está configurado, la herramienta recurre a fetch directo más el plugin incluido `web-readability` (sin API pagada). Deshabilita `plugins.entries.web-readability.enabled` para omitir la extracción local de Readability.

Consulta [Herramientas web](/es/tools/web).

### 6) Instantáneas de uso de proveedores (estado/salud)

Algunos comandos de estado llaman a **endpoints de uso de proveedores** para mostrar ventanas de cuota o salud de autenticación.
Normalmente son llamadas de bajo volumen, pero aun así llegan a las API de proveedores:

- `openclaw status --usage`
- `openclaw models status --json`

Consulta [CLI de modelos](/es/cli/models).

### 7) Resumen de salvaguarda de Compaction

La salvaguarda de Compaction puede resumir el historial de sesión usando el **modelo actual**, lo que
invoca API de proveedores cuando se ejecuta.

Consulta [Gestión de sesión + Compaction](/es/reference/session-management-compaction).

### 8) Escaneo / sondeo de modelos

`openclaw models scan` puede sondear modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando
el sondeo está habilitado.

Consulta [CLI de modelos](/es/cli/models).

### 9) Talk (voz)

El modo Talk puede invocar **ElevenLabs** cuando está configurado:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Consulta [Modo Talk](/es/nodes/talk).

### 10) Skills (API de terceros)

Skills puede almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una skill usa esa clave para API externas,
puede generar costos según el proveedor de la skill.

Consulta [Skills](/es/tools/skills).

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)
