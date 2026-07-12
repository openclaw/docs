---
read_when:
    - Você quer modelos StepFun no OpenClaw
    - Você precisa de orientações para configurar o StepFun
summary: Use modelos StepFun com o OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T15:33:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

A StepFun é fornecida como um plugin oficial externo (`@openclaw/stepfun-provider`) com dois ids de provedor:

- `stepfun` para o endpoint padrão
- `stepfun-plan` para o endpoint Step Plan

<Warning>
Padrão e Step Plan são **provedores separados**, com endpoints e prefixos de referência de modelo diferentes (`stepfun/...` em comparação com `stepfun-plan/...`). Use uma chave da China com os endpoints `.com` e uma chave global com os endpoints `.ai`.
</Warning>

## Instalar o plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Visão geral das regiões e dos endpoints

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Padrão    | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variável de ambiente de autenticação: `STEPFUN_API_KEY`

## Catálogo integrado

Padrão (`stepfun`):

| Referência do modelo     | Contexto | Saída máxima | Observações                              |
| ------------------------ | -------- | ------------ | ---------------------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536       | Modelo padrão do provedor padrão         |
| `stepfun/step-3.7-flash` | 262,144  | 262,144      | Compatível com entrada multimodal de imagem |

Step Plan (`stepfun-plan`):

| Referência do modelo               | Contexto | Saída máxima | Observações                              |
| ---------------------------------- | -------- | ------------ | ---------------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536       | Modelo Step Plan padrão                  |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144      | Compatível com entrada multimodal de imagem |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536       | Modelo Step Plan adicional               |

## Primeiros passos

<Tabs>
  <Tab title="Padrão">
    Ideal para uso geral pelo endpoint padrão da StepFun.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação            | Endpoint                     | Região        |
        | -------------------------------- | ---------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`  | Internacional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1` | China         |
      </Step>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpoint da China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternativa não interativa">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Modelo padrão: `stepfun/step-3.5-flash`
    Modelo alternativo: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Ideal para o endpoint de raciocínio Step Plan.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação         | Endpoint                                | Região        |
        | ----------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`  | Internacional |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpoint da China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternativa não interativa">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Modelo padrão: `stepfun-plan/step-3.5-flash`
    Modelos alternativos: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Um único fluxo de autenticação grava perfis correspondentes à região para `stepfun` e `stepfun-plan`, portanto as duas superfícies são descobertas juntas após uma única execução da integração inicial.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Configuração completa: provedor padrão">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuração completa: provedor Step Plan">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Observações">
    - O `step-3.7-flash` aceita entradas de texto e imagem por meio do OpenClaw. A API da StepFun também é compatível com vídeo, que ainda não é uma modalidade de entrada de modelo no OpenClaw.
    - O Step 3.7 aceita níveis de esforço de raciocínio `low`, `medium` e `high`. Como o modelo não tem um modo sem raciocínio, `/think off` é mapeado para `low`.
    - Atualmente, o `step-3.5-flash-2603` está disponível apenas em `stepfun-plan`.
    - Use `openclaw models list` e `openclaw models set <provider/model>` para inspecionar ou alternar modelos.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para provedores, modelos e plugins.
  </Card>
  <Card title="CLI de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Plataforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gerenciamento de chaves de API e documentação da StepFun.
  </Card>
</CardGroup>
