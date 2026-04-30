---
read_when:
    - Quiere habilitar o configurar web_search
    - Desea habilitar o configurar x_search
    - Debe elegir un proveedor de búsqueda
    - Desea comprender la detección automática y la alternativa de proveedor
sidebarTitle: Web Search
summary: web_search, x_search y web_fetch -- buscar en la web, buscar publicaciones de X u obtener el contenido de una página
title: Búsqueda web
x-i18n:
    generated_at: "2026-04-30T06:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

La herramienta `web_search` busca en la web usando tu proveedor configurado y
devuelve resultados. Los resultados se almacenan en caché por consulta durante 15 minutos (configurable).

OpenClaw también incluye `x_search` para publicaciones de X (antes Twitter) y
`web_fetch` para obtener URLs de forma ligera. En esta fase, `web_fetch` permanece
local, mientras que `web_search` y `x_search` pueden usar xAI Responses internamente.

<Info>
  `web_search` es una herramienta HTTP ligera, no automatización de navegador. Para
  sitios con mucho JS o inicios de sesión, usa el [Navegador web](/es/tools/browser). Para
  obtener una URL específica, usa [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    Elige un proveedor y completa cualquier configuración requerida. Algunos proveedores no
    requieren claves, mientras que otros usan claves de API. Consulta las páginas de proveedores a continuación para
    ver los detalles.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Esto guarda el proveedor y cualquier credencial necesaria. También puedes establecer una variable
    de entorno (por ejemplo `BRAVE_API_KEY`) y omitir este paso para proveedores
    respaldados por API.
  </Step>
  <Step title="Úsalo">
    El agente ahora puede llamar a `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Para publicaciones de X, usa:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Elegir un proveedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/es/tools/brave-search">
    Resultados estructurados con fragmentos. Admite el modo `llm-context` y filtros de país/idioma. Nivel gratuito disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Alternativa sin clave. No se necesita clave de API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal + por palabras clave con extracción de contenido (destacados, texto, resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Funciona mejor junto con `firecrawl_search` y `firecrawl_scrape` para extracción profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/es/tools/gemini-search">
    Respuestas sintetizadas por IA con citas mediante grounding de Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/es/tools/grok-search">
    Respuestas sintetizadas por IA con citas mediante grounding web de xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/es/tools/kimi-search">
    Respuestas sintetizadas por IA con citas mediante búsqueda web de Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/es/tools/minimax-search">
    Resultados estructurados mediante la API de búsqueda MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/es/tools/ollama-search">
    Búsqueda mediante un host local de Ollama con sesión iniciada o la API alojada de Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado por dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Metabúsqueda autoalojada. No se necesita clave de API. Agrega Google, Bing, DuckDuckGo y más.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para extracción de URLs.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                 | Estilo de resultado        | Filtros                                          | Clave de API                                                                            |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)              | Fragmentos estructurados   | País, idioma, tiempo, modo `llm-context`         | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/es/tools/duckduckgo-search)    | Fragmentos estructurados   | --                                               | Ninguna (sin clave)                                                                     |
| [Exa](/es/tools/exa-search)                  | Estructurados + extraídos  | Modo neuronal/palabras clave, fecha, extracción de contenido | `EXA_API_KEY`                                                                           |
| [Firecrawl](/es/tools/firecrawl)             | Fragmentos estructurados   | Mediante la herramienta `firecrawl_search`       | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/es/tools/gemini-search)            | Sintetizado por IA + citas | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/es/tools/grok-search)                | Sintetizado por IA + citas | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/es/tools/kimi-search)                | Sintetizado por IA + citas | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/es/tools/minimax-search)   | Fragmentos estructurados   | Región (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/es/tools/ollama-search) | Fragmentos estructurados   | --                                               | Ninguna para hosts locales con sesión iniciada; `OLLAMA_API_KEY` para búsqueda directa en `https://ollama.com` |
| [Perplexity](/es/tools/perplexity-search)    | Fragmentos estructurados   | País, idioma, tiempo, dominios, límites de contenido | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/es/tools/searxng-search)          | Fragmentos estructurados   | Categorías, idioma                               | Ninguna (autoalojado)                                                                   |
| [Tavily](/es/tools/tavily)                   | Fragmentos estructurados   | Mediante la herramienta `tavily_search`          | `TAVILY_API_KEY`                                                                        |

## Detección automática

## Búsqueda web nativa de OpenAI

Los modelos directos de OpenAI Responses usan automáticamente la herramienta alojada `web_search` de OpenAI cuando la búsqueda web de OpenClaw está habilitada y no hay ningún proveedor administrado fijado. Este es un comportamiento propiedad del proveedor en el Plugin de OpenAI incluido y solo se aplica al tráfico nativo de la API de OpenAI, no a URLs base de proxy compatibles con OpenAI ni a rutas de Azure. Establece `tools.web.search.provider` en otro proveedor, como `brave`, para mantener la herramienta administrada `web_search` para modelos de OpenAI, o establece `tools.web.search.enabled: false` para deshabilitar tanto la búsqueda administrada como la búsqueda nativa de OpenAI.

## Búsqueda web nativa de Codex

Los modelos compatibles con Codex pueden usar opcionalmente la herramienta `web_search` de Responses nativa del proveedor en lugar de la función administrada `web_search` de OpenClaw.

- Configúrala en `tools.web.search.openaiCodex`
- Solo se activa para modelos compatibles con Codex (`openai-codex/*` o proveedores que usan `api: "openai-codex-responses"`)
- `web_search` administrado sigue aplicándose a modelos que no son Codex
- `mode: "cached"` es la configuración predeterminada y recomendada
- `tools.web.search.enabled: false` deshabilita tanto la búsqueda administrada como la nativa

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Si la búsqueda nativa de Codex está habilitada pero el modelo actual no es compatible con Codex, OpenClaw mantiene el comportamiento administrado normal de `web_search`.

## Configurar la búsqueda web

Las listas de proveedores en la documentación y en los flujos de configuración están en orden alfabético. La detección automática mantiene un
orden de precedencia separado.

Si no se establece ningún `provider`, OpenClaw comprueba los proveedores en este orden y usa el
primero que esté listo:

Primero los proveedores respaldados por API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (orden 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (orden 15)
3. **Gemini** -- `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey` (orden 20)
4. **Grok** -- `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (orden 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (orden 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (orden 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (orden 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey` (orden 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (orden 70)

Después, las alternativas sin clave:

10. **DuckDuckGo** -- alternativa HTML sin clave, sin cuenta ni clave de API (orden 100)
11. **Ollama Web Search** -- alternativa sin clave mediante tu host local de Ollama configurado cuando es accesible y tiene sesión iniciada con `ollama signin`; puede reutilizar la autenticación bearer del proveedor Ollama cuando el host la necesita, y puede llamar a la búsqueda directa en `https://ollama.com` cuando se configura con `OLLAMA_API_KEY` (orden 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Si no se detecta ningún proveedor, se recurre a Brave (recibirás un error de clave
faltante que te indicará que configures una).

<Note>
  Todos los campos de clave de proveedor admiten objetos SecretRef. Los SecretRefs con ámbito de Plugin
  en `plugins.entries.<plugin>.config.webSearch.apiKey` se resuelven para los
  proveedores de búsqueda web respaldados por API incluidos, incluidos Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity y Tavily,
  tanto si el proveedor se elige explícitamente mediante `tools.web.search.provider` como si
  se selecciona mediante detección automática. En modo de detección automática, OpenClaw resuelve solo la
  clave del proveedor seleccionado: los SecretRefs no seleccionados permanecen inactivos, de modo que puedes
  mantener varios proveedores configurados sin pagar el coste de resolución de los
  que no estás usando.
</Note>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuración específica del proveedor (claves de API, URLs base, modos) se encuentra en
`plugins.entries.<plugin>.config.webSearch.*`. Consulta las páginas de proveedores para
ver ejemplos.

La selección del proveedor alternativo de `web_fetch` es independiente:

- elígelo con `tools.web.fetch.provider`
- u omite ese campo y deja que OpenClaw detecte automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales disponibles
- actualmente, el proveedor de web-fetch incluido es Firecrawl, configurado en
  `plugins.entries.firecrawl.config.webFetch.*`

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede pedir:

- la región de la API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (predeterminado: `kimi-k2.6`)

Para `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa la
misma reserva `XAI_API_KEY` que la búsqueda web de Grok.
La configuración heredada `tools.web.x_search.*` se migra automáticamente mediante `openclaw doctor --fix`.
Cuando eliges Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también puede ofrecer la configuración opcional de `x_search` con la misma clave.
Este es un paso de seguimiento separado dentro de la ruta de Grok, no una opción separada
de proveedor de búsqueda web de nivel superior. Si eliges otro proveedor, OpenClaw no
muestra el aviso de `x_search`.

### Almacenamiento de claves de API

<Tabs>
  <Tab title="Archivo de configuración">
    Ejecuta `openclaw configure --section web` o establece la clave directamente:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variable de entorno">
    Establece la variable de entorno del proveedor en el entorno del proceso del Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para una instalación de gateway, colócala en `~/.openclaw/.env`.
    Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de la herramienta

| Parámetro             | Descripción                                            |
| --------------------- | ------------------------------------------------------ |
| `query`               | Consulta de búsqueda (obligatoria)                     |
| `count`               | Resultados que devolver (1-10, predeterminado: 5)      |
| `country`             | Código de país ISO de 2 letras (p. ej., "US", "DE")   |
| `language`            | Código de idioma ISO 639-1 (p. ej., "en", "de")       |
| `search_lang`         | Código de idioma de búsqueda (solo Brave)              |
| `freshness`           | Filtro de tiempo: `day`, `week`, `month` o `year`      |
| `date_after`          | Resultados posteriores a esta fecha (YYYY-MM-DD)       |
| `date_before`         | Resultados anteriores a esta fecha (YYYY-MM-DD)        |
| `ui_lang`             | Código de idioma de la interfaz (solo Brave)           |
| `domain_filter`       | Matriz de lista permitida/bloqueada de dominios (solo Perplexity) |
| `max_tokens`          | Presupuesto total de contenido, predeterminado 25000 (solo Perplexity) |
| `max_tokens_per_page` | Límite de tokens por página, predeterminado 2048 (solo Perplexity) |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo `llm-context`
  de Brave rechaza `ui_lang`, `freshness`, `date_after` y `date_before`.
  Gemini, Grok y Kimi devuelven una respuesta sintetizada con citas. Aceptan
  `count` por compatibilidad con herramientas compartidas, pero no cambia la
  forma de la respuesta fundamentada.
  Perplexity se comporta de la misma manera cuando usas la ruta de compatibilidad
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` u `OPENROUTER_API_KEY`).
  SearXNG acepta `http://` solo para hosts de red privada de confianza o local loopback;
  los endpoints públicos de SearXNG deben usar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` mediante `web_search`;
  usa sus herramientas dedicadas para opciones avanzadas.
</Warning>

## x_search

`x_search` consulta publicaciones de X (antes Twitter) usando xAI y devuelve
respuestas sintetizadas por IA con citas. Acepta consultas en lenguaje natural y
filtros estructurados opcionales. OpenClaw solo habilita la herramienta integrada
`x_search` de xAI en la solicitud que atiende esta llamada de herramienta.

<Note>
  xAI documenta `x_search` como compatible con búsqueda por palabras clave,
  búsqueda semántica, búsqueda de usuarios y recuperación de hilos. Para estadísticas
  de interacción por publicación, como republicaciones, respuestas, marcadores o vistas,
  prefiere una búsqueda dirigida de la URL exacta de la publicación o del ID de estado.
  Las búsquedas amplias por palabras clave pueden encontrar la publicación correcta,
  pero devolver metadatos por publicación menos completos. Un buen patrón es: localiza
  primero la publicación y luego ejecuta una segunda consulta `x_search` centrada en
  esa publicación exacta.
</Note>

### Configuración de x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Parámetros de x_search

| Parámetro                    | Descripción                                               |
| ---------------------------- | --------------------------------------------------------- |
| `query`                      | Consulta de búsqueda (obligatoria)                        |
| `allowed_x_handles`          | Restringir resultados a identificadores de X específicos  |
| `excluded_x_handles`         | Excluir identificadores de X específicos                  |
| `from_date`                  | Incluir solo publicaciones en esta fecha o después (YYYY-MM-DD) |
| `to_date`                    | Incluir solo publicaciones en esta fecha o antes (YYYY-MM-DD) |
| `enable_image_understanding` | Permitir que xAI inspeccione imágenes adjuntas a publicaciones coincidentes |
| `enable_video_understanding` | Permitir que xAI inspeccione videos adjuntos a publicaciones coincidentes |

### Ejemplo de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ejemplos

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfiles de herramientas

Si usas perfiles de herramientas o listas permitidas, agrega `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Relacionado

- [Obtención web](/es/tools/web-fetch) -- obtiene una URL y extrae contenido legible
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Búsqueda de Grok](/es/tools/grok-search) -- Grok como proveedor de `web_search`
- [Búsqueda web de Ollama](/es/tools/ollama-search) -- búsqueda web sin clave a través de tu host de Ollama
