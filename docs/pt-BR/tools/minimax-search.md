---
read_when:
    - Você quer usar o MiniMax para web_search
    - Você precisa de uma chave do MiniMax Token Plan ou de um token OAuth
    - Você quer orientações sobre o host de pesquisa CN/global do MiniMax
summary: Pesquisa MiniMax via a API de pesquisa do Token Plan
title: Busca MiniMax
x-i18n:
    generated_at: "2026-05-02T05:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw oferece suporte ao MiniMax como provedor `web_search` por meio da API de busca MiniMax Token Plan. Ela retorna resultados de busca estruturados com títulos, URLs, trechos e consultas relacionadas.

## Obter uma credencial Token Plan

<Steps>
  <Step title="Criar uma chave">
    Crie ou copie uma chave MiniMax Token Plan em
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Configurações OAuth podem reutilizar `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Armazenar a chave">
    Defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway, ou configure via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

O OpenClaw também aceita `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` e
`MINIMAX_API_KEY` como aliases de env. `MINIMAX_API_KEY` deve apontar para uma
credencial Token Plan com busca habilitada; chaves comuns da API de modelos MiniMax podem não
ser aceitas pelo endpoint de busca Token Plan.

## Configuração

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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

**Alternativa de ambiente:** defina `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` no ambiente do Gateway.
Para uma instalação de gateway, coloque em `~/.openclaw/.env`.

## Seleção de região

MiniMax Search usa estes endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` não estiver definido, o OpenClaw resolve
a região nesta ordem:

1. `tools.web.search.minimax.region` / `webSearch.region` de propriedade do plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Isso significa que a integração CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
também mantém automaticamente o MiniMax Search no host CN.

Mesmo quando você autenticou o MiniMax pelo caminho OAuth `minimax-portal`,
a busca na web ainda é registrada com o id de provedor `minimax`; a URL base do provedor OAuth
é usada como dica de região para seleção de host CN/global, e `MINIMAX_OAUTH_TOKEN`
pode satisfazer a credencial bearer do MiniMax Search.

## Parâmetros compatíveis

MiniMax Search oferece suporte a:

- `query`
- `count` (o OpenClaw reduz a lista de resultados retornada para a contagem solicitada)

Filtros específicos do provedor não são compatíveis no momento.

## Relacionado

- [Visão geral da busca na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [MiniMax](/pt-BR/providers/minimax) -- configuração de modelo, imagem, fala e autenticação
