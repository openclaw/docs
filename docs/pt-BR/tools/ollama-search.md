---
read_when:
    - Você quer usar o Ollama para web_search
    - Você quer um provedor de web_search sem chave
    - Você quer usar a Pesquisa na Web hospedada do Ollama com OLLAMA_API_KEY
    - Você precisa de orientações para configurar a Pesquisa na Web do Ollama
summary: Pesquisa na web do Ollama por meio de um host local do Ollama ou da API hospedada do Ollama
title: Pesquisa na web do Ollama
x-i18n:
    generated_at: "2026-04-30T10:12:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw oferece suporte a **Pesquisa na Web do Ollama** como um provedor `web_search` integrado. Ele
usa a API de pesquisa na Web do Ollama e retorna resultados estruturados com títulos, URLs
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
  <Step title="Entrar">
    Execute:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Escolher Pesquisa na Web do Ollama">
    Execute:

    ```bash
    openclaw configure --section web
    ```

    Em seguida, selecione **Pesquisa na Web do Ollama** como o provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, a Pesquisa na Web do Ollama reutiliza o mesmo
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

Se você já configura o Ollama como um provedor de modelos, o provedor de pesquisa na Web pode
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

O provedor de modelos Ollama usa `baseUrl` como a chave canônica. O provedor de pesquisa na Web também respeita `baseURL` em `models.providers.ollama` para compatibilidade com exemplos de configuração no estilo do SDK da OpenAI.

Se nenhuma URL base explícita do Ollama estiver definida, o OpenClaw usa `http://127.0.0.1:11434`.

Se o seu host Ollama espera autenticação bearer, o OpenClaw reutiliza
`models.providers.ollama.apiKey` (ou a autenticação correspondente do provedor baseada em env)
para solicitações a esse host configurado.

Pesquisa na Web do Ollama hospedada direta:

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

- Nenhum campo de chave de API específico para pesquisa na Web é necessário para este provedor.
- Se o host Ollama estiver protegido por autenticação, o OpenClaw reutiliza a chave de API
  normal do provedor Ollama quando presente.
- Se `baseUrl` for `https://ollama.com`, o OpenClaw chama
  `https://ollama.com/api/web_search` diretamente e envia a chave de API configurada do Ollama
  como autenticação bearer.
- Se o host configurado não expuser pesquisa na Web e `OLLAMA_API_KEY` estiver definida,
  o OpenClaw poderá recorrer a `https://ollama.com/api/web_search` sem enviar
  essa chave de env ao host local.
- O OpenClaw avisa durante a configuração se o Ollama estiver inacessível ou sem login, mas
  não bloqueia a seleção.
- A detecção automática em runtime pode recorrer à Pesquisa na Web do Ollama quando nenhum provedor
  credenciado de prioridade mais alta estiver configurado.
- Hosts do daemon local do Ollama usam o endpoint de proxy local
  `/api/experimental/web_search`, que assina e encaminha para a Nuvem do Ollama.
- Hosts `https://ollama.com` usam o endpoint público hospedado
  `/api/web_search` diretamente com autenticação por chave de API bearer.

## Relacionado

- [Visão geral da Pesquisa na Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Ollama](/pt-BR/providers/ollama) -- configuração do modelo Ollama e modos em nuvem/local
