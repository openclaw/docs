---
read_when:
    - Вам требуется преобразование речи в текст с помощью Deepgram для аудиовложений
    - Вам нужна потоковая транскрипция Deepgram для голосовых вызовов
    - Вам нужен краткий пример конфигурации Deepgram
summary: Транскрибирование входящих голосовых сообщений с помощью Deepgram
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T16:41:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram — это API преобразования речи в текст. OpenClaw использует его для транскрибирования входящих аудиосообщений и голосовых заметок
через `tools.media.audio`, а также для потокового преобразования речи в текст при голосовых вызовах
через `plugins.entries.voice-call.config.streaming`.

При пакетном транскрибировании полный аудиофайл загружается в Deepgram, а
транскрипция добавляется в конвейер ответов (блок `{{Transcript}}` + `[Audio]`).
При потоковом преобразовании речи в текст для голосовых вызовов кадры G.711 u-law в реальном времени передаются через
конечную точку WebSocket `listen` Deepgram, а по мере получения от Deepgram
создаются промежуточные и окончательные транскрипции.

| Сведения      | Значение                                                   |
| ------------- | ---------------------------------------------------------- |
| Веб-сайт      | [deepgram.com](https://deepgram.com)                       |
| Документация  | [developers.deepgram.com](https://developers.deepgram.com) |
| Аутентификация | `DEEPGRAM_API_KEY`                                         |
| Модель по умолчанию | `nova-3`                                                   |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Включите провайдер аудио">
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
    Отправьте аудиосообщение через любой подключённый канал. OpenClaw транскрибирует его
    с помощью Deepgram и добавит транскрипцию в конвейер ответов.
  </Step>
</Steps>

## Параметры конфигурации

| Параметр  | Путь                                  | Описание                              |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Идентификатор модели Deepgram (по умолчанию: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Подсказка языка (необязательно)       |

`providerOptions.deepgram` добавляет дополнительные параметры запроса непосредственно в
запрос Deepgram `/listen`, поэтому можно использовать любое имя параметра,
поддерживаемое Deepgram (например, `detect_language`, `punctuate`, `smart_format`):

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

## Потоковое преобразование речи в текст для голосовых вызовов

Встроенный плагин `deepgram` также регистрирует провайдер транскрибирования в реальном времени
для плагина голосовых вызовов.

| Настройка       | Путь конфигурации                                                        | Значение по умолчанию                        |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| Ключ API        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Если не задан, используется `DEEPGRAM_API_KEY` |
| Базовый URL     | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` или общедоступный API Deepgram |
| Модель          | `...deepgram.model`                                                     | `nova-3`                                     |
| Язык            | `...deepgram.language`                                                  | (не задан)                                   |
| Кодировка       | `...deepgram.encoding`                                                  | `mulaw`                                      |
| Частота дискретизации | `...deepgram.sampleRate`                                                | `8000`                                       |
| Определение конца реплики | `...deepgram.endpointingMs`                                             | `800`                                        |
| Промежуточные результаты | `...deepgram.interimResults`                                            | `true`                                       |

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

Чтобы использовать [пользовательскую конечную точку Deepgram](https://developers.deepgram.com/reference/custom-endpoints),
задайте для `baseUrl` корневой адрес конечной точки, включая базовый путь, но без `/listen`.
Конечные точки реального времени принимают `http://`, `https://`, `ws://` и `wss://`. HTTP
преобразуется в WS, HTTPS — в WSS, а явно указанные схемы WebSocket остаются без изменений.
Некорректные URL-адреса и другие схемы приводят к ошибке при настройке сеанса.

<Note>
Voice Call получает телефонный звук в формате G.711 u-law с частотой 8 кГц. Провайдер потоковой передачи
Deepgram по умолчанию использует `encoding: "mulaw"` и `sampleRate: 8000`, поэтому
медиакадры Twilio можно передавать напрямую.
</Note>

## Примечания

<AccordionGroup>
  <Accordion title="Аутентификация">
    Аутентификация выполняется в стандартном для провайдеров порядке. `DEEPGRAM_API_KEY` —
    самый простой вариант.
  </Accordion>
  <Accordion title="Прокси и пользовательские конечные точки">
    При использовании прокси переопределите конечные точки или заголовки с помощью `tools.media.audio.baseUrl` и
    `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Формирование результата">
    Результат подчиняется тем же правилам обработки аудио, что и у других провайдеров (ограничения размера, тайм-ауты,
    добавление транскрипции).
  </Accordion>
</AccordionGroup>

## См. также

<CardGroup cols={2}>
  <Card title="Инструменты обработки медиа" href="/ru/tools/media-overview" icon="photo-film">
    Обзор конвейера обработки аудио, изображений и видео.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации, включая настройки инструментов обработки медиа.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространённые проблемы и действия по отладке.
  </Card>
  <Card title="Часто задаваемые вопросы" href="/ru/help/faq" icon="circle-question">
    Часто задаваемые вопросы о настройке OpenClaw.
  </Card>
</CardGroup>
