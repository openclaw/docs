---
read_when:
    - Вам нужны модели MiniMax в OpenClaw
    - Вам нужны инструкции по настройке MiniMax
summary: Использование моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-13T20:13:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

Встроенный плагин `minimax` регистрирует два провайдера и пять возможностей: чат, генерацию изображений, генерацию музыки, генерацию видео, распознавание изображений, речь (T2A v2) и веб-поиск.

| Идентификатор провайдера | Аутентификация | Возможности                                                                                          |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API-ключ | Текст, генерация изображений, генерация музыки, генерация видео, распознавание изображений, речь, веб-поиск |
| `minimax-portal` | OAuth   | Текст, генерация изображений, генерация музыки, генерация видео, распознавание изображений, речь             |

<Tip>
Реферальная ссылка на MiniMax Coding Plan (скидка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## Встроенный каталог

| Модель                    | Тип             | Описание                                 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Чат (рассуждение) | Стандартная размещённая модель рассуждений |
| `MiniMax-M2.7`           | Чат (рассуждение) | Предыдущая размещённая модель рассуждений |
| `MiniMax-M2.7-highspeed` | Чат (рассуждение) | Более быстрый уровень рассуждений M2.7   |
| `MiniMax-VL-01`          | Зрение           | Модель распознавания изображений         |
| `image-01`               | Генерация изображений | Преобразование текста в изображение и редактирование изображения по изображению |
| `music-2.6`              | Генерация музыки | Стандартная музыкальная модель           |
| `MiniMax-Hailuo-2.3`     | Генерация видео | Преобразование текста и изображения в видео |

Ссылки на модели соответствуют способу аутентификации: `minimax/<model>` для конфигураций с API-ключом, `minimax-portal/<model>` для конфигураций OAuth.

## Начало работы

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Лучше всего подходит для:** быстрой настройки MiniMax Coding Plan через OAuth без необходимости использовать API-ключ.

    <Tabs>
      <Tab title="Международный">
        <Steps>
          <Step title="Запустите начальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Итоговый базовый URL провайдера: `api.minimax.io`.
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
          <Step title="Запустите начальную настройку">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Итоговый базовый URL провайдера: `api.minimaxi.com`.
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
    Конфигурации OAuth используют идентификатор провайдера `minimax-portal`. Ссылки на модели имеют вид `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="API-ключ">
    **Лучше всего подходит для:** размещённого MiniMax с API, совместимым с Anthropic.

    <Tabs>
      <Tab title="Международный">
        <Steps>
          <Step title="Запустите начальную настройку">
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
          <Step title="Запустите начальную настройку">
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
    Совместимая с Anthropic потоковая конечная точка MiniMax-M2.x передаёт `reasoning_content` в блоках изменений в стиле OpenAI вместо собственных блоков рассуждений Anthropic, из-за чего внутренние рассуждения попадают в видимый вывод, если режим рассуждений неявно оставлен включённым. OpenClaw по умолчанию отключает рассуждения M2.x, если вы самостоятельно явно не зададите `thinking`. Для MiniMax-M3 (и совместимых с будущими версиями моделей M3.x) действует исключение: M3 передаёт корректные блоки рассуждений Anthropic, и для создания видимого содержимого режим рассуждений должен быть активен, поэтому OpenClaw оставляет M3 в адаптивном режиме рассуждений провайдера. См. раздел о стандартных настройках рассуждений в расширенной конфигурации ниже.
    </Warning>

    <Note>
    Конфигурации с API-ключом используют идентификатор провайдера `minimax`. Ссылки на модели имеют вид `minimax/MiniMax-M3`.
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
  <Step title="Выберите модель и аутентификацию">
    Выберите в меню **Модель и аутентификация**.
  </Step>
  <Step title="Выберите способ аутентификации MiniMax">
    | Вариант аутентификации | Описание                           |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | Международный OAuth (Coding Plan)  |
    | `minimax-cn-oauth`     | OAuth для Китая (Coding Plan)      |
    | `minimax-global-api`   | Международный API-ключ             |
    | `minimax-cn-api`       | API-ключ для Китая                 |
  </Step>
  <Step title="Выберите модель по умолчанию">
    При появлении запроса выберите модель по умолчанию.
  </Step>
</Steps>

## Возможности

### Генерация изображений

Плагин MiniMax регистрирует модель `image-01` для инструмента `image_generate` в обоих провайдерах, `minimax` и `minimax-portal`, повторно используя те же `MINIMAX_API_KEY` или аутентификацию OAuth, что и текстовые модели.

- Генерация изображения из текста и редактирование изображения по изображению (эталон объекта), в обоих случаях с управлением соотношением сторон
- До 9 выходных изображений на запрос, 1 эталонное изображение на запрос редактирования
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

Для генерации изображений всегда используется специализированная конечная точка MiniMax (`/v1/image_generation`), а `models.providers.minimax.baseUrl` игнорируется, поскольку это поле настраивает базовый URL чата, совместимый с Anthropic. Задайте `MINIMAX_API_HOST=https://api.minimaxi.com`, чтобы направлять генерацию изображений через конечную точку для Китая; стандартная глобальная конечная точка — `https://api.minimax.io`.

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация изображений](/ru/tools/image-generation).
</Note>

### Преобразование текста в речь

Встроенный плагин `minimax` регистрирует MiniMax T2A v2 в качестве провайдера речи для `messages.tts`.

- Стандартная модель TTS: `speech-2.8-hd`
- Стандартный голос: `English_expressive_narrator`
- Идентификаторы встроенных моделей: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Порядок определения аутентификации: `messages.tts.providers.minimax.apiKey`, затем профили аутентификации OAuth/токена `minimax-portal`, затем ключи среды Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), затем `MINIMAX_API_KEY`
- Если узел TTS не настроен, OpenClaw повторно использует настроенный узел OAuth `minimax-portal` и удаляет суффиксы пути, обеспечивающие совместимость с Anthropic, например `/anthropic`
- Обычные звуковые вложения сохраняются в формате MP3. Для целевых объектов голосовых сообщений (Feishu, Telegram и других каналов, запрашивающих вложение, совместимое с голосовыми сообщениями) MP3 от MiniMax перекодируется в Opus с частотой 48kHz с помощью `ffmpeg`, поскольку, например, API файлов Feishu/Lark принимает для собственных звуковых сообщений только `file_type: "opus"`
- MiniMax T2A принимает дробные значения `speed` и `vol`, но `pitch` отправляется как целое число; OpenClaw отбрасывает дробную часть значений `pitch` перед запросом к API

| Настройка                                | Переменная среды       | Значение по умолчанию         | Описание                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Узел API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Идентификатор модели TTS.        |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Идентификатор голоса для речевого вывода. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Скорость воспроизведения, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Громкость, `(0, 10]`.            |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Целочисленное изменение высоты тона, `-12..12`. |

### Генерация музыки

Встроенный плагин MiniMax регистрирует генерацию музыки через общий инструмент `music_generate` для обоих провайдеров, `minimax` и `minimax-portal`.

- Стандартная музыкальная модель: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Также поддерживаются `music-2.6-free`, `music-cover` и `music-cover-free`
- Параметры промпта: `lyrics`, `instrumental`
- Формат вывода: `mp3`
- Запуски с поддержкой сеансов отсоединяются через общий поток задач и состояний, включая `action: "status"`

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

Встроенный плагин MiniMax регистрирует генерацию видео через общий инструмент `video_generate` для обоих провайдеров, `minimax` и `minimax-portal`.

- Модель видео по умолчанию: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Также поддерживаются `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` и `I2V-01`
- Режимы: преобразование текста в видео и сценарии с одним эталонным изображением
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
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
</Note>

### Распознавание изображений

Плагин MiniMax регистрирует распознавание изображений отдельно от каталога текстовых моделей:

| Идентификатор провайдера | Модель изображений по умолчанию | Извлечение текста из PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Поэтому автоматическая маршрутизация медиафайлов может использовать распознавание изображений MiniMax, даже если встроенный каталог провайдеров текстовых моделей также содержит ссылки на чат-модели M3 с поддержкой изображений. Для распознавания PDF `MiniMax-M2.7` используется только для извлечения текста; MiniMax не регистрирует путь преобразования PDF в изображения.

### Веб-поиск

Плагин MiniMax также регистрирует `web_search` через API поиска MiniMax Token Plan (`/v1/coding_plan/search`).

- Идентификатор провайдера: `minimax`
- Структурированные результаты: заголовки, URL-адреса, фрагменты, связанные запросы
- Предпочтительная переменная окружения: `MINIMAX_CODE_PLAN_KEY`
- Допустимые псевдонимы переменной окружения: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервный вариант для совместимости: `MINIMAX_API_KEY`, если он уже указывает на учётные данные Token Plan
- Повторное использование региона: `plugins.entries.minimax.config.webSearch.region`, затем `MINIMAX_API_HOST`, затем базовые URL-адреса провайдера MiniMax
- Поиск продолжает использовать идентификатор провайдера `minimax`; настройка OAuth для Китая или глобального региона может косвенно определять регион через `models.providers.minimax-portal.baseUrl` и предоставлять аутентификацию с помощью токена-носителя через `MINIMAX_OAUTH_TOKEN`

Конфигурация находится в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Полная настройка и использование веб-поиска описаны в разделе [Поиск MiniMax](/ru/tools/minimax-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Параметры конфигурации">
    | Параметр | Описание |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Предпочтительно использовать `https://api.minimax.io/anthropic` (совместимый с Anthropic); `https://api.minimax.io/v1` необязателен для полезной нагрузки, совместимой с OpenAI |
    | `models.providers.minimax.api` | Предпочтительно использовать `anthropic-messages`; `openai-completions` необязателен для полезной нагрузки, совместимой с OpenAI |
    | `models.providers.minimax.apiKey` | Ключ API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Определите `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Назначьте псевдонимы моделям, которые нужно добавить в список разрешённых |
    | `models.mode` | Сохраните `merge`, если хотите добавить MiniMax наряду со встроенными моделями |
  </Accordion>

  <Accordion title="Настройки рассуждений по умолчанию">
    В `api: "anthropic-messages"` OpenClaw внедряет `thinking: { type: "disabled" }` для моделей MiniMax M2.x, если более ранняя обёртка ещё не задала поле `thinking` в полезной нагрузке. Это предотвращает вывод `reasoning_content` потоковой конечной точкой M2.x во фрагментах изменений в стиле OpenAI, из-за чего внутренние рассуждения могли бы попасть в видимый вывод.

    MiniMax-M3 (и M3.x) является исключением: при отключённых рассуждениях M3 возвращает пустой массив `content` с `stop_reason: "end_turn"`, поэтому OpenClaw удаляет неявное отключённое значение по умолчанию для M3, а при заданном уровне рассуждений принудительно устанавливает `thinking: { type: "adaptive" }`.

    Доступные уровни рассуждений для каждого семейства моделей:

    | Семейство моделей | Уровни                                    | По умолчанию |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Быстрый режим">
    `/fast on` или `params.fastMode: true` заменяет `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` в потоковом пути, совместимом с Anthropic (`api: "anthropic-messages"`, провайдер `minimax` или `minimax-portal`).
  </Accordion>

  <Accordion title="Пример резервного переключения">
    **Лучше всего подходит для:** использования самой мощной модели последнего поколения в качестве основной с резервным переключением на MiniMax M2.7. В примере ниже Opus используется как конкретная основная модель; замените её предпочтительной основной моделью последнего поколения.

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

  <Accordion title="Подробности использования Coding Plan">
    - API использования Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` или `https://api.minimax.io/v1/token_plan/remains` (требуется ключ Coding Plan).
    - При настроенных `models.providers.minimax-portal.baseUrl` или `models.providers.minimax.baseUrl` хост для опроса использования определяется из них, поэтому глобальные конфигурации с `https://api.minimax.io/anthropic` опрашивают `api.minimax.io`. При отсутствии или некорректности базовых URL-адресов для совместимости сохраняется резервный вариант для Китая.
    - OpenClaw нормализует сведения об использовании Coding Plan MiniMax к тому же представлению `% left`, которое используется другими провайдерами. Необработанные поля MiniMax `usage_percent` / `usagePercent` обозначают оставшуюся, а не израсходованную квоту, поэтому OpenClaw инвертирует их. При наличии приоритет имеют поля на основе количества.
    - Когда API возвращает `model_remains`, OpenClaw отдаёт предпочтение записи чат-модели, при необходимости формирует метку окна из `start_time` / `end_time` и включает имя выбранной модели в метку плана, чтобы окна Coding Plan было проще различать.
    - Снимки использования считают `minimax`, `minimax-cn`, `minimax-portal` и `minimax-portal-cn` одной и той же квотой MiniMax и отдают предпочтение сохранённому OAuth MiniMax, прежде чем переходить к переменным окружения с ключом Coding Plan.

  </Accordion>
</AccordionGroup>

## Примечания

- Чат-модель по умолчанию: `MiniMax-M3`. Альтернативные чат-модели: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- При первоначальной настройке и прямой настройке ключа API записываются определения модели для M3 и обоих вариантов M2.7
- Для распознавания изображений используется принадлежащий плагину медиапровайдер `MiniMax-VL-01`
- Если требуется точный учёт затрат, обновите значения цен в `models.json`
- Используйте `openclaw models list`, чтобы подтвердить текущий идентификатор провайдера, затем переключитесь с помощью `openclaw models set minimax/MiniMax-M3` или `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Правила провайдеров описаны в разделе [Провайдеры моделей](/ru/concepts/model-providers).
</Note>

## Устранение неполадок

<AccordionGroup>
  <Accordion title='"Неизвестная модель: minimax/MiniMax-M3"'>
    Обычно это означает, что **провайдер MiniMax не настроен** (не найдена соответствующая запись провайдера, профиль аутентификации MiniMax или ключ переменной окружения). Способы исправления:

    - Выполнить `openclaw configure` и выбрать вариант аутентификации **MiniMax** или
    - Добавить соответствующий блок `models.providers.minimax` или `models.providers.minimax-portal` вручную или
    - Задать `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` или профиль аутентификации MiniMax, чтобы соответствующий провайдер мог быть внедрён.

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
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента для работы с изображениями и выбор провайдера.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Общие параметры инструмента для работы с музыкой и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента для работы с видео и выбор провайдера.
  </Card>
  <Card title="Поиск MiniMax" href="/ru/tools/minimax-search" icon="magnifying-glass">
    Настройка веб-поиска через MiniMax Token Plan.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие сведения об устранении неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
