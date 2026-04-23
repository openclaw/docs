---
read_when:
    - Ви хочете використовувати моделі GLM в OpenClaw
    - Вам потрібні схема найменування моделей і налаштування
summary: Огляд сімейства моделей GLM і як використовувати його в OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-23T21:06:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf9d5de6d9297b1f79ca9b882296272948f2fc042b162e3095ac44d46e89206
    source_path: providers/glm.md
    workflow: 15
---

# Моделі GLM

GLM — це **сімейство моделей** (а не компанія), доступне через платформу Z.AI. В OpenClaw моделі GLM
доступні через provider `zai` та ID моделей на кшталт `zai/glm-5`.

## Початок роботи

<Steps>
  <Step title="Виберіть шлях auth і запустіть onboarding">
    Виберіть варіант onboarding, який відповідає вашому тарифу Z.AI та регіону:

    | Варіант auth | Найкраще підходить для |
    | ------------ | ---------------------- |
    | `zai-api-key` | Загальне налаштування API key з автоматичним визначенням endpoint |
    | `zai-coding-global` | Користувачів Coding Plan (global) |
    | `zai-coding-cn` | Користувачів Coding Plan (регіон China) |
    | `zai-global` | Загального API (global) |
    | `zai-cn` | Загального API (регіон China) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Задайте GLM як типову модель">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Приклад config

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` дає змогу OpenClaw визначити відповідний endpoint Z.AI за ключем і
автоматично застосувати правильний base URL. Використовуйте явні регіональні варіанти,
коли хочете примусово вибрати конкретну поверхню Coding Plan або загального API.
</Tip>

## Bundled моделі GLM

Наразі OpenClaw ініціалізує bundled provider `zai` такими посиланнями GLM:

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
Типове bundled-посилання на модель — `zai/glm-5.1`. Версії GLM і їхня доступність
можуть змінюватися; перевіряйте документацію Z.AI для актуальної інформації.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автоматичне визначення endpoint">
    Коли ви використовуєте варіант auth `zai-api-key`, OpenClaw аналізує формат ключа,
    щоб визначити правильний base URL Z.AI. Явні регіональні варіанти
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) перевизначають
    автоматичне визначення й напряму фіксують endpoint.
  </Accordion>

  <Accordion title="Подробиці provider-а">
    Моделі GLM обслуговуються runtime provider-ом `zai`. Повну
    конфігурацію provider-а, регіональні endpoint-и та додаткові можливості див.
    у [документації provider-а Z.AI](/uk/providers/zai).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/uk/providers/zai" icon="server">
    Повна конфігурація provider-а Z.AI та регіональні endpoint-и.
  </Card>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>
