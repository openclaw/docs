---
read_when:
    - Ви хочете використовувати Cerebras з OpenClaw
    - Потрібна змінна середовища з ключем API Cerebras або вибір автентифікації CLI
summary: Налаштування Cerebras (автентифікація + вибір моделі)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T00:01:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) надає високошвидкісний OpenAI-сумісний інференс на спеціалізованому апаратному забезпеченні для інференсу. OpenClaw містить вбудований Plugin провайдера Cerebras зі статичним каталогом із чотирьох моделей.

| Властивість                         | Значення                                 |
| ----------------------------------- | ---------------------------------------- |
| Ідентифікатор провайдера            | `cerebras`                               |
| Plugin                              | вбудований, `enabledByDefault: true`     |
| Змінна середовища автентифікації    | `CEREBRAS_API_KEY`                       |
| Прапорець початкового налаштування  | `--auth-choice cerebras-api-key`         |
| Прямий прапорець CLI                | `--cerebras-api-key <key>`               |
| API                                 | OpenAI-сумісний (`openai-completions`)   |
| Базова URL-адреса                   | `https://api.cerebras.ai/v1`             |
| Модель за замовчуванням             | `cerebras/zai-glm-4.7`                   |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ у [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Запустіть початкове налаштування">
    <CodeGroup>

```bash Початкове налаштування
openclaw onboard --auth-choice cerebras-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Лише змінна середовища
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте, що моделі доступні">
    ```bash
    openclaw models list --provider cerebras
    ```

    Список має містити всі чотири вбудовані моделі. Якщо `CEREBRAS_API_KEY` не розв’язано, `openclaw models status --json` повідомить про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Вбудований каталог

OpenClaw постачається зі статичним каталогом Cerebras, який віддзеркалює публічну OpenAI-сумісну кінцеву точку. Усі чотири моделі мають контекст 128k і 8 192 максимальні вихідні токени.

| Посилання на модель                     | Назва                | Міркування | Примітки                                      |
| --------------------------------------- | -------------------- | ---------- | --------------------------------------------- |
| `cerebras/zai-glm-4.7`                  | Z.ai GLM 4.7         | так        | Модель за замовчуванням; попередня модель із міркуванням |
| `cerebras/gpt-oss-120b`                 | GPT OSS 120B         | так        | Виробнича модель із міркуванням               |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ні         | Попередня модель без міркування               |
| `cerebras/llama3.1-8b`                  | Llama 3.1 8B         | ні         | Виробнича модель, оптимізована для швидкості  |

<Warning>
  Cerebras позначає `zai-glm-4.7` і `qwen-3-235b-a22b-instruct-2507` як попередні моделі, а для `llama3.1-8b` і `qwen-3-235b-a22b-instruct-2507` задокументовано виведення з експлуатації 27 травня 2026 року. Перевірте сторінку підтримуваних моделей Cerebras, перш ніж покладатися на них для виробничих робочих навантажень.
</Warning>

## Ручна конфігурація

Завдяки вбудованому Plugin зазвичай потрібен лише API-ключ. Використовуйте явну конфігурацію `models.providers.cerebras`, якщо хочете перевизначити метадані моделей або працювати в `mode: "merge"` зі статичним каталогом:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
  Якщо Gateway працює як демон (launchd, systemd, Docker), переконайтеся, що `CEREBRAS_API_KEY` доступний цьому процесу — наприклад у `~/.openclaw/.env` або через `env.shellEnv`. Ключ, що є лише в `~/.profile`, не допоможе керованому сервісу, якщо середовище не імпортовано окремо.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні інтенсивності міркування для двох моделей Cerebras із підтримкою міркування.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові параметри агентів і конфігурація моделей.
  </Card>
  <Card title="FAQ щодо моделей" href="/uk/help/faq-models" icon="circle-question">
    Профілі автентифікації, перемикання моделей і усунення помилок "no profile".
  </Card>
</CardGroup>
