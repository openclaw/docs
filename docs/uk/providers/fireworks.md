---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібна змінна середовища з API-ключем Fireworks або ідентифікатор моделі за замовчуванням
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T10:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) надає open-weight і маршрутизовані моделі через API, сумісний з OpenAI. OpenClaw містить вбудований Plugin-провайдер Fireworks.

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Властивість   | Значення                                               |
| Провайдер     | `fireworks`                                            |
| Автентифікація | `FIREWORKS_API_KEY`                                   |
| API           | chat/completions, сумісні з OpenAI                     |
| Базовий URL   | `https://api.fireworks.ai/inference/v1`                |
| Модель за замовчуванням | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Початок роботи

<Steps>
  <Step title="Налаштуйте автентифікацію Fireworks через onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Це збереже ваш ключ Fireworks у конфігурації OpenClaw і встановить стартову модель Fire Pass як модель за замовчуванням.

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

| Посилання на модель                                   | Назва                       | Вхід       | Контекст | Макс. вивід | Примітки                                   |
| ----------------------------------------------------- | --------------------------- | ---------- | -------- | ----------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000     | Вбудована стартова модель за замовчуванням у Fireworks |

<Tip>
Якщо Fireworks публікує новішу модель, наприклад свіжий випуск Qwen або Gemma, ви можете одразу переключитися на неї, використовуючи її ідентифікатор моделі Fireworks, не чекаючи оновлення вбудованого каталогу.
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
    Кожне посилання на модель Fireworks в OpenClaw починається з `fireworks/`, після якого йде точний ідентифікатор або шлях маршрутизатора з платформи Fireworks. Наприклад:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Пряма модель: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw видаляє префікс `fireworks/` під час формування API-запиту та надсилає решту шляху до кінцевої точки Fireworks.

  </Accordion>

  <Accordion title="Примітка про середовище">
    Якщо Gateway працює поза вашою інтерактивною оболонкою, переконайтеся, що `FIREWORKS_API_KEY` також доступний для цього процесу.

    <Warning>
    Ключ, який зберігається лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище не імпортовано й туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
