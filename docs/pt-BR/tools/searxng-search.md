---
read_when:
    - Você quer um provedor de web search self-hosted
    - Você quer usar SearXNG para `web_search`
    - Você precisa de uma opção de busca focada em privacidade ou air-gapped
summary: SearXNG web search -- provedor de metabusca self-hosted e sem chave
title: Busca SearXNG
x-i18n:
    generated_at: "2026-04-24T06:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao [SearXNG](https://docs.searxng.org/) como provedor `web_search` **self-hosted e sem chave**. O SearXNG é um mecanismo de metabusca open source
que agrega resultados do Google, Bing, DuckDuckGo e outras fontes.

Vantagens:

- **Gratuito e ilimitado** -- nenhuma chave de API ou assinatura comercial é necessária
- **Privacidade / air-gap** -- as consultas nunca saem da sua rede
- **Funciona em qualquer lugar** -- sem restrições regionais de APIs comerciais de busca

## Configuração

<Steps>
  <Step title="Executar uma instância do SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou use qualquer implantação SearXNG existente à qual você tenha acesso. Consulte a
    [documentação do SearXNG](https://docs.searxng.org/) para configuração em produção.

  </Step>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecione "searxng" como provedor
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

Configurações em nível de Plugin para a instância SearXNG:

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

O campo `baseUrl` também aceita objetos SecretRef.

Regras de transporte:

- `https://` funciona para hosts SearXNG públicos ou privados
- `http://` é aceito apenas para hosts confiáveis em rede privada ou local loopback
- hosts SearXNG públicos devem usar `https://`

## Variável de ambiente

Defina `SEARXNG_BASE_URL` como alternativa à configuração:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` estiver definida e nenhum provedor explícito estiver configurado, a detecção automática
seleciona SearXNG automaticamente (na prioridade mais baixa -- qualquer provedor com suporte a API e uma
chave configurada vence primeiro).

## Referência de configuração do Plugin

| Campo        | Descrição                                                          |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base da sua instância SearXNG (obrigatório)                    |
| `categories` | Categorias separadas por vírgula, como `general`, `news` ou `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` ou `fr`          |

## Observações

- **API JSON** -- usa o endpoint nativo `format=json` do SearXNG, não scraping de HTML
- **Sem chave de API** -- funciona imediatamente com qualquer instância SearXNG
- **Validação da URL base** -- `baseUrl` deve ser uma URL `http://` ou `https://`
  válida; hosts públicos devem usar `https://`
- **Ordem de detecção automática** -- SearXNG é verificado por último (ordem 200) na
  detecção automática. Provedores com suporte a API e chaves configuradas são executados primeiro, depois
  DuckDuckGo (ordem 100) e depois Ollama Web Search (ordem 110)
- **Self-hosted** -- você controla a instância, as consultas e os mecanismos de busca upstream
- **Categories** usa `general` por padrão quando não configurado

<Tip>
  Para a API JSON do SearXNG funcionar, certifique-se de que sua instância SearXNG tenha o formato `json`
  ativado em `settings.yml` em `search.formats`.
</Tip>

## Relacionado

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Busca DuckDuckGo](/pt-BR/tools/duckduckgo-search) -- outro fallback sem chave
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com tier gratuita
