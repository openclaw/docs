---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища ключа API або варіант автентифікації CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-12T10:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з API, сумісним з OpenAI.

| Властивість | Значення                  |
| ----------- | ------------------------- |
| Провайдер   | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`     |
| API         | сумісний з OpenAI         |
| Базова URL-адреса | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій ключ API">
    Створіть ключ API на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Це запросить ваш ключ API і встановить `deepseek/deepseek-chat` як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценарних або headless-інсталяцій передайте всі прапорці напряму:

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
доступна для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання моделі             | Назва             | Вхід  | Контекст | Макс. вивід | Примітки                                          |
| ---------------------------- | ----------------- | ----- | -------- | ----------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192       | Модель за замовчуванням; поверхня DeepSeek V3.2 без thinking |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536      | Поверхня V3.2 з підтримкою reasoning              |

<Tip>
Обидві вбудовані моделі наразі в початковому коді позначені як сумісні з потоковим використанням.
</Tip>

## Приклад конфігурації

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки резервного перемикання.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
