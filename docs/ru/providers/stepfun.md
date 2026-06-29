---
read_when:
    - Вам нужны модели StepFun в OpenClaw
    - Вам нужны инструкции по настройке StepFun
summary: Использование моделей StepFun с OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-28T23:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin провайдера StepFun поддерживает два идентификатора провайдера:

- `stepfun` для стандартного эндпоинта
- `stepfun-plan` для эндпоинта Step Plan

<Warning>
Standard и Step Plan — это **отдельные провайдеры** с разными эндпоинтами и префиксами ссылок на модели (`stepfun/...` и `stepfun-plan/...`). Используйте ключ для Китая с эндпоинтами `.com`, а глобальный ключ — с эндпоинтами `.ai`.
</Warning>

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Обзор регионов и эндпоинтов

| Эндпоинт  | Китай (`.com`)                         | Глобальный (`.ai`)                    |
| --------- | -------------------------------------- | ------------------------------------- |
| Стандартный | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Переменная окружения для аутентификации: `STEPFUN_API_KEY`

## Встроенный каталог

Стандартный (`stepfun`):

| Ссылка на модель        | Контекст | Макс. вывод | Примечания                    |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Стандартная модель по умолчанию |

Step Plan (`stepfun-plan`):

| Ссылка на модель                  | Контекст | Макс. вывод | Примечания                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Модель Step Plan по умолчанию    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Дополнительная модель Step Plan |

## Начало работы

Выберите поверхность провайдера и выполните шаги настройки.

<Tabs>
  <Tab title="Стандартный">
    **Лучше всего подходит для:** универсального использования через стандартный эндпоинт StepFun.

    <Steps>
      <Step title="Выберите регион эндпоинта">
        | Вариант аутентификации          | Эндпоинт                         | Регион        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Международный |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Китай         |
      </Step>
      <Step title="Запустите первичную настройку">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Или для эндпоинта в Китае:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Неинтерактивная альтернатива">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Проверьте, что модели доступны">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Ссылки на модели

    - Модель по умолчанию: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Лучше всего подходит для:** эндпоинта рассуждений Step Plan.

    <Steps>
      <Step title="Выберите регион эндпоинта">
        | Вариант аутентификации      | Эндпоинт                                | Регион        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Международный |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Китай         |
      </Step>
      <Step title="Запустите первичную настройку">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Или для эндпоинта в Китае:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Неинтерактивная альтернатива">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Проверьте, что модели доступны">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Ссылки на модели

    - Модель по умолчанию: `stepfun-plan/step-3.5-flash`
    - Альтернативная модель: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

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
    - Провайдер является официальным внешним пакетом; установите его перед настройкой.
    - `step-3.5-flash-2603` сейчас доступна только в `stepfun-plan`.
    - Единый поток аутентификации записывает профили, соответствующие региону, как для `stepfun`, так и для `stepfun-plan`, поэтому обе поверхности можно обнаружить вместе.
    - Используйте `openclaw models list` и `openclaw models set <provider/model>`, чтобы просмотреть или переключить модели.

  </Accordion>
</AccordionGroup>

<Note>
Более широкий обзор провайдеров см. в разделе [Провайдеры моделей](/ru/concepts/model-providers).
</Note>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации для провайдеров, моделей и plugins.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
  <Card title="Платформа StepFun" href="https://platform.stepfun.com" icon="globe">
    Управление ключами API StepFun и документация.
  </Card>
</CardGroup>
