---
read_when:
    - Quieres saber qué funciones pueden llamar a API de pago
    - Necesitas auditar las claves, los costes y la visibilidad del uso
    - Estás explicando los informes de costes de /status o /usage
summary: Audita qué puede generar gastos, qué claves se utilizan y cómo consultar el uso
title: Uso y costes de la API
x-i18n:
    generated_at: "2026-07-11T23:29:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mapa de las funciones de OpenClaw que pueden llamar a API de proveedores de pago, dónde lee cada una sus credenciales y dónde aparece el costo resultante.

## Dónde aparecen los costos

**`/status`** (instantánea por sesión)

- Muestra el modelo de la sesión actual, el uso del contexto y los tokens de la última respuesta.
- Añade un **costo estimado** para la última respuesta cuando OpenClaw dispone de metadatos de uso y precios locales para el modelo activo, incluidos proveedores sin clave de API cuyo precio se haya configurado explícitamente, como los modelos `aws-sdk` de Bedrock.
- Si la instantánea de la sesión activa contiene pocos datos, `/status` recupera los contadores de tokens/caché y la etiqueta del modelo activo de la entrada de uso más reciente de la transcripción. Los valores activos existentes distintos de cero prevalecen sobre los datos de la transcripción; un total de transcripción del tamaño del prompt aún puede prevalecer si el total almacenado falta o es menor.

**`/usage`** (pie de cada mensaje)

- `/usage full` añade un pie de uso a cada respuesta, incluido el **costo estimado** cuando hay precios locales configurados y metadatos de uso disponibles.
- `/usage tokens` solo muestra los tokens. Los entornos de ejecución de CLI y de OAuth/token basados en suscripción solo muestran los tokens, salvo que proporcionen metadatos de uso compatibles y un precio local explícito.
- `/usage cost` muestra un resumen local de costos; `/usage off` desactiva el pie.
- Nota sobre Gemini CLI: tanto la salida `stream-json` como la salida heredada `json` incluyen el uso en `stats`. OpenClaw normaliza `stats.cached` como `cacheRead` y, cuando es necesario, obtiene los tokens de entrada mediante `stats.input_tokens - stats.cached`.

**Interfaz de control → Uso** (análisis entre sesiones)

- Muestra los totales de tokens y costos estimados derivados de las transcripciones para el intervalo de fechas seleccionado, con desgloses por proveedor, modelo, agente, canal y tipo de token.
- Compara ventanas de calendario más cortas que terminan en la fecha de finalización del intervalo seleccionado. Las fechas sin datos cuentan como días naturales con uso cero; no se omiten para crear una ventana más densa.
- Etiqueta directamente la escala del gráfico diario. Una insignia `√` indica que la compresión mediante raíz cuadrada mantiene visibles los días de poco uso.
- Estos totales describen el historial de sesiones local disponible, no una factura del proveedor ni un registro de facturación de por vida. La interfaz advierte cuando faltan precios para algunas entradas.

**Ventanas de uso de la CLI** (cuotas del proveedor, no costo por mensaje)

- `openclaw status --usage` y `openclaw channels list` muestran las **ventanas de uso** del proveedor como `X% left`.
- Proveedores actuales de ventanas de uso: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (incluye la autenticación mediante OAuth/token de ChatGPT/Codex), Xiaomi y z.ai. Consulta [CLI de modelos](/es/cli/models) y [CLI de canales](/es/cli/channels) para ver la lista completa de proveedores y opciones.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax indican la cuota restante, por lo que OpenClaw los invierte; los campos basados en recuentos prevalecen cuando están presentes. Si la respuesta incluye una matriz `model_remains`, OpenClaw selecciona la entrada del modelo de chat, obtiene la etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso procede de enlaces específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a las credenciales OAuth/clave de API coincidentes de los perfiles de autenticación, el entorno o la configuración.

Consulta [Uso y costos de tokens](/es/reference/token-use) para ver ejemplos detallados.

<Note>
Anthropic ha confirmado que la reutilización de Claude CLI (incluido `claude -p`) es un patrón de integración autorizado, salvo que publique una nueva política. Anthropic no proporciona una estimación monetaria por mensaje, por lo que `/usage full` no puede mostrar el costo del uso de Claude CLI.
</Note>

## Cómo se descubren las claves

- **Perfiles de autenticación**: específicos de cada agente, almacenados en `auth-profiles.json`.
- **Variables de entorno**: por ejemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuración**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, que puede exportar la clave al entorno del proceso de la Skill.

## Funciones que pueden consumir claves

### Respuestas del modelo principal (chat + herramientas)

Cada respuesta o llamada a una herramienta se ejecuta en el proveedor del modelo actual. Esta es la principal fuente de uso y costos, incluidos los planes alojados basados en suscripción cuya facturación se realiza fuera de la interfaz local de OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan y la ruta de inicio de sesión de Claude de Anthropic con Extra Usage habilitado.

Consulta [Modelos](/es/providers/models) para la configuración de precios y [Uso y costos de tokens](/es/reference/token-use) para su visualización.

### Comprensión de contenido multimedia (audio/imagen/video)

El contenido multimedia entrante puede resumirse o transcribirse mediante la API de un proveedor antes de ejecutar el flujo de respuestas. La compatibilidad con proveedores se registra por Plugin y cambia a medida que se añaden Plugins; consulta [Comprensión de contenido multimedia](/es/nodes/media-understanding) para conocer la lista y la configuración actuales.

### Generación de imágenes y videos

`image_generate` y `video_generate` dirigen las solicitudes al proveedor configurado que esté disponible. La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando `agents.defaults.imageGenerationModel` no está definido; la generación de videos requiere un `agents.defaults.videoGenerationModel` explícito (por ejemplo, `qwen/wan2.6-t2v`).

Consulta [Generación de imágenes](/es/tools/image-generation) y [Generación de videos](/es/tools/video-generation) para conocer la lista actual de proveedores.

### Incrustaciones de memoria y búsqueda semántica

La búsqueda semántica en memoria utiliza API de incrustaciones cuando `agents.defaults.memorySearch.provider` especifica un adaptador remoto (por ejemplo, `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` o `"ollama"` se ejecuta en un servidor local o autoalojado y, normalmente, no genera facturación de alojamiento. `memorySearch.provider = "local"` mantiene todo en el dispositivo sin usar ninguna API. Un proveedor opcional `memorySearch.fallback` puede cubrir los fallos de las incrustaciones locales.

Consulta [Memoria](/es/concepts/memory).

### Herramienta de búsqueda web

`web_search` puede generar cargos por uso según el proveedor seleccionado. Cada proveedor lee primero su clave de una variable de entorno y después de `plugins.entries.<id>.config.webSearch.apiKey`:

| Proveedor              | Variable(s) de entorno                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                             |
| DuckDuckGo             | sin clave; no oficial, basado en HTML y sin facturación                                                                                                                                      |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                               |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                         |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                            |
| Grok (xAI)             | perfil OAuth de xAI o `XAI_API_KEY`                                                                                                                                                         |
| Kimi (Moonshot)        | `KIMI_API_KEY` o `MOONSHOT_API_KEY`                                                                                                                                                         |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY`                                                                                                |
| Ollama Web Search      | sin clave para un host local accesible con una sesión iniciada; la búsqueda directa en `https://ollama.com` usa `OLLAMA_API_KEY`; los hosts protegidos por autenticación reutilizan la autenticación mediante portador del proveedor Ollama habitual |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                          |
| Perplexity Search API  | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`                                                                                                                                                 |
| SearXNG                | `SEARXNG_BASE_URL`; sin clave/autoalojado, sin facturación de alojamiento                                                                                                                    |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                            |

Las rutas de configuración heredadas `tools.web.search.*` aún se cargan mediante una capa de compatibilidad, pero ya no son la interfaz recomendada.

**Crédito gratuito de Brave Search**: cada plan incluye un crédito gratuito renovable de 5 USD al mes. El plan Search cuesta 5 USD por cada 1000 solicitudes, por lo que el crédito cubre 1000 solicitudes al mes sin cargo. Configura un límite de uso en el panel de Brave para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a Firecrawl con acceso inicial sin clave; añade `FIRECRAWL_API_KEY` (o `plugins.entries.firecrawl.config.webFetch.apiKey`) para obtener límites más altos. Si Firecrawl no está configurado, la herramienta recurre a la obtención directa junto con el Plugin `web-readability` incluido (sin API de pago). Desactiva `plugins.entries.web-readability.enabled` para omitir la extracción local mediante Readability.

Consulta [Herramientas web](/es/tools/web).

### Instantáneas de uso del proveedor (estado/salud)

`openclaw status --usage` y `openclaw models status --json` llaman a los puntos de conexión de uso del proveedor para mostrar las ventanas de cuota o el estado de la autenticación. El volumen de llamadas es bajo, pero siguen accediendo a las API del proveedor.

Consulta [CLI de modelos](/es/cli/models).

### Resumen de protección de Compaction

La protección de Compaction puede resumir el historial de la sesión mediante el modelo actual, lo que invoca las API del proveedor cuando se ejecuta.

Consulta [Gestión de sesiones y Compaction](/es/reference/session-management-compaction).

### Exploración/prueba de modelos

`openclaw models scan` puede probar modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando las pruebas están habilitadas.

Consulta [CLI de modelos](/es/cli/models).

### Conversación (voz)

El modo de conversación puede invocar ElevenLabs cuando está configurado: `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`.

Consulta [Modo de conversación](/es/nodes/talk).

### Skills (API de terceros)

Las Skills pueden almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una Skill usa esa clave con una API externa, el costo depende del proveedor de la Skill.

Consulta [Skills](/es/tools/skills).

## Contenido relacionado

- [Uso y costos de tokens](/es/reference/token-use)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento del uso](/es/concepts/usage-tracking)
