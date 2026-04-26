---
read_when:
    - Você quer usar o Ollama para `web_search`
    - Você quer um provedor de `web_search` sem chave
    - Você precisa de orientações de configuração da pesquisa na web do Ollama
summary: Pesquisa na web do Ollama por meio do host Ollama configurado por você
title: Pesquisa na web do Ollama
x-i18n:
    generated_at: "2026-04-26T11:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

O OpenClaw oferece suporte à **Pesquisa na Web do Ollama** como um provedor `web_search` incluído. Ele usa a API de pesquisa na web do Ollama e retorna resultados estruturados com títulos, URLs e snippets.

Ao contrário do provedor de modelos do Ollama, essa configuração não precisa de uma chave de API por padrão. Ela requer:

- um host do Ollama que seja acessível a partir do OpenClaw
- `ollama signin`

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
  <Step title="Escolher Pesquisa na Web do Ollama">
    Execute:

    ```bash
    openclaw configure --section web
    ```

    Em seguida, selecione **Pesquisa na Web do Ollama** como provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, a Pesquisa na Web do Ollama reutiliza o mesmo host configurado.

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

Substituição opcional do host do Ollama:

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

Se nenhuma URL base explícita do Ollama estiver definida, o OpenClaw usa `http://127.0.0.1:11434`.

Se o seu host do Ollama esperar autenticação bearer, o OpenClaw reutiliza `models.providers.ollama.apiKey` (ou a autenticação do provedor correspondente baseada em variável de ambiente) também para solicitações de pesquisa na web.

## Observações

- Nenhum campo de chave de API específico para pesquisa na web é necessário para este provedor.
- Se o host do Ollama estiver protegido por autenticação, o OpenClaw reutiliza a chave de API normal do provedor Ollama quando presente.
- O OpenClaw avisa durante a configuração se o Ollama estiver inacessível ou sem login, mas não bloqueia a seleção.
- A detecção automática em tempo de execução pode recorrer à Pesquisa na Web do Ollama quando nenhum provedor com credenciais de prioridade mais alta estiver configurado.
- O provedor usa o endpoint `/api/web_search` do Ollama.

## Relacionado

- [Visão geral da pesquisa na web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Ollama](/pt-BR/providers/ollama) -- configuração de modelo do Ollama e modos nuvem/local
