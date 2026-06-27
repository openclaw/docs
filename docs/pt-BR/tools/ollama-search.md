---
read_when:
    - Você quer usar o Ollama para web_search
    - Você quer um provedor de web_search sem chave
    - Você quer usar a Pesquisa Web hospedada do Ollama com OLLAMA_API_KEY
    - Você precisa da orientação de configuração da Busca na Web do Ollama
summary: Pesquisa na Web do Ollama por meio de um host local do Ollama ou da API hospedada do Ollama
title: Busca na web do Ollama
x-i18n:
    generated_at: "2026-06-27T18:17:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

O OpenClaw oferece suporte à **Pesquisa Web do Ollama** como um provedor `web_search` integrado. Ele
usa a API de pesquisa web do Ollama e retorna resultados estruturados com títulos, URLs
e trechos.

Para Ollama local ou auto-hospedado, essa configuração não precisa de uma chave de API por
padrão. Ela exige:

- um host Ollama acessível pelo OpenClaw
- `ollama signin`

Para pesquisa hospedada direta, defina a URL base do provedor Ollama como `https://ollama.com`
e forneça uma `OLLAMA_API_KEY` real.

## Configuração

<Steps>
  <Step title="Iniciar o Ollama">
    Certifique-se de que o Ollama esteja instalado e em execução.
  </Step>
  <Step title="Fazer login">
    Execute:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Escolher a Pesquisa Web do Ollama">
    Execute:

    ```bash
    openclaw configure --section web
    ```

    Em seguida, selecione **Pesquisa Web do Ollama** como o provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, a Pesquisa Web do Ollama reutiliza o mesmo
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

Substituição opcional do host Ollama:

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

Se você já configura o Ollama como provedor de modelos, o provedor de pesquisa web pode
reutilizar esse host:

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

O provedor de modelos Ollama usa `baseUrl` como a chave canônica. O provedor de pesquisa web também respeita `baseURL` em `models.providers.ollama` para compatibilidade com exemplos de configuração no estilo do SDK da OpenAI.

Se nenhuma URL base explícita do Ollama for definida, o OpenClaw usa `http://127.0.0.1:11434`.

Se o host Ollama espera autenticação bearer, o OpenClaw reutiliza
`models.providers.ollama.apiKey` (ou a autenticação de provedor correspondente baseada em env)
para solicitações a esse host configurado.

Pesquisa Web do Ollama hospedada direta:

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

## Observações

- Nenhum campo de chave de API específico de pesquisa web é necessário para este provedor.
- Se o host Ollama estiver protegido por autenticação, o OpenClaw reutiliza a chave de API normal do
  provedor Ollama quando presente.
- Se `baseUrl` for `https://ollama.com`, o OpenClaw chama
  `https://ollama.com/api/web_search` diretamente e envia a chave de API Ollama configurada
  como autenticação bearer.
- Se o host configurado não expuser pesquisa web e `OLLAMA_API_KEY` estiver definida,
  o OpenClaw pode recorrer a `https://ollama.com/api/web_search` sem enviar
  essa chave env para o host local.
- O OpenClaw avisa durante a configuração se o Ollama estiver inacessível ou sem login, mas
  não bloqueia a seleção.
- O OpenClaw não seleciona automaticamente a Pesquisa Web do Ollama quando nenhum provedor credenciado
  de prioridade mais alta está configurado; escolha-o explicitamente com
  `tools.web.search.provider: "ollama"`.
- Hosts do daemon local do Ollama usam o endpoint de proxy local
  `/api/experimental/web_search`, que assina e encaminha para a Nuvem Ollama.
- Hosts `https://ollama.com` usam o endpoint hospedado público
  `/api/web_search` diretamente com autenticação bearer por chave de API.

## Relacionados

- [Visão geral da Pesquisa Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Ollama](/pt-BR/providers/ollama) -- configuração de modelos Ollama e modos em nuvem/local
