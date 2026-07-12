---
read_when:
    - Você quer usar o Perplexity Search para pesquisas na web
    - Você precisa configurar PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: Compatibilidade da API de Pesquisa da Perplexity e do Sonar/OpenRouter com web_search
title: Pesquisa do Perplexity
x-i18n:
    generated_at: "2026-07-12T00:28:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

O OpenClaw oferece suporte à API Perplexity Search como provedor de `web_search`. Ela retorna resultados estruturados com os campos `title`, `url` e `snippet`.

Para fins de compatibilidade, o OpenClaw também oferece suporte a configurações legadas do Perplexity Sonar/OpenRouter. Se você usar `OPENROUTER_API_KEY`, uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey` ou definir `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, o provedor alternará para o fluxo de conclusões de chat e retornará respostas sintetizadas por IA com citações, em vez de resultados estruturados da API Search.

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obter uma chave de API da Perplexity

1. Crie uma conta da Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Gere uma chave de API no painel.
3. Armazene a chave na configuração ou defina `PERPLEXITY_API_KEY` no ambiente do Gateway.

## Compatibilidade com o OpenRouter

Se você já usava o OpenRouter para o Perplexity Sonar, mantenha `provider: "perplexity"` e defina `OPENROUTER_API_KEY` no ambiente do Gateway ou armazene uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles opcionais de compatibilidade:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemplos de configuração

### API Perplexity Search nativa

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

**Pelo ambiente:** defina `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` no ambiente do processo do Gateway. Para uma instalação do Gateway, coloque-a em `~/.openclaw/.env` (ou no ambiente do seu serviço). Consulte [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` estiver configurado e a SecretRef da chave da Perplexity não puder ser resolvida, sem alternativa disponível no ambiente, a inicialização ou recarga falhará imediatamente.

## Parâmetros da ferramenta

Estes parâmetros se aplicam ao fluxo da API Perplexity Search nativa.

<ParamField path="query" type="string" required>
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a retornar (1–10).
</ParamField>

<ParamField path="country" type="string">
Código ISO de país com 2 letras (por exemplo, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 (por exemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de período — `day` corresponde a 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Apenas resultados publicados após esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Apenas resultados publicados antes desta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Matriz de domínios permitidos ou bloqueados (máximo de 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Orçamento total de conteúdo (máximo de 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de tokens por página.
</ParamField>

Para o fluxo legado de compatibilidade com Sonar/OpenRouter:

- `query`, `count` e `freshness` são aceitos.
- Nesse fluxo, `count` existe apenas para compatibilidade; a resposta continua sendo uma única resposta sintetizada com citações, em vez de uma lista com N resultados.
- Os filtros exclusivos da API Search (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) retornam erros explícitos.

**Exemplos:**

```javascript
// Pesquisa específica por país e idioma
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Resultados recentes (última semana)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Pesquisa por intervalo de datas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem por domínio (lista de permitidos)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtragem por domínio (lista de bloqueados — prefixe com -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Extração de mais conteúdo
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regras do filtro de domínios

- Máximo de 20 domínios por filtro.
- Não é possível combinar entradas permitidas e bloqueadas na mesma solicitação.
- Use o prefixo `-` para entradas da lista de bloqueados (por exemplo, `["-reddit.com"]`).

## Observações

- A API Perplexity Search retorna resultados estruturados de pesquisa na web (`title`, `url`, `snippet`).
- O OpenRouter ou a definição explícita de `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` faz o Perplexity voltar a usar conclusões de chat do Sonar para fins de compatibilidade.
- A compatibilidade com Sonar/OpenRouter retorna uma única resposta sintetizada com citações, não linhas de resultados estruturados.
- Por padrão, os resultados são armazenados em cache por 15 minutos (configurável por meio de `cacheTtlMinutes`).

## Relacionados

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
  <Card title="Documentação da API Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guia de início rápido e referência oficiais da API Perplexity Search.
  </Card>
</CardGroup>
