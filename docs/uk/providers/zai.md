---
read_when:
    - Ви хочете використовувати Z.AI / моделі GLM в OpenClaw
    - Вам потрібне просте налаштування `ZAI_API_KEY`
summary: Використовуйте Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T03:55:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI — це платформа API для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує провайдер `zai`
із API-ключем Z.AI.

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Початок роботи

<Tabs>
  <Tab title="Автовизначення кінцевої точки">
    **Найкраще для:** більшості користувачів. OpenClaw визначає відповідну кінцеву точку Z.AI за ключем і автоматично застосовує правильний базовий URL.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Явна регіональна кінцева точка">
    **Найкраще для:** користувачів, які хочуть примусово використовувати певний Coding Plan або загальну поверхню API.

    <Steps>
      <Step title="Виберіть правильний варіант онбордингу">
        ```bash
        # Coding Plan Global (рекомендовано для користувачів Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (регіон Китай)
        openclaw onboard --auth-choice zai-coding-cn

        # Загальний API
        openclaw onboard --auth-choice zai-global

        # Загальний API CN (регіон Китай)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Вбудований каталог

Наразі OpenClaw заповнює вбудований провайдер `zai` такими моделями:

| Model ref            | Примітки            |
| -------------------- | ------------------- |
| `zai/glm-5.1`        | Модель за замовчуванням |
| `zai/glm-5`          |                     |
| `zai/glm-5-turbo`    |                     |
| `zai/glm-5v-turbo`   |                     |
| `zai/glm-4.7`        |                     |
| `zai/glm-4.7-flash`  |                     |
| `zai/glm-4.7-flashx` |                     |
| `zai/glm-4.6`        |                     |
| `zai/glm-4.6v`       |                     |
| `zai/glm-4.5`        |                     |
| `zai/glm-4.5-air`    |                     |
| `zai/glm-4.5-flash`  |                     |
| `zai/glm-4.5v`       |                     |

<Tip>
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`). Типове посилання на вбудовану модель — `zai/glm-5.1`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Forward-resolving невідомих моделей GLM-5">
    Невідомі ідентифікатори `glm-5*` усе ще forward-resolve на шляху вбудованого провайдера
    через синтез метаданих, що належать провайдеру, на основі шаблону `glm-4.7`, коли ідентифікатор
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Потокова передача викликів інструментів">
    `tool_stream` увімкнено за замовчуванням для потокової передачі викликів інструментів Z.AI. Щоб вимкнути це:

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

  <Accordion title="Thinking і preserved thinking">
    Thinking у Z.AI дотримується елементів керування `/think` в OpenClaw. Коли thinking вимкнено,
    OpenClaw надсилає `thinking: { type: "disabled" }`, щоб уникнути відповідей, які
    витрачають бюджет виводу на `reasoning_content` до появи видимого тексту.

    Preserved thinking є опційним, оскільки Z.AI вимагає повторного відтворення повного історичного
    `reasoning_content`, що збільшує кількість токенів у підказці. Увімкніть його
    для конкретної моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Коли це ввімкнено і thinking активний, OpenClaw надсилає
    `thinking: { type: "enabled", clear_thinking: false }` і повторно відтворює попередній
    `reasoning_content` для того самого OpenAI-compatible transcript.

    Досвідчені користувачі все ще можуть перевизначати точне корисне навантаження провайдера через
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Розуміння зображень">
    Вбудований Plugin Z.AI реєструє підтримку розуміння зображень.

    | Властивість  | Значення   |
    | ------------- | ----------- |
    | Модель        | `glm-4.6v`  |

    Розуміння зображень автоматично визначається з налаштованої автентифікації Z.AI —
    додаткова конфігурація не потрібна.

  </Accordion>

  <Accordion title="Деталі автентифікації">
    - Z.AI використовує Bearer auth із вашим API-ключем.
    - Варіант онбордингу `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI за префіксом ключа.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), якщо хочете примусово використовувати певну поверхню API.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сімейство моделей GLM" href="/uk/providers/glm" icon="microchip">
    Огляд сімейства моделей GLM.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, Model ref і поведінки failover.
  </Card>
</CardGroup>
