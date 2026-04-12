---
read_when:
    - Ви хочете Z.AI / моделі GLM в OpenClaw
    - Вам потрібне просте налаштування `ZAI_API_KEY`
summary: Використовуйте Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T10:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: eddb57770e6f1f9c72e62585d7d43a5e25f0d08f1b793f1ba5b0168c4c47f3cd
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує провайдера `zai`
з API-ключем Z.AI.

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Початок роботи

<Tabs>
  <Tab title="Автовизначення endpoint">
    **Найкраще для:** більшості користувачів. OpenClaw визначає відповідний endpoint Z.AI за ключем і автоматично застосовує правильний базовий URL.

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

  <Tab title="Явно вказаний регіональний endpoint">
    **Найкраще для:** користувачів, які хочуть примусово вибрати певний Coding Plan або загальну поверхню API.

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

## Вбудований каталог GLM

OpenClaw наразі наповнює вбудованого провайдера `zai` такими моделями:

| Model ref            | Примітки             |
| -------------------- | -------------------- |
| `zai/glm-5.1`        | Модель за замовчуванням |
| `zai/glm-5`          |                      |
| `zai/glm-5-turbo`    |                      |
| `zai/glm-5v-turbo`   |                      |
| `zai/glm-4.7`        |                      |
| `zai/glm-4.7-flash`  |                      |
| `zai/glm-4.7-flashx` |                      |
| `zai/glm-4.6`        |                      |
| `zai/glm-4.6v`       |                      |
| `zai/glm-4.5`        |                      |
| `zai/glm-4.5-air`    |                      |
| `zai/glm-4.5-flash`  |                      |
| `zai/glm-4.5v`       |                      |

<Tip>
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`). Вбудоване посилання на модель за замовчуванням — `zai/glm-5.1`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме резолювання невідомих моделей GLM-5">
    Невідомі ідентифікатори `glm-5*` усе ще напряму резолюються через шлях вбудованого провайдера
    шляхом синтезу метаданих, що належать провайдеру, із шаблону `glm-4.7`, коли ідентифікатор
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Потокове передавання викликів інструментів">
    `tool_stream` увімкнено за замовчуванням для потокового передавання викликів інструментів Z.AI. Щоб вимкнути це:

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

  <Accordion title="Деталі автентифікації">
    - Z.AI використовує Bearer auth з вашим API-ключем.
    - Варіант онбордингу `zai-api-key` автоматично визначає відповідний endpoint Z.AI за префіксом ключа.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), якщо хочете примусово вибрати певну поверхню API.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сімейство моделей GLM" href="/uk/providers/glm" icon="microchip">
    Огляд сімейства моделей GLM.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>
