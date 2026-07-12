---
read_when:
    - Você quer executar o OpenClaw com um servidor SGLang local
    - Você quer endpoints /v1 compatíveis com a OpenAI usando seus próprios modelos
summary: Execute o OpenClaw com o SGLang (servidor auto-hospedado compatível com a OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T15:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

O SGLang disponibiliza modelos de pesos abertos por meio de uma API HTTP compatível com a OpenAI. O OpenClaw se conecta ao SGLang usando a família de provedores `openai-completions`, com descoberta automática dos modelos disponíveis.

| Propriedade                     | Valor                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| ID do provedor                  | `sglang`                                                            |
| Plugin                          | incluído, `enabledByDefault: true`                                  |
| Variável de ambiente de autenticação | `SGLANG_API_KEY` (qualquer valor não vazio se o servidor não usar autenticação) |
| Sinalizador de integração inicial | `--auth-choice sglang`                                            |
| API                             | compatível com a OpenAI (`openai-completions`)                      |
| URL base padrão                 | `http://127.0.0.1:30000/v1`                                         |
| Espaço reservado do modelo padrão | `sglang/Qwen/Qwen3-8B`                                            |
| Uso durante streaming           | Sim (`supportsStreamingUsage: true`)                                |
| Preços                          | Marcado como externo gratuito (`modelPricing.external: false`)      |

O OpenClaw também **descobre automaticamente** os modelos disponíveis no SGLang quando você adere usando `SGLANG_API_KEY`. Use `sglang/*` em `agents.defaults.models` para manter a descoberta dinâmica quando também configurar uma URL base personalizada do SGLang. Consulte [Descoberta de modelos (provedor implícito)](#model-discovery-implicit-provider) abaixo.

## Primeiros passos

<Steps>
  <Step title="Iniciar o SGLang">
    Inicie o SGLang com um servidor compatível com a OpenAI. Sua URL base deve expor
    endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O SGLang
    geralmente é executado em:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Definir uma chave de API">
    Qualquer valor funciona se nenhuma autenticação estiver configurada no servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Executar a integração inicial ou definir um modelo diretamente">
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

Quando `SGLANG_API_KEY` está definida (ou existe um perfil de autenticação) e você **não**
define `models.providers.sglang`, o OpenClaw consulta:

- `GET http://127.0.0.1:30000/v1/models`

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.sglang` explicitamente, o OpenClaw usará, por
padrão, os modelos declarados. Adicione `"sglang/*": {}` a `agents.defaults.models`
quando quiser que o OpenClaw consulte o endpoint `/models` desse provedor
configurado e inclua todos os modelos SGLang anunciados.
</Note>

## Configuração explícita (modelos manuais)

Use uma configuração explícita quando:

- O SGLang for executado em outro host ou porta.
- Você quiser fixar os valores de `contextWindow`/`maxTokens`.
- Seu servidor exigir uma chave de API real (ou você quiser controlar os cabeçalhos).

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
  <Accordion title="Comportamento no estilo de proxy">
    O SGLang é tratado como um backend `/v1` compatível com a OpenAI no estilo
    de proxy, e não como um endpoint nativo da OpenAI.

    | Comportamento | SGLang |
    |---------------|--------|
    | Formatação de solicitações exclusiva da OpenAI | Não aplicada |
    | `service_tier`, `store` da API Responses, dicas de cache de prompts | Não enviados |
    | Formatação do payload para compatibilidade com raciocínio | Não aplicada |
    | Cabeçalhos ocultos de atribuição (`originator`, `version`, `User-Agent`) | Não injetados em URLs base personalizadas do SGLang |

  </Accordion>

  <Accordion title="Solução de problemas">
    **Servidor inacessível**

    Verifique se o servidor está em execução e respondendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erros de autenticação**

    Se as solicitações falharem com erros de autenticação, defina uma
    `SGLANG_API_KEY` real que corresponda à configuração do servidor ou
    configure o provedor explicitamente em `models.providers.sglang`.

    <Tip>
    Se você executar o SGLang sem autenticação, qualquer valor não vazio para
    `SGLANG_API_KEY` será suficiente para aderir à descoberta de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo entradas de provedores.
  </Card>
</CardGroup>
