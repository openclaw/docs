---
read_when:
    - Вы хотите использовать модели MiniMax в OpenClaw
    - Вам нужны инструкции по настройке MiniMax
summary: Использование моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T11:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Встроенный Plugin `minimax` регистрирует двух поставщиков и семь возможностей: чат, генерацию изображений, генерацию музыки, генерацию видео, распознавание изображений, речь (T2A v2) и веб-поиск.

  | Идентификатор поставщика | Аутентификация | Возможности                                                                                                   |
  | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------- |
  | `minimax`                | Ключ API        | Текст, генерация изображений, генерация музыки, генерация видео, распознавание изображений, речь, веб-поиск |
  | `minimax-portal`         | OAuth           | Текст, генерация изображений, генерация музыки, генерация видео, распознавание изображений, речь            |

  <Tip>
  Реферальная ссылка на MiniMax Coding Plan (скидка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Встроенный каталог

  | Модель                   | Тип                    | Описание                                              |
  | ------------------------ | ---------------------- | ----------------------------------------------------- |
  | `MiniMax-M3`             | Чат (рассуждение)      | Размещённая модель рассуждений по умолчанию           |
  | `MiniMax-M2.7`           | Чат (рассуждение)      | Предыдущая размещённая модель рассуждений             |
  | `MiniMax-M2.7-highspeed` | Чат (рассуждение)      | Более быстрый уровень рассуждений M2.7                |
  | `MiniMax-VL-01`          | Компьютерное зрение    | Модель распознавания изображений                      |
  | `image-01`               | Генерация изображений  | Создание изображений по тексту и редактирование изображений |
  | `music-2.6`              | Генерация музыки       | Модель для музыки по умолчанию                        |
  | `MiniMax-Hailuo-2.3`     | Генерация видео        | Создание видео по тексту и изображению                |

  Ссылки на модели зависят от способа аутентификации: `minimax/<model>` для конфигураций с ключом API и `minimax-portal/<model>` для конфигураций с OAuth.

  ## Начало работы

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Лучше всего подходит для:** быстрой настройки MiniMax Coding Plan через OAuth без ключа API.

    <Tabs>
      <Tab title="Международная версия">
        <Steps>
          <Step title="Запустите первоначальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Итоговый базовый URL поставщика: `api.minimax.io`.
          </Step>
          <Step title="Убедитесь, что модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустите первоначальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Итоговый базовый URL поставщика: `api.minimaxi.com`.
          </Step>
          <Step title="Убедитесь, что модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Конфигурации OAuth используют идентификатор поставщика `minimax-portal`. Ссылки на модели имеют вид `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Ключ API">
    **Лучше всего подходит для:** размещённой версии MiniMax с API, совместимым с Anthropic.

    <Tabs>
      <Tab title="Международная версия">
        <Steps>
          <Step title="Запустите первоначальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Эта команда настраивает `api.minimax.io` в качестве базового URL.
          </Step>
          <Step title="Убедитесь, что модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустите первоначальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Эта команда настраивает `api.minimaxi.com` в качестве базового URL.
          </Step>
          <Step title="Убедитесь, что модель доступна">
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
    Совместимая с Anthropic потоковая конечная точка MiniMax-M2.x передаёт `reasoning_content` фрагментами изменений в стиле OpenAI вместо нативных блоков рассуждений Anthropic. Если режим рассуждений неявно оставлен включённым, это приводит к выводу внутренних рассуждений в видимом ответе. OpenClaw по умолчанию отключает рассуждения для M2.x, если вы явно не задали `thinking` самостоятельно. Для MiniMax-M3 и совместимых с будущими версиями моделей M3.x действует исключение: M3 передаёт корректные блоки рассуждений Anthropic и требует активного режима рассуждений для создания видимого содержимого, поэтому OpenClaw сохраняет для M3 адаптивный режим рассуждений поставщика. См. раздел «Настройки рассуждений по умолчанию» в подразделе «Расширенная конфигурация» ниже.
    </Warning>

    <Note>
    Конфигурации с ключом API используют идентификатор поставщика `minimax`. Ссылки на модели имеют вид `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Настройка через `openclaw configure`

<Steps>
  <Step title="Запустите мастер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Выберите модель и способ аутентификации">
    Выберите **Модель и аутентификация** в меню.
  </Step>
  <Step title="Выберите вариант аутентификации MiniMax">
    | Вариант аутентификации | Описание                               |
    | ----------------------- | -------------------------------------- |
    | `minimax-global-oauth` | Международный OAuth (тариф Coding Plan) |
    | `minimax-cn-oauth`     | OAuth для Китая (тариф Coding Plan)     |
    | `minimax-global-api`   | Международный ключ API                  |
    | `minimax-cn-api`       | Ключ API для Китая                      |
  </Step>
  <Step title="Выберите модель по умолчанию">
    При появлении запроса выберите модель по умолчанию.
  </Step>
</Steps>

## Возможности

### Генерация изображений

Plugin MiniMax регистрирует модель `image-01` для инструмента `image_generate` как в `minimax`, так и в `minimax-portal`, используя те же `MINIMAX_API_KEY` или аутентификацию OAuth, что и текстовые модели.

- Генерация изображений по тексту и редактирование изображения по изображению (с эталонным объектом), в обоих случаях с управлением соотношением сторон
- До 9 выходных изображений на запрос и 1 эталонное изображение на запрос редактирования
- Поддерживаемые соотношения сторон: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Для генерации изображений всегда используется выделенная конечная точка MiniMax (`/v1/image_generation`), а `models.providers.minimax.baseUrl` игнорируется, поскольку это поле настраивает базовый URL для чата, совместимый с Anthropic. Чтобы направлять генерацию изображений через конечную точку для Китая, задайте `MINIMAX_API_HOST=https://api.minimaxi.com`; глобальная конечная точка по умолчанию — `https://api.minimax.io`.

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация изображений](/ru/tools/image-generation).
</Note>

### Преобразование текста в речь

Встроенный Plugin `minimax` регистрирует MiniMax T2A v2 как провайдер синтеза речи для `messages.tts`.

- Модель TTS по умолчанию: `speech-2.8-hd`
- Голос по умолчанию: `English_expressive_narrator`
- Идентификаторы встроенных моделей: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Порядок определения аутентификационных данных: `messages.tts.providers.minimax.apiKey`, затем профили аутентификации OAuth/токенов `minimax-portal`, затем переменные окружения Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), затем `MINIMAX_API_KEY`
- Если хост TTS не настроен, OpenClaw повторно использует настроенный хост OAuth `minimax-portal` и удаляет суффиксы пути для совместимости с Anthropic, например `/anthropic`
- Обычные аудиовложения остаются в формате MP3. Для целевых платформ голосовых сообщений (Feishu, Telegram и других каналов, запрашивающих вложение, совместимое с голосовыми сообщениями) MP3 от MiniMax перекодируется с помощью `ffmpeg` в Opus с частотой 48 кГц, поскольку, например, API файлов Feishu/Lark принимает для нативных аудиосообщений только `file_type: "opus"`
- MiniMax T2A принимает дробные значения `speed` и `vol`, но `pitch` передаётся как целое число; OpenClaw отбрасывает дробную часть значения `pitch` перед запросом к API

| Настройка                                | Переменная окружения   | Значение по умолчанию         | Описание                                           |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.                              |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Идентификатор модели TTS.                          |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Идентификатор голоса для синтеза речи.             |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Скорость воспроизведения, `0.5..2.0`.              |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Громкость, `(0, 10]`.                              |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Целочисленное изменение высоты тона, `-12..12`.    |

### Генерация музыки

Встроенный Plugin MiniMax регистрирует генерацию музыки через общий инструмент `music_generate` как для `minimax`, так и для `minimax-portal`.

- Модель генерации музыки по умолчанию: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Также поддерживаются `music-2.6-free`, `music-cover` и `music-cover-free`
- Параметры промпта: `lyrics`, `instrumental`
- Формат вывода: `mp3`
- Запуски, связанные с сеансом, отсоединяются через общий поток задач и состояний, включая `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация музыки](/ru/tools/music-generation).
</Note>

### Генерация видео

Встроенный Plugin MiniMax регистрирует генерацию видео через общий инструмент `video_generate` как для `minimax`, так и для `minimax-portal`.

- Модель генерации видео по умолчанию: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Также поддерживаются `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` и `I2V-01`
- Режимы: преобразование текста в видео и обработка с одним эталонным изображением
- Поддерживается `resolution` (`768P` или `1080P` в моделях Hailuo 2.3/02); `aspectRatio` не поддерживается и игнорируется

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
См. раздел [Генерация видео](/ru/tools/video-generation), где описаны общие параметры инструмента, выбор провайдера и поведение при переключении на резервный вариант.
</Note>

### Распознавание изображений

Plugin MiniMax регистрирует распознавание изображений отдельно от каталога текстовых моделей:

| Идентификатор провайдера | Модель изображений по умолчанию | Извлечение текста из PDF |
| ------------------------ | ------------------------------- | ------------------------ |
| `minimax`                | `MiniMax-VL-01`                 | `MiniMax-M2.7`           |
| `minimax-portal`         | `MiniMax-VL-01`                 | `MiniMax-M2.7`           |

Поэтому автоматическая маршрутизация медиафайлов может использовать распознавание изображений MiniMax, даже если встроенный каталог текстового провайдера также содержит ссылки на поддерживающие изображения чат-модели M3. Для распознавания PDF модель `MiniMax-M2.7` используется только для извлечения текста; MiniMax не регистрирует путь преобразования PDF в изображения.

### Веб-поиск

Plugin MiniMax также регистрирует `web_search` через API поиска MiniMax Token Plan (`/v1/coding_plan/search`).

- Идентификатор провайдера: `minimax`
- Структурированные результаты: заголовки, URL-адреса, фрагменты текста, связанные запросы
- Предпочтительная переменная окружения: `MINIMAX_CODE_PLAN_KEY`
- Допустимые псевдонимы переменной окружения: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервный вариант для совместимости: `MINIMAX_API_KEY`, если она уже указывает на учетные данные тарифного плана с токенами
- Повторное использование региона: `plugins.entries.minimax.config.webSearch.region`, затем `MINIMAX_API_HOST`, затем базовые URL-адреса провайдера MiniMax
- Поиск остается привязанным к идентификатору провайдера `minimax`; настройка OAuth для Китая или глобального региона может косвенно выбирать регион через `models.providers.minimax-portal.baseUrl` и предоставлять Bearer-аутентификацию через `MINIMAX_OAUTH_TOKEN`

Конфигурация находится в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Полную конфигурацию и инструкции по использованию веб-поиска см. в разделе [Поиск MiniMax](/ru/tools/minimax-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Параметры конфигурации">
    | Параметр | Описание |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Предпочтительно использовать `https://api.minimax.io/anthropic` (совместимый с Anthropic); `https://api.minimax.io/v1` можно использовать для полезных нагрузок, совместимых с OpenAI |
    | `models.providers.minimax.api` | Предпочтительно использовать `anthropic-messages`; `openai-completions` можно использовать для полезных нагрузок, совместимых с OpenAI |
    | `models.providers.minimax.apiKey` | Ключ API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Определяет `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдонимы моделей, которые нужно включить в список разрешенных |
    | `models.mode` | Сохраните значение `merge`, если хотите добавить MiniMax вместе со встроенными моделями |
  </Accordion>

  <Accordion title="Настройки рассуждений по умолчанию">
    При `api: "anthropic-messages"` OpenClaw добавляет `thinking: { type: "disabled" }` для моделей MiniMax M2.x, если более ранняя обертка еще не задала поле `thinking` в полезной нагрузке. Это не позволяет потоковой конечной точке M2.x выдавать `reasoning_content` во фрагментах изменений в стиле OpenAI, что могло бы раскрыть внутренние рассуждения в видимом выводе.

    MiniMax-M3 (и M3.x) является исключением: когда рассуждения отключены, M3 возвращает пустой массив `content` с `stop_reason: "end_turn"`, поэтому OpenClaw удаляет неявную настройку отключения по умолчанию для M3 и при заданном уровне рассуждений вместо этого принудительно устанавливает `thinking: { type: "adaptive" }`.

    Доступные уровни рассуждений для каждого семейства моделей:

    | Семейство моделей | Уровни                                    | По умолчанию |
    | ----------------- | ----------------------------------------- | ------------ |
    | `MiniMax-M3`      | `off`, `adaptive`                         | `adaptive`   |
    | `MiniMax-M2.x`    | `off`, `minimal`, `low`, `medium`, `high` | `off`        |

  </Accordion>

  <Accordion title="Быстрый режим">
    `/fast on` или `params.fastMode: true` заменяет `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` в потоковом пути, совместимом с Anthropic (`api: "anthropic-messages"`, провайдер `minimax` или `minimax-portal`).
  </Accordion>

  <Accordion title="Пример резервной модели">
    **Лучше всего подходит для следующего:** использовать наиболее мощную модель последнего поколения как основную и переключаться на MiniMax M2.7 при сбое. В примере ниже Opus используется как конкретная основная модель; замените ее предпочитаемой основной моделью последнего поколения.

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
    - API использования Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` или `https://api.minimax.io/v1/token_plan/remains` (требуется ключ Coding Plan).
    - При настроенном параметре хост для опроса использования определяется из `models.providers.minimax-portal.baseUrl` или `models.providers.minimax.baseUrl`, поэтому глобальные конфигурации, использующие `https://api.minimax.io/anthropic`, опрашивают `api.minimax.io`. При отсутствующих или некорректных базовых URL-адресах для совместимости сохраняется резервный вариант для Китая.
    - OpenClaw нормализует сведения об использовании Coding Plan MiniMax в тот же формат отображения `% left`, который применяется другими провайдерами. Необработанные поля MiniMax `usage_percent` / `usagePercent` обозначают оставшуюся, а не израсходованную квоту, поэтому OpenClaw инвертирует их значения. При наличии приоритет имеют поля на основе количества.
    - Когда API возвращает `model_remains`, OpenClaw отдает предпочтение записи чат-модели, при необходимости формирует метку временного окна из `start_time` / `end_time` и включает имя выбранной модели в название плана, чтобы окна Coding Plan было проще различать.
    - Снимки использования считают `minimax`, `minimax-cn`, `minimax-portal` и `minimax-portal-cn` одной и той же квотой MiniMax и отдают предпочтение сохраненному OAuth MiniMax, прежде чем переходить к переменным окружения с ключами Coding Plan.

  </Accordion>
</AccordionGroup>

## Примечания

- Чат-модель по умолчанию: `MiniMax-M3`. Альтернативные чат-модели: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Первоначальная настройка и прямая настройка ключа API записывают определения моделей для M3 и обоих вариантов M2.7
- Для распознавания изображений используется медиа-провайдер `MiniMax-VL-01`, принадлежащий Plugin
- Если требуется точный учет стоимости, обновите значения цен в `models.json`
- Используйте `openclaw models list`, чтобы проверить текущий идентификатор провайдера, а затем переключитесь с помощью `openclaw models set minimax/MiniMax-M3` или `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Правила провайдеров см. в разделе [Провайдеры моделей](/ru/concepts/model-providers).
</Note>

## Устранение неполадок

<AccordionGroup>
  <Accordion title='"Неизвестная модель: minimax/MiniMax-M3"'>
    Обычно это означает, что **провайдер MiniMax не настроен** (не найдена соответствующая запись провайдера, профиль аутентификации MiniMax или ключ в переменной окружения). Способы исправления:

    - Запустите `openclaw configure` и выберите вариант аутентификации **MiniMax**, или
    - Добавьте соответствующий блок `models.providers.minimax` или `models.providers.minimax-portal` вручную, или
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` или профиль аутентификации MiniMax, чтобы можно было внедрить соответствующего провайдера.

    Учитывайте, что идентификатор модели **чувствителен к регистру**:

    - Путь с ключом API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` или `minimax/MiniMax-M2.7-highspeed`
    - Путь OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` или `minimax-portal/MiniMax-M2.7-highspeed`

    Затем повторно проверьте с помощью:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Note>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении на резервный вариант.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента для изображений и выбор провайдера.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Общие параметры инструмента для музыки и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента для видео и выбор провайдера.
  </Card>
  <Card title="Поиск MiniMax" href="/ru/tools/minimax-search" icon="magnifying-glass">
    Настройка веб-поиска через MiniMax Token Plan.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
