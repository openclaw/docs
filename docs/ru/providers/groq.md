---
read_when:
    - Вы хотите использовать Groq с OpenClaw
    - Вам потребуется переменная окружения с ключом API или выбор аутентификации в CLI
    - Вы настраиваете транскрибирование аудио с помощью Whisper в Groq
summary: Настройка Groq (аутентификация + выбор модели + транскрибирование с помощью Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-13T18:40:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) предоставляет сверхбыстрый инференс моделей с открытыми весами (Llama, Gemma, Kimi, Qwen, GPT OSS и других) на специализированном оборудовании LPU. Плагин Groq регистрирует как провайдер чата, совместимый с OpenAI, так и провайдер распознавания аудиоконтента.

| Свойство                      | Значение                                 |
| ----------------------------- | ---------------------------------------- |
| Идентификатор провайдера      | `groq`                       |
| Плагин                        | официальный внешний пакет                |
| Переменная окружения для аутентификации | `GROQ_API_KEY`              |
| API                           | совместимый с OpenAI (`openai-completions`) |
| Базовый URL                   | `https://api.groq.com/openai/v1`                       |
| Транскрибирование аудио       | `whisper-large-v3-turbo` (по умолчанию)        |
| Рекомендуемая модель чата по умолчанию | `groq/llama-3.3-70b-versatile`             |

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на странице [console.groq.com/keys](https://console.groq.com/keys).
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
  <Step title="Убедитесь, что каталог доступен">
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

OpenClaw поставляется с каталогом Groq на основе манифеста, содержащим модели как с рассуждением, так и без него. Выполните `openclaw models list --provider groq`, чтобы увидеть статические строки для установленной версии, или ознакомьтесь с официальным списком Groq на странице [console.groq.com/docs/models](https://console.groq.com/docs/models).

| Ссылка на модель                                  | Название                | Рассуждение | Входные данные | Контекст |
| ------------------------------------------------- | ----------------------- | ----------- | -------------- | -------- |
| `groq/llama-3.3-70b-versatile`                                | Llama 3.3 70B Versatile | нет         | текст          | 131,072  |
| `groq/llama-3.1-8b-instant`                                | Llama 3.1 8B Instant    | нет         | текст          | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`                                | Llama 4 Scout 17B       | нет         | текст + изображение | 131,072 |
| `groq/openai/gpt-oss-120b`                                | GPT OSS 120B            | да          | текст          | 131,072  |
| `groq/openai/gpt-oss-20b`                                | GPT OSS 20B             | да          | текст          | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`                                | Safety GPT OSS 20B      | да          | текст          | 131,072  |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B               | да          | текст          | 131,072  |
| `groq/groq/compound`                                | Compound                | да          | текст          | 131,072  |
| `groq/groq/compound-mini`                                | Compound Mini           | да          | текст          | 131,072  |

<Tip>
  Каталог развивается с каждым выпуском OpenClaw. Команда `openclaw models list --provider groq` показывает строки, известные установленной версии; сверяйтесь со страницей [console.groq.com/docs/models](https://console.groq.com/docs/models), чтобы узнать о недавно добавленных или устаревших моделях.
</Tip>

## Модели с рассуждением

Модели Groq с рассуждением (`reasoning: true` в таблице выше) сопоставляют общие уровни `/think` OpenClaw со значениями `reasoning_effort`: `low`, `medium` или `high`. При значении `/think off` или `/think none` параметр `reasoning_effort` исключается из запроса, а не отправляется с отключённым значением.

Общие уровни `/think` и способы их преобразования OpenClaw для каждого провайдера описаны в разделе [Режимы мышления](/ru/tools/thinking).

## Транскрибирование аудио

Плагин Groq также регистрирует **провайдер распознавания аудиоконтента**, позволяющий транскрибировать голосовые сообщения через общий интерфейс `tools.media.audio`.

| Свойство                    | Значение                                  |
| --------------------------- | ----------------------------------------- |
| Общий путь конфигурации     | `tools.media.audio`                        |
| Базовый URL по умолчанию    | `https://api.groq.com/openai/v1`                        |
| Модель по умолчанию         | `whisper-large-v3-turbo`                        |
| Автоматический приоритет    | 20                                        |
| Конечная точка API          | совместимая с OpenAI `/audio/transcriptions`   |

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
  <Accordion title="Доступность переменной окружения для фоновой службы">
    Если Gateway работает как управляемая служба (launchd, systemd, Docker), переменная `GROQ_API_KEY` должна быть доступна этому процессу, а не только интерактивной оболочке.

    <Warning>
      Ключ, экспортированный только в интерактивной оболочке, не будет доступен фоновой службе launchd или systemd, если окружение также не импортировано туда. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway мог его прочитать.
    </Warning>

  </Accordion>

  <Accordion title="Пользовательские идентификаторы моделей Groq">
    OpenClaw принимает во время выполнения любой идентификатор модели Groq. Используйте точный идентификатор, указанный Groq, добавив к нему префикс `groq/`. Статический каталог охватывает распространённые случаи; для отсутствующих в каталоге идентификаторов используется стандартный шаблон, совместимый с OpenAI.

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
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Режимы мышления" href="/ru/tools/thinking" icon="brain">
    Уровни интенсивности рассуждения и взаимодействие с политиками провайдера.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдера и аудио.
  </Card>
  <Card title="Консоль Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель управления Groq, документация API и тарифы.
  </Card>
</CardGroup>
