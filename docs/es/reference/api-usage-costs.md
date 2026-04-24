---
read_when:
    - Quieres entender qué funciones pueden llamar APIs de pago
    - Necesitas auditar claves, costes y visibilidad del uso
    - Estás explicando el informe de costes de /status o /usage
summary: Auditar qué puede gastar dinero, qué claves se usan y cómo ver el uso
title: Uso y costes de API
x-i18n:
    generated_at: "2026-04-24T05:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Uso y costes de API

Este documento enumera las **funciones que pueden invocar claves API** y dónde aparecen sus costes. Se centra en las funciones de OpenClaw que pueden generar uso de proveedor o llamadas de API de pago.

## Dónde aparecen los costes (chat + CLI)

**Instantánea de coste por sesión**

- `/status` muestra el modelo actual de la sesión, uso de contexto y los tokens de la última respuesta.
- Si el modelo usa **autenticación con clave API**, `/status` también muestra el **coste estimado** de la última respuesta.
- Si los metadatos de la sesión en vivo son escasos, `/status` puede recuperar contadores
  de tokens/caché y la etiqueta activa del modelo de tiempo de ejecución desde la última entrada de uso de la transcripción. Los valores vivos existentes no nulos siguen teniendo prioridad, y los totales de transcripción del tamaño del prompt pueden prevalecer cuando los totales almacenados faltan o son menores.

**Pie de coste por mensaje**

- `/usage full` agrega un pie de uso a cada respuesta, incluido el **coste estimado** (solo con clave API).
- `/usage tokens` muestra solo tokens; los flujos OAuth/token estilo suscripción y los flujos CLI ocultan el coste en dólares.
- Nota sobre Gemini CLI: cuando la CLI devuelve salida JSON, OpenClaw lee el uso desde
  `stats`, normaliza `stats.cached` en `cacheRead` y deriva los tokens de entrada
  desde `stats.input_tokens - stats.cached` cuando hace falta.

Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw vuelve a estar permitido, por lo que OpenClaw considera autorizados para esta integración la reutilización de Claude CLI y `claude -p`, salvo que Anthropic publique una nueva política.
Anthropic sigue sin exponer una estimación en dólares por mensaje que OpenClaw pueda
mostrar en `/usage full`.

**Ventanas de uso de CLI (cuotas del proveedor)**

- `openclaw status --usage` y `openclaw channels list` muestran **ventanas de uso**
  del proveedor (instantáneas de cuota, no costes por mensaje).
- La salida legible para humanos se normaliza como `X% left` entre proveedores.
- Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.
- Nota sobre MiniMax: sus campos brutos `usage_percent` / `usagePercent` significan cuota restante, así que OpenClaw los invierte antes de mostrarlos. Los campos basados en recuento siguen teniendo prioridad cuando están presentes. Si el proveedor devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana a partir de marcas de tiempo cuando hace falta e incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso para esas ventanas de cuota proviene de hooks específicos del proveedor cuando están disponibles; en caso contrario, OpenClaw recurre a la coincidencia de credenciales OAuth/clave API desde perfiles de autenticación, entorno o configuración.

Consulta [Uso de tokens y costes](/es/reference/token-use) para ver detalles y ejemplos.

## Cómo se descubren las claves

OpenClaw puede recoger credenciales desde:

- **Perfiles de autenticación** (por agente, almacenados en `auth-profiles.json`).
- **Variables de entorno** (por ejemplo `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuración** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) que pueden exportar claves al entorno del proceso de la Skill.

## Funciones que pueden gastar claves

### 1) Respuestas del modelo central (chat + herramientas)

Cada respuesta o llamada de herramienta usa el **proveedor del modelo actual** (OpenAI, Anthropic, etc.). Esta es la
fuente principal de uso y coste.

Esto también incluye proveedores alojados de estilo suscripción que siguen facturando fuera
de la IU local de OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** y
la ruta de login Claude de Anthropic en OpenClaw con **Extra Usage** habilitado.

Consulta [Models](/es/providers/models) para configuración de precios y [Uso de tokens y costes](/es/reference/token-use) para visualización.

### 2) Comprensión de medios (audio/imagen/video)

Los medios entrantes pueden resumirse/transcribirse antes de ejecutar la respuesta. Esto usa APIs de modelos/proveedores.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Imagen: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / z.ai.
- Video: Google / Qwen / Moonshot.

Consulta [Media understanding](/es/nodes/media-understanding).

### 3) Generación de imágenes y video

Las capacidades compartidas de generación también pueden gastar claves de proveedor:

- Generación de imágenes: OpenAI / Google / fal / MiniMax
- Generación de video: Qwen

La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando
`agents.defaults.imageGenerationModel` no está definido. La generación de video actualmente
requiere un `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulta [Image generation](/es/tools/image-generation), [Qwen Cloud](/es/providers/qwen)
y [Models](/es/concepts/models).

### 4) Embeddings de memoria + búsqueda semántica

La búsqueda semántica en memoria usa **APIs de embeddings** cuando se configura para proveedores remotos:

- `memorySearch.provider = "openai"` → embeddings de OpenAI
- `memorySearch.provider = "gemini"` → embeddings de Gemini
- `memorySearch.provider = "voyage"` → embeddings de Voyage
- `memorySearch.provider = "mistral"` → embeddings de Mistral
- `memorySearch.provider = "lmstudio"` → embeddings de LM Studio (local/autoalojado)
- `memorySearch.provider = "ollama"` → embeddings de Ollama (local/autoalojado; normalmente sin facturación de API alojada)
- Fallback opcional a un proveedor remoto si fallan los embeddings locales

Puedes mantenerlo local con `memorySearch.provider = "local"` (sin uso de API).

Consulta [Memory](/es/concepts/memory).

### 5) Herramienta web search

`web_search` puede generar cargos de uso según tu proveedor:

- **Brave Search API**: `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sin clave por defecto, pero requiere un host Ollama accesible más `ollama signin`; también puede reutilizar la autenticación bearer normal del proveedor Ollama cuando el host la requiere
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback sin clave (sin facturación de API, pero no oficial y basado en HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (sin clave/autoalojado; sin facturación de API alojada)

Las rutas heredadas de proveedor `tools.web.search.*` siguen cargándose mediante el shim temporal de compatibilidad, pero ya no son la superficie recomendada de configuración.

**Crédito gratuito de Brave Search:** cada plan de Brave incluye \$5/mes de crédito gratuito renovable. El plan Search cuesta \$5 por 1.000 solicitudes, por lo que el crédito cubre 1.000 solicitudes/mes sin cargo. Establece tu límite de uso en el panel de Brave para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### 5) Herramienta web fetch (Firecrawl)

`web_fetch` puede llamar a **Firecrawl** cuando hay una clave API presente:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl no está configurado, la herramienta recurre a fetch directo + readability (sin API de pago).

Consulta [Herramientas web](/es/tools/web).

### 6) Instantáneas de uso del proveedor (status/health)

Algunos comandos de estado llaman a **endpoints de uso del proveedor** para mostrar ventanas de cuota o estado de autenticación.
Suelen ser llamadas de poco volumen, pero aun así tocan APIs del proveedor:

- `openclaw status --usage`
- `openclaw models status --json`

Consulta [Models CLI](/es/cli/models).

### 7) Resumen de Compaction safeguard

La protección Compaction puede resumir el historial de sesión usando el **modelo actual**, lo que
invoca APIs de proveedor cuando se ejecuta.

Consulta [Gestión de sesiones + Compaction](/es/reference/session-management-compaction).

### 8) Escaneo / probe de modelo

`openclaw models scan` puede sondear modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando
el sondeo está habilitado.

Consulta [Models CLI](/es/cli/models).

### 9) Talk (voz)

El modo Talk puede invocar **ElevenLabs** cuando está configurado:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Consulta [Modo Talk](/es/nodes/talk).

### 10) Skills (APIs de terceros)

Las Skills pueden almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una Skill usa esa clave para APIs externas,
puede generar costes según el proveedor de la Skill.

Consulta [Skills](/es/tools/skills).

## Relacionado

- [Uso de tokens y costes](/es/reference/token-use)
- [Prompt Caching](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)
