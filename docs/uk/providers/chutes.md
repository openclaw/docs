---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен шлях налаштування OAuth або ключа API
    - Вам потрібні модель за замовчуванням, псевдоніми або поведінка виявлення
summary: Налаштування Chutes (OAuth або ключ API, виявлення моделей, псевдоніми)
title: Chutes
x-i18n:
    generated_at: "2026-04-28T11:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) надає каталоги моделей із відкритим кодом через
API, сумісний з OpenAI. OpenClaw підтримує як браузерний OAuth, так і пряму
автентифікацію ключем API для вбудованого провайдера `chutes`.

| Властивість | Значення                     |
| -------- | ---------------------------- |
| Провайдер | `chutes`                     |
| API      | сумісний з OpenAI            |
| Базовий URL | `https://llm.chutes.ai/v1`   |
| Автентифікація | OAuth або ключ API (див. нижче) |

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть процес онбордингу OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw запускає браузерний процес локально або показує URL + процес
        вставлення перенаправлення на віддалених/безголових хостах. Токени OAuth
        автоматично оновлюються через профілі автентифікації OpenClaw.
      </Step>
      <Step title="Перевірте модель за замовчуванням">
        Після онбордингу модель за замовчуванням встановлюється на
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ на сторінці
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Запустіть процес онбордингу ключа API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Перевірте модель за замовчуванням">
        Після онбордингу модель за замовчуванням встановлюється на
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Обидва способи автентифікації реєструють вбудований каталог Chutes і встановлюють модель за замовчуванням на
`chutes/zai-org/GLM-4.7-TEE`. Змінні середовища часу виконання: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Поведінка виявлення

Коли автентифікація Chutes доступна, OpenClaw запитує каталог Chutes із цими
обліковими даними й використовує виявлені моделі. Якщо виявлення завершується невдало, OpenClaw
повертається до вбудованого статичного каталогу, тож онбординг і запуск однаково працюють.

## Псевдоніми за замовчуванням

OpenClaw реєструє три зручні псевдоніми для вбудованого каталогу Chutes:

| Псевдонім       | Цільова модель                                      |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Вбудований стартовий каталог

Вбудований резервний каталог містить поточні refs Chutes:

| Посилання на модель                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Перевизначення OAuth">
    Ви можете налаштувати процес OAuth за допомогою необов’язкових змінних середовища:

    | Змінна | Призначення |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Власний ідентифікатор клієнта OAuth |
    | `CHUTES_CLIENT_SECRET` | Власний секрет клієнта OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | Власний URI перенаправлення |
    | `CHUTES_OAUTH_SCOPES` | Власні області OAuth |

    Див. [документацію Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    щодо вимог до застосунків перенаправлення та довідки.

  </Accordion>

  <Accordion title="Примітки">
    - Виявлення за ключем API та OAuth використовують той самий id провайдера `chutes`.
    - Моделі Chutes реєструються як `chutes/<model-id>`.
    - Якщо виявлення під час запуску завершується невдало, автоматично використовується вбудований статичний каталог.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, refs моделей і поведінка відмовостійкого перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель Chutes і документація API.
  </Card>
  <Card title="Ключі API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Створюйте ключі API Chutes і керуйте ними.
  </Card>
</CardGroup>
