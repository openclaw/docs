---
read_when:
    - Вы хотите использовать Cerebras с OpenClaw
    - Вам нужна переменная окружения ключа API Cerebras или выбор аутентификации CLI
summary: Настройка Cerebras (аутентификация + выбор модели)
title: Cerebras
x-i18n:
    generated_at: "2026-06-28T23:35:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) предоставляет высокоскоростной, совместимый с OpenAI инференс на специализированном оборудовании для инференса. Provider Plugin Cerebras включает статический каталог из четырех моделей.

| Свойство          | Значение                                 |
| ----------------- | ---------------------------------------- |
| ID провайдера     | `cerebras`                               |
| Plugin            | официальный внешний пакет                |
| Переменная env для авторизации | `CEREBRAS_API_KEY`                       |
| Флаг онбординга   | `--auth-choice cerebras-api-key`         |
| Прямой флаг CLI   | `--cerebras-api-key <key>`               |
| API               | совместимый с OpenAI (`openai-completions`) |
| Базовый URL       | `https://api.cerebras.ai/v1`             |
| Модель по умолчанию | `cerebras/zai-glm-4.7`                   |

## Установите Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Get an API key">
    Создайте API-ключ в [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Онбординг
openclaw onboard --auth-choice cerebras-api-key
```

```bash Прямой флаг
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Только env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    Список должен включать все четыре статические модели. Если `CEREBRAS_API_KEY` не разрешается, `openclaw models status --json` сообщает об отсутствующих учетных данных в `auth.unusableProfiles`.

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

OpenClaw поставляется со статическим каталогом Cerebras, который отражает публичную совместимую с OpenAI конечную точку. Все четыре модели используют контекст 128k и максимум 8 192 токена вывода.

| Ссылка на модель                         | Название             | Рассуждение | Примечания                             |
| ---------------------------------------- | -------------------- | ----------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                   | Z.ai GLM 4.7         | да          | Модель по умолчанию; preview-модель рассуждения |
| `cerebras/gpt-oss-120b`                  | GPT OSS 120B         | да          | Production-модель рассуждения          |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | нет         | Preview-модель без рассуждения         |
| `cerebras/llama3.1-8b`                   | Llama 3.1 8B         | нет         | Production-модель, ориентированная на скорость |

<Warning>
  Cerebras помечает `zai-glm-4.7` и `qwen-3-235b-a22b-instruct-2507` как preview-модели, а для `llama3.1-8b` и `qwen-3-235b-a22b-instruct-2507` задокументировано прекращение поддержки 27 мая 2026 года. Перед использованием в production-нагрузках проверьте страницу поддерживаемых моделей Cerebras.
</Warning>

## Ручная конфигурация

Обычно Plugin означает, что вам нужен только API-ключ. Используйте явную конфигурацию `models.providers.cerebras`, если хотите переопределить метаданные модели или работать в `mode: "merge"` со статическим каталогом:

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
  Если Gateway работает как daemon (launchd, systemd, Docker), убедитесь, что `CEREBRAS_API_KEY` доступен этому процессу, например в `~/.openclaw/.env` или через `env.shellEnv`. Ключ, экспортированный только в интерактивной оболочке, не поможет управляемому сервису, если env не импортирована отдельно.
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model providers" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Thinking modes" href="/ru/tools/thinking" icon="brain">
    Уровни усилия рассуждения для двух моделей Cerebras с поддержкой рассуждения.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения по умолчанию для агента и конфигурация моделей.
  </Card>
  <Card title="Models FAQ" href="/ru/help/faq-models" icon="circle-question">
    Профили авторизации, переключение моделей и устранение ошибок "no profile".
  </Card>
</CardGroup>
