---
read_when:
    - Você quer usar o Gemini para `web_search`
    - Você precisa de um `GEMINI_API_KEY`
    - Você quer grounding do Google Search
summary: Pesquisa web Gemini com grounding do Google Search
title: Pesquisa Gemini
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:16:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

O OpenClaw oferece suporte a modelos Gemini com
[grounding do Google Search](https://ai.google.dev/gemini-api/docs/grounding)
integrado, que retorna respostas sintetizadas por IA com base em resultados ativos do Google Search e com
citações.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Vá para [Google AI Studio](https://aistudio.google.com/apikey) e crie uma
    chave de API.
  </Step>
  <Step title="Armazenar a chave">
    Defina `GEMINI_API_KEY` no ambiente do Gateway, ou configure via:

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
            apiKey: "AIza...", // opcional se GEMINI_API_KEY estiver definido
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

**Alternativa por ambiente:** defina `GEMINI_API_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque em `~/.openclaw/.env`.

## Como funciona

Diferentemente de providers de pesquisa tradicionais que retornam uma lista de links e trechos,
o Gemini usa grounding do Google Search para produzir respostas sintetizadas por IA com
citações inline. Os resultados incluem tanto a resposta sintetizada quanto as
URLs de origem.

- URLs de citação do grounding do Gemini são automaticamente resolvidas de URLs de redirecionamento do Google para URLs diretas.
- A resolução de redirecionamento usa o caminho de proteção SSRF (HEAD + verificações de redirecionamento +
  validação de http/https) antes de retornar a URL final da citação.
- A resolução de redirecionamento usa padrões SSRF estritos, então redirecionamentos para
  destinos privados/internos são bloqueados.

## Parâmetros compatíveis

A pesquisa Gemini oferece suporte a `query`.

`count` é aceito por compatibilidade com `web_search` compartilhado, mas o grounding do Gemini
ainda retorna uma única resposta sintetizada com citações, em vez de uma
lista com N resultados.

Filtros específicos do provider como `country`, `language`, `freshness` e
`domain_filter` não são compatíveis.

## Seleção de modelo

O modelo padrão é `gemini-2.5-flash` (rápido e com boa relação custo-benefício). Qualquer modelo Gemini
que ofereça suporte a grounding pode ser usado via
`plugins.entries.google.config.webSearch.model`.

## Relacionado

- [Visão geral de pesquisa na web](/pt-BR/tools/web) -- todos os providers e autodetecção
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com trechos
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados + extração de conteúdo
