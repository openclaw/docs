---
read_when:
    - Вы хотите использовать модели Mistral в OpenClaw
    - Вам нужна транскрибация в реальном времени с помощью Voxtral для голосовых вызовов
    - Вам потребуется настройка ключа Mistral API и ссылки на модели
summary: Использование моделей Mistral и транскрипции Voxtral с OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T11:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Встроенный Plugin `mistral` регистрирует четыре контракта: генерацию ответов в чате, распознавание медиаданных (пакетную транскрипцию Voxtral), распознавание речи в реальном времени для голосовых вызовов (Voxtral Realtime) и векторные представления памяти (`mistral-embed`).

| Свойство                     | Значение                                    |
| ---------------------------- | ------------------------------------------- |
| Идентификатор провайдера     | `mistral`                                   |
| Plugin                       | встроенный, включён по умолчанию            |
| Переменная окружения авторизации | `MISTRAL_API_KEY`                       |
| Флаг первоначальной настройки | `--auth-choice mistral-api-key`            |
| Прямой флаг CLI              | `--mistral-api-key <key>`                   |
| API                          | совместимый с OpenAI (`openai-completions`) |
| Базовый URL                  | `https://api.mistral.ai/v1`                 |
| Модель по умолчанию          | `mistral/mistral-large-latest`              |
| Модель векторных представлений | `mistral-embed`                           |
| Пакетный режим Voxtral       | `voxtral-mini-latest` (транскрипция аудио)  |
| Voxtral в реальном времени   | `voxtral-mini-transcribe-realtime-2602`     |

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API в [консоли Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Либо передайте ключ напрямую:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Задайте модель по умолчанию">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Встроенный каталог больших языковых моделей

| Ссылка на модель                 | Входные данные | Контекст | Макс. объём вывода | Примечания                                                   |
| -------------------------------- | -------------- | -------- | ------------------ | ------------------------------------------------------------ |
| `mistral/mistral-large-latest`   | текст, изображение | 262,144 | 16,384         | Модель по умолчанию                                          |
| `mistral/mistral-medium-2508`    | текст, изображение | 262,144 | 8,192          | Mistral Medium 3.1                                           |
| `mistral/mistral-medium-3-5`     | текст, изображение | 262,144 | 8,192          | Mistral Medium 3.5; настраиваемое рассуждение                 |
| `mistral/mistral-small-latest`   | текст, изображение | 262,144 | 16,384         | Последняя версия Mistral Small 4; настраиваемый `reasoning_effort` |
| `mistral/mistral-small-2603`     | текст, изображение | 262,144 | 16,384         | Закреплённая версия Mistral Small 4; настраиваемый `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, изображение | 128,000 | 32,768         | Pixtral                                                      |
| `mistral/codestral-latest`       | текст          | 256,000  | 4,096              | Программирование                                             |
| `mistral/devstral-medium-latest` | текст          | 262,144  | 32,768             | Devstral 2                                                   |
| `mistral/magistral-small`        | текст          | 128,000  | 40,000             | Поддерживает рассуждение                                     |

Перед изменением конфигурации просмотрите строку во встроенном каталоге:

```bash
openclaw models list --all --provider mistral --plain
```

Проведите быструю проверку модели без запуска Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Транскрипция аудио (Voxtral)

Используйте Voxtral для пакетной транскрипции аудио через конвейер распознавания медиаданных:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Для транскрипции медиаданных используется `/v1/audio/transcriptions`. Модель аудио Mistral по умолчанию — `voxtral-mini-latest`.
</Tip>

## Потоковое распознавание речи для голосовых вызовов

Встроенный Plugin `mistral` регистрирует Voxtral Realtime как провайдер потокового распознавания речи для голосовых вызовов.

| Параметр        | Путь конфигурации                                                    | Значение по умолчанию                    |
| --------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| Ключ API        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Используется `MISTRAL_API_KEY`, если не задан |
| Модель          | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602`  |
| Кодировка       | `...mistral.encoding`                                                | `pcm_mulaw`                              |
| Частота дискретизации | `...mistral.sampleRate`                                         | `8000`                                   |
| Целевая задержка | `...mistral.targetStreamingDelayMs`                                 | `800`                                    |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
По умолчанию OpenClaw использует для распознавания речи Mistral в реальном времени кодировку `pcm_mulaw` с частотой 8 кГц, чтобы голосовые вызовы могли напрямую передавать медиаданные Twilio. Используйте `encoding: "pcm_s16le"` и соответствующее значение `sampleRate`, только если входящий поток уже содержит необработанные данные PCM.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Настраиваемое рассуждение">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` и `mistral/mistral-medium-3-5` поддерживают [настраиваемое рассуждение](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) в API генерации ответов в чате с помощью `reasoning_effort` (`none` сводит дополнительные рассуждения в выводе к минимуму; `high` показывает полную трассировку рассуждений перед окончательным ответом).

    OpenClaw сопоставляет уровень **рассуждения** сеанса с API Mistral:

    | Уровень рассуждения OpenClaw                                         | `reasoning_effort` Mistral |
    | -------------------------------------------------------------------- | -------------------------- |
    | **выкл.** / **минимальный**                                          | `none`                     |
    | **низкий** / **средний** / **высокий** / **сверхвысокий** / **адаптивный** / **максимальный** | `high` |

    <Warning>
    Не сочетайте режим рассуждения Medium 3.5 с `temperature: 0`: сообщалось, что HTTP API Mistral отклоняет комбинацию `reasoning_effort="high"` и `temperature: 0`, возвращая ответ с кодом 400. Не задавайте температуру либо отключите рассуждение или установите минимальный уровень, чтобы OpenClaw отправлял `reasoning_effort: "none"`, прежде чем задавать низкую температуру.
    </Warning>

    Пример конфигурации рассуждения для Medium 3.5 на уровне модели:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Другие модели из встроенного каталога Mistral не используют этот параметр. Если вам нужно изначально ориентированное на рассуждения поведение Mistral, продолжайте использовать модели `magistral-*`.
    </Note>

  </Accordion>

  <Accordion title="Векторные представления памяти">
    Mistral может предоставлять векторные представления памяти через `/v1/embeddings` (модель по умолчанию: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Авторизация и базовый URL">
    - Для авторизации Mistral используется `MISTRAL_API_KEY` (заголовок Bearer).
    - Базовый URL провайдера по умолчанию — `https://api.mistral.ai/v1`; он принимает стандартный формат запроса генерации ответов в чате, совместимый с OpenAI.
    - Модель по умолчанию при первоначальной настройке — `mistral/mistral-large-latest`.
    - Переопределяйте базовый URL в `models.providers.mistral.baseUrl`, только если Mistral явно публикует необходимую вам региональную конечную точку.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Распознавание медиаданных" href="/ru/nodes/media-understanding" icon="microphone">
    Настройка транскрипции аудио и выбор провайдера.
  </Card>
</CardGroup>
