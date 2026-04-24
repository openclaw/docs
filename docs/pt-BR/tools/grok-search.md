---
read_when:
    - Você quer usar o Grok para `web_search`
    - Você precisa de uma `XAI_API_KEY` para pesquisa na web
summary: Pesquisa web do Grok via respostas fundamentadas na web do xAI
title: Pesquisa do Grok
x-i18n:
    generated_at: "2026-04-24T06:16:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao Grok como provider de `web_search`, usando respostas do xAI fundamentadas na web
para produzir respostas sintetizadas por IA com base em resultados de busca ao vivo
com citações.

A mesma `XAI_API_KEY` também pode alimentar a ferramenta integrada `x_search` para pesquisa de posts no X
(antigo Twitter). Se você armazenar a chave em
`plugins.entries.xai.config.webSearch.apiKey`, o OpenClaw agora a reutiliza como
fallback também para o provider de modelo xAI incluído.

Para métricas em nível de post no X, como reposts, replies, bookmarks ou views, prefira
`x_search` com a URL exata do post ou o ID do status, em vez de uma consulta de pesquisa ampla.

## Onboarding e configuração

Se você escolher **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

O OpenClaw pode mostrar uma etapa de acompanhamento separada para habilitar `x_search` com a mesma
`XAI_API_KEY`. Esse acompanhamento:

- aparece somente depois que você escolhe Grok para `web_search`
- não é uma escolha separada de provider de pesquisa web de nível superior
- pode opcionalmente definir o modelo `x_search` no mesmo fluxo

Se você ignorá-lo, poderá habilitar ou alterar `x_search` depois na configuração.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Obtenha uma chave de API em [xAI](https://console.x.ai/).
  </Step>
  <Step title="Armazenar a chave">
    Defina `XAI_API_KEY` no ambiente do Gateway, ou configure por:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opcional se XAI_API_KEY estiver definida
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `XAI_API_KEY` no ambiente do Gateway.
Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

## Como funciona

O Grok usa respostas do xAI fundamentadas na web para sintetizar respostas com
citações inline, de forma semelhante à abordagem de grounding com Google Search do Gemini.

## Parâmetros compatíveis

A pesquisa do Grok oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada de `web_search`, mas o Grok ainda
retorna uma única resposta sintetizada com citações, em vez de uma lista com N resultados.

Filtros específicos do provider não são compatíveis no momento.

## Relacionado

- [Visão geral de pesquisa na web](/pt-BR/tools/web) -- todos os providers e detecção automática
- [x_search em Pesquisa na Web](/pt-BR/tools/web#x_search) -- pesquisa de primeira classe no X via xAI
- [Pesquisa Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via grounding do Google
