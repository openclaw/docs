---
read_when:
    - Você quer usar a Pesquisa do Perplexity para pesquisa na web
    - Você precisa configurar `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
summary: API de pesquisa do Perplexity e compatibilidade Sonar/OpenRouter para `web_search`
title: Pesquisa do Perplexity (caminho legado)
x-i18n:
    generated_at: "2026-04-24T06:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# API de pesquisa do Perplexity

O OpenClaw oferece suporte à API de pesquisa do Perplexity como provider de `web_search`.
Ela retorna resultados estruturados com campos `title`, `url` e `snippet`.

Por compatibilidade, o OpenClaw também oferece suporte a configurações legadas de Perplexity Sonar/OpenRouter.
Se você usar `OPENROUTER_API_KEY`, uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey`, ou definir `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, o provider muda para o caminho de chat-completions e retorna respostas sintetizadas por IA com citações em vez de resultados estruturados da API de pesquisa.

## Como obter uma chave de API do Perplexity

1. Crie uma conta no Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Gere uma chave de API no painel
3. Armazene a chave na configuração ou defina `PERPLEXITY_API_KEY` no ambiente do Gateway.

## Compatibilidade com OpenRouter

Se você já estava usando OpenRouter para Perplexity Sonar, mantenha `provider: "perplexity"` e defina `OPENROUTER_API_KEY` no ambiente do Gateway, ou armazene uma chave `sk-or-...` em `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles opcionais de compatibilidade:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemplos de configuração

### API de pesquisa nativa do Perplexity

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

### Compatibilidade OpenRouter / Sonar

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

**Via configuração:** execute `openclaw configure --section web`. Isso armazena a chave em
`~/.openclaw/openclaw.json` em `plugins.entries.perplexity.config.webSearch.apiKey`.
Esse campo também aceita objetos SecretRef.

**Via ambiente:** defina `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
no ambiente do processo do Gateway. Para uma instalação do gateway, coloque em
`~/.openclaw/.env` (ou no ambiente do seu serviço). Consulte [Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` estiver configurado e a SecretRef da chave do Perplexity não for resolvida sem fallback por env, a inicialização/reload falha rapidamente.

## Parâmetros da ferramenta

Esses parâmetros se aplicam ao caminho nativo da API de pesquisa do Perplexity.

| Parâmetro             | Descrição                                            |
| --------------------- | ---------------------------------------------------- |
| `query`               | Consulta de pesquisa (obrigatória)                   |
| `count`               | Número de resultados a retornar (1-10, padrão: 5)    |
| `country`             | Código de país ISO de 2 letras (ex.: `"US"`, `"DE"`) |
| `language`            | Código de idioma ISO 639-1 (ex.: `"en"`, `"de"`, `"fr"`) |
| `freshness`           | Filtro de tempo: `day` (24h), `week`, `month` ou `year` |
| `date_after`          | Apenas resultados publicados após esta data (YYYY-MM-DD) |
| `date_before`         | Apenas resultados publicados antes desta data (YYYY-MM-DD) |
| `domain_filter`       | Array de allowlist/denylist de domínio (máx. 20)     |
| `max_tokens`          | Orçamento total de conteúdo (padrão: 25000, máx.: 1000000) |
| `max_tokens_per_page` | Limite de tokens por página (padrão: 2048)           |

Para o caminho legado de compatibilidade Sonar/OpenRouter:

- `query`, `count` e `freshness` são aceitos
- `count` é apenas para compatibilidade ali; a resposta ainda é uma única
  resposta sintetizada com citações, em vez de uma lista com N resultados
- filtros exclusivos da API de pesquisa como `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` e `max_tokens_per_page`
  retornam erros explícitos

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

// Filtragem por domínio (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtragem por domínio (denylist - prefixe com -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mais extração de conteúdo
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regras de filtro de domínio

- Máximo de 20 domínios por filtro
- Não é possível misturar allowlist e denylist na mesma requisição
- Use o prefixo `-` para entradas de denylist (por exemplo `["-reddit.com"]`)

## Observações

- A API de pesquisa do Perplexity retorna resultados estruturados de pesquisa na web (`title`, `url`, `snippet`)
- OpenRouter ou `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explícitos fazem o Perplexity voltar para chat completions Sonar por compatibilidade
- A compatibilidade Sonar/OpenRouter retorna uma única resposta sintetizada com citações, não linhas estruturadas de resultado
- Os resultados ficam em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`)

Consulte [Ferramentas web](/pt-BR/tools/web) para a configuração completa de `web_search`.
Consulte a [documentação da API de pesquisa do Perplexity](https://docs.perplexity.ai/docs/search/quickstart) para mais detalhes.

## Relacionado

- [Pesquisa do Perplexity](/pt-BR/tools/perplexity-search)
- [Pesquisa na web](/pt-BR/tools/web)
