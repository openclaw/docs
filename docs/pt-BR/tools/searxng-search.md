---
read_when:
    - Você quer um provedor de pesquisa na web auto-hospedado
    - Você quer usar o SearXNG para web_search
    - Você precisa de uma opção de pesquisa com foco em privacidade ou isolada da rede.
summary: Pesquisa na web com SearXNG -- provedor de metapesquisa auto-hospedado e sem chave
title: Pesquisa no SearXNG
x-i18n:
    generated_at: "2026-07-12T15:45:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw oferece suporte ao [SearXNG](https://docs.searxng.org/) como um provedor de `web_search` **auto-hospedado e
sem chave**. O SearXNG é um mecanismo de metabusca de código aberto
que agrega resultados do Google, Bing, DuckDuckGo e de outras fontes.

Vantagens:

- **Gratuito e ilimitado** -- não requer chave de API nem assinatura comercial
- **Privacidade / isolamento de rede** -- as consultas nunca saem da sua rede
- **Funciona em qualquer lugar** -- sem restrições regionais de APIs comerciais de busca

## Configuração

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Execute uma instância do SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou use qualquer implantação existente do SearXNG à qual você tenha acesso. Consulte a
    [documentação do SearXNG](https://docs.searxng.org/) para a configuração em produção.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Selecione "searxng" como o provedor
    ```

    Ou defina a variável de ambiente e deixe a detecção automática encontrá-la:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Configurações no nível do plugin para a instância do SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // opcional
            language: "en", // opcional
          },
        },
      },
    },
  },
}
```

`baseUrl` também aceita um objeto SecretRef (por exemplo, `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variável de ambiente

Defina `SEARXNG_BASE_URL` como alternativa à configuração:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ordem de resolução: a string `baseUrl` configurada, depois uma SecretRef de ambiente embutida em
`baseUrl` e, em seguida, `SEARXNG_BASE_URL`. Quando nenhum dos caminhos de configuração estiver definido e
`SEARXNG_BASE_URL` estiver presente sem um provedor escolhido explicitamente, a detecção automática
selecionará o SearXNG.

## Referência de configuração do plugin

| Campo        | Descrição                                                                     |
| ------------ | ----------------------------------------------------------------------------- |
| `baseUrl`    | URL base da sua instância do SearXNG (obrigatória)                            |
| `categories` | Categorias separadas por vírgulas, como `general`, `news` ou `science`        |
| `language`   | Código de idioma dos resultados, como `en`, `de` ou `fr`                     |

A chamada da ferramenta `web_search` também aceita `count` (1-10 resultados), `categories`
e `language` como substituições por chamada.

## Observações

- **API JSON** -- usa o endpoint nativo `format=json` do SearXNG, não a extração de HTML
- **URLs de resultados de imagens** -- os resultados da categoria de imagens incluem `img_src` quando o SearXNG
  retorna uma URL direta da imagem
- **Sem chave de API** -- funciona imediatamente com qualquer instância do SearXNG
- **Validação da URL base** -- `baseUrl` deve ser uma URL `http://` ou `https://`
  válida
- **Proteção de rede** -- URLs base `http://` devem apontar para um host privado confiável ou
  de loopback (hosts públicos devem usar `https://`); URLs base `https://` que
  sejam resolvidas para um endereço privado/interno recebem a mesma permissão de auto-hospedagem,
  enquanto URLs base `https://` que sejam resolvidas publicamente mantêm proteção rigorosa contra SSRF
- **Ordem de detecção automática** -- o SearXNG requer uma `baseUrl` configurada (ordem
  200 entre os provedores que já têm a credencial necessária). Provedores sem chave,
  como DuckDuckGo ou Ollama Web Search, nunca vencem a detecção automática
  implicitamente; eles só são ativados por uma escolha explícita de `provider`
- **Auto-hospedado** -- você controla a instância, as consultas e os mecanismos de busca upstream
- **Categorias** usam `general` como padrão quando não são configuradas
- **Fallback de categoria** -- se uma solicitação de categoria diferente de `general` for bem-sucedida, mas
  retornar zero resultados, o OpenClaw repetirá a mesma consulta uma vez com `general`
  antes de retornar um conjunto de resultados vazio
- **Cache de resultados** -- consultas idênticas (mesma consulta, contagem, categorias,
  idioma e URL base) são armazenadas em cache no processo por um TTL curto
- **Requisito de versão** -- o plugin declara `minHostVersion: >=2026.6.9`

<Tip>
  Para que a API JSON do SearXNG funcione, verifique se a sua instância do SearXNG tem o formato `json`
  habilitado no arquivo `settings.yml`, em `search.formats`.
</Tip>

## Relacionados

- [Visão geral da busca na Web](/pt-BR/tools/web) -- todos os provedores e a detecção automática
- [Busca do DuckDuckGo](/pt-BR/tools/duckduckgo-search) -- outro provedor sem chave
- [Busca do Brave](/pt-BR/tools/brave-search) -- resultados estruturados com nível gratuito
