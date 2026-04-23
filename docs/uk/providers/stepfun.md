---
read_when:
    - Ви хочете використовувати моделі StepFun в OpenClaw
    - Вам потрібні вказівки з налаштування StepFun
summary: Використовуйте моделі StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-23T21:08:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3267379303e5cf1539c1945ec8d777f1bfc6189c9f9e7f8802b3393c60e7693d
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw містить bundled provider Plugin StepFun з двома provider id:

- `stepfun` для стандартного endpoint
- `stepfun-plan` для endpoint Step Plan

<Warning>
Standard і Step Plan — це **окремі провайдери** з різними endpoint і префіксами model ref (`stepfun/...` проти `stepfun-plan/...`). Використовуйте China key з endpoint `.com`, а global key — з endpoint `.ai`.
</Warning>

## Огляд регіонів і endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth env var: `STEPFUN_API_KEY`

## Вбудовані каталоги

Standard (`stepfun`):

| Model ref                | Context | Max output | Notes                     |
| ------------------------ | ------- | ---------- | ------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Типова стандартна модель  |

Step Plan (`stepfun-plan`):

| Model ref                          | Context | Max output | Notes                         |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Типова модель Step Plan       |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Додаткова модель Step Plan    |

## Початок роботи

Виберіть поверхню провайдера і виконайте кроки налаштування.

<Tabs>
  <Tab title="Standard">
    **Найкраще для:** використання загального призначення через стандартний endpoint StepFun.

    <Steps>
      <Step title="Виберіть регіон endpoint">
        | Auth choice                      | Endpoint                        | Region        |
        | -------------------------------- | ------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Або для endpoint China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Неінтерактивна альтернатива">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Посилання на моделі

    - Типова модель: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Найкраще для:** reasoning endpoint Step Plan.

    <Steps>
      <Step title="Виберіть регіон endpoint">
        | Auth choice                  | Endpoint                               | Region        |
        | ---------------------------- | -------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Або для endpoint China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Неінтерактивна альтернатива">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Посилання на моделі

    - Типова модель: `stepfun-plan/step-3.5-flash`
    - Альтернативна модель: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Повна config: Standard provider">
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

  <Accordion title="Повна config: provider Step Plan">
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

  <Accordion title="Примітки">
    - Провайдер bundled входить до OpenClaw, тому окремий крок встановлення Plugin не потрібен.
    - `step-3.5-flash-2603` наразі доступна лише в `stepfun-plan`.
    - Один потік auth записує профілі з регіоном, що збігається, і для `stepfun`, і для `stepfun-plan`, тож обидві поверхні можна виявляти разом.
    - Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.
  </Accordion>
</AccordionGroup>

<Note>
Для ширшого огляду провайдерів див. [Model providers](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, model refs і поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна schema config для провайдерів, моделей і Plugin.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Платформа StepFun" href="https://platform.stepfun.com" icon="globe">
    Керування API key StepFun і документація.
  </Card>
</CardGroup>
