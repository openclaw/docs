---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar `web_fetch` ou seu fallback Firecrawl
    - Você quer entender os limites e o cache de `web_fetch`
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- busca HTTP com extração de conteúdo legível
title: Web fetch
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:19:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

A ferramenta `web_fetch` faz um HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com muito JavaScript ou páginas protegidas por login, use o
[Web Browser](/pt-BR/tools/browser).

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
    Envia um HTTP GET com um User-Agent semelhante ao Chrome e o cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e revalida redirecionamentos.
  </Step>
  <Step title="Extrair">
    Executa Readability (extração de conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (opcional)">
    Se o Readability falhar e o Firecrawl estiver configurado, tenta novamente via
    API Firecrawl com modo de contorno de bot.
  </Step>
  <Step title="Cache">
    Os resultados são armazenados em cache por 15 minutos (configurável) para reduzir
    buscas repetidas da mesma URL.
  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // padrão: true
        provider: "firecrawl", // opcional; omita para detecção automática
        maxChars: 50000, // máximo de caracteres de saída
        maxCharsCap: 50000, // limite rígido para o parâmetro maxChars
        maxResponseBytes: 2000000, // tamanho máximo de download antes de truncar
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // usa extração Readability
        userAgent: "Mozilla/5.0 ...", // sobrescreve o User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Se a extração do Readability falhar, `web_fetch` pode usar
[Firecrawl](/pt-BR/tools/firecrawl) como fallback para contorno de bot e melhor extração:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcional; omita para detecção automática a partir das credenciais disponíveis
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // opcional se FIRECRAWL_API_KEY estiver definido
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // duração do cache (1 dia)
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
  Se o Firecrawl estiver ativado e seu SecretRef não for resolvido sem
  fallback para a env `FIRECRAWL_API_KEY`, a inicialização do gateway falha imediatamente.
</Note>

<Note>
  Sobrescritas de `baseUrl` do Firecrawl são rigidamente controladas: devem usar `https://` e
  o host oficial do Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento atual em runtime:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de fetch.
- Se `provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de web-fetch
  pronto a partir das credenciais disponíveis. Hoje o provedor empacotado é o Firecrawl.
- Se o Readability estiver desativado, `web_fetch` pula diretamente para o
  fallback do provedor selecionado. Se nenhum provedor estiver disponível, ele falha em modo fail-closed.

## Limites e segurança

- `maxChars` é limitado por `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado por `maxResponseBytes` antes do parsing; respostas
  grandes demais são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- Redirecionamentos são verificados e limitados por `maxRedirects`
- `web_fetch` funciona em best-effort -- alguns sites exigem o [Web Browser](/pt-BR/tools/browser)

## Perfis de ferramenta

Se você usa perfis de ferramenta ou allowlists, adicione `web_fetch` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // ou: allow: ["group:web"]  (inclui web_fetch, web_search e x_search)
  },
}
```

## Relacionado

- [Web Search](/pt-BR/tools/web) -- buscar na web com vários provedores
- [Web Browser](/pt-BR/tools/browser) -- automação completa de navegador para sites com muito JavaScript
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de busca e scraping do Firecrawl
