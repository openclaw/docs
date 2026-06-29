---
read_when:
    - Вам нужен Deepgram для преобразования речи в текст для аудиовложений
    - Вы хотите потоковую транскрипцию Deepgram для Voice Call
    - Вам нужен краткий пример конфигурации Deepgram
summary: Транскрибация Deepgram для входящих голосовых заметок
title: Deepgram
x-i18n:
    generated_at: "2026-06-28T23:36:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram — это API преобразования речи в текст. В OpenClaw он используется для транскрибации входящих аудио/голосовых заметок через `tools.media.audio` и для потокового STT голосовых вызовов через `plugins.entries.voice-call.config.streaming`.

Для пакетной транскрибации OpenClaw загружает полный аудиофайл в Deepgram и внедряет транскрипт в конвейер ответа (блок `{{Transcript}}` + `[Audio]`). Для потоковой передачи голосового вызова OpenClaw пересылает live-кадры G.711 u-law через WebSocket-эндпоинт Deepgram `listen` и выдает частичные или финальные транскрипты по мере их возврата Deepgram.

| Сведения      | Значение                                                   |
| ------------- | ---------------------------------------------------------- |
| Сайт          | [deepgram.com](https://deepgram.com)                       |
| Документация  | [developers.deepgram.com](https://developers.deepgram.com) |
| Аутентификация | `DEEPGRAM_API_KEY`                                         |
| Модель по умолчанию | `nova-3`                                                   |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Добавьте ключ API Deepgram в окружение:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Включите аудиопровайдера">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Отправьте голосовую заметку">
    Отправьте аудиосообщение через любой подключенный канал. OpenClaw транскрибирует его
    через Deepgram и внедрит транскрипт в конвейер ответа.
  </Step>
</Steps>

## Параметры конфигурации

| Параметр          | Путь                                                         | Описание                                      |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Идентификатор модели Deepgram (по умолчанию: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Подсказка языка (необязательно)               |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Включить определение языка (необязательно)    |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Включить пунктуацию (необязательно)           |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Включить интеллектуальное форматирование (необязательно) |

<Tabs>
  <Tab title="С подсказкой языка">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="С параметрами Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Потоковое STT для Voice Call

Встроенный Plugin `deepgram` также регистрирует поставщика транскрибации в реальном времени
для Plugin Voice Call.

| Настройка              | Путь конфигурации                                                       | По умолчанию                         |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Ключ API               | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Использует `DEEPGRAM_API_KEY`        |
| Модель                 | `...deepgram.model`                                                     | `nova-3`                             |
| Язык                   | `...deepgram.language`                                                  | (не задано)                          |
| Кодирование            | `...deepgram.encoding`                                                  | `mulaw`                              |
| Частота дискретизации  | `...deepgram.sampleRate`                                                | `8000`                               |
| Endpointing            | `...deepgram.endpointingMs`                                             | `800`                                |
| Промежуточные результаты | `...deepgram.interimResults`                                          | `true`                               |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call получает телефонный звук как 8 kHz G.711 u-law. Поставщик потоковой передачи Deepgram
по умолчанию использует `encoding: "mulaw"` и `sampleRate: 8000`, поэтому
медиакадры Twilio можно пересылать напрямую.
</Note>

## Примечания

<AccordionGroup>
  <Accordion title="Аутентификация">
    Аутентификация следует стандартному порядку авторизации поставщиков. `DEEPGRAM_API_KEY` —
    самый простой путь.
  </Accordion>
  <Accordion title="Прокси и пользовательские конечные точки">
    Переопределяйте конечные точки или заголовки с помощью `tools.media.audio.baseUrl` и
    `tools.media.audio.headers` при использовании прокси.
  </Accordion>
  <Accordion title="Поведение вывода">
    Вывод следует тем же правилам для аудио, что и у других поставщиков (ограничения размера, тайм-ауты,
    внедрение транскрипта).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Медиаинструменты" href="/ru/tools/media-overview" icon="photo-film">
    Обзор конвейера обработки аудио, изображений и видео.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации, включая настройки медиаинструментов.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и шаги отладки.
  </Card>
  <Card title="Часто задаваемые вопросы" href="/ru/help/faq" icon="circle-question">
    Часто задаваемые вопросы о настройке OpenClaw.
  </Card>
</CardGroup>
