---
read_when:
    - Você quer usar o Ollama para `web_search`
    - Você quer um provedor `web_search` sem chave
    - Você precisa de orientação de configuração do Ollama Web Search
summary: Ollama Web Search pelo host Ollama configurado por você
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-24T06:17:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao **Ollama Web Search** como provedor `web_search` empacotado.
Ele usa a API experimental de web search do Ollama e retorna resultados estruturados
com títulos, URLs e snippets.

Ao contrário do provedor de modelo Ollama, essa configuração não exige uma chave de API por
padrão. Ela exige:

- um host Ollama acessível a partir do OpenClaw
- `ollama signin`

## Configuração

<Steps>
  <Step title="Iniciar o Ollama">
    Certifique-se de que o Ollama está instalado e em execução.
  </Step>
  <Step title="Fazer login">
    Execute:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Escolher Ollama Web Search">
    Execute:

    ```bash
    openclaw configure --section web
    ```

    Depois selecione **Ollama Web Search** como provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, o Ollama Web Search reutiliza o mesmo
host configurado.

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Sobrescrita opcional de host Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Se nenhuma base URL explícita do Ollama estiver definida, o OpenClaw usa `http://127.0.0.1:11434`.

Se o seu host Ollama esperar autenticação bearer, o OpenClaw reutiliza
`models.providers.ollama.apiKey` (ou a autenticação do provedor correspondente baseada em env)
também para requests de web search.

## Observações

- Nenhum campo específico de chave de API de web search é exigido para este provedor.
- Se o host Ollama for protegido por autenticação, o OpenClaw reutiliza a chave de API normal do provedor
  Ollama quando presente.
- O OpenClaw avisa durante a configuração se o Ollama estiver inacessível ou sem login, mas
  não bloqueia a seleção.
- A autodetecção em tempo de execução pode usar Ollama Web Search como fallback quando nenhum provedor
  autenticado de prioridade mais alta estiver configurado.
- O provedor usa o endpoint experimental `/api/experimental/web_search`
  do Ollama.

## Relacionados

- [Web Search overview](/pt-BR/tools/web) -- todos os provedores e autodetecção
- [Ollama](/pt-BR/providers/ollama) -- configuração de modelo Ollama e modos cloud/local
