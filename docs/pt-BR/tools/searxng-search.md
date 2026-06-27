---
read_when:
    - Você quer um provedor de pesquisa na web auto-hospedado
    - Você quer usar o SearXNG para web_search
    - Você precisa de uma opção de busca com foco em privacidade ou isolada da rede
summary: Busca web SearXNG -- provedor de metabusca auto-hospedado e sem chave
title: Pesquisa SearXNG
x-i18n:
    generated_at: "2026-06-27T18:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw oferece suporte ao [SearXNG](https://docs.searxng.org/) como provedor `web_search` **auto-hospedado,
sem chave**. SearXNG é um mecanismo de metabusca de código aberto
que agrega resultados do Google, Bing, DuckDuckGo e outras fontes.

Vantagens:

- **Gratuito e ilimitado** -- nenhuma chave de API ou assinatura comercial é necessária
- **Privacidade / isolamento de rede** -- as consultas nunca saem da sua rede
- **Funciona em qualquer lugar** -- sem restrições regionais em APIs comerciais de busca

## Configuração

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Execute uma instância do SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou use qualquer implantação existente do SearXNG à qual você tenha acesso. Consulte a
    [documentação do SearXNG](https://docs.searxng.org/) para configuração em produção.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou defina a variável de ambiente e permita que a detecção automática a encontre:

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

Configurações em nível de Plugin para a instância do SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

O campo `baseUrl` também aceita objetos SecretRef.

Regras de transporte:

- `https://` funciona para hosts SearXNG públicos ou privados
- `http://` só é aceito para hosts confiáveis de rede privada ou loopback
- hosts SearXNG públicos devem usar `https://`
- hosts privados/internos usam a proteção de rede auto-hospedada; hosts públicos `https://`
  permanecem na proteção estrita de busca na web e não podem redirecionar para endereços
  privados

## Variável de ambiente

Defina `SEARXNG_BASE_URL` como alternativa à configuração:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` está definida e nenhum provedor explícito está configurado, a detecção automática
seleciona SearXNG automaticamente (na prioridade mais baixa -- qualquer provedor baseado em API com uma
chave vence primeiro).

## Referência de configuração do Plugin

| Campo        | Descrição                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base da sua instância do SearXNG (obrigatório)                       |
| `categories` | Categorias separadas por vírgula, como `general`, `news` ou `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` ou `fr`              |

## Observações

- **API JSON** -- usa o endpoint nativo `format=json` do SearXNG, não extração de HTML
- **URLs de resultados de imagem** -- resultados da categoria de imagem incluem `img_src` quando o SearXNG
  retorna uma URL direta de imagem
- **Sem chave de API** -- funciona imediatamente com qualquer instância do SearXNG
- **Validação da URL base** -- `baseUrl` deve ser uma URL `http://` ou `https://`
  válida; hosts públicos devem usar `https://`
- **Proteção de rede** -- endpoints SearXNG privados/internos optam pelo
  acesso à rede privada; endpoints SearXNG públicos `https://` mantêm proteção
  estrita contra SSRF
- **Ordem de detecção automática** -- SearXNG é verificado depois de provedores baseados em API
  com chaves configuradas (ordem 200). Provedores sem chave, como DuckDuckGo ou
  Ollama Web Search, não são selecionados automaticamente sem uma escolha explícita de provedor
- **Auto-hospedado** -- você controla a instância, as consultas e os mecanismos de busca upstream
- **Categorias** usam `general` como padrão quando não configuradas
- **Fallback de categoria** -- se uma solicitação de categoria não `general` for bem-sucedida, mas
  retornar zero resultados, o OpenClaw tenta a mesma consulta novamente uma vez com `general`
  antes de retornar um conjunto de resultados vazio

<Tip>
  Para que a API JSON do SearXNG funcione, garanta que sua instância do SearXNG tenha o formato `json`
  habilitado em seu `settings.yml` em `search.formats`.
</Tip>

## Relacionados

- [Visão geral da Busca na Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Busca DuckDuckGo](/pt-BR/tools/duckduckgo-search) -- outro provedor sem chave
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com camada gratuita
