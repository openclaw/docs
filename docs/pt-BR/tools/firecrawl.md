---
read_when:
    - Você quer extração de conteúdo da web com o Firecrawl como base
    - Você quer o Firecrawl Search sem chave (gratuito) ou o web_fetch sem chave
    - Você precisa de uma chave de API do Firecrawl para realizar pesquisas ou obter limites mais altos
    - Você quer o Firecrawl como provedor de web_search
    - Você quer extração antibot para web_fetch
summary: Pesquisa e extração do Firecrawl e fallback de web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T13:02:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

O OpenClaw pode usar o **Firecrawl** de três maneiras:

- como o provedor `web_search`
- como ferramentas explícitas do plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

Ele é um serviço hospedado de extração/pesquisa compatível com contorno de bots e cache, o que ajuda com sites que dependem muito de JS ou páginas que bloqueiam buscas HTTP simples.

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Acesso sem chave e chaves de API

O Firecrawl registra dois provedores `web_search`:

- **Firecrawl Search** (`firecrawl`) — usa a API hospedada `/v2/search` com sua
  chave; detectado automaticamente quando há uma chave disponível.
- **Firecrawl Search (Free)** (`firecrawl-free`) — usa o nível inicial hospedado sem
  chave, sem exigir chave de API. Ele é **somente por adesão** e nunca é selecionado automaticamente, pois
  selecioná-lo envia suas consultas de pesquisa ao nível gratuito do Firecrawl.

O fallback `web_fetch` do Firecrawl selecionado explicitamente também não exige chave. As
ferramentas explícitas `firecrawl_search` e `firecrawl_scrape` exigem uma chave de API. Adicione
`FIRECRAWL_API_KEY` ao ambiente do Gateway ou configure-a para obter limites maiores.

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

- Escolher o Firecrawl durante a integração ou em `openclaw configure --section web` ativa automaticamente o plugin do Firecrawl instalado.
- Escolha **Firecrawl Search (Free)** durante a integração (ou defina `provider: "firecrawl-free"`) para executar sem chave e sem uma chave de API. O provedor **Firecrawl Search** com chave envia `plugins.entries.firecrawl.config.webSearch.apiKey` ou `FIRECRAWL_API_KEY`.
- `web_search` com o Firecrawl é compatível com `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou raspagem de resultados, use `firecrawl_search`.
- `baseUrl` usa por padrão o Firecrawl hospedado em `https://api.firecrawl.dev`. Substituições auto-hospedadas são permitidas apenas para endpoints privados/internos; HTTP é aceito somente para esses destinos privados.
- `FIRECRAWL_BASE_URL` é o fallback de ambiente compartilhado para os URLs base de pesquisa e raspagem do Firecrawl.
- As solicitações de pesquisa do Firecrawl usam por padrão um tempo limite de 30 segundos; o parâmetro `timeoutSeconds` de `firecrawl_search` o substitui em cada chamada.

## Configurar o fallback web_fetch do Firecrawl

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

- O fallback `web_fetch` do Firecrawl selecionado explicitamente funciona sem uma chave de API. Quando configurado, o OpenClaw envia `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` para obter limites maiores.
- Escolher o Firecrawl durante a integração ou em `openclaw configure --section web` ativa o plugin e seleciona o Firecrawl para `web_fetch`, a menos que outro provedor de busca já esteja configurado.
- `firecrawl_scrape` exige uma chave de API.
- `maxAgeMs` controla a idade máxima dos resultados armazenados em cache (ms). O padrão é 172.800.000 ms (2 dias).
- `onlyMainContent` usa por padrão `true`; `timeoutSeconds` usa por padrão 60.
- A configuração legada `tools.web.fetch.firecrawl.*` e `tools.web.search.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- As substituições de URL de raspagem/base do Firecrawl seguem a mesma regra hospedado/privado da pesquisa: o tráfego público hospedado usa `https://api.firecrawl.dev`; as substituições auto-hospedadas devem ser resolvidas para endpoints privados/internos.
- `firecrawl_scrape` rejeita URLs de destino obviamente privados, de loopback, de metadados e que não sejam HTTP(S) antes de encaminhá-los ao Firecrawl, em conformidade com o contrato de segurança de destino `web_fetch` para chamadas explícitas de raspagem do Firecrawl.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente de `plugins.entries.firecrawl.config.webFetch.*`, incluindo a chave de API obrigatória.

### Firecrawl auto-hospedado

Defina `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` quando você mesmo executar o Firecrawl. O OpenClaw aceita `http://` somente para destinos de loopback, rede privada, `.local`, `.internal` ou `.localhost`. Hosts públicos personalizados são rejeitados para que as chaves de API do Firecrawl não sejam enviadas acidentalmente a endpoints arbitrários.

## Ferramentas do plugin do Firecrawl

### `firecrawl_search`

Use esta opção quando quiser controles de pesquisa específicos do Firecrawl em vez do `web_search` genérico. Exige uma chave de API.

Parâmetros:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (somente nomes de host; mutuamente exclusivos)
- `tbs` (filtro de tempo, por exemplo `qdr:d`, `qdr:w`, `sbd:1`)
- `location` e `country` (segmentação geográfica)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use esta opção para páginas que dependem muito de JS ou são protegidas contra bots, nas quais o `web_fetch` simples é insuficiente.

Parâmetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo furtivo / contorno de bots

`firecrawl_scrape` e o fallback `web_fetch` do Firecrawl usam por padrão `proxy: "auto"` mais `storeInCache: true`, a menos que o chamador substitua esses parâmetros. `firecrawl_search` e o provedor `web_search` do Firecrawl não têm controles `proxy`/`storeInCache`; o modo de proxy furtivo se aplica apenas a solicitações de raspagem/busca.

O modo `proxy` do Firecrawl controla o contorno de bots (`basic`, `stealth` ou `auto`). `auto` tenta novamente com proxies furtivos se uma tentativa básica falhar, o que pode consumir mais créditos do que a raspagem somente básica.

## Como `web_fetch` usa o Firecrawl

Ordem de extração de `web_fetch`:

1. Readability (local)
2. Provedor de busca configurado, como o Firecrawl (quando selecionado ou detectado automaticamente com base nas credenciais configuradas)
3. Limpeza básica de HTML (último fallback)

O controle de seleção é `tools.web.fetch.provider`. Se ele for omitido, o OpenClaw detectará automaticamente o primeiro provedor de busca na Web pronto com base nas credenciais disponíveis. O plugin oficial do Firecrawl fornece esse fallback.

## Relacionados

- [Visão geral da pesquisa na Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Busca na Web](/pt-BR/tools/web-fetch) -- ferramenta web_fetch com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- ferramentas de pesquisa + extração
