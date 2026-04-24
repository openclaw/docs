---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища з API-ключем або варіант автентифікації через CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:33:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6e9d4e24204cbc097c13ccd837d7a6f8dd36538f1b22aae644762b88b948d0f
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з API, сумісним з OpenAI.

| Властивість | Значення                  |
| ----------- | ------------------------- |
| Провайдер   | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`     |
| API         | Сумісний з OpenAI         |
| Базовий URL | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Це запропонує ввести ваш API-ключ і встановить `deepseek/deepseek-v4-flash` як модель за замовчуванням.

  </Step>
  <Step title="Перевірте, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```

    Щоб переглянути вбудований статичний каталог без потреби в запущеному Gateway,
    використайте:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценаріїв встановлення або безголового розгортання передайте всі прапорці безпосередньо:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `DEEPSEEK_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання на модель         | Назва             | Вхід | Контекст  | Макс. вивід | Нотатки                                    |
| --------------------------- | ----------------- | ---- | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000 | 384,000     | Модель за замовчуванням; поверхня V4 з підтримкою thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text | 1,000,000 | 384,000     | Поверхня V4 з підтримкою thinking          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072   | 8,192       | Поверхня DeepSeek V3.2 без thinking        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072   | 65,536      | Поверхня V3.2 з увімкненим міркуванням     |

<Tip>
Моделі V4 підтримують керування `thinking` від DeepSeek. OpenClaw також відтворює
`reasoning_content` DeepSeek на наступних ходах, щоб сесії thinking із викликами
інструментів могли продовжуватися.
</Tip>

## Thinking та інструменти

Сесії thinking у DeepSeek V4 мають суворіший контракт відтворення, ніж у більшості
провайдерів, сумісних з OpenAI: коли повідомлення помічника з увімкненим thinking містить
виклики інструментів, DeepSeek очікує, що попередній `reasoning_content` помічника буде
надіслано назад у наступному запиті. OpenClaw обробляє це всередині Plugin DeepSeek,
тому звичайне багатокрокове використання інструментів працює з `deepseek/deepseek-v4-flash` і
`deepseek/deepseek-v4-pro`.

Коли thinking вимкнено в OpenClaw (включно з вибором **None** в UI),
OpenClaw надсилає DeepSeek `thinking: { type: "disabled" }` і прибирає відтворений
`reasoning_content` з вихідної історії. Це зберігає сесії з вимкненим thinking
на шляху DeepSeek без thinking.

Використовуйте `deepseek/deepseek-v4-flash` для стандартного швидкого шляху. Використовуйте
`deepseek/deepseek-v4-pro`, коли вам потрібна потужніша модель V4 і ви можете прийняти
вищу вартість або затримку.

## Живе тестування

Набір прямих live-тестів моделей включає DeepSeek V4 у сучасному наборі моделей. Щоб
запустити лише прямі перевірки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ця live-перевірка підтверджує, що обидві моделі V4 можуть завершувати виконання і що
наступні ходи thinking/інструментів зберігають payload відтворення, якого вимагає DeepSeek.

## Приклад конфігурації

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
