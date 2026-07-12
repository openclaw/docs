---
read_when:
    - Você quer usar o Gemini para web_search
    - Você precisa de uma GEMINI_API_KEY ou de models.providers.google.apiKey
    - Você quer fundamentação com a Pesquisa Google
summary: Pesquisa na web do Gemini com fundamentação no Google Search
title: Pesquisa do Gemini
x-i18n:
    generated_at: "2026-07-12T15:42:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

O OpenClaw oferece suporte aos modelos Gemini com
[fundamentação do Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrada,
que retorna respostas sintetizadas por IA, fundamentadas em resultados em tempo real do Google Search e com
citações.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Acesse o [Google AI Studio](https://aistudio.google.com/apikey) e crie uma
    chave de API.
  </Step>
  <Step title="Armazenar a chave">
    Defina `GEMINI_API_KEY` no ambiente do Gateway, reutilize
    `models.providers.google.apiKey` ou configure uma chave dedicada para pesquisa na web por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcional se GEMINI_API_KEY ou models.providers.google.apiKey estiver definido
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // opcional; usa models.providers.google.baseUrl como alternativa
            model: "gemini-2.5-flash", // padrão
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Precedência de credenciais:** a pesquisa na web do Gemini usa primeiro
`plugins.entries.google.config.webSearch.apiKey`, depois `GEMINI_API_KEY`
e, em seguida, `models.providers.google.apiKey`. Para URLs base, a configuração dedicada
`plugins.entries.google.config.webSearch.baseUrl` tem precedência sobre
`models.providers.google.baseUrl`.

Em uma instalação do Gateway, coloque as chaves de ambiente em `~/.openclaw/.env`.

## Como funciona

Ao contrário dos provedores de pesquisa tradicionais, que retornam uma lista de links e trechos,
o Gemini usa a fundamentação do Google Search para produzir respostas sintetizadas por IA com
citações em linha. Os resultados incluem tanto a resposta sintetizada quanto as URLs das
fontes.

- As URLs de citação da fundamentação do Gemini são resolvidas automaticamente de URLs de
  redirecionamento do Google para URLs diretas por meio de uma solicitação HEAD pelo caminho de
  busca do OpenClaw protegido contra SSRF (seguimento de redirecionamentos, validação de http/https).
- A resolução de redirecionamentos usa padrões rigorosos contra SSRF, portanto, redirecionamentos para
  destinos privados/internos são bloqueados.

## Parâmetros compatíveis

A pesquisa do Gemini oferece suporte a `query`, `freshness`, `date_after` e `date_before`.

`count` é aceito para compatibilidade com o `web_search` compartilhado, mas a fundamentação do Gemini
ainda retorna uma resposta sintetizada com citações, em vez de uma lista com N
resultados.

`freshness` aceita `day`, `week`, `month`, `year` e os atalhos compartilhados
`pd`, `pw`, `pm` e `py`. `day`/`pd` adiciona uma instrução de recência à consulta do Gemini,
em vez de um intervalo rígido de 24 horas. `week`, `month`, `year` e intervalos explícitos
de `date_after`/`date_before` definem o
`timeRangeFilter` da fundamentação do Google Search do Gemini. `country`, `language` e `domain_filter` não são compatíveis.

## Seleção do modelo

O modelo padrão é `gemini-2.5-flash` (rápido e econômico). Qualquer modelo Gemini
compatível com fundamentação pode ser usado por meio de
`plugins.entries.google.config.webSearch.model`.

## Substituições da URL base

Defina `plugins.entries.google.config.webSearch.baseUrl` quando a pesquisa na web do Gemini
precisar ser encaminhada por um proxy do operador ou endpoint personalizado compatível com o Gemini. Se
essa opção não estiver definida, a pesquisa na web do Gemini reutilizará `models.providers.google.baseUrl`. Um valor simples
`https://generativelanguage.googleapis.com` é normalizado para
`https://generativelanguage.googleapis.com/v1beta`; caminhos de proxy personalizados são mantidos
conforme fornecidos após a remoção das barras finais.

## Relacionados

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com trechos
- [Pesquisa do Perplexity](/pt-BR/tools/perplexity-search) -- resultados estruturados + extração de conteúdo
