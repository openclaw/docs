---
read_when:
    - Você quer habilitar ou configurar web_search
    - Você quer ativar ou configurar x_search
    - Você precisa escolher um provedor de pesquisa
    - Você quer entender a detecção automática e o fallback do provedor
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- pesquise na web, pesquise publicações do X ou busque o conteúdo da página
title: Pesquisa na web
x-i18n:
    generated_at: "2026-05-03T21:39:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

A ferramenta `web_search` pesquisa na web usando seu provedor configurado e
retorna resultados. Os resultados são armazenados em cache por consulta por 15 minutos (configurável).

O OpenClaw também inclui `x_search` para publicações no X (anteriormente Twitter) e
`web_fetch` para busca leve de URLs. Nesta fase, `web_fetch` permanece
local, enquanto `web_search` e `x_search` podem usar xAI Responses internamente.

<Info>
  `web_search` é uma ferramenta HTTP leve, não automação de navegador. Para
  sites com muito JS ou logins, use o [Navegador Web](/pt-BR/tools/browser). Para
  buscar uma URL específica, use [Web Fetch](/pt-BR/tools/web-fetch).
</Info>

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    Escolha um provedor e conclua qualquer configuração necessária. Alguns provedores não
    exigem chave, enquanto outros usam chaves de API. Veja as páginas dos provedores abaixo para
    obter detalhes.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Isso armazena o provedor e qualquer credencial necessária. Você também pode definir uma variável
    de ambiente (por exemplo `BRAVE_API_KEY`) e pular esta etapa para provedores
    baseados em API.
  </Step>
  <Step title="Use">
    O agente agora pode chamar `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Para publicações no X, use:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Escolhendo um provedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pt-BR/tools/brave-search">
    Resultados estruturados com trechos. Oferece suporte ao modo `llm-context` e filtros de país/idioma. Camada gratuita disponível.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pt-BR/tools/duckduckgo-search">
    Alternativa sem chave. Nenhuma chave de API necessária. Integração não oficial baseada em HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pt-BR/tools/exa-search">
    Busca neural + por palavras-chave com extração de conteúdo (destaques, texto, resumos).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pt-BR/tools/firecrawl">
    Resultados estruturados. Melhor quando usado com `firecrawl_search` e `firecrawl_scrape` para extração profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pt-BR/tools/gemini-search">
    Respostas sintetizadas por IA com citações via ancoragem no Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pt-BR/tools/grok-search">
    Respostas sintetizadas por IA com citações via ancoragem web da xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pt-BR/tools/kimi-search">
    Respostas sintetizadas por IA com citações via busca web da Moonshot; alternativas de chat sem ancoragem falham explicitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pt-BR/tools/minimax-search">
    Resultados estruturados via API de busca do MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pt-BR/tools/ollama-search">
    Busca via host local do Ollama autenticado ou pela API hospedada do Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/pt-BR/tools/perplexity-search">
    Resultados estruturados com controles de extração de conteúdo e filtragem por domínio.
  </Card>
  <Card title="SearXNG" icon="server" href="/pt-BR/tools/searxng-search">
    Metabusca auto-hospedada. Nenhuma chave de API necessária. Agrega Google, Bing, DuckDuckGo e mais.
  </Card>
  <Card title="Tavily" icon="globe" href="/pt-BR/tools/tavily">
    Resultados estruturados com profundidade de busca, filtragem por tópico e `tavily_extract` para extração de URLs.
  </Card>
</CardGroup>

### Comparação de provedores

| Provedor                                  | Estilo do resultado                                           | Filtros                                          | Chave de API                                                                            |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pt-BR/tools/brave-search)              | Trechos estruturados                                           | País, idioma, tempo, modo `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/pt-BR/tools/duckduckgo-search)    | Trechos estruturados                                           | --                                               | Nenhuma (sem chave)                                                                     |
| [Exa](/pt-BR/tools/exa-search)                  | Estruturado + extraído                                         | Modo neural/palavra-chave, data, extração de conteúdo | `EXA_API_KEY`                                                                       |
| [Firecrawl](/pt-BR/tools/firecrawl)             | Trechos estruturados                                           | Via ferramenta `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pt-BR/tools/gemini-search)            | Sintetizado por IA + citações                                  | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pt-BR/tools/grok-search)                | Sintetizado por IA + citações                                  | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/pt-BR/tools/kimi-search)                | Sintetizado por IA + citações; falha em alternativas de chat sem ancoragem | --                                      | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pt-BR/tools/minimax-search)   | Trechos estruturados                                           | Região (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pt-BR/tools/ollama-search) | Trechos estruturados                                           | --                                               | Nenhuma para hosts locais autenticados; `OLLAMA_API_KEY` para busca direta em `https://ollama.com` |
| [Perplexity](/pt-BR/tools/perplexity-search)    | Trechos estruturados                                           | País, idioma, tempo, domínios, limites de conteúdo | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                           |
| [SearXNG](/pt-BR/tools/searxng-search)          | Trechos estruturados                                           | Categorias, idioma                               | Nenhuma (auto-hospedado)                                                                |
| [Tavily](/pt-BR/tools/tavily)                   | Trechos estruturados                                           | Via ferramenta `tavily_search`                   | `TAVILY_API_KEY`                                                                        |

## Detecção automática

## Busca web nativa da OpenAI

Modelos OpenAI Responses diretos usam a ferramenta hospedada `web_search` da OpenAI automaticamente quando a busca web do OpenClaw está ativada e nenhum provedor gerenciado está fixado. Esse é um comportamento pertencente ao provedor no Plugin OpenAI incluído e só se aplica ao tráfego nativo da API da OpenAI, não a URLs base de proxies compatíveis com OpenAI nem a rotas do Azure. Defina `tools.web.search.provider` para outro provedor, como `brave`, para manter a ferramenta gerenciada `web_search` para modelos OpenAI, ou defina `tools.web.search.enabled: false` para desativar tanto a busca gerenciada quanto a busca nativa da OpenAI.

## Busca web nativa do Codex

Modelos compatíveis com Codex podem opcionalmente usar a ferramenta `web_search` nativa do provedor em Responses em vez da função `web_search` gerenciada pelo OpenClaw.

- Configure-a em `tools.web.search.openaiCodex`
- Ela só é ativada para modelos compatíveis com Codex (`openai-codex/*` ou provedores que usam `api: "openai-codex-responses"`)
- A `web_search` gerenciada ainda se aplica a modelos não Codex
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

Se a busca nativa do Codex estiver ativada, mas o modelo atual não for compatível com Codex, o OpenClaw mantém o comportamento normal da `web_search` gerenciada.

## Segurança de rede

Chamadas a provedores da `web_search` gerenciada usam o caminho de fetch protegido do OpenClaw. Para
hosts de API de provedores confiáveis, o OpenClaw permite respostas DNS fake-IP
do Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` apenas para esse nome de host do provedor.
Outros destinos privados, de loopback, link-local e de metadados permanecem bloqueados.

Essa permissão automática não se aplica a URLs arbitrárias de `web_fetch`. Para
`web_fetch`, ative `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explicitamente apenas quando seu
proxy confiável possuir esses intervalos sintéticos.

## Configurando a busca web

Listas de provedores na documentação e nos fluxos de configuração são alfabéticas. A detecção automática mantém uma
ordem de precedência separada.

Se nenhum `provider` estiver definido, o OpenClaw verifica os provedores nesta ordem e usa o
primeiro que estiver pronto:

Provedores baseados em API primeiro:

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordem 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordem 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` ou `models.providers.google.apiKey` (ordem 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordem 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordem 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordem 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordem 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` opcional substitui o endpoint da Exa (ordem 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordem 70)

Alternativas sem chave depois disso:

10. **DuckDuckGo** -- alternativa HTML sem chave, sem conta nem chave de API (ordem 100)
11. **Ollama Web Search** -- alternativa sem chave via seu host local do Ollama configurado quando ele está acessível e autenticado com `ollama signin`; pode reutilizar a autenticação bearer do provedor Ollama quando o host precisar dela, e pode chamar a busca direta em `https://ollama.com` quando configurado com `OLLAMA_API_KEY` (ordem 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordem 200)

Se nenhum provedor for detectado, ele recorre ao Brave (você receberá um erro de chave ausente
solicitando que configure uma).

<Note>
  Todos os campos de chave de provedor oferecem suporte a objetos SecretRef. SecretRefs com escopo de Plugin
  em `plugins.entries.<plugin>.config.webSearch.apiKey` são resolvidos para os
  provedores de busca web baseados em API incluídos, incluindo Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity e Tavily,
  independentemente de o provedor ser escolhido explicitamente via `tools.web.search.provider` ou
  selecionado por detecção automática. No modo de detecção automática, o OpenClaw resolve apenas a
  chave do provedor selecionado -- SecretRefs não selecionados permanecem inativos, para que você possa
  manter vários provedores configurados sem pagar o custo de resolução dos
  que não estiver usando.
</Note>

## Config

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

A configuração específica do provedor (chaves de API, URLs base, modos) fica em
`plugins.entries.<plugin>.config.webSearch.*`. O Gemini também pode reutilizar
`models.providers.google.apiKey` e `models.providers.google.baseUrl` como fallbacks de prioridade mais baixa
após sua configuração dedicada de busca na web e `GEMINI_API_KEY`. Consulte as
páginas dos provedores para exemplos.

`tools.web.search.provider` é validado contra os ids de provedores de busca na web
declarados pelos manifestos de plugins incluídos e instalados. Um erro de digitação como `"brvae"`
falha na validação da configuração em vez de voltar silenciosamente para a detecção automática. Se um
provedor configurado tiver apenas evidência obsoleta de plugin, como um bloco
`plugins.entries.<plugin>` restante após desinstalar um plugin de terceiros,
o OpenClaw mantém a inicialização resiliente e relata um aviso para que você possa reinstalar o
plugin ou executar `openclaw doctor --fix` para limpar a configuração obsoleta.

A seleção do provedor de fallback de `web_fetch` é separada:

- escolha-o com `tools.web.fetch.provider`
- ou omita esse campo e deixe o OpenClaw detectar automaticamente o primeiro provedor de web-fetch
  pronto a partir das credenciais disponíveis
- `web_fetch` fora de sandbox pode usar provedores de plugins instalados que declaram
  `contracts.webFetchProviders`; buscas em sandbox permanecem apenas com provedores incluídos
- hoje, o provedor web-fetch incluído é o Firecrawl, configurado em
  `plugins.entries.firecrawl.config.webFetch.*`

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode pedir:

- a região da API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- o modelo padrão de busca na web do Kimi (padrão: `kimi-k2.6`)

Para `x_search`, configure `plugins.entries.xai.config.xSearch.*`. Ele usa o
mesmo fallback `XAI_API_KEY` da busca na web do Grok.
A configuração legada `tools.web.x_search.*` é migrada automaticamente por `openclaw doctor --fix`.
Quando você escolhe Grok durante `openclaw onboard` ou `openclaw configure --section web`,
o OpenClaw também pode oferecer uma configuração opcional de `x_search` com a mesma chave.
Essa é uma etapa de acompanhamento separada dentro do caminho do Grok, não uma escolha separada de provedor
de busca na web de nível superior. Se você escolher outro provedor, o OpenClaw não
mostra o prompt de `x_search`.

### Armazenamento de chaves de API

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

    Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.
    Consulte [variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parâmetros da ferramenta

| Parâmetro             | Descrição                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de busca (obrigatório)                       |
| `count`               | Resultados a retornar (1-10, padrão: 5)               |
| `country`             | Código de país ISO de 2 letras (ex.: "US", "DE")      |
| `language`            | Código de idioma ISO 639-1 (ex.: "en", "de")          |
| `search_lang`         | Código de idioma de busca (somente Brave)             |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`     |
| `date_after`          | Resultados após esta data (AAAA-MM-DD)                |
| `date_before`         | Resultados antes desta data (AAAA-MM-DD)              |
| `ui_lang`             | Código de idioma da UI (somente Brave)                |
| `domain_filter`       | Array de allowlist/denylist de domínios (somente Perplexity) |
| `max_tokens`          | Orçamento total de conteúdo, padrão 25000 (somente Perplexity) |
| `max_tokens_per_page` | Limite de tokens por página, padrão 2048 (somente Perplexity) |

<Warning>
  Nem todos os parâmetros funcionam com todos os provedores. O modo `llm-context` do Brave
  rejeita `ui_lang`; `date_before` também precisa de `date_after` porque os intervalos personalizados
  de freshness do Brave exigem datas de início e fim.
  Gemini, Grok e Kimi retornam uma resposta sintetizada com citações. Eles
  aceitam `count` para compatibilidade com ferramentas compartilhadas, mas isso não altera o
  formato da resposta fundamentada. O Gemini oferece suporte a `freshness`, `date_after` e
  `date_before` convertendo-os em intervalos de tempo de fundamentação da Busca Google.
  O Perplexity se comporta da mesma forma quando você usa o caminho de compatibilidade
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  O SearXNG aceita `http://` apenas para hosts de rede privada confiável ou loopback;
  endpoints públicos do SearXNG devem usar `https://`.
  Firecrawl e Tavily só oferecem suporte a `query` e `count` por meio de `web_search`
  -- use suas ferramentas dedicadas para opções avançadas.
</Warning>

## x_search

`x_search` consulta publicações no X (antigo Twitter) usando xAI e retorna
respostas sintetizadas por IA com citações. Ele aceita consultas em linguagem natural e
filtros estruturados opcionais. O OpenClaw só habilita a ferramenta `x_search`
integrada da xAI na solicitação que atende a essa chamada de ferramenta.

<Note>
  A xAI documenta `x_search` como compatível com busca por palavras-chave, busca semântica, busca de usuário
  e busca de threads. Para estatísticas de engajamento por publicação, como repostagens,
  respostas, favoritos ou visualizações, prefira uma consulta direcionada para a URL exata da publicação
  ou o ID do status. Buscas amplas por palavras-chave podem encontrar a publicação correta, mas retornar metadados
  por publicação menos completos. Um bom padrão é: localizar a publicação primeiro e, em seguida,
  executar uma segunda consulta `x_search` focada nessa publicação exata.
</Note>

### Configuração de x_search

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` publica em `<baseUrl>/responses` quando
`plugins.entries.xai.config.xSearch.baseUrl` está definido. Se esse campo for omitido,
ele faz fallback para `plugins.entries.xai.config.webSearch.baseUrl`, depois para o
legado `tools.web.search.grok.baseUrl` e, por fim, para o endpoint público da xAI.

### Parâmetros de x_search

| Parâmetro                    | Descrição                                            |
| ---------------------------- | ---------------------------------------------------- |
| `query`                      | Consulta de busca (obrigatório)                      |
| `allowed_x_handles`          | Restringir resultados a handles específicos do X     |
| `excluded_x_handles`         | Excluir handles específicos do X                     |
| `from_date`                  | Incluir apenas publicações nesta data ou depois dela (AAAA-MM-DD) |
| `to_date`                    | Incluir apenas publicações nesta data ou antes dela (AAAA-MM-DD) |
| `enable_image_understanding` | Permitir que a xAI inspecione imagens anexadas a publicações correspondentes |
| `enable_video_understanding` | Permitir que a xAI inspecione vídeos anexados a publicações correspondentes |

### Exemplo de x_search

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

## Exemplos

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

## Perfis de ferramentas

Se você usa perfis de ferramentas ou allowlists, adicione `web_search`, `x_search` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Relacionados

- [Web Fetch](/pt-BR/tools/web-fetch) -- busca uma URL e extrai conteúdo legível
- [Navegador web](/pt-BR/tools/browser) -- automação completa de navegador para sites com muito JS
- [Busca Grok](/pt-BR/tools/grok-search) -- Grok como o provedor de `web_search`
- [Busca web do Ollama](/pt-BR/tools/ollama-search) -- busca na web sem chave por meio do seu host Ollama
