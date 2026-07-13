---
read_when:
    - Вы хотите использовать модели StepFun в OpenClaw
    - Вам нужны инструкции по настройке StepFun
summary: Использование моделей StepFun с OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-13T18:42:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun поставляется как внешний официальный плагин (`@openclaw/stepfun-provider`) с двумя идентификаторами провайдера:

- `stepfun` для стандартной конечной точки
- `stepfun-plan` для конечной точки Step Plan

<Warning>
Стандартный провайдер и Step Plan — **отдельные провайдеры** с разными конечными точками и префиксами ссылок на модели (`stepfun/...` и `stepfun-plan/...`). Используйте ключ для Китая с конечными точками `.com`, а глобальный ключ — с конечными точками `.ai`.
</Warning>

## Установка плагина

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Обзор регионов и конечных точек

| Конечная точка | Китай (`.com`)                         | Глобальная (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Стандартная | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Переменная среды для аутентификации: `STEPFUN_API_KEY`

## Встроенный каталог

Стандартный провайдер (`stepfun`):

| Ссылка на модель         | Контекст | Макс. вывод | Примечания                     |
| ------------------------ | ------- | ---------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Стандартная модель по умолчанию |
| `stepfun/step-3.7-flash` | 262,144 | 262,144    | Поддержка мультимодального ввода изображений |

Step Plan (`stepfun-plan`):

| Ссылка на модель                   | Контекст | Макс. вывод | Примечания                     |
| ---------------------------------- | ------- | ---------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Модель Step Plan по умолчанию  |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144    | Поддержка мультимодального ввода изображений |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Дополнительная модель Step Plan |

## Начало работы

<Tabs>
  <Tab title="Стандартный">
    Лучше всего подходит для задач общего назначения через стандартную конечную точку StepFun.

    <Steps>
      <Step title="Выберите регион конечной точки">
        | Вариант аутентификации         | Конечная точка               | Регион         |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Международный |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Китай          |
      </Step>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Конечная точка для Китая:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Неинтерактивный вариант">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Убедитесь, что модели доступны">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Модель по умолчанию: `stepfun/step-3.5-flash`
    Альтернативная модель: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Лучше всего подходит для конечной точки рассуждений Step Plan.

    <Steps>
      <Step title="Выберите регион конечной точки">
        | Вариант аутентификации      | Конечная точка                          | Регион         |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Международный |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Китай          |
      </Step>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Конечная точка для Китая:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Неинтерактивный вариант">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Убедитесь, что модели доступны">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Модель по умолчанию: `stepfun-plan/step-3.5-flash`
    Альтернативные модели: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Один процесс аутентификации создаёт соответствующие региону профили как для `stepfun`, так и для `stepfun-plan`, поэтому обе поверхности обнаруживаются вместе после одного запуска первоначальной настройки.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Полная конфигурация: стандартный провайдер">
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

  <Accordion title="Полная конфигурация: провайдер Step Plan">
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

  <Accordion title="Примечания">
    - `step-3.7-flash` принимает текстовые и графические входные данные через OpenClaw. API StepFun также поддерживает видео, которое пока не является модальностью входных данных модели в OpenClaw.
    - Step 3.7 поддерживает уровни усилий рассуждения `low`, `medium` и `high`. Поскольку у модели нет режима без рассуждения, `/think off` сопоставляется с `low`.
    - `step-3.5-flash-2603` в настоящее время доступна только в `stepfun-plan`.
    - Используйте `openclaw models list` и `openclaw models set <provider/model>`, чтобы просматривать или переключать модели.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации провайдеров, моделей и плагинов.
  </Card>
  <Card title="CLI моделей" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
  <Card title="Платформа StepFun" href="https://platform.stepfun.com" icon="globe">
    Управление ключами API StepFun и документация.
  </Card>
</CardGroup>
