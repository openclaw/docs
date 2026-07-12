---
read_when:
    - Você quer extração de conteúdo da web com tecnologia Firecrawl
    - Você quer usar o `web_fetch` do Firecrawl sem chave
    - Você precisa de uma chave de API do Firecrawl para realizar pesquisas ou obter limites maiores
    - Você quer o Firecrawl como provedor de web_search
    - Você quer extração com proteção contra bots para o web_fetch
summary: Busca e extração com Firecrawl e fallback de web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T00:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw pode usar o **Firecrawl** de três maneiras:

- como provedor de `web_search`
- como ferramentas explícitas do plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

Ele é um serviço hospedado de extração e pesquisa compatível com contorno de bots e cache, o que ajuda com sites que fazem uso intensivo de JS ou páginas que bloqueiam buscas HTTP simples.

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sem chave e chaves de API

O fallback hospedado do Firecrawl para `web_fetch`, quando selecionado explicitamente, oferece acesso inicial sem uma chave de API. Adicione `FIRECRAWL_API_KEY` ao ambiente do Gateway ou configure-a quando precisar de limites maiores. O `web_search` do Firecrawl e o `firecrawl_scrape` exigem uma chave de API.

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

- Escolher o Firecrawl durante a integração inicial ou em `openclaw configure --section web` ativa automaticamente o plugin do Firecrawl instalado.
- O `web_search` com o Firecrawl é compatível com `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou extração dos resultados, use `firecrawl_search`.
- O padrão de `baseUrl` é o Firecrawl hospedado em `https://api.firecrawl.dev`. Substituições auto-hospedadas são permitidas apenas para endpoints privados/internos; HTTP é aceito somente para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback compartilhado por variável de ambiente para os URLs-base de pesquisa e extração do Firecrawl.
- As solicitações de pesquisa do Firecrawl têm um tempo limite padrão de 30 segundos; o parâmetro `timeoutSeconds` de `firecrawl_search` o substitui em cada chamada.

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
- `maxAgeMs` controla a idade máxima permitida para os resultados armazenados em cache (ms). O padrão é 172.800.000 ms (2 dias).
- O padrão de `onlyMainContent` é `true`; o padrão de `timeoutSeconds` é 60.
- As configurações legadas `tools.web.fetch.firecrawl.*` e `tools.web.search.firecrawl.*` são migradas automaticamente por `openclaw doctor --fix`.
- As substituições dos URLs-base de extração do Firecrawl seguem a mesma regra de hospedado/privado usada para pesquisa: o tráfego público hospedado usa `https://api.firecrawl.dev`; as substituições auto-hospedadas devem ser resolvidas para endpoints privados/internos.
- `firecrawl_scrape` rejeita URLs de destino obviamente privadas, de loopback, de metadados e que não sejam HTTP(S) antes de encaminhá-las ao Firecrawl, seguindo o contrato de segurança de destinos de `web_fetch` para chamadas explícitas de extração do Firecrawl.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente de `plugins.entries.firecrawl.config.webFetch.*`, incluindo a chave de API obrigatória.

### Firecrawl auto-hospedado

Defina `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` ao executar o Firecrawl por conta própria. O OpenClaw aceita `http://` apenas para destinos de loopback, rede privada, `.local`, `.internal` ou `.localhost`. Hosts públicos personalizados são rejeitados para evitar que chaves de API do Firecrawl sejam enviadas acidentalmente a endpoints arbitrários.

## Ferramentas do plugin do Firecrawl

### `firecrawl_search`

Use esta opção quando quiser controles de pesquisa específicos do Firecrawl em vez do `web_search` genérico.

Parâmetros:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use esta opção para páginas que fazem uso intensivo de JS ou são protegidas contra bots, nas quais o `web_fetch` simples tem desempenho insuficiente.

Parâmetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo furtivo/contorno de bots

`firecrawl_scrape` e o fallback do Firecrawl para `web_fetch` usam por padrão `proxy: "auto"` e `storeInCache: true`, a menos que o chamador substitua esses parâmetros. `firecrawl_search` e o provedor do Firecrawl para `web_search` não têm controles `proxy`/`storeInCache`; o modo de proxy furtivo aplica-se somente às solicitações de extração/busca.

O modo `proxy` do Firecrawl controla o contorno de bots (`basic`, `stealth` ou `auto`). `auto` tenta novamente com proxies furtivos se uma tentativa básica falhar, o que pode consumir mais créditos do que a extração somente no modo básico.

## Como o `web_fetch` usa o Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Provedor de busca configurado, como o Firecrawl (quando selecionado ou detectado automaticamente a partir das credenciais configuradas)
3. Limpeza básica de HTML (último fallback)

A opção de seleção é `tools.web.fetch.provider`. Se ela for omitida, o OpenClaw detectará automaticamente o primeiro provedor de busca na Web pronto para uso com base nas credenciais disponíveis. O plugin oficial do Firecrawl fornece esse fallback.

## Relacionado

- [Visão geral da pesquisa na Web](/pt-BR/tools/web) -- todos os provedores e a detecção automática
- [Busca na Web](/pt-BR/tools/web-fetch) -- ferramenta `web_fetch` com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa e extração
