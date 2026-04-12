---
read_when:
    - Você quer executar o OpenClaw com um servidor local SGLang
    - Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com SGLang (servidor self-hosted compatível com OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:32:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

O SGLang pode servir modelos open-source por meio de uma API HTTP **compatível com OpenAI**.
O OpenClaw pode se conectar ao SGLang usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** modelos disponíveis no SGLang quando você opta
por isso com `SGLANG_API_KEY` (qualquer valor funciona se o seu servidor não exigir autenticação)
e você não define uma entrada explícita `models.providers.sglang`.

## Primeiros passos

<Steps>
  <Step title="Inicie o SGLang">
    Inicie o SGLang com um servidor compatível com OpenAI. Sua URL base deve expor
    endpoints `/v1` (por exemplo `/v1/models`, `/v1/chat/completions`). O SGLang
    normalmente é executado em:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Defina uma chave de API">
    Qualquer valor funciona se nenhuma autenticação estiver configurada no seu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Execute o onboarding ou defina um modelo diretamente">
    ```bash
    openclaw onboard
    ```

    Ou configure o modelo manualmente:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Descoberta de modelos (provider implícito)

Quando `SGLANG_API_KEY` está definido (ou existe um perfil de autenticação) e você **não**
define `models.providers.sglang`, o OpenClaw consulta:

- `GET http://127.0.0.1:30000/v1/models`

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.sglang` explicitamente, a descoberta automática será ignorada e
você precisará definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o SGLang estiver em outro host/porta.
- você quiser fixar valores de `contextWindow`/`maxTokens`.
- seu servidor exigir uma chave de API real (ou você quiser controlar os headers).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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
  <Accordion title="Comportamento no estilo proxy">
    O SGLang é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
    endpoint nativo da OpenAI.

    | Comportamento | SGLang |
    |----------|--------|
    | Modelagem de solicitação exclusiva da OpenAI | Não aplicada |
    | `service_tier`, `store` do Responses, dicas de cache de prompt | Não enviados |
    | Modelagem de payload compatível com raciocínio | Não aplicada |
    | Headers ocultos de atribuição (`originator`, `version`, `User-Agent`) | Não injetados em URLs base personalizadas do SGLang |

  </Accordion>

  <Accordion title="Solução de problemas">
    **Servidor inacessível**

    Verifique se o servidor está em execução e respondendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erros de autenticação**

    Se as solicitações falharem com erros de autenticação, defina um `SGLANG_API_KEY` real que corresponda
    à configuração do seu servidor, ou configure o provider explicitamente em
    `models.providers.sglang`.

    <Tip>
    Se você executar o SGLang sem autenticação, qualquer valor não vazio para
    `SGLANG_API_KEY` é suficiente para optar pela descoberta de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração, incluindo entradas de provider.
  </Card>
</CardGroup>
