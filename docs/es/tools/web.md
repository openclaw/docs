---
read_when:
    - Quieres habilitar o configurar web_search
    - Quieres habilitar o configurar x_search
    - Debes elegir un proveedor de búsqueda
    - Quieres comprender la detección automática y la selección de proveedores
sidebarTitle: Web Search
summary: 'web_search, x_search y web_fetch: busca en la web, busca publicaciones de X u obtiene el contenido de una página'
title: Búsqueda web
x-i18n:
    generated_at: "2026-07-11T23:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` busca en la web con el proveedor configurado y devuelve
resultados normalizados, almacenados en caché por consulta durante 15 minutos
(configurable). OpenClaw también incluye `x_search` para publicaciones de X
(anteriormente Twitter) y `web_fetch` para obtener URL de forma ligera.
`web_fetch` siempre se ejecuta localmente; `web_search` se enruta mediante
xAI Responses cuando Grok es el proveedor, y `x_search` siempre utiliza
xAI Responses.

<Info>
  `web_search` es una herramienta HTTP ligera, no una automatización del
  navegador. Para sitios que dependen mucho de JS o requieren inicio de sesión,
  usa el [navegador web](/es/tools/browser). Para obtener una URL específica, usa
  [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    Elige un proveedor y completa la configuración necesaria. Algunos
    proveedores no requieren clave, mientras que otros necesitan una clave de
    API. Consulta las páginas de los proveedores que aparecen a continuación
    para obtener más información.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Esto almacena el proveedor y las credenciales necesarias. Para los
    proveedores respaldados por una API, también puedes establecer la variable
    de entorno del proveedor (por ejemplo, `BRAVE_API_KEY`) y omitir este paso.
  </Step>
  <Step title="Úsalo">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Para publicaciones de X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Elegir un proveedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/es/tools/brave-search">
    Resultados estructurados con fragmentos. Admite el modo `llm-context` y filtros por país e idioma. Hay un nivel gratuito disponible.
  </Card>
  <Card title="Búsqueda alojada de Codex" icon="search" href="/es/plugins/codex-harness">
    Respuestas sintetizadas por IA y fundamentadas mediante tu cuenta del servidor de aplicaciones de Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Proveedor sin clave. No se necesita una clave de API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal y por palabras clave con extracción de contenido (elementos destacados, texto y resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Se recomienda combinarlo con `firecrawl_search` y `firecrawl_scrape` para realizar extracciones exhaustivas.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/es/tools/gemini-search">
    Respuestas sintetizadas por IA con citas mediante la fundamentación de Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/es/tools/grok-search">
    Respuestas sintetizadas por IA con citas mediante la fundamentación web de xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/es/tools/kimi-search">
    Respuestas sintetizadas por IA con citas mediante la búsqueda web de Moonshot; las alternativas de chat sin fundamentación fallan explícitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/es/tools/minimax-search">
    Resultados estructurados mediante la API de búsqueda del plan de tokens de MiniMax.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/es/tools/ollama-search">
    Búsqueda mediante un host local de Ollama con sesión iniciada o la API alojada de Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/es/tools/parallel-search">
    API de pago de Parallel Search (`PARALLEL_API_KEY`), con límites de frecuencia más altos y ajuste de objetivos.
  </Card>
  <Card title="Parallel Search (gratuita)" icon="layer-group" href="/es/tools/parallel-search">
    Opción voluntaria sin clave. Search MCP gratuito de Parallel, con fragmentos densos optimizados para LLM y sin clave de API.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado por dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Metabuscador autoalojado. No se necesita una clave de API. Agrega resultados de Google, Bing, DuckDuckGo y otros servicios.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para la extracción de URL.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                        | Estilo de los resultados                                         | Filtros                                                 | Clave de API                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)                     | Fragmentos estructurados                                         | País, idioma, tiempo, modo `llm-context`                | `BRAVE_API_KEY`                                                                                       |
| [Búsqueda alojada de Codex](/es/plugins/codex-harness) | Resultados sintetizados por IA + URL de origen                 | Dominios, tamaño del contexto, ubicación del usuario    | Ninguna; utiliza el inicio de sesión de Codex/OpenAI                                                   |
| [DuckDuckGo](/es/tools/duckduckgo-search)           | Fragmentos estructurados                                         | --                                                      | Ninguna (sin clave)                                                                                   |
| [Exa](/es/tools/exa-search)                         | Resultados estructurados + contenido extraído                    | Modo neuronal/por palabras clave, fecha, extracción de contenido | `EXA_API_KEY`                                                                                 |
| [Firecrawl](/es/tools/firecrawl)                    | Fragmentos estructurados                                         | Mediante la herramienta `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                                                   |
| [Gemini](/es/tools/gemini-search)                   | Resultados sintetizados por IA + citas                           | --                                                      | `GEMINI_API_KEY`                                                                                      |
| [Grok](/es/tools/grok-search)                       | Resultados sintetizados por IA + citas                           | --                                                      | OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`                            |
| [Kimi](/es/tools/kimi-search)                       | Resultados sintetizados por IA + citas; falla con alternativas de chat sin fundamentación | --                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                                   |
| [MiniMax Search](/es/tools/minimax-search)          | Fragmentos estructurados                                         | Región (`global` / `cn`)                                | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`                            |
| [Ollama Web Search](/es/tools/ollama-search)        | Fragmentos estructurados                                         | --                                                      | Ninguna para hosts locales con sesión iniciada; `OLLAMA_API_KEY` para búsquedas directas en `https://ollama.com` |
| [Parallel](/es/tools/parallel-search)               | Fragmentos densos clasificados para el contexto del LLM          | --                                                      | `PARALLEL_API_KEY` (de pago)                                                                          |
| [Parallel Search (gratuita)](/es/tools/parallel-search) | Fragmentos densos clasificados para el contexto del LLM       | --                                                      | Ninguna (Search MCP gratuito)                                                                         |
| [Perplexity](/es/tools/perplexity-search)           | Fragmentos estructurados                                         | País, idioma, tiempo, dominios, límites de contenido    | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                                           |
| [SearXNG](/es/tools/searxng-search)                 | Fragmentos estructurados                                         | Categorías, idioma                                      | Ninguna (autoalojado)                                                                                 |
| [Tavily](/es/tools/tavily)                          | Fragmentos estructurados                                         | Mediante la herramienta `tavily_search`                 | `TAVILY_API_KEY`                                                                                      |

## Detección automática

Las listas de proveedores en la documentación y los flujos de configuración
están ordenadas alfabéticamente. La detección automática utiliza un orden de
precedencia fijo independiente y solo elige un proveedor que necesite una
credencial (`requiresCredential !== false`) cuando encuentra una configurada.
Si no se establece ningún `provider`, OpenClaw comprueba los proveedores en
este orden y utiliza el primero que esté listo:

Primero, los proveedores respaldados por API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (orden 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (orden 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (orden 20)
4. **Grok** -- OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (orden 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (orden 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (orden 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (orden 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; el valor opcional `plugins.entries.exa.config.webSearch.baseUrl` sustituye el punto de conexión de Exa (orden 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (orden 70)
10. **Parallel** -- API de pago de Parallel Search mediante `PARALLEL_API_KEY` o `plugins.entries.parallel.config.webSearch.apiKey`; el valor opcional `plugins.entries.parallel.config.webSearch.baseUrl` sustituye el punto de conexión (orden 75)

Después, los proveedores con un punto de conexión configurado:

11. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Los proveedores sin clave, como **Parallel Search (gratuita)**, **DuckDuckGo**,
**Ollama Web Search** y **Búsqueda alojada de Codex**, nunca tienen prioridad
en la detección automática, aunque dispongan de un valor de orden interno. Solo
se utilizan cuando los seleccionas explícitamente mediante
`tools.web.search.provider` o `openclaw configure --section web`. OpenClaw no
envía consultas administradas de `web_search` a un proveedor sin clave solo
porque no haya configurado ningún proveedor respaldado por API.

Los modelos OpenAI Responses son una excepción: mientras
`tools.web.search.provider` no esté establecido, utilizan la búsqueda web
nativa de OpenAI en lugar de los proveedores administrados anteriores (consulta
la sección siguiente). Establece `tools.web.search.provider` en
`parallel-free` (u otro proveedor) para enrutarlos mediante la ruta administrada.

<Note>
  Todos los campos de clave de proveedor admiten objetos SecretRef. Las
  SecretRefs con ámbito de Plugin en
  `plugins.entries.<plugin>.config.webSearch.apiKey` se resuelven para los
  proveedores instalados de búsqueda web respaldados por API, incluidos Brave,
  Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity y Tavily,
  tanto si el proveedor se elige explícitamente mediante
  `tools.web.search.provider` como si se selecciona mediante detección
  automática. En el modo de detección automática, OpenClaw solo resuelve la
  clave del proveedor seleccionado; las SecretRefs no seleccionadas permanecen
  inactivas, por lo que puedes mantener varios proveedores configurados sin
  pagar el coste de resolución de los que no utilizas.
</Note>

## Búsqueda web nativa de OpenAI

Los modelos directos de OpenAI Responses (`api: "openai-responses"`, proveedor `openai`,
sin URL base o con una URL base oficial de la API de OpenAI) usan automáticamente la
herramienta `web_search` alojada de OpenAI cuando la búsqueda web de OpenClaw está
habilitada y no se ha fijado ningún proveedor gestionado. Este comportamiento pertenece
al proveedor en el Plugin de OpenAI incluido y no se aplica a las URL base de proxies
compatibles con OpenAI ni a las rutas de Azure. Establece
`tools.web.search.provider` en otro proveedor, como `brave`, para conservar la herramienta
`web_search` gestionada para los modelos de OpenAI, o establece
`tools.web.search.enabled: false` para deshabilitar tanto la búsqueda gestionada como la
búsqueda nativa de OpenAI.

## Búsqueda web nativa de Codex

El entorno de ejecución del servidor de aplicaciones de Codex usa automáticamente la
herramienta `web_search` alojada de Codex cuando la búsqueda web está habilitada y no se
ha seleccionado ningún proveedor gestionado. La búsqueda nativa alojada y la herramienta
dinámica `web_search` gestionada de OpenClaw son mutuamente excluyentes, por lo que la
búsqueda gestionada no puede eludir las restricciones nativas de dominios. OpenClaw usa
la herramienta gestionada cuando la búsqueda alojada no está disponible, se ha
deshabilitado explícitamente o se ha reemplazado por un proveedor gestionado seleccionado.
OpenClaw mantiene deshabilitada la extensión independiente `web.run` de Codex
(`features.standalone_web_search: false`) porque el tráfico de producción del servidor
de aplicaciones rechaza su espacio de nombres `web` definido por el usuario.

- Configura la búsqueda nativa en `tools.web.search.openaiCodex`
- Establece `tools.web.search.provider: "codex"` para proporcionar Codex Hosted Search
  como proveedor gestionado de `web_search` para cualquier modelo principal. Cada llamada
  ejecuta un turno efímero y acotado del servidor de aplicaciones de Codex y falla si
  Codex no emite un elemento `webSearch` alojado.
- `mode: "cached"` es la preferencia predeterminada, pero Codex la resuelve como acceso
  externo en vivo para los turnos sin restricciones del servidor de aplicaciones;
  establece `"live"` para solicitar explícitamente acceso en vivo
- Establece `tools.web.search.provider` en un proveedor gestionado, como `brave`, para
  usar en su lugar la herramienta `web_search` gestionada de OpenClaw
- Establece `tools.web.search.openaiCodex.enabled: false` para excluir la búsqueda
  alojada por Codex; los demás proveedores gestionados siguen disponibles
- Restringir la superficie de herramientas nativas de Codex también mantiene disponible
  la herramienta `web_search` gestionada
- Cuando se establece `allowedDomains`, el respaldo gestionado automático falla de forma
  segura si la búsqueda alojada no está disponible, de modo que no se pueda eludir la
  lista de permitidos nativa
- Las ejecuciones que solo usan el LLM y tienen las herramientas deshabilitadas
  deshabilitan tanto la búsqueda nativa como la gestionada
- `tools.web.search.enabled: false` deshabilita tanto la búsqueda gestionada como la nativa

Los cambios persistentes en la política efectiva de búsqueda de Codex inician un nuevo
hilo vinculado para que un hilo ya cargado del servidor de aplicaciones no pueda conservar
acceso obsoleto a la búsqueda alojada. Las restricciones transitorias por turno usan un
hilo restringido temporal y conservan la vinculación existente para reanudarla más adelante.

El tráfico directo de OpenAI ChatGPT Responses también puede usar la herramienta
`web_search` alojada de OpenAI. Esa ruta independiente sigue siendo opcional mediante
`tools.web.search.openaiCodex.enabled: true` y solo se aplica a los modelos `openai/*`
aptos que usan `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Opcional: usar Codex Hosted Search también desde modelos principales que no sean de Codex.
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

En los entornos de ejecución y proveedores que no admiten la búsqueda nativa de Codex,
Codex puede usar el respaldo gestionado `web_search` mediante el espacio de nombres de
herramientas dinámicas de OpenClaw. Usa un proveedor gestionado explícito cuando necesites
los controles de red específicos del proveedor de OpenClaw en lugar de la búsqueda
alojada por Codex.

Seleccionar `provider: "codex"` habilita el Plugin `codex` incluido y usa las mismas
restricciones de `tools.web.search.openaiCodex` mostradas anteriormente. Primero autentica
el servidor de aplicaciones de Codex con `openclaw models auth login --provider openai`.
El agente principal puede usar cualquier modelo o entorno de ejecución; solo el trabajador
de búsqueda acotado se ejecuta mediante Codex.

## Seguridad de red

Las llamadas HTTP gestionadas a proveedores de `web_search` usan la ruta de obtención
protegida de OpenClaw, limitada al nombre de host propio del proveedor actual. Solo para
ese nombre de host, OpenClaw permite las respuestas DNS de IP falsa de Surge, Clash y
sing-box en `198.18.0.0/15` y `fc00::/7`. Los demás destinos privados, de local loopback,
de enlace local y de metadatos siguen bloqueados. Codex Hosted Search es la excepción:
su trabajador acotado delega el acceso a la red en la herramienta `web_search` alojada
del servidor de aplicaciones de Codex.

Esta autorización automática no se aplica a URL arbitrarias de `web_fetch`. Para
`web_fetch`, habilita explícitamente `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`
y `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` solo cuando tu proxy de confianza
sea el propietario de esos intervalos sintéticos.

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // valor predeterminado: true
        provider: "brave", // o se omite para la detección automática
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuración específica del proveedor (claves de API, URL base y modos) se encuentra
en `plugins.entries.<plugin>.config.webSearch.*`. Gemini también puede reutilizar
`models.providers.google.apiKey` y `models.providers.google.baseUrl` como respaldos de
menor prioridad después de su configuración dedicada de búsqueda web y `GEMINI_API_KEY`.
Consulta ejemplos en las páginas de los proveedores.
Grok también puede reutilizar un perfil de autenticación OAuth de xAI procedente de
`openclaw models auth login --provider xai --method oauth`; la configuración mediante
clave de API sigue siendo el respaldo.

`tools.web.search.provider` se valida respecto a los identificadores de proveedores de
búsqueda web declarados por los manifiestos de Plugins incluidos e instalados. Un error
tipográfico como `"brvae"` provoca un error de validación de la configuración en lugar
de recurrir silenciosamente a la detección automática. Si un proveedor configurado solo
tiene indicios obsoletos del Plugin, como un bloque residual
`plugins.entries.<plugin>` después de desinstalar un Plugin de terceros, OpenClaw mantiene
un inicio resistente e informa de una advertencia para que puedas reinstalar el Plugin o
ejecutar `openclaw doctor --fix` a fin de limpiar la configuración obsoleta.

La selección del proveedor de respaldo de `web_fetch` es independiente:

- selecciónalo con `tools.web.fetch.provider`
- u omite ese campo y deja que OpenClaw detecte automáticamente el primer proveedor de
  obtención web preparado a partir de las credenciales configuradas
- `web_fetch` sin aislamiento puede usar proveedores de Plugins instalados que declaren
  `contracts.webFetchProviders`; las obtenciones aisladas permiten proveedores incluidos
  e instalaciones verificadas de Plugins oficiales, pero excluyen los Plugins externos
  de terceros
- el Plugin oficial de Firecrawl es actualmente el único colaborador incluido de
  `webFetchProviders`, configurado en
  `plugins.entries.firecrawl.config.webFetch.*`

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede solicitar:

- la región de la API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (el valor predeterminado es `kimi-k2.6`)

Para `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa el mismo perfil
de autenticación de xAI que el chat, o la credencial `XAI_API_KEY` o de búsqueda web del
Plugin que usa la búsqueda web de Grok.
`openclaw doctor --fix` migra automáticamente la configuración heredada
`tools.web.x_search.*`.
Cuando eliges Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también ofrece la configuración opcional de `x_search` con la misma credencial
justo después de completar la configuración de Grok. Se trata de un paso de seguimiento
independiente dentro de la ruta de Grok, no de una opción independiente de proveedor de
búsqueda web de nivel superior. Si eliges otro proveedor, OpenClaw no muestra la solicitud
de `x_search`.

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

    Para una instalación del Gateway, colócala en `~/.openclaw/.env`.
    Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de la herramienta

| Parámetro             | Descripción                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Consulta de búsqueda (obligatoria)                                 |
| `count`               | Resultados que se devolverán (1-10; valor predeterminado: 5)       |
| `country`             | Código de país ISO de 2 letras (p. ej., "US", "DE")                |
| `language`            | Código de idioma ISO 639-1 (p. ej., "en", "de")                    |
| `search_lang`         | Código del idioma de búsqueda (solo Brave)                         |
| `freshness`           | Filtro temporal: `day`, `week`, `month` o `year`                   |
| `date_after`          | Resultados posteriores a esta fecha (AAAA-MM-DD)                   |
| `date_before`         | Resultados anteriores a esta fecha (AAAA-MM-DD)                    |
| `ui_lang`             | Código de idioma de la interfaz (solo Brave)                       |
| `domain_filter`       | Matriz de dominios permitidos o denegados (solo Perplexity)        |
| `max_tokens`          | Presupuesto total de tokens de contenido, solo en la API nativa de Perplexity Search |
| `max_tokens_per_page` | Límite de tokens de extracción por página, solo en la API nativa de Perplexity Search |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo `llm-context` de
  Brave rechaza `ui_lang`; `date_before` también necesita `date_after` porque los intervalos
  de actualidad personalizados de Brave requieren tanto una fecha de inicio como una de fin.
  Gemini, Grok y Kimi devuelven una única respuesta sintetizada con citas. Aceptan `count`
  para mantener la compatibilidad de la herramienta compartida, pero no cambia la estructura
  de la respuesta fundamentada. Gemini trata la actualidad `day` como una indicación de
  recencia; los valores de actualidad más amplios y las fechas explícitas establecen
  intervalos temporales para la fundamentación de Google Search.
  Perplexity se comporta del mismo modo cuando usas la ruta de compatibilidad de
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`); esa ruta tampoco admite `max_tokens` ni
  `max_tokens_per_page`.
  SearXNG acepta `http://` solo para hosts de confianza de redes privadas o de local loopback;
  los puntos de conexión públicos de SearXNG deben usar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` mediante `web_search`;
  usa sus herramientas dedicadas para las opciones avanzadas.
</Warning>

## x_search

`x_search` consulta publicaciones de X (antes Twitter) mediante xAI y devuelve respuestas
sintetizadas por IA con citas. Acepta consultas en lenguaje natural y filtros estructurados
opcionales. OpenClaw construye la herramienta integrada `x_search` de xAI para cada
solicitud en lugar de mantenerla registrada permanentemente, por lo que solo está activa
durante el turno que realmente la invoca.

<Warning>
  `x_search` se ejecuta en los servidores de xAI. xAI cobra 5 USD por cada 1000 llamadas
  a herramientas, además de los tokens de entrada y salida del modelo.
</Warning>

<Note>
  La documentación de xAI indica que `x_search` admite búsqueda por palabras clave,
  búsqueda semántica, búsqueda de usuarios y obtención de hilos. Para estadísticas de
  interacción por publicación, como republicaciones, respuestas, marcadores o
  visualizaciones, es preferible realizar una consulta específica de la URL exacta de la
  publicación o del identificador de estado. Las búsquedas amplias por palabras clave
  pueden encontrar la publicación correcta, pero devolver metadatos por publicación menos
  completos. Un buen patrón es localizar primero la publicación y luego ejecutar una segunda
  consulta `x_search` centrada en esa publicación exacta.
</Note>

### Configuración de x_search

Con `enabled` omitido, `x_search` solo se expone cuando el proveedor del modelo
activo es `xai` y se pueden resolver las credenciales de xAI. Para un modelo activo
con un proveedor conocido distinto de xAI, establece `plugins.entries.xai.config.xSearch.enabled`
en `true` para habilitar voluntariamente el uso entre proveedores. Si falta el proveedor
del modelo activo o no se puede resolver, la herramienta permanece oculta. Establece
`enabled` en `false` para deshabilitarla para todos los proveedores. Las credenciales
de xAI son siempre obligatorias.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

`x_search` envía solicitudes a `<baseUrl>/responses` cuando
`plugins.entries.xai.config.xSearch.baseUrl` está establecido. Si se omite ese campo,
recurre a `plugins.entries.xai.config.webSearch.baseUrl`, después al
`tools.web.search.grok.baseUrl` heredado y, por último, al endpoint público de xAI
(`https://api.x.ai/v1`).

### Parámetros de x_search

| Parámetro                    | Descripción                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `query`                      | Consulta de búsqueda (obligatoria)                               |
| `allowed_x_handles`          | Restringe los resultados a un máximo de 20 identificadores de X  |
| `excluded_x_handles`         | Excluye un máximo de 20 identificadores de X                     |
| `from_date`                  | Incluye solo publicaciones de esta fecha o posteriores (AAAA-MM-DD) |
| `to_date`                    | Incluye solo publicaciones de esta fecha o anteriores (AAAA-MM-DD) |
| `enable_image_understanding` | Permite que xAI examine las imágenes adjuntas a publicaciones coincidentes |
| `enable_video_understanding` | Permite que xAI examine los vídeos adjuntos a publicaciones coincidentes |

`allowed_x_handles` y `excluded_x_handles` son mutuamente excluyentes.

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

Si utilizas perfiles de herramientas o listas de permitidos, añade `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Contenido relacionado

- [Obtención web](/es/tools/web-fetch) -- obtiene una URL y extrae contenido legible
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con uso intensivo de JS
- [Búsqueda con Grok](/es/tools/grok-search) -- Grok como proveedor de `web_search`
- [Búsqueda web de Ollama](/es/tools/ollama-search) -- búsqueda web sin clave mediante tu host de Ollama
