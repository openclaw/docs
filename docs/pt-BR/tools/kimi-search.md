---
read_when:
    - Você quer usar o Kimi para web_search
    - Você precisa de uma KIMI_API_KEY ou MOONSHOT_API_KEY
summary: Pesquisa na web do Kimi via pesquisa na web da Moonshot
title: Busca do Kimi
x-i18n:
    generated_at: "2026-05-02T21:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw oferece suporte ao Kimi como provedor de `web_search`, usando a pesquisa web da Moonshot para produzir respostas sintetizadas por IA com citações.

## Obtenha uma chave de API

<Steps>
  <Step title="Crie uma chave">
    Obtenha uma chave de API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Armazene a chave">
    Defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway, ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Ao escolher **Kimi** durante `openclaw onboard` ou `openclaw configure --section web`, o OpenClaw também pode solicitar:

- a região da API da Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- o modelo padrão de pesquisa web do Kimi (o padrão é `kimi-k2.6`)

## Configuração

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Se você usa o host da API da China para chat (`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`), o OpenClaw reutiliza esse mesmo host para o `web_search` do Kimi quando `tools.web.search.kimi.baseUrl` é omitido, para que chaves de [platform.moonshot.cn](https://platform.moonshot.cn/) não atinjam o endpoint internacional por engano (que frequentemente retorna HTTP 401). Substitua por `tools.web.search.kimi.baseUrl` quando precisar de uma URL base de pesquisa diferente.

**Alternativa de ambiente:** defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway. Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

Se você omitir `baseUrl`, o OpenClaw usa `https://api.moonshot.ai/v1` por padrão. Se você omitir `model`, o OpenClaw usa `kimi-k2.6` por padrão.

## Como funciona

O Kimi usa a pesquisa web da Moonshot para sintetizar respostas com citações inline, semelhante à abordagem de resposta fundamentada do Gemini e do Grok.

O OpenClaw trata o `web_search` do Kimi como bem-sucedido somente depois que a Moonshot retorna evidência nativa de fundamentação de pesquisa web, como um payload de ferramenta `$web_search` reproduzível, `search_results` ou URLs de citação. Se o Kimi parar imediatamente com uma resposta de chat simples como "I cannot browse the internet" e sem evidência de fundamentação, o OpenClaw retorna um erro estruturado `kimi_web_search_ungrounded` em vez de encapsular esse texto como resultado de pesquisa. Tente a consulta novamente, mude para um provedor estruturado como o Brave, ou use `web_fetch` / a ferramenta de navegador quando você já tiver uma URL de destino.

## Parâmetros compatíveis

A pesquisa do Kimi oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada de `web_search`, mas o Kimi ainda retorna uma resposta sintetizada com citações, em vez de uma lista de N resultados.

Filtros específicos do provedor não são compatíveis no momento.

## Relacionado

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Moonshot AI](/pt-BR/providers/moonshot) -- documentação do modelo Moonshot + provedor Kimi Coding
- [Gemini Search](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via fundamentação do Google
- [Grok Search](/pt-BR/tools/grok-search) -- respostas sintetizadas por IA via fundamentação da xAI
