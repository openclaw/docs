---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Потрібна змінна середовища ключа API або вибір автентифікації CLI
    - Ви налаштовуєте транскрибування аудіо Whisper у Groq
summary: Налаштування Groq (автентифікація + вибір моделі + транскрибування Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T00:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) надає надшвидкий inference для моделей з відкритими вагами (Llama, Gemma, Kimi, Qwen, GPT OSS тощо) за допомогою спеціального обладнання LPU. OpenClaw містить вбудований Groq plugin, який реєструє і OpenAI-сумісний провайдер чату, і провайдер розуміння аудіомедіа.

| Властивість           | Значення                                 |
| --------------------- | ---------------------------------------- |
| ID провайдера         | `groq`                                   |
| Plugin                | вбудований, `enabledByDefault: true`     |
| Змінна env для auth   | `GROQ_API_KEY`                           |
| Прапорець onboarding  | `--auth-choice groq-api-key`             |
| API                   | OpenAI-сумісний (`openai-completions`)   |
| Базова URL-адреса     | `https://api.groq.com/openai/v1`         |
| Транскрипція аудіо    | `whisper-large-v3-turbo` (за замовчуванням) |
| Рекомендований типовий чат | `groq/llama-3.3-70b-versatile`       |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Задайте API-ключ">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Лише env
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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

OpenClaw постачається з Groq-каталогом на основі маніфесту, що містить записи як із reasoning, так і без нього. Виконайте `openclaw models list --provider groq`, щоб переглянути вбудовані рядки для встановленої версії, або перевірте [console.groq.com/docs/models](https://console.groq.com/docs/models), щоб побачити авторитетний список Groq.

| Посилання на модель                                  | Назва                         | Reasoning | Вхід         | Контекст |
| ---------------------------------------------------- | ----------------------------- | --------- | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | ні        | текст        | 131,072  |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | ні        | текст        | 131,072  |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | ні        | текст + зображення | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | ні        | текст + зображення | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | ні        | текст        | 8,192    |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | ні        | текст        | 8,192    |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | ні        | текст        | 8,192    |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | ні        | текст        | 32,768   |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | ні        | текст        | 131,072  |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | ні        | текст        | 262,144  |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | так       | текст        | 131,072  |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | так       | текст        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | так       | текст        | 131,072  |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | так       | текст        | 131,072  |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | так       | текст        | 131,072  |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | так       | текст        | 131,072  |
| `groq/groq/compound`                                 | Compound                      | так       | текст        | 131,072  |
| `groq/groq/compound-mini`                            | Compound Mini                 | так       | текст        | 131,072  |

<Tip>
  Каталог змінюється з кожним релізом OpenClaw. `openclaw models list --provider groq` показує рядки, відомі вашій встановленій версії; звіряйте з [console.groq.com/docs/models](https://console.groq.com/docs/models), щоб дізнатися про новододані або застарілі моделі.
</Tip>

## Моделі reasoning

OpenClaw зіставляє свої спільні рівні `/think` із специфічними для моделей Groq значеннями `reasoning_effort`:

- Для `qwen/qwen3-32b` вимкнене thinking надсилає `none`, а ввімкнене thinking надсилає `default`.
- Для моделей Groq GPT OSS reasoning (`openai/gpt-oss-*`) OpenClaw надсилає `low`, `medium` або `high` залежно від рівня `/think`. Вимкнене thinking пропускає `reasoning_effort`, оскільки ці моделі не підтримують значення для вимкнення.
- DeepSeek R1 Distill, Qwen QwQ і Compound використовують нативну reasoning-поверхню Groq; `/think` керує видимістю, але модель завжди міркує.

Див. [Режими thinking](/uk/tools/thinking), щоб дізнатися про спільні рівні `/think` і те, як OpenClaw перекладає їх для кожного провайдера.

## Транскрипція аудіо

Вбудований plugin Groq також реєструє **провайдер розуміння аудіомедіа**, щоб голосові повідомлення можна було транскрибувати через спільну поверхню `tools.media.audio`.

| Властивість            | Значення                                  |
| ---------------------- | ----------------------------------------- |
| Спільний шлях конфігурації | `tools.media.audio`                   |
| Типова базова URL-адреса | `https://api.groq.com/openai/v1`        |
| Типова модель          | `whisper-large-v3-turbo`                  |
| Автоматичний пріоритет | 20                                        |
| API endpoint           | OpenAI-сумісний `/audio/transcriptions`   |

Щоб зробити Groq типовим backend для аудіо:

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
  <Accordion title="Доступність середовища для daemon">
    Якщо Gateway працює як керований сервіс (launchd, systemd, Docker), `GROQ_API_KEY` має бути видимим для цього процесу — не лише для вашої інтерактивної shell.

    <Warning>
      Ключ, що міститься лише в `~/.profile`, не допоможе daemon launchd або systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб він був доступний для читання з процесу gateway.
    </Warning>

  </Accordion>

  <Accordion title="Власні ID моделей Groq">
    OpenClaw приймає будь-який ID моделі Groq під час виконання. Використовуйте точний ID, який показує Groq, і додайте до нього префікс `groq/`. Вбудований каталог покриває поширені випадки; некаталогізовані ID переходять до типового OpenAI-сумісного шаблону.

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

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Режими thinking" href="/uk/tools/thinking" icon="brain">
    Рівні зусилля reasoning і взаємодія політик провайдера.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера та аудіо.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель Groq, API-документація та ціни.
  </Card>
</CardGroup>
