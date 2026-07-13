---
read_when:
    - Вы хотите использовать модели Google Gemini с OpenClaw
    - Вам нужен API-ключ или аутентификация через OAuth
summary: Настройка Google Gemini (ключ API + OAuth, генерация изображений, распознавание медиаконтента, TTS, веб-поиск)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-13T20:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Плагин Google предоставляет доступ к моделям Gemini через Google AI Studio, а также генерацию изображений, распознавание мультимедиа (изображений, аудио и видео), преобразование текста в речь и веб-поиск с помощью Gemini Grounding.

- Провайдер: `google`
- Аутентификация: `GEMINI_API_KEY` или `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр среды выполнения: `agentRuntime.id: "google-gemini-cli"` повторно использует OAuth Gemini CLI, сохраняя канонический вид ссылок на модели: `google/*`.

## Начало работы

Выберите предпочтительный метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Ключ API">
    **Лучше всего подходит для:** стандартного доступа к Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Поддерживаются как `GEMINI_API_KEY`, так и `GOOGLE_API_KEY`. Используйте уже настроенный вариант.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Лучше всего подходит для:** повторного использования существующего входа в Gemini CLI через PKCE OAuth вместо отдельного ключа API.

    <Warning>
    Провайдер `google-gemini-cli` является неофициальной интеграцией. Некоторые пользователи
    сообщают об ограничениях учётных записей при таком использовании OAuth. Используйте на свой риск.
    </Warning>

    <Steps>
      <Step title="Установите Gemini CLI">
        Локальная команда `gemini` должна быть доступна в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw поддерживает установки как через Homebrew, так и через глобальную установку npm, включая
        распространённые схемы каталогов Windows/npm.
      </Step>
      <Step title="Войдите через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель по умолчанию: `google/gemini-3.1-pro-preview`
    - Среда выполнения: `google-gemini-cli`
    - Псевдоним: `gemini-cli`

    Идентификатор модели Gemini API для Gemini 3.1 Pro — `gemini-3.1-pro-preview`. Для удобства OpenClaw принимает сокращённый псевдоним `google/gemini-3.1-pro` и нормализует его перед вызовами провайдера.

    **Переменные окружения:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Если запросы OAuth Gemini CLI завершаются ошибкой после входа, задайте `GOOGLE_CLOUD_PROJECT` или
    `GOOGLE_CLOUD_PROJECT_ID` на хосте Gateway и повторите попытку.
    </Note>

    <Note>
    Если вход завершается ошибкой до запуска процесса в браузере, убедитесь, что локальная команда `gemini`
    установлена и доступна в `PATH`.
    </Note>

    Ссылки на модели `google-gemini-cli/*` являются устаревшими псевдонимами для обратной совместимости. В новых
    конфигурациях следует использовать ссылки на модели `google/*` вместе со средой выполнения `google-gemini-cli`,
    если требуется локальное выполнение через Gemini CLI.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` была выведена из эксплуатации 2026-03-09; вместо неё используйте `google/gemini-3.1-pro-preview`. Повторная настройка ключа Gemini API (`openclaw onboard --auth-choice gemini-api-key` или `openclaw models auth login --provider google`) заменяет устаревшую настроенную модель по умолчанию на текущую.
</Note>

## Возможности

| Возможность                    | Поддерживается                 |
| ----------------------------- | ------------------------------ |
| Завершения чата               | Да                             |
| Генерация изображений         | Да                             |
| Генерация музыки              | Да                             |
| Преобразование текста в речь  | Да                             |
| Голосовая связь в реальном времени | Да (Google Live API)      |
| Распознавание изображений     | Да                             |
| Транскрипция аудио            | Да                             |
| Распознавание видео           | Да                             |
| Веб-поиск (Grounding)         | Да                             |
| Мышление и рассуждение        | Да (Gemini 2.5+ / Gemini 3+)   |
| Модели Gemma 4                | Да                             |

## Веб-поиск

Встроенный провайдер веб-поиска `gemini` использует привязку к Google Search через Gemini.
Настройте отдельный ключ поиска в `plugins.entries.google.config.webSearch`
или разрешите повторное использование `models.providers.google.apiKey` после `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Порядок приоритета учётных данных: отдельный `webSearch.apiKey`, затем `GEMINI_API_KEY`,
затем `models.providers.google.apiKey`. Параметр `webSearch.baseUrl` необязателен и
предназначен для операторских прокси-серверов или совместимых конечных точек Gemini API; если он не задан,
веб-поиск Gemini повторно использует `models.providers.google.baseUrl`. Поведение инструмента, специфичное для провайдера, описано в разделе
[Поиск Gemini](/ru/tools/gemini-search).

<Tip>
Модели Gemini 3 используют `thinkingLevel` вместо `thinkingBudget`. OpenClaw сопоставляет
элементы управления рассуждением для Gemini 3, Gemini 3.1 и псевдонима `gemini-*-latest` с
`thinkingLevel`, чтобы при выполнении с настройками по умолчанию или низкой задержкой не отправлялись отключённые
значения `thinkingBudget`.

`/think adaptive` сохраняет динамическую семантику мышления Google вместо выбора
фиксированного уровня OpenClaw. Для Gemini 3 и Gemini 3.1 фиксированный `thinkingLevel` не передаётся, чтобы
Google мог выбрать уровень; для Gemini 2.5 передаётся динамическое сигнальное значение Google
`thinkingBudget: -1`.

Модели Gemma 4 (например, `gemma-4-26b-a4b-it`) поддерживают режим мышления. OpenClaw
заменяет `thinkingBudget` на поддерживаемое Google значение `thinkingLevel` для Gemma 4.
Если для мышления задано `off`, оно остаётся отключённым и не сопоставляется с
`MINIMAL`.

Gemini 2.5 Pro работает только в режиме мышления и отклоняет явно заданное
`thinkingBudget: 0`; OpenClaw удаляет это значение из запросов Gemini 2.5 Pro,
а не отправляет его.
</Tip>

## Генерация изображений

Встроенный провайдер генерации изображений `google` по умолчанию использует
`google/gemini-3.1-flash-image-preview`.

- Также поддерживается `google/gemini-3-pro-image-preview`
- Генерация: до 4 изображений на запрос
- Режим редактирования: включён, до 5 входных изображений
- Управление геометрией: `size`, `aspectRatio` и `resolution`

Чтобы использовать Google как провайдер изображений по умолчанию:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация изображений](/ru/tools/image-generation).
</Note>

## Генерация видео

Встроенный плагин `google` также регистрирует генерацию видео через общий
инструмент `video_generate`.

- Модель видео по умолчанию: `google/veo-3.1-fast-generate-preview`
- Режимы: преобразование текста в видео, изображения в видео и процессы с одним эталонным видео
- Поддерживаются `aspectRatio` (`16:9`, `9:16`) и `resolution` (`720P`, `1080P`); вывод аудио сейчас не поддерживается Veo
- Поддерживаемая длительность: **4, 6 или 8 секунд** (другие значения округляются до ближайшего допустимого значения)

Чтобы использовать Google как провайдер видео по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
</Note>

## Генерация музыки

Встроенный плагин `google` также регистрирует генерацию музыки через общий
инструмент `music_generate`.

- Модель музыки по умолчанию: `google/lyria-3-clip-preview`
- Также поддерживается `google/lyria-3-pro-preview`
- Управление запросом: `lyrics` и `instrumental`
- Формат вывода: по умолчанию `mp3`, а также `wav` в `google/lyria-3-pro-preview`
- Эталонные входные данные: до 10 изображений
- Запуски с поддержкой сеанса отсоединяются через общий процесс задач и состояний, включая `action: "status"`

Чтобы использовать Google как провайдер музыки по умолчанию:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация музыки](/ru/tools/music-generation).
</Note>

## Преобразование текста в речь

Встроенный речевой провайдер `google` использует путь TTS Gemini API с
`gemini-3.1-flash-tts-preview`.

- Голос по умолчанию: `Kore`
- Аутентификация: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` или `GOOGLE_API_KEY`
- Вывод: WAV для обычных вложений TTS, Opus для голосовых сообщений, PCM для Talk/телефонии
- Вывод голосовых сообщений: PCM от Google упаковывается в WAV и перекодируется в Opus с частотой 48 кГц с помощью `ffmpeg`

Пакетный путь Gemini TTS от Google возвращает сгенерированное аудио в завершённом
ответе `generateContent`. Для голосовых разговоров с минимальной задержкой используйте
провайдер голоса Google в реальном времени на основе Gemini Live API вместо пакетного
TTS.

Чтобы использовать Google как провайдер TTS по умолчанию:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS использует запросы на естественном языке для управления стилем. Задайте
`audioProfile`, чтобы добавлять многократно используемый запрос стиля перед озвучиваемым текстом. Задайте
`speakerName`, если текст запроса ссылается на именованного говорящего.

Gemini API TTS также принимает в тексте выразительные аудиотеги в квадратных скобках,
например `[whispers]` или `[laughs]`. Чтобы теги не отображались в видимом ответе чата,
но передавались в TTS, поместите их в блок `[[tts:text]]...[[/tts:text]]`:

```text
Вот чистый текст ответа.

[[tts:text]][whispers] Вот озвучиваемая версия.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, доступ которого ограничен Gemini API, действителен для этого
провайдера. Это не отдельный путь Cloud Text-to-Speech API.
</Note>

## Голосовая связь в реальном времени

Встроенный плагин `google` регистрирует провайдер голоса в реальном времени на основе
Gemini Live API для серверных аудиомостов, таких как Voice Call и Google Meet.

| Настройка                     | Путь конфигурации                                                   | Значение по умолчанию                                                                  |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Модель                        | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Голос                         | `...google.voice`                                                   | `Kore`                                                                                |
| Температура                   | `...google.temperature`                                             | (не задано)                                                                            |
| Чувствительность начала VAD   | `...google.startSensitivity`                                        | (не задано)                                                                            |
| Чувствительность окончания VAD | `...google.endSensitivity`                                          | (не задано)                                                                            |
| Длительность тишины           | `...google.silenceDurationMs`                                       | (не задано)                                                                            |
| Обработка активности          | `...google.activityHandling`                                        | Значение Google по умолчанию, `start-of-activity-interrupts`                                        |
| Охват реплики                 | `...google.turnCoverage`                                            | Значение Google по умолчанию, `audio-activity-and-all-video`                                        |
| Отключение автоматического VAD | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Возобновление сеанса          | `...google.sessionResumption`                                       | `true`                                                                                |
| Сжатие контекста              | `...google.contextWindowCompression`                                | `true`                                                                                |
| Ключ API                      | `...google.apiKey`                                                  | В противном случае используются `models.providers.google.apiKey`, `GEMINI_API_KEY` или `GOOGLE_API_KEY` |

Пример конфигурации Voice Call для работы в реальном времени:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
Google Live API использует двунаправленную передачу аудио и вызов функций через WebSocket.
OpenClaw адаптирует аудио из телефонии или моста Meet для потока PCM Live API Gemini и
обрабатывает вызовы инструментов через общий контракт голосового взаимодействия в реальном времени. Не задавайте `temperature`,
если не требуется изменить параметры сэмплирования; OpenClaw не передаёт неположительные значения,
поскольку Google Live может возвращать расшифровки без аудио при `temperature: 0`.
Транскрибирование Gemini API включается без `languageCodes`; текущий SDK Google
отклоняет подсказки с кодом языка в этом пути API.
</Note>

<Note>
Gemini 3.1 Live принимает разговорный текст через ввод в реальном времени и использует
последовательный вызов функций. Для этой модели OpenClaw не передаёт устаревшие поля `NON_BLOCKING`,
планирования ответов функций и эмоционального диалога. Рекомендуется использовать
`thinkingLevel`; заданные положительные значения `thinkingBudget` сопоставляются с
ближайшим поддерживаемым уровнем, а `-1` сохраняет значение Google по умолчанию. См.
[сравнение возможностей Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk в Control UI поддерживает браузерные сеансы Google Live с ограниченными одноразовыми
токенами. Серверные провайдеры голосового взаимодействия в реальном времени также могут работать через универсальный
ретрансляционный транспорт Gateway, который хранит учётные данные провайдера на Gateway.
</Note>

Для выполняемой сопровождающими проверки в реальном времени запустите
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Эта быстрая проверка также охватывает серверные пути OpenAI и WebRTC; на этапе Google создаётся токен
ограниченного Live API той же структуры, которую использует Talk в Control UI, открывается браузерная
конечная точка WebSocket, отправляется начальная полезная нагрузка настройки и ожидается
`setupComplete`.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Прямое повторное использование кеша Gemini">
    Для прямых запусков Gemini API (`api: "google-generative-ai"`) OpenClaw
    передаёт настроенный дескриптор `cachedContent` в запросы Gemini.

    - Настройте параметры для отдельной модели или глобально с помощью
      `cachedContent` либо устаревшего `cached_content`
    - Параметры из более конкретной области действия (уровень модели вместо глобального) всегда имеют приоритет.
      Если в одной области действия заданы оба ключа, приоритет имеет `cached_content`.
      Чтобы избежать неожиданного поведения, используйте только один ключ в каждой области действия.
    - Пример значения: `cachedContents/prebuilt-context`
    - Использование при попадании в кеш Gemini нормализуется в `cacheRead` OpenClaw из
      вышестоящего `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Примечания по использованию Gemini CLI">
    При использовании OAuth-провайдера `google-gemini-cli` OpenClaw по умолчанию использует
    вывод `stream-json` Gemini CLI и нормализует данные об использовании из итоговой
    полезной нагрузки `stats`. Устаревшие переопределения `--output-format json` по-прежнему используют
    анализатор JSON.

    - Текст потокового ответа поступает из событий помощника `message`.
    - Для устаревшего вывода JSON текст ответа берётся из поля `response` JSON-вывода CLI.
    - Если CLI оставляет `usage` пустым, данные об использовании берутся из `stats`.
    - `stats.cached` нормализуется в `cacheRead` OpenClaw.
    - Если `stats.input` отсутствует, OpenClaw вычисляет количество входных токенов из
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Настройка окружения и демона">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `GEMINI_API_KEY`
    доступен этому процессу (например, в `~/.openclaw/.env` или через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента генерации изображений и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента генерации видео и выбор провайдера.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Общие параметры инструмента генерации музыки и выбор провайдера.
  </Card>
</CardGroup>
