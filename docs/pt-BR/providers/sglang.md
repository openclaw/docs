---
read_when:
    - Você quer executar o OpenClaw com um servidor SGLang local
    - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com SGLang (servidor auto-hospedado compatível com OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang serve modelos de peso aberto por meio de uma API HTTP compatível com OpenAI. OpenClaw se conecta ao SGLang usando a família de provedores `openai-completions` com descoberta automática dos modelos disponíveis.

| Propriedade                 | Valor                                                        |
| --------------------------- | ------------------------------------------------------------ |
| ID do provedor              | `sglang`                                                     |
| Plugin                      | incluído, `enabledByDefault: true`                           |
| Variável de ambiente de auth | `SGLANG_API_KEY` (qualquer valor não vazio se o servidor não tiver auth) |
| Flag de onboarding          | `--auth-choice sglang`                                       |
| API                         | compatível com OpenAI (`openai-completions`)                 |
| URL base padrão             | `http://127.0.0.1:30000/v1`                                  |
| Placeholder de modelo padrão | `sglang/Qwen/Qwen3-8B`                                       |
| Uso de streaming            | Sim (`supportsStreamingUsage: true`)                         |
| Preços                      | Marcado como externo gratuito (`modelPricing.external: false`) |

OpenClaw também **descobre automaticamente** os modelos disponíveis do SGLang quando você opta por isso com `SGLANG_API_KEY`. Use `sglang/*` em `agents.defaults.models` para manter a descoberta dinâmica quando você também configura uma URL base personalizada do SGLang. Veja [Descoberta de modelos (provedor implícito)](#model-discovery-implicit-provider) abaixo.

## Primeiros passos

<Steps>
  <Step title="Iniciar o SGLang">
    Inicie o SGLang com um servidor compatível com OpenAI. Sua URL base deve expor
    endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). SGLang
    normalmente é executado em:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Definir uma chave de API">
    Qualquer valor funciona se nenhuma auth estiver configurada no seu servidor:

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

## Descoberta de modelos (provedor implícito)

Quando `SGLANG_API_KEY` está definido (ou existe um perfil de auth) e você **não**
define `models.providers.sglang`, o OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

e converterá os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.sglang` explicitamente, o OpenClaw usará seus
modelos declarados por padrão. Adicione `"sglang/*": {}` a `agents.defaults.models` quando você
quiser que o OpenClaw consulte o endpoint `/models` desse provedor configurado e inclua
todos os modelos SGLang anunciados.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- O SGLang é executado em outro host/porta.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor exige uma chave de API real (ou você quer controlar headers).

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
    SGLang é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
    endpoint nativo da OpenAI.

    | Comportamento | SGLang |
    |----------|--------|
    | Formatação de requisição exclusiva da OpenAI | Não aplicada |
    | `service_tier`, Responses `store`, dicas de cache de prompt | Não enviados |
    | Formatação de payload compatível com reasoning | Não aplicada |
    | Headers de atribuição ocultos (`originator`, `version`, `User-Agent`) | Não injetados em URLs base personalizadas do SGLang |

  </Accordion>

  <Accordion title="Solução de problemas">
    **Servidor inacessível**

    Verifique se o servidor está em execução e respondendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erros de auth**

    Se as requisições falharem com erros de auth, defina um `SGLANG_API_KEY` real que corresponda
    à configuração do seu servidor, ou configure o provedor explicitamente em
    `models.providers.sglang`.

    <Tip>
    Se você executar o SGLang sem autenticação, qualquer valor não vazio para
    `SGLANG_API_KEY` é suficiente para optar pela descoberta de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo entradas de provedor.
  </Card>
</CardGroup>
