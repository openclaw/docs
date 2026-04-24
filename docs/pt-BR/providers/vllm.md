---
read_when:
    - Você quer executar o OpenClaw contra um servidor local vLLM
    - Você quer endpoints `/v1` compatíveis com OpenAI usando seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T06:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM pode servir modelos open-source (e alguns personalizados) via uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** modelos disponíveis do vLLM quando você adere com `VLLM_API_KEY` (qualquer valor funciona se seu servidor não exigir autenticação) e você não define uma entrada explícita `models.providers.vllm`.

O OpenClaw trata `vllm` como um provedor local compatível com OpenAI que oferece suporte a contabilização de uso em streaming, então contagens de tokens de status/contexto podem ser atualizadas a partir de respostas `stream_options.include_usage`.

| Propriedade       | Valor                                    |
| ----------------- | ---------------------------------------- |
| ID do provedor    | `vllm`                                   |
| API               | `openai-completions` (compatível com OpenAI) |
| Autenticação      | variável de ambiente `VLLM_API_KEY`      |
| Base URL padrão   | `http://127.0.0.1:8000/v1`               |

## Primeiros passos

<Steps>
  <Step title="Inicie o vLLM com um servidor compatível com OpenAI">
    Sua base URL deve expor endpoints `/v1` (por exemplo `/v1/models`, `/v1/chat/completions`). O vLLM normalmente roda em:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Defina a variável de ambiente da chave de API">
    Qualquer valor funciona se seu servidor não exigir autenticação:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecione um modelo">
    Substitua por um dos seus IDs de modelo do vLLM:

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

## Descoberta de modelo (provedor implícito)

Quando `VLLM_API_KEY` está definido (ou existe um perfil de autenticação) e você **não** define `models.providers.vllm`, o OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, a descoberta automática será ignorada e você deverá definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM roda em outro host ou porta
- você quer fixar valores de `contextWindow` ou `maxTokens`
- seu servidor exige uma chave de API real (ou você quer controlar headers)

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
            name: "Modelo local vLLM",
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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento estilo proxy">
    O vLLM é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
    endpoint OpenAI nativo. Isso significa:

    | Comportamento | Aplicado? |
    |---------------|-----------|
    | Formatação nativa de request da OpenAI | Não |
    | `service_tier` | Não enviado |
    | Responses `store` | Não enviado |
    | Dicas de prompt-cache | Não enviadas |
    | Formatação de payload de compatibilidade com reasoning da OpenAI | Não aplicada |
    | Headers ocultos de atribuição do OpenClaw | Não injetados em base URLs personalizadas |

  </Accordion>

  <Accordion title="Base URL personalizada">
    Se seu servidor vLLM roda em um host ou porta diferente do padrão, defina `baseUrl` na configuração explícita do provedor:

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
                name: "Modelo remoto vLLM",
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

    Se aparecer um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado com o modo de servidor compatível com OpenAI.

  </Accordion>

  <Accordion title="Erros de autenticação em requests">
    Se requests falharem com erros de autenticação, defina um `VLLM_API_KEY` real que corresponda à configuração do seu servidor ou configure explicitamente o provedor em `models.providers.vllm`.

    <Tip>
    Se o seu servidor vLLM não exigir autenticação, qualquer valor não vazio para `VLLM_API_KEY` funciona como sinal de adesão para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definido **e** que não exista entrada explícita de configuração `models.providers.vllm`. Se você definiu o provedor manualmente, o OpenClaw ignora a descoberta e usa apenas os modelos declarados por você.
  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Troubleshooting](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor OpenAI nativo e comportamento de rota compatível com OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
