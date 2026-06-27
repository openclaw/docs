---
read_when:
    - Desea habilitar o configurar web_search
    - Quieres habilitar o configurar x_search
    - Necesitas elegir un proveedor de búsqueda
    - Quieres comprender la detección automática y la selección de proveedor
sidebarTitle: Web Search
summary: web_search, x_search y web_fetch -- busca en la web, busca publicaciones de X u obtiene el contenido de una página
title: Búsqueda web
x-i18n:
    generated_at: "2026-06-27T13:14:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

La herramienta `web_search` busca en la web usando tu proveedor configurado y
devuelve resultados. Los resultados se almacenan en caché por consulta durante 15 minutos (configurable).

OpenClaw también incluye `x_search` para publicaciones de X (antes Twitter) y
`web_fetch` para obtención ligera de URL. En esta fase, `web_fetch` permanece
local mientras `web_search` y `x_search` pueden usar xAI Responses internamente.

<Info>
  `web_search` es una herramienta HTTP ligera, no automatización de navegador. Para
  sitios con mucho JS o inicios de sesión, usa [Navegador web](/es/tools/browser). Para
  obtener una URL específica, usa [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Choose a provider">
    Elige un proveedor y completa cualquier configuración requerida. Algunos proveedores no
    requieren clave, mientras que otros usan claves de API. Consulta las páginas de proveedores a continuación para
    más detalles.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Esto almacena el proveedor y cualquier credencial necesaria. También puedes definir una variable de entorno
    (por ejemplo `BRAVE_API_KEY`) y omitir este paso para proveedores respaldados por API.
  </Step>
  <Step title="Use it">
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

## Elección de un proveedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/es/tools/brave-search">
    Resultados estructurados con fragmentos. Admite el modo `llm-context` y filtros de país/idioma. Hay un nivel gratuito disponible.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/es/plugins/codex-harness">
    Respuestas fundamentadas sintetizadas por IA mediante tu cuenta de servidor de aplicación de Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Proveedor sin clave. No se necesita clave de API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal + por palabras clave con extracción de contenido (resaltados, texto, resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Funciona mejor junto con `firecrawl_search` y `firecrawl_scrape` para extracción profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/es/tools/gemini-search">
    Respuestas sintetizadas por IA con citas mediante fundamentación de Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/es/tools/grok-search">
    Respuestas sintetizadas por IA con citas mediante fundamentación web de xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/es/tools/kimi-search">
    Respuestas sintetizadas por IA con citas mediante búsqueda web de Moonshot; las alternativas de chat sin fundamentación fallan explícitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/es/tools/minimax-search">
    Resultados estructurados mediante la API de búsqueda de MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/es/tools/ollama-search">
    Búsqueda mediante un host local de Ollama con sesión iniciada o la API alojada de Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/es/tools/parallel-search">
    API de Parallel Search de pago (`PARALLEL_API_KEY`); límites de tasa más altos y ajuste de objetivos.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/es/tools/parallel-search">
    Activación sin clave. Search MCP gratuito de Parallel, con extractos densos optimizados para LLM y sin clave de API.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado por dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Metabúsqueda autoalojada. No se necesita clave de API. Agrega Google, Bing, DuckDuckGo y más.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para extracción de URL.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                        | Estilo de resultado                                            | Filtros                                          | Clave de API                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)                     | Fragmentos estructurados                                       | País, idioma, tiempo, modo `llm-context`         | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/es/plugins/codex-harness)    | Sintetizado por IA + URL de fuentes                            | Dominios, tamaño de contexto, ubicación del usuario | Ninguna; usa el inicio de sesión de Codex/OpenAI                                        |
| [DuckDuckGo](/es/tools/duckduckgo-search)           | Fragmentos estructurados                                       | --                                               | Ninguna (sin clave)                                                                     |
| [Exa](/es/tools/exa-search)                         | Estructurado + extraído                                        | Modo neuronal/palabra clave, fecha, extracción de contenido | `EXA_API_KEY`                                                                           |
| [Firecrawl](/es/tools/firecrawl)                    | Fragmentos estructurados                                       | Mediante la herramienta `firecrawl_search`       | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/es/tools/gemini-search)                   | Sintetizado por IA + citas                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/es/tools/grok-search)                       | Sintetizado por IA + citas                                     | --                                               | OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`             |
| [Kimi](/es/tools/kimi-search)                       | Sintetizado por IA + citas; falla con alternativas de chat sin fundamento | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/es/tools/minimax-search)          | Fragmentos estructurados                                       | Región (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/es/tools/ollama-search)        | Fragmentos estructurados                                       | --                                               | Ninguna para hosts locales con sesión iniciada; `OLLAMA_API_KEY` para búsqueda directa en `https://ollama.com` |
| [Parallel](/es/tools/parallel-search)               | Extractos densos clasificados para contexto de LLM             | --                                               | `PARALLEL_API_KEY` (de pago)                                                            |
| [Parallel Search (Free)](/es/tools/parallel-search) | Extractos densos clasificados para contexto de LLM             | --                                               | Ninguna (MCP de búsqueda gratuito)                                                      |
| [Perplexity](/es/tools/perplexity-search)           | Fragmentos estructurados                                       | País, idioma, tiempo, dominios, límites de contenido | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/es/tools/searxng-search)                 | Fragmentos estructurados                                       | Categorías, idioma                               | Ninguna (autoalojado)                                                                   |
| [Tavily](/es/tools/tavily)                          | Fragmentos estructurados                                       | Mediante la herramienta `tavily_search`          | `TAVILY_API_KEY`                                                                        |

## Detección automática

## Búsqueda web nativa de OpenAI

Los modelos directos de OpenAI Responses usan automáticamente la herramienta hospedada `web_search` de OpenAI cuando la búsqueda web de OpenClaw está habilitada y no hay ningún proveedor gestionado fijado. Este es un comportamiento propiedad del proveedor en el plugin de OpenAI incluido y solo se aplica al tráfico nativo de la API de OpenAI, no a URL base de proxy compatibles con OpenAI ni a rutas de Azure. Define `tools.web.search.provider` en otro proveedor, como `brave`, para conservar la herramienta gestionada `web_search` para los modelos de OpenAI, o define `tools.web.search.enabled: false` para deshabilitar tanto la búsqueda gestionada como la búsqueda nativa de OpenAI.

## Búsqueda web nativa de Codex

El runtime del servidor de aplicaciones de Codex usa automáticamente la herramienta
hospedada `web_search` de Codex cuando la búsqueda web está habilitada y no se ha
seleccionado ningún proveedor gestionado. La búsqueda hospedada nativa y la
herramienta dinámica gestionada `web_search` de OpenClaw son mutuamente excluyentes,
por lo que la búsqueda gestionada no puede omitir las restricciones de dominio nativas.
OpenClaw usa la herramienta gestionada cuando la búsqueda hospedada no está disponible,
está deshabilitada explícitamente o se reemplaza por un proveedor gestionado seleccionado.
OpenClaw mantiene deshabilitada la extensión independiente `web.run` de Codex porque
el tráfico de producción del servidor de aplicaciones rechaza su espacio de nombres
`web` definido por el usuario.

- Configura la búsqueda nativa en `tools.web.search.openaiCodex`
- Define `tools.web.search.provider: "codex"` para aprovisionar Codex Hosted Search como
  proveedor gestionado de `web_search` para cualquier modelo padre. Cada llamada ejecuta
  un turno efímero acotado del servidor de aplicaciones de Codex y falla si Codex no emite
  un elemento hospedado `webSearch`.
- `mode: "cached"` es la preferencia predeterminada, pero Codex la resuelve como acceso
  externo en vivo para turnos sin restricciones del servidor de aplicaciones; define `"live"` para solicitar
  acceso en vivo explícitamente
- Define `tools.web.search.provider` en un proveedor gestionado como `brave` para usar
  la `web_search` gestionada de OpenClaw en su lugar
- Define `tools.web.search.openaiCodex.enabled: false` para excluirte de la búsqueda
  hospedada por Codex; otros proveedores gestionados siguen disponibles
- Restringir la superficie de herramientas nativa de Codex también mantiene disponible
  la `web_search` gestionada
- Cuando `allowedDomains` está definido, la alternativa gestionada automática falla de forma cerrada si
  la búsqueda hospedada no está disponible, para que la lista de permitidos nativa no pueda omitirse
- Las ejecuciones solo LLM con herramientas deshabilitadas deshabilitan tanto la búsqueda nativa como la gestionada
- `tools.web.search.enabled: false` deshabilita tanto la búsqueda gestionada como la nativa

Los cambios persistentes de política de búsqueda efectiva de Codex inician un nuevo hilo vinculado
para que un hilo del servidor de aplicaciones ya cargado no pueda conservar acceso obsoleto a la búsqueda hospedada.
Las restricciones transitorias por turno usan un hilo restringido temporal y conservan
la vinculación existente para reanudarla más tarde.

El tráfico directo de OpenAI ChatGPT Responses también puede usar la herramienta hospedada
`web_search` de OpenAI. Esa ruta separada sigue siendo opcional mediante
`tools.web.search.openaiCodex.enabled: true` y solo se aplica a modelos
`openai/*` aptos que usan `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Para runtimes y proveedores que no admiten la búsqueda nativa de Codex, Codex puede
usar la alternativa gestionada `web_search` mediante el espacio de nombres de herramientas dinámicas de OpenClaw.
Usa un proveedor gestionado explícito cuando necesites los controles de red específicos
del proveedor de OpenClaw en lugar de la búsqueda hospedada por Codex.

Seleccionar `provider: "codex"` habilita el plugin `codex` incluido y usa las
mismas restricciones de `tools.web.search.openaiCodex` que se muestran arriba. Autentica primero el
servidor de aplicaciones Codex con `openclaw models auth login --provider openai`.
El agente padre puede usar cualquier modelo o runtime; solo el worker de búsqueda acotada
se ejecuta a través de Codex.

## Seguridad de red

Las llamadas del proveedor HTTP administrado `web_search` usan la ruta de fetch protegida de OpenClaw. Para
hosts de API de proveedor de confianza, OpenClaw permite respuestas DNS de IP falsa de
Surge, Clash y sing-box en `198.18.0.0/15` y `fc00::/7` solo para ese hostname de proveedor.
Otros destinos privados, loopback, link-local y de metadatos permanecen bloqueados.
Codex Hosted Search es la excepción: su worker acotado delega el acceso de red
a la herramienta `web_search` alojada del servidor de aplicaciones Codex.

Esta autorización automática no se aplica a URLs arbitrarias de `web_fetch`. Para
`web_fetch`, habilita `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explícitamente solo cuando tu
proxy de confianza sea propietario de esos rangos sintéticos.

## Configurar la búsqueda web

Las listas de proveedores en la documentación y los flujos de configuración están en orden alfabético. La detección automática mantiene un
orden de precedencia separado.

Si no se establece `provider`, OpenClaw revisa los proveedores en este orden y usa el
primero que esté listo:

Primero, proveedores respaldados por API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (orden 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (orden 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (orden 20)
4. **Grok** -- OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (orden 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (orden 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (orden 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (orden 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; el `plugins.entries.exa.config.webSearch.baseUrl` opcional reemplaza el endpoint de Exa (orden 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (orden 70)
10. **Parallel** -- API de Parallel Search de pago mediante `PARALLEL_API_KEY` o `plugins.entries.parallel.config.webSearch.apiKey`; el `plugins.entries.parallel.config.webSearch.baseUrl` opcional reemplaza el endpoint (orden 75)

Después, proveedores con endpoint configurado:

11. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Los proveedores sin clave, como **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** y **Codex Hosted Search**, solo están disponibles cuando los
seleccionas explícitamente con `tools.web.search.provider` o mediante
`openclaw configure --section web`. OpenClaw no envía consultas administradas de
`web_search` a un proveedor sin clave solo porque no haya ningún proveedor respaldado por API
configurado.

Los modelos OpenAI Responses son una excepción: mientras `tools.web.search.provider` no esté
establecido, usan la búsqueda web nativa de OpenAI en lugar de los proveedores administrados
anteriores. Establece `tools.web.search.provider` en `parallel-free` (u otro proveedor)
para enrutarlos por la ruta administrada.

<Note>
  Todos los campos de clave de proveedor admiten objetos SecretRef. Los SecretRefs con alcance de Plugin
  bajo `plugins.entries.<plugin>.config.webSearch.apiKey` se resuelven para los
  proveedores de búsqueda web respaldados por API instalados, incluidos Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity y Tavily,
  tanto si el proveedor se elige explícitamente mediante `tools.web.search.provider` como si
  se selecciona mediante detección automática. En modo de detección automática, OpenClaw resuelve solo la
  clave del proveedor seleccionado: los SecretRefs no seleccionados permanecen inactivos, por lo que puedes
  mantener varios proveedores configurados sin pagar el costo de resolución de los
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

La configuración específica del proveedor (claves de API, URLs base, modos) vive bajo
`plugins.entries.<plugin>.config.webSearch.*`. Gemini también puede reutilizar
`models.providers.google.apiKey` y `models.providers.google.baseUrl` como fallbacks de menor prioridad
después de su configuración dedicada de búsqueda web y `GEMINI_API_KEY`. Consulta las
páginas de proveedores para ver ejemplos.
Grok también puede reutilizar un perfil de autenticación OAuth de xAI desde `openclaw models auth login
--provider xai --method oauth`; la configuración de clave de API sigue siendo el fallback.

`tools.web.search.provider` se valida contra los ids de proveedores de búsqueda web
declarados por los manifiestos de plugins incluidos e instalados. Un error tipográfico como `"brvae"`
falla la validación de configuración en lugar de volver silenciosamente a la detección automática. Si un
proveedor configurado solo tiene evidencia de plugin obsoleta, como un bloque
`plugins.entries.<plugin>` restante después de desinstalar un plugin de terceros,
OpenClaw mantiene el inicio resiliente e informa una advertencia para que puedas reinstalar el
plugin o ejecutar `openclaw doctor --fix` para limpiar la configuración obsoleta.

La selección del proveedor fallback de `web_fetch` es independiente:

- elígelo con `tools.web.fetch.provider`
- o omite ese campo y deja que OpenClaw detecte automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales configuradas
- `web_fetch` sin sandbox puede usar proveedores de plugins instalados que declaren
  `contracts.webFetchProviders`; los fetches con sandbox permiten proveedores incluidos e
  instalaciones verificadas de plugins oficiales, pero excluyen plugins externos de terceros
- el plugin oficial Firecrawl proporciona fallback de web-fetch, configurado bajo
  `plugins.entries.firecrawl.config.webFetch.*`

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede pedir:

- la región de API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (el valor predeterminado es `kimi-k2.6`)

Para `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa el
mismo perfil de autenticación de xAI que el chat, o la credencial `XAI_API_KEY` / de búsqueda web del plugin
que usa la búsqueda web de Grok.
La configuración heredada `tools.web.x_search.*` se migra automáticamente mediante `openclaw doctor --fix`.
Cuando eliges Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también puede ofrecer la configuración opcional de `x_search` con la misma credencial.
Este es un paso de seguimiento separado dentro de la ruta de Grok, no una opción independiente de proveedor
de búsqueda web de nivel superior. Si eliges otro proveedor, OpenClaw no
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
    Establece la variable de entorno del proveedor en el entorno del proceso Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para una instalación de gateway, colócala en `~/.openclaw/.env`.
    Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de herramienta

| Parámetro             | Descripción                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de búsqueda (obligatorio)                    |
| `count`               | Resultados que devolver (1-10, predeterminado: 5)     |
| `country`             | Código de país ISO de 2 letras (p. ej., "US", "DE")  |
| `language`            | Código de idioma ISO 639-1 (p. ej., "en", "de")      |
| `search_lang`         | Código de idioma de búsqueda (solo Brave)             |
| `freshness`           | Filtro de tiempo: `day`, `week`, `month` o `year`     |
| `date_after`          | Resultados posteriores a esta fecha (YYYY-MM-DD)      |
| `date_before`         | Resultados anteriores a esta fecha (YYYY-MM-DD)       |
| `ui_lang`             | Código de idioma de UI (solo Brave)                   |
| `domain_filter`       | Array de allowlist/denylist de dominios (solo Perplexity) |
| `max_tokens`          | Presupuesto total de contenido, predeterminado 25000 (solo Perplexity) |
| `max_tokens_per_page` | Límite de tokens por página, predeterminado 2048 (solo Perplexity) |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo `llm-context` de Brave
  rechaza `ui_lang`; `date_before` también necesita `date_after` porque los rangos personalizados de
  freshness de Brave requieren fechas de inicio y fin.
  Gemini, Grok y Kimi devuelven una respuesta sintetizada con citas. Aceptan
  `count` por compatibilidad con la herramienta compartida, pero no cambia la
  forma de la respuesta fundamentada. Gemini trata la freshness `day` como una señal de recencia; valores de
  freshness más amplios y fechas explícitas establecen rangos de tiempo de grounding de Google Search.
  Perplexity se comporta de la misma manera cuando usas la ruta de compatibilidad
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG acepta `http://` solo para hosts de red privada o loopback de confianza;
  los endpoints públicos de SearXNG deben usar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` mediante `web_search`
  -- usa sus herramientas dedicadas para opciones avanzadas.
</Warning>

## x_search

`x_search` consulta publicaciones de X (antes Twitter) usando xAI y devuelve
respuestas sintetizadas por IA con citas. Acepta consultas en lenguaje natural y
filtros estructurados opcionales. OpenClaw solo habilita la herramienta `x_search`
integrada de xAI en la solicitud que atiende esta llamada de herramienta.

<Note>
  xAI documenta `x_search` como compatible con búsqueda por palabras clave, búsqueda semántica, búsqueda de usuarios
  y obtención de hilos. Para estadísticas de interacción por publicación, como reposts,
  respuestas, marcadores o visualizaciones, prefiere una búsqueda dirigida de la URL exacta de la publicación
  o del ID de estado. Las búsquedas amplias por palabras clave pueden encontrar la publicación correcta pero devolver metadatos
  por publicación menos completos. Un buen patrón es: primero localizar la publicación y luego
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` publica en `<baseUrl>/responses` cuando
`plugins.entries.xai.config.xSearch.baseUrl` está establecido. Si se omite ese campo,
recurre a `plugins.entries.xai.config.webSearch.baseUrl`, luego al
`tools.web.search.grok.baseUrl` heredado y finalmente al endpoint público de xAI.

### Parámetros de x_search

| Parámetro                    | Descripción                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de búsqueda (obligatoria)                     |
| `allowed_x_handles`          | Restringir resultados a handles específicos de X       |
| `excluded_x_handles`         | Excluir handles específicos de X                       |
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

Si usas perfiles de herramientas o listas de permitidos, agrega `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Relacionado

- [Extracción web](/es/tools/web-fetch) -- obtiene una URL y extrae contenido legible
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Búsqueda de Grok](/es/tools/grok-search) -- Grok como proveedor de `web_search`
- [Búsqueda web de Ollama](/es/tools/ollama-search) -- búsqueda web sin clave a través de tu host de Ollama
