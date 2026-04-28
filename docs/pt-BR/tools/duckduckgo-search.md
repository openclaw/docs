---
read_when:
- Você quer um provedor de web search que não exija chave de API
- Você quer usar DuckDuckGo para `web_search`
- You need a zero-config search fallback
summary: DuckDuckGo web search -- provedor de fallback sem chave (experimental, baseado
  em HTML)
title: Busca DuckDuckGo
x-i18n:
  generated_at: '2026-04-24T06:15:51Z'
  model: gpt-5.4
  provider: openai
  source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
  source_path: tools/duckduckgo-search.md
  workflow: 15
---

O OpenClaw oferece suporte ao DuckDuckGo como provedor `web_search` **sem chave**. Não é necessária nenhuma chave de API nem conta.

<Warning>
  O DuckDuckGo é uma integração **experimental e não oficial** que extrai resultados
  das páginas de busca sem JavaScript do DuckDuckGo — não de uma API oficial. Espere
  falhas ocasionais devido a páginas de desafio anti-bot ou mudanças no HTML.
</Warning>

## Configuração

Nenhuma chave de API é necessária — basta definir DuckDuckGo como seu provedor:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecione "duckduckgo" como provedor
    ```
  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Configurações opcionais em nível de Plugin para região e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // código de região do DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" ou "off"
          },
        },
      },
    },
  },
}
```

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de busca.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados a retornar (1–10).
</ParamField>

<ParamField path="region" type="string">
Código de região do DuckDuckGo (por exemplo `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nível de SafeSearch.
</ParamField>

Região e SafeSearch também podem ser definidos na configuração do Plugin (veja acima) — os
parâmetros da ferramenta sobrescrevem os valores da configuração por consulta.

## Observações

- **Sem chave de API** — funciona imediatamente, sem configuração
- **Experimental** — coleta resultados das páginas de busca HTML sem JavaScript
  do DuckDuckGo, não de uma API ou SDK oficial
- **Risco de desafio anti-bot** — o DuckDuckGo pode servir CAPTCHAs ou bloquear requisições
  sob uso intenso ou automatizado
- **Parsing de HTML** — os resultados dependem da estrutura da página, que pode mudar sem
  aviso
- **Ordem de detecção automática** — DuckDuckGo é o primeiro fallback sem chave
  (ordem 100) na detecção automática. Provedores com suporte a API e chaves configuradas são executados
  primeiro, depois Ollama Web Search (ordem 110) e depois SearXNG (ordem 200)
- **SafeSearch usa moderate por padrão** quando não configurado

<Tip>
  Para uso em produção, considere [Brave Search](/pt-BR/tools/brave-search) (tier gratuita
  disponível) ou outro provedor com suporte a API.
</Tip>

## Relacionado

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com tier gratuita
- [Exa Search](/pt-BR/tools/exa-search) -- busca neural com extração de conteúdo
