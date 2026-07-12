---
read_when:
    - Você quer usar o Kimi para `web_search`
    - Você precisa de uma KIMI_API_KEY ou MOONSHOT_API_KEY
summary: Pesquisa na web do Kimi por meio da pesquisa na web do Moonshot
title: Pesquisa Kimi
x-i18n:
    generated_at: "2026-07-12T00:28:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi é um provedor de `web_search` baseado na pesquisa nativa na web da Moonshot. A Moonshot
sintetiza uma única resposta com citações em linha, de forma semelhante aos provedores de
respostas fundamentadas do Gemini e do Grok, em vez de retornar uma lista de resultados classificados.

## Configuração

<Steps>
  <Step title="Criar uma chave">
    Obtenha uma chave de API na [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Armazenar a chave">
    Defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway (para uma
    instalação do Gateway, adicione-a a `~/.openclaw/.env`) ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Escolher **Kimi** durante `openclaw onboard` ou `openclaw configure --section web`
também solicita:

- a região da API da Moonshot: `https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`
- o modelo de pesquisa na web (o padrão é `kimi-k2.6`)

## Configuração

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcional se KIMI_API_KEY ou MOONSHOT_API_KEY estiver definida
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

`tools.web.search.provider` é detectado automaticamente com base nas chaves de API disponíveis quando omitido;
defina-o explicitamente como `kimi` se houver várias credenciais de pesquisa configuradas.

A forma equivalente com escopo em `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
também funciona; ambas as estruturas são mescladas na mesma configuração resolvida.

Padrões: quando omitido, `baseUrl` usa `https://api.moonshot.ai/v1` por padrão e `model`
usa `kimi-k2.6` por padrão.

Se o tráfego de chat usar o host da China (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), o `web_search` do Kimi reutilizará esse host automaticamente
quando seu próprio `baseUrl` não estiver definido, para que chaves `.cn` não acessem acidentalmente o
endpoint internacional (que retorna HTTP 401 para essas chaves). Defina um
`baseUrl` explícito para o Kimi a fim de substituir essa herança.

## Requisito de fundamentação

O OpenClaw só retorna um resultado de `web_search` do Kimi depois que a resposta da Moonshot
inclui evidências nativas de fundamentação em pesquisa na web, como a reprodução de uma chamada
à ferramenta `$web_search`, `search_results` ou URLs de citações. Se o Kimi responder diretamente sem
fundamentação (por exemplo, "Não consigo navegar na internet"), o OpenClaw retornará um erro
`kimi_web_search_ungrounded` em vez de tratar esse texto como resultado de pesquisa.
Tente a consulta novamente, mude para um provedor estruturado, como o Brave, ou use
`web_fetch` / a ferramenta de navegador quando você já tiver uma URL de destino.

## Parâmetros da ferramenta

| Parâmetro                                                       | Compatível                                                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Sim                                                                                                                              |
| `count`                                                         | Aceito para compatibilidade entre provedores, mas ignorado: o Kimi sempre retorna uma resposta sintetizada, não uma lista com N resultados |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Não                                                                                                                              |

## Relacionados

- [Visão geral da pesquisa na web](/pt-BR/tools/web) - todos os provedores e a detecção automática
- [Moonshot AI](/pt-BR/providers/moonshot) - documentação do modelo da Moonshot e do provedor Kimi Coding
- [Pesquisa do Gemini](/pt-BR/tools/gemini-search) - respostas sintetizadas por IA por meio da fundamentação do Google
- [Pesquisa do Grok](/pt-BR/tools/grok-search) - respostas sintetizadas por IA por meio da fundamentação da xAI
