---
read_when:
    - Você quer rotear o OpenClaw por um proxy LiteLLM
    - Você precisa de rastreamento de custos, logging ou roteamento de modelos pelo LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e rastreamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T06:07:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) é um gateway de LLM open source que fornece uma API unificada para mais de 100 providers de modelo. Roteie o OpenClaw pelo LiteLLM para obter rastreamento centralizado de custos, logging e a flexibilidade de trocar backends sem alterar sua configuração do OpenClaw.

<Tip>
**Por que usar LiteLLM com OpenClaw?**

- **Rastreamento de custos** — Veja exatamente quanto o OpenClaw gasta em todos os modelos
- **Roteamento de modelos** — Alterne entre Claude, GPT-4, Gemini, Bedrock sem mudanças de configuração
- **Chaves virtuais** — Crie chaves com limites de gasto para o OpenClaw
- **Logging** — Logs completos de solicitação/resposta para depuração
- **Fallbacks** — Failover automático se seu provider principal estiver indisponível

</Tip>

## Início rápido

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Melhor para:** caminho mais rápido para uma configuração LiteLLM funcional.

    <Steps>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuração manual">
    **Melhor para:** controle total sobre instalação e configuração.

    <Steps>
      <Step title="Iniciar o LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Apontar o OpenClaw para o LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        É só isso. O OpenClaw agora passa pelo LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração

### Variáveis de ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Arquivo de configuração

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

## Configuração avançada

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

  <Accordion title="Roteamento de modelos">
    O LiteLLM pode rotear solicitações de modelo para diferentes backends. Configure no `config.yaml` do seu LiteLLM:

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
    - O OpenClaw conecta-se pelo endpoint `/v1` no estilo proxy compatível com OpenAI do LiteLLM
    - A modelagem de requisições exclusiva da OpenAI nativa não se aplica pelo LiteLLM:
      sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio da OpenAI
    - Headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em base URLs personalizadas do LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para configuração geral de provider e comportamento de failover, consulte [Providers de modelo](/pt-BR/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Documentação do LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentação oficial do LiteLLM e referência da API.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
</CardGroup>
