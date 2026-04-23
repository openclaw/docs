---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна env var API-ключа або вибір автентифікації в CLI
summary: Налаштування DeepSeek (auth + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-23T21:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з OpenAI-сумісним API.

| Властивість | Значення                    |
| ----------- | --------------------------- |
| Provider    | `deepseek`                  |
| Auth        | `DEEPSEEK_API_KEY`          |
| API         | OpenAI-сумісний             |
| Base URL    | `https://api.deepseek.com`  |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Це попросить ввести ваш API-ключ і встановить `deepseek/deepseek-chat` як типову модель.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценарних або headless-встановлень передайте всі прапорці безпосередньо:

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

| Model ref                    | Назва             | Вхід  | Контекст | Макс. вивід | Примітки                                                |
| ---------------------------- | ----------------- | ----- | -------- | ----------- | ------------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192       | Типова модель; поверхня DeepSeek V3.2 без thinking      |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536      | Поверхня V3.2 з увімкненими міркуваннями                |

<Tip>
Обидві вбудовані моделі наразі в source заявляють сумісність із використанням streaming.
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
    Вибір provider, refs моделей і поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для agents, models і providers.
  </Card>
</CardGroup>
