---
read_when:
    - Вы хотите использовать модели MiniMax в OpenClaw
    - Вам нужны инструкции по настройке MiniMax
summary: Используйте модели MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-28T23:37:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw по умолчанию использует **MiniMax M3** для провайдера MiniMax.

MiniMax также предоставляет:

- Встроенный синтез речи через T2A v2
- Встроенное понимание изображений через `MiniMax-VL-01`
- Встроенную генерацию музыки через `music-2.6`
- Встроенный `web_search` через поисковый API MiniMax Token Plan

Разделение провайдеров:

| ID провайдера   | Аутентификация | Возможности                                                                                         |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API-ключ | Текст, генерация изображений, генерация музыки, генерация видео, понимание изображений, речь, веб-поиск |
| `minimax-portal` | OAuth   | Текст, генерация изображений, генерация музыки, генерация видео, понимание изображений, речь        |

## Встроенный каталог

| Модель                   | Тип              | Описание                                 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Чат (reasoning)  | Стандартная размещенная модель reasoning |
| `MiniMax-M2.7`           | Чат (reasoning)  | Предыдущая размещенная модель reasoning  |
| `MiniMax-M2.7-highspeed` | Чат (reasoning)  | Более быстрый уровень reasoning M2.7     |
| `MiniMax-VL-01`          | Vision           | Модель понимания изображений             |
| `image-01`               | Генерация изображений | Редактирование text-to-image и image-to-image |
| `music-2.6`              | Генерация музыки | Стандартная модель для музыки            |
| `music-2.5`              | Генерация музыки | Предыдущий уровень генерации музыки      |
| `music-2.0`              | Генерация музыки | Устаревший уровень генерации музыки      |
| `MiniMax-Hailuo-2.3`     | Генерация видео  | Потоки text-to-video и ссылок на изображения |

## Начало работы

Выберите предпочитаемый способ аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Лучше всего подходит для:** быстрой настройки MiniMax Coding Plan через OAuth; API-ключ не требуется.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Это выполняет аутентификацию через `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Это выполняет аутентификацию через `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Настройки OAuth используют id провайдера `minimax-portal`. Ссылки на модели имеют форму `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Реферальная ссылка для MiniMax Coding Plan (скидка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Лучше всего подходит для:** размещенного MiniMax с API, совместимым с Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Это настраивает `api.minimax.io` как базовый URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Это настраивает `api.minimaxi.com` как базовый URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Пример конфигурации

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    На потоковом пути, совместимом с Anthropic, OpenClaw по умолчанию отключает thinking MiniMax M2.x, если вы явно не зададите `thinking` самостоятельно. Потоковая конечная точка M2.x выдает `reasoning_content` в delta-фрагментах в стиле OpenAI вместо нативных блоков thinking Anthropic, что может привести к утечке внутреннего reasoning в видимый вывод, если оставить это неявно включенным. MiniMax-M3 (и совместимые вперед M3.x) освобождены от этого значения по умолчанию: M3 выдает корректные блоки thinking Anthropic и требует активного thinking для создания видимого содержимого, поэтому OpenClaw оставляет M3 на пути omitted/adaptive thinking провайдера.
    </Warning>

    <Note>
    Настройки с API-ключом используют id провайдера `minimax`. Ссылки на модели имеют форму `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Настройка через `openclaw configure`

Используйте интерактивный мастер конфигурации, чтобы настроить MiniMax без редактирования JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Выберите **Model/auth** в меню.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Выберите один из доступных вариантов MiniMax:

    | Вариант аутентификации | Описание |
    | --- | --- |
    | `minimax-global-oauth` | Международный OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Китайский OAuth (Coding Plan) |
    | `minimax-global-api` | Международный API-ключ |
    | `minimax-cn-api` | Китайский API-ключ |

  </Step>
  <Step title="Pick your default model">
    Выберите модель по умолчанию при появлении запроса.
  </Step>
</Steps>

## Возможности

### Генерация изображений

Plugin MiniMax регистрирует модель `image-01` для инструмента `image_generate`. Она поддерживает:

- **Генерацию text-to-image** с управлением соотношением сторон
- **Редактирование image-to-image** (ссылка на объект) с управлением соотношением сторон
- До **9 выходных изображений** на запрос
- До **1 референсного изображения** на запрос редактирования
- Поддерживаемые соотношения сторон: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Чтобы использовать MiniMax для генерации изображений, задайте его как провайдера генерации изображений:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin использует тот же `MINIMAX_API_KEY` или OAuth-аутентификацию, что и текстовые модели. Если MiniMax уже настроен, дополнительная конфигурация не нужна.

И `minimax`, и `minimax-portal` регистрируют `image_generate` с одной и той же
моделью `image-01`. Настройки с API-ключом используют `MINIMAX_API_KEY`; настройки OAuth могут вместо этого использовать
встроенный путь аутентификации `minimax-portal`.

Генерация изображений всегда использует выделенную конечную точку MiniMax для изображений
(`/v1/image_generation`) и игнорирует `models.providers.minimax.baseUrl`,
поскольку это поле настраивает базовый URL для чата/совместимости с Anthropic. Задайте
`MINIMAX_API_HOST=https://api.minimaxi.com`, чтобы направлять генерацию изображений
через конечную точку CN; глобальная конечная точка по умолчанию:
`https://api.minimax.io`.

Когда onboarding или настройка API-ключа записывает явные записи `models.providers.minimax`,
OpenClaw материализует `MiniMax-M3`, `MiniMax-M2.7` и
`MiniMax-M2.7-highspeed` как чат-модели. M3 объявляет поддержку текстового и графического ввода;
понимание изображений остается отдельно доступным через принадлежащего Plugin
медиапровайдера `MiniMax-VL-01`.

<Note>
См. [Генерация изображений](/ru/tools/image-generation) для общих параметров инструмента, выбора провайдера и поведения failover.
</Note>

### Text-to-speech

Встроенный Plugin `minimax` регистрирует MiniMax T2A v2 как провайдера речи для
`messages.tts`.

- Модель TTS по умолчанию: `speech-2.8-hd`
- Голос по умолчанию: `English_expressive_narrator`
- Поддерживаемые встроенные id моделей включают `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` и `speech-01-turbo`.
- Разрешение аутентификации: сначала `messages.tts.providers.minimax.apiKey`, затем
  профили OAuth/токен-аутентификации `minimax-portal`, затем ключи среды Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), затем `MINIMAX_API_KEY`.
- Если хост TTS не настроен, OpenClaw повторно использует настроенный
  OAuth-хост `minimax-portal` и удаляет суффиксы пути, совместимые с Anthropic,
  такие как `/anthropic`.
- Обычные аудиовложения остаются в MP3.
- Целевые voice-note, такие как Feishu и Telegram, транскодируются из MP3 MiniMax
  в Opus 48 кГц с помощью `ffmpeg`, потому что файловый API Feishu/Lark принимает только
  `file_type: "opus"` для нативных аудиосообщений.
- MiniMax T2A принимает дробные `speed` и `vol`, но `pitch` отправляется как
  целое число; OpenClaw отбрасывает дробную часть значений `pitch` перед API-запросом.

| Настройка                                       | Переменная среды       | По умолчанию                | Описание                         |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | id модели TTS.                   |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | id голоса, используемый для речевого вывода. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Скорость воспроизведения, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Громкость, `(0, 10]`.            |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Целочисленный сдвиг высоты тона, `-12..12`. |

### Генерация музыки

Встроенный Plugin MiniMax регистрирует генерацию музыки через общий
инструмент `music_generate` как для `minimax`, так и для `minimax-portal`.

- Модель музыки по умолчанию: `minimax/music-2.6`
- Музыкальная модель OAuth: `minimax-portal/music-2.6`
- Также поддерживает `minimax/music-2.5` и `minimax/music-2.0`
- Параметры prompt: `lyrics`, `instrumental`
- Формат вывода: `mp3`
- Запуски с поддержкой сессий отсоединяются через общий поток задач/статусов, включая `action: "status"`

Чтобы использовать MiniMax как поставщика музыки по умолчанию:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
См. [генерацию музыки](/ru/tools/music-generation) для общих параметров инструмента, выбора поставщика и поведения при failover.
</Note>

### Генерация видео

Встроенный Plugin MiniMax регистрирует генерацию видео через общий
инструмент `video_generate` как для `minimax`, так и для `minimax-portal`.

- Модель видео по умолчанию: `minimax/MiniMax-Hailuo-2.3`
- Видеомодель OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Режимы: преобразование текста в видео и потоки с одной эталонной картинкой
- Поддерживает `aspectRatio` и `resolution`

Чтобы использовать MiniMax как поставщика видео по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
См. [генерацию видео](/ru/tools/video-generation) для общих параметров инструмента, выбора поставщика и поведения при failover.
</Note>

### Понимание изображений

Plugin MiniMax регистрирует понимание изображений отдельно от текстового
каталога:

| ID поставщика    | Модель изображений по умолчанию |
| ---------------- | ------------------------------- |
| `minimax`        | `MiniMax-VL-01`                 |
| `minimax-portal` | `MiniMax-VL-01`                 |

Поэтому автоматическая маршрутизация медиа может использовать понимание изображений MiniMax,
даже когда встроенный каталог текстовых поставщиков также включает chat refs M3 с поддержкой изображений.

### Веб-поиск

Plugin MiniMax также регистрирует `web_search` через поисковый API MiniMax Token Plan.

- ID поставщика: `minimax`
- Структурированные результаты: заголовки, URL, фрагменты, связанные запросы
- Предпочтительная переменная окружения: `MINIMAX_CODE_PLAN_KEY`
- Допустимые псевдонимы переменных окружения: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервная совместимость: `MINIMAX_API_KEY`, когда она уже указывает на учетные данные token-plan
- Повторное использование региона: `plugins.entries.minimax.config.webSearch.region`, затем `MINIMAX_API_HOST`, затем базовые URL поставщика MiniMax
- Поиск остается на ID поставщика `minimax`; настройка OAuth для CN/global может косвенно направлять регион через `models.providers.minimax-portal.baseUrl` и предоставлять bearer-аутентификацию через `MINIMAX_OAUTH_TOKEN`

Конфигурация находится в `plugins.entries.minimax.config.webSearch.*`.

<Note>
См. [поиск MiniMax](/ru/tools/minimax-search) для полной конфигурации и использования веб-поиска.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Параметры конфигурации">
    | Параметр | Описание |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Предпочитайте `https://api.minimax.io/anthropic` (совместимо с Anthropic); `https://api.minimax.io/v1` необязательно для payload, совместимых с OpenAI |
    | `models.providers.minimax.api` | Предпочитайте `anthropic-messages`; `openai-completions` необязательно для payload, совместимых с OpenAI |
    | `models.providers.minimax.apiKey` | API-ключ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Определяет `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Назначает псевдонимы моделям, которые вы хотите включить в allowlist |
    | `models.mode` | Оставьте `merge`, если хотите добавить MiniMax вместе со встроенными моделями |
  </Accordion>

  <Accordion title="Значения thinking по умолчанию">
    При `api: "anthropic-messages"` OpenClaw добавляет `thinking: { type: "disabled" }` для моделей MiniMax M2.x, если thinking уже не задан явно в params/config.

    Это предотвращает выдачу `reasoning_content` потоковой конечной точкой M2.x в delta-чанках в стиле OpenAI, что привело бы к утечке внутреннего reasoning в видимый вывод.

    MiniMax-M3 (и M3.x) исключен: M3 выводит корректные блоки thinking Anthropic и возвращает пустой массив `content` с `stop_reason: "end_turn"`, когда thinking отключен, поэтому wrapper оставляет M3 на пропущенном/адаптивном пути thinking поставщика.

  </Accordion>

  <Accordion title="Быстрый режим">
    `/fast on` или `params.fastMode: true` переписывает `MiniMax-M2.7` в `MiniMax-M2.7-highspeed` на потоковом пути, совместимом с Anthropic.
  </Accordion>

  <Accordion title="Пример fallback">
    **Лучше всего для:** держать самую сильную модель последнего поколения основной, с переключением на MiniMax M2.7 при сбое. Пример ниже использует Opus как конкретную основную модель; замените ее на предпочитаемую основную модель последнего поколения.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Сведения об использовании Coding Plan">
    - API использования Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` или `https://api.minimax.io/v1/token_plan/remains` (требуется ключ coding plan).
    - Опрос использования выводит host из `models.providers.minimax-portal.baseUrl` или `models.providers.minimax.baseUrl`, если они настроены, поэтому глобальные настройки с `https://api.minimax.io/anthropic` опрашивают `api.minimax.io`. Отсутствующие или некорректные базовые URL сохраняют fallback CN для совместимости.
    - OpenClaw нормализует использование MiniMax coding-plan к тому же отображению `% left`, которое используется другими поставщиками. Сырые поля MiniMax `usage_percent` / `usagePercent` означают оставшуюся квоту, а не израсходованную, поэтому OpenClaw инвертирует их. Поля на основе счетчиков имеют приоритет, когда присутствуют.
    - Когда API возвращает `model_remains`, OpenClaw предпочитает запись chat-модели, при необходимости выводит метку окна из `start_time` / `end_time` и включает имя выбранной модели в метку плана, чтобы окна coding-plan было проще различать.
    - Снимки использования рассматривают `minimax`, `minimax-cn` и `minimax-portal` как одну и ту же квотную поверхность MiniMax и предпочитают сохраненный OAuth MiniMax перед fallback к переменным окружения ключа Coding Plan.

  </Accordion>
</AccordionGroup>

## Примечания

- Model refs следуют пути аутентификации:
  - Настройка API-ключа: `minimax/<model>`
  - Настройка OAuth: `minimax-portal/<model>`
- Chat-модель по умолчанию: `MiniMax-M3`
- Альтернативные chat-модели: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Онбординг и прямая настройка API-ключа записывают определения моделей для M3 и обоих вариантов M2.7
- Понимание изображений использует принадлежащий Plugin медиапоставщик `MiniMax-VL-01`
- Обновите значения цен в `models.json`, если вам нужен точный учет стоимости
- Используйте `openclaw models list`, чтобы подтвердить текущий ID поставщика, затем переключитесь с помощью `openclaw models set minimax/MiniMax-M3` или `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Реферальная ссылка для MiniMax Coding Plan (скидка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
См. [поставщиков моделей](/ru/concepts/model-providers) для правил поставщиков.
</Note>

## Устранение неполадок

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Обычно это означает, что **поставщик MiniMax не настроен** (нет подходящей записи поставщика и не найден профиль аутентификации MiniMax/ключ окружения). Исправление этого обнаружения есть в **2026.1.12**. Исправьте так:

    - Обновитесь до **2026.1.12** (или запустите из исходного кода `main`), затем перезапустите gateway.
    - Запустите `openclaw configure` и выберите вариант аутентификации **MiniMax**, или
    - Добавьте соответствующий блок `models.providers.minimax` или `models.providers.minimax-portal` вручную, или
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` или профиль аутентификации MiniMax, чтобы можно было внедрить соответствующего поставщика.

    Убедитесь, что ID модели **чувствителен к регистру**:

    - Путь API-ключа: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` или `minimax/MiniMax-M2.7-highspeed`
    - Путь OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` или `minimax-portal/MiniMax-M2.7-highspeed`

    Затем повторно проверьте с помощью:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Note>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, model refs и поведения при failover.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента изображений и выбор поставщика.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Общие параметры музыкального инструмента и выбор поставщика.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры видеоинструмента и выбор поставщика.
  </Card>
  <Card title="Поиск MiniMax" href="/ru/tools/minimax-search" icon="magnifying-glass">
    Конфигурация веб-поиска через MiniMax Token Plan.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общее устранение неполадок и FAQ.
  </Card>
</CardGroup>
