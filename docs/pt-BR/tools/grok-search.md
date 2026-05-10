---
read_when:
    - Você quer usar o Grok para web_search
    - Você precisa de uma XAI_API_KEY para busca na web
summary: Pesquisa na web do Grok por meio de respostas fundamentadas na web da xAI
title: Pesquisa do Grok
x-i18n:
    generated_at: "2026-05-10T19:52:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw oferece suporte ao Grok como provedor de `web_search`, usando respostas da xAI fundamentadas na web para produzir respostas sintetizadas por IA com base em resultados de busca em tempo real com citações.

A mesma chave de API da xAI também pode alimentar a ferramenta `x_search` integrada para busca de posts no X (anteriormente Twitter) e a ferramenta `code_execution`. Se você armazenar a chave em `plugins.entries.xai.config.webSearch.apiKey`, o OpenClaw agora a reutiliza também como fallback para o provedor de modelo xAI incluído.

Para métricas de posts individuais no X, como reposts, respostas, favoritos ou visualizações, prefira `x_search` com a URL exata do post ou o ID de status em vez de uma consulta de busca ampla.

## Onboarding e configuração

Se você escolher **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

O OpenClaw pode mostrar uma etapa complementar separada para habilitar `x_search` com a mesma `XAI_API_KEY`. Essa etapa complementar:

- só aparece depois que você escolhe Grok para `web_search`
- não é uma escolha separada de provedor de busca web de nível superior
- pode opcionalmente definir o modelo de `x_search` durante o mesmo fluxo

Se você a ignorar, poderá habilitar ou alterar `x_search` mais tarde na configuração.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Obtenha uma chave de API da [xAI](https://console.x.ai/).
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

O Grok usa respostas da xAI fundamentadas na web para sintetizar respostas com citações inline, semelhante à abordagem de fundamentação da Busca Google do Gemini.

## Parâmetros compatíveis

A busca do Grok oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada de `web_search`, mas o Grok ainda retorna uma resposta sintetizada com citações em vez de uma lista com N resultados.

Filtros específicos do provedor não são compatíveis no momento.

O Grok usa um timeout padrão específico do provedor de 60 segundos porque buscas fundamentadas na web com xAI Responses podem demorar mais que o padrão compartilhado de `web_search`. Defina `tools.web.search.timeoutSeconds` para substituí-lo.

## Substituições de URL base

Defina `plugins.entries.xai.config.webSearch.baseUrl` quando a busca web do Grok deve ser roteada por um proxy do operador ou por um endpoint Responses compatível com xAI. O OpenClaw envia posts para `<baseUrl>/responses` após remover barras finais. `x_search` usa o mesmo fallback de `webSearch.baseUrl`, a menos que `plugins.entries.xai.config.xSearch.baseUrl` esteja definido.

## Relacionado

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [x_search em Web Search](/pt-BR/tools/web#x_search) -- busca de primeira classe no X via xAI
- [Busca Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via fundamentação do Google
