---
read_when:
    - Ви хочете використовувати Meta з OpenClaw
    - Вам потрібна змінна середовища MODEL_API_KEY або вибір автентифікації через CLI
summary: Налаштування Meta (автентифікація + вибір моделі muse-spark-1.1)
title: Мета
x-i18n:
    generated_at: "2026-07-12T13:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** використовує сумісний з OpenAI **Responses API** (`POST /v1/responses`)
для моделі міркування `muse-spark-1.1`. Провайдер постачається як вбудований
плагін OpenClaw.

| Властивість              | Значення                           |
| ------------------------ | ---------------------------------- |
| Ідентифікатор провайдера | `meta`                             |
| Плагін                   | вбудований провайдер               |
| Змінна середовища автентифікації | `MODEL_API_KEY`           |
| Прапорець початкового налаштування | `--auth-choice meta-api-key` |
| Прямий прапорець CLI     | `--meta-api-key <key>`             |
| API                      | Responses API (`openai-responses`) |
| Базова URL-адреса        | `https://api.meta.ai/v1`           |
| Типова модель            | `meta/muse-spark-1.1`              |
| Типовий рівень міркування | `high` (`reasoning.effort`)       |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    <CodeGroup>

```bash Початкове налаштування
openclaw onboard --auth-choice meta-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Лише змінна середовища
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте доступність моделей">
    ```bash
    openclaw models list --provider meta
    ```

    Виводить статичний запис каталогу `muse-spark-1.1`. Якщо значення `MODEL_API_KEY` не визначено,
    `openclaw models status --json` повідомляє про відсутні облікові дані в
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Вбудований каталог

| Посилання на модель     | Назва          | Міркування | Контекстне вікно | Максимальний обсяг виводу |
| ----------------------- | -------------- | ---------- | ---------------- | ------------------------- |
| `meta/muse-spark-1.1`   | Muse Spark 1.1 | так        | 1,048,576        | 131,072                   |

Можливості:

- Введення тексту та зображень
- Виклики інструментів і потокове передавання
- Рівень міркування: `minimal`, `low`, `medium`, `high`, `xhigh` (типовий: `high`)
- Відтворення зашифрованих міркувань без збереження стану (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` не приймає `reasoning.effort: "none"`. Для цього провайдера OpenClaw зіставляє
`--thinking off` зі значенням `minimal`.
</Warning>

## Ручна конфігурація

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Якщо Gateway працює як демон (launchd, systemd, Docker), переконайтеся, що
`MODEL_API_KEY` доступна цьому процесу — наприклад, у
`~/.openclaw/.env` або через `env.shellEnv`. Ключ, експортований лише в
інтерактивній оболонці, не допоможе керованій службі, якщо середовище не імпортовано
окремо.
</Note>

## Швидка перевірка

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Тести в реальному середовищі використовують `muse-spark-1.1` із запитом до `POST /v1/responses`.

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні інтенсивності міркування для muse-spark-1.1.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові налаштування агентів і конфігурація моделей.
  </Card>
</CardGroup>
