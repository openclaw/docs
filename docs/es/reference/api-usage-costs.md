---
read_when:
    - Quieres entender qué funciones pueden llamar a APIs de pago
    - Necesitas auditar las claves, los costos y la visibilidad del uso
    - Estás explicando los informes de costos de `/status` o `/usage`
summary: Audita qué puede generar gastos, qué claves se usan y cómo ver el uso
title: Uso y costos de la API
x-i18n:
    generated_at: "2026-04-13T08:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5077e74d38ef781ac7a72603e9f9e3829a628b95c5a9967915ab0f321565429
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Uso y costos de la API

Este documento enumera las **funciones que pueden invocar claves de API** y dónde aparecen sus costos. Se centra en las
funciones de OpenClaw que pueden generar uso del proveedor o llamadas a APIs de pago.

## Dónde aparecen los costos (chat + CLI)

**Instantánea de costos por sesión**

- `/status` muestra el modelo actual de la sesión, el uso de contexto y los tokens de la última respuesta.
- Si el modelo usa **autenticación con clave de API**, `/status` también muestra el **costo estimado** de la última respuesta.
- Si los metadatos de la sesión en vivo son escasos, `/status` también puede recuperar los
  contadores de tokens/caché y la etiqueta del modelo activo en tiempo de ejecución desde la entrada de uso
  más reciente de la transcripción. Los valores en vivo distintos de cero existentes siguen teniendo prioridad, y los totales
  de la transcripción ajustados al prompt pueden prevalecer cuando los totales almacenados faltan o son menores.

**Pie de costos por mensaje**

- `/usage full` agrega un pie de uso a cada respuesta, incluido el **costo estimado** (solo con clave de API).
- `/usage tokens` muestra solo tokens; los flujos de OAuth/token de estilo suscripción y CLI ocultan el costo en dólares.
- Nota de Gemini CLI: cuando la CLI devuelve salida JSON, OpenClaw lee el uso desde
  `stats`, normaliza `stats.cached` a `cacheRead`, y deriva los tokens de entrada
  de `stats.input_tokens - stats.cached` cuando es necesario.

Nota de Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw
vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como
autorizados para esta integración, a menos que Anthropic publique una nueva política.
Anthropic sigue sin exponer una estimación en dólares por mensaje que OpenClaw pueda
mostrar en `/usage full`.

**Ventanas de uso de la CLI (cuotas del proveedor)**

- `openclaw status --usage` y `openclaw channels list` muestran las **ventanas de uso**
  del proveedor (instantáneas de cuota, no costos por mensaje).
- La salida legible se normaliza a `X% left` entre proveedores.
- Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.
- Nota de MiniMax: sus campos sin procesar `usage_percent` / `usagePercent` significan
  cuota restante, así que OpenClaw los invierte antes de mostrarlos. Los campos basados en recuento siguen teniendo prioridad
  cuando están presentes. Si el proveedor devuelve `model_remains`, OpenClaw prefiere la entrada
  del modelo de chat, deriva la etiqueta de la ventana a partir de marcas de tiempo cuando es necesario e
  incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso para esas ventanas de cuota proviene de hooks específicos del proveedor cuando
  están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/con clave de API
  coincidentes desde perfiles de autenticación, variables de entorno o configuración.

Consulta [Uso de tokens y costos](/es/reference/token-use) para ver detalles y ejemplos.

## Cómo se descubren las claves

OpenClaw puede recoger credenciales desde:

- **Perfiles de autenticación** (por agente, almacenados en `auth-profiles.json`).
- **Variables de entorno** (por ejemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuración** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), que pueden exportar claves al entorno del proceso de la Skill.

## Funciones que pueden gastar claves

### 1) Respuestas del modelo principal (chat + herramientas)

Cada respuesta o llamada a herramienta usa el **proveedor del modelo actual** (OpenAI, Anthropic, etc.). Esta es la
fuente principal de uso y costo.

Esto también incluye proveedores alojados de estilo suscripción que siguen facturando fuera de
la interfaz local de OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** y
la ruta Claude con inicio de sesión de OpenClaw de Anthropic con **Extra Usage** activado.

Consulta [Modelos](/es/providers/models) para la configuración de precios y [Uso de tokens y costos](/es/reference/token-use) para la visualización.

### 2) Comprensión multimedia (audio/imagen/video)

Los medios entrantes pueden resumirse/transcribirse antes de que se ejecute la respuesta. Esto usa APIs de modelo/proveedor.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Imagen: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Consulta [Comprensión multimedia](/es/nodes/media-understanding).

### 3) Generación de imágenes y video

Las capacidades compartidas de generación también pueden gastar claves del proveedor:

- Generación de imágenes: OpenAI / Google / fal / MiniMax
- Generación de video: Qwen

La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando
`agents.defaults.imageGenerationModel` no está configurado. La generación de video actualmente
requiere un `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulta [Generación de imágenes](/es/tools/image-generation), [Qwen Cloud](/es/providers/qwen)
y [Modelos](/es/concepts/models).

### 4) Embeddings de memoria + búsqueda semántica

La búsqueda semántica de memoria usa **APIs de embeddings** cuando se configura para proveedores remotos:

- `memorySearch.provider = "openai"` → embeddings de OpenAI
- `memorySearch.provider = "gemini"` → embeddings de Gemini
- `memorySearch.provider = "voyage"` → embeddings de Voyage
- `memorySearch.provider = "mistral"` → embeddings de Mistral
- `memorySearch.provider = "lmstudio"` → embeddings de LM Studio (local/alojado por cuenta propia)
- `memorySearch.provider = "ollama"` → embeddings de Ollama (local/alojado por cuenta propia; normalmente sin facturación de API alojada)
- Respaldo opcional a un proveedor remoto si fallan los embeddings locales

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
- **Ollama Web Search**: sin clave de forma predeterminada, pero requiere un host de Ollama accesible más `ollama signin`; también puede reutilizar la autenticación bearer normal del proveedor Ollama cuando el host la requiere
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: respaldo sin clave (sin facturación de API, pero no oficial y basado en HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (sin clave/alojado por cuenta propia; sin facturación de API alojada)

Las rutas heredadas `tools.web.search.*` del proveedor todavía se cargan mediante la capa de compatibilidad temporal, pero ya no son la superficie de configuración recomendada.

**Crédito gratuito de Brave Search:** cada plan de Brave incluye \$5/mes en crédito gratuito renovable.
El plan Search cuesta \$5 por cada 1.000 solicitudes, así que el crédito cubre
1.000 solicitudes/mes sin cargo. Configura tu límite de uso en el panel de Brave
para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### 5) Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a **Firecrawl** cuando hay una clave de API presente:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl no está configurado, la herramienta recurre a fetch directo + readability (sin API de pago).

Consulta [Herramientas web](/es/tools/web).

### 6) Instantáneas de uso del proveedor (estado/salud)

Algunos comandos de estado llaman a **endpoints de uso del proveedor** para mostrar ventanas de cuota o salud de autenticación.
Normalmente son llamadas de bajo volumen, pero igualmente acceden a APIs del proveedor:

- `openclaw status --usage`
- `openclaw models status --json`

Consulta [CLI de modelos](/cli/models).

### 7) Resumen de protección de Compaction

La protección de Compaction puede resumir el historial de la sesión usando el **modelo actual**, lo que
invoca APIs del proveedor cuando se ejecuta.

Consulta [Gestión de sesiones + compaction](/es/reference/session-management-compaction).

### 8) Escaneo / sondeo de modelos

`openclaw models scan` puede sondear modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando
el sondeo está habilitado.

Consulta [CLI de modelos](/cli/models).

### 9) Talk (voz)

El modo Talk puede invocar **ElevenLabs** cuando está configurado:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Consulta [Modo Talk](/es/nodes/talk).

### 10) Skills (APIs de terceros)

Las Skills pueden almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una Skill usa esa clave para APIs externas,
puede generar costos según el proveedor de la Skill.

Consulta [Skills](/es/tools/skills).
