---
read_when:
    - Você quer um provedor de pesquisa na Web que não exija chave de API
    - Você quer usar DuckDuckGo para web_search
    - Você quer um provedor de pesquisa sem chave selecionado explicitamente
summary: Pesquisa web DuckDuckGo -- provedor sem chave (experimental, baseado em HTML)
title: Pesquisa DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:14:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw oferece suporte ao DuckDuckGo como provedor `web_search` **sem chave**. Nenhuma chave de API ou conta é necessária.

<Warning>
  DuckDuckGo é uma integração **experimental e não oficial** que obtém resultados
  das páginas de busca sem JavaScript do DuckDuckGo, não de uma API oficial. Espere
  quebras ocasionais causadas por páginas de desafio contra bots ou alterações de HTML.
</Warning>

## Configuração

Nenhuma chave de API necessária; basta definir o DuckDuckGo como seu provedor:

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

Configurações opcionais no nível do Plugin para região e SafeSearch:

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

Região e SafeSearch também podem ser definidos na configuração do Plugin (veja acima); os
parâmetros da ferramenta substituem os valores de configuração por consulta.

## Observações

- **Nenhuma chave de API**: funciona depois que você seleciona o DuckDuckGo como seu provedor
  `web_search`
- **Experimental**: coleta resultados das páginas de busca HTML sem JavaScript
  do DuckDuckGo, não de uma API ou SDK oficial
- **Risco de desafio contra bots**: o DuckDuckGo pode servir CAPTCHAs ou bloquear solicitações
  sob uso intenso ou automatizado
- **Análise de HTML**: os resultados dependem da estrutura da página, que pode mudar sem
  aviso
- **Seleção explícita**: o OpenClaw não escolhe o DuckDuckGo automaticamente
  quando nenhum provedor baseado em API está configurado
- **SafeSearch usa moderado por padrão** quando não configurado

<Tip>
  Para uso em produção, considere [Brave Search](/pt-BR/tools/brave-search) (camada gratuita
  disponível) ou outro provedor baseado em API.
</Tip>

## Relacionados

- [Visão geral do Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com camada gratuita
- [Exa Search](/pt-BR/tools/exa-search) -- busca neural com extração de conteúdo
