---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar web_fetch ou sua alternativa com Firecrawl
    - Você quer entender os limites e o armazenamento em cache do web_fetch
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- requisição HTTP com extração de conteúdo legível
title: Busca na web
x-i18n:
    generated_at: "2026-04-30T10:14:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

A ferramenta `web_fetch` faz uma requisição HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com muito JS ou páginas protegidas por login, use o
[Navegador Web](/pt-BR/tools/browser).

## Início rápido

`web_fetch` é **habilitada por padrão** -- nenhuma configuração é necessária. O agente pode
chamá-la imediatamente:

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
Trunca a saída para este número de caracteres.
</ParamField>

## Como funciona

<Steps>
  <Step title="Fetch">
    Envia uma requisição HTTP GET com um User-Agent semelhante ao Chrome e o cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e verifica redirecionamentos novamente.
  </Step>
  <Step title="Extract">
    Executa o Readability (extração do conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Se o Readability falhar e o Firecrawl estiver configurado, tenta novamente pela
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
  Se o Firecrawl estiver habilitado e sua SecretRef não for resolvida, sem fallback de env
  `FIRECRAWL_API_KEY`, a inicialização do Gateway falhará rapidamente.
</Note>

<Note>
  As substituições de `baseUrl` do Firecrawl são restritas: elas devem usar `https://` e
  o host oficial do Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento atual em tempo de execução:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de busca.
- Se `provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor
  de web-fetch pronto a partir das credenciais disponíveis. Hoje, o provedor incluído é o Firecrawl.
- Se o Readability estiver desabilitado, `web_fetch` vai direto para o fallback do
  provedor selecionado. Se nenhum provedor estiver disponível, ele falha de forma fechada.

## Limites e segurança

- `maxChars` é limitado a `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado a `maxResponseBytes` antes da análise; respostas grandes demais
  são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` são opt-ins restritos
  para pilhas de proxy de IP falso confiáveis; deixe-os indefinidos, a menos que seu proxy possua
  esses intervalos sintéticos e aplique sua própria política de destino
- Redirecionamentos são verificados e limitados por `maxRedirects`
- `web_fetch` é de melhor esforço -- alguns sites precisam do [Navegador Web](/pt-BR/tools/browser)

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

- [Busca Web](/pt-BR/tools/web) -- pesquise na web com vários provedores
- [Navegador Web](/pt-BR/tools/browser) -- automação completa de navegador para sites com muito JS
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de busca e raspagem do Firecrawl
