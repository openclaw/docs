---
read_when:
    - Вы хотите генерировать медиаконтент Vydra в OpenClaw
    - Вам нужны инструкции по настройке ключа API Vydra
summary: Использование изображений, видео и речи Vydra в OpenClaw
title: Выдра
x-i18n:
    generated_at: "2026-07-12T11:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Встроенный Plugin Vydra добавляет:

- Генерацию изображений через `vydra/grok-imagine`
- Генерацию видео через `vydra/veo3` (из текста в видео) и `vydra/kling` (из изображения в видео)
- Синтез речи через маршрут TTS Vydra на базе ElevenLabs

OpenClaw использует один и тот же `VYDRA_API_KEY` для всех трёх возможностей.

| Свойство                    | Значение                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| Идентификатор поставщика    | `vydra`                                                                   |
| Plugin                      | встроенный, `enabledByDefault: true`                                       |
| Переменная окружения для аутентификации | `VYDRA_API_KEY`                                                |
| Флаг первоначальной настройки | `--auth-choice vydra-api-key`                                           |
| Прямой флаг CLI             | `--vydra-api-key <key>`                                                    |
| Контракты                   | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базовый URL                 | `https://www.vydra.ai/api/v1` (используйте хост `www`)                     |

<Warning>
Используйте `https://www.vydra.ai/api/v1` в качестве базового URL. Корневой хост Vydra (`https://vydra.ai/api/v1`) в настоящее время перенаправляет на `www`. Некоторые HTTP-клиенты удаляют заголовок `Authorization` при таком перенаправлении между хостами, из-за чего действительный ключ API приводит к вводящей в заблуждение ошибке аутентификации. Чтобы избежать этого, встроенный Plugin преобразует любой настроенный базовый URL `vydra.ai` в `www.vydra.ai`.
</Warning>

## Настройка

<Steps>
  <Step title="Выполните интерактивную первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Или задайте переменную окружения напрямую:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Выберите возможность по умолчанию">
    Выберите одну или несколько возможностей ниже (изображения, видео или речь) и примените соответствующую конфигурацию.
  </Step>
</Steps>

## Возможности

<AccordionGroup>
  <Accordion title="Генерация изображений">
    Единственная встроенная модель изображений, используемая по умолчанию:

    - `vydra/grok-imagine`

    Установите её в качестве поставщика изображений по умолчанию:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Встроенная поддержка предусматривает только преобразование текста в изображение и не более одного изображения на запрос. Размещённые в Vydra маршруты редактирования ожидают удалённые URL изображений, а встроенный Plugin не добавляет специальный для Vydra мост загрузки.

    <Note>
    Общие параметры инструмента, выбор поставщика и поведение при переключении после сбоя описаны в разделе [Генерация изображений](/ru/tools/image-generation).
    </Note>

  </Accordion>

  <Accordion title="Генерация видео">
    Зарегистрированные модели видео:

    - `vydra/veo3` для преобразования текста в видео (отклоняет входные ссылки на изображения)
    - `vydra/kling` для преобразования изображения в видео (требует ровно один удалённый URL изображения)

    Установите Vydra в качестве поставщика видео по умолчанию:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Примечания:

    - `vydra/kling` сразу отклоняет загрузку локальных файлов; работает только ссылка на удалённый URL изображения.
    - HTTP-маршрут `kling` в Vydra ведёт себя непоследовательно в отношении того, какое поле требуется — `image_url` или `video_url`; встроенный поставщик отправляет один и тот же удалённый URL изображения в обоих полях.
    - Встроенный Plugin придерживается консервативного подхода и не передаёт недокументированные параметры стиля, такие как соотношение сторон, разрешение, водяной знак или создаваемая звуковая дорожка.

    <Note>
    Общие параметры инструмента, выбор поставщика и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="Интерактивные тесты видео">
    Интерактивное тестовое покрытие для конкретного поставщика:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Встроенный файл интерактивных тестов Vydra охватывает:

    - преобразование текста в видео с помощью `vydra/veo3`
    - преобразование изображения в видео с помощью `vydra/kling` и удалённого URL изображения

    При необходимости переопределите удалённый тестовый образец изображения:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез речи">
    Установите Vydra в качестве поставщика речи:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Значения по умолчанию:

    - Модель: `elevenlabs/tts`
    - Идентификатор голоса: `21m00Tcm4TlvDq8ikWAM` («Rachel»)

    Встроенный Plugin предоставляет этот единственный проверенный голос по умолчанию и возвращает аудиофайлы MP3.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Каталог поставщиков" href="/ru/providers/index" icon="list">
    Просмотрите всех доступных поставщиков.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента для работы с изображениями и выбор поставщика.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента для работы с видео и выбор поставщика.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Настройки агента по умолчанию и конфигурация модели.
  </Card>
</CardGroup>
