---
read_when:
    - Você quer extração da web com o Firecrawl como backend
    - Você quer o web_fetch do Firecrawl sem chave
    - Você precisa de uma chave de API do Firecrawl para realizar pesquisas ou obter limites maiores
    - Você quer o Firecrawl como provedor de web_search
    - Você quer extração com proteção antibot para `web_fetch`
summary: Pesquisa, extração e fallback de web_fetch do Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T15:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

O OpenClaw pode usar o **Firecrawl** de três maneiras:

- como provedor de `web_search`
- como ferramentas explícitas do plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

É um serviço hospedado de extração/pesquisa que oferece contorno de bloqueios contra bots e cache, o que ajuda com sites que dependem muito de JS ou páginas que bloqueiam buscas HTTP simples.

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sem chave e chaves de API

O fallback hospedado do Firecrawl para `web_fetch`, quando selecionado explicitamente, oferece acesso inicial sem uma chave de API. Adicione `FIRECRAWL_API_KEY` ao ambiente do Gateway ou configure-a quando precisar de limites maiores. O `web_search` e o `firecrawl_scrape` do Firecrawl exigem uma chave de API.

## Configurar a pesquisa do Firecrawl

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

- Escolher o Firecrawl durante a integração inicial ou em `openclaw configure --section web` ativa automaticamente o plugin instalado do Firecrawl.
- O `web_search` com o Firecrawl oferece suporte a `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou coleta dos resultados, use `firecrawl_search`.
- Por padrão, `baseUrl` usa o Firecrawl hospedado em `https://api.firecrawl.dev`. Substituições auto-hospedadas são permitidas apenas para endpoints privados/internos; HTTP é aceito somente para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback de ambiente compartilhado para os URLs base de pesquisa e coleta do Firecrawl.
- Por padrão, as solicitações de pesquisa do Firecrawl têm um tempo limite de 30 segundos; o parâmetro `timeoutSeconds` de `firecrawl_search` o substitui em cada chamada.

## Configurar o fallback do Firecrawl para web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // a seleção explícita ativa o fallback sem chave
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- O fallback do Firecrawl para `web_fetch`, quando selecionado explicitamente, funciona sem uma chave de API. Quando configurado, o OpenClaw envia `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` para obter limites maiores.
- Escolher o Firecrawl durante a integração inicial ou em `openclaw configure --section web` ativa o plugin e seleciona o Firecrawl para `web_fetch`, a menos que outro provedor de busca já esteja configurado.
- `firecrawl_scrape` exige uma chave de API.
- `maxAgeMs` controla a idade máxima dos resultados armazenados em cache (ms). O padrão é 172.800.000 ms (2 dias).
- O padrão de `onlyMainContent` é `true`; o padrão de `timeoutSeconds` é 60.
- As configurações legadas `tools.web.fetch.firecrawl.*` e `tools.web.search.firecrawl.*` são migradas automaticamente por `openclaw doctor --fix`.
- As substituições de coleta/URL base do Firecrawl seguem a mesma regra de hospedado/privado da pesquisa: o tráfego público hospedado usa `https://api.firecrawl.dev`; substituições auto-hospedadas devem ser resolvidas para endpoints privados/internos.
- `firecrawl_scrape` rejeita URLs de destino obviamente privados, de loopback, de metadados e que não sejam HTTP(S) antes de encaminhá-los ao Firecrawl, seguindo o contrato de segurança de destino de `web_fetch` para chamadas explícitas de coleta do Firecrawl.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente de `plugins.entries.firecrawl.config.webFetch.*`, incluindo a chave de API obrigatória.

### Firecrawl auto-hospedado

Defina `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` quando você mesmo executar o Firecrawl. O OpenClaw aceita `http://` apenas para destinos de loopback, de rede privada, `.local`, `.internal` ou `.localhost`. Hosts públicos personalizados são rejeitados para evitar que as chaves de API do Firecrawl sejam enviadas acidentalmente a endpoints arbitrários.

## Ferramentas do plugin Firecrawl

### `firecrawl_search`

Use esta ferramenta quando quiser controles de pesquisa específicos do Firecrawl em vez do `web_search` genérico.

Parâmetros:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use esta ferramenta para páginas que dependem muito de JS ou são protegidas contra bots, nas quais o `web_fetch` simples é insuficiente.

Parâmetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo furtivo / contorno de bloqueios contra bots

Por padrão, `firecrawl_scrape` e o fallback do Firecrawl para `web_fetch` usam `proxy: "auto"` junto com `storeInCache: true`, a menos que o chamador substitua esses parâmetros. `firecrawl_search` e o provedor Firecrawl de `web_search` não têm controles de `proxy`/`storeInCache`; o modo de proxy furtivo se aplica apenas a solicitações de coleta/busca.

O modo `proxy` do Firecrawl controla o contorno de bloqueios contra bots (`basic`, `stealth` ou `auto`). `auto` tenta novamente com proxies furtivos se uma tentativa básica falhar, o que pode usar mais créditos do que a coleta somente no modo básico.

## Como o `web_fetch` usa o Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Provedor de busca configurado, como o Firecrawl (quando selecionado ou detectado automaticamente com base nas credenciais configuradas)
3. Limpeza básica de HTML (último fallback)

O controle de seleção é `tools.web.fetch.provider`. Se você o omitir, o OpenClaw detectará automaticamente o primeiro provedor de busca para a web pronto para uso com base nas credenciais disponíveis. O plugin oficial do Firecrawl fornece esse fallback.

## Relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e a detecção automática
- [Busca na web](/pt-BR/tools/web-fetch) -- ferramenta web_fetch com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa + extração
