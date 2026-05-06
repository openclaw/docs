---
read_when:
    - Você quer usar o Brave Search para web_search
    - Você precisa de uma BRAVE_API_KEY ou dos detalhes do plano
summary: Configuração da API Brave Search para web_search
title: Pesquisa do Brave
x-i18n:
    generated_at: "2026-05-06T09:14:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw oferece suporte à Brave Search API como provedor `web_search`.

## Obtenha uma chave de API

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

As configurações de pesquisa específicas da Brave agora ficam em `plugins.entries.brave.config.webSearch.*`.
O `tools.web.search.apiKey` legado ainda é carregado pelo shim de compatibilidade, mas não é mais o caminho de configuração canônico.

`webSearch.mode` controla o transporte da Brave:

- `web` (padrão): pesquisa web normal da Brave com títulos, URLs e trechos
- `llm-context`: Brave LLM Context API com blocos de texto pré-extraídos e fontes para fundamentação

`webSearch.baseUrl` pode apontar solicitações da Brave para um proxy compatível com a Brave confiável
ou Gateway. O OpenClaw acrescenta `/res/v1/web/search` ou `/res/v1/llm/context` à
URL base configurada e mantém a URL base na chave de cache. Endpoints públicos
devem usar `https://`; `http://` é aceito apenas para hosts de proxy confiáveis de loopback
ou de rede privada.

## Parâmetros da ferramenta

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
Código de idioma ISO 639-1 para os resultados da pesquisa (por exemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de pesquisa da Brave (por exemplo, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código de idioma ISO para elementos da interface.
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

- O OpenClaw usa o plano **Search** da Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais recentes como LLM Context ou limites de taxa mais altos.
- Cada plano da Brave inclui **\$5/mês em crédito gratuito** (renovável). O plano Search custa \$5 por 1.000 solicitações, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no painel da Brave para evitar cobranças inesperadas. Consulte o [portal da Brave API](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos exige um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) da Brave.
- O modo `llm-context` retorna entradas de fontes fundamentadas em vez do formato normal de trechos da pesquisa web.
- O modo `llm-context` oferece suporte a `freshness` e intervalos delimitados de `date_after` + `date_before`. Ele não oferece suporte a `ui_lang`; `date_before` sem `date_after` é rejeitado porque a Brave exige que intervalos personalizados de atualização incluam as datas inicial e final.
- `ui_lang` deve incluir uma subtag de região como `en-US`.
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).
- Valores personalizados de `webSearch.baseUrl` são incluídos na identidade de cache da Brave, portanto
  respostas específicas de proxy não colidem.
- Habilite a flag de diagnóstico `brave.http` para registrar URLs/parâmetros de consulta de solicitações da Brave, status/tempo de resposta e eventos de acerto/erro/gravação do cache de pesquisa durante a solução de problemas. A flag nunca registra a chave de API nem os corpos das respostas, mas consultas de pesquisa podem ser sensíveis.

## Relacionados

- [Visão geral da pesquisa web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Pesquisa Perplexity](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
- [Pesquisa Exa](/pt-BR/tools/exa-search) -- pesquisa neural com extração de conteúdo
