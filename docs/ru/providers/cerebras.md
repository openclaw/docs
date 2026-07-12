---
read_when:
    - Вы хотите использовать Cerebras с OpenClaw
    - Вам нужна переменная окружения с ключом API Cerebras или выбор аутентификации через CLI
summary: Настройка Cerebras (аутентификация и выбор модели)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T11:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) предоставляет высокоскоростной вывод, совместимый с OpenAI, на специализированном оборудовании для вывода. Plugin поставляется со статическим каталогом из четырёх моделей (без динамического обнаружения).

| Свойство                  | Значение                                                  |
| ------------------------- | --------------------------------------------------------- |
| Идентификатор поставщика  | `cerebras`                                                |
| Plugin                    | официальный внешний пакет (`@openclaw/cerebras-provider`) |
| Переменная среды для аутентификации | `CEREBRAS_API_KEY`                               |
| Флаг первоначальной настройки | `--auth-choice cerebras-api-key`                       |
| Прямой флаг CLI           | `--cerebras-api-key <key>`                                |
| API                       | совместимый с OpenAI (`openai-completions`)               |
| Базовый URL               | `https://api.cerebras.ai/v1`                              |
| Модель по умолчанию       | `cerebras/zai-glm-4.7`                                    |

## Установка Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Получение ключа API">
    Создайте ключ API в [облачной консоли Cerebras](https://cloud.cerebras.ai).
  </Step>
  <Step title="Запуск первоначальной настройки">
    <CodeGroup>

```bash Первоначальная настройка
openclaw onboard --auth-choice cerebras-api-key
```

```bash Прямой флаг
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Только переменная среды
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Проверка доступности моделей">
    ```bash
    openclaw models list --provider cerebras
    ```

    Выводит все четыре статические модели. Если значение `CEREBRAS_API_KEY` не найдено, команда `openclaw models status --json` сообщает об отсутствующих учётных данных в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неинтерактивная настройка

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Встроенный каталог

Все четыре модели имеют окно контекста размером 128 тыс. токенов и поддерживают не более 8 192 токенов вывода.

| Ссылка на модель                           | Название             | Рассуждение | Примечания                                      |
| ------------------------------------------ | -------------------- | ----------- | ----------------------------------------------- |
| `cerebras/zai-glm-4.7`                     | Z.ai GLM 4.7         | да          | Модель по умолчанию; предварительная модель рассуждений |
| `cerebras/gpt-oss-120b`                    | GPT OSS 120B         | да          | Рабочая модель рассуждений                      |
| `cerebras/qwen-3-235b-a22b-instruct-2507`  | Qwen 3 235B Instruct | нет         | Предварительная модель без рассуждений          |
| `cerebras/llama3.1-8b`                     | Llama 3.1 8B         | нет         | Рабочая модель с упором на скорость             |

<Warning>
Cerebras помечает `zai-glm-4.7` и `qwen-3-235b-a22b-instruct-2507` как предварительные модели, а прекращение поддержки `llama3.1-8b` и `qwen-3-235b-a22b-instruct-2507` согласно документации запланировано на 27 мая 2026 года. Прежде чем использовать их для рабочих нагрузок в производственной среде, проверьте [страницу поддерживаемых моделей](https://inference-docs.cerebras.ai/models/overview) Cerebras.
</Warning>

## Настройка вручную

Для большинства установок требуется только ключ API. Используйте явную конфигурацию `models.providers.cerebras`, чтобы переопределить метаданные моделей или использовать `mode: "merge"` со статическим каталогом:

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
Если Gateway работает как демон (launchd, systemd, Docker), убедитесь, что переменная `CEREBRAS_API_KEY` доступна этому процессу — например, через `~/.openclaw/.env` или `env.shellEnv`. Ключ, экспортированный только в интерактивной оболочке, не будет доступен управляемой службе, если среда не импортирована отдельно.
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Режимы мышления" href="/ru/tools/thinking" icon="brain">
    Уровни интенсивности рассуждений для двух моделей Cerebras, поддерживающих рассуждение.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агентов по умолчанию и конфигурация моделей.
  </Card>
  <Card title="Часто задаваемые вопросы о моделях" href="/ru/help/faq-models" icon="circle-question">
    Профили аутентификации, переключение моделей и устранение ошибок «no profile».
  </Card>
</CardGroup>
