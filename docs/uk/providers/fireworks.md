---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібна змінна середовища з API-ключем Fireworks або ідентифікатор моделі за замовчуванням
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Fireworks
x-i18n:
    generated_at: "2026-04-21T20:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) надає доступ до open-weight і маршрутизованих моделей через OpenAI-сумісний API. OpenClaw містить вбудований плагін провайдера Fireworks.

| Властивість   | Значення                                              |
| ------------- | ----------------------------------------------------- |
| Провайдер     | `fireworks`                                           |
| Автентифікація | `FIREWORKS_API_KEY`                                   |
| API           | OpenAI-сумісний chat/completions                      |
| Базовий URL   | `https://api.fireworks.ai/inference/v1`               |
| Модель за замовчуванням | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Початок роботи

<Steps>
  <Step title="Налаштуйте автентифікацію Fireworks через onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Це зберігає ваш ключ Fireworks у конфігурації OpenClaw і встановлює стартову модель Fire Pass як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для сценаріїв або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Model ref                                              | Назва                       | Вхід       | Контекст | Макс. вивід | Примітки                                                                                                                                             |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144  | 262,144     | Найновіша модель Kimi у Fireworks. Thinking вимкнено для запитів Fireworks K2.6; використовуйте Moonshot напряму, якщо вам потрібен вивід Kimi thinking. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000     | Вбудована стартова модель Fireworks за замовчуванням                                                                                                |

<Tip>
Якщо Fireworks публікує новішу модель, наприклад новий випуск Qwen або Gemma, ви можете одразу переключитися на неї, використовуючи її ідентифікатор моделі Fireworks, не чекаючи оновлення вбудованого каталогу.
</Tip>

## Власні ідентифікатори моделей Fireworks

OpenClaw також приймає динамічні ідентифікатори моделей Fireworks. Використовуйте точний ідентифікатор моделі або маршрутизатора, показаний у Fireworks, і додавайте префікс `fireworks/`.

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
  <Accordion title="Як працює додавання префікса до ідентифікатора моделі">
    Кожне посилання Fireworks model ref в OpenClaw починається з `fireworks/`, після якого йде точний ідентифікатор або шлях маршрутизатора з платформи Fireworks. Наприклад:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Пряма модель: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw прибирає префікс `fireworks/` під час формування API-запиту та надсилає решту шляху до endpoint Fireworks.

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює поза вашою інтерактивною оболонкою, переконайтеся, що `FIREWORKS_API_KEY` також доступний цьому процесу.

    <Warning>
    Ключ, що зберігається лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище також не імпортовано туди. Встановіть ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
