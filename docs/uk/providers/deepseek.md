---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Потрібна змінна середовища для ключа API або вибір автентифікації CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T15:38:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) надає потужні моделі ШІ з API, сумісним з OpenAI.

| Властивість | Значення                   |
| ----------- | -------------------------- |
| Провайдер   | `deepseek`                 |
| Автентифікація | `DEEPSEEK_API_KEY`      |
| API         | сумісний з OpenAI          |
| Базова URL-адреса | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Це запросить ваш API-ключ і встановить `deepseek/deepseek-v4-flash` як модель за замовчуванням.

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
    Для скриптових або headless-інсталяцій передайте всі прапорці напряму:

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
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання на модель          | Назва             | Вхідні дані | Контекст  | Максимальний вивід | Примітки                                  |
| ---------------------------- | ----------------- | ----------- | --------- | ------------------ | ----------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text        | 1,000,000 | 384,000            | Модель за замовчуванням; поверхня V4 з підтримкою мислення |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text        | 1,000,000 | 384,000            | Поверхня V4 з підтримкою мислення         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text        | 131,072   | 8,192              | Поверхня DeepSeek V3.2 без мислення       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text        | 131,072   | 65,536             | Поверхня V3.2 з увімкненим reasoning      |

<Tip>
Моделі V4 підтримують керування `thinking` від DeepSeek. OpenClaw також відтворює
`reasoning_content` DeepSeek у наступних ходах, щоб сесії мислення з викликами
інструментів могли продовжуватися.
Використовуйте `/think xhigh` або `/think max` з моделями DeepSeek V4, щоб запросити максимальне
значення `reasoning_effort` від DeepSeek.
</Tip>

## Мислення та інструменти

Сесії мислення DeepSeek V4 мають суворіший контракт відтворення, ніж більшість
провайдерів, сумісних з OpenAI: після того як хід із увімкненим мисленням використовує інструменти, DeepSeek
очікує, що відтворені повідомлення асистента з цього ходу міститимуть
`reasoning_content` у наступних запитах. OpenClaw обробляє це всередині
Plugin DeepSeek, тому звичайне багатоходове використання інструментів працює з
`deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`.

Якщо ви перемикаєте наявну сесію з іншого провайдера, сумісного з OpenAI, на
модель DeepSeek V4, старі ходи асистента з викликами інструментів можуть не мати нативного
`reasoning_content` DeepSeek. OpenClaw заповнює це відсутнє поле у відтворених
повідомленнях асистента для запитів мислення DeepSeek V4, щоб провайдер міг прийняти
історію без потреби в `/new`.

Коли мислення вимкнено в OpenClaw (включно з вибором **None** в UI),
OpenClaw надсилає DeepSeek `thinking: { type: "disabled" }` і вилучає відтворений
`reasoning_content` з вихідної історії. Це залишає сесії з вимкненим мисленням
на шляху DeepSeek без мислення.

Використовуйте `deepseek/deepseek-v4-flash` як стандартний швидкий шлях. Використовуйте
`deepseek/deepseek-v4-pro`, коли потрібна сильніша модель V4 і ви готові прийняти
вищу вартість або затримку.

## Live-тестування

Прямий live-набір моделей включає DeepSeek V4 у сучасному наборі моделей. Щоб
запустити лише прямі перевірки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ця live-перевірка підтверджує, що обидві моделі V4 можуть завершувати роботу, а також що наступні ходи
з мисленням та інструментами зберігають payload відтворення, потрібний DeepSeek.

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
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
