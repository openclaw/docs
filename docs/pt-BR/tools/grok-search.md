---
read_when:
    - Você quer usar o Grok para web_search
    - Você precisa de uma XAI_API_KEY para a pesquisa na web
summary: Pesquisa na web do Grok por meio de respostas fundamentadas na web da xAI
title: Busca do Grok
x-i18n:
    generated_at: "2026-05-02T05:57:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

O OpenClaw oferece suporte ao Grok como provedor de `web_search`, usando
respostas fundamentadas na web da xAI para produzir respostas sintetizadas por
IA com base em resultados de busca ao vivo e citações.

A mesma `XAI_API_KEY` também pode alimentar a ferramenta integrada `x_search`
para busca de publicações no X (antigo Twitter). Se você armazenar a chave em
`plugins.entries.xai.config.webSearch.apiKey`, o OpenClaw agora a reutiliza como
fallback também para o provedor de modelo xAI incluído.

Para métricas em nível de publicação do X, como republicações, respostas,
favoritos ou visualizações, prefira `x_search` com a URL exata da publicação ou
ID de status em vez de uma consulta de busca ampla.

## Onboarding e configuração

Se você escolher **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

O OpenClaw pode mostrar uma etapa de acompanhamento separada para habilitar
`x_search` com a mesma `XAI_API_KEY`. Esse acompanhamento:

- aparece somente depois que você escolhe Grok para `web_search`
- não é uma opção separada de provedor de busca na web no nível superior
- pode opcionalmente definir o modelo de `x_search` durante o mesmo fluxo

Se você pular essa etapa, poderá habilitar ou alterar `x_search` depois na
configuração.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Obtenha uma chave de API em [xAI](https://console.x.ai/).
  </Step>
  <Step title="Armazenar a chave">
    Defina `XAI_API_KEY` no ambiente do Gateway ou configure via:

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**Alternativa de ambiente:** defina `XAI_API_KEY` no ambiente do Gateway.
Para uma instalação do Gateway, coloque-a em `~/.openclaw/.env`.

## Como funciona

O Grok usa respostas fundamentadas na web da xAI para sintetizar respostas com
citações inline, de forma semelhante à abordagem de fundamentação com Google
Search do Gemini.

## Parâmetros compatíveis

A busca do Grok oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada de `web_search`, mas o Grok
ainda retorna uma resposta sintetizada com citações em vez de uma lista com N
resultados.

Filtros específicos do provedor não são compatíveis no momento.

O Grok usa um timeout padrão específico do provedor de 60 segundos porque buscas
fundamentadas na web com xAI Responses podem levar mais tempo que o padrão
compartilhado de `web_search`. Defina `tools.web.search.timeoutSeconds` para
sobrescrevê-lo.

## Substituições de URL base

Defina `plugins.entries.xai.config.webSearch.baseUrl` quando a busca na web do
Grok precisar ser roteada por um proxy do operador ou endpoint compatível com
xAI Responses. O OpenClaw envia a `<baseUrl>/responses` depois de remover barras
finais. `x_search` usa o mesmo fallback de `webSearch.baseUrl`, a menos que
`plugins.entries.xai.config.xSearch.baseUrl` esteja definido.

## Relacionado

- [Visão geral da busca na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [x_search na busca na web](/pt-BR/tools/web#x_search) -- busca de primeira classe no X via xAI
- [Busca do Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via fundamentação do Google
