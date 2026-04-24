---
read_when:
    - Você quer usar o Brave Search para `web_search`
    - Você precisa de uma `BRAVE_API_KEY` ou dos detalhes do plano
summary: Configuração da API do Brave Search para `web_search`
title: Busca do Brave (caminho legado)
x-i18n:
    generated_at: "2026-04-24T05:40:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# API do Brave Search

O OpenClaw oferece suporte à API do Brave Search como um provider de `web_search`.

## Obter uma chave de API

1. Crie uma conta da API do Brave Search em [https://brave.com/search/api/](https://brave.com/search/api/)
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

As configurações de busca do Brave específicas do provider agora ficam em `plugins.entries.brave.config.webSearch.*`.
O `tools.web.search.apiKey` legado ainda é carregado pelo shim de compatibilidade, mas não é mais o caminho de configuração canônico.

`webSearch.mode` controla o transporte do Brave:

- `web` (padrão): busca web normal do Brave com títulos, URLs e trechos
- `llm-context`: API LLM Context do Brave com blocos de texto pré-extraídos e fontes para grounding

## Parâmetros da ferramenta

| Parâmetro     | Descrição                                                           |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Consulta de busca (obrigatório)                                     |
| `count`       | Número de resultados a retornar (1-10, padrão: 5)                   |
| `country`     | Código de país ISO de 2 letras (por exemplo, `"US"`, `"DE"`)        |
| `language`    | Código de idioma ISO 639-1 para resultados da busca (por exemplo, `"en"`, `"de"`, `"fr"`) |
| `search_lang` | Código de idioma de busca do Brave (por exemplo, `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Código de idioma ISO para elementos da interface                    |
| `freshness`   | Filtro de tempo: `day` (24h), `week`, `month` ou `year`             |
| `date_after`  | Apenas resultados publicados após esta data (AAAA-MM-DD)            |
| `date_before` | Apenas resultados publicados antes desta data (AAAA-MM-DD)          |

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
- Cada plano do Brave inclui **US$5/mês em crédito gratuito** (renovável). O plano Search custa US$5 por 1.000 requisições, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no painel do Brave para evitar cobranças inesperadas. Consulte o [portal da API do Brave](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos requer um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- O modo `llm-context` retorna entradas de fonte com grounding em vez do formato normal de trechos de busca web.
- O modo `llm-context` não oferece suporte a `ui_lang`, `freshness`, `date_after` nem `date_before`.
- `ui_lang` deve incluir uma subtags de região como `en-US`.
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

Consulte [Ferramentas web](/pt-BR/tools/web) para a configuração completa de `web_search`.

## Relacionado

- [Busca do Brave](/pt-BR/tools/brave-search)
