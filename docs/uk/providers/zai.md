---
read_when:
    - Вам потрібні моделі Z.AI / GLM в OpenClaw
    - Вам потрібне просте налаштування ZAI_API_KEY
summary: Використання Z.AI (моделей GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-01T13:14:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує провайдер `zai`
з API-ключем Z.AI.

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- API: Z.AI Chat Completions (автентифікація Bearer)

## Початок роботи

<Tabs>
  <Tab title="Автовиявлення кінцевої точки">
    **Найкраще для:** більшості користувачів. OpenClaw визначає відповідну кінцеву точку Z.AI за ключем і автоматично застосовує правильну базову URL-адресу.

    <Steps>
      <Step title="Запустіть початкове налаштування">
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
      <Step title="Перевірте, що модель є у списку">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Явна регіональна кінцева точка">
    **Найкраще для:** користувачів, які хочуть примусово вибрати певний Coding Plan або загальну поверхню API.

    <Steps>
      <Step title="Виберіть правильний варіант початкового налаштування">
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
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель є у списку">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Вбудований каталог

OpenClaw постачається з комплектним каталогом провайдера `zai` у маніфесті Plugin, тому список
лише для читання може показувати відомі рядки GLM без завантаження середовища виконання провайдера:

```bash
openclaw models list --all --provider zai
```

Каталог на основі маніфесту наразі містить:

| Посилання на модель | Примітки               |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Модель за замовчуванням |
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
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`). Комплектне посилання на модель за замовчуванням — `zai/glm-5.1`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме розпізнавання невідомих моделей GLM-5">
    Невідомі ідентифікатори `glm-5*` усе одно розпізнаються наперед у комплектному шляху провайдера шляхом
    синтезу метаданих, якими володіє провайдер, із шаблону `glm-4.7`, коли ідентифікатор
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Потокове передавання викликів інструментів">
    `tool_stream` увімкнено за замовчуванням для потокового передавання викликів інструментів Z.AI. Щоб вимкнути його:

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

  <Accordion title="Мислення та збережене мислення">
    Мислення Z.AI дотримується елементів керування `/think` в OpenClaw. Коли мислення вимкнено,
    OpenClaw надсилає `thinking: { type: "disabled" }`, щоб уникнути відповідей, які
    витрачають бюджет виводу на `reasoning_content` перед видимим текстом.

    Збережене мислення вмикається явно, тому що Z.AI вимагає повторного відтворення повного історичного
    `reasoning_content`, що збільшує кількість токенів запиту. Увімкніть його
    для окремої моделі:

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

    Коли це ввімкнено і мислення активне, OpenClaw надсилає
    `thinking: { type: "enabled", clear_thinking: false }` і повторно відтворює попередній
    `reasoning_content` для того самого OpenAI-сумісного транскрипту.

    Досвідчені користувачі все ще можуть перевизначити точне корисне навантаження провайдера за допомогою
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Розуміння зображень">
    Комплектний Plugin Z.AI реєструє розуміння зображень.

    | Властивість   | Значення    |
    | ------------- | ----------- |
    | Модель        | `glm-4.6v`  |

    Розуміння зображень автоматично розпізнається з налаштованої автентифікації Z.AI — жодна
    додаткова конфігурація не потрібна.

  </Accordion>

  <Accordion title="Деталі автентифікації">
    - Z.AI використовує автентифікацію Bearer із вашим API-ключем.
    - Варіант початкового налаштування `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI за префіксом ключа.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), коли потрібно примусово вибрати певну поверхню API.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сімейство моделей GLM" href="/uk/providers/glm" icon="microchip">
    Огляд сімейства моделей для GLM.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>
