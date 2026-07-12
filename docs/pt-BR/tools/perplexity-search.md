---
read_when:
    - Você quer usar o Perplexity Search para pesquisas na web
    - Você precisa configurar PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: Compatibilidade da API de Pesquisa da Perplexity e do Sonar/OpenRouter com web_search
title: Pesquisa do Perplexity
x-i18n:
    generated_at: "2026-07-12T15:45:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

O OpenClaw oferece suporte à Perplexity Search API como provedor de `web_search`. Ela retorna resultados estruturados com os campos `title`, `url` e `snippet`.

Para compatibilidade, o OpenClaw também oferece suporte a configurações legadas do Perplexity Sonar/OpenRouter. Se você usar `OPENROUTER_API_KEY`, uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey` ou definir `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, o provedor muda para o caminho de conclusões de chat e retorna respostas sintetizadas por IA com citações, em vez de resultados estruturados da Search API.

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Como obter uma chave de API da Perplexity

1. Crie uma conta da Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Gere uma chave de API no painel.
3. Armazene a chave na configuração ou defina `PERPLEXITY_API_KEY` no ambiente do Gateway.

## Compatibilidade com o OpenRouter

Se você já usava o OpenRouter para o Perplexity Sonar, mantenha `provider: "perplexity"` e defina `OPENROUTER_API_KEY` no ambiente do Gateway ou armazene uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles opcionais de compatibilidade:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemplos de configuração

### Perplexity Search API nativa

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Compatibilidade com OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Onde definir a chave

**Pela configuração:** execute `openclaw configure --section web`. O comando armazena a chave em `~/.openclaw/openclaw.json`, no campo `plugins.entries.perplexity.config.webSearch.apiKey`. Esse campo também aceita objetos SecretRef.

**Pelo ambiente:** defina `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` no ambiente do processo do Gateway. Para uma instalação do gateway, coloque-a em `~/.openclaw/.env` (ou no ambiente do seu serviço). Consulte [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` estiver configurado e a SecretRef da chave da Perplexity não puder ser resolvida sem um fallback de ambiente, a inicialização/recarga falhará imediatamente.

## Parâmetros da ferramenta

Estes parâmetros se aplicam ao caminho nativo da Perplexity Search API.

<ParamField path="query" type="string" required>
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a retornar (1-10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por exemplo, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 (por exemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tempo — `day` corresponde a 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Somente resultados publicados após esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Somente resultados publicados antes desta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array de lista de permissões/bloqueios de domínios (máximo de 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Orçamento total de conteúdo (máximo de 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de tokens por página.
</ParamField>

Para o caminho legado de compatibilidade com Sonar/OpenRouter:

- `query`, `count` e `freshness` são aceitos.
- Nesse caminho, `count` existe apenas para compatibilidade; a resposta continua sendo uma única resposta sintetizada com citações, em vez de uma lista com N resultados.
- Filtros exclusivos da Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) retornam erros explícitos.

**Exemplos:**

```javascript
// Pesquisa específica por país e idioma
await web_search({
  query: "energia renovável",
  country: "DE",
  language: "de",
});

// Resultados recentes (última semana)
await web_search({
  query: "notícias sobre IA",
  freshness: "week",
});

// Pesquisa por intervalo de datas
await web_search({
  query: "avanços em IA",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem de domínios (lista de permissões)
await web_search({
  query: "pesquisa climática",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtragem de domínios (lista de bloqueios — use o prefixo -)
await web_search({
  query: "avaliações de produtos",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Extração de mais conteúdo
await web_search({
  query: "pesquisa detalhada sobre IA",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regras do filtro de domínios

- Máximo de 20 domínios por filtro.
- Não é possível misturar entradas da lista de permissões e da lista de bloqueios na mesma solicitação.
- Use o prefixo `-` para entradas da lista de bloqueios (por exemplo, `["-reddit.com"]`).

## Observações

- A Perplexity Search API retorna resultados estruturados de pesquisa na web (`title`, `url`, `snippet`).
- O OpenRouter ou uma definição explícita de `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` faz a Perplexity voltar a usar conclusões de chat do Sonar para compatibilidade.
- A compatibilidade com Sonar/OpenRouter retorna uma única resposta sintetizada com citações, não linhas de resultados estruturados.
- Por padrão, os resultados são armazenados em cache por 15 minutos (configurável por meio de `cacheTtlMinutes`).

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Visão geral da pesquisa na web" href="/pt-BR/tools/web" icon="globe">
    Todos os provedores e regras de detecção automática.
  </Card>
  <Card title="Pesquisa do Brave" href="/pt-BR/tools/brave-search" icon="shield">
    Resultados estruturados com filtros de país e idioma.
  </Card>
  <Card title="Pesquisa do Exa" href="/pt-BR/tools/exa-search" icon="magnifying-glass">
    Pesquisa neural com extração de conteúdo.
  </Card>
  <Card title="Documentação da Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guia de início rápido e referência oficiais da Perplexity Search API.
  </Card>
</CardGroup>
