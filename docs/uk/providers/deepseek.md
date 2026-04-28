---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Потрібна змінна середовища з API-ключем або вибір автентифікації через CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-28T11:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з API, сумісним з OpenAI.

| Властивість | Значення                   |
| -------- | -------------------------- |
| Провайдер | `deepseek`                 |
| Автентифікація | `DEEPSEEK_API_KEY`         |
| API      | сумісний з OpenAI          |
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
    Для скриптових або безголових інсталяцій передайте всі прапорці напряму:

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

| Посилання на модель          | Назва             | Вхід | Контекст  | Макс. вихід | Примітки                                  |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Модель за замовчуванням; V4 поверхня з підтримкою мислення |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 поверхня з підтримкою мислення          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 поверхня без мислення        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | V3.2 поверхня з увімкненим міркуванням     |

<Tip>
Моделі V4 підтримують керування `thinking` від DeepSeek. OpenClaw також відтворює
DeepSeek `reasoning_content` у наступних ходах, щоб сеанси мислення з викликами
інструментів могли продовжуватися.
</Tip>

## Мислення та інструменти

Сеанси мислення DeepSeek V4 мають суворіший контракт відтворення, ніж більшість
провайдерів, сумісних з OpenAI: після того як хід із увімкненим мисленням використовує інструменти, DeepSeek
очікує, що відтворені повідомлення асистента з цього ходу міститимуть
`reasoning_content` у наступних запитах. OpenClaw обробляє це всередині
DeepSeek plugin, тому звичайне багатокрокове використання інструментів працює з
`deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`.

Якщо ви перемикаєте наявний сеанс з іншого провайдера, сумісного з OpenAI, на
модель DeepSeek V4, старі ходи асистента з викликами інструментів можуть не мати нативного
DeepSeek `reasoning_content`. OpenClaw заповнює це відсутнє поле у відтворених
повідомленнях асистента для запитів мислення DeepSeek V4, щоб провайдер міг прийняти
історію без потреби в `/new`.

Коли мислення вимкнено в OpenClaw (зокрема вибір **Немає** в інтерфейсі),
OpenClaw надсилає DeepSeek `thinking: { type: "disabled" }` і вилучає відтворений
`reasoning_content` з вихідної історії. Це утримує сеанси з вимкненим мисленням
на шляху DeepSeek без мислення.

Використовуйте `deepseek/deepseek-v4-flash` для типового швидкого шляху. Використовуйте
`deepseek/deepseek-v4-pro`, коли вам потрібна сильніша модель V4 і ви можете прийняти
вищу вартість або затримку.

## Живе тестування

Прямий набір живих тестів моделей містить DeepSeek V4 у сучасному наборі моделей. Щоб
запустити лише прямі перевірки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ця жива перевірка підтверджує, що обидві моделі V4 можуть завершувати відповіді, а ходи
продовження з мисленням/інструментами зберігають корисне навантаження відтворення, потрібне DeepSeek.

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
    Вибір провайдерів, посилань на моделі та поведінки перемикання в разі збою.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
