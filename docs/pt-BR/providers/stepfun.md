---
read_when:
    - Você quer modelos StepFun no OpenClaw
    - Você precisa de orientações de configuração do StepFun
summary: Use modelos da StepFun com o OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T10:05:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw inclui um Plugin de provedor StepFun integrado com dois IDs de provedor:

- `stepfun` para o endpoint padrão
- `stepfun-plan` para o endpoint Step Plan

<Warning>
Standard e Step Plan são **provedores separados** com endpoints e prefixos de ref de modelo diferentes (`stepfun/...` vs `stepfun-plan/...`). Use uma chave da China com os endpoints `.com` e uma chave global com os endpoints `.ai`.
</Warning>

## Visão geral de região e endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variável de ambiente de autenticação: `STEPFUN_API_KEY`

## Catálogo integrado

Standard (`stepfun`):

| Ref do modelo            | Contexto | Saída máx. | Observações            |
| ------------------------ | -------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536     | Modelo padrão Standard |

Step Plan (`stepfun-plan`):

| Ref do modelo                      | Contexto | Saída máx. | Observações                    |
| ---------------------------------- | -------- | ---------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536     | Modelo padrão Step Plan        |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536     | Modelo Step Plan adicional     |

## Primeiros passos

Escolha a superfície do provedor e siga as etapas de configuração.

<Tabs>
  <Tab title="Standard">
    **Ideal para:** uso de propósito geral pelo endpoint Standard da StepFun.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação           | Endpoint                         | Região        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internacional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Ou para o endpoint da China:

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
    **Ideal para:** endpoint de raciocínio Step Plan.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação       | Endpoint                                | Região        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internacional |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Ou para o endpoint da China:

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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Configuração completa: provedor Standard">
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
    - O provedor é integrado ao OpenClaw, portanto não há uma etapa separada de instalação de Plugin.
    - `step-3.5-flash-2603` atualmente é exposto apenas em `stepfun-plan`.
    - Um único fluxo de autenticação grava perfis correspondentes à região para `stepfun` e `stepfun-plan`, portanto as duas superfícies podem ser descobertas juntas.
    - Use `openclaw models list` e `openclaw models set <provider/model>` para inspecionar ou trocar modelos.

  </Accordion>
</AccordionGroup>

<Note>
Para uma visão geral mais ampla de provedores, consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para provedores, modelos e plugins.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Plataforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gerenciamento de chaves de API e documentação da StepFun.
  </Card>
</CardGroup>
