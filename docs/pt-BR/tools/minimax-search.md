---
read_when:
    - Você quer usar o MiniMax para `web_search`
    - Você precisa de uma chave do MiniMax Coding Plan
    - Você quer orientação sobre o host de busca CN/global do MiniMax
summary: MiniMax Search via a API de busca do Coding Plan
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-24T06:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao MiniMax como provedor `web_search` por meio da
API de busca do MiniMax Coding Plan. Ela retorna resultados de busca estruturados com títulos, URLs,
snippets e consultas relacionadas.

## Obter uma chave do Coding Plan

<Steps>
  <Step title="Criar uma chave">
    Crie ou copie uma chave do MiniMax Coding Plan em
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Armazenar a chave">
    Defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

O OpenClaw também aceita `MINIMAX_CODING_API_KEY` como alias de env. `MINIMAX_API_KEY`
ainda é lida como fallback de compatibilidade quando já aponta para um token de coding-plan.

## Configuração

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcional se MINIMAX_CODE_PLAN_KEY estiver definido
            region: "global", // ou "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway.
Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

## Seleção de região

O MiniMax Search usa estes endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` não estiver definido, o OpenClaw resolve
a região nesta ordem:

1. `tools.web.search.minimax.region` / `webSearch.region` de propriedade do plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Isso significa que onboarding CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
mantêm automaticamente o MiniMax Search também no host CN.

Mesmo quando você autentica o MiniMax pelo caminho OAuth `minimax-portal`,
a web search ainda é registrada como provider id `minimax`; a base URL do provedor OAuth
é usada apenas como dica de região para seleção de host CN/global.

## Parâmetros compatíveis

O MiniMax Search oferece suporte a:

- `query`
- `count` (o OpenClaw ajusta a lista de resultados retornada para a contagem solicitada)

Filtros específicos do provedor não são compatíveis no momento.

## Relacionados

- [Web Search overview](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [MiniMax](/pt-BR/providers/minimax) -- configuração de modelo, imagem, fala e autenticação
