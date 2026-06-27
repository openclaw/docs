---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібна змінна середовища ключа API або вибір автентифікації CLI
    - Ви налаштовуєте транскрибування аудіо Whisper у Groq
summary: Налаштування Groq (автентифікація + вибір моделі + транскрипція Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:11:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) забезпечує надшвидке інференс-виконання моделей з відкритими вагами (Llama, Gemma, Kimi, Qwen, GPT OSS тощо) за допомогою спеціального апаратного забезпечення LPU. Plugin Groq реєструє як OpenAI-сумісного провайдера чату, так і провайдера розуміння аудіомедіа.

| Властивість                   | Значення                                 |
| ----------------------------- | ---------------------------------------- |
| Ідентифікатор провайдера      | `groq`                                   |
| Plugin                        | офіційний зовнішній пакет                |
| Змінна середовища авторизації | `GROQ_API_KEY`                           |
| API                           | OpenAI-сумісний (`openai-completions`)   |
| Базова URL-адреса             | `https://api.groq.com/openai/v1`         |
| Транскрипція аудіо            | `whisper-large-v3-turbo` (за замовчуванням) |
| Рекомендована модель чату     | `groq/llama-3.3-70b-versatile`           |

## Встановлення plugin

Встановіть офіційний plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Задайте API-ключ">
    ```bash
export GROQ_API_KEY=gsk_...
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
  <Step title="Перевірте доступність каталогу">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Приклад файлу конфігурації

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

OpenClaw постачається з каталогом Groq на основі маніфесту, що містить записи як із reasoning, так і без нього. Виконайте `openclaw models list --provider groq`, щоб побачити статичні рядки для встановленої версії, або перегляньте [console.groq.com/docs/models](https://console.groq.com/docs/models), щоб отримати авторитетний список Groq.

| Посилання на модель                             | Назва                   | Reasoning | Вхід         | Контекст |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | ні        | текст        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | ні        | текст        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | ні        | текст + зображення | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | так       | текст        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | так       | текст        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | так       | текст        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | так       | текст        | 131,072  |
| `groq/groq/compound`                             | Compound                | так       | текст        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | так       | текст        | 131,072  |

<Tip>
  Каталог змінюється з кожним випуском OpenClaw. `openclaw models list --provider groq` показує рядки, відомі вашій встановленій версії; звіряйтеся з [console.groq.com/docs/models](https://console.groq.com/docs/models) щодо новододаних або застарілих моделей.
</Tip>

## Моделі reasoning

OpenClaw зіставляє свої спільні рівні `/think` зі специфічними для моделей Groq значеннями `reasoning_effort`:

- Для `qwen/qwen3-32b` вимкнене мислення надсилає `none`, а ввімкнене мислення надсилає `default`.
- Для моделей reasoning Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw надсилає `low`, `medium` або `high` залежно від рівня `/think`. Якщо мислення вимкнено, `reasoning_effort` не надсилається, бо ці моделі не підтримують вимкнене значення.
- DeepSeek R1 Distill, Qwen QwQ і Compound використовують нативну поверхню reasoning Groq; `/think` керує видимістю, але модель завжди виконує reasoning.

Див. [Режими мислення](/uk/tools/thinking) для спільних рівнів `/think` і того, як OpenClaw транслює їх для кожного провайдера.

## Транскрипція аудіо

Plugin Groq також реєструє **провайдера розуміння аудіомедіа**, щоб голосові повідомлення можна було транскрибувати через спільну поверхню `tools.media.audio`.

| Властивість                 | Значення                                  |
| --------------------------- | ----------------------------------------- |
| Спільний шлях конфігурації  | `tools.media.audio`                       |
| Базова URL-адреса за замовчуванням | `https://api.groq.com/openai/v1`  |
| Модель за замовчуванням     | `whisper-large-v3-turbo`                  |
| Автоматичний пріоритет      | 20                                        |
| Кінцева точка API           | OpenAI-сумісна `/audio/transcriptions`    |

Щоб зробити Groq аудіобекендом за замовчуванням:

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
  <Accordion title="Доступність середовища для демона">
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), `GROQ_API_KEY` має бути видимим для цього процесу, а не лише для вашої інтерактивної оболонки.

    <Warning>
      Ключ, експортований лише в інтерактивній оболонці, не допоможе демону launchd або systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб gateway-процес міг його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Користувацькі ідентифікатори моделей Groq">
    OpenClaw приймає будь-який ідентифікатор моделі Groq під час виконання. Використовуйте точний ідентифікатор, показаний Groq, і додайте до нього префікс `groq/`. Статичний каталог охоплює типові випадки; ідентифікатори поза каталогом переходять до стандартного OpenAI-сумісного шаблону.

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
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні зусиль reasoning і взаємодія з політикою провайдера.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема параметри провайдера й аудіо.
  </Card>
  <Card title="Консоль Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель керування Groq, документація API та ціни.
  </Card>
</CardGroup>
