---
read_when:
    - Você quer um provedor de pesquisa na web que não exija uma chave de API
    - Você quer usar o DuckDuckGo para web_search
    - Você quer um provedor de pesquisa sem chave selecionado explicitamente
summary: Pesquisa na web do DuckDuckGo -- provedor sem chave (experimental, baseado em HTML)
title: Pesquisa no DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T15:43:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

O OpenClaw oferece suporte ao DuckDuckGo como um provedor `web_search` **sem necessidade de chave**. Nenhuma chave de API ou conta é necessária.

<Warning>
  O DuckDuckGo é uma integração **experimental e não oficial** que extrai dados das páginas HTML de pesquisa sem JavaScript do DuckDuckGo — não é uma API oficial. Esteja preparado para falhas ocasionais causadas por páginas de desafio contra bots ou alterações no HTML.
</Warning>

## Configuração

O DuckDuckGo nunca é selecionado automaticamente, pois a detecção automática considera apenas provedores com credenciais utilizáveis. Defina-o explicitamente:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecione "duckduckgo" como o provedor
    ```
  </Step>
</Steps>

## Configuração

Defina o provedor diretamente na configuração:

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
            region: "us-en", // Código de região do DuckDuckGo
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
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a retornar (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de região do DuckDuckGo (por exemplo, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nível do SafeSearch.
</ParamField>

Os parâmetros `region` e `safeSearch` da ferramenta substituem os valores de configuração do Plugin acima para cada consulta.

## Observações

- **Sem chave de API** — funciona assim que o DuckDuckGo é selecionado como o provedor `web_search`.
- **Experimental** — extrai dados das páginas HTML de pesquisa sem JavaScript do DuckDuckGo, não de uma API ou SDK oficial. Os resultados dependem da estrutura da página, que pode mudar sem aviso prévio.
- **Risco de desafio contra bots** — o DuckDuckGo pode apresentar CAPTCHAs ou bloquear solicitações em caso de uso intenso ou automatizado.
- **Somente seleção explícita** — a detecção automática do OpenClaw considera apenas provedores com credenciais utilizáveis; portanto, um provedor sem necessidade de chave como o DuckDuckGo nunca é escolhido automaticamente. Você deve definir `provider: "duckduckgo"`.
- **O padrão do SafeSearch é `moderate`** quando não está configurado.

<Tip>
  Para uso em produção, considere o [Brave Search](/pt-BR/tools/brave-search) (com plano gratuito disponível) ou outro provedor baseado em API.
</Tip>

## Relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) — todos os provedores e a detecção automática
- [Brave Search](/pt-BR/tools/brave-search) — resultados estruturados com plano gratuito
- [Exa Search](/pt-BR/tools/exa-search) — pesquisa neural com extração de conteúdo
