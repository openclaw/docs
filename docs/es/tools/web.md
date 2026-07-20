---
read_when:
    - Quieres habilitar o configurar web_search
    - Desea habilitar o configurar x_search
    - Debe elegir un proveedor de búsqueda
    - Quieres comprender la detección automática y la selección de proveedores
sidebarTitle: Web Search
summary: 'web_search, x_search y web_fetch: busca en la web, busca publicaciones de X u obtén el contenido de una página'
title: Búsqueda web
x-i18n:
    generated_at: "2026-07-20T00:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 997e51064b0cd08d0f30987aa038e2f4a98da22f1094974b45f59c18491bd979
    source_path: tools/web.md
    workflow: 16
---

`web_search` busca en la web con el proveedor configurado y devuelve
resultados normalizados, almacenados en caché por consulta durante 15 minutos (configurable). OpenClaw
también incluye `x_search` para publicaciones de X (anteriormente Twitter) y `web_fetch` para
la obtención ligera de URL. `web_fetch` siempre se ejecuta localmente; `web_search` se canaliza
a través de xAI Responses cuando Grok es el proveedor, y `x_search` siempre usa
xAI Responses.

<Info>
  `web_search` es una herramienta HTTP ligera, no una automatización del navegador. Para
  sitios que dependen mucho de JS o que requieren inicio de sesión, use el [navegador web](/es/tools/browser). Para
  obtener una URL específica, use [Web Fetch](/es/tools/web-fetch).
</Info>

## Inicio rápido

<Steps>
  <Step title="Elegir un proveedor">
    Elija un proveedor y complete la configuración necesaria. Algunos proveedores
    no requieren clave; otros necesitan una clave de API. Consulte las páginas de los proveedores a continuación para
    obtener más información.
  </Step>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    ```
    Esto almacena el proveedor y las credenciales necesarias. Para los proveedores respaldados
    por API, puede establecer en su lugar la variable de entorno del proveedor (por ejemplo,
    `BRAVE_API_KEY`) y omitir este paso.
  </Step>
  <Step title="Usarlo">
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
    Resultados estructurados con fragmentos. Admite el modo `llm-context` y filtros de país/idioma. Hay un nivel gratuito disponible.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/es/plugins/codex-harness">
    Respuestas sintetizadas por IA y fundamentadas a través de su cuenta del servidor de aplicaciones de Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/es/tools/duckduckgo-search">
    Proveedor sin clave. No se necesita una clave de API. Integración no oficial basada en HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/es/tools/exa-search">
    Búsqueda neuronal y por palabras clave con extracción de contenido (elementos destacados, texto y resúmenes).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/es/tools/firecrawl">
    Resultados estructurados. Se combina mejor con `firecrawl_search` y `firecrawl_scrape` para una extracción profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/es/tools/gemini-search">
    Respuestas sintetizadas por IA con citas mediante la fundamentación de Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/es/tools/grok-search">
    Respuestas sintetizadas por IA con citas mediante la fundamentación web de xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/es/tools/kimi-search">
    Respuestas sintetizadas por IA con citas mediante la búsqueda web de Moonshot; las alternativas de chat no fundamentadas fallan explícitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/es/tools/minimax-search">
    Resultados estructurados mediante la API de búsqueda de MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/es/tools/ollama-search">
    Búsqueda mediante un host local de Ollama con sesión iniciada o la API alojada de Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/es/tools/parallel-search">
    API de pago de Parallel Search (`PARALLEL_API_KEY`); límites de frecuencia más altos y ajuste de objetivos.
  </Card>
  <Card title="Parallel Search (gratuito)" icon="layer-group" href="/es/tools/parallel-search">
    Opción voluntaria sin clave. El MCP de búsqueda gratuito de Parallel, con fragmentos densos optimizados para LLM y sin clave de API.
  </Card>
  <Card title="Perplexity" icon="search" href="/es/tools/perplexity-search">
    Resultados estructurados con controles de extracción de contenido y filtrado por dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/es/tools/searxng-search">
    Metabuscador autoalojado. No se necesita una clave de API. Agrega Google, Bing, DuckDuckGo y otros.
  </Card>
  <Card title="Tavily" icon="globe" href="/es/tools/tavily">
    Resultados estructurados con profundidad de búsqueda, filtrado por tema y `tavily_extract` para la extracción de URL.
  </Card>
</CardGroup>

### Comparación de proveedores

| Proveedor                                         | Estilo de resultados                                                   | Filtros                                          | Clave de API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/es/tools/brave-search)                     | Fragmentos estructurados                                            | País, idioma, tiempo, modo `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/es/plugins/codex-harness)    | Sintetizados por IA + URL de origen                                   | Dominios, tamaño del contexto, ubicación del usuario             | Ninguna; usa el inicio de sesión de Codex/OpenAI                                                         |
| [DuckDuckGo](/es/tools/duckduckgo-search)           | Fragmentos estructurados                                            | --                                               | Ninguna (sin clave)                                                                         |
| [Exa](/es/tools/exa-search)                         | Estructurados + extraídos                                         | Modo neuronal/por palabras clave, fecha, extracción de contenido    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/es/tools/firecrawl)                    | Fragmentos estructurados                                            | Mediante la herramienta `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/es/tools/gemini-search)                   | Sintetizados por IA + citas                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/es/tools/grok-search)                       | Sintetizados por IA + citas                                     | --                                               | OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/es/tools/kimi-search)                       | Sintetizados por IA + citas; falla con alternativas de chat no fundamentadas | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/es/tools/minimax-search)          | Fragmentos estructurados                                            | Región (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/es/tools/ollama-search)        | Fragmentos estructurados                                            | --                                               | Ninguna para hosts locales con sesión iniciada; `OLLAMA_API_KEY` para búsqueda directa con `https://ollama.com` |
| [Parallel](/es/tools/parallel-search)               | Fragmentos densos clasificados para el contexto de LLM                          | --                                               | `PARALLEL_API_KEY` (de pago)                                                               |
| [Parallel Search (gratuito)](/es/tools/parallel-search) | Fragmentos densos clasificados para el contexto de LLM                          | --                                               | Ninguna (MCP de búsqueda gratuito)                                                                  |
| [Perplexity](/es/tools/perplexity-search)           | Fragmentos estructurados                                            | País, idioma, tiempo, dominios, límites de contenido | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/es/tools/searxng-search)                 | Fragmentos estructurados                                            | Categorías, idioma                             | Ninguna (autoalojado)                                                                      |
| [Tavily](/es/tools/tavily)                          | Fragmentos estructurados                                            | Mediante la herramienta `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Forma del resultado

`web_search` normaliza cada proveedor de Plugin incluido y externo en el límite
de la herramienta principal. Los consumidores reciben exactamente una de estas formas cerradas:

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

Los proveedores estructurados usan `kind: "results"`; los proveedores sintetizados usan
`kind: "answer"`. Los proveedores de Plugin externos cuyas cargas útiles no coinciden con ninguna de las formas
se transmiten literalmente como `kind: "raw"` por compatibilidad. Los campos específicos
del proveedor, como puntuaciones sin procesar, fragmentos, búsquedas relacionadas, desplazamientos
de citas en línea, identificadores de modelos o metadatos de sesión, no se transmiten en las ramas
normalizadas. Use la herramienta específica de un proveedor cuando su respuesta más completa forme parte de
su flujo de trabajo.

`externalContent.wrapped: true` es un marcador de confianza que el propio límite establece como
verdadero: el texto del proveedor (`title`, `snippet`, `siteName`, `content`, títulos de
citas y `message` de error) se depura de cualquier línea envolvente preexistente y
se vuelve a envolver exactamente una vez en el límite principal, por lo que ningún metadato del proveedor puede
suplantar el marcador. `query` siempre es la consulta solicitada, las URL de citas y resultados
deben poder analizarse como http(s), `published` debe tener formato de fecha ISO, las URL se emiten canonicalizadas y una
carga útil que contenga una clave `error` siempre se informa como `kind: "error"`, con el
código del proveedor sin procesar conservado dentro del mensaje envuelto. Las cargas útiles transmitidas
sin procesar conservan los marcadores que haya establecido el proveedor.

## Detección automática

Las listas de proveedores en la documentación y los flujos de configuración están ordenadas alfabéticamente. La detección automática usa un
orden de precedencia independiente y fijo, y solo selecciona un proveedor que necesita una
credencial (`requiresCredential !== false`) cuando encuentra una configurada. Si
no se establece `provider`, OpenClaw comprueba los proveedores en este orden y usa el
primero que esté listo:

Primero, los proveedores respaldados por API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (orden 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (orden 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (orden 20)
4. **Grok** -- OAuth de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (orden 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (orden 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (orden 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (orden 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; el valor opcional `plugins.entries.exa.config.webSearch.baseUrl` sustituye el endpoint de Exa (orden 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (orden 70)
10. **Parallel** -- API de pago Parallel Search mediante `PARALLEL_API_KEY` o `plugins.entries.parallel.config.webSearch.apiKey`; el valor opcional `plugins.entries.parallel.config.webSearch.baseUrl` sustituye el endpoint (orden 75)

A continuación, proveedores con endpoint configurado:

11. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (orden 200)

Los proveedores sin clave, como **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** y **Codex Hosted Search**, nunca tienen prioridad en la detección automática,
aunque tengan un valor de orden interno. Solo se utilizan cuando se
seleccionan explícitamente con `tools.web.search.provider` o mediante
`openclaw configure --section web`. OpenClaw no envía consultas administradas de
`web_search` a un proveedor sin clave solo porque no haya configurado
ningún proveedor respaldado por una API.

Los modelos OpenAI Responses son una excepción: mientras `tools.web.search.provider`
no esté definido, utilizan la búsqueda web nativa de OpenAI en lugar de los
proveedores administrados anteriores (véase más adelante). Defina `tools.web.search.provider` como
`parallel-free` (u otro proveedor) para dirigirlos por la ruta administrada
en su lugar.

<Note>
  Todos los campos de clave de proveedor admiten objetos SecretRef. Las SecretRefs con ámbito de Plugin
  en `plugins.entries.<plugin>.config.webSearch.apiKey` se resuelven para los
  proveedores de búsqueda web instalados y respaldados por una API, incluidos Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity y Tavily,
  tanto si el proveedor se elige explícitamente mediante `tools.web.search.provider` como si
  se selecciona mediante detección automática. En el modo de detección automática, OpenClaw solo resuelve la
  clave del proveedor seleccionado; las SecretRefs no seleccionadas permanecen inactivas, por lo que se pueden
  mantener varios proveedores configurados sin pagar el coste de resolución de los
  que no se utilizan.
</Note>

## Búsqueda web nativa de OpenAI

Los modelos directos de OpenAI Responses (`api: "openai-responses"`, proveedor `openai`,
sin URL base o con una URL base oficial de la API de OpenAI) utilizan automáticamente la
herramienta alojada `web_search` de OpenAI cuando la búsqueda web de OpenClaw está habilitada y no hay
ningún proveedor administrado fijado. Este es un comportamiento propio del proveedor en el Plugin
de OpenAI incluido y no se aplica a URL base de proxy compatibles con OpenAI ni a rutas de Azure.
Defina `tools.web.search.provider` como otro proveedor, por ejemplo `brave`, para
mantener la herramienta administrada `web_search` para los modelos de OpenAI, o defina
`tools.web.search.enabled: false` para deshabilitar tanto la búsqueda administrada como la búsqueda nativa
de OpenAI.

## Búsqueda web nativa de Codex

El runtime del servidor de aplicaciones Codex utiliza automáticamente la herramienta alojada `web_search` de Codex
cuando la búsqueda web está habilitada y no hay ningún proveedor administrado seleccionado. La búsqueda alojada
nativa y la herramienta dinámica administrada `web_search` de OpenClaw son mutuamente excluyentes,
por lo que la búsqueda administrada no puede eludir las restricciones nativas de dominios. OpenClaw utiliza la
herramienta administrada cuando la búsqueda alojada no está disponible, está deshabilitada explícitamente o
se sustituye por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la extensión
independiente `web.run` de Codex (`features.standalone_web_search: false`)
porque el tráfico de producción del servidor de aplicaciones rechaza su espacio de nombres `web`
definido por el usuario.

- Configure la búsqueda nativa en `tools.web.search.openaiCodex`
- Defina `tools.web.search.provider: "codex"` para aprovisionar Codex Hosted Search como
  el proveedor administrado `web_search` para cualquier modelo principal. Cada llamada ejecuta un
  turno efímero y acotado del servidor de aplicaciones Codex y falla si Codex no emite un
  elemento alojado `webSearch`.
- `mode: "cached"` es la preferencia predeterminada, pero Codex la resuelve como acceso
  externo en vivo para turnos sin restricciones del servidor de aplicaciones; defina `"live"` para solicitar
  acceso en vivo explícitamente
- Defina `tools.web.search.provider` como un proveedor administrado, por ejemplo `brave`, para utilizar
  el recurso administrado `web_search` de OpenClaw en su lugar
- Defina `tools.web.search.openaiCodex.enabled: false` para excluirse de la búsqueda alojada
  por Codex; los demás proveedores administrados siguen disponibles
- La restricción de la superficie de herramientas nativas de Codex también mantiene disponible el recurso administrado `web_search`
- Cuando se define `allowedDomains`, la alternativa administrada automática falla de forma cerrada si
  la búsqueda alojada no está disponible, para que no pueda eludirse la lista de permitidos nativa
- Las ejecuciones que solo usan el LLM y tienen las herramientas deshabilitadas deshabilitan tanto la búsqueda nativa como la administrada
- `tools.web.search.enabled: false` deshabilita tanto la búsqueda administrada como la nativa

Los cambios persistentes en la política efectiva de búsqueda de Codex inician un nuevo hilo vinculado para que
un hilo del servidor de aplicaciones ya cargado no pueda conservar un acceso obsoleto a la búsqueda alojada.
Las restricciones transitorias por turno utilizan un hilo restringido temporal y conservan
la vinculación existente para reanudarla posteriormente.

El tráfico directo de OpenAI ChatGPT Responses también puede utilizar la herramienta alojada
`web_search` de OpenAI. Esa ruta independiente sigue siendo opcional mediante
`tools.web.search.openaiCodex.enabled: true` y solo se aplica a los modelos
`openai/*` aptos que utilizan `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Opcional: utilizar Codex Hosted Search también desde modelos principales que no sean de Codex.
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

Para los runtimes y proveedores que no admiten la búsqueda nativa de Codex, Codex puede
utilizar la alternativa administrada `web_search` mediante el espacio de nombres de herramientas dinámicas de OpenClaw.
Utilice un proveedor administrado explícito cuando necesite los controles de red
específicos del proveedor de OpenClaw en lugar de la búsqueda alojada por Codex.

Al seleccionar `provider: "codex"`, se habilita el Plugin incluido `codex` y se utilizan las
mismas restricciones de `tools.web.search.openaiCodex` mostradas anteriormente. Primero, autentique el
servidor de aplicaciones Codex con `openclaw models auth login --provider openai`.
El agente principal puede utilizar cualquier modelo o runtime; solo el trabajador de búsqueda acotado
se ejecuta mediante Codex.

## Seguridad de red

Las llamadas administradas del proveedor HTTP `web_search` utilizan la ruta de obtención protegida de OpenClaw,
limitada al nombre de host propio del proveedor actual. Solo para ese nombre de host,
OpenClaw permite respuestas DNS de IP falsa de Surge, Clash y sing-box en
`198.18.0.0/15` y `fc00::/7`. Los demás destinos privados, de bucle invertido, locales al enlace y
de metadatos permanecen bloqueados. Codex Hosted Search es la excepción:
su trabajador acotado delega el acceso a la red en la herramienta alojada
`web_search` del servidor de aplicaciones Codex.

Esta concesión automática no se aplica a URL `web_fetch` arbitrarias. Para
`web_fetch`, habilite `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explícitamente solo cuando su
proxy de confianza sea propietario de esos intervalos sintéticos.

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // valor predeterminado: true
        provider: "brave", // u omitir para la detección automática
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuración específica del proveedor (claves de API, URL base y modos) se encuentra en
`plugins.entries.<plugin>.config.webSearch.*`. Gemini también puede reutilizar
`models.providers.google.apiKey` y `models.providers.google.baseUrl` como alternativas de menor prioridad
después de su configuración específica de búsqueda web y `GEMINI_API_KEY`. Consulte las
páginas de los proveedores para ver ejemplos.
Grok también puede reutilizar un perfil de autenticación OAuth de xAI de `openclaw models auth login
--provider xai --method oauth`; la configuración mediante clave de API sigue siendo la alternativa.

`tools.web.search.provider` se valida con los identificadores de proveedores de búsqueda web
declarados por los manifiestos de los Plugins incluidos e instalados. Un error tipográfico como `"brvae"`
hace que falle la validación de la configuración, en lugar de recurrir silenciosamente a la detección automática. Si un
proveedor configurado solo tiene indicios obsoletos del Plugin, como un bloque
`plugins.entries.<plugin>` sobrante tras desinstalar un Plugin de terceros,
OpenClaw mantiene un inicio resiliente y muestra una advertencia para que se pueda reinstalar el
Plugin o ejecutar `openclaw doctor --fix` a fin de limpiar la configuración obsoleta.

La selección del proveedor alternativo `web_fetch` es independiente:

- elíjalo con `tools.web.fetch.provider`
- u omita ese campo y permita que OpenClaw detecte automáticamente el primer proveedor de obtención web
  listo a partir de las credenciales configuradas
- las operaciones `web_fetch` sin aislamiento pueden utilizar proveedores de Plugins instalados que declaren
  `contracts.webFetchProviders`; las obtenciones aisladas permiten proveedores incluidos e
  instalaciones verificadas de Plugins oficiales, pero excluyen los Plugins externos de terceros
- el Plugin oficial Firecrawl es el único colaborador incluido de `webFetchProviders`
  en la actualidad, configurado en
  `plugins.entries.firecrawl.config.webFetch.*`

Al elegir **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede solicitar:

- la región de la API de Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- el modelo predeterminado de búsqueda web de Kimi (el valor predeterminado es `kimi-k2.6`)

Para `x_search`, configure `plugins.entries.xai.config.xSearch.*`. Utiliza el
mismo perfil de autenticación de xAI que el chat, o la credencial de búsqueda web
`XAI_API_KEY` / del Plugin que utiliza la búsqueda web de Grok.
La configuración heredada `tools.web.x_search.*` se migra automáticamente mediante `openclaw doctor --fix`.
Al elegir Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw también ofrece la configuración opcional de `x_search` con la misma credencial justo
después de completar la configuración de Grok. Este es un paso posterior independiente dentro de la ruta de Grok,
no una opción independiente de proveedor de búsqueda web de nivel superior. Si se elige otro
proveedor, OpenClaw no muestra el mensaje de `x_search`.

### Almacenamiento de claves de API

<Tabs>
  <Tab title="Archivo de configuración">
    Ejecute `openclaw configure --section web` o defina la clave directamente:

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
    Defina la variable de entorno del proveedor en el entorno del proceso del Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para una instalación del Gateway, colóquela en `~/.openclaw/.env`.
    Consulte [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parámetros de la herramienta

| Parámetro             | Descripción                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Consulta de búsqueda (obligatoria)                                 |
| `count`               | Resultados que se devolverán (1-10, valor predeterminado: 5)       |
| `country`             | Código de país ISO de 2 letras (p. ej., "US", "DE")                |
| `language`            | Código de idioma ISO 639-1 (p. ej., "en", "de")                    |
| `search_lang`         | Código de idioma de búsqueda (solo Brave)                           |
| `freshness`           | Filtro temporal: `day`, `week`, `month` o `year`                     |
| `date_after`          | Resultados posteriores a esta fecha (YYYY-MM-DD)                    |
| `date_before`         | Resultados anteriores a esta fecha (YYYY-MM-DD)                     |
| `ui_lang`             | Código de idioma de la interfaz (solo Brave)                        |
| `domain_filter`       | Matriz de dominios permitidos/denegados (solo Perplexity)          |
| `max_tokens`          | Presupuesto total de tokens de contenido, solo para la API nativa de Perplexity Search |
| `max_tokens_per_page` | Límite de tokens de extracción por página, solo para la API nativa de Perplexity Search |

<Warning>
  No todos los parámetros funcionan con todos los proveedores. El modo
  `llm-context` de Brave rechaza `ui_lang`; `date_before` también necesita
  `date_after` porque los intervalos de actualidad personalizados de Brave requieren
  tanto la fecha de inicio como la de finalización.
  Gemini, Grok y Kimi devuelven una única respuesta sintetizada con citas. Aceptan
  `count` para mantener la compatibilidad con la herramienta compartida, pero no
  cambia la estructura de la respuesta fundamentada. Gemini interpreta la actualidad
  `day` como una indicación de recencia; los valores de actualidad más amplios
  y las fechas explícitas establecen intervalos temporales para la fundamentación de Google Search.
  Perplexity se comporta del mismo modo cuando se utiliza la ruta de compatibilidad
  de Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`); esa ruta tampoco admite `max_tokens` ni
  `max_tokens_per_page`.
  SearXNG acepta `http://` solo para hosts de red privada de confianza o de bucle local;
  los endpoints públicos de SearXNG deben utilizar `https://`.
  Firecrawl y Tavily solo admiten `query` y `count` mediante `web_search`;
  use sus herramientas específicas para las opciones avanzadas.
</Warning>

## x_search

`x_search` consulta publicaciones de X (anteriormente Twitter) mediante xAI y devuelve
respuestas sintetizadas por IA con citas. Acepta consultas en lenguaje natural y
filtros estructurados opcionales. OpenClaw construye la herramienta integrada
`x_search` de xAI para cada solicitud en lugar de mantenerla registrada
permanentemente, por lo que solo está activa durante el turno que realmente la invoca.

<Warning>
  `x_search` se ejecuta en los servidores de xAI. xAI cobra $5 por cada 1,000 llamadas
  a herramientas, además de los tokens de entrada y salida del modelo.
</Warning>

<Note>
  xAI documenta que `x_search` admite la búsqueda por palabras clave, la búsqueda semántica,
  la búsqueda de usuarios y la obtención de hilos. Para estadísticas de interacción por publicación,
  como republicaciones, respuestas, marcadores o visualizaciones, se recomienda una consulta
  específica de la URL exacta de la publicación o del identificador de estado. Las búsquedas amplias
  por palabras clave pueden encontrar la publicación correcta, pero devolver metadatos por publicación
  menos completos. Un buen patrón consiste en localizar primero la publicación y después
  ejecutar una segunda consulta `x_search` centrada en esa publicación exacta.
</Note>

### Configuración de x_search

Si se omite `enabled`, `x_search` solo se expone cuando el proveedor del modelo
activo es `xai` y se pueden resolver las credenciales de xAI. Para un modelo activo
con un proveedor conocido distinto de xAI, establezca `plugins.entries.xai.config.xSearch.enabled` en `true`
para habilitar su uso entre proveedores. Si falta el proveedor del modelo activo o no se puede
resolver, la herramienta permanece oculta. Establezca `enabled` en `false`
para desactivarla en todos los proveedores. Las credenciales de xAI siempre son obligatorias.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // obligatorio para un proveedor de modelo conocido distinto de xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // opcional, reemplaza webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opcional si se ha configurado un perfil de autenticación de xAI o XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // URL base opcional compartida de Responses de xAI
          },
        },
      },
    },
  },
}
```

`x_search` envía solicitudes POST a `<baseUrl>/responses` cuando
se establece `plugins.entries.xai.config.xSearch.baseUrl`. Si se omite ese campo,
se recurre a `plugins.entries.xai.config.webSearch.baseUrl` y después al
endpoint público de xAI (`https://api.x.ai/v1`).

### Parámetros de x_search

| Parámetro                    | Descripción                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de búsqueda (obligatoria)                     |
| `allowed_x_handles`          | Restringe los resultados a un máximo de 20 identificadores de X |
| `excluded_x_handles`         | Excluye un máximo de 20 identificadores de X           |
| `from_date`                  | Incluye solo publicaciones de esta fecha o posteriores (YYYY-MM-DD) |
| `to_date`                    | Incluye solo publicaciones de esta fecha o anteriores (YYYY-MM-DD) |
| `enable_image_understanding` | Permite que xAI examine las imágenes adjuntas a las publicaciones coincidentes |
| `enable_video_understanding` | Permite que xAI examine los vídeos adjuntos a las publicaciones coincidentes |

`allowed_x_handles` y `excluded_x_handles` son mutuamente excluyentes.

### Ejemplo de x_search

```javascript
await x_search({
  query: "recetas para la cena",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Estadísticas por publicación: use la URL exacta del estado o el identificador de estado cuando sea posible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ejemplos

```javascript
// Búsqueda básica
await web_search({ query: "SDK de plugins de OpenClaw" });

// Búsqueda específica para Alemania
await web_search({ query: "ver televisión en línea", country: "DE", language: "de" });

// Resultados recientes (última semana)
await web_search({ query: "avances en IA", freshness: "week" });

// Intervalo de fechas
await web_search({
  query: "investigación climática",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrado por dominio (solo Perplexity)
await web_search({
  query: "reseñas de productos",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfiles de herramientas

Si utiliza perfiles de herramientas o listas de permitidos, añada `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // o: allow: ["group:web"]  (incluye web_search, x_search y web_fetch)
  },
}
```

## Contenido relacionado

- [Web Fetch](/es/tools/web-fetch) -- obtiene una URL y extrae contenido legible
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios que dependen en gran medida de JS
- [Búsqueda con Grok](/es/tools/grok-search) -- Grok como proveedor `web_search`
- [Búsqueda web de Ollama](/es/tools/ollama-search) -- búsqueda web sin clave mediante su host de Ollama
