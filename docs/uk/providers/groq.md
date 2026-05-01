---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Потрібна змінна середовища для ключа API або вибір автентифікації CLI
summary: Налаштування Groq (автентифікація + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-05-01T12:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) забезпечує надшвидкий інференс на моделях із відкритим кодом
(Llama, Gemma, Mistral тощо) за допомогою спеціального обладнання LPU. OpenClaw підключається
до Groq через його API, сумісний з OpenAI.

| Властивість | Значення          |
| -------- | ----------------- |
| Постачальник | `groq`            |
| Автентифікація | `GROQ_API_KEY`    |
| API      | Сумісний з OpenAI |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Задайте API-ключ">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Задайте модель за замовчуванням">
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

### Приклад конфігураційного файлу

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

OpenClaw постачає каталог Groq на основі маніфесту для швидкого списку моделей,
відфільтрованого за постачальником. Запустіть `openclaw models list --all --provider groq`, щоб побачити вбудовані
рядки, або перегляньте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Модель                      | Примітки                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Загального призначення, великий контекст |
| **Llama 3.1 8B Instant**    | Швидка, легка                      |
| **Gemma 2 9B**              | Компактна, ефективна               |
| **Mixtral 8x7B**            | Архітектура MoE, сильне міркування |

<Tip>
Використовуйте `openclaw models list --all --provider groq` для рядків Groq на основі маніфесту,
відомих цій версії OpenClaw.
</Tip>

## Моделі міркування

OpenClaw зіставляє свої спільні рівні `/think` зі специфічними для моделі значеннями
`reasoning_effort` у Groq. Для `qwen/qwen3-32b` вимкнене мислення надсилає
`none`, а ввімкнене мислення надсилає `default`. Для моделей міркування Groq GPT-OSS
OpenClaw надсилає `low`, `medium` або `high`; коли мислення вимкнено,
`reasoning_effort` пропускається, бо ці моделі не підтримують вимкнене значення.

## Транскрипція аудіо

Groq також забезпечує швидку транскрипцію аудіо на основі Whisper. Коли його налаштовано як
постачальника розуміння медіа, OpenClaw використовує модель Groq `whisper-large-v3-turbo`
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
  <Accordion title="Подробиці транскрипції аудіо">
    | Властивість | Значення |
    |----------|-------|
    | Шлях спільної конфігурації | `tools.media.audio` |
    | Базова URL-адреса за замовчуванням | `https://api.groq.com/openai/v1` |
    | Модель за замовчуванням | `whisper-large-v3-turbo` |
    | Кінцева точка API | Сумісна з OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).

    <Warning>
    Ключі, задані лише у вашій інтерактивній оболонці, не видимі для процесів gateway,
    керованих демоном. Використовуйте конфігурацію `~/.openclaw/.env` або `env.shellEnv`
    для постійної доступності.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема налаштування постачальника й аудіо.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель керування Groq, документація API та ціни.
  </Card>
  <Card title="Список моделей Groq" href="https://console.groq.com/docs/models" icon="list">
    Офіційний каталог моделей Groq.
  </Card>
</CardGroup>
