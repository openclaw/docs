---
read_when:
    - Вам потрібні моделі StepFun в OpenClaw
    - Вам потрібні інструкції з налаштування StepFun
summary: Використання моделей StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-28T11:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw містить вбудований Plugin провайдера StepFun із двома ідентифікаторами провайдера:

- `stepfun` для стандартного endpoint
- `stepfun-plan` для endpoint Step Plan

<Warning>
Standard і Step Plan — це **окремі провайдери** з різними endpoint і префіксами посилань на моделі (`stepfun/...` і `stepfun-plan/...`). Використовуйте ключ China з endpoint `.com`, а глобальний ключ — з endpoint `.ai`.
</Warning>

## Огляд регіонів і endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Змінна середовища для автентифікації: `STEPFUN_API_KEY`

## Вбудований каталог

Standard (`stepfun`):

| Посилання на модель       | Контекст | Макс. вивід | Примітки                   |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Стандартна модель за замовчуванням |

Step Plan (`stepfun-plan`):

| Посилання на модель                 | Контекст | Макс. вивід | Примітки                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Модель Step Plan за замовчуванням    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Додаткова модель Step Plan |

## Початок роботи

Виберіть поверхню провайдера й виконайте кроки налаштування.

<Tabs>
  <Tab title="Standard">
    **Найкраще для:** загального використання через стандартний endpoint StepFun.

    <Steps>
      <Step title="Choose your endpoint region">
        | Вибір автентифікації            | Endpoint                         | Регіон        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Міжнародний |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Або для endpoint China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Посилання на моделі

    - Модель за замовчуванням: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Найкраще для:** endpoint міркування Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Вибір автентифікації        | Endpoint                                | Регіон        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Міжнародний |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Або для endpoint China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Посилання на моделі

    - Модель за замовчуванням: `stepfun-plan/step-3.5-flash`
    - Альтернативна модель: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
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

  <Accordion title="Full config: Step Plan provider">
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

  <Accordion title="Notes">
    - Провайдер постачається разом з OpenClaw, тому окремий крок установлення Plugin не потрібен.
    - `step-3.5-flash-2603` зараз доступна лише в `stepfun-plan`.
    - Єдиний потік автентифікації записує профілі, що відповідають регіону, для `stepfun` і `stepfun-plan`, тому обидві поверхні можна виявити разом.
    - Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.

  </Accordion>
</AccordionGroup>

<Note>
Ширший огляд провайдерів див. у [Провайдери моделей](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для провайдерів, моделей і plugins.
  </Card>
  <Card title="Model selection" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Керування ключами API StepFun і документація.
  </Card>
</CardGroup>
