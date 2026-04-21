---
read_when:
    - Quieres habilitar o configurar `web_search`
    - Quieres habilitar o configurar `x_search`
    - Necesitas elegir un proveedor de búsqueda
    - Quieres comprender la detección automática y el fallback de proveedor
sidebarTitle: Web Search
summary: '`web_search`, `x_search` y `web_fetch`: buscar en la web, buscar publicaciones en X u obtener el contenido de una página'
title: Búsqueda web
x-i18n:
    generated_at: "2026-04-21T05:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# Búsqueda web

La herramienta `web_search` busca en la web usando tu proveedor configurado y
devuelve resultados. Los resultados se almacenan en caché por consulta durante 15 minutos (configurable).

OpenClaw también incluye `x_search` para publicaciones de X (antes Twitter) y
`web_fetch` para obtención ligera de URL. En esta fase, `web_fetch` sigue siendo
local, mientras que `web_search` y `x_search` pueden usar xAI Responses por debajo.

<Info>
  `web_search` es una herramienta HTTP ligera, no automatización del navegador. Para
  sitios con mucho JS o inicios de sesión, usa el [Web Browser](/es/tools/browser). Para
  obtener una URL específica, usa [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    Elige un proveedor y completa cualquier configuración necesaria. Algunos proveedores no
    requieren clave, mientras que otros usan claves de API. Consulta las páginas de proveedores a continuación para
    más detalles.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Esto guarda el proveedor y cualquier credencial necesaria. También puedes establecer una variable de entorno
    (por ejemplo `BRAVE_API_KEY`) y omitir este paso para proveedores
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
    Resultados estructurados con fragmentos. Admite modo `llm-context`, filtros de país/idioma. Nivel gratuito disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Fallback sin clave. No necesita clave de API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal + por palabras clave con extracción de contenido (destacados, texto, resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Va mejor junto con `firecrawl_search` y `firecrawl_scrape` para extracción profunda.
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
    Resultados estructurados mediante la API de búsqueda de MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/es/tools/ollama-search">
    Búsqueda sin clave mediante tu host de Ollama configurado. Requiere `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado por dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Meta-búsqueda autoalojada. No necesita clave de API. Agrega Google, Bing, DuckDuckGo y más.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para extracción de URL.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                  | Estilo de resultados         | Filtros                                          | Clave de API                                                                      |
| ------------------------------------------ | ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)               | Fragmentos estructurados     | País, idioma, tiempo, modo `llm-context`         | `BRAVE_API_KEY`                                                                    |
| [DuckDuckGo](/es/tools/duckduckgo-search)     | Fragmentos estructurados     | --                                               | Ninguna (sin clave)                                                                |
| [Exa](/es/tools/exa-search)                   | Estructurados + extraídos    | Modo neuronal/palabras clave, fecha, extracción de contenido | `EXA_API_KEY`                                                           |
| [Firecrawl](/es/tools/firecrawl)              | Fragmentos estructurados     | Mediante la herramienta `firecrawl_search`       | `FIRECRAWL_API_KEY`                                                                |
| [Gemini](/es/tools/gemini-search)             | Sintetizados por IA + citas  | --                                               | `GEMINI_API_KEY`                                                                   |
| [Grok](/es/tools/grok-search)                 | Sintetizados por IA + citas  | --                                               | `XAI_API_KEY`                                                                      |
| [Kimi](/es/tools/kimi-search)                 | Sintetizados por IA + citas  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                |
| [MiniMax Search](/es/tools/minimax-search)    | Fragmentos estructurados     | Región (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                 |
| [Ollama Web Search](/es/tools/ollama-search)  | Fragmentos estructurados     | --                                               | Ninguna de forma predeterminada; requiere `ollama signin`, puede reutilizar autenticación bearer del proveedor Ollama |
| [Perplexity](/es/tools/perplexity-search)     | Fragmentos estructurados     | País, idioma, tiempo, dominios, límites de contenido | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                    |
| [SearXNG](/es/tools/searxng-search)           | Fragmentos estructurados     | Categorías, idioma                               | Ninguna (autoalojado)                                                              |
| [Tavily](/es/tools/tavily)                    | Fragmentos estructurados     | Mediante la herramienta `tavily_search`          | `TAVILY_API_KEY`                                                                   |

## Detección automática

## Búsqueda web nativa de Codex

Los modelos compatibles con Codex pueden usar opcionalmente la herramienta nativa `web_search` de Responses del proveedor en lugar de la función administrada `web_search` de OpenClaw.

- Configúrala en `tools.web.search.openaiCodex`
- Solo se activa para modelos compatibles con Codex (`openai-codex/*` o proveedores que usen `api: "openai-codex-responses"`)
- La `web_search` administrada sigue aplicándose a modelos no compatibles con Codex
- `mode: "cached"` es la configuración predeterminada y recomendada
- `tools.web.search.enabled: false` desactiva tanto la búsqueda administrada como la nativa

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

Si la búsqueda nativa de Codex está habilitada pero el modelo actual no es compatible con Codex, OpenClaw mantiene el comportamiento normal de `web_search` administrada.

## Configurar la búsqueda web

Las listas de proveedores en la documentación y en los flujos de configuración están en orden alfabético. La detección automática mantiene un orden de precedencia separado.

Si no se establece `provider`, OpenClaw comprueba los proveedores en este orden y usa el
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

Después, los fallbacks sin clave:

10. **DuckDuckGo** -- fallback HTML sin clave, sin cuenta ni clave de API (orden 100)
11. **Ollama Web Search** -- fallback sin clave mediante tu host de Ollama configurado; requiere que Ollama sea accesible y que hayas iniciado sesión con `ollama signin`, y puede reutilizar la autenticación bearer del proveedor Ollama si el host la necesita (orden 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Si no se detecta ningún proveedor, se usa Brave como fallback (recibirás un error de
clave ausente que te indicará que configures una).

<Note>
  Todos los campos de claves de proveedor admiten objetos SecretRef. En modo de detección automática,
  OpenClaw resuelve solo la clave del proveedor seleccionado; los SecretRef no seleccionados
  permanecen inactivos.
</Note>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // predeterminado: true
        provider: "brave", // o se puede omitir para detección automática
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuración específica del proveedor (claves de API, URLs base, modos) vive bajo
`plugins.entries.<plugin>.config.webSearch.*`. Consulta las páginas de proveedores para ver
ejemplos.

La selección del proveedor de fallback de `web_fetch` es independiente:

- elígelo con `tools.web.fetch.provider`
- o omite ese campo y deja que OpenClaw detecte automáticamente el primer proveedor de obtención web
  listo a partir de las credenciales disponibles
- hoy el proveedor de obtención web incluido es Firecrawl, configurado en
  `plugins.entries.firecrawl.config.webFetch.*`

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede pedirte:

- la región de la API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (por defecto `kimi-k2.6`)

Para `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa el
mismo fallback `XAI_API_KEY` que la búsqueda web de Grok.
La configuración heredada `tools.web.x_search.*` se migra automáticamente mediante `openclaw doctor --fix`.
Cuando eliges Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también puede ofrecer una configuración opcional de `x_search` con la misma clave.
Este es un paso de seguimiento independiente dentro de la ruta de Grok, no una opción de proveedor
de búsqueda web principal independiente. Si eliges otro proveedor, OpenClaw no
muestra el prompt de `x_search`.

### Almacenar claves de API

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

    Para una instalación de Gateway, colócala en `~/.openclaw/.env`.
    Consulta [Env vars](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de la herramienta

| Parámetro             | Descripción                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de búsqueda (obligatorio)                    |
| `count`               | Resultados a devolver (1-10, predeterminado: 5)       |
| `country`             | Código de país ISO de 2 letras (p. ej. `"US"`, `"DE"`) |
| `language`            | Código de idioma ISO 639-1 (p. ej. `"en"`, `"de"`)    |
| `search_lang`         | Código de idioma de búsqueda (solo Brave)             |
| `freshness`           | Filtro de tiempo: `day`, `week`, `month` o `year`     |
| `date_after`          | Resultados posteriores a esta fecha (YYYY-MM-DD)      |
| `date_before`         | Resultados anteriores a esta fecha (YYYY-MM-DD)       |
| `ui_lang`             | Código de idioma de interfaz (solo Brave)             |
| `domain_filter`       | Matriz de lista permitida/lista denegada de dominios (solo Perplexity) |
| `max_tokens`          | Presupuesto total de contenido, predeterminado 25000 (solo Perplexity) |
| `max_tokens_per_page` | Límite de tokens por página, predeterminado 2048 (solo Perplexity) |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo `llm-context` de Brave
  rechaza `ui_lang`, `freshness`, `date_after` y `date_before`.
  Gemini, Grok y Kimi devuelven una única respuesta sintetizada con citas. Aceptan
  `count` por compatibilidad con herramientas compartidas, pero no cambia la
  forma de la respuesta con grounding.
  Perplexity se comporta igual cuando usas la ruta de compatibilidad Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG acepta `http://` solo para hosts de loopback o redes privadas de confianza;
  los extremos públicos de SearXNG deben usar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` a través de `web_search`;
  usa sus herramientas dedicadas para opciones avanzadas.
</Warning>

## x_search

`x_search` consulta publicaciones de X (antes Twitter) usando xAI y devuelve
respuestas sintetizadas por IA con citas. Acepta consultas en lenguaje natural y
filtros estructurados opcionales. OpenClaw solo habilita la herramienta integrada `x_search`
de xAI en la solicitud que sirve esta llamada de herramienta.

<Note>
  xAI documenta `x_search` como compatible con búsqueda por palabras clave, búsqueda semántica, búsqueda de usuarios
  y obtención de hilos. Para estadísticas de interacción por publicación como reposts,
  respuestas, marcadores o vistas, prefiere una búsqueda dirigida de la URL exacta de la publicación
  o del ID de estado. Las búsquedas amplias por palabras clave pueden encontrar la publicación correcta, pero devolver
  metadatos por publicación menos completos. Un buen patrón es: localizar primero la publicación y luego
  ejecutar una segunda consulta `x_search` centrada en esa publicación exacta.
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
            apiKey: "xai-...", // opcional si XAI_API_KEY está configurado
          },
        },
      },
    },
  },
}
```

### Parámetros de x_search

| Parámetro                    | Descripción                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de búsqueda (obligatoria)                     |
| `allowed_x_handles`          | Restringe los resultados a handles específicos de X    |
| `excluded_x_handles`         | Excluye handles específicos de X                       |
| `from_date`                  | Solo incluir publicaciones en esta fecha o después (YYYY-MM-DD) |
| `to_date`                    | Solo incluir publicaciones en esta fecha o antes (YYYY-MM-DD) |
| `enable_image_understanding` | Permite que xAI inspeccione imágenes adjuntas a las publicaciones coincidentes |
| `enable_video_understanding` | Permite que xAI inspeccione videos adjuntos a las publicaciones coincidentes |

### Ejemplo de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Estadísticas por publicación: usa la URL exacta del estado o el ID de estado cuando sea posible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ejemplos

```javascript
// Búsqueda básica
await web_search({ query: "OpenClaw plugin SDK" });

// Búsqueda específica para Alemania
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Resultados recientes (última semana)
await web_search({ query: "AI developments", freshness: "week" });

// Intervalo de fechas
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrado por dominio (solo Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfiles de herramientas

Si usas perfiles de herramientas o listas permitidas, añade `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // o: allow: ["group:web"]  (incluye web_search, x_search y web_fetch)
  },
}
```

## Relacionado

- [Web Fetch](/es/tools/web-fetch) -- obtener una URL y extraer contenido legible
- [Web Browser](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Grok Search](/es/tools/grok-search) -- Grok como proveedor de `web_search`
- [Ollama Web Search](/es/tools/ollama-search) -- búsqueda web sin clave a través de tu host de Ollama
