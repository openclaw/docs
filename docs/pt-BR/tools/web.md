---
read_when:
    - Você quer habilitar ou configurar o web_search
    - Você quer habilitar ou configurar o x_search
    - Você precisa escolher um provedor de pesquisa
    - Você quer entender a detecção automática e a seleção de provedores
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch — pesquise na web, pesquise publicações no X ou obtenha o conteúdo de páginas
title: Pesquisa na web
x-i18n:
    generated_at: "2026-07-12T15:47:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` pesquisa na web com o provedor configurado e retorna
resultados normalizados, armazenados em cache por consulta durante 15 minutos (configurável). O OpenClaw
também inclui `x_search` para publicações no X (antigo Twitter) e `web_fetch` para
busca leve de URLs. `web_fetch` sempre é executado localmente; `web_search` é encaminhado
por meio do xAI Responses quando o Grok é o provedor, e `x_search` sempre usa
o xAI Responses.

<Info>
  `web_search` é uma ferramenta HTTP leve, não uma automação de navegador. Para
  sites que dependem muito de JS ou exigem login, use o [Navegador Web](/pt-BR/tools/browser). Para
  buscar uma URL específica, use o [Web Fetch](/pt-BR/tools/web-fetch).
</Info>

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    Escolha um provedor e conclua qualquer configuração necessária. Alguns provedores não
    exigem chave, enquanto outros precisam de uma chave de API. Consulte as páginas dos provedores abaixo para
    obter detalhes.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Isso armazena o provedor e qualquer credencial necessária. Para provedores
    baseados em API, você pode definir a variável de ambiente do provedor (por exemplo,
    `BRAVE_API_KEY`) e ignorar esta etapa.
  </Step>
  <Step title="Use">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Para publicações no X:

    ```javascript
    await x_search({ query: "receitas para o jantar" });
    ```

  </Step>
</Steps>

## Como escolher um provedor

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pt-BR/tools/brave-search">
    Resultados estruturados com trechos. Compatível com o modo `llm-context` e filtros de país/idioma. Há uma modalidade gratuita disponível.
  </Card>
  <Card title="Pesquisa Hospedada do Codex" icon="search" href="/pt-BR/plugins/codex-harness">
    Respostas fundamentadas e sintetizadas por IA por meio da sua conta do app-server do Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pt-BR/tools/duckduckgo-search">
    Provedor sem chave. Nenhuma chave de API é necessária. Integração não oficial baseada em HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pt-BR/tools/exa-search">
    Pesquisa neural + por palavra-chave com extração de conteúdo (destaques, texto e resumos).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pt-BR/tools/firecrawl">
    Resultados estruturados. Funciona melhor em conjunto com `firecrawl_search` e `firecrawl_scrape` para extração aprofundada.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pt-BR/tools/gemini-search">
    Respostas sintetizadas por IA com citações por meio da fundamentação do Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pt-BR/tools/grok-search">
    Respostas sintetizadas por IA com citações por meio da fundamentação web da xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pt-BR/tools/kimi-search">
    Respostas sintetizadas por IA com citações por meio da pesquisa web da Moonshot; alternativas de chat sem fundamentação falham explicitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pt-BR/tools/minimax-search">
    Resultados estruturados por meio da API de pesquisa do MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pt-BR/tools/ollama-search">
    Pesquisa por meio de um host Ollama local autenticado ou da API hospedada do Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/pt-BR/tools/parallel-search">
    API paga do Parallel Search (`PARALLEL_API_KEY`); limites de taxa maiores e ajuste de objetivos.
  </Card>
  <Card title="Parallel Search (Gratuita)" icon="layer-group" href="/pt-BR/tools/parallel-search">
    Adesão sem chave. Search MCP gratuito da Parallel, com trechos densos otimizados para LLM e sem chave de API.
  </Card>
  <Card title="Perplexity" icon="search" href="/pt-BR/tools/perplexity-search">
    Resultados estruturados com controles de extração de conteúdo e filtragem por domínio.
  </Card>
  <Card title="SearXNG" icon="server" href="/pt-BR/tools/searxng-search">
    Metapesquisa auto-hospedada. Nenhuma chave de API é necessária. Agrega Google, Bing, DuckDuckGo e outros.
  </Card>
  <Card title="Tavily" icon="globe" href="/pt-BR/tools/tavily">
    Resultados estruturados com profundidade de pesquisa, filtragem por tópico e `tavily_extract` para extração de URLs.
  </Card>
</CardGroup>

### Comparação entre provedores

| Provedor                                         | Estilo dos resultados                                                   | Filtros                                          | Chave de API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pt-BR/tools/brave-search)                     | Trechos estruturados                                            | País, idioma, período, modo `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Pesquisa Hospedada do Codex](/pt-BR/plugins/codex-harness)    | Sintetizados por IA + URLs das fontes                                   | Domínios, tamanho do contexto, localização do usuário             | Nenhuma; usa a autenticação do Codex/OpenAI                                                         |
| [DuckDuckGo](/pt-BR/tools/duckduckgo-search)           | Trechos estruturados                                            | --                                               | Nenhuma (sem chave)                                                                         |
| [Exa](/pt-BR/tools/exa-search)                         | Estruturados + extraídos                                         | Modo neural/por palavra-chave, data, extração de conteúdo    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pt-BR/tools/firecrawl)                    | Trechos estruturados                                            | Por meio da ferramenta `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pt-BR/tools/gemini-search)                   | Sintetizados por IA + citações                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pt-BR/tools/grok-search)                       | Sintetizados por IA + citações                                     | --                                               | OAuth da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/pt-BR/tools/kimi-search)                       | Sintetizados por IA + citações; falha em alternativas de chat sem fundamentação | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pt-BR/tools/minimax-search)          | Trechos estruturados                                            | Região (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pt-BR/tools/ollama-search)        | Trechos estruturados                                            | --                                               | Nenhuma para hosts locais autenticados; `OLLAMA_API_KEY` para pesquisa direta em `https://ollama.com` |
| [Parallel](/pt-BR/tools/parallel-search)               | Trechos densos classificados para o contexto da LLM                          | --                                               | `PARALLEL_API_KEY` (paga)                                                               |
| [Parallel Search (Gratuita)](/pt-BR/tools/parallel-search) | Trechos densos classificados para o contexto da LLM                          | --                                               | Nenhuma (Search MCP gratuito)                                                                  |
| [Perplexity](/pt-BR/tools/perplexity-search)           | Trechos estruturados                                            | País, idioma, período, domínios, limites de conteúdo | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pt-BR/tools/searxng-search)                 | Trechos estruturados                                            | Categorias, idioma                             | Nenhuma (auto-hospedado)                                                                      |
| [Tavily](/pt-BR/tools/tavily)                          | Trechos estruturados                                            | Por meio da ferramenta `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Detecção automática

As listas de provedores na documentação e nos fluxos de configuração estão em ordem alfabética. A detecção automática usa uma
ordem de precedência fixa e separada, e só escolhe um provedor que precise de uma
credencial (`requiresCredential !== false`) quando encontra uma configurada. Se
nenhum `provider` estiver definido, o OpenClaw verifica os provedores nesta ordem e usa o
primeiro que estiver pronto:

Primeiro, provedores baseados em API:

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordem 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordem 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` ou `models.providers.google.apiKey` (ordem 20)
4. **Grok** -- OAuth da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordem 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordem 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordem 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordem 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`; o valor opcional `plugins.entries.exa.config.webSearch.baseUrl` substitui o endpoint da Exa (ordem 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordem 70)
10. **Parallel** -- API paga do Parallel Search por meio de `PARALLEL_API_KEY` ou `plugins.entries.parallel.config.webSearch.apiKey`; o valor opcional `plugins.entries.parallel.config.webSearch.baseUrl` substitui o endpoint (ordem 75)

Em seguida, provedores de endpoint configurados:

11. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordem 200)

Provedores sem chave, como **Parallel Search (Gratuita)**, **DuckDuckGo**,
**Ollama Web Search** e **Pesquisa Hospedada do Codex**, nunca vencem a detecção automática,
mesmo que tenham um valor de ordem interno. Eles são usados somente quando você
os seleciona explicitamente com `tools.web.search.provider` ou por meio de
`openclaw configure --section web`. O OpenClaw não envia consultas gerenciadas de
`web_search` para um provedor sem chave apenas porque nenhum provedor baseado em API
está configurado.

Os modelos OpenAI Responses são uma exceção: enquanto `tools.web.search.provider`
não estiver definido, eles usam a pesquisa web nativa da OpenAI em vez dos provedores
gerenciados acima (consulte abaixo). Defina `tools.web.search.provider` como
`parallel-free` (ou outro provedor) para encaminhá-los pelo caminho gerenciado.

<Note>
  Todos os campos de chave de provedor são compatíveis com objetos SecretRef. SecretRefs com escopo de Plugin
  em `plugins.entries.<plugin>.config.webSearch.apiKey` são resolvidas para os
  provedores de pesquisa web baseados em API instalados, incluindo Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity e Tavily,
  independentemente de o provedor ser escolhido explicitamente por meio de `tools.web.search.provider` ou
  selecionado pela detecção automática. No modo de detecção automática, o OpenClaw resolve apenas a
  chave do provedor selecionado -- SecretRefs não selecionadas permanecem inativas, permitindo que você
  mantenha vários provedores configurados sem pagar o custo de resolução daqueles
  que não está usando.
</Note>

## Pesquisa web nativa da OpenAI

Modelos diretos do OpenAI Responses (`api: "openai-responses"`, provedor `openai`,
sem URL base ou com uma URL base oficial da API da OpenAI) usam automaticamente
a ferramenta hospedada `web_search` da OpenAI quando a pesquisa na web do OpenClaw
está habilitada e nenhum provedor gerenciado está fixado. Esse comportamento
pertence ao provedor no Plugin OpenAI incluído e não se aplica a URLs base de
proxies compatíveis com a OpenAI nem a rotas do Azure. Defina
`tools.web.search.provider` como outro provedor, como `brave`, para manter a
ferramenta gerenciada `web_search` para modelos da OpenAI, ou defina
`tools.web.search.enabled: false` para desabilitar tanto a pesquisa gerenciada
quanto a pesquisa nativa da OpenAI.

## Pesquisa nativa na web do Codex

O runtime app-server do Codex usa automaticamente a ferramenta hospedada
`web_search` do Codex quando a pesquisa na web está habilitada e nenhum provedor
gerenciado está selecionado. A pesquisa nativa hospedada e a ferramenta dinâmica
gerenciada `web_search` do OpenClaw são mutuamente exclusivas, portanto, a
pesquisa gerenciada não pode contornar as restrições de domínio nativas. O
OpenClaw usa a ferramenta gerenciada quando a pesquisa hospedada está
indisponível, explicitamente desabilitada ou substituída por um provedor
gerenciado selecionado. O OpenClaw mantém a extensão independente `web.run` do
Codex desabilitada (`features.standalone_web_search: false`), pois o tráfego de
produção do app-server rejeita o namespace `web` definido pelo usuário.

- Configure a pesquisa nativa em `tools.web.search.openaiCodex`
- Defina `tools.web.search.provider: "codex"` para provisionar a Pesquisa
  Hospedada do Codex como o provedor gerenciado de `web_search` para qualquer
  modelo principal. Cada chamada executa um turno efêmero e limitado do
  app-server do Codex e falha se o Codex não emitir um item `webSearch` hospedado.
- `mode: "cached"` é a preferência padrão, mas o Codex a resolve como acesso
  externo em tempo real para turnos irrestritos do app-server; defina `"live"`
  para solicitar explicitamente acesso em tempo real
- Defina `tools.web.search.provider` como um provedor gerenciado, como `brave`,
  para usar a `web_search` gerenciada do OpenClaw
- Defina `tools.web.search.openaiCodex.enabled: false` para não usar a pesquisa
  hospedada pelo Codex; outros provedores gerenciados continuam disponíveis
- Restringir a superfície de ferramentas nativas do Codex também mantém a
  `web_search` gerenciada disponível
- Quando `allowedDomains` está definido, o fallback gerenciado automático falha
  de forma fechada se a pesquisa hospedada estiver indisponível, para que a lista
  de permissões nativa não possa ser contornada
- Execuções somente com LLM e com ferramentas desabilitadas desabilitam tanto a
  pesquisa nativa quanto a gerenciada
- `tools.web.search.enabled: false` desabilita tanto a pesquisa gerenciada quanto
  a nativa

Alterações persistentes na política efetiva de pesquisa do Codex iniciam uma nova
thread vinculada, para que uma thread do app-server já carregada não possa manter
acesso obsoleto à pesquisa hospedada. Restrições transitórias por turno usam uma
thread temporária restrita e preservam a vinculação existente para retomada
posterior.

O tráfego direto do OpenAI ChatGPT Responses também pode usar a ferramenta
hospedada `web_search` da OpenAI. Esse caminho separado continua sendo opcional
por meio de `tools.web.search.openaiCodex.enabled: true` e se aplica somente a
modelos `openai/*` qualificados que usam `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Opcional: use a Pesquisa Hospedada do Codex também em modelos principais que não sejam do Codex.
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

Para runtimes e provedores que não oferecem suporte à pesquisa nativa do Codex,
o Codex pode usar o fallback gerenciado de `web_search` por meio do namespace
dinâmico de ferramentas do OpenClaw. Use um provedor gerenciado explícito quando
precisar dos controles de rede específicos do provedor do OpenClaw em vez da
pesquisa hospedada pelo Codex.

Selecionar `provider: "codex"` habilita o Plugin `codex` incluído e usa as mesmas
restrições de `tools.web.search.openaiCodex` mostradas acima. Primeiro, autentique
o app-server do Codex com `openclaw models auth login --provider openai`.
O agente principal pode usar qualquer modelo ou runtime; somente o worker de
pesquisa limitada é executado por meio do Codex.

## Segurança de rede

As chamadas gerenciadas do provedor HTTP `web_search` usam o caminho de busca protegido do OpenClaw,
restrito ao nome de host do próprio provedor atual. Somente para esse nome de host,
o OpenClaw permite respostas DNS de IP falso do Surge, Clash e sing-box nos
intervalos `198.18.0.0/15` e `fc00::/7`. Outros destinos privados, de loopback, link-local e
de metadados permanecem bloqueados. O Codex Hosted Search é a exceção:
seu worker limitado delega o acesso à rede à ferramenta hospedada
`web_search` do app-server do Codex.

Essa permissão automática não se aplica a URLs `web_fetch` arbitrárias. Para
`web_fetch`, habilite `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explicitamente apenas quando seu
proxy confiável controlar esses intervalos sintéticos.

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // padrão: true
        provider: "brave", // ou omita para detecção automática
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
`models.providers.google.apiKey` e `models.providers.google.baseUrl` como alternativas de menor prioridade
após sua configuração dedicada de busca na web e `GEMINI_API_KEY`. Consulte as
páginas dos provedores para ver exemplos.
O Grok também pode reutilizar um perfil de autenticação OAuth da xAI de `openclaw models auth login
--provider xai --method oauth`; a configuração por chave de API permanece como alternativa.

`tools.web.search.provider` é validado em relação aos IDs de provedores de busca na web
declarados pelos manifestos de plugins incluídos e instalados. Um erro de digitação como `"brvae"`
faz a validação da configuração falhar, em vez de recorrer silenciosamente à detecção automática. Se um
provedor configurado tiver apenas evidências obsoletas de plugin, como um bloco
`plugins.entries.<plugin>` restante após a desinstalação de um plugin de terceiros,
o OpenClaw mantém a inicialização resiliente e relata um aviso para que você possa reinstalar o
plugin ou executar `openclaw doctor --fix` para limpar a configuração obsoleta.

A seleção do provedor alternativo de `web_fetch` é separada:

- escolha-o com `tools.web.fetch.provider`
- ou omita esse campo e deixe o OpenClaw detectar automaticamente o primeiro provedor de web-fetch
  pronto com base nas credenciais configuradas
- `web_fetch` sem sandbox pode usar provedores de plugins instalados que declarem
  `contracts.webFetchProviders`; buscas em sandbox permitem provedores incluídos e
  instalações verificadas de plugins oficiais, mas excluem plugins externos de terceiros
- o plugin oficial Firecrawl é o único colaborador incluído de `webFetchProviders`
  atualmente, configurado em
  `plugins.entries.firecrawl.config.webFetch.*`

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode solicitar:

- a região da API da Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- o modelo padrão de pesquisa na web do Kimi (o padrão é `kimi-k2.6`)

Para `x_search`, configure `plugins.entries.xai.config.xSearch.*`. Ele usa o
mesmo perfil de autenticação da xAI usado pelo chat ou a credencial
`XAI_API_KEY` / de pesquisa na web do plugin usada pela pesquisa na web do Grok.
A configuração legada `tools.web.x_search.*` é migrada automaticamente por `openclaw doctor --fix`.
Quando você escolhe o Grok durante `openclaw onboard` ou `openclaw configure --section web`,
o OpenClaw também oferece a configuração opcional de `x_search` com a mesma credencial logo
após a conclusão da configuração do Grok. Esta é uma etapa adicional separada dentro do caminho
do Grok, não uma opção separada de provedor de pesquisa na web no nível superior. Se você escolher outro
provedor, o OpenClaw não exibirá a solicitação de `x_search`.

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
    Defina a variável de ambiente do provedor no ambiente do processo do Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Para uma instalação do Gateway, coloque-a em `~/.openclaw/.env`.
    Consulte [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parâmetros da ferramenta

| Parâmetro             | Descrição                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Consulta de pesquisa (obrigatória)                                 |
| `count`               | Resultados a retornar (1-10, padrão: 5)                            |
| `country`             | Código de país ISO de 2 letras (por exemplo, "US", "DE")           |
| `language`            | Código de idioma ISO 639-1 (por exemplo, "en", "de")               |
| `search_lang`         | Código do idioma de pesquisa (somente Brave)                       |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`                  |
| `date_after`          | Resultados posteriores a esta data (YYYY-MM-DD)                    |
| `date_before`         | Resultados anteriores a esta data (YYYY-MM-DD)                     |
| `ui_lang`             | Código do idioma da interface (somente Brave)                      |
| `domain_filter`       | Lista de permissão/bloqueio de domínios (somente Perplexity)       |
| `max_tokens`          | Orçamento total de tokens de conteúdo, somente na API nativa Perplexity Search |
| `max_tokens_per_page` | Limite de tokens de extração por página, somente na API nativa Perplexity Search |

<Warning>
  Nem todos os parâmetros funcionam com todos os provedores. O modo `llm-context`
  do Brave rejeita `ui_lang`; `date_before` também exige `date_after`, pois os intervalos
  personalizados de atualidade do Brave exigem as datas inicial e final.
  Gemini, Grok e Kimi retornam uma resposta sintetizada com citações. Eles
  aceitam `count` para compatibilidade com a ferramenta compartilhada, mas isso não altera o
  formato da resposta fundamentada. O Gemini trata a atualidade `day` como uma indicação de recência; valores
  de atualidade mais amplos e datas explícitas definem intervalos de tempo para a fundamentação da Pesquisa Google.
  O Perplexity se comporta da mesma forma quando você usa o caminho de compatibilidade
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`); esse caminho também elimina o suporte a `max_tokens` e
  `max_tokens_per_page`.
  O SearXNG aceita `http://` somente para hosts confiáveis de rede privada ou de loopback;
  endpoints públicos do SearXNG devem usar `https://`.
  Firecrawl e Tavily oferecem suporte apenas a `query` e `count` por meio de `web_search`
  -- use as ferramentas dedicadas deles para opções avançadas.
</Warning>

## x_search

`x_search` consulta publicações do X (antigo Twitter) usando a xAI e retorna
respostas sintetizadas por IA com citações. Ele aceita consultas em linguagem natural e
filtros estruturados opcionais. O OpenClaw cria a ferramenta `x_search` integrada da xAI
a cada solicitação, em vez de mantê-la permanentemente registrada, portanto ela fica
ativa somente no turno que realmente a chama.

<Warning>
  `x_search` é executado nos servidores da xAI. A xAI cobra US$ 5 por 1.000 chamadas da ferramenta, além dos
  tokens de entrada e saída do modelo.
</Warning>

<Note>
  A documentação da xAI informa que `x_search` oferece suporte a pesquisa por palavra-chave, pesquisa semântica, pesquisa de
  usuários e busca de threads. Para estatísticas de engajamento por publicação, como republicações,
  respostas, favoritos ou visualizações, prefira uma consulta direcionada à URL exata da publicação
  ou ao ID do status. Pesquisas amplas por palavra-chave podem encontrar a publicação correta, mas retornar
  metadados menos completos por publicação. Um bom padrão é: primeiro localize a publicação e depois
  execute uma segunda consulta `x_search` concentrada nessa publicação exata.
</Note>

### Configuração de x_search

Com `enabled` omitido, `x_search` é exposto somente quando o provedor do modelo
ativo é `xai` e as credenciais da xAI são resolvidas. Para um modelo ativo com um
provedor conhecido que não seja da xAI, defina `plugins.entries.xai.config.xSearch.enabled`
como `true` para habilitar o uso entre provedores. Se o provedor do modelo ativo
estiver ausente ou não for resolvido, a ferramenta permanecerá oculta. Defina
`enabled` como `false` para desabilitá-la para todos os provedores. As credenciais
da xAI são sempre obrigatórias.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // obrigatório para um provedor de modelo conhecido que não seja da xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // opcional, substitui webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opcional se um perfil de autenticação da xAI ou XAI_API_KEY estiver definido
            baseUrl: "https://api.x.ai/v1", // URL base compartilhada opcional de Responses da xAI
          },
        },
      },
    },
  },
}
```

`x_search` envia uma solicitação para `<baseUrl>/responses` quando
`plugins.entries.xai.config.xSearch.baseUrl` está definido. Se esse campo for
omitido, ele recorre a `plugins.entries.xai.config.webSearch.baseUrl`, depois ao
`tools.web.search.grok.baseUrl` legado e, por fim, ao endpoint público da xAI
(`https://api.x.ai/v1`).

### Parâmetros de x_search

| Parâmetro                    | Descrição                                                      |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | Consulta de pesquisa (obrigatória)                             |
| `allowed_x_handles`          | Restringe os resultados a, no máximo, 20 identificadores do X  |
| `excluded_x_handles`         | Exclui, no máximo, 20 identificadores do X                     |
| `from_date`                  | Inclui somente publicações nesta data ou após ela (YYYY-MM-DD) |
| `to_date`                    | Inclui somente publicações nesta data ou antes dela (YYYY-MM-DD) |
| `enable_image_understanding` | Permite que a xAI inspecione imagens anexadas às publicações correspondentes |
| `enable_video_understanding` | Permite que a xAI inspecione vídeos anexados às publicações correspondentes |

`allowed_x_handles` e `excluded_x_handles` são mutuamente exclusivos.

### Exemplo de x_search

```javascript
await x_search({
  query: "receitas para o jantar",
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
// Pesquisa básica
await web_search({ query: "SDK de Plugin do OpenClaw" });

// Pesquisa específica para alemão
await web_search({ query: "assistir TV online", country: "DE", language: "de" });

// Resultados recentes (última semana)
await web_search({ query: "avanços em IA", freshness: "week" });

// Intervalo de datas
await web_search({
  query: "pesquisa climática",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem por domínio (somente Perplexity)
await web_search({
  query: "avaliações de produtos",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Perfis de ferramentas

Se você usa perfis de ferramentas ou listas de permissões, adicione `web_search`, `x_search` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // ou: allow: ["group:web"]  (inclui web_search, x_search e web_fetch)
  },
}
```

## Relacionados

- [Busca na Web](/pt-BR/tools/web-fetch) -- busca uma URL e extrai conteúdo legível
- [Navegador Web](/pt-BR/tools/browser) -- automação completa do navegador para sites que usam JavaScript intensivamente
- [Pesquisa do Grok](/pt-BR/tools/grok-search) -- Grok como provedor de `web_search`
- [Pesquisa Web do Ollama](/pt-BR/tools/ollama-search) -- pesquisa na web sem chave por meio do seu host Ollama
