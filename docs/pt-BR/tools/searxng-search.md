---
read_when:
    - Você quer um provedor de pesquisa na web auto-hospedado
    - Você quer usar SearXNG para web_search
    - Você precisa de uma opção de busca com foco em privacidade ou isolada da rede
summary: Busca na web do SearXNG -- provedor de metabusca auto-hospedado e sem chave
title: Pesquisa SearXNG
x-i18n:
    generated_at: "2026-05-02T21:06:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw oferece suporte ao [SearXNG](https://docs.searxng.org/) como um provedor `web_search` **auto-hospedado e
sem chave**. SearXNG é um mecanismo de metabusca de código aberto
que agrega resultados do Google, Bing, DuckDuckGo e outras fontes.

Vantagens:

- **Gratuito e ilimitado** -- não requer chave de API nem assinatura comercial
- **Privacidade / isolamento de rede** -- as consultas nunca saem da sua rede
- **Funciona em qualquer lugar** -- sem restrições regionais em APIs de busca comerciais

## Configuração

<Steps>
  <Step title="Execute uma instância do SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou use qualquer implantação existente do SearXNG à qual você tenha acesso. Consulte a
    [documentação do SearXNG](https://docs.searxng.org/) para configuração de produção.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
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

Configurações no nível do Plugin para a instância do SearXNG:

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
- `http://` só é aceito para hosts confiáveis em rede privada ou loopback
- hosts SearXNG públicos devem usar `https://`
- hosts privados/internos usam a proteção de rede auto-hospedada; hosts públicos
  `https://` permanecem na proteção rigorosa de busca na web e não podem redirecionar para
  endereços privados

## Variável de ambiente

Defina `SEARXNG_BASE_URL` como alternativa à configuração:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` está definida e nenhum provedor explícito está configurado, a detecção automática
seleciona o SearXNG automaticamente (na prioridade mais baixa -- qualquer provedor baseado em API com uma
chave vence primeiro).

## Referência de configuração do Plugin

| Campo        | Descrição                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base da sua instância do SearXNG (obrigatório)                       |
| `categories` | Categorias separadas por vírgula, como `general`, `news` ou `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` ou `fr`              |

## Observações

- **API JSON** -- usa o endpoint nativo `format=json` do SearXNG, não raspagem de HTML
- **URLs de resultados de imagem** -- resultados da categoria de imagens incluem `img_src` quando o SearXNG
  retorna uma URL direta de imagem
- **Sem chave de API** -- funciona imediatamente com qualquer instância do SearXNG
- **Validação da URL base** -- `baseUrl` deve ser uma URL `http://` ou `https://`
  válida; hosts públicos devem usar `https://`
- **Proteção de rede** -- endpoints SearXNG privados/internos aderem ao
  acesso de rede privada; endpoints SearXNG públicos `https://` mantêm proteção
  SSRF rigorosa
- **Ordem de detecção automática** -- SearXNG é verificado por último (ordem 200) na
  detecção automática. Provedores baseados em API com chaves configuradas são executados primeiro, depois
  DuckDuckGo (ordem 100), depois Ollama Web Search (ordem 110)
- **Auto-hospedado** -- você controla a instância, as consultas e os mecanismos de busca upstream
- **Categorias** usam `general` por padrão quando não configuradas
- **Fallback de categoria** -- se uma solicitação de categoria não `general` tiver sucesso, mas
  retornar zero resultados, OpenClaw tenta novamente a mesma consulta uma vez com `general`
  antes de retornar um conjunto de resultados vazio

<Tip>
  Para que a API JSON do SearXNG funcione, certifique-se de que sua instância do SearXNG tenha o formato `json`
  habilitado em seu `settings.yml` em `search.formats`.
</Tip>

## Relacionados

- [Visão geral da busca na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Busca DuckDuckGo](/pt-BR/tools/duckduckgo-search) -- outro fallback sem chave
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com camada gratuita
