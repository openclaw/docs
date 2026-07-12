---
read_when:
    - Você quer usar o Brave Search para web_search
    - Você precisa de uma BRAVE_API_KEY ou dos detalhes do plano
summary: Configuração da API do Brave Search para web_search
title: Pesquisa do Brave
x-i18n:
    generated_at: "2026-07-12T00:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw oferece suporte à API Brave Search como provedor de `web_search`.

## Obter uma chave de API

1. Crie uma conta da API Brave Search em [https://brave.com/search/api/](https://brave.com/search/api/)
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
            baseUrl: "https://api.search.brave.com", // substituição opcional da URL base/do proxy
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

As configurações de pesquisa específicas do provedor Brave ficam em `plugins.entries.brave.config.webSearch.*`; esse é o caminho de configuração canônico. Um `tools.web.search.apiKey` compartilhado no nível superior e um `tools.web.search.brave.*` com escopo ainda são carregados por meio de uma mesclagem de compatibilidade, mas novas configurações devem usar o caminho com escopo do plugin mostrado acima.

`webSearch.mode` controla o transporte do Brave:

- `web` (padrão): pesquisa normal na web do Brave, com títulos, URLs e trechos
- `llm-context`: API Brave LLM Context, com blocos de texto pré-extraídos e fontes para fundamentação

`webSearch.baseUrl` pode direcionar as solicitações do Brave a um proxy
ou gateway confiável e compatível com o Brave. O OpenClaw acrescenta `/res/v1/web/search` ou `/res/v1/llm/context` à
URL base configurada e mantém a URL base na chave de cache. Endpoints
públicos devem usar `https://`; `http://` é aceito somente para hosts de proxy
confiáveis em local loopback ou em rede privada.

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
Código de idioma ISO 639-1 para os resultados da pesquisa (por exemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de pesquisa do Brave (por exemplo, `en`, `en-gb`, `zh-hans`).
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
```

## Observações

- O OpenClaw usa o plano **Search** do Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continuará válida, mas não incluirá recursos mais recentes, como LLM Context ou limites de taxa mais altos.
- Cada plano do Brave inclui **\$5/mês em créditos gratuitos** (renovados mensalmente). O plano Search custa \$5 por 1.000 solicitações, portanto o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no painel do Brave para evitar cobranças inesperadas. Consulte o [portal da API do Brave](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. O armazenamento de resultados para treinar ou ajustar modelos requer um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- O modo `llm-context` retorna entradas de fontes fundamentadas em vez do formato normal de trechos da pesquisa na web.
- O modo `llm-context` aceita `freshness` e intervalos limitados de `date_after` + `date_before`. Ele não aceita `ui_lang`; `date_before` sem `date_after` é rejeitado porque o Brave exige que intervalos de atualidade personalizados incluam as datas inicial e final.
- `ui_lang` deve incluir uma subtag de região, como `en-US`.
- Por padrão, os resultados permanecem em cache por 15 minutos (configurável por meio de `cacheTtlMinutes`).
- Valores personalizados de `webSearch.baseUrl` são incluídos na identidade do cache do Brave, para que
  respostas específicas do proxy não entrem em conflito.
- Ative a opção de diagnóstico `brave.http` para registrar URLs/parâmetros de consulta das solicitações do Brave, status/tempo das respostas e eventos de acerto/erro/gravação do cache de pesquisa durante a solução de problemas. A opção nunca registra a chave de API nem os corpos das respostas, mas as consultas de pesquisa podem conter dados sensíveis.

## Conteúdo relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Pesquisa do Perplexity](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
- [Pesquisa do Exa](/pt-BR/tools/exa-search) -- pesquisa neural com extração de conteúdo
