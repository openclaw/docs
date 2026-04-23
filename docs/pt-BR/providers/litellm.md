---
read_when:
    - Você quer rotear o OpenClaw por meio de um proxy LiteLLM
    - Você precisa de rastreamento de custos, logging ou roteamento de modelo por meio do LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e rastreamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T14:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) é um gateway LLM open-source que fornece uma API unificada para mais de 100 providers de modelo. Roteie o OpenClaw por meio do LiteLLM para obter rastreamento centralizado de custos, logging e a flexibilidade de trocar backends sem alterar sua config do OpenClaw.

<Tip>
**Por que usar LiteLLM com o OpenClaw?**

- **Rastreamento de custos** — Veja exatamente quanto o OpenClaw gasta em todos os modelos
- **Roteamento de modelo** — Alterne entre Claude, GPT-4, Gemini, Bedrock sem mudanças de config
- **Chaves virtuais** — Crie chaves com limites de gasto para o OpenClaw
- **Logging** — Logs completos de requisição/resposta para depuração
- **Fallbacks** — Failover automático se seu provider principal estiver fora do ar

</Tip>

## Início rápido

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Melhor para:** caminho mais rápido para uma configuração LiteLLM funcional.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuração manual">
    **Melhor para:** controle total sobre instalação e config.

    <Steps>
      <Step title="Inicie o LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Aponte o OpenClaw para o LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        É só isso. O OpenClaw agora roteia por meio do LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração

### Variáveis de ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Arquivo de config

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Tópicos avançados

<AccordionGroup>
  <Accordion title="Chaves virtuais">
    Crie uma chave dedicada para o OpenClaw com limites de gasto:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Use a chave gerada como `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Roteamento de modelo">
    O LiteLLM pode rotear solicitações de modelo para diferentes backends. Configure em seu `config.yaml` do LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    O OpenClaw continua solicitando `claude-opus-4-6` — o LiteLLM cuida do roteamento.

  </Accordion>

  <Accordion title="Visualizando uso">
    Verifique o dashboard ou a API do LiteLLM:

    ```bash
    # Informações da chave
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Logs de gasto
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Observações sobre o comportamento do proxy">
    - O LiteLLM é executado em `http://localhost:4000` por padrão
    - O OpenClaw se conecta por meio do endpoint `/v1`
      compatível com OpenAI no estilo proxy do LiteLLM
    - A modelagem nativa de requisição exclusiva da OpenAI não se aplica por meio do LiteLLM:
      sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de carga compatível com reasoning da OpenAI
    - Headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para configuração geral de providers e comportamento de failover, consulte [Providers de modelo](/pt-BR/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Docs do LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentação oficial do LiteLLM e referência de API.
  </Card>
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de config.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
</CardGroup>
