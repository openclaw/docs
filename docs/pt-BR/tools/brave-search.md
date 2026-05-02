---
read_when:
    - Você quer usar o Brave Search para web_search
    - Você precisa de uma BRAVE_API_KEY ou dos detalhes do plano
summary: Configuração da API Brave Search para web_search
title: Busca do Brave
x-i18n:
    generated_at: "2026-05-02T05:57:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5b6624d078ba55e30fbac4dd863a0d016e2e8d160e32bcc406e5070998241ba
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw oferece suporte à Brave Search API como provedor de `web_search`.

## Obter uma chave de API

1. Crie uma conta da Brave Search API em [https://brave.com/search/api/](https://brave.com/search/api/)
2. No painel, escolha o plano **Search** e gere uma chave de API.
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
            mode: "web", // or "llm-context"
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

As configurações de pesquisa específicas do provedor Brave agora ficam em `plugins.entries.brave.config.webSearch.*`.
O `tools.web.search.apiKey` legado ainda é carregado por meio do shim de compatibilidade, mas não é mais o caminho de configuração canônico.

`webSearch.mode` controla o transporte do Brave:

- `web` (padrão): pesquisa web normal do Brave com títulos, URLs e trechos
- `llm-context`: Brave LLM Context API com fragmentos de texto pré-extraídos e fontes para fundamentação

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a retornar (1–10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por exemplo, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 para resultados de pesquisa (por exemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de pesquisa do Brave (por exemplo, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código de idioma ISO para elementos da UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tempo — `day` equivale a 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Somente resultados publicados após esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Somente resultados publicados antes desta data (`YYYY-MM-DD`).
</ParamField>

**Exemplos:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Observações

- OpenClaw usa o plano **Search** do Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais recentes como LLM Context ou limites de taxa mais altos.
- Cada plano Brave inclui **\$5/mês em crédito gratuito** (renovável). O plano Search custa \$5 por 1.000 solicitações, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no painel do Brave para evitar cobranças inesperadas. Consulte o [portal da Brave API](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos exige um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- O modo `llm-context` retorna entradas de fonte fundamentadas em vez do formato normal de trechos de pesquisa web.
- O modo `llm-context` oferece suporte a `freshness` e intervalos delimitados de `date_after` + `date_before`. Ele não oferece suporte a `ui_lang`; `date_before` sem `date_after` é rejeitado porque o Brave exige que intervalos de atualização personalizados incluam datas de início e término.
- `ui_lang` deve incluir uma subtag de região, como `en-US`.
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

## Relacionados

- [Visão geral da Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
- [Exa Search](/pt-BR/tools/exa-search) -- pesquisa neural com extração de conteúdo
