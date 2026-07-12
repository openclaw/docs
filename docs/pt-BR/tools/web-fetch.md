---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar o web_fetch ou seu fallback do Firecrawl
    - Você quer entender os limites e o cache do web_fetch
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- busca HTTP com extração de conteúdo legível
title: Busca na Web
x-i18n:
    generated_at: "2026-07-12T15:52:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` faz uma solicitação HTTP GET simples e extrai conteúdo legível (de HTML para
markdown ou texto). Ele **não** executa JavaScript. Para sites que dependem muito de JS ou
páginas protegidas por login, use o [Navegador Web](/pt-BR/tools/browser).

## Início rápido

Habilitado por padrão, sem necessidade de configuração:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parâmetros da ferramenta

<ParamField path="url" type="string" required>
URL a ser acessada. Somente `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de saída após a extração do conteúdo principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca a saída para este número de caracteres. Limitado por `tools.web.fetch.maxCharsCap`.
</ParamField>

## Como funciona

<Steps>
  <Step title="Buscar">
    Envia uma solicitação HTTP GET com um User-Agent semelhante ao Chrome e o cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e verifica novamente os redirecionamentos.
  </Step>
  <Step title="Extrair">
    Executa o Readability (extração do conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Alternativa (opcional)">
    Se o Readability falhar e houver um provedor de busca disponível, tenta novamente por meio
    desse provedor (por exemplo, o modo de evasão de bots do Firecrawl).
  </Step>
  <Step title="Cache">
    Os resultados são armazenados em cache por 15 minutos (configurável) para reduzir buscas
    repetidas da mesma URL.
  </Step>
</Steps>

## Atualizações de progresso

`web_fetch` emite uma linha pública de progresso somente quando a busca ainda está pendente
após cinco segundos:

```text
Buscando o conteúdo da página...
```

Acertos rápidos no cache e respostas rápidas da rede terminam antes de o temporizador disparar,
portanto nunca exibem uma linha de progresso. Cancelar a chamada limpa o temporizador. A
linha de progresso é apenas um estado da interface do canal e nunca contém conteúdo obtido da página.

## Configuração

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // padrão: true
        provider: "firecrawl", // opcional; omita para detecção automática
        maxChars: 20000, // caracteres de saída padrão; limitado por maxCharsCap
        maxCharsCap: 20000, // limite rígido do parâmetro maxChars
        maxResponseBytes: 750000, // tamanho máximo do download antes do truncamento (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // permite que um proxy de ambiente HTTP(S) confiável resolva o DNS
        readability: true, // usa a extração do Readability
        userAgent: "Mozilla/5.0 ...", // substitui o User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // adesão explícita para proxies de IP falso confiáveis que usam 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // adesão explícita para proxies de IP falso confiáveis que usam fc00::/7
        },
      },
    },
  },
}
```

## Alternativa com Firecrawl

Se a extração do Readability falhar, `web_fetch` pode recorrer ao
[Firecrawl](/pt-BR/tools/firecrawl) para evasão de bots e uma extração melhor:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcional; omita para detecção automática com base nas credenciais disponíveis
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // opcional; omita para acesso inicial sem chave
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // duração do cache (2 dias)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` é opcional e aceita objetos SecretRef.
A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente para
`plugins.entries.firecrawl.config.webFetch` por meio de `openclaw doctor --fix`.

<Note>
  Se você configurar uma SecretRef de chave de API do Firecrawl e ela não for resolvida, sem
  uma alternativa na variável de ambiente `FIRECRAWL_API_KEY`, a inicialização do Gateway falhará imediatamente.
</Note>

<Note>
  As substituições de `baseUrl` do Firecrawl são restritas: o tráfego hospedado usa
  `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados ou
  internos, e `http://` é aceito somente para esses destinos privados.
</Note>

Comportamento atual em tempo de execução:

- `tools.web.fetch.provider` seleciona explicitamente o provedor alternativo de busca.
- Se `provider` for omitido, o OpenClaw detectará automaticamente o primeiro provedor de busca
  web pronto entre as credenciais configuradas. O `web_fetch` sem sandbox pode usar
  plugins instalados que declarem `contracts.webFetchProviders` e registrem um
  provedor correspondente em tempo de execução. Atualmente, o plugin oficial do Firecrawl fornece essa
  alternativa.
- Chamadas de `web_fetch` em sandbox permitem provedores integrados, além de provedores instalados
  cuja procedência oficial no npm ou no ClawHub tenha sido verificada. Atualmente, isso permite o
  plugin oficial do Firecrawl; plugins externos de busca de terceiros permanecem excluídos.
- Se o Readability estiver desabilitado, `web_fetch` segue diretamente para o provedor
  alternativo selecionado. Se nenhum provedor estiver disponível, ele falhará de modo seguro.

## Proxy de ambiente confiável

Se a sua implantação exigir que `web_fetch` passe por um proxy HTTP(S) de saída
confiável, defina `tools.web.fetch.useTrustedEnvProxy: true`.

Nesse modo, o OpenClaw ainda aplica verificações de SSRF baseadas no nome do host antes de enviar
a solicitação, mas permite que o proxy resolva o DNS em vez de fazer a fixação local de DNS.
Habilite isso somente quando o proxy for controlado pelo operador e aplicar
a política de saída após a resolução do DNS.

<Note>
  Se nenhuma variável de ambiente de proxy HTTP(S) estiver configurada ou o host de destino for excluído por
  `NO_PROXY`, `web_fetch` recorrerá ao caminho estrito normal com fixação local de DNS.
</Note>

## Limites e segurança

- `maxChars` é limitado por `tools.web.fetch.maxCharsCap` (padrão `20000`)
- O corpo da resposta é limitado a `maxResponseBytes` (padrão `750000`, limitado a
  32000-10000000) antes da análise; respostas grandes demais são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` são adesões explícitas restritas
  para pilhas de proxy de IP falso confiáveis; deixe-os sem definir, a menos que seu proxy controle
  esses intervalos sintéticos e aplique sua própria política de destino
- Os redirecionamentos são verificados e limitados por `maxRedirects` (padrão `3`)
- `useTrustedEnvProxy` exige adesão explícita e só deve ser habilitado para
  proxies controlados pelo operador que continuem aplicando a política de saída após a resolução
  do DNS
- `web_fetch` funciona em regime de melhor esforço — alguns sites precisam do [Navegador Web](/pt-BR/tools/browser)

## Perfis de ferramentas

Se você usa perfis de ferramentas ou listas de permissões, adicione `web_fetch` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // ou: allow: ["group:web"]  (inclui web_fetch, web_search e x_search)
  },
}
```

## Relacionados

- [Pesquisa Web](/pt-BR/tools/web) — pesquise na web com vários provedores
- [Navegador Web](/pt-BR/tools/browser) — automação completa do navegador para sites que dependem muito de JS
- [Firecrawl](/pt-BR/tools/firecrawl) — ferramentas de pesquisa e extração do Firecrawl
