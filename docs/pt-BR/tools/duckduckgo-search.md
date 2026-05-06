---
read_when:
    - Você quer um provedor de pesquisa na web que não exige chave de API
    - Você quer usar o DuckDuckGo para web_search
    - Você precisa de uma alternativa de busca sem configuração
summary: Pesquisa na web do DuckDuckGo -- provedor de fallback sem chave (experimental, baseado em HTML)
title: Pesquisa no DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:15:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw é compatível com DuckDuckGo como provedor `web_search` **sem chave**. Nenhuma chave de API ou conta é necessária.

<Warning>
  DuckDuckGo é uma integração **experimental e não oficial** que extrai resultados
  das páginas de busca sem JavaScript do DuckDuckGo, não de uma API oficial. Espere
  quebras ocasionais causadas por páginas de desafio contra bots ou alterações de HTML.
</Warning>

## Configuração

Nenhuma chave de API é necessária; basta definir DuckDuckGo como seu provedor:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
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

Configurações opcionais no nível do plugin para região e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
Resultados a retornar (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de região do DuckDuckGo (por exemplo, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nível do SafeSearch.
</ParamField>

Região e SafeSearch também podem ser definidos na configuração do plugin (veja acima);
os parâmetros da ferramenta substituem os valores de configuração por consulta.

## Observações

- **Nenhuma chave de API**: funciona imediatamente, sem nenhuma configuração
- **Experimental**: coleta resultados das páginas de busca HTML sem JavaScript
  do DuckDuckGo, não de uma API ou SDK oficial
- **Risco de desafio contra bots**: o DuckDuckGo pode servir CAPTCHAs ou bloquear
  solicitações sob uso intenso ou automatizado
- **Análise de HTML**: os resultados dependem da estrutura da página, que pode mudar sem
  aviso
- **Ordem de detecção automática**: DuckDuckGo é a primeira alternativa sem chave
  (ordem 100) na detecção automática. Provedores baseados em API com chaves configuradas executam
  primeiro, depois Ollama Web Search (ordem 110) e, em seguida, SearXNG (ordem 200)
- **SafeSearch usa moderate por padrão** quando não configurado

<Tip>
  Para uso em produção, considere [Brave Search](/pt-BR/tools/brave-search) (camada gratuita
  disponível) ou outro provedor baseado em API.
</Tip>

## Relacionados

- [Visão geral da Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com camada gratuita
- [Exa Search](/pt-BR/tools/exa-search) -- busca neural com extração de conteúdo
