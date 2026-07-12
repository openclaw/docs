---
read_when:
    - Você quer usar o MiniMax para web_search
    - Você precisa de uma chave do MiniMax Token Plan ou de um token OAuth
    - Você quer orientações sobre o host de pesquisa do MiniMax na China/no mundo
summary: Pesquisa MiniMax por meio da API de pesquisa do Token Plan
title: Pesquisa do MiniMax
x-i18n:
    generated_at: "2026-07-12T00:27:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

O OpenClaw oferece suporte ao MiniMax como provedor de `web_search` por meio da API de pesquisa do
Token Plan do MiniMax. Ela retorna resultados de pesquisa estruturados com títulos, URLs,
trechos e consultas relacionadas.

## Obter uma credencial do Token Plan

<Steps>
  <Step title="Criar uma chave">
    Crie ou copie uma chave do MiniMax Token Plan na
    [Plataforma MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Configurações OAuth podem reutilizar `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Armazenar a chave">
    Defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

O OpenClaw também aceita `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` e
`MINIMAX_API_KEY` como aliases de variáveis de ambiente, verificados nessa ordem após
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` deve apontar para uma credencial
do Token Plan com pesquisa habilitada; chaves comuns da API de modelos do MiniMax podem não ser aceitas pelo
endpoint de pesquisa do Token Plan.

## Configuração

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcional se uma variável de ambiente do MiniMax Token Plan estiver definida
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

**Alternativa por variável de ambiente:** defina `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` no ambiente do Gateway.
Para uma instalação do Gateway, coloque-a em `~/.openclaw/.env`.

## Seleção de região

A Pesquisa MiniMax usa estes endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- China: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` não estiver definido, o OpenClaw determina
a região nesta ordem:

1. `tools.web.search.minimax.region` / `webSearch.region` pertencente ao Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Isso significa que a integração na China ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
também mantém automaticamente a Pesquisa MiniMax no host da China.

Mesmo quando você autentica o MiniMax pelo caminho OAuth `minimax-portal`,
a pesquisa na web ainda é registrada com o ID de provedor `minimax`; a URL base do provedor OAuth
é usada como indicação de região para selecionar o host da China ou global, e `MINIMAX_OAUTH_TOKEN`
pode fornecer a credencial de portador da Pesquisa MiniMax.

## Parâmetros compatíveis

| Parâmetro | Tipo    | Restrições       | Descrição                                                                       |
| --------- | ------- | ---------------- | ------------------------------------------------------------------------------- |
| `query`   | string  | obrigatório      | String da consulta de pesquisa.                                                 |
| `count`   | integer | 1–10, padrão: 5  | Número de resultados a retornar. O OpenClaw limita a lista retornada a esse tamanho. |

Filtros específicos do provedor não são compatíveis no momento.

## Conteúdo relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [MiniMax](/pt-BR/providers/minimax) -- configuração de modelos, imagens, fala e autenticação
