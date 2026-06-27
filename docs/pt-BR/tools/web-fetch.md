---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar o web_fetch ou seu fallback Firecrawl
    - Você quer entender os limites e o cache de web_fetch
sidebarTitle: Web Fetch
summary: ferramenta `web_fetch` -- busca HTTP com extração de conteúdo legível
title: Busca na Web
x-i18n:
    generated_at: "2026-06-27T18:20:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

A ferramenta `web_fetch` faz um HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com uso intenso de JS ou páginas protegidas por login, use o
[Navegador Web](/pt-BR/tools/browser).

## Início rápido

`web_fetch` vem **habilitada por padrão** -- nenhuma configuração é necessária. O agente pode
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
Trunca a saída para esta quantidade de caracteres.
</ParamField>

## Como funciona

<Steps>
  <Step title="Fetch">
    Envia um HTTP GET com um User-Agent semelhante ao Chrome e cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e verifica
    redirecionamentos novamente.
  </Step>
  <Step title="Extract">
    Executa Readability (extração de conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Se o Readability falhar e o Firecrawl estiver selecionado, tenta novamente
    pela API do Firecrawl com modo de contorno de bots.
  </Step>
  <Step title="Cache">
    Os resultados ficam em cache por 15 minutos (configurável) para reduzir
    buscas repetidas da mesma URL.
  </Step>
</Steps>

## Atualizações de progresso

`web_fetch` emite uma linha pública de progresso somente quando a busca ainda está pendente
após cinco segundos:

```text
Fetching page content...
```

Acertos rápidos de cache e respostas rápidas de rede terminam antes do temporizador disparar, então
não mostram uma linha de progresso. Se a chamada for cancelada, o temporizador é limpo.
Quando a busca finalmente termina, o agente recebe o resultado normal da ferramenta;
a linha de progresso é apenas estado da interface do canal e nunca contém conteúdo
buscado da página.

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` é opcional e oferece suporte a objetos SecretRef.
A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.

<Note>
  Se você configurar um SecretRef de chave de API do Firecrawl e ele não for resolvido sem
  fallback de env `FIRECRAWL_API_KEY`, a inicialização do Gateway falha rapidamente.
</Note>

<Note>
  Substituições de `baseUrl` do Firecrawl são restritas: tráfego hospedado usa
  `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints
  privados ou internos, e `http://` é aceito apenas para esses destinos privados.
</Note>

Comportamento atual em runtime:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de busca.
- Se `provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor
  de web-fetch pronto a partir das credenciais configuradas. `web_fetch` sem sandbox pode usar
  plugins instalados que declaram `contracts.webFetchProviders` e registram um
  provedor correspondente em runtime. O Plugin oficial do Firecrawl fornece esse
  fallback.
- Chamadas `web_fetch` em sandbox permitem provedores incluídos no pacote e provedores instalados
  cuja procedência oficial no npm ou ClawHub seja verificada. Hoje isso permite o
  Plugin oficial do Firecrawl; plugins externos de busca de terceiros permanecem excluídos.
- Se Readability estiver desabilitado, `web_fetch` pula direto para o fallback do
  provedor selecionado. Se nenhum provedor estiver disponível, falha em modo fechado.

## Proxy de env confiável

Se sua implantação exigir que `web_fetch` passe por um proxy HTTP(S)
de saída confiável, defina `tools.web.fetch.useTrustedEnvProxy: true`.

Nesse modo, o OpenClaw ainda aplica verificações SSRF baseadas em nome de host antes de enviar
a solicitação, mas deixa o proxy resolver o DNS em vez de fazer fixação de DNS local.
Habilite isso apenas quando o proxy for controlado pelo operador e aplicar
política de saída após a resolução de DNS.

<Note>
  Se nenhuma variável de env de proxy HTTP(S) estiver configurada, ou o host de destino for excluído por
  `NO_PROXY`, `web_fetch` volta para o caminho estrito normal com fixação de DNS
  local.
</Note>

## Limites e segurança

- `maxChars` é limitado a `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado a `maxResponseBytes` antes da análise; respostas grandes demais
  são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` são adesões restritas
  para pilhas de proxy de IP falso confiáveis; deixe-as indefinidas, a menos que seu proxy possua
  esses intervalos sintéticos e aplique sua própria política de destino
- Redirecionamentos são verificados e limitados por `maxRedirects`
- `useTrustedEnvProxy` é uma adesão explícita e deve ser habilitada apenas para
  proxies controlados pelo operador que ainda apliquem política de saída após a
  resolução de DNS
- `web_fetch` funciona em regime de melhor esforço -- alguns sites precisam do [Navegador Web](/pt-BR/tools/browser)

## Perfis de ferramenta

Se você usa perfis de ferramenta ou listas de permissão, adicione `web_fetch` ou `group:web`:

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
- [Navegador Web](/pt-BR/tools/browser) -- automação completa de navegador para sites com uso intenso de JS
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de pesquisa e scraping do Firecrawl
