---
read_when:
    - Вам потрібні моделі GLM в OpenClaw
    - Вам потрібні правила іменування моделей і налаштування
summary: Огляд сімейства моделей GLM і способи його використання в OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T00:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM — це сімейство моделей (а не компанія), доступне через платформу [Z.AI](https://z.ai). В OpenClaw моделі GLM доступні через вбудований провайдер `zai` із посиланнями на кшталт `zai/glm-5.1`.

| Властивість               | Значення                                                                    |
| ------------------------- | --------------------------------------------------------------------------- |
| Ідентифікатор провайдера  | `zai`                                                                       |
| Plugin                    | вбудований, `enabledByDefault: true`                                        |
| Змінні середовища для auth | `ZAI_API_KEY` або `Z_AI_API_KEY`                                            |
| Варіанти onboarding       | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                       | сумісний з OpenAI                                                           |
| Базова URL-адреса за замовчуванням | `https://api.z.ai/api/paas/v4`                                      |
| Запропонована модель за замовчуванням | `zai/glm-5.1`                                                    |
| Модель зображень за замовчуванням | `zai/glm-4.6v`                                                       |

## Початок роботи

<Steps>
  <Step title="Виберіть маршрут auth і запустіть onboarding">
    Виберіть варіант onboarding, який відповідає вашому плану Z.AI та регіону. Загальний варіант `zai-api-key` автоматично визначає відповідну кінцеву точку за формою ключа; використовуйте явні регіональні варіанти, коли потрібно примусово вибрати певний Coding Plan або загальну поверхню API.

    | Варіант auth        | Найкраще підходить для                              |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Загального API-ключа з автоматичним визначенням кінцевої точки |
    | `zai-coding-global` | Користувачів Coding Plan (глобально)                |
    | `zai-coding-cn`     | Користувачів Coding Plan (регіон Китаю)             |
    | `zai-global`        | Загального API (глобально)                          |
    | `zai-cn`            | Загального API (регіон Китаю)                       |

    <CodeGroup>

```bash Автовизначення
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (глобально)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (Китай)
openclaw onboard --auth-choice zai-coding-cn
```

```bash Загальний API (глобально)
openclaw onboard --auth-choice zai-global
```

```bash Загальний API (Китай)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

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
  `zai-api-key` дає OpenClaw змогу визначити відповідну кінцеву точку Z.AI за формою ключа й автоматично застосувати правильну базову URL-адресу. Використовуйте явні регіональні варіанти, коли потрібно закріпити певний Coding Plan або загальну поверхню API.
</Tip>

## Вбудований каталог

Вбудований провайдер `zai` додає 13 посилань на моделі GLM. Усі записи підтримують reasoning, якщо не зазначено інше; `glm-5v-turbo` і `glm-4.6v` приймають введення зображень, а також текст.

| Посилання на модель  | Примітки                                          |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Модель за замовчуванням. Reasoning, лише текст, контекст 202k. |
| `zai/glm-5`          | Reasoning, лише текст, контекст 202k.             |
| `zai/glm-5-turbo`    | Reasoning, лише текст, контекст 202k.             |
| `zai/glm-5v-turbo`   | Reasoning, текст + зображення, контекст 202k.     |
| `zai/glm-4.7`        | Reasoning, лише текст, контекст 204k.             |
| `zai/glm-4.7-flash`  | Reasoning, лише текст, контекст 200k.             |
| `zai/glm-4.7-flashx` | Reasoning, лише текст.                            |
| `zai/glm-4.6`        | Reasoning, лише текст.                            |
| `zai/glm-4.6v`       | Reasoning, текст + зображення. Модель зображень за замовчуванням. |
| `zai/glm-4.5`        | Reasoning, лише текст.                            |
| `zai/glm-4.5-air`    | Reasoning, лише текст.                            |
| `zai/glm-4.5-flash`  | Reasoning, лише текст.                            |
| `zai/glm-4.5v`       | Reasoning, текст + зображення.                    |

<Note>
  Версії GLM і доступність можуть змінюватися. Запустіть `openclaw models list --provider zai`, щоб побачити рядки каталогу, відомі вашій установленій версії, і перевіряйте документацію Z.AI щодо новододаних або застарілих моделей.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автоматичне визначення кінцевої точки">
    Коли ви використовуєте варіант auth `zai-api-key`, OpenClaw перевіряє форму ключа, щоб визначити правильну базову URL-адресу Z.AI. Явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) перевизначають автовизначення й напряму закріплюють кінцеву точку.
  </Accordion>

  <Accordion title="Відомості про провайдера">
    Моделі GLM обслуговує runtime-провайдер `zai`. Повну конфігурацію провайдера, регіональні кінцеві точки та додаткові можливості див. на [сторінці провайдера Z.AI](/uk/providers/zai).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Z.AI" href="/uk/providers/zai" icon="server">
    Повна конфігурація провайдера Z.AI і регіональні кінцеві точки.
  </Card>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні `/think` для сімейства GLM із підтримкою reasoning.
  </Card>
  <Card title="FAQ щодо моделей" href="/uk/help/faq-models" icon="circle-question">
    Профілі auth, перемикання моделей і усунення помилок "no profile".
  </Card>
</CardGroup>
