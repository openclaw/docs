---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібен env var API key або вибір auth через CLI
summary: Налаштування Groq (auth + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-04-23T21:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6391cb65fff15089d18c7bcbea2f825ba066a9b22b064bc77fd76977fb70b0
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) надає надшвидкий інференс на open-source моделях
(Llama, Gemma, Mistral та інших) з використанням власного LPU-обладнання. OpenClaw підключається
до Groq через його API, сумісний з OpenAI.

| Property | Value             |
| -------- | ----------------- |
| Provider | `groq`            |
| Auth     | `GROQ_API_KEY`    |
| API      | сумісний з OpenAI |

## Початок роботи

<Steps>
  <Step title="Отримайте API key">
    Створіть API key на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Установіть API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Задайте типову модель">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Приклад файла конфігурації

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Доступні моделі

Каталог моделей Groq часто змінюється. Виконайте `openclaw models list | grep groq`,
щоб побачити наразі доступні моделі, або перевірте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Notes                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Загального призначення, великий контекст |
| **Llama 3.1 8B Instant**    | Швидка, полегшена                  |
| **Gemma 2 9B**              | Компактна, ефективна               |
| **Mixtral 8x7B**            | Архітектура MoE, сильний reasoning |

<Tip>
Використовуйте `openclaw models list --provider groq`, щоб отримати найактуальніший список
моделей, доступних у вашому обліковому записі.
</Tip>

## Аудіотранскрибування

Groq також надає швидке аудіотранскрибування на основі Whisper. Коли його налаштовано як
провайдера розуміння медіа, OpenClaw використовує модель Groq `whisper-large-v3-turbo`
для транскрибування голосових повідомлень через спільну поверхню `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Деталі аудіотранскрибування">
    | Property | Value |
    |----------|-------|
    | Спільний шлях config | `tools.media.audio` |
    | Типовий base URL     | `https://api.groq.com/openai/v1` |
    | Типова модель        | `whisper-large-v3-turbo` |
    | API endpoint         | Сумісний з OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).

    <Warning>
    Ключі, задані лише у вашій інтерактивній оболонці, не видимі процесам
    gateway під керуванням daemon. Для постійної доступності використовуйте `~/.openclaw/.env` або config `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model refs і поведінка failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна schema конфігурації, включно з налаштуваннями провайдерів і аудіо.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель Groq, документація API та ціни.
  </Card>
  <Card title="Список моделей Groq" href="https://console.groq.com/docs/models" icon="list">
    Офіційний каталог моделей Groq.
  </Card>
</CardGroup>
