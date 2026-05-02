---
read_when:
    - Você quer extração da Web com suporte do Firecrawl
    - Você precisa de uma chave de API do Firecrawl
    - Você quer o Firecrawl como provedor de web_search
    - Você quer extração anti-bot para web_fetch
summary: Pesquisa, extração e alternativa de web_fetch do Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T05:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a04a9585dac65579454c5b9539a5fc1e315392c5956b9273e370406ecdbbd3e
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw pode usar **Firecrawl** de três maneiras:

- como o provedor de `web_search`
- como ferramentas explícitas de Plugin: `firecrawl_search` e `firecrawl_scrape`
- como um extrator de fallback para `web_fetch`

É um serviço hospedado de extração/pesquisa que oferece suporte a contorno de bots e cache,
o que ajuda com sites carregados em JS ou páginas que bloqueiam buscas HTTP simples.

## Obtenha uma chave de API

1. Crie uma conta Firecrawl e gere uma chave de API.
2. Armazene-a na configuração ou defina `FIRECRAWL_API_KEY` no ambiente do Gateway.

## Configure a pesquisa Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Observações:

- Escolher Firecrawl na integração inicial ou em `openclaw configure --section web` habilita automaticamente o Plugin Firecrawl incluído.
- `web_search` com Firecrawl oferece suporte a `query` e `count`.
- Para controles específicos do Firecrawl como `sources`, `categories` ou extração de resultados, use `firecrawl_search`.
- `baseUrl` usa por padrão o Firecrawl hospedado em `https://api.firecrawl.dev`. Sobrescritas auto-hospedadas são permitidas apenas para endpoints privados/internos; HTTP é aceito apenas para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback compartilhado de env para URLs base de pesquisa e extração do Firecrawl.

## Configure a extração Firecrawl + fallback de web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Observações:

- Tentativas de fallback do Firecrawl são executadas apenas quando uma chave de API está disponível (`plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla a idade máxima permitida para resultados em cache (ms). O padrão é 2 dias.
- A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- Sobrescritas de URL base/extração do Firecrawl seguem a mesma regra hospedado/privado da pesquisa: tráfego público hospedado usa `https://api.firecrawl.dev`; sobrescritas auto-hospedadas devem resolver para endpoints privados/internos.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de env de `plugins.entries.firecrawl.config.webFetch.*`.

### Firecrawl auto-hospedado

Defina `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL`
quando você executa o Firecrawl por conta própria. O OpenClaw aceita `http://` apenas para destinos de loopback,
rede privada, `.local`, `.internal` ou `.localhost`. Hosts personalizados públicos
são rejeitados para que chaves de API do Firecrawl não sejam enviadas a endpoints arbitrários por
acidente.

## Ferramentas do Plugin Firecrawl

### `firecrawl_search`

Use isto quando quiser controles de pesquisa específicos do Firecrawl em vez do `web_search` genérico.

Parâmetros principais:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use isto para páginas carregadas em JS ou protegidas contra bots em que o `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo furtivo / contorno de bots

O Firecrawl expõe um parâmetro de **modo de proxy** para contorno de bots (`basic`, `stealth` ou `auto`).
O OpenClaw sempre usa `proxy: "auto"` mais `storeInCache: true` para solicitações Firecrawl.
Se proxy for omitido, o Firecrawl usa `auto` por padrão. `auto` tenta novamente com proxies furtivos se uma tentativa básica falhar, o que pode usar mais créditos
do que extração somente básica.

## Como `web_fetch` usa Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Firecrawl (se selecionado ou detectado automaticamente como o fallback ativo de web-fetch)
3. Limpeza básica de HTML (último fallback)

O seletor é `tools.web.fetch.provider`. Se você o omitir, o OpenClaw
detecta automaticamente o primeiro provedor de web-fetch pronto a partir das credenciais disponíveis.
Hoje, o provedor incluído é Firecrawl.

## Relacionado

- [Visão geral da Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Web Fetch](/pt-BR/tools/web-fetch) -- ferramenta web_fetch com fallback Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa + extração
