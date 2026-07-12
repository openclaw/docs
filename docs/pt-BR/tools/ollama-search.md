---
read_when:
    - Você quer usar o Ollama para `web_search`
    - Você quer um provedor de web_search que não exija chave
    - Você quer usar o Ollama Web Search hospedado com OLLAMA_API_KEY
    - Você precisa de orientações para configurar a Pesquisa Web do Ollama
summary: Pesquisa na Web do Ollama por meio de um host local do Ollama ou da API hospedada do Ollama
title: Pesquisa na web do Ollama
x-i18n:
    generated_at: "2026-07-12T00:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

O OpenClaw oferece suporte à **Pesquisa na Web do Ollama** como um provedor `web_search` integrado,
retornando títulos, URLs e trechos da API de pesquisa na web do Ollama.

Por padrão, o Ollama local/auto-hospedado não precisa de chave de API; ele requer um
host Ollama acessível e a execução de `ollama signin`. A pesquisa hospedada direta (sem Ollama local) requer
`baseUrl: "https://ollama.com"` e uma `OLLAMA_API_KEY` válida.

## Configuração

<Steps>
  <Step title="Iniciar o Ollama">
    Verifique se o Ollama está instalado e em execução.
  </Step>
  <Step title="Fazer login">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Escolher a Pesquisa na Web do Ollama">
    ```bash
    openclaw configure --section web
    ```

    Selecione **Ollama Web Search** como provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, a Pesquisa na Web do Ollama reutiliza o mesmo
host configurado.

<Note>
  O OpenClaw nunca seleciona automaticamente a Pesquisa na Web do Ollama em vez de um provedor
  com credenciais e de prioridade mais alta; você deve escolhê-la explicitamente com
  `tools.web.search.provider: "ollama"`.
</Note>

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

Substituição opcional do host, limitada apenas à pesquisa na web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Ou reutilize o host já configurado para o provedor de modelos Ollama:

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

`models.providers.ollama.baseUrl` é a chave canônica; o provedor de pesquisa
na web também aceita `baseURL` nesse local para compatibilidade com exemplos de configuração
no estilo do SDK da OpenAI. Se nada estiver definido, o OpenClaw usará como padrão
`http://127.0.0.1:11434`.

Pesquisa na Web do Ollama hospedada diretamente (sem Ollama local):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Autenticação e roteamento de solicitações

- Não existe um campo de chave de API específico para pesquisa na web; o provedor reutiliza
  `models.providers.ollama.apiKey` (ou a autenticação correspondente do provedor baseada em variável de ambiente)
  quando o host configurado é protegido por autenticação.
- Ordem de resolução do host: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (ou `baseURL`) → `http://127.0.0.1:11434`.
- Se o host resolvido for `https://ollama.com`, o OpenClaw chamará
  `https://ollama.com/api/web_search` diretamente, usando a chave de API como autenticação
  do tipo bearer.
- Caso contrário, o OpenClaw chamará primeiro o endpoint de proxy local
  `/api/experimental/web_search` (que assina e encaminha a solicitação para o Ollama
  Cloud) e, em seguida, usará como alternativa `/api/web_search` no mesmo host. Se ambos falharem
  e `OLLAMA_API_KEY` estiver definida, ele tentará novamente uma vez em
  `https://ollama.com/api/web_search` com essa chave — sem enviá-la ao
  host local.
- Durante a configuração, o OpenClaw exibirá um aviso se o Ollama estiver inacessível ou se o login não tiver sido feito, mas
  não impedirá a seleção do provedor.

## Conteúdo relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Ollama](/pt-BR/providers/ollama) -- configuração de modelos Ollama e modos locais/na nuvem
