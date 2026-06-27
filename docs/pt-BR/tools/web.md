---
read_when:
    - Você quer habilitar ou configurar web_search
    - Você quer habilitar ou configurar x_search
    - Você precisa escolher um provedor de pesquisa
    - Você quer entender a detecção automática e a seleção de provedor
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- pesquise na web, pesquise posts do X ou busque o conteúdo de páginas
title: Pesquisa na web
x-i18n:
    generated_at: "2026-06-27T18:20:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

A ferramenta `web_search` pesquisa na web usando o provedor configurado e
retorna resultados. Os resultados são armazenados em cache por consulta por 15 minutos (configurável).

O OpenClaw também inclui `x_search` para publicações no X (antigo Twitter) e
`web_fetch` para busca leve de URLs. Nesta fase, `web_fetch` permanece
local, enquanto `web_search` e `x_search` podem usar xAI Responses nos bastidores.

<Info>
  `web_search` é uma ferramenta HTTP leve, não automação de navegador. Para
  sites com muito JS ou logins, use o [Navegador Web](/pt-BR/tools/browser). Para
  buscar uma URL específica, use [Web Fetch](/pt-BR/tools/web-fetch).
</Info>

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    Escolha um provedor e conclua qualquer configuração necessária. Alguns provedores
    não exigem chave, enquanto outros usam chaves de API. Veja as páginas dos provedores abaixo para
    detalhes.
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
    Resultados estruturados com trechos. Compatível com o modo `llm-context` e filtros de país/idioma. Camada gratuita disponível.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/pt-BR/plugins/codex-harness">
    Respostas fundamentadas sintetizadas por IA por meio da sua conta do app-server do Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pt-BR/tools/duckduckgo-search">
    Provedor sem chave. Nenhuma chave de API necessária. Integração não oficial baseada em HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pt-BR/tools/exa-search">
    Busca neural + por palavra-chave com extração de conteúdo (destaques, texto, resumos).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pt-BR/tools/firecrawl">
    Resultados estruturados. Melhor combinado com `firecrawl_search` e `firecrawl_scrape` para extração profunda.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pt-BR/tools/gemini-search">
    Respostas sintetizadas por IA com citações via fundamentação do Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pt-BR/tools/grok-search">
    Respostas sintetizadas por IA com citações via fundamentação web da xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pt-BR/tools/kimi-search">
    Respostas sintetizadas por IA com citações via busca web da Moonshot; fallbacks de chat sem fundamentação falham explicitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pt-BR/tools/minimax-search">
    Resultados estruturados via API de busca do MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pt-BR/tools/ollama-search">
    Busca via host local Ollama conectado ou pela API hospedada da Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/pt-BR/tools/parallel-search">
    API paga do Parallel Search (`PARALLEL_API_KEY`); limites de taxa maiores e ajuste por objetivo.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/pt-BR/tools/parallel-search">
    Adesão sem chave. Search MCP gratuito da Parallel, com excertos densos otimizados para LLM e nenhuma chave de API.
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

| Provedor                                         | Estilo de resultado                                           | Filtros                                          | Chave de API                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pt-BR/tools/brave-search)                     | Trechos estruturados                                           | País, idioma, tempo, modo `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/pt-BR/plugins/codex-harness)    | Sintetizado por IA + URLs de origem                            | Domínios, tamanho do contexto, localização do usuário | Nenhuma; usa login Codex/OpenAI                                                         |
| [DuckDuckGo](/pt-BR/tools/duckduckgo-search)           | Trechos estruturados                                           | --                                               | Nenhuma (sem chave)                                                                     |
| [Exa](/pt-BR/tools/exa-search)                         | Estruturado + extraído                                         | Modo neural/palavra-chave, data, extração de conteúdo | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pt-BR/tools/firecrawl)                    | Trechos estruturados                                           | Via ferramenta `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pt-BR/tools/gemini-search)                   | Sintetizado por IA + citações                                  | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pt-BR/tools/grok-search)                       | Sintetizado por IA + citações                                  | --                                               | OAuth da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`            |
| [Kimi](/pt-BR/tools/kimi-search)                       | Sintetizado por IA + citações; falha em fallbacks de chat sem fundamentação | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pt-BR/tools/minimax-search)          | Trechos estruturados                                           | Região (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pt-BR/tools/ollama-search)        | Trechos estruturados                                           | --                                               | Nenhuma para hosts locais conectados; `OLLAMA_API_KEY` para busca direta em `https://ollama.com` |
| [Parallel](/pt-BR/tools/parallel-search)               | Excertos densos ranqueados para contexto de LLM                | --                                               | `PARALLEL_API_KEY` (pago)                                                               |
| [Parallel Search (Free)](/pt-BR/tools/parallel-search) | Excertos densos ranqueados para contexto de LLM                | --                                               | Nenhuma (Search MCP gratuito)                                                           |
| [Perplexity](/pt-BR/tools/perplexity-search)           | Trechos estruturados                                           | País, idioma, tempo, domínios, limites de conteúdo | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pt-BR/tools/searxng-search)                 | Trechos estruturados                                           | Categorias, idioma                               | Nenhuma (auto-hospedado)                                                                |
| [Tavily](/pt-BR/tools/tavily)                          | Trechos estruturados                                           | Via ferramenta `tavily_search`                   | `TAVILY_API_KEY`                                                                        |

## Detecção automática

## Busca web nativa da OpenAI

Modelos diretos do OpenAI Responses usam automaticamente a ferramenta hospedada `web_search` da OpenAI quando a busca web do OpenClaw está habilitada e nenhum provedor gerenciado está fixado. Esse é um comportamento de propriedade do provedor no Plugin OpenAI incluído e se aplica apenas ao tráfego nativo da API OpenAI, não a URLs base de proxy compatíveis com OpenAI nem a rotas do Azure. Defina `tools.web.search.provider` para outro provedor, como `brave`, para manter a ferramenta gerenciada `web_search` para modelos OpenAI, ou defina `tools.web.search.enabled: false` para desabilitar tanto a busca gerenciada quanto a busca nativa da OpenAI.

## Busca web nativa do Codex

O runtime do app-server do Codex usa automaticamente a ferramenta hospedada `web_search` do Codex
quando a busca web está habilitada e nenhum provedor gerenciado está selecionado. A busca hospedada
nativa e a ferramenta dinâmica gerenciada `web_search` do OpenClaw são mutuamente exclusivas,
portanto a busca gerenciada não pode contornar restrições nativas de domínio. O OpenClaw usa a
ferramenta gerenciada quando a busca hospedada está indisponível, explicitamente desabilitada ou
substituída por um provedor gerenciado selecionado. O OpenClaw mantém a extensão independente
`web.run` do Codex desabilitada porque o tráfego de app-server de produção rejeita seu
namespace `web` definido pelo usuário.

- Configure a busca nativa em `tools.web.search.openaiCodex`
- Defina `tools.web.search.provider: "codex"` para provisionar Codex Hosted Search como
  o provedor gerenciado de `web_search` para qualquer modelo pai. Cada chamada executa uma
  rodada efêmera limitada do app-server do Codex e falha se o Codex não emitir um item
  hospedado `webSearch`.
- `mode: "cached"` é a preferência padrão, mas o Codex a resolve para acesso externo
  em tempo real para rodadas irrestritas do app-server; defina `"live"` para solicitar
  acesso em tempo real explicitamente
- Defina `tools.web.search.provider` para um provedor gerenciado como `brave` para usar
  o `web_search` gerenciado do OpenClaw
- Defina `tools.web.search.openaiCodex.enabled: false` para recusar a busca hospedada
  pelo Codex; outros provedores gerenciados permanecem disponíveis
- Restringir a superfície da ferramenta nativa do Codex também mantém o `web_search`
  gerenciado disponível
- Quando `allowedDomains` está definido, o fallback gerenciado automático falha fechado se
  a busca hospedada estiver indisponível, para que a allowlist nativa não possa ser contornada
- Execuções apenas com LLM e ferramentas desabilitadas desabilitam tanto a busca nativa quanto a gerenciada
- `tools.web.search.enabled: false` desabilita tanto a busca gerenciada quanto a nativa

Alterações persistentes na política efetiva de busca do Codex iniciam uma nova thread vinculada para que
uma thread de app-server já carregada não possa manter acesso obsoleto à busca hospedada.
Restrições transitórias por rodada usam uma thread restrita temporária e preservam
o vínculo existente para retomada posterior.

O tráfego direto do OpenAI ChatGPT Responses também pode usar a ferramenta hospedada
`web_search` da OpenAI. Esse caminho separado continua opt-in por meio de
`tools.web.search.openaiCodex.enabled: true` e se aplica apenas a modelos
`openai/*` qualificados usando `api: "openai-chatgpt-responses"`.

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

Para runtimes e provedores que não são compatíveis com a busca nativa do Codex, o Codex pode
usar o fallback gerenciado de `web_search` por meio do namespace de ferramenta dinâmica do OpenClaw.
Use um provedor gerenciado explícito quando precisar dos controles de rede específicos do provedor
do OpenClaw em vez da busca hospedada pelo Codex.

Selecionar `provider: "codex"` habilita o Plugin `codex` incluído e usa as
mesmas restrições de `tools.web.search.openaiCodex` mostradas acima. Autentique
primeiro o app-server Codex com `openclaw models auth login --provider openai`.
O agente pai pode usar qualquer modelo ou runtime; apenas o worker de busca
limitado é executado por meio do Codex.

## Segurança de rede

Chamadas gerenciadas do provider HTTP `web_search` usam o caminho de fetch
protegido do OpenClaw. Para hosts de API de provider confiáveis, o OpenClaw
permite respostas DNS fake-IP do Surge, Clash e sing-box em `198.18.0.0/15` e
`fc00::/7` somente para esse hostname de provider. Outros destinos privados,
loopback, link-local e de metadados continuam bloqueados. Codex Hosted Search é
a exceção: seu worker limitado delega o acesso à rede à ferramenta `web_search`
hospedada do app-server Codex.

Essa permissão automática não se aplica a URLs arbitrárias de `web_fetch`. Para
`web_fetch`, habilite `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explicitamente somente
quando seu proxy confiável possuir esses intervalos sintéticos.

## Configurando a busca na Web

Listas de providers na documentação e nos fluxos de configuração ficam em ordem alfabética. A detecção automática mantém uma ordem de precedência separada.

Se nenhum `provider` estiver definido, o OpenClaw verifica os providers nesta ordem e usa o
primeiro que estiver pronto:

Providers com API primeiro:

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordem 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordem 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` ou `models.providers.google.apiKey` (ordem 20)
4. **Grok** -- OAuth da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordem 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordem 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordem 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordem 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` opcional substitui o endpoint da Exa (ordem 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordem 70)
10. **Parallel** -- API paga Parallel Search via `PARALLEL_API_KEY` ou `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` opcional substitui o endpoint (ordem 75)

Depois disso, providers com endpoint configurado:

11. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordem 200)

Providers sem chave, como **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** e **Codex Hosted Search**, ficam disponíveis somente quando você
os seleciona explicitamente com `tools.web.search.provider` ou por meio de
`openclaw configure --section web`. O OpenClaw não envia consultas gerenciadas de
`web_search` para um provider sem chave só porque nenhum provider com API
está configurado.

Modelos OpenAI Responses são uma exceção: enquanto `tools.web.search.provider` estiver
indefinido, eles usam a busca na Web nativa da OpenAI em vez dos providers
gerenciados acima. Defina `tools.web.search.provider` como `parallel-free` (ou outro provider)
para roteá-los pelo caminho gerenciado.

<Note>
  Todos os campos de chave de provider aceitam objetos SecretRef. SecretRefs com escopo de Plugin
  em `plugins.entries.<plugin>.config.webSearch.apiKey` são resolvidos para os
  providers de busca na Web com API instalados, incluindo Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity e Tavily,
  seja o provider escolhido explicitamente via `tools.web.search.provider` ou
  selecionado por detecção automática. No modo de detecção automática, o OpenClaw resolve apenas a
  chave do provider selecionado -- SecretRefs não selecionadas permanecem inativas, então você pode
  manter vários providers configurados sem pagar custo de resolução para os
  que não está usando.
</Note>

## Configuração

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

A configuração específica do provider (chaves de API, URLs base, modos) fica em
`plugins.entries.<plugin>.config.webSearch.*`. Gemini também pode reutilizar
`models.providers.google.apiKey` e `models.providers.google.baseUrl` como fallbacks de menor prioridade
após sua configuração dedicada de busca na Web e `GEMINI_API_KEY`. Veja as
páginas dos providers para exemplos.
Grok também pode reutilizar um perfil de autenticação OAuth da xAI de `openclaw models auth login
--provider xai --method oauth`; a configuração por chave de API continua sendo o fallback.

`tools.web.search.provider` é validado contra os IDs de provider de busca na Web
declarados por manifests de plugins incluídos e instalados. Um erro de digitação como `"brvae"`
falha na validação da configuração em vez de voltar silenciosamente para a detecção automática. Se um
provider configurado tiver apenas evidência obsoleta de Plugin, como um bloco
`plugins.entries.<plugin>` restante após desinstalar um Plugin de terceiros,
o OpenClaw mantém a inicialização resiliente e informa um aviso para que você possa reinstalar o
Plugin ou executar `openclaw doctor --fix` para limpar a configuração obsoleta.

A seleção de provider de fallback de `web_fetch` é separada:

- escolha-o com `tools.web.fetch.provider`
- ou omita esse campo e deixe o OpenClaw detectar automaticamente o primeiro provider de web-fetch
  pronto a partir das credenciais configuradas
- `web_fetch` sem sandbox pode usar providers de Plugin instalados que declaram
  `contracts.webFetchProviders`; fetches com sandbox permitem providers incluídos e
  instalações verificadas de Plugins oficiais, mas excluem Plugins externos de terceiros
- o Plugin oficial Firecrawl fornece fallback de web-fetch, configurado em
  `plugins.entries.firecrawl.config.webFetch.*`

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode pedir:

- a região da API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- o modelo padrão de busca na Web do Kimi (padrão: `kimi-k2.6`)

Para `x_search`, configure `plugins.entries.xai.config.xSearch.*`. Ele usa o
mesmo perfil de autenticação da xAI que o chat, ou a credencial `XAI_API_KEY` / de busca na Web do Plugin
usada pela busca na Web do Grok.
A configuração legada `tools.web.x_search.*` é migrada automaticamente por `openclaw doctor --fix`.
Quando você escolhe Grok durante `openclaw onboard` ou `openclaw configure --section web`,
o OpenClaw também pode oferecer configuração opcional de `x_search` com a mesma credencial.
Esta é uma etapa de acompanhamento separada dentro do caminho do Grok, não uma escolha separada de provider de busca na Web
de nível superior. Se você escolher outro provider, o OpenClaw não
mostra o prompt de `x_search`.

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
    Defina a variável de ambiente do provider no ambiente do processo Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.
    Veja [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parâmetros da ferramenta

| Parâmetro             | Descrição                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Consulta de busca (obrigatório)                       |
| `count`               | Resultados a retornar (1-10, padrão: 5)               |
| `country`             | Código de país ISO de 2 letras (ex.: "US", "DE")     |
| `language`            | Código de idioma ISO 639-1 (ex.: "en", "de")         |
| `search_lang`         | Código do idioma de busca (somente Brave)             |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`     |
| `date_after`          | Resultados após esta data (YYYY-MM-DD)                |
| `date_before`         | Resultados antes desta data (YYYY-MM-DD)              |
| `ui_lang`             | Código de idioma da UI (somente Brave)                |
| `domain_filter`       | Array de allowlist/denylist de domínios (somente Perplexity) |
| `max_tokens`          | Orçamento total de conteúdo, padrão 25000 (somente Perplexity) |
| `max_tokens_per_page` | Limite de tokens por página, padrão 2048 (somente Perplexity) |

<Warning>
  Nem todos os parâmetros funcionam com todos os providers. O modo `llm-context` do Brave
  rejeita `ui_lang`; `date_before` também precisa de `date_after` porque intervalos personalizados
  de freshness do Brave exigem datas de início e fim.
  Gemini, Grok e Kimi retornam uma resposta sintetizada com citações. Eles
  aceitam `count` por compatibilidade com ferramenta compartilhada, mas isso não altera o
  formato da resposta fundamentada. Gemini trata freshness `day` como uma dica de recência; valores
  de freshness mais amplos e datas explícitas definem intervalos de tempo de grounding da Google Search.
  Perplexity se comporta da mesma forma quando você usa o caminho de compatibilidade
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG aceita `http://` somente para hosts confiáveis de rede privada ou loopback;
  endpoints públicos do SearXNG devem usar `https://`.
  Firecrawl e Tavily só oferecem suporte a `query` e `count` por meio de `web_search`
  -- use suas ferramentas dedicadas para opções avançadas.
</Warning>

## x_search

`x_search` consulta posts do X (antigo Twitter) usando xAI e retorna
respostas sintetizadas por IA com citações. Ele aceita consultas em linguagem natural e
filtros estruturados opcionais. O OpenClaw habilita a ferramenta `x_search`
integrada da xAI somente na requisição que atende a esta chamada de ferramenta.

<Note>
  A xAI documenta `x_search` como compatível com busca por palavras-chave, busca semântica, busca de usuário
  e busca de thread. Para estatísticas de engajamento por post, como reposts,
  respostas, favoritos ou visualizações, prefira uma consulta direcionada para a URL exata do post
  ou ID de status. Buscas amplas por palavras-chave podem encontrar o post correto, mas retornar metadados
  por post menos completos. Um bom padrão é: localize o post primeiro e depois
  execute uma segunda consulta `x_search` focada nesse post exato.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` posta para `<baseUrl>/responses` quando
`plugins.entries.xai.config.xSearch.baseUrl` está definido. Se esse campo for omitido,
ele faz fallback para `plugins.entries.xai.config.webSearch.baseUrl`, depois para o
legado `tools.web.search.grok.baseUrl` e, por fim, para o endpoint público da xAI.

### Parâmetros de x_search

| Parâmetro                    | Descrição                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Consulta de busca (obrigatório)                                |
| `allowed_x_handles`          | Restringir resultados a handles específicos do X                 |
| `excluded_x_handles`         | Excluir handles específicos do X                             |
| `from_date`                  | Incluir somente publicações nesta data ou depois dela (AAAA-MM-DD)  |
| `to_date`                    | Incluir somente publicações nesta data ou antes dela (AAAA-MM-DD) |
| `enable_image_understanding` | Permitir que a xAI inspecione imagens anexadas a publicações correspondentes      |
| `enable_video_understanding` | Permitir que a xAI inspecione vídeos anexados a publicações correspondentes      |

### Exemplo de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Estatísticas por publicação: use a URL exata do status ou o ID do status quando possível
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

// Filtragem de domínio (somente Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfis de ferramentas

Se você usar perfis de ferramentas ou listas de permissões, adicione `web_search`, `x_search` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // ou: allow: ["group:web"]  (inclui web_search, x_search e web_fetch)
  },
}
```

## Relacionado

- [Web Fetch](/pt-BR/tools/web-fetch) -- buscar uma URL e extrair conteúdo legível
- [Web Browser](/pt-BR/tools/browser) -- automação completa de navegador para sites com muito JS
- [Grok Search](/pt-BR/tools/grok-search) -- Grok como provedor de `web_search`
- [Ollama Web Search](/pt-BR/tools/ollama-search) -- busca na web sem chave por meio do seu host Ollama
