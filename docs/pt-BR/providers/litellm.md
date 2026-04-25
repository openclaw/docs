---
read_when:
    - Você quer rotear o OpenClaw por meio de um proxy LiteLLM
    - Você precisa de rastreamento de custos, logging ou roteamento de modelos por meio do LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e rastreamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) é um gateway de LLM open source que fornece uma API unificada para mais de 100 provedores de modelo. Roteie o OpenClaw por meio do LiteLLM para obter rastreamento centralizado de custos, logging e a flexibilidade de alternar backends sem mudar sua configuração do OpenClaw.

<Tip>
**Por que usar LiteLLM com OpenClaw?**

- **Rastreamento de custos** — Veja exatamente quanto o OpenClaw gasta em todos os modelos
- **Roteamento de modelos** — Alterne entre Claude, GPT-4, Gemini e Bedrock sem mudanças de configuração
- **Chaves virtuais** — Crie chaves com limites de gasto para o OpenClaw
- **Logging** — Logs completos de requisição/resposta para depuração
- **Fallbacks** — Failover automático se seu provedor principal ficar indisponível

</Tip>

## Início rápido

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** o caminho mais rápido para uma configuração funcional do LiteLLM.

    <Steps>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuração manual">
    **Ideal para:** controle total sobre instalação e configuração.

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

        É só isso. O OpenClaw agora faz o roteamento por meio do LiteLLM.
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

### Geração de imagem

O LiteLLM também pode servir de backend para a ferramenta `image_generate` por meio de rotas compatíveis com OpenAI
`/images/generations` e `/images/edits`. Configure um modelo de imagem do LiteLLM
em `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

URLs de LiteLLM em loopback, como `http://localhost:4000`, funcionam sem uma
sobrescrita global de rede privada. Para um proxy hospedado em LAN, defina
`models.providers.litellm.request.allowPrivateNetwork: true`, porque a chave de API
será enviada ao host de proxy configurado.

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
    O LiteLLM pode rotear requisições de modelo para diferentes backends. Configure no seu `config.yaml` do LiteLLM:

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

  <Accordion title="Visualizando o uso">
    Verifique o painel ou a API do LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Observações sobre o comportamento do proxy">
    - O LiteLLM é executado em `http://localhost:4000` por padrão
    - O OpenClaw se conecta por meio do endpoint `/v1` compatível com OpenAI no estilo proxy do LiteLLM
    - O ajuste nativo de requisição exclusivo do OpenAI não se aplica por meio do LiteLLM:
      sem `service_tier`, sem `store` de Responses, sem hints de cache de prompt e sem
      ajuste de payload de compatibilidade de reasoning do OpenAI
    - Headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para configuração geral de provedores e comportamento de failover, consulte [Model Providers](/pt-BR/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Documentação oficial do LiteLLM e referência de API.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
</CardGroup>
