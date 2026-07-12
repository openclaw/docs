---
read_when:
    - Você quer usar o Grok para web_search
    - Você quer usar o OAuth da xAI ou uma XAI_API_KEY para pesquisa na web
summary: Pesquisa na web do Grok por meio de respostas da xAI fundamentadas na web
title: Pesquisa do Grok
x-i18n:
    generated_at: "2026-07-12T00:28:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

O OpenClaw oferece suporte ao Grok como provedor de `web_search`, usando respostas da xAI fundamentadas na web para produzir respostas sintetizadas por IA, apoiadas por resultados de pesquisa em tempo real com citações.

A pesquisa na web do Grok prioriza um login OAuth existente da xAI quando disponível. Se não houver um perfil OAuth, a mesma chave de API da xAI também alimentará a ferramenta integrada `x_search` para pesquisar publicações no X (antigo Twitter) e a ferramenta `code_execution`. Armazenar a chave em `plugins.entries.xai.config.webSearch.apiKey` também permite que o OpenClaw a reutilize como alternativa para o provedor de modelos xAI incluído.

Para métricas de publicações específicas do X (republicações, respostas, favoritos, visualizações), use [`x_search`](/pt-BR/tools/web#x_search) com a URL exata da publicação ou o ID de status, em vez de uma consulta de pesquisa ampla.

## Integração inicial e configuração

Escolher **Grok** durante `openclaw onboard` ou `openclaw configure --section
web` permite que o OpenClaw reutilize um perfil OAuth existente da xAI sem solicitar uma chave separada para pesquisa na web. Sem OAuth, ele recorre à configuração de uma chave de API da xAI.

Em seguida, o OpenClaw oferece uma etapa adicional para habilitar `x_search` com a mesma credencial da xAI. Essa etapa adicional:

- só aparece depois que você escolhe o Grok para `web_search`
- não é uma opção separada de provedor de pesquisa na web de nível superior
- pode, opcionalmente, definir o modelo de `x_search` no mesmo fluxo

Ignore-a para habilitar ou alterar `x_search` posteriormente na configuração.

## Entre ou obtenha uma chave de API

<Steps>
  <Step title="Usar o OAuth da xAI">
    Se você já entrou com a xAI durante a integração inicial ou a autenticação do modelo, escolha o Grok como provedor de `web_search`. Nenhuma chave de API separada é necessária:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Usar uma chave de API como alternativa">
    Obtenha uma chave de API da [xAI](https://console.x.ai/) quando o OAuth não estiver disponível ou quando você quiser intencionalmente uma configuração de pesquisa na web baseada em chave.
  </Step>
  <Step title="Armazenar a chave">
    Defina `XAI_API_KEY` no ambiente do Gateway ou configure por meio de:

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
            apiKey: "xai-...", // opcional se o OAuth da xAI ou XAI_API_KEY estiver disponível
            baseUrl: "https://api.x.ai/v1", // substituição opcional do proxy/URL base da API Responses
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

**Alternativas de credencial:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` no ambiente do Gateway ou `plugins.entries.xai.config.webSearch.apiKey`. Para uma instalação do Gateway, coloque as variáveis de ambiente em `~/.openclaw/.env`.

## Como funciona

O Grok usa respostas da xAI fundamentadas na web para sintetizar respostas com citações em linha, de modo semelhante à abordagem de fundamentação da Pesquisa Google usada pelo Gemini.

## Parâmetros compatíveis

A pesquisa do Grok oferece suporte a `query`. `count` é aceito para compatibilidade com o `web_search` compartilhado, mas o Grok sempre retorna uma única resposta sintetizada com citações, em vez de uma lista com N resultados. Filtros específicos do provedor não são compatíveis.

O Grok usa por padrão um tempo limite de 60 segundos, pois as pesquisas fundamentadas na web da API Responses da xAI podem demorar mais do que o padrão compartilhado de `web_search`. Substitua-o com `tools.web.search.timeoutSeconds`.

## Substituições da URL base

Defina `plugins.entries.xai.config.webSearch.baseUrl` para encaminhar a pesquisa na web do Grok por um proxy do operador ou um endpoint Responses compatível com a xAI. O OpenClaw envia solicitações para `<baseUrl>/responses` após remover as barras finais. `x_search` recorre ao mesmo `webSearch.baseUrl`, a menos que `plugins.entries.xai.config.xSearch.baseUrl` esteja definido.

## Relacionados

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e a detecção automática
- [x_search na pesquisa na web](/pt-BR/tools/web#x_search) -- pesquisa de primeira classe no X via xAI
- [Pesquisa do Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA por meio da fundamentação do Google
