---
read_when:
    - Ви хочете моделі GLM в OpenClaw
    - Вам потрібні угода про найменування моделей і налаштування
summary: Огляд сімейства моделей GLM + як використовувати його в OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T10:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# Моделі GLM

GLM — це **сімейство моделей** (а не компанія), доступне через платформу Z.AI. В OpenClaw моделі GLM
доступні через провайдер `zai` та ідентифікатори моделей на кшталт `zai/glm-5`.

## Початок роботи

<Steps>
  <Step title="Виберіть спосіб автентифікації та запустіть онбординг">
    Виберіть варіант онбордингу, який відповідає вашому плану Z.AI та регіону:

    | Auth choice | Найкраще підходить для |
    | ----------- | ---------------------- |
    | `zai-api-key` | Загального налаштування API-ключа з автовизначенням endpoint |
    | `zai-coding-global` | користувачів плану Coding Plan (глобально) |
    | `zai-coding-cn` | користувачів плану Coding Plan (регіон Китай) |
    | `zai-global` | загального API (глобально) |
    | `zai-cn` | загального API (регіон Китай) |

    ```bash
    # Приклад: загальне автовизначення
    openclaw onboard --auth-choice zai-api-key

    # Приклад: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Установіть GLM як модель за замовчуванням">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Перевірте, що моделі доступні">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Приклад конфігурації

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` дає OpenClaw змогу визначити відповідний endpoint Z.AI за ключем і
автоматично застосувати правильний base URL. Використовуйте явні регіональні варіанти, якщо
хочете примусово вибрати конкретний план Coding Plan або загальний API surface.
</Tip>

## Вбудовані моделі GLM

Наразі OpenClaw додає до вбудованого провайдера `zai` такі посилання GLM:

| Модель          | Модель           |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Вбудоване посилання моделі за замовчуванням — `zai/glm-5.1`. Версії GLM і їхня доступність
можуть змінюватися; перевіряйте документацію Z.AI, щоб дізнатися про найновіші дані.
</Note>

## Розширені примітки

<AccordionGroup>
  <Accordion title="Автовизначення endpoint">
    Коли ви використовуєте варіант автентифікації `zai-api-key`, OpenClaw аналізує формат ключа,
    щоб визначити правильний base URL Z.AI. Явні регіональні варіанти
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) перевизначають
    автовизначення й напряму фіксують endpoint.
  </Accordion>

  <Accordion title="Відомості про провайдера">
    Моделі GLM надаються runtime-провайдером `zai`. Повну інформацію про конфігурацію провайдера,
    регіональні endpoint та додаткові можливості див. у
    [документації провайдера Z.AI](/uk/providers/zai).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Z.AI" href="/uk/providers/zai" icon="server">
    Повна конфігурація провайдера Z.AI та регіональні endpoint.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки резервного перемикання.
  </Card>
</CardGroup>
