---
read_when:
    - Você quer modelos StepFun no OpenClaw
    - Você precisa de orientação para configurar o StepFun
summary: Use modelos StepFun com o OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:06:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

O Plugin de provedor StepFun é compatível com dois ids de provedor:

- `stepfun` para o endpoint padrão
- `stepfun-plan` para o endpoint Step Plan

<Warning>
Standard e Step Plan são **provedores separados** com endpoints e prefixos de referência de modelo diferentes (`stepfun/...` vs `stepfun-plan/...`). Use uma chave da China com os endpoints `.com` e uma chave global com os endpoints `.ai`.
</Warning>

## Instalar Plugin

Instale o Plugin oficial e depois reinicie o Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Visão geral de região e endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variável de ambiente de autenticação: `STEPFUN_API_KEY`

## Catálogo integrado

Standard (`stepfun`):

| Referência de modelo     | Contexto | Saída máxima | Observações           |
| ------------------------ | -------- | ------------ | --------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536       | Modelo Standard padrão |

Step Plan (`stepfun-plan`):

| Referência de modelo               | Contexto | Saída máxima | Observações                      |
| ---------------------------------- | -------- | ------------ | -------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536       | Modelo Step Plan padrão          |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536       | Modelo Step Plan adicional       |

## Primeiros passos

Escolha sua superfície de provedor e siga as etapas de configuração.

<Tabs>
  <Tab title="Standard">
    **Ideal para:** uso geral via endpoint Standard da StepFun.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Escolha de autenticação       | Endpoint                         | Região        |
        | ----------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`     | Internacional |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1`    | China         |
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

    ### Referências de modelo

    - Modelo padrão: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Ideal para:** endpoint de raciocínio Step Plan.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Escolha de autenticação     | Endpoint                                | Região        |
        | --------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Internacional |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | China         |
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

    ### Referências de modelo

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
    - O provedor é um pacote externo oficial; instale-o antes da configuração.
    - `step-3.5-flash-2603` atualmente é exposto apenas em `stepfun-plan`.
    - Um único fluxo de autenticação grava perfis correspondentes à região para `stepfun` e `stepfun-plan`, então ambas as superfícies podem ser descobertas juntas.
    - Use `openclaw models list` e `openclaw models set <provider/model>` para inspecionar ou alternar modelos.

  </Accordion>
</AccordionGroup>

<Note>
Para uma visão geral mais ampla dos provedores, consulte [Provedores de modelo](/pt-BR/concepts/model-providers).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelo e comportamento de failover.
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
