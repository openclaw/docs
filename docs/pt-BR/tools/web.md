---
read_when:
    - Você quer ativar ou configurar web_search
    - Você quer ativar ou configurar x_search
    - Você precisa escolher um provedor de busca
    - Você quer entender autodetecção e fallback de provedor
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- pesquise na web, pesquise posts no X ou busque conteúdo de páginas
title: Busca na web
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:19:38Z"
  model: gpt-5.4
  provider: openai
  source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
  source_path: tools/web.md
  workflow: 15
---

A ferramenta `web_search` pesquisa na web usando o provedor configurado e
retorna resultados. Os resultados são armazenados em cache por consulta por 15 minutos (configurável).

O OpenClaw também inclui `x_search` para posts no X (antigo Twitter) e
`web_fetch` para busca leve de URLs. Nesta fase, `web_fetch` permanece
local, enquanto `web_search` e `x_search` podem usar xAI Responses nos bastidores.

<Info>
  `web_search` é uma ferramenta HTTP leve, não automação de navegador. Para
  sites pesados em JS ou logins, use o [Navegador Web](/pt-BR/tools/browser). Para
  buscar uma URL específica, use [Web Fetch](/pt-BR/tools/web-fetch).
</Info>

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    Escolha um provedor e conclua qualquer configuração necessária. Alguns provedores
    não exigem chave, enquanto outros usam chaves de API. Consulte as páginas dos provedores abaixo para
    detalhes.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Isso armazena o provedor e qualquer credencial necessária. Você também pode definir uma
    variável de ambiente (por exemplo `BRAVE_API_KEY`) e pular esta etapa para
    provedores baseados em API.
  </Step>
  <Step title="Use">
    O agente agora pode chamar `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Para posts no X, use:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Escolhendo um provedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pt-BR/tools/brave-search">
    Resultados estruturados com snippets. Oferece suporte ao modo `llm-context` e a filtros de país/idioma. Há nível gratuito disponível.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pt-BR/tools/duckduckgo-search">
    Fallback sem chave. Nenhuma chave de API é necessária. Integração não oficial baseada em HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pt-BR/tools/exa-search">
    Busca neural + por palavra-chave com extração de conteúdo (highlights, texto, resumos).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pt-BR/tools/firecrawl">
    Resultados estruturados. Funciona melhor em conjunto com `firecrawl_search` e `firecrawl_scrape` para extração profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pt-BR/tools/gemini-search">
    Respostas sintetizadas por IA com citações via grounding da Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pt-BR/tools/grok-search">
    Respostas sintetizadas por IA com citações via grounding web da xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pt-BR/tools/kimi-search">
    Respostas sintetizadas por IA com citações via busca web da Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pt-BR/tools/minimax-search">
    Resultados estruturados via API de busca do MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pt-BR/tools/ollama-search">
    Busca sem chave via seu host Ollama configurado. Requer `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/pt-BR/tools/perplexity-search">
    Resultados estruturados com controles de extração de conteúdo e filtragem por domínio.
  </Card>
  <Card title="SearXNG" icon="server" href="/pt-BR/tools/searxng-search">
    Meta-busca auto-hospedada. Nenhuma chave de API é necessária. Agrega Google, Bing, DuckDuckGo e outros.
  </Card>
  <Card title="Tavily" icon="globe" href="/pt-BR/tools/tavily">
    Resultados estruturados com profundidade de busca, filtragem por tópico e `tavily_extract` para extração de URLs.
  </Card>
</CardGroup>

### Comparação de provedores

| Provider                                  | Estilo de resultado         | Filtros                                          | Chave de API                                                                      |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Brave](/pt-BR/tools/brave-search)              | Snippets estruturados       | País, idioma, tempo, modo `llm-context`          | `BRAVE_API_KEY`                                                                    |
| [DuckDuckGo](/pt-BR/tools/duckduckgo-search)    | Snippets estruturados       | --                                               | Nenhuma (sem chave)                                                                |
| [Exa](/pt-BR/tools/exa-search)                  | Estruturado + extraído      | Modo neural/palavra-chave, data, extração de conteúdo | `EXA_API_KEY`                                                                 |
| [Firecrawl](/pt-BR/tools/firecrawl)             | Snippets estruturados       | Via ferramenta `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                |
| [Gemini](/pt-BR/tools/gemini-search)            | Sintetizado por IA + citações | --                                             | `GEMINI_API_KEY`                                                                   |
| [Grok](/pt-BR/tools/grok-search)                | Sintetizado por IA + citações | --                                             | `XAI_API_KEY`                                                                      |
| [Kimi](/pt-BR/tools/kimi-search)                | Sintetizado por IA + citações | --                                             | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                |
| [MiniMax Search](/pt-BR/tools/minimax-search)   | Snippets estruturados       | Região (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                 |
| [Ollama Web Search](/pt-BR/tools/ollama-search) | Snippets estruturados       | --                                               | Nenhuma por padrão; `ollama signin` é necessário e pode reutilizar autenticação bearer do provedor Ollama |
| [Perplexity](/pt-BR/tools/perplexity-search)    | Snippets estruturados       | País, idioma, tempo, domínios, limites de conteúdo | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                    |
| [SearXNG](/pt-BR/tools/searxng-search)          | Snippets estruturados       | Categorias, idioma                               | Nenhuma (auto-hospedado)                                                           |
| [Tavily](/pt-BR/tools/tavily)                   | Snippets estruturados       | Via ferramenta `tavily_search`                   | `TAVILY_API_KEY`                                                                   |

## Autodetecção

## Busca web nativa da OpenAI

Modelos diretos OpenAI Responses usam automaticamente a ferramenta hospedada `web_search` da OpenAI quando a busca web do OpenClaw está ativada e nenhum provedor gerenciado está fixado. Esse é um comportamento controlado pelo provedor no Plugin OpenAI incluído e se aplica apenas a tráfego de API OpenAI nativo, não a base URLs de proxy compatíveis com OpenAI nem a rotas Azure. Defina `tools.web.search.provider` para outro provedor, como `brave`, para manter a ferramenta gerenciada `web_search` para modelos OpenAI, ou defina `tools.web.search.enabled: false` para desativar tanto a busca gerenciada quanto a busca nativa da OpenAI.

## Busca web nativa do Codex

Modelos com suporte a Codex podem opcionalmente usar a ferramenta nativa de provedor `web_search` da Responses em vez da função gerenciada `web_search` do OpenClaw.

- Configure em `tools.web.search.openaiCodex`
- Ela só é ativada para modelos com suporte a Codex (`openai-codex/*` ou provedores usando `api: "openai-codex-responses"`)
- `web_search` gerenciado continua valendo para modelos sem Codex
- `mode: "cached"` é a configuração padrão e recomendada
- `tools.web.search.enabled: false` desativa tanto a busca gerenciada quanto a nativa

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

Se a busca nativa do Codex estiver ativada, mas o modelo atual não tiver suporte a Codex, o OpenClaw mantém o comportamento normal do `web_search` gerenciado.

## Configurando a busca web

As listas de provedores na documentação e nos fluxos de configuração estão em ordem alfabética. A autodetecção mantém uma
ordem de precedência separada.

Se nenhum `provider` estiver definido, o OpenClaw verifica os provedores nesta ordem e usa o
primeiro que estiver pronto:

Primeiro os provedores baseados em API:

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordem 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordem 15)
3. **Gemini** -- `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey` (ordem 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordem 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordem 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordem 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordem 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` (ordem 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordem 70)

Fallbacks sem chave depois disso:

10. **DuckDuckGo** -- fallback HTML sem chave, sem conta nem chave de API (ordem 100)
11. **Ollama Web Search** -- fallback sem chave via seu host Ollama configurado; exige que o Ollama esteja acessível e autenticado com `ollama signin` e pode reutilizar a autenticação bearer do provedor Ollama se o host precisar dela (ordem 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordem 200)

Se nenhum provedor for detectado, o sistema faz fallback para Brave (você receberá um
erro de chave ausente solicitando que configure uma).

<Note>
  Todos os campos de chave de provedor oferecem suporte a objetos SecretRef. SecretRefs
  no escopo do Plugin em `plugins.entries.<plugin>.config.webSearch.apiKey` são resolvidos para os
  provedores incluídos Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity e Tavily,
  quer o provedor seja escolhido explicitamente via `tools.web.search.provider` ou
  selecionado por autodetecção. No modo de autodetecção, o OpenClaw resolve apenas a
  chave do provedor selecionado -- SecretRefs não selecionados permanecem inativos, assim você pode
  manter vários provedores configurados sem pagar o custo de resolução daqueles
  que não estiver usando.
</Note>

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // padrão: true
        provider: "brave", // ou omita para autodetecção
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

A configuração específica do provedor (chaves de API, base URLs, modos) fica em
`plugins.entries.<plugin>.config.webSearch.*`. Consulte as páginas dos provedores para
exemplos.

A seleção de provedor de fallback de `web_fetch` é separada:

- escolha com `tools.web.fetch.provider`
- ou omita esse campo e deixe o OpenClaw autodetectar o primeiro provedor de web-fetch
  pronto a partir das credenciais disponíveis
- hoje o provedor de web-fetch incluído é Firecrawl, configurado em
  `plugins.entries.firecrawl.config.webFetch.*`

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode pedir:

- a região da API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- o modelo padrão de busca web Kimi (o padrão é `kimi-k2.6`)

Para `x_search`, configure `plugins.entries.xai.config.xSearch.*`. Ele usa o
mesmo fallback `XAI_API_KEY` da busca web Grok.
A configuração legada `tools.web.x_search.*` é migrada automaticamente por `openclaw doctor --fix`.
Quando você escolhe Grok durante `openclaw onboard` ou `openclaw configure --section web`,
o OpenClaw também pode oferecer configuração opcional de `x_search` com a mesma chave.
Esta é uma etapa de acompanhamento separada dentro do caminho do Grok, não uma escolha separada de provedor
de busca web no nível superior. Se você escolher outro provedor, o OpenClaw não
mostrará o prompt de `x_search`.

### Armazenando chaves de API

<Tabs>
  <Tab title="Arquivo de configuração">
    Execute `openclaw configure --section web` ou defina a chave diretamente:

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
  <Tab title="Variável de ambiente">
    Defina a variável de ambiente do provedor no ambiente do processo Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para uma instalação de gateway, coloque em `~/.openclaw/.env`.
    Consulte [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parâmetros da ferramenta

| Parameter             | Descrição                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de busca (obrigatório)                       |
| `count`               | Resultados a retornar (1-10, padrão: 5)               |
| `country`             | Código de país ISO de 2 letras (ex.: "US", "DE")     |
| `language`            | Código de idioma ISO 639-1 (ex.: "en", "de")         |
| `search_lang`         | Código de idioma de busca (apenas Brave)              |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`     |
| `date_after`          | Resultados após esta data (YYYY-MM-DD)                |
| `date_before`         | Resultados antes desta data (YYYY-MM-DD)              |
| `ui_lang`             | Código de idioma da UI (apenas Brave)                 |
| `domain_filter`       | Array de allowlist/denylist de domínios (apenas Perplexity) |
| `max_tokens`          | Orçamento total de conteúdo, padrão 25000 (apenas Perplexity) |
| `max_tokens_per_page` | Limite de tokens por página, padrão 2048 (apenas Perplexity) |

<Warning>
  Nem todos os parâmetros funcionam com todos os provedores. O modo `llm-context`
  do Brave rejeita `ui_lang`, `freshness`, `date_after` e `date_before`.
  Gemini, Grok e Kimi retornam uma resposta sintetizada com citações. Eles
  aceitam `count` para compatibilidade com a ferramenta compartilhada, mas isso não altera o
  formato da resposta baseada em grounding.
  O Perplexity se comporta da mesma forma quando você usa o caminho de
  compatibilidade Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  O SearXNG aceita `http://` apenas para hosts confiáveis de rede privada ou loopback;
  endpoints públicos do SearXNG devem usar `https://`.
  Firecrawl e Tavily só suportam `query` e `count` por meio de `web_search`
  -- use as ferramentas dedicadas deles para opções avançadas.
</Warning>

## x_search

`x_search` consulta posts no X (antigo Twitter) usando xAI e retorna
respostas sintetizadas por IA com citações. Ele aceita consultas em linguagem natural e
filtros estruturados opcionais. O OpenClaw só ativa a ferramenta `x_search`
integrada do xAI na solicitação que atende essa chamada de ferramenta.

<Note>
  A xAI documenta `x_search` como compatível com busca por palavra-chave, busca semântica, busca de usuário
  e busca de thread. Para estatísticas de engajamento por post, como reposts,
  respostas, bookmarks ou visualizações, prefira uma busca direcionada pela URL exata do post
  ou pelo ID do status. Buscas amplas por palavra-chave podem encontrar o post certo, mas retornar
  metadados por post menos completos. Um bom padrão é: localize o post primeiro e depois
  execute uma segunda consulta `x_search` focada naquele post exato.
</Note>

### Configuração do x_search

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
            apiKey: "xai-...", // opcional se XAI_API_KEY estiver definido
          },
        },
      },
    },
  },
}
```

### Parâmetros do x_search

| Parameter                    | Descrição                                              |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de busca (obrigatório)                        |
| `allowed_x_handles`          | Restringe resultados a handles específicos do X        |
| `excluded_x_handles`         | Exclui handles específicos do X                        |
| `from_date`                  | Inclui apenas posts nesta data ou depois dela (YYYY-MM-DD) |
| `to_date`                    | Inclui apenas posts nesta data ou antes dela (YYYY-MM-DD) |
| `enable_image_understanding` | Permite que a xAI inspecione imagens anexadas aos posts correspondentes |
| `enable_video_understanding` | Permite que a xAI inspecione vídeos anexados aos posts correspondentes |

### Exemplo de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Estatísticas por post: use a URL exata do status ou o ID do status sempre que possível
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Exemplos

```javascript
// Busca básica
await web_search({ query: "OpenClaw plugin SDK" });

// Busca específica para a Alemanha
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Resultados recentes (última semana)
await web_search({ query: "AI developments", freshness: "week" });

// Intervalo de datas
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem por domínio (apenas Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfis de ferramenta

Se você usa perfis de ferramenta ou allowlists, adicione `web_search`, `x_search` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // ou: allow: ["group:web"]  (inclui web_search, x_search e web_fetch)
  },
}
```

## Relacionado

- [Web Fetch](/pt-BR/tools/web-fetch) -- busca uma URL e extrai conteúdo legível
- [Navegador Web](/pt-BR/tools/browser) -- automação completa de navegador para sites pesados em JS
- [Grok Search](/pt-BR/tools/grok-search) -- Grok como provedor de `web_search`
- [Ollama Web Search](/pt-BR/tools/ollama-search) -- busca na web sem chave por meio do seu host Ollama
