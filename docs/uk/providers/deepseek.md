---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища з ключем API або вибір автентифікації в CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T13:36:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) надає потужні моделі ШІ з API, сумісним з OpenAI.

| Властивість | Значення                   |
| ----------- | -------------------------- |
| Постачальник | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`      |
| API         | Сумісний з OpenAI          |
| Базова URL-адреса | `https://api.deepseek.com` |

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Запитує ключ API та встановлює `deepseek/deepseek-v4-flash` як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```

    Щоб переглянути статичний каталог Plugin без запущеного Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценарних установлень або установлень без графічного інтерфейсу передайте всі прапорці безпосередньо:

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
доступна цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання на модель          | Назва             | Вхідні дані | Контекст  | Максимальний обсяг виведення | Примітки                                            |
| ---------------------------- | ----------------- | ----------- | --------- | ---------------------------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | текст       | 1,000,000 | 384,000                      | Модель за замовчуванням; поверхня V4 із підтримкою міркування |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | текст       | 1,000,000 | 384,000                      | Поверхня V4 із підтримкою міркування                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | текст       | 1,000,000 | 384,000                      | Застаріла назва для сумісності з V4 Flash без міркування |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | текст       | 1,000,000 | 384,000                      | Застаріла назва для сумісності з V4 Flash у режимі міркування |

<Warning>
DeepSeek припинить підтримку `deepseek-chat` і `deepseek-reasoner` 24 липня 2026 року
о 15:59 UTC. Наразі вони переспрямовуються до DeepSeek V4 Flash у режимах без
міркування та з міркуванням відповідно. До цього терміну змініть налаштовані
посилання на моделі на `deepseek/deepseek-v4-flash` або
`deepseek/deepseek-v4-pro`.
</Warning>

Локальні оцінки вартості OpenClaw відповідають опублікованим DeepSeek тарифам
для влучань у кеш, промахів кешу та виведення. DeepSeek може змінювати ці тарифи;
для виставлення рахунків визначальною є сторінка
[Моделі й ціни](https://api-docs.deepseek.com/quick_start/pricing/).

<Tip>
Моделі V4 підтримують керування `thinking` від DeepSeek. OpenClaw також повторно
передає DeepSeek `reasoning_content` у наступних ходах, щоб сеанси міркування з
викликами інструментів могли продовжуватися.
Використовуйте `/think xhigh` або `/think max` з моделями DeepSeek V4, щоб
запросити максимальне значення `reasoning_effort` від DeepSeek; обидва варіанти
відображаються на `"max"`.
</Tip>

## Міркування та інструменти

У сеансах міркування DeepSeek V4 повторно передані повідомлення асистента з ходу
з увімкненим міркуванням мають містити `reasoning_content` у наступних запитах.
Plugin DeepSeek для OpenClaw автоматично заповнює це поле, тому звичайне
багатоходове використання інструментів працює з `deepseek/deepseek-v4-flash` і
`deepseek/deepseek-v4-pro`, навіть якщо історію отримано від іншого
постачальника, сумісного з OpenAI (без нативного `reasoning_content`), або зі
звичайного повідомлення асистента. Після зміни постачальника посеред сеансу
команда `/new` не потрібна.

Коли міркування вимкнено (зокрема вибрано **None** в інтерфейсі), OpenClaw
надсилає `thinking: { type: "disabled" }` і вилучає повторно переданий
`reasoning_content` з вихідної історії, залишаючи сеанс на шляху DeepSeek без
міркування.

Використовуйте `deepseek/deepseek-v4-flash` як швидкий шлях за замовчуванням.
Використовуйте `deepseek/deepseek-v4-pro` як потужнішу модель, якщо прийнятні
вища вартість або затримка.

## Тестування наживо

Щоб запустити лише перевірки безпосередніх моделей DeepSeek V4 із сучасного
набору тестів моделей наживо:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Перевіряє, що обидві моделі V4 завершують роботу, а наступні ходи з
міркуванням та інструментами зберігають повторно передане корисне навантаження,
якого потребує DeepSeek.

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

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації агентів, моделей і постачальників.
  </Card>
</CardGroup>
