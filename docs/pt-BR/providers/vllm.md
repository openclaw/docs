---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-12T23:33:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a43be9ae879158fcd69d50fb3a47616fd560e3c6fe4ecb3a109bdda6a63a6a80
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

O vLLM pode servir modelos open-source (e alguns modelos personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis no vLLM quando você optar por isso com `VLLM_API_KEY` (qualquer valor funciona se o seu servidor não exigir auth) e você não definir uma entrada explícita `models.providers.vllm`.

| Propriedade      | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID do provedor   | `vllm`                                   |
| API              | `openai-completions` (compatível com OpenAI) |
| Auth             | variável de ambiente `VLLM_API_KEY`      |
| Base URL padrão  | `http://127.0.0.1:8000/v1`               |

## Primeiros passos

<Steps>
  <Step title="Inicie o vLLM com um servidor compatível com OpenAI">
    Sua base URL deve expor endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O vLLM costuma ser executado em:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Defina a variável de ambiente da chave de API">
    Qualquer valor funciona se o seu servidor não exigir auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecione um modelo">
    Substitua por um dos IDs de modelo do seu vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definido (ou existe um perfil de auth) e você **não** define `models.providers.vllm`, o OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM estiver em execução em outro host ou porta
- você quiser fixar valores de `contextWindow` ou `maxTokens`
- o seu servidor exigir uma chave de API real (ou você quiser controlar cabeçalhos)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modelo local do vLLM",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Observações avançadas

<AccordionGroup>
  <Accordion title="Comportamento no estilo proxy">
    O vLLM é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um endpoint nativo
    da OpenAI. Isso significa:

    | Comportamento | Aplicado? |
    |----------|----------|
    | Formatação nativa de solicitação da OpenAI | Não |
    | `service_tier` | Não é enviado |
    | Responses `store` | Não é enviado |
    | Dicas de cache de prompt | Não são enviadas |
    | Formatação de payload de compatibilidade de reasoning da OpenAI | Não é aplicada |
    | Cabeçalhos ocultos de atribuição do OpenClaw | Não são injetados em base URLs personalizadas |

  </Accordion>

  <Accordion title="Base URL personalizada">
    Se o seu servidor vLLM estiver em execução em um host ou porta fora do padrão, defina `baseUrl` na configuração explícita do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Modelo remoto do vLLM",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Servidor inacessível">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se você vir um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado no modo de servidor compatível com OpenAI.

  </Accordion>

  <Accordion title="Erros de auth nas solicitações">
    Se as solicitações falharem com erros de auth, defina um `VLLM_API_KEY` real que corresponda à configuração do seu servidor ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o seu servidor vLLM não exigir auth, qualquer valor não vazio para `VLLM_API_KEY` funciona como sinal de ativação para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definido **e** que não exista uma entrada de configuração explícita `models.providers.vllm`. Se você definiu o provedor manualmente, o OpenClaw ignora a descoberta e usa apenas os modelos declarados por você.
  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor nativo da OpenAI e comportamento de rotas compatíveis com OpenAI.
  </Card>
  <Card title="OAuth e auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de auth e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
