---
read_when:
- You want to run OpenClaw against a local SGLang server
- Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Executar o OpenClaw com SGLang (servidor auto-hospedado compatível com OpenAI)
title: SGLang
x-i18n:
  generated_at: '2026-04-24T06:09:12Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
  source_path: providers/sglang.md
  workflow: 15
---

O SGLang pode servir modelos open-source por meio de uma API HTTP **compatível com OpenAI**.
O OpenClaw pode se conectar ao SGLang usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** modelos disponíveis no SGLang quando você faz opt-in
com `SGLANG_API_KEY` (qualquer valor funciona se seu servidor não exigir autenticação)
e você não define uma entrada explícita `models.providers.sglang`.

O OpenClaw trata `sglang` como um provider local compatível com OpenAI que oferece suporte
a contabilização de uso em streaming, então contagens de status/tokens de contexto podem ser atualizadas a partir de respostas `stream_options.include_usage`.

## Primeiros passos

<Steps>
  <Step title="Iniciar o SGLang">
    Inicie o SGLang com um servidor compatível com OpenAI. Sua base URL deve expor
    endpoints `/v1` (por exemplo `/v1/models`, `/v1/chat/completions`). O SGLang
    normalmente roda em:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Definir uma chave de API">
    Qualquer valor funciona se nenhuma autenticação estiver configurada no seu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Executar o onboarding ou definir um modelo diretamente">
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

## Descoberta de modelo (provider implícito)

Quando `SGLANG_API_KEY` está definido (ou existe um perfil de autenticação) e você **não**
define `models.providers.sglang`, o OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

e converterá os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.sglang` explicitamente, a descoberta automática é ignorada e
você deve definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- O SGLang roda em outro host/porta.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor exige uma chave de API real (ou você quer controlar cabeçalhos).

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
  <Accordion title="Comportamento em estilo proxy">
    O SGLang é tratado como um backend `/v1` compatível com OpenAI em estilo proxy, não como um
    endpoint nativo da OpenAI.

    | Comportamento | SGLang |
    |----------|--------|
    | Formatação de requisição apenas da OpenAI | Não aplicada |
    | `service_tier`, `store` do Responses, hints de cache de prompt | Não enviados |
    | Formatação de payload compatível com reasoning | Não aplicada |
    | Cabeçalhos ocultos de atribuição (`originator`, `version`, `User-Agent`) | Não são injetados em base URLs SGLang personalizadas |

  </Accordion>

  <Accordion title="Solução de problemas">
    **Servidor inacessível**

    Verifique se o servidor está em execução e respondendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erros de autenticação**

    Se as requisições falharem com erros de autenticação, defina uma `SGLANG_API_KEY` real que corresponda
    à configuração do seu servidor, ou configure o provider explicitamente em
    `models.providers.sglang`.

    <Tip>
    Se você executa o SGLang sem autenticação, qualquer valor não vazio para
    `SGLANG_API_KEY` é suficiente para fazer opt-in da descoberta de modelo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração, incluindo entradas de provider.
  </Card>
</CardGroup>
