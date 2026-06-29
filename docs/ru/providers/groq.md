---
read_when:
    - Вы хотите использовать Groq с OpenClaw
    - Вам нужна переменная окружения с API-ключом или выбор аутентификации CLI
    - Вы настраиваете расшифровку аудио Whisper в Groq
summary: Настройка Groq (аутентификация + выбор модели + транскрипция Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-28T23:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) обеспечивает сверхбыстрый инференс на моделях с открытыми весами (Llama, Gemma, Kimi, Qwen, GPT OSS и других) с использованием специализированного оборудования LPU. Plugin Groq регистрирует как совместимый с OpenAI провайдер чата, так и провайдер понимания аудиомедиа.

| Свойство                    | Значение                                  |
| --------------------------- | ----------------------------------------- |
| Идентификатор провайдера    | `groq`                                    |
| Plugin                      | официальный внешний пакет                 |
| Переменная окружения авторизации | `GROQ_API_KEY`                       |
| API                         | совместимый с OpenAI (`openai-completions`) |
| Базовый URL                 | `https://api.groq.com/openai/v1`          |
| Транскрибация аудио         | `whisper-large-v3-turbo` (по умолчанию)   |
| Рекомендуемая модель чата по умолчанию | `groq/llama-3.3-70b-versatile` |

## Установите Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Задайте ключ API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Задайте модель по умолчанию">
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
  <Step title="Проверьте доступность каталога">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Пример файла конфигурации

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

## Встроенный каталог

OpenClaw поставляется с каталогом Groq на основе манифеста, включающим записи как с рассуждением, так и без него. Выполните `openclaw models list --provider groq`, чтобы увидеть статические строки для установленной версии, или проверьте [console.groq.com/docs/models](https://console.groq.com/docs/models), чтобы получить авторитетный список Groq.

| Ссылка на модель                                 | Название                 | Рассуждение | Ввод              | Контекст |
| ------------------------------------------------ | ------------------------ | ----------- | ----------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile  | нет         | текст             | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant     | нет         | текст             | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B        | нет         | текст + изображение | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B             | да          | текст             | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B              | да          | текст             | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B       | да          | текст             | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B                | да          | текст             | 131,072  |
| `groq/groq/compound`                             | Compound                 | да          | текст             | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini            | да          | текст             | 131,072  |

<Tip>
  Каталог развивается с каждым выпуском OpenClaw. `openclaw models list --provider groq` показывает строки, известные вашей установленной версии; сверяйтесь с [console.groq.com/docs/models](https://console.groq.com/docs/models), чтобы узнать о недавно добавленных или устаревших моделях.
</Tip>

## Модели рассуждения

OpenClaw сопоставляет свои общие уровни `/think` со специфичными для моделей Groq значениями `reasoning_effort`:

- Для `qwen/qwen3-32b` отключенное мышление отправляет `none`, а включенное мышление отправляет `default`.
- Для моделей рассуждения Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw отправляет `low`, `medium` или `high` на основе уровня `/think`. При отключенном мышлении `reasoning_effort` не отправляется, потому что эти модели не поддерживают отключенное значение.
- DeepSeek R1 Distill, Qwen QwQ и Compound используют нативную поверхность рассуждения Groq; `/think` управляет видимостью, но модель всегда рассуждает.

См. [Режимы мышления](/ru/tools/thinking), чтобы узнать об общих уровнях `/think` и о том, как OpenClaw переводит их для каждого провайдера.

## Транскрибация аудио

Plugin Groq также регистрирует **провайдер понимания аудиомедиа**, чтобы голосовые сообщения можно было транскрибировать через общую поверхность `tools.media.audio`.

| Свойство                  | Значение                                  |
| ------------------------- | ----------------------------------------- |
| Общий путь конфигурации   | `tools.media.audio`                       |
| Базовый URL по умолчанию  | `https://api.groq.com/openai/v1`          |
| Модель по умолчанию       | `whisper-large-v3-turbo`                  |
| Автоматический приоритет  | 20                                        |
| Конечная точка API        | совместимая с OpenAI `/audio/transcriptions` |

Чтобы сделать Groq аудиобэкендом по умолчанию:

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
  <Accordion title="Доступность окружения для демона">
    Если Gateway работает как управляемая служба (launchd, systemd, Docker), `GROQ_API_KEY` должен быть виден этому процессу, а не только вашей интерактивной оболочке.

    <Warning>
      Ключ, экспортированный только в интерактивной оболочке, не поможет демону launchd или systemd, если это окружение также не импортировано туда. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы он был доступен для чтения из процесса Gateway.
    </Warning>

  </Accordion>

  <Accordion title="Пользовательские идентификаторы моделей Groq">
    OpenClaw принимает любой идентификатор модели Groq во время выполнения. Используйте точный идентификатор, показанный Groq, и добавьте к нему префикс `groq/`. Статический каталог покрывает распространенные случаи; идентификаторы вне каталога переходят к шаблону по умолчанию, совместимому с OpenAI.

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

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Режимы мышления" href="/ru/tools/thinking" icon="brain">
    Уровни усилия рассуждения и взаимодействие с политикой провайдера.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров и аудио.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель Groq, документация API и цены.
  </Card>
</CardGroup>
