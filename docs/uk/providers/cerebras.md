---
read_when:
    - Ви хочете використовувати Cerebras з OpenClaw
    - Вам потрібна змінна середовища ключа API Cerebras або вибір автентифікації CLI.
summary: Налаштування Cerebras (автентифікація + вибір моделі)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) забезпечує високошвидкісний OpenAI-сумісний інференс на спеціалізованому апаратному забезпеченні для інференсу. Plugin провайдера Cerebras містить статичний каталог із чотирьох моделей.

| Властивість     | Значення                                 |
| --------------- | ---------------------------------------- |
| ID провайдера   | `cerebras`                               |
| Plugin          | офіційний зовнішній пакет                |
| Змінна env auth | `CEREBRAS_API_KEY`                       |
| Прапорець onboarding | `--auth-choice cerebras-api-key`    |
| Прямий прапорець CLI | `--cerebras-api-key <key>`          |
| API             | OpenAI-сумісний (`openai-completions`)   |
| Базовий URL     | `https://api.cerebras.ai/v1`             |
| Модель за замовчуванням | `cerebras/zai-glm-4.7`            |

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ у [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Запустіть onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Лише env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте, що моделі доступні">
    ```bash
    openclaw models list --provider cerebras
    ```

    Список має містити всі чотири статичні моделі. Якщо `CEREBRAS_API_KEY` не розв’язано, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Налаштування без інтерактивного режиму

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Вбудований каталог

OpenClaw постачається зі статичним каталогом Cerebras, який віддзеркалює публічний OpenAI-сумісний endpoint. Усі чотири моделі мають контекст 128k і максимум 8 192 токени виводу.

| Посилання на модель                       | Назва                | Міркування | Примітки                              |
| ----------------------------------------- | -------------------- | ---------- | ------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | так        | Модель за замовчуванням; preview-модель для міркування |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | так        | Production-модель для міркування      |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ні         | Preview-модель без міркування         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | ні         | Production-модель, орієнтована на швидкість |

<Warning>
  Cerebras позначає `zai-glm-4.7` і `qwen-3-235b-a22b-instruct-2507` як preview-моделі, а `llama3.1-8b` разом із `qwen-3-235b-a22b-instruct-2507` задокументовані для виведення з експлуатації 27 травня 2026 року. Перевірте сторінку підтримуваних моделей Cerebras, перш ніж покладатися на них у production-навантаженнях.
</Warning>

## Ручна конфігурація

Зазвичай Plugin означає, що вам потрібен лише API-ключ. Використовуйте явну конфігурацію `models.providers.cerebras`, коли хочете перевизначити метадані моделі або працювати в `mode: "merge"` зі статичним каталогом:

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
  Якщо Gateway працює як daemon (launchd, systemd, Docker), переконайтеся, що `CEREBRAS_API_KEY` доступний цьому процесу — наприклад, у `~/.openclaw/.env` або через `env.shellEnv`. Ключ, експортований лише в інтерактивній оболонці, не допоможе керованому сервісу, якщо env не імпортовано окремо.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні зусилля міркування для двох моделей Cerebras, здатних до міркування.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Значення за замовчуванням для агентів і конфігурація моделей.
  </Card>
  <Card title="FAQ щодо моделей" href="/uk/help/faq-models" icon="circle-question">
    Auth-профілі, перемикання моделей і усунення помилок "no profile".
  </Card>
</CardGroup>
