---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібна змінна середовища API-ключа або вибір auth у CLI
summary: Налаштування Groq (auth + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-04-27T12:54:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) надає надшвидке виконання inference на open-source моделях
(Llama, Gemma, Mistral та інших) за допомогою спеціалізованого обладнання LPU. OpenClaw підключається
до Groq через його OpenAI-compatible API.

| Властивість | Значення          |
| ----------- | ----------------- |
| Провайдер   | `groq`            |
| Auth        | `GROQ_API_KEY`    |
| API         | OpenAI-compatible |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Установіть API-ключ">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Установіть типову модель">
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

## Вбудований каталог

Каталог моделей Groq часто змінюється. Виконайте `openclaw models list | grep groq`,
щоб побачити моделі, доступні зараз, або перегляньте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Модель                      | Примітки                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Загального призначення, великий контекст |
| **Llama 3.1 8B Instant**    | Швидка, легка                      |
| **Gemma 2 9B**              | Компактна, ефективна               |
| **Mixtral 8x7B**            | Архітектура MoE, сильне міркування |

<Tip>
Використовуйте `openclaw models list --provider groq`, щоб отримати найактуальніший список
моделей, доступних у вашому обліковому записі.
</Tip>

## Моделі міркування

OpenClaw зіставляє свої спільні рівні `/think` зі специфічними для моделі Groq
значеннями `reasoning_effort`. Для `qwen/qwen3-32b` вимкнене мислення надсилає
`none`, а ввімкнене — `default`. Для моделей міркування Groq GPT-OSS
OpenClaw надсилає `low`, `medium` або `high`; вимкнене мислення пропускає
`reasoning_effort`, оскільки ці моделі не підтримують вимкнене значення.

## Транскрибування аудіо

Groq також надає швидке транскрибування аудіо на основі Whisper. Коли Groq налаштовано як
провайдера media-understanding, OpenClaw використовує модель Groq `whisper-large-v3-turbo`
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
  <Accordion title="Деталі транскрибування аудіо">
    | Властивість | Значення |
    |----------|-------|
    | Спільний шлях конфігурації | `tools.media.audio` |
    | Типовий базовий URL        | `https://api.groq.com/openai/v1` |
    | Типова модель              | `whisper-large-v3-turbo` |
    | Кінцева точка API          | OpenAI-compatible `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).

    <Warning>
    Ключі, задані лише у вашій інтерактивній оболонці, не видимі процесам
    gateway, якими керує daemon. Для постійної доступності використовуйте
    `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінка failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера та аудіо.
  </Card>
  <Card title="Консоль Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель керування Groq, документація API та ціни.
  </Card>
  <Card title="Список моделей Groq" href="https://console.groq.com/docs/models" icon="list">
    Офіційний каталог моделей Groq.
  </Card>
</CardGroup>
