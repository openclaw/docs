---
read_when:
    - Você quer rotear o OpenClaw por meio de um proxy LiteLLM
    - Você precisa de rastreamento de custos, registro em logs ou roteamento de modelos por meio do LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e acompanhamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T10:04:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) é um gateway de LLM de código aberto que fornece uma API unificada para mais de 100 provedores de modelos. Encaminhe o OpenClaw pelo LiteLLM para obter rastreamento centralizado de custos, logs e a flexibilidade de trocar backends sem alterar sua configuração do OpenClaw.

<Tip>
**Por que usar o LiteLLM com o OpenClaw?**

- **Rastreamento de custos** — Veja exatamente quanto o OpenClaw gasta em todos os modelos
- **Roteamento de modelos** — Alterne entre Claude, GPT-4, Gemini, Bedrock sem alterações de configuração
- **Chaves virtuais** — Crie chaves com limites de gasto para o OpenClaw
- **Logs** — Logs completos de solicitação/resposta para depuração
- **Fallbacks** — Failover automático se seu provedor principal estiver indisponível

</Tip>

## Início rápido

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** o caminho mais rápido para uma configuração funcional do LiteLLM.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Para configuração não interativa com um proxy remoto, passe explicitamente a URL do proxy:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuração manual">
    **Ideal para:** controle total sobre instalação e configuração.

    <Steps>
      <Step title="Inicie o proxy do LiteLLM">
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

        Pronto. Agora o OpenClaw roteia pelo LiteLLM.
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

### Geração de imagens

O LiteLLM também pode dar suporte à ferramenta `image_generate` por meio de rotas
`/images/generations` e `/images/edits` compatíveis com OpenAI. Configure um modelo
de imagem do LiteLLM em `agents.defaults.imageGenerationModel`:

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

URLs de local loopback do LiteLLM, como `http://localhost:4000`, funcionam sem uma
substituição global de rede privada. Para um proxy hospedado em LAN, defina
`models.providers.litellm.request.allowPrivateNetwork: true` porque a chave de API
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
    O LiteLLM pode rotear solicitações de modelos para diferentes backends. Configure no seu `config.yaml` do LiteLLM:

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

  <Accordion title="Visualização de uso">
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
    - O OpenClaw se conecta pelo endpoint `/v1` compatível com OpenAI em estilo de proxy
      do LiteLLM
    - A modelagem de solicitações nativa somente para OpenAI não se aplica pelo LiteLLM:
      sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio da OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para configuração geral de provedores e comportamento de failover, consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Documentação do LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentação oficial do LiteLLM e referência da API.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
</CardGroup>
