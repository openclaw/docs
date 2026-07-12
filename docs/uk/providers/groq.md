---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Потрібна змінна середовища з ключем API або вибір автентифікації в CLI
    - Ви налаштовуєте транскрибування аудіо за допомогою Whisper у Groq
summary: Налаштування Groq (автентифікація + вибір моделі + транскрибування за допомогою Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T13:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) забезпечує надшвидке виконання моделей із відкритими вагами (Llama, Gemma, Kimi, Qwen, GPT OSS та інших) за допомогою спеціалізованого обладнання LPU. Plugin Groq реєструє як сумісного з OpenAI постачальника чату, так і постачальника розуміння аудіомедіа.

| Властивість                      | Значення                                 |
| -------------------------------- | ---------------------------------------- |
| Ідентифікатор постачальника      | `groq`                                   |
| Plugin                           | офіційний зовнішній пакет                |
| Змінна середовища автентифікації | `GROQ_API_KEY`                           |
| API                              | сумісний з OpenAI (`openai-completions`) |
| Базова URL-адреса                | `https://api.groq.com/openai/v1`         |
| Транскрибування аудіо            | `whisper-large-v3-turbo` (типово)        |
| Рекомендована модель чату        | `groq/llama-3.3-70b-versatile`           |

## Встановлення Plugin

Встановіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API на сторінці [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Задайте ключ API">
    ```bash
export GROQ_API_KEY=gsk_...
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
  <Step title="Перевірте доступність каталогу">
    ```bash
    openclaw models list --provider groq
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

OpenClaw постачається з каталогом Groq на основі маніфесту, що містить моделі як із міркуванням, так і без нього. Виконайте `openclaw models list --provider groq`, щоб переглянути статичні записи для встановленої версії, або зверніться до [console.groq.com/docs/models](https://console.groq.com/docs/models), щоб побачити офіційний список Groq.

| Посилання на модель                              | Назва                   | Міркування | Вхідні дані       | Контекст |
| ------------------------------------------------ | ----------------------- | ---------- | ----------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | ні         | текст             | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | ні         | текст             | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | ні         | текст + зображення | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | так        | текст             | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | так        | текст             | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Безпечний GPT OSS 20B   | так        | текст             | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | так        | текст             | 131,072  |
| `groq/groq/compound`                             | Compound                | так        | текст             | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | так        | текст             | 131,072  |

<Tip>
  Каталог оновлюється з кожним випуском OpenClaw. Команда `openclaw models list --provider groq` показує записи, відомі встановленій версії; звіряйтеся з [console.groq.com/docs/models](https://console.groq.com/docs/models), щоб дізнаватися про нові або застарілі моделі.
</Tip>

## Моделі з міркуванням

Моделі Groq із міркуванням (`reasoning: true` у таблиці вище) зіставляють спільні рівні `/think` OpenClaw зі значеннями `reasoning_effort`: `low`, `medium` або `high`. За використання `/think off` або `/think none` параметр `reasoning_effort` не додається до запиту замість надсилання значення, що вимикає міркування.

Перегляньте [Режими мислення](/uk/tools/thinking), щоб дізнатися про спільні рівні `/think` і те, як OpenClaw перетворює їх для кожного постачальника.

## Транскрибування аудіо

Plugin Groq також реєструє **постачальника розуміння аудіомедіа**, щоб голосові повідомлення можна було транскрибувати через спільний інтерфейс `tools.media.audio`.

| Властивість                        | Значення                                  |
| ---------------------------------- | ----------------------------------------- |
| Спільний шлях конфігурації         | `tools.media.audio`                       |
| Типова базова URL-адреса           | `https://api.groq.com/openai/v1`          |
| Типова модель                      | `whisper-large-v3-turbo`                  |
| Пріоритет автоматичного визначення | 20                                        |
| Кінцева точка API                  | сумісна з OpenAI `/audio/transcriptions`  |

Щоб зробити Groq типовим серверним модулем для аудіо:

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
  <Accordion title="Доступність середовища для фонової служби">
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), змінна `GROQ_API_KEY` має бути доступна цьому процесу, а не лише вашій інтерактивній оболонці.

    <Warning>
      Ключ, експортований лише в інтерактивній оболонці, не буде доступний фоновій службі launchd або systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Власні ідентифікатори моделей Groq">
    OpenClaw приймає під час виконання будь-який ідентифікатор моделі Groq. Використовуйте точний ідентифікатор, указаний Groq, із префіксом `groq/`. Статичний каталог охоплює поширені випадки; для ідентифікаторів, відсутніх у каталозі, використовується типовий сумісний з OpenAI шаблон.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні зусиль на міркування та взаємодія з політикою постачальника.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальника й аудіо.
  </Card>
  <Card title="Консоль Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель керування Groq, документація API та ціни.
  </Card>
</CardGroup>
