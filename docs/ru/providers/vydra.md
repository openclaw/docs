---
read_when:
    - Вы хотите генерацию медиа Vydra в OpenClaw
    - Вам нужны инструкции по настройке ключа API Vydra
summary: Используйте изображения, видео и речь Vydra в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-28T23:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Встроенный Plugin Vydra добавляет:

- Генерацию изображений через `vydra/grok-imagine`
- Генерацию видео через `vydra/veo3` и `vydra/kling`
- Синтез речи через маршрут TTS Vydra на базе ElevenLabs

OpenClaw использует один и тот же `VYDRA_API_KEY` для всех трех возможностей.

| Свойство              | Значение                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Идентификатор провайдера | `vydra`                                                                   |
| Plugin                | встроенный, `enabledByDefault: true`                                      |
| Переменная окружения для аутентификации | `VYDRA_API_KEY`                                                           |
| Флаг онбординга       | `--auth-choice vydra-api-key`                                             |
| Прямой флаг CLI       | `--vydra-api-key <key>`                                                   |
| Контракты             | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базовый URL           | `https://www.vydra.ai/api/v1` (используйте хост `www`)                    |

<Warning>
  Используйте `https://www.vydra.ai/api/v1` как базовый URL. Apex-хост Vydra (`https://vydra.ai/api/v1`) сейчас перенаправляет на `www`. Некоторые HTTP-клиенты удаляют `Authorization` при таком межхостовом перенаправлении, из-за чего действительный API-ключ выглядит как вводящая в заблуждение ошибка аутентификации. Встроенный Plugin напрямую использует базовый URL с `www`, чтобы избежать этого.
</Warning>

## Настройка

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Или задайте переменную окружения напрямую:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Выберите одну или несколько возможностей ниже (изображение, видео или речь) и примените соответствующую конфигурацию.
  </Step>
</Steps>

## Возможности

<AccordionGroup>
  <Accordion title="Image generation">
    Модель изображений по умолчанию:

    - `vydra/grok-imagine`

    Задайте ее как провайдера изображений по умолчанию:

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

    Текущая встроенная поддержка включает только преобразование текста в изображение. Размещенные маршруты редактирования Vydra ожидают удаленные URL изображений, а OpenClaw пока не добавляет во встроенный Plugin специальный мост загрузки для Vydra.

    <Note>
    См. [Генерация изображений](/ru/tools/image-generation) для общих параметров инструмента, выбора провайдера и поведения при отказе.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    Зарегистрированные модели видео:

    - `vydra/veo3` для преобразования текста в видео
    - `vydra/kling` для преобразования изображения в видео

    Задайте Vydra как провайдера видео по умолчанию:

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

    - `vydra/veo3` встроена только для преобразования текста в видео.
    - `vydra/kling` сейчас требует ссылку на удаленный URL изображения. Загрузки локальных файлов отклоняются заранее.
    - Текущий HTTP-маршрут `kling` у Vydra ведет себя непоследовательно в том, требует ли он `image_url` или `video_url`; встроенный провайдер отображает один и тот же удаленный URL изображения в оба поля.
    - Встроенный Plugin остается консервативным и не передает недокументированные параметры стиля, такие как соотношение сторон, разрешение, водяной знак или сгенерированный звук.

    <Note>
    См. [Генерация видео](/ru/tools/video-generation) для общих параметров инструмента, выбора провайдера и поведения при отказе.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Live-покрытие для конкретного провайдера:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Встроенный live-файл Vydra теперь покрывает:

    - преобразование текста в видео `vydra/veo3`
    - преобразование изображения в видео `vydra/kling` с использованием удаленного URL изображения

    При необходимости переопределите удаленную фикстуру изображения:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Задайте Vydra как провайдера речи:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Значения по умолчанию:

    - Модель: `elevenlabs/tts`
    - Идентификатор голоса: `21m00Tcm4TlvDq8ikWAM`

    Встроенный Plugin сейчас предоставляет один проверенный голос по умолчанию и возвращает аудиофайлы MP3.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Provider directory" href="/ru/providers/index" icon="list">
    Просмотрите всех доступных провайдеров.
  </Card>
  <Card title="Image generation" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента изображений и выбор провайдера.
  </Card>
  <Card title="Video generation" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения по умолчанию для агентов и конфигурация моделей.
  </Card>
</CardGroup>
