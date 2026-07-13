---
read_when:
    - Вам нужна генерация медиафайлов Vydra в OpenClaw
    - Вам нужны инструкции по настройке API-ключа Vydra
summary: Использование Vydra для работы с изображениями, видео и речью в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-13T18:32:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Встроенный плагин Vydra добавляет:

- Генерацию изображений через `vydra/grok-imagine`
- Генерацию видео через `vydra/veo3` (из текста в видео) и `vydra/kling` (из изображения в видео)
- Синтез речи через маршрут TTS Vydra на базе ElevenLabs

OpenClaw использует один и тот же `VYDRA_API_KEY` для всех трёх возможностей.

| Свойство              | Значение                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Идентификатор провайдера | `vydra`                                                                   |
| Плагин                | встроенный, `enabledByDefault: true`                                         |
| Переменная среды для аутентификации | `VYDRA_API_KEY`                                                           |
| Флаг первоначальной настройки | `--auth-choice vydra-api-key`                                             |
| Прямой флаг CLI       | `--vydra-api-key <key>`                                                   |
| Контракты             | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базовый URL           | `https://www.vydra.ai/api/v1` (используйте хост `www`)                        |

<Warning>
Используйте `https://www.vydra.ai/api/v1` в качестве базового URL. Корневой хост Vydra (`https://vydra.ai/api/v1`) в настоящее время перенаправляет на `www`. Некоторые HTTP-клиенты удаляют `Authorization` при этом перенаправлении на другой хост, из-за чего действительный ключ API приводит к ошибке, ошибочно указывающей на проблему аутентификации. Встроенный плагин нормализует любой настроенный базовый URL `vydra.ai` в `www.vydra.ai`, чтобы избежать этого.
</Warning>

## Настройка

<Steps>
  <Step title="Запустите интерактивную первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Или задайте переменную среды напрямую:

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

    Установите её в качестве провайдера изображений по умолчанию:

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

    Встроенная поддержка охватывает только преобразование текста в изображение и позволяет создать не более одного изображения за запрос. Размещённые у Vydra маршруты редактирования ожидают удалённые URL изображений, а встроенный плагин не добавляет специальный для Vydra механизм загрузки.

    <Note>
    Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация изображений](/ru/tools/image-generation).
    </Note>

  </Accordion>

  <Accordion title="Генерация видео">
    Зарегистрированные модели видео:

    - `vydra/veo3` для преобразования текста в видео (отклоняет входные ссылки на изображения)
    - `vydra/kling` для преобразования изображения в видео (требует ровно один удалённый URL изображения)

    Установите Vydra в качестве провайдера видео по умолчанию:

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

    - `vydra/kling` сразу отклоняет загрузку локальных файлов; поддерживается только ссылка на удалённый URL изображения.
    - HTTP-маршрут Vydra `kling` непоследовательно требует то `image_url`, то `video_url`; встроенный провайдер отправляет один и тот же удалённый URL изображения в обоих полях.
    - Встроенный плагин придерживается консервативного подхода и не передаёт недокументированные параметры стиля, такие как соотношение сторон, разрешение, водяной знак или сгенерированный звук.

    <Note>
    Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="Интерактивные тесты видео">
    Интерактивное тестовое покрытие для конкретного провайдера:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Встроенный файл интерактивных тестов Vydra охватывает:

    - `vydra/veo3` — преобразование текста в видео
    - `vydra/kling` — преобразование изображения в видео с использованием удалённого URL изображения

    При необходимости переопределите удалённое тестовое изображение:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез речи">
    Установите Vydra в качестве провайдера речи:

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

    Встроенный плагин предоставляет этот единственный проверенный голос по умолчанию и возвращает аудиофайлы MP3.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Каталог провайдеров" href="/ru/providers/index" icon="list">
    Просмотрите всех доступных провайдеров.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента для изображений и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента для видео и выбор провайдера.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агента по умолчанию и конфигурация модели.
  </Card>
</CardGroup>
