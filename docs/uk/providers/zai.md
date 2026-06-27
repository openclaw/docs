---
read_when:
    - Вам потрібні моделі Z.AI / GLM в OpenClaw
    - Потрібне просте налаштування ZAI_API_KEY
summary: Використання Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:15:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і
використовує API-ключі для автентифікації. Створіть свій API-ключ у консолі Z.AI.
OpenClaw використовує провайдера `zai` з API-ключем Z.AI.

| Властивість | Значення                                      |
| -------- | -------------------------------------------- |
| Провайдер | `zai`                                        |
| Пакет  | `@openclaw/zai-provider`                     |
| Автентифікація | `ZAI_API_KEY` (застарілий псевдонім: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer auth)          |

## Моделі GLM

GLM — це сімейство моделей, а не окремий провайдер. В OpenClaw моделі GLM використовують
посилання на кшталт `zai/glm-5.2`: провайдер `zai`, ідентифікатор моделі `glm-5.2`.

## Початок роботи

Спершу встановіть Plugin провайдера:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Автовиявлення кінцевої точки">
    **Найкраще для:** більшості користувачів. OpenClaw перевіряє підтримувані кінцеві точки Z.AI з вашим API-ключем і автоматично застосовує правильну базову URL-адресу.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice zai-api-key
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
    **Найкраще для:** користувачів, які хочуть примусово задати конкретний Coding Plan або загальну поверхню API.

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
      <Step title="Перевірте, що модель є у списку">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Приклад конфігурації

<Tip>
`zai-api-key` дає OpenClaw змогу визначити відповідну кінцеву точку Z.AI за ключем і
автоматично застосувати правильну базову URL-адресу. Використовуйте явні регіональні варіанти, коли
хочете примусово задати конкретний Coding Plan або загальну поверхню API.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Вбудований каталог

Plugin провайдера `zai` постачає свій каталог у маніфесті Plugin, тому список лише для читання
може показувати відомі рядки GLM без завантаження runtime провайдера:

```bash
openclaw models list --all --provider zai
```

Каталог на основі маніфесту наразі містить:

| Посилання на модель | Примітки                        |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Типовий Coding Plan; контекст 1M |
| `zai/glm-5.1`        | Типовий загальний API           |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 підтримує рівні мислення `off`, `low`, `high` і `max`. OpenClaw зіставляє
`low` і `high` із високим reasoning effort Z.AI, а `max` — з максимальним effort.
</Tip>

<Note>
Налаштування Coding Plan за замовчуванням використовує `zai/glm-5.2`; налаштування загального API зберігає
`zai/glm-5.1`. Автовиявлення кінцевої точки повертається до `glm-5.1` або `glm-4.7`,
коли вибраний план не надає GLM-5.2. Версії GLM і доступність
можуть змінюватися; запустіть `openclaw models list --all --provider zai`, щоб побачити каталог,
відомий вашій установленій версії.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме розвʼязання невідомих моделей GLM-5">
    Невідомі ідентифікатори `glm-5*` і далі розвʼязуються вперед у шляху провайдера шляхом
    синтезування метаданих, що належать провайдеру, з шаблону `glm-4.7`, коли ідентифікатор
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Потокова передача tool-call">
    `tool_stream` увімкнено за замовчуванням для потокової передачі tool-call Z.AI. Щоб вимкнути її:

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
    Мислення Z.AI дотримується елементів керування `/think` OpenClaw. Коли мислення вимкнено,
    OpenClaw надсилає `thinking: { type: "disabled" }`, щоб уникнути відповідей, які
    витрачають бюджет виводу на `reasoning_content` перед видимим текстом.

    Збережене мислення є опціональним, бо Z.AI вимагає повторного відтворення повного історичного
    `reasoning_content`, що збільшує кількість токенів підказки. Увімкніть його
    для окремої моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Коли це ввімкнено і мислення активне, OpenClaw надсилає
    `thinking: { type: "enabled", clear_thinking: false }` і повторно відтворює попередній
    `reasoning_content` для тієї самої OpenAI-сумісної розмови.

    Досвідчені користувачі все ще можуть перевизначити точне навантаження провайдера за допомогою
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Розуміння зображень">
    Plugin Z.AI реєструє розуміння зображень.

    | Властивість  | Значення    |
    | ------------- | ----------- |
    | Модель        | `glm-4.6v`  |

    Розуміння зображень автоматично розвʼязується з налаштованої автентифікації Z.AI — жодна
    додаткова конфігурація не потрібна.

  </Accordion>

  <Accordion title="Деталі автентифікації">
    - Z.AI використовує Bearer auth із вашим API-ключем.
    - Варіант онбордингу `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI, перевіряючи підтримувані кінцеві точки з вашим ключем.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), коли хочете примусово задати конкретну поверхню API.
    - Застаріла змінна середовища `Z_AI_API_KEY` усе ще приймається; OpenClaw копіює її в `ZAI_API_KEY` під час запуску, якщо `ZAI_API_KEY` не встановлено.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації OpenClaw, включно з налаштуваннями провайдера та моделі.
  </Card>
</CardGroup>
