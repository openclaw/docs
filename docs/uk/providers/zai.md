---
read_when:
    - Ви хочете використовувати моделі Z.AI / GLM в OpenClaw
    - Вам потрібне просте налаштування `ZAI_API_KEY`
summary: Використання Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-23T21:08:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 750a7d7196654fb01850dec7779eca3588a55e68144d8f6a12c12b9457f30e8d
    source_path: providers/zai.md
    workflow: 15
---

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує provider `zai`
з API-ключем Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Початок роботи

<Tabs>
  <Tab title="Автовизначення endpoint">
    **Найкраще для:** більшості користувачів. OpenClaw визначає відповідний endpoint Z.AI з ключа й автоматично застосовує правильний base URL.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Явний регіональний endpoint">
    **Найкраще для:** користувачів, які хочуть примусово вибрати конкретний Coding Plan або загальну поверхню API.

    <Steps>
      <Step title="Виберіть правильний варіант онбордингу">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Вбудований каталог GLM

Наразі OpenClaw ініціалізує вбудований provider `zai` такими значеннями:

| Model ref            | Примітки      |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Типова модель |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`). Типове вбудоване посилання на модель — `zai/glm-5.1`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Forward-resolving невідомих моделей GLM-5">
    Невідомі id `glm-5*` і далі forward-resolve-яться на шляху вбудованого provider,
    синтезуючи метадані, якими володіє provider, із шаблону `glm-4.7`, коли id
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Streaming викликів tools">
    `tool_stream` типово ввімкнено для streaming викликів tools у Z.AI. Щоб вимкнути його:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Розуміння зображень">
    Вбудований Plugin Z.AI реєструє розуміння зображень.

    | Властивість   | Значення    |
    | ------------- | ----------- |
    | Модель        | `glm-4.6v`  |

    Розуміння зображень автоматично розв’язується з налаштованого auth Z.AI — жодної
    додаткової конфігурації не потрібно.

  </Accordion>

  <Accordion title="Деталі auth">
    - Z.AI використовує Bearer auth з вашим API-ключем.
    - Варіант онбордингу `zai-api-key` автоматично визначає відповідний endpoint Z.AI з префікса ключа.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), коли хочете примусово вибрати конкретну поверхню API.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сімейство моделей GLM" href="/uk/providers/glm" icon="microchip">
    Огляд сімейства моделей GLM.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінки failover.
  </Card>
</CardGroup>
