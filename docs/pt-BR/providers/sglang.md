---
read_when:
    - Você quer executar o OpenClaw com um servidor SGLang local
    - Você quer endpoints /v1 compatíveis com OpenAI para seus próprios modelos
summary: Execute o OpenClaw com SGLang (servidor auto-hospedado compatível com OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:11:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang serve modelos de pesos abertos por meio de uma API HTTP compatível com OpenAI. O OpenClaw se conecta ao SGLang usando a família de provedores `openai-completions` com descoberta automática dos modelos disponíveis.

| Propriedade               | Valor                                                        |
| ------------------------- | ------------------------------------------------------------ |
| ID do provedor            | `sglang`                                                     |
| Plugin                    | incluído, `enabledByDefault: true`                           |
| Variável de ambiente de autenticação | `SGLANG_API_KEY` (qualquer valor não vazio se o servidor não tiver autenticação) |
| Sinalizador de integração inicial | `--auth-choice sglang`                                       |
| API                       | compatível com OpenAI (`openai-completions`)                 |
| URL base padrão           | `http://127.0.0.1:30000/v1`                                  |
| Espaço reservado do modelo padrão | `sglang/Qwen/Qwen3-8B`                                       |
| Uso de streaming          | Sim (`supportsStreamingUsage: true`)                         |
| Precificação              | Marcado como externo gratuito (`modelPricing.external: false`) |

O OpenClaw também **descobre automaticamente** os modelos disponíveis do SGLang quando você adere com `SGLANG_API_KEY` e não define uma entrada explícita `models.providers.sglang` — veja [Descoberta de modelos (provedor implícito)](#model-discovery-implicit-provider) abaixo.

## Primeiros passos

<Steps>
  <Step title="Inicie o SGLang">
    Inicie o SGLang com um servidor compatível com OpenAI. Sua URL base deve expor
    endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O SGLang
    geralmente roda em:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Defina uma chave de API">
    Qualquer valor funciona se nenhuma autenticação estiver configurada no seu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Execute a integração inicial ou defina um modelo diretamente">
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

## Descoberta de modelos (provedor implícito)

Quando `SGLANG_API_KEY` está definido (ou existe um perfil de autenticação) e você **não**
define `models.providers.sglang`, o OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

e converterá os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.sglang` explicitamente, a descoberta automática será ignorada e
você deverá definir os modelos manualmente.
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
  <Accordion title="Comportamento no estilo proxy">
    O SGLang é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
    endpoint nativo da OpenAI.

    | Comportamento | SGLang |
    |----------|--------|
    | Formatação de solicitação exclusiva da OpenAI | Não aplicada |
    | `service_tier`, `store` de Responses, dicas de cache de prompt | Não enviados |
    | Formatação de payload compatível com raciocínio | Não aplicada |
    | Cabeçalhos de atribuição ocultos (`originator`, `version`, `User-Agent`) | Não injetados em URLs base personalizadas do SGLang |

  </Accordion>

  <Accordion title="Solução de problemas">
    **Servidor inacessível**

    Verifique se o servidor está em execução e respondendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erros de autenticação**

    Se as solicitações falharem com erros de autenticação, defina um `SGLANG_API_KEY` real que corresponda
    à configuração do seu servidor, ou configure o provedor explicitamente em
    `models.providers.sglang`.

    <Tip>
    Se você executar o SGLang sem autenticação, qualquer valor não vazio para
    `SGLANG_API_KEY` é suficiente para aderir à descoberta de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo entradas de provedor.
  </Card>
</CardGroup>
