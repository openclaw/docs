---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar web_fetch ou sua alternativa Firecrawl
    - Você quer entender os limites e o cache de web_fetch
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- busca HTTP com extração de conteúdo legível
title: Busca na web
x-i18n:
    generated_at: "2026-05-02T05:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

A ferramenta `web_fetch` faz um HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com muito JS ou páginas protegidas por login, use o
[Navegador Web](/pt-BR/tools/browser).

## Início rápido

`web_fetch` é **ativado por padrão** -- nenhuma configuração é necessária. O agente pode
chamá-lo imediatamente:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parâmetros da ferramenta

<ParamField path="url" type="string" required>
URL a buscar. Apenas `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de saída após a extração do conteúdo principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca a saída para esta quantidade de caracteres.
</ParamField>

## Como funciona

<Steps>
  <Step title="Buscar">
    Envia um HTTP GET com um User-Agent semelhante ao Chrome e cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e verifica redirecionamentos novamente.
  </Step>
  <Step title="Extrair">
    Executa Readability (extração do conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (opcional)">
    Se Readability falhar e Firecrawl estiver configurado, tenta novamente pela
    API do Firecrawl com modo de contorno de bots.
  </Step>
  <Step title="Cache">
    Os resultados são armazenados em cache por 15 minutos (configurável) para reduzir buscas
    repetidas da mesma URL.
  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Fallback do Firecrawl

Se a extração do Readability falhar, `web_fetch` pode usar
[Firecrawl](/pt-BR/tools/firecrawl) como fallback para contorno de bots e melhor extração:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` oferece suporte a objetos SecretRef.
A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.

<Note>
  Se Firecrawl estiver ativado e seu SecretRef não for resolvido sem fallback da variável de ambiente
  `FIRECRAWL_API_KEY`, a inicialização do Gateway falha rapidamente.
</Note>

<Note>
  Sobrescritas de `baseUrl` do Firecrawl são restritas: tráfego hospedado usa
  `https://api.firecrawl.dev`; sobrescritas auto-hospedadas devem apontar para endpoints privados ou
  internos, e `http://` é aceito apenas para esses destinos privados.
</Note>

Comportamento atual em tempo de execução:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de busca.
- Se `provider` for omitido, OpenClaw detecta automaticamente o primeiro provedor de web-fetch
  pronto a partir das credenciais disponíveis. `web_fetch` sem sandbox pode usar
  plugins instalados que declaram `contracts.webFetchProviders` e registram um
  provedor correspondente em tempo de execução. Hoje, o provedor incluído é Firecrawl.
- Chamadas `web_fetch` em sandbox permanecem limitadas aos provedores incluídos.
- Se Readability estiver desativado, `web_fetch` vai direto para o fallback do
  provedor selecionado. Se nenhum provedor estiver disponível, ele falha fechado.

## Limites e segurança

- `maxChars` é limitado a `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado a `maxResponseBytes` antes da análise; respostas grandes demais
  são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` são permissões opt-in restritas
  para pilhas de proxy de IP falso confiáveis; deixe-os indefinidos a menos que seu proxy possua
  esses intervalos sintéticos e aplique sua própria política de destino
- Redirecionamentos são verificados e limitados por `maxRedirects`
- `web_fetch` funciona em regime de melhor esforço -- alguns sites precisam do [Navegador Web](/pt-BR/tools/browser)

## Perfis de ferramentas

Se você usa perfis de ferramentas ou listas de permissão, adicione `web_fetch` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Relacionados

- [Pesquisa Web](/pt-BR/tools/web) -- pesquise na web com vários provedores
- [Navegador Web](/pt-BR/tools/browser) -- automação completa de navegador para sites com muito JS
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de pesquisa e raspagem do Firecrawl
