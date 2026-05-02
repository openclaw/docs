---
read_when:
    - Você quer extração da Web baseada no Firecrawl
    - Você precisa de uma chave de API do Firecrawl
    - Você quer usar o Firecrawl como provedor de web_search
    - Você quer extração anti-bot para web_fetch
summary: Busca, raspagem e alternativa de web_fetch do Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T21:05:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw pode usar **Firecrawl** de três maneiras:

- como o provedor `web_search`
- como ferramentas explícitas de plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

Ele é um serviço hospedado de extração/pesquisa que oferece suporte a contorno de bots e cache,
o que ajuda com sites pesados em JS ou páginas que bloqueiam buscas HTTP simples.

## Obtenha uma chave de API

1. Crie uma conta Firecrawl e gere uma chave de API.
2. Armazene-a na configuração ou defina `FIRECRAWL_API_KEY` no ambiente do gateway.

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
- Para controles específicos do Firecrawl, como `sources`, `categories` ou raspagem de resultados, use `firecrawl_search`.
- `baseUrl` usa por padrão o Firecrawl hospedado em `https://api.firecrawl.dev`. Substituições auto-hospedadas são permitidas apenas para endpoints privados/internos; HTTP é aceito apenas para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback de env compartilhado para URLs base de pesquisa e raspagem do Firecrawl.

## Configure a raspagem Firecrawl + fallback de web_fetch

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
- `maxAgeMs` controla quão antigos os resultados em cache podem ser (ms). O padrão é 2 dias.
- A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- Substituições de URL base/raspagem do Firecrawl seguem a mesma regra hospedado/privado da pesquisa: tráfego público hospedado usa `https://api.firecrawl.dev`; substituições auto-hospedadas devem resolver para endpoints privados/internos.
- `firecrawl_scrape` rejeita URLs de destino obviamente privadas, de loopback, de metadados e não HTTP(S) antes de encaminhá-las ao Firecrawl, correspondendo ao contrato de segurança de destino de `web_fetch` para chamadas explícitas de raspagem do Firecrawl.

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

Use isto para páginas pesadas em JS ou protegidas contra bots nas quais o `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Furtividade / contorno de bots

O Firecrawl expõe um parâmetro de **modo de proxy** para contorno de bots (`basic`, `stealth` ou `auto`).
O OpenClaw sempre usa `proxy: "auto"` mais `storeInCache: true` para solicitações Firecrawl.
Se proxy for omitido, o Firecrawl usa `auto` por padrão. `auto` tenta novamente com proxies furtivos se uma tentativa básica falhar, o que pode usar mais créditos
do que a raspagem somente básica.

## Como `web_fetch` usa o Firecrawl

Ordem de extração de `web_fetch`:

1. Readability (local)
2. Firecrawl (se selecionado ou detectado automaticamente como o fallback ativo de web-fetch)
3. Limpeza básica de HTML (último fallback)

O controle de seleção é `tools.web.fetch.provider`. Se você o omitir, o OpenClaw
detecta automaticamente o primeiro provedor de web-fetch pronto a partir das credenciais disponíveis.
Hoje, o provedor incluído é Firecrawl.

## Relacionado

- [Visão geral da Pesquisa Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Web Fetch](/pt-BR/tools/web-fetch) -- ferramenta web_fetch com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa + extração
