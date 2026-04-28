---
read_when:
    - Ви хочете моделі StepFun в OpenClaw
    - Вам потрібні вказівки з налаштування StepFun
summary: Використовуйте моделі StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-23T23:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw містить комплектний plugin provider StepFun з двома ідентифікаторами provider:

- `stepfun` для стандартного ендпоїнта
- `stepfun-plan` для ендпоїнта Step Plan

<Warning>
Standard і Step Plan — це **окремі provider** з різними ендпоїнтами та префіксами посилань на моделі (`stepfun/...` проти `stepfun-plan/...`). Використовуйте China-ключ з ендпоїнтами `.com`, а global-ключ — з ендпоїнтами `.ai`.
</Warning>

## Огляд регіонів і ендпоїнтів

| Ендпоїнт   | China (`.com`)                         | Global (`.ai`)                        |
| ---------- | -------------------------------------- | ------------------------------------- |
| Standard   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan  | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Env-змінна автентифікації: `STEPFUN_API_KEY`

## Вбудований каталог

Standard (`stepfun`):

| Посилання на модель       | Контекст | Макс. вивід | Примітки                 |
| ------------------------- | -------- | ----------- | ------------------------ |
| `stepfun/step-3.5-flash`  | 262,144  | 65,536      | Типова стандартна модель |

Step Plan (`stepfun-plan`):

| Посилання на модель                 | Контекст | Макс. вивід | Примітки                    |
| ----------------------------------- | -------- | ----------- | --------------------------- |
| `stepfun-plan/step-3.5-flash`       | 262,144  | 65,536      | Типова модель Step Plan     |
| `stepfun-plan/step-3.5-flash-2603`  | 262,144  | 65,536      | Додаткова модель Step Plan  |

## Початок роботи

Виберіть потрібну поверхню provider і виконайте кроки налаштування.

<Tabs>
  <Tab title="Standard">
    **Найкраще для:** загального використання через стандартний ендпоїнт StepFun.

    <Steps>
      <Step title="Виберіть регіон ендпоїнта">
        | Варіант автентифікації           | Ендпоїнт                        | Регіон         |
        | -------------------------------- | ------------------------------- | -------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Міжнародний    |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China          |
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Або для ендпоїнта China:

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
    **Найкраще для:** ендпоїнта міркування Step Plan.

    <Steps>
      <Step title="Виберіть регіон ендпоїнта">
        | Варіант автентифікації        | Ендпоїнт                               | Регіон         |
        | ----------------------------- | -------------------------------------- | -------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`  | Міжнародний    |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1` | China          |
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Або для ендпоїнта China:

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

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Повна конфігурація: provider Standard">
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

  <Accordion title="Повна конфігурація: provider Step Plan">
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
    - Provider постачається разом з OpenClaw, тому окремий крок встановлення plugin не потрібен.
    - `step-3.5-flash-2603` наразі доступна лише в `stepfun-plan`.
    - Один потік автентифікації записує профілі з відповідним регіоном як для `stepfun`, так і для `stepfun-plan`, тож обидві поверхні можна виявляти разом.
    - Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.

  </Accordion>
</AccordionGroup>

<Note>
Для ширшого огляду provider див. [Provider моделей](/uk/concepts/model-providers).
</Note>

## Пов’язано

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх provider, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідка з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для provider, моделей і plugin.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Платформа StepFun" href="https://platform.stepfun.com" icon="globe">
    Керування API-ключами StepFun і документація.
  </Card>
</CardGroup>
