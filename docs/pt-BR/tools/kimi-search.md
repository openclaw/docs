---
read_when:
    - Você quer usar o Kimi para `web_search`
    - Você precisa de uma `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
summary: Busca web do Kimi via busca web Moonshot
title: Busca Kimi
x-i18n:
    generated_at: "2026-04-24T06:17:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao Kimi como provider de `web_search`, usando a busca web Moonshot
para produzir respostas sintetizadas por IA com citações.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Obtenha uma chave de API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Armazenar a chave">
    Defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway, ou
    configure via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode perguntar:

- a região da API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- o modelo padrão de busca web Kimi (o padrão é `kimi-k2.6`)

## Configuração

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcional se KIMI_API_KEY ou MOONSHOT_API_KEY estiver definido
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Se você usar o host da API da China para chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), o OpenClaw reutiliza esse mesmo host para
`web_search` do Kimi quando `tools.web.search.kimi.baseUrl` é omitido, de modo que chaves de
[platform.moonshot.cn](https://platform.moonshot.cn/) não atinjam o
endpoint internacional por engano (que geralmente retorna HTTP 401). Substitua
com `tools.web.search.kimi.baseUrl` quando precisar de uma base URL de busca diferente.

**Alternativa via ambiente:** defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no
ambiente do Gateway. Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

Se você omitir `baseUrl`, o OpenClaw usa por padrão `https://api.moonshot.ai/v1`.
Se você omitir `model`, o OpenClaw usa por padrão `kimi-k2.6`.

## Como funciona

O Kimi usa a busca web Moonshot para sintetizar respostas com citações inline,
de forma semelhante à abordagem de resposta com grounding do Gemini e do Grok.

## Parâmetros compatíveis

A busca Kimi oferece suporte a `query`.

`count` é aceito por compatibilidade compartilhada com `web_search`, mas o Kimi ainda
retorna uma resposta sintetizada com citações, em vez de uma lista com N resultados.

Filtros específicos do provider não são compatíveis no momento.

## Relacionado

- [Visão geral do Web Search](/pt-BR/tools/web) -- todos os providers e detecção automática
- [Moonshot AI](/pt-BR/providers/moonshot) -- documentação do provider de modelos Moonshot + Kimi Coding
- [Busca Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via grounding do Google
- [Busca Grok](/pt-BR/tools/grok-search) -- respostas sintetizadas por IA via grounding da xAI
