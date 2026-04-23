---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібні env var для API key Fireworks або ID типової моделі
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Fireworks
x-i18n:
    generated_at: "2026-04-23T21:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) надає моделі з відкритими вагами та маршрутизовані моделі через OpenAI-compatible API. OpenClaw включає вбудований Plugin провайдера Fireworks.

| Властивість   | Значення                                             |
| ------------- | ---------------------------------------------------- |
| Провайдер     | `fireworks`                                          |
| Автентифікація| `FIREWORKS_API_KEY`                                  |
| API           | OpenAI-compatible chat/completions                   |
| Base URL      | `https://api.fireworks.ai/inference/v1`              |
| Типова модель | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Початок роботи

<Steps>
  <Step title="Налаштуйте автентифікацію Fireworks через onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Це зберігає ваш ключ Fireworks у конфігурації OpenClaw і встановлює стартову модель Fire Pass як типову.

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Приклад для non-interactive режиму

Для сценаріїв або CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Посилання на модель                                   | Назва                       | Вхід       | Контекст | Макс. вивід | Примітки                                                                                                                                              |
| ----------------------------------------------------- | --------------------------- | ---------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`       | Kimi K2.6                   | text,image | 262,144  | 262,144     | Найновіша модель Kimi у Fireworks. Thinking вимкнено для запитів Fireworks K2.6; маршрутизуйте напряму через Moonshot, якщо вам потрібен вивід thinking Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`| Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000     | Типова вбудована стартова модель у Fireworks                                                                                                           |

<Tip>
Якщо Fireworks публікує новішу модель, наприклад новий випуск Qwen або Gemma, ви можете перемкнутися на неї безпосередньо, використавши її ID моделі Fireworks, не чекаючи оновлення вбудованого каталогу.
</Tip>

## Власні ID моделей Fireworks

OpenClaw також приймає динамічні ID моделей Fireworks. Використовуйте точний ID моделі або router, який показує Fireworks, і додайте префікс `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Як працює додавання префікса до ID моделі">
    Кожне посилання на модель Fireworks в OpenClaw починається з `fireworks/`, після чого йде точний ID або шлях router з платформи Fireworks. Наприклад:

    - Router model: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw прибирає префікс `fireworks/` під час побудови API-запиту і надсилає решту шляху до endpoint Fireworks.

  </Accordion>

  <Accordion title="Примітка про середовище">
    Якщо Gateway працює поза вашою інтерактивною оболонкою, переконайтеся, що `FIREWORKS_API_KEY` також доступний цьому процесу.

    <Warning>
    Ключ, що лежить лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище також не імпортовано туди. Установіть ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки запасних варіантів.
  </Card>
  <Card title="Усунення неполадок" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення неполадок і FAQ.
  </Card>
</CardGroup>
