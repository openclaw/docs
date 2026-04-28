---
read_when:
    - Você quer usar o Brave Search para `web_search`
    - Você precisa de um `BRAVE_API_KEY` ou de detalhes do plano
summary: Configuração da API Brave Search para `web_search`
title: Brave Search
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:14:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# API Brave Search

O OpenClaw oferece suporte à API Brave Search como um provedor `web_search`.

## Obter uma chave de API

1. Crie uma conta da API Brave Search em [https://brave.com/search/api/](https://brave.com/search/api/)
2. No dashboard, escolha o plano **Search** e gere uma chave de API.
3. Armazene a chave na configuração ou defina `BRAVE_API_KEY` no ambiente do Gateway.

## Exemplo de configuração

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // ou "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

As configurações específicas de busca do provedor Brave agora ficam em `plugins.entries.brave.config.webSearch.*`.
O legado `tools.web.search.apiKey` ainda é carregado pelo shim de compatibilidade, mas não é mais o caminho canônico de configuração.

`webSearch.mode` controla o transporte do Brave:

- `web` (padrão): busca web normal do Brave com títulos, URLs e snippets
- `llm-context`: API Brave LLM Context com blocos de texto pré-extraídos e fontes para grounding

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de busca.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a retornar (1–10).
</ParamField>

<ParamField path="country" type="string">
Código ISO de país com 2 letras (por exemplo `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 para resultados de busca (por exemplo `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de busca do Brave (por exemplo `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código ISO de idioma para elementos da interface.
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

**Exemplos:**

```javascript
// Busca específica por país e idioma
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

// Busca por intervalo de datas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Observações

- O OpenClaw usa o plano **Search** do Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais novos como LLM Context ou limites de taxa mais altos.
- Cada plano Brave inclui **\$5/mês em crédito grátis** (renovável). O plano Search custa \$5 por 1.000 requests, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no dashboard do Brave para evitar cobranças inesperadas. Consulte o [portal da API Brave](https://brave.com/search/api/) para os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos exige um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- O modo `llm-context` retorna entradas de fonte com grounding em vez do formato normal de snippet de web search.
- O modo `llm-context` não oferece suporte a `ui_lang`, `freshness`, `date_after` ou `date_before`.
- `ui_lang` deve incluir uma subtag de região como `en-US`.
- Os resultados ficam em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

## Relacionados

- [Web Search overview](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
- [Exa Search](/pt-BR/tools/exa-search) -- busca neural com extração de conteúdo
