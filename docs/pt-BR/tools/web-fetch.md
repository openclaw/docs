---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar web_fetch ou seu mecanismo alternativo Firecrawl
    - Você quer entender os limites e o armazenamento em cache do web_fetch
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- busca HTTP com extração de conteúdo legível
title: Busca na web
x-i18n:
    generated_at: "2026-05-06T18:01:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

A ferramenta `web_fetch` faz um HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com muito JS ou páginas protegidas por login, use o
[Navegador Web](/pt-BR/tools/browser).

## Início rápido

`web_fetch` vem **habilitada por padrão** -- nenhuma configuração é necessária. O agente pode
chamá-la imediatamente:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parâmetros da ferramenta

<ParamField path="url" type="string" required>
URL a buscar. Somente `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de saída após a extração do conteúdo principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca a saída para esta quantidade de caracteres.
</ParamField>

## Como funciona

<Steps>
  <Step title="Fetch">
    Envia um HTTP GET com um User-Agent semelhante ao Chrome e o cabeçalho
    `Accept-Language`. Bloqueia hostnames privados/internos e verifica redirects novamente.
  </Step>
  <Step title="Extract">
    Executa Readability (extração do conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (optional)">
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Se a extração do Readability falhar, `web_fetch` pode recorrer ao
[Firecrawl](/pt-BR/tools/firecrawl) para contorno de bots e melhor extração:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` aceita objetos SecretRef.
A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.

<Note>
  Se o Firecrawl estiver habilitado e seu SecretRef não for resolvido, sem fallback pela env
  `FIRECRAWL_API_KEY`, a inicialização do Gateway falha rapidamente.
</Note>

<Note>
  Substituições de `baseUrl` do Firecrawl são restritas: tráfego hospedado usa
  `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados ou
  internos, e `http://` é aceito somente para esses destinos privados.
</Note>

Comportamento atual em runtime:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de busca.
- Se `provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor pronto de web-fetch
  a partir das credenciais disponíveis. `web_fetch` fora do sandbox pode usar
  plugins instalados que declaram `contracts.webFetchProviders` e registram um
  provedor correspondente em runtime. Hoje, o provedor incluído é o Firecrawl.
- Chamadas `web_fetch` em sandbox permanecem limitadas aos provedores incluídos.
- Se Readability estiver desabilitado, `web_fetch` pula direto para o fallback do
  provedor selecionado. Se nenhum provedor estiver disponível, ela falha fechada.

## Proxy env confiável

Se sua implantação exigir que `web_fetch` passe por um proxy de saída
HTTP(S) confiável, defina `tools.web.fetch.useTrustedEnvProxy: true`.

Nesse modo, o OpenClaw ainda aplica verificações SSRF baseadas em hostname antes de enviar
a requisição, mas permite que o proxy resolva DNS em vez de fazer fixação de DNS local.
Habilite isso somente quando o proxy for controlado pelo operador e aplicar
a política de saída após a resolução de DNS.

<Note>
  Se nenhuma env var de proxy HTTP(S) estiver configurada, ou o host de destino for excluído por
  `NO_PROXY`, `web_fetch` volta ao caminho estrito normal com fixação de DNS local.
</Note>

## Limites e segurança

- `maxChars` é limitado a `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado a `maxResponseBytes` antes do parsing; respostas
  grandes demais são truncadas com um aviso
- Hostnames privados/internos são bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` são opt-ins restritos
  para stacks de proxy fake-IP confiáveis; deixe-os indefinidos, a menos que seu proxy seja dono
  desses intervalos sintéticos e aplique sua própria política de destino
- Redirects são verificados e limitados por `maxRedirects`
- `useTrustedEnvProxy` é um opt-in explícito e só deve ser habilitado para
  proxies controlados pelo operador que ainda apliquem política de saída após a resolução de DNS
- `web_fetch` é de melhor esforço -- alguns sites precisam do [Navegador Web](/pt-BR/tools/browser)

## Perfis de ferramentas

Se você usa perfis de ferramentas ou allowlists, adicione `web_fetch` ou `group:web`:

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
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de pesquisa e scraping do Firecrawl
