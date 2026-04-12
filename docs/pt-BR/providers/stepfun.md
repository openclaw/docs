---
read_when:
    - Você quer modelos da StepFun no OpenClaw
    - Você precisa de orientação de configuração da StepFun
summary: Use modelos da StepFun com o OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-12T23:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

O OpenClaw inclui um plugin provider StepFun empacotado com dois IDs de provider:

- `stepfun` para o endpoint padrão
- `stepfun-plan` para o endpoint Step Plan

<Warning>
Standard e Step Plan são **providers separados** com endpoints e prefixos de ref de modelo diferentes (`stepfun/...` vs `stepfun-plan/...`). Use uma chave China com os endpoints `.com` e uma chave global com os endpoints `.ai`.
</Warning>

## Visão geral de regiões e endpoints

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variável de ambiente de autenticação: `STEPFUN_API_KEY`

## Catálogos builtin

Standard (`stepfun`):

| Ref do modelo            | Contexto | Saída máxima | Observações             |
| ------------------------ | -------- | ------------ | ----------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536       | Modelo padrão Standard  |

Step Plan (`stepfun-plan`):

| Ref do modelo                      | Contexto | Saída máxima | Observações                    |
| ---------------------------------- | -------- | ------------ | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536       | Modelo padrão Step Plan        |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536       | Modelo Step Plan adicional     |

## Primeiros passos

Escolha a superfície do provider e siga as etapas de configuração.

<Tabs>
  <Tab title="Standard">
    **Melhor para:** uso geral por meio do endpoint padrão da StepFun.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação            | Endpoint                         | Região        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`      | Internacional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`     | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Ou, para o endpoint da China:

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

    ### Refs de modelo

    - Modelo padrão: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Melhor para:** endpoint de raciocínio Step Plan.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação         | Endpoint                                | Região        |
        | ----------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`   | Internacional |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1`  | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Ou, para o endpoint da China:

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

    ### Refs de modelo

    - Modelo padrão: `stepfun-plan/step-3.5-flash`
    - Modelo alternativo: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Avançado

<AccordionGroup>
  <Accordion title="Configuração completa: provider Standard">
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

  <Accordion title="Configuração completa: provider Step Plan">
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
    - O provider é empacotado com o OpenClaw, então não há uma etapa separada de instalação de plugin.
    - `step-3.5-flash-2603` atualmente é exposto apenas em `stepfun-plan`.
    - Um único fluxo de autenticação grava perfis correspondentes à região para `stepfun` e `stepfun-plan`, de modo que ambas as superfícies possam ser descobertas juntas.
    - Use `openclaw models list` e `openclaw models set <provider/model>` para inspecionar ou trocar modelos.
  </Accordion>
</AccordionGroup>

<Note>
Para a visão geral mais ampla de providers, consulte [Providers de modelo](/pt-BR/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração para providers, modelos e plugins.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Plataforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gerenciamento de chaves de API e documentação da StepFun.
  </Card>
</CardGroup>
