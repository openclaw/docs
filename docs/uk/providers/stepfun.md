---
read_when:
    - Ви хочете використовувати моделі StepFun в OpenClaw
    - Вам потрібні вказівки з налаштування StepFun
summary: Використання моделей StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T13:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun постачається як зовнішній офіційний плагін (`@openclaw/stepfun-provider`) із двома ідентифікаторами постачальників:

- `stepfun` для стандартної кінцевої точки
- `stepfun-plan` для кінцевої точки Step Plan

<Warning>
Стандартний постачальник і Step Plan — це **окремі постачальники** з різними кінцевими точками та префіксами посилань на моделі (`stepfun/...` і `stepfun-plan/...`). Використовуйте ключ для Китаю з кінцевими точками `.com`, а глобальний ключ — із кінцевими точками `.ai`.
</Warning>

## Установлення плагіна

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Огляд регіонів і кінцевих точок

| Кінцева точка | Китай (`.com`)                         | Глобальна (`.ai`)                     |
| ------------- | -------------------------------------- | ------------------------------------- |
| Стандартна    | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Змінна середовища автентифікації: `STEPFUN_API_KEY`

## Вбудований каталог

Стандартний постачальник (`stepfun`):

| Посилання на модель      | Контекст | Макс. вивід | Примітки                              |
| ------------------------ | -------- | ----------- | ------------------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536      | Стандартна модель за замовчуванням    |
| `stepfun/step-3.7-flash` | 262,144  | 262,144     | Підтримка мультимодального вводу зображень |

Step Plan (`stepfun-plan`):

| Посилання на модель                | Контекст | Макс. вивід | Примітки                              |
| ---------------------------------- | -------- | ----------- | ------------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536      | Модель Step Plan за замовчуванням     |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144     | Підтримка мультимодального вводу зображень |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536      | Додаткова модель Step Plan            |

## Початок роботи

<Tabs>
  <Tab title="Стандартний">
    Найкраще підходить для загального використання через стандартну кінцеву точку StepFun.

    <Steps>
      <Step title="Виберіть регіон кінцевої точки">
        | Варіант автентифікації          | Кінцева точка                | Регіон         |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Міжнародний    |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Китай          |
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Кінцева точка для Китаю:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Неінтерактивний варіант">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Модель за замовчуванням: `stepfun/step-3.5-flash`
    Альтернативна модель: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Найкраще підходить для кінцевої точки логічного міркування Step Plan.

    <Steps>
      <Step title="Виберіть регіон кінцевої точки">
        | Варіант автентифікації       | Кінцева точка                           | Регіон         |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Міжнародний    |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Китай          |
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Кінцева точка для Китаю:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Неінтерактивний варіант">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Модель за замовчуванням: `stepfun-plan/step-3.5-flash`
    Альтернативні моделі: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Один процес автентифікації записує профілі з відповідними регіонами для `stepfun` і `stepfun-plan`, тому обидва інтерфейси виявляються разом після одного запуску початкового налаштування.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Повна конфігурація: стандартний постачальник">
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

  <Accordion title="Повна конфігурація: постачальник Step Plan">
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

  <Accordion title="Примітки">
    - `step-3.7-flash` приймає текст і зображення як вхідні дані через OpenClaw. API StepFun також підтримує відео, яке ще не є модальністю вхідних даних моделі в OpenClaw.
    - Step 3.7 підтримує рівні зусиль для логічного міркування `low`, `medium` і `high`. Оскільки модель не має режиму без логічного міркування, `/think off` відповідає рівню `low`.
    - `step-3.5-flash-2603` наразі доступна лише в `stepfun-plan`.
    - Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для постачальників, моделей і плагінів.
  </Card>
  <Card title="CLI моделей" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Платформа StepFun" href="https://platform.stepfun.com" icon="globe">
    Керування ключами API StepFun і документація.
  </Card>
</CardGroup>
