---
read_when:
    - Você quer extração da web com suporte do Firecrawl
    - Você quer Firecrawl web_fetch sem chave
    - Você precisa de uma chave de API do Firecrawl para pesquisa ou limites maiores
    - Você quer o Firecrawl como provedor de web_search
    - Você quer extração anti-bot para `web_fetch`
summary: Pesquisa, extração e fallback de web_fetch do Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:15:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw pode usar **Firecrawl** de três formas:

- como provedor `web_search`
- como ferramentas explícitas de Plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

Ele é um serviço hospedado de extração/pesquisa compatível com contorno de bots e cache,
o que ajuda com sites pesados em JS ou páginas que bloqueiam buscas HTTP simples.

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sem chave e chaves de API

O fallback `web_fetch` hospedado do Firecrawl selecionado explicitamente oferece suporte a acesso
inicial sem uma chave de API. Adicione `FIRECRAWL_API_KEY` no ambiente do gateway
ou configure-a quando precisar de limites maiores. `web_search` do Firecrawl e
`firecrawl_scrape` exigem uma chave de API.

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

- Escolher Firecrawl na integração inicial ou em `openclaw configure --section web` habilita automaticamente o Plugin Firecrawl instalado.
- `web_search` com Firecrawl oferece suporte a `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou extração de resultados, use `firecrawl_search`.
- `baseUrl` usa como padrão o Firecrawl hospedado em `https://api.firecrawl.dev`. Substituições auto-hospedadas são permitidas somente para endpoints privados/internos; HTTP é aceito apenas para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback de ambiente compartilhado para URLs base de pesquisa e extração do Firecrawl.

## Configurar o fallback web_fetch do Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
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

- O fallback `web_fetch` do Firecrawl selecionado explicitamente funciona sem uma chave de API. Quando configurado, o OpenClaw envia `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` para limites maiores.
- Escolher Firecrawl durante a integração inicial ou em `openclaw configure --section web` habilita o Plugin e seleciona Firecrawl para `web_fetch`, a menos que outro provedor de busca já esteja configurado.
- `firecrawl_scrape` exige uma chave de API.
- `maxAgeMs` controla a idade máxima dos resultados em cache (ms). O padrão é 2 dias.
- A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- As substituições de URL base/extração do Firecrawl seguem a mesma regra hospedado/privado da pesquisa: o tráfego hospedado público usa `https://api.firecrawl.dev`; substituições auto-hospedadas devem resolver para endpoints privados/internos.
- `firecrawl_scrape` rejeita URLs de destino obviamente privadas, loopback, de metadados e não HTTP(S) antes de encaminhá-las ao Firecrawl, correspondendo ao contrato de segurança de destino de `web_fetch` para chamadas explícitas de extração do Firecrawl.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente `plugins.entries.firecrawl.config.webFetch.*`, incluindo a chave de API obrigatória.

### Firecrawl auto-hospedado

Defina `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL`
quando você executar o Firecrawl por conta própria. O OpenClaw aceita `http://` somente para destinos de loopback,
rede privada, `.local`, `.internal` ou `.localhost`. Hosts personalizados públicos
são rejeitados para que as chaves de API do Firecrawl não sejam enviadas a endpoints arbitrários por
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

Use isto para páginas pesadas em JS ou protegidas contra bots em que `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / contorno de bots

O Firecrawl expõe um parâmetro de **modo de proxy** para contorno de bots (`basic`, `stealth` ou `auto`).
O OpenClaw sempre usa `proxy: "auto"` mais `storeInCache: true` para solicitações do Firecrawl.
Se proxy for omitido, o Firecrawl usa `auto` por padrão. `auto` tenta novamente com proxies stealth se uma tentativa básica falhar, o que pode usar mais créditos
do que a extração somente básica.

## Como `web_fetch` usa o Firecrawl

Ordem de extração de `web_fetch`:

1. Readability (local)
2. Firecrawl (quando selecionado ou detectado automaticamente a partir de credenciais configuradas)
3. Limpeza básica de HTML (último fallback)

O controle de seleção é `tools.web.fetch.provider`. Se você omiti-lo, o OpenClaw
detectará automaticamente o primeiro provedor de web-fetch pronto a partir das credenciais disponíveis.
O Plugin oficial Firecrawl fornece esse fallback.

## Relacionados

- [Visão geral da Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Web Fetch](/pt-BR/tools/web-fetch) -- ferramenta web_fetch com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa + extração
