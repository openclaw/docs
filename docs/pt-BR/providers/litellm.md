---
read_when:
    - Você quer rotear o OpenClaw por meio de um proxy LiteLLM
    - Você precisa de acompanhamento de custos, registro de logs ou roteamento de modelos pelo LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e acompanhamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T00:18:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) é um gateway de LLM de código aberto com uma API unificada para mais de 100
provedores de modelos. Encaminhe o OpenClaw pelo LiteLLM para centralizar o acompanhamento de custos,
os registros, as chaves virtuais com limites de gastos e o failover de backends sem alterar a configuração do OpenClaw.

## Início rápido

<Tabs>
  <Tab title="Integração inicial (recomendado)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Para uma configuração não interativa com um proxy remoto, informe explicitamente a URL do proxy:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Configuração manual">
    <Steps>
      <Step title="Iniciar o proxy do LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Direcionar o OpenClaw para o LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Configuração

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

O modelo padrão gravado pela integração inicial é `litellm/claude-opus-4-6`.

## Geração de imagens

O LiteLLM pode servir como backend para a ferramenta `image_generate` por meio das rotas compatíveis com OpenAI
`/images/generations` e `/images/edits`. O modelo de imagem padrão é `gpt-image-2`; configure outro em
`agents.defaults.imageGenerationModel`:

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

URLs do LiteLLM em local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) funcionam
sem uma substituição global para redes privadas. Para um proxy hospedado na LAN, defina
`models.providers.litellm.request.allowPrivateNetwork: true`, pois a chave de API é enviada a esse host.

## Avançado

<AccordionGroup>
  <Accordion title="Chaves virtuais">
    Crie uma chave exclusiva para o OpenClaw com limites de gastos:

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
    O LiteLLM pode encaminhar solicitações de modelos para diferentes backends. Configure no `config.yaml` do LiteLLM:

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

    O OpenClaw continua solicitando `claude-opus-4-6`; o LiteLLM gerencia o roteamento.

  </Accordion>

  <Accordion title="Visualização do uso">
    ```bash
    # Informações da chave
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Registros de gastos
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Observações sobre o comportamento do proxy">
    - Por padrão, o LiteLLM é executado em `http://localhost:4000`.
    - O OpenClaw se conecta pelo endpoint `/v1` compatível com OpenAI no estilo de proxy do LiteLLM.
    - A formatação de solicitações exclusiva da implementação nativa da OpenAI não se aplica por meio de uma URL base configurada do LiteLLM:
      sem `service_tier`, sem `store` da Responses, sem indicações de cache de prompts e sem formatação da carga útil
      de esforço de raciocínio da OpenAI.
    - Os cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são enviados apenas para
      endpoints nativos verificados da OpenAI, portanto não são injetados em uma URL base personalizada do LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
Para informações gerais sobre a configuração de provedores e o comportamento de failover, consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
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
    Referência completa da configuração.
  </Card>
  <Card title="Modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
</CardGroup>
