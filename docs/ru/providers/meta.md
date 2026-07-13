---
read_when:
    - Вы хотите использовать Meta с OpenClaw
    - Вам потребуется переменная окружения MODEL_API_KEY или выбранный способ аутентификации в CLI
summary: Настройка Meta (аутентификация + выбор модели muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-13T18:41:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** использует совместимый с OpenAI **Responses API** (`POST /v1/responses`)
для модели рассуждений `muse-spark-1.1`. Провайдер поставляется как встроенный
плагин OpenClaw.

| Свойство                     | Значение                           |
| ---------------------------- | ---------------------------------- |
| Идентификатор провайдера     | `meta`                 |
| Плагин                       | встроенный провайдер               |
| Переменная окружения для аутентификации | `MODEL_API_KEY`       |
| Флаг первоначальной настройки | `--auth-choice meta-api-key`                |
| Прямой флаг CLI              | `--meta-api-key <key>`                 |
| API                          | Responses API (`openai-responses`) |
| Базовый URL                  | `https://api.meta.ai/v1`                 |
| Модель по умолчанию          | `meta/muse-spark-1.1`                 |
| Рассуждение по умолчанию     | `high` (`reasoning.effort`) |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Убедитесь, что модели доступны">
    ```bash
    openclaw models list --provider meta
    ```

    Выводит статическую запись каталога `muse-spark-1.1`. Если `MODEL_API_KEY` не разрешён,
    `openclaw models status --json` сообщает об отсутствующих учётных данных в
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Неинтерактивная настройка

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Встроенный каталог

| Ссылка на модель      | Название       | Рассуждение | Контекстное окно | Максимальный вывод |
| --------------------- | -------------- | ----------- | ----------------- | ------------------ |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | да          | 1,048,576         | 131,072            |

Возможности:

- Ввод текста и изображений
- Вызов инструментов и потоковая передача
- Интенсивность рассуждений: `minimal`, `low`, `medium`, `high`, `xhigh` (по умолчанию: `high`)
- Повторное воспроизведение зашифрованных рассуждений без сохранения состояния (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` не принимает `reasoning.effort: "none"`. OpenClaw сопоставляет
`--thinking off` с `minimal` для этого провайдера.
</Warning>

## Ручная настройка

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
Если Gateway работает как демон (launchd, systemd, Docker), убедитесь, что
`MODEL_API_KEY` доступен этому процессу — например, в
`~/.openclaw/.env` или через `env.shellEnv`. Ключ, экспортированный только в
интерактивной оболочке, не поможет управляемой службе, если переменные окружения
не импортированы отдельно.
</Note>

## Дымовой тест

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Тесты в реальной среде используют `muse-spark-1.1` с `POST /v1/responses`.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Режимы мышления" href="/ru/tools/thinking" icon="brain">
    Уровни интенсивности рассуждений для muse-spark-1.1.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агентов по умолчанию и конфигурация моделей.
  </Card>
</CardGroup>
