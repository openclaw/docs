---
read_when:
    - Вам потрібні моделі StepFun в OpenClaw
    - Вам потрібні інструкції з налаштування StepFun
summary: Використання моделей StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:14:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Плагін постачальника StepFun підтримує два ідентифікатори постачальника:

- `stepfun` для стандартної кінцевої точки
- `stepfun-plan` для кінцевої точки Step Plan

<Warning>
Standard і Step Plan — це **окремі постачальники** з різними кінцевими точками та префіксами посилань на моделі (`stepfun/...` і `stepfun-plan/...`). Використовуйте ключ для Китаю з кінцевими точками `.com`, а глобальний ключ — з кінцевими точками `.ai`.
</Warning>

## Встановлення Plugin

Встановіть офіційний Plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Огляд регіонів і кінцевих точок

| Кінцева точка | Китай (`.com`)                         | Глобальна (`.ai`)                    |
| ------------- | -------------------------------------- | ------------------------------------ |
| Стандартна    | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`          |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Змінна середовища автентифікації: `STEPFUN_API_KEY`

## Вбудований каталог

Стандартний (`stepfun`):

| Посилання на модель      | Контекст | Максимальний вивід | Примітки                    |
| ------------------------ | -------- | ------------------ | --------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536             | Стандартна модель за замовчуванням |

Step Plan (`stepfun-plan`):

| Посилання на модель                | Контекст | Максимальний вивід | Примітки                         |
| ---------------------------------- | -------- | ------------------ | -------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536             | Модель Step Plan за замовчуванням |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536             | Додаткова модель Step Plan       |

## Початок роботи

Виберіть поверхню постачальника та виконайте кроки налаштування.

<Tabs>
  <Tab title="Standard">
    **Найкраще для:** універсального використання через стандартну кінцеву точку StepFun.

    <Steps>
      <Step title="Choose your endpoint region">
        | Вибір автентифікації          | Кінцева точка                    | Регіон        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Міжнародний   |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Китай         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Або для кінцевої точки в Китаї:

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
    **Найкраще для:** кінцевої точки міркування Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Вибір автентифікації      | Кінцева точка                          | Регіон        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Міжнародний   |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Китай         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Або для кінцевої точки в Китаї:

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
    - Постачальник є офіційним зовнішнім пакетом; встановіть його перед налаштуванням.
    - `step-3.5-flash-2603` наразі доступна лише в `stepfun-plan`.
    - Один потік автентифікації записує профілі, що відповідають регіону, для `stepfun` і `stepfun-plan`, тому обидві поверхні можна виявити разом.
    - Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.

  </Accordion>
</AccordionGroup>

<Note>
Ширший огляд постачальників див. у розділі [Постачальники моделей](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для постачальників, моделей і plugins.
  </Card>
  <Card title="Model selection" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Керування ключами API StepFun і документація.
  </Card>
</CardGroup>
