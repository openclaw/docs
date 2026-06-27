---
read_when:
    - Você quer usar Grok para web_search
    - Você quer usar OAuth da xAI ou uma XAI_API_KEY para pesquisa na web
summary: Pesquisa na web do Grok via respostas da xAI fundamentadas na web
title: Pesquisa do Grok
x-i18n:
    generated_at: "2026-06-27T18:16:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw oferece suporte ao Grok como provedor de `web_search`, usando respostas do xAI fundamentadas na web para produzir respostas sintetizadas por IA apoiadas por resultados de pesquisa ao vivo com citações.

A pesquisa na web do Grok prefere seu login OAuth existente do xAI quando ele está disponível. Se não houver perfil OAuth, a mesma chave de API do xAI também pode alimentar a ferramenta integrada `x_search` para pesquisa de publicações no X (antigo Twitter) e a ferramenta `code_execution`. Se você armazenar a chave em `plugins.entries.xai.config.webSearch.apiKey`, o OpenClaw também a reutiliza como alternativa para o provedor de modelos xAI incluído.

Para métricas no nível da publicação do X, como republicações, respostas, favoritos ou visualizações, prefira `x_search` com a URL exata da publicação ou o ID de status em vez de uma consulta de pesquisa ampla.

## Integração inicial e configuração

Se você escolher **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

O OpenClaw pode usar um perfil OAuth existente do xAI sem solicitar uma chave separada de pesquisa na web. Se OAuth não estiver disponível, ele recorre à configuração por chave de API do xAI. O OpenClaw também pode mostrar uma etapa complementar separada para habilitar `x_search` com a mesma credencial do xAI. Essa etapa complementar:

- só aparece depois que você escolhe Grok para `web_search`
- não é uma opção separada de provedor de pesquisa na web de nível superior
- pode opcionalmente definir o modelo de `x_search` durante o mesmo fluxo

Se você a ignorar, poderá habilitar ou alterar `x_search` posteriormente na configuração.

## Faça login ou obtenha uma chave de API

<Steps>
  <Step title="Use o OAuth do xAI">
    Se você já fez login com o xAI durante a integração inicial ou autenticação de modelo, escolha Grok como o provedor de `web_search`. Nenhuma chave de API separada é necessária:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use uma chave de API alternativa">
    Obtenha uma chave de API da [xAI](https://console.x.ai/) quando OAuth não estiver disponível ou quando você intencionalmente quiser uma configuração de pesquisa na web baseada em chave.
  </Step>
  <Step title="Armazene a chave">
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Alternativas de credencial:** faça login com `openclaw models auth login
--provider xai --method oauth`, defina `XAI_API_KEY` no ambiente do Gateway ou armazene `plugins.entries.xai.config.webSearch.apiKey`. Para uma instalação de gateway, coloque variáveis de ambiente em `~/.openclaw/.env`.

## Como funciona

O Grok usa respostas do xAI fundamentadas na web para sintetizar respostas com citações embutidas, de forma semelhante à abordagem de fundamentação da Pesquisa Google do Gemini.

## Parâmetros compatíveis

A pesquisa do Grok oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada de `web_search`, mas o Grok ainda retorna uma resposta sintetizada com citações, em vez de uma lista com N resultados.

Filtros específicos do provedor não são compatíveis no momento.

O Grok usa um tempo limite padrão específico do provedor de 60 segundos porque pesquisas fundamentadas na web com a API Responses do xAI podem levar mais tempo do que o padrão compartilhado de `web_search`. Defina `tools.web.search.timeoutSeconds` para substituí-lo.

## Substituições da URL base

Defina `plugins.entries.xai.config.webSearch.baseUrl` quando a pesquisa na web do Grok precisar ser roteada por um proxy de operador ou endpoint compatível com Responses do xAI. O OpenClaw faz publicações em `<baseUrl>/responses` depois de remover barras finais. `x_search` usa a mesma alternativa `webSearch.baseUrl`, a menos que `plugins.entries.xai.config.xSearch.baseUrl` esteja definido.

## Relacionados

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [x_search em Web Search](/pt-BR/tools/web#x_search) -- pesquisa de X de primeira classe via xAI
- [Pesquisa do Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via fundamentação do Google
