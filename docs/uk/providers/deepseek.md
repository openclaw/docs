---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища ключа API або вибір автентифікації CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з OpenAI-сумісним API.

| Властивість | Значення                   |
| -------- | -------------------------- |
| Постачальник | `deepseek`                 |
| Автентифікація | `DEEPSEEK_API_KEY`         |
| API      | OpenAI-сумісний            |
| Базова URL-адреса | `https://api.deepseek.com` |

## Встановлення Plugin

Встановіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

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

    Щоб переглянути статичний каталог Plugin без потреби в запущеному Gateway,
    використайте:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для скриптових або headless-встановлень передайте всі прапорці напряму:

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
Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `DEEPSEEK_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання на модель          | Назва             | Ввід  | Контекст  | Максимальний вивід | Примітки                                  |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Модель за замовчуванням; поверхня V4 з підтримкою мислення |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Поверхня V4 з підтримкою мислення          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Поверхня DeepSeek V3.2 без мислення        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Поверхня V3.2 з підтримкою reasoning       |

<Tip>
Моделі V4 підтримують керування DeepSeek `thinking`. OpenClaw також відтворює
DeepSeek `reasoning_content` у наступних ходах, щоб сесії мислення з викликами
інструментів могли продовжуватися.
Використовуйте `/think xhigh` або `/think max` з моделями DeepSeek V4, щоб запросити максимальний
`reasoning_effort` DeepSeek.
</Tip>

## Мислення та інструменти

Сесії мислення DeepSeek V4 мають суворіший контракт відтворення, ніж більшість
OpenAI-сумісних постачальників: після того як хід із увімкненим мисленням використовує інструменти, DeepSeek
очікує, що відтворені повідомлення асистента з цього ходу міститимуть
`reasoning_content` у наступних запитах. OpenClaw обробляє це всередині
DeepSeek Plugin, тому звичайне багатокрокове використання інструментів працює з
`deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`.

Якщо ви перемикаєте наявну сесію з іншого OpenAI-сумісного постачальника на
модель DeepSeek V4, старі ходи асистента з викликами інструментів можуть не мати нативного
DeepSeek `reasoning_content`. OpenClaw заповнює це відсутнє поле у відтворених
повідомленнях асистента для запитів мислення DeepSeek V4, щоб постачальник міг прийняти
історію без потреби в `/new`.

Коли мислення вимкнено в OpenClaw (зокрема вибір **None** в UI),
OpenClaw надсилає DeepSeek `thinking: { type: "disabled" }` і вилучає відтворений
`reasoning_content` з вихідної історії. Це утримує сесії з вимкненим мисленням
на шляху DeepSeek без мислення.

Використовуйте `deepseek/deepseek-v4-flash` для стандартного швидкого шляху. Використовуйте
`deepseek/deepseek-v4-pro`, коли потрібна сильніша модель V4 і прийнятні
вища вартість або затримка.

## Live-тестування

Прямий live-набір моделей містить DeepSeek V4 у сучасному наборі моделей. Щоб
запустити лише прямі перевірки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ця live-перевірка підтверджує, що обидві моделі V4 можуть завершувати відповіді та що ходи продовження з мисленням/інструментами
зберігають payload відтворення, потрібний DeepSeek.

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
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і постачальників.
  </Card>
</CardGroup>
