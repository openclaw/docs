---
read_when:
    - Ви хочете використовувати Cerebras з OpenClaw
    - Вам потрібна змінна середовища з API-ключем Cerebras або вибір автентифікації в CLI
summary: Налаштування Cerebras (автентифікація + вибір моделі)
title: Cerebras
x-i18n:
    generated_at: "2026-04-27T09:30:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 15
---

[Cerebras](https://www.cerebras.ai) надає високошвидкісний OpenAI-сумісний інференс.

| Властивість | Значення                     |
| ----------- | ---------------------------- |
| Provider    | `cerebras`                   |
| Автентифікація | `CEREBRAS_API_KEY`        |
| API         | OpenAI-сумісний              |
| Base URL    | `https://api.cerebras.ai/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ у [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Вбудований каталог

OpenClaw постачається зі статичним каталогом Cerebras для публічного OpenAI-сумісного endpoint:

| Посилання моделі                           | Назва                | Примітки                               |
| ------------------------------------------ | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                     | Z.ai GLM 4.7         | Модель за замовчуванням; preview-модель міркувань |
| `cerebras/gpt-oss-120b`                    | GPT OSS 120B         | Production-модель міркувань            |
| `cerebras/qwen-3-235b-a22b-instruct-2507`  | Qwen 3 235B Instruct | Preview-модель без міркувань           |
| `cerebras/llama3.1-8b`                     | Llama 3.1 8B         | Production-модель, орієнтована на швидкість |

<Warning>
Cerebras позначає `zai-glm-4.7` і `qwen-3-235b-a22b-instruct-2507` як preview-моделі, а для `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` задокументовано припинення підтримки 27 травня 2026 року. Перевіряйте сторінку підтримуваних моделей Cerebras, перш ніж покладатися на них у production.
</Warning>

## Ручна конфігурація

Зазвичай завдяки вбудованому plugin вам потрібен лише API-ключ. Використовуйте явну
конфігурацію `models.providers.cerebras`, якщо хочете перевизначити метадані моделі:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CEREBRAS_API_KEY`
доступний для цього процесу, наприклад у `~/.openclaw/.env` або через
`env.shellEnv`.
</Note>
