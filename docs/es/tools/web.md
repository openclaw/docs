---
read_when:
    - Quieres habilitar o configurar `web_search`
    - Quieres habilitar o configurar `x_search`
    - Necesitas elegir un proveedor de búsqueda
    - Quieres entender la detección automática y la alternativa de proveedor
sidebarTitle: Web Search
summary: '`web_search`, `x_search` y `web_fetch`: buscar en la web, buscar publicaciones en X o recuperar el contenido de una página'
title: Búsqueda web
x-i18n:
    generated_at: "2026-04-23T05:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Búsqueda web

La herramienta `web_search` busca en la web usando tu proveedor configurado y
devuelve resultados. Los resultados se almacenan en caché por consulta durante 15 minutos (configurable).

OpenClaw también incluye `x_search` para publicaciones de X (antes Twitter) y
`web_fetch` para obtener URL de forma ligera. En esta fase, `web_fetch` sigue siendo
local, mientras que `web_search` y `x_search` pueden usar xAI Responses por debajo.

<Info>
  `web_search` es una herramienta HTTP ligera, no automatización de navegador. Para
  sitios con mucho JS o inicios de sesión, usa el [Navegador web](/es/tools/browser). Para
  obtener una URL específica, usa [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    Elige un proveedor y completa toda la configuración requerida. Algunos proveedores
    no requieren clave, mientras que otros usan claves API. Consulta las páginas de proveedores a continuación para ver los
    detalles.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Esto almacena el proveedor y cualquier credencial necesaria. También puedes establecer una variable de entorno
    (por ejemplo `BRAVE_API_KEY`) y omitir este paso para proveedores
    respaldados por API.
  </Step>
  <Step title="Úsalo">
    El agente ahora puede llamar a `web_search`:

    ```javascript
    await web_search({ query: "SDK de Plugin de OpenClaw" });
    ```

    Para publicaciones de X, usa:

    ```javascript
    await x_search({ query: "recetas para cenar" });
    ```

  </Step>
</Steps>

## Elegir un proveedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/es/tools/brave-search">
    Resultados estructurados con fragmentos. Admite modo `llm-context`, filtros de país/idioma. Nivel gratuito disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Alternativa sin clave. No necesita clave API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal + por palabras clave con extracción de contenido (destacados, texto, resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Se combina mejor con `firecrawl_search` y `firecrawl_scrape` para extracción profunda.
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
    Búsqueda sin clave mediante tu host Ollama configurado. Requiere `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado de dominios.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Metabúsqueda autohospedada. No necesita clave API. Agrega Google, Bing, DuckDuckGo y más.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para extracción de URL.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                  | Estilo de resultado               | Filtros                                          | Clave API                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)              | Fragmentos estructurados        | País, idioma, tiempo, modo `llm-context`      | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/es/tools/duckduckgo-search)    | Fragmentos estructurados        | --                                               | Ninguna (sin clave)                                                                  |
| [Exa](/es/tools/exa-search)                  | Estructurado + extraído     | Modo neuronal/palabras clave, fecha, extracción de contenido    | `EXA_API_KEY`                                                                    |
| [Firecrawl](/es/tools/firecrawl)             | Fragmentos estructurados        | Mediante la herramienta `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/es/tools/gemini-search)            | Sintetizado por IA + citas | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/es/tools/grok-search)                | Sintetizado por IA + citas | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/es/tools/kimi-search)                | Sintetizado por IA + citas | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/es/tools/minimax-search)   | Fragmentos estructurados        | Región (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/es/tools/ollama-search) | Fragmentos estructurados        | --                                               | Ninguna de forma predeterminada; se requiere `ollama signin`, puede reutilizar la autenticación bearer del proveedor Ollama |
| [Perplexity](/es/tools/perplexity-search)    | Fragmentos estructurados        | País, idioma, tiempo, dominios, límites de contenido | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/es/tools/searxng-search)          | Fragmentos estructurados        | Categorías, idioma                             | Ninguna (autohospedado)                                                               |
| [Tavily](/es/tools/tavily)                   | Fragmentos estructurados        | Mediante la herramienta `tavily_search`                         | `TAVILY_API_KEY`                                                                 |

## Detección automática

## Búsqueda web nativa de OpenAI

Los modelos directos de OpenAI Responses usan automáticamente la herramienta alojada `web_search` de OpenAI cuando la búsqueda web de OpenClaw está habilitada y no hay un proveedor administrado fijado. Este comportamiento pertenece al proveedor en el Plugin OpenAI incluido y solo se aplica al tráfico nativo de la API de OpenAI, no a URLs base proxy compatibles con OpenAI ni a rutas de Azure. Establece `tools.web.search.provider` en otro proveedor como `brave` para mantener la herramienta administrada `web_search` para los modelos OpenAI, o establece `tools.web.search.enabled: false` para deshabilitar tanto la búsqueda administrada como la búsqueda nativa de OpenAI.

## Búsqueda web nativa de Codex

Los modelos compatibles con Codex pueden usar opcionalmente la herramienta nativa `web_search` de Responses del proveedor en lugar de la función administrada `web_search` de OpenClaw.

- Configúrala en `tools.web.search.openaiCodex`
- Solo se activa para modelos compatibles con Codex (`openai-codex/*` o proveedores que usan `api: "openai-codex-responses"`)
- La `web_search` administrada sigue aplicándose a modelos que no son Codex
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

Si la búsqueda nativa de Codex está habilitada pero el modelo actual no es compatible con Codex, OpenClaw mantiene el comportamiento normal de `web_search` administrada.

## Configurar la búsqueda web

Las listas de proveedores en la documentación y los flujos de configuración están en orden alfabético. La detección automática mantiene un orden de precedencia separado.

Si no se establece `provider`, OpenClaw comprueba los proveedores en este orden y usa el
primero que esté listo:

Primero, proveedores respaldados por API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (orden 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (orden 15)
3. **Gemini** -- `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey` (orden 20)
4. **Grok** -- `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (orden 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (orden 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (orden 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (orden 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey` (orden 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (orden 70)

Después de eso, alternativas sin clave:

10. **DuckDuckGo** -- alternativa HTML sin clave, sin cuenta ni clave API (orden 100)
11. **Ollama Web Search** -- alternativa sin clave mediante tu host Ollama configurado; requiere que Ollama sea accesible y que hayas iniciado sesión con `ollama signin`, y puede reutilizar la autenticación bearer del proveedor Ollama si el host la necesita (orden 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Si no se detecta ningún proveedor, recurre a Brave (recibirás un error de clave faltante
que te pedirá configurar una).

<Note>
  Todos los campos de clave de proveedor admiten objetos SecretRef. Los SecretRef con ámbito de Plugin
  en `plugins.entries.<plugin>.config.webSearch.apiKey` se resuelven para los
  proveedores incluidos Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity y Tavily
  tanto si el proveedor se elige explícitamente mediante `tools.web.search.provider` como si se
  selecciona mediante detección automática. En modo de detección automática, OpenClaw resuelve solo la
  clave del proveedor seleccionado: los SecretRef no seleccionados permanecen inactivos, por lo que puedes
  mantener varios proveedores configurados sin pagar el costo de resolución de
  los que no estás usando.
</Note>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // predeterminado: true
        provider: "brave", // o bien omitir para detección automática
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuración específica del proveedor (claves API, URL base, modos) se encuentra en
`plugins.entries.<plugin>.config.webSearch.*`. Consulta las páginas del proveedor para ver
ejemplos.

La selección del proveedor alternativo de `web_fetch` es independiente:

- elígelo con `tools.web.fetch.provider`
- o bien omite ese campo y deja que OpenClaw detecte automáticamente el primer proveedor
  listo de web-fetch a partir de las credenciales disponibles
- hoy, el proveedor de web-fetch incluido es Firecrawl, configurado en
  `plugins.entries.firecrawl.config.webFetch.*`

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede preguntar por:

- la región de la API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (predeterminado `kimi-k2.6`)

Para `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa la
misma alternativa `XAI_API_KEY` que la búsqueda web de Grok.
La configuración heredada `tools.web.x_search.*` se migra automáticamente con `openclaw doctor --fix`.
Cuando eliges Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también puede ofrecer una configuración opcional de `x_search` con la misma clave.
Este es un paso de seguimiento separado dentro de la ruta de Grok, no una opción de proveedor de
búsqueda web independiente de nivel superior. Si eliges otro proveedor, OpenClaw no
muestra el prompt de `x_search`.

### Almacenar claves API

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

    Para una instalación del gateway, colócala en `~/.openclaw/.env`.
    Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de la herramienta

| Parámetro             | Descripción                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de búsqueda (obligatoria)                               |
| `count`               | Resultados a devolver (1-10, predeterminado: 5)                  |
| `country`             | Código de país ISO de 2 letras (por ejemplo "US", "DE")           |
| `language`            | Código de idioma ISO 639-1 (por ejemplo "en", "de")             |
| `search_lang`         | Código de idioma de búsqueda (solo Brave)                     |
| `freshness`           | Filtro temporal: `day`, `week`, `month` o `year`        |
| `date_after`          | Resultados posteriores a esta fecha (YYYY-MM-DD)                  |
| `date_before`         | Resultados anteriores a esta fecha (YYYY-MM-DD)                 |
| `ui_lang`             | Código de idioma de la UI (solo Brave)                         |
| `domain_filter`       | Arreglo de lista permitida/lista denegada de dominios (solo Perplexity)     |
| `max_tokens`          | Presupuesto total de contenido, predeterminado 25000 (solo Perplexity) |
| `max_tokens_per_page` | Límite de tokens por página, predeterminado 2048 (solo Perplexity)  |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo `llm-context` de Brave
  rechaza `ui_lang`, `freshness`, `date_after` y `date_before`.
  Gemini, Grok y Kimi devuelven una respuesta sintetizada con citas. Aceptan
  `count` para compatibilidad con la herramienta compartida, pero no cambia la
  forma de la respuesta fundamentada.
  Perplexity se comporta igual cuando usas la ruta de compatibilidad
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG acepta `http://` solo para hosts de confianza en red privada o loopback;
  los endpoints públicos de SearXNG deben usar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` a través de `web_search`:
  usa sus herramientas dedicadas para opciones avanzadas.
</Warning>

## `x_search`

`x_search` consulta publicaciones de X (antes Twitter) usando xAI y devuelve
respuestas sintetizadas por IA con citas. Acepta consultas en lenguaje natural y
filtros estructurados opcionales. OpenClaw solo habilita la herramienta integrada `x_search`
de xAI en la solicitud que atiende esta llamada de herramienta.

<Note>
  xAI documenta `x_search` como compatible con búsqueda por palabras clave, búsqueda semántica, búsqueda de usuarios y recuperación de hilos. Para estadísticas de interacción por publicación como reposts, respuestas, marcadores o visualizaciones, prefiere una búsqueda dirigida de la URL exacta de la publicación o del ID de estado. Las búsquedas amplias por palabras clave pueden encontrar la publicación correcta, pero devolver metadatos menos completos por publicación. Un buen patrón es: primero localiza la publicación y luego ejecuta una segunda consulta de `x_search` centrada en esa publicación exacta.
</Note>

### Configuración de `x_search`

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
            apiKey: "xai-...", // opcional si XAI_API_KEY está establecido
          },
        },
      },
    },
  },
}
```

### Parámetros de `x_search`

| Parámetro                    | Descripción                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de búsqueda (obligatoria)                                |
| `allowed_x_handles`          | Restringir resultados a identificadores concretos de X                 |
| `excluded_x_handles`         | Excluir identificadores concretos de X                             |
| `from_date`                  | Incluir solo publicaciones en esta fecha o después (YYYY-MM-DD)  |
| `to_date`                    | Incluir solo publicaciones en esta fecha o antes (YYYY-MM-DD) |
| `enable_image_understanding` | Permitir que xAI inspeccione imágenes adjuntas a publicaciones coincidentes      |
| `enable_video_understanding` | Permitir que xAI inspeccione videos adjuntos a publicaciones coincidentes      |

### Ejemplo de `x_search`

```javascript
await x_search({
  query: "recetas para cenar",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Estadísticas por publicación: usa la URL exacta del estado o el ID del estado cuando sea posible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ejemplos

```javascript
// Búsqueda básica
await web_search({ query: "SDK de Plugin de OpenClaw" });

// Búsqueda específica para Alemania
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Resultados recientes (última semana)
await web_search({ query: "avances en IA", freshness: "week" });

// Rango de fechas
await web_search({
  query: "investigación climática",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrado de dominios (solo Perplexity)
await web_search({
  query: "reseñas de productos",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfiles de herramientas

Si usas perfiles de herramientas o listas permitidas, agrega `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // o: allow: ["group:web"]  (incluye web_search, x_search y web_fetch)
  },
}
```

## Relacionado

- [Web Fetch](/es/tools/web-fetch) -- recuperar una URL y extraer contenido legible
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Grok Search](/es/tools/grok-search) -- Grok como proveedor de `web_search`
- [Ollama Web Search](/es/tools/ollama-search) -- búsqueda web sin clave a través de tu host Ollama
