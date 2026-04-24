---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T16:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: bedc8975dae28e13d653494723ca0ee44cefdb63cbd4c6397658bd22fd8c3d80
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API-ключ** — прямий доступ до OpenAI Platform з тарифікацією за використання (`openai/*` моделі)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` моделі)
- **Обв’язка Codex app-server** — нативне виконання через Codex app-server (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI явно підтримує використання OAuth за підпискою в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Швидкий вибір

| Ціль                                          | Використовуйте                                           | Примітки                                                                     |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Пряма тарифікація за API-ключем               | `openai/gpt-5.4`                                         | Установіть `OPENAI_API_KEY` або виконайте онбординг OpenAI API-key.          |
| GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою Codex app-server | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Використовує обв’язку Codex app-server, а не публічний маршрут OpenAI API.   |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                     | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |

<Note>
GPT-5.5 наразі доступний в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з виконавцем PI або `openai/gpt-5.5` з
обв’язкою Codex app-server. Прямий доступ за API-ключем до `openai/gpt-5.5`
підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель із підтримкою API, наприклад `openai/gpt-5.4`, для конфігурацій із `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin Codex app-server. OpenClaw вмикає цей Plugin лише
коли ви явно обираєте нативну обв’язку Codex за допомогою
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | постачальник моделей `openai/<model>`                     | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Обв’язка Codex app-server | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
| Пошук у вебі на стороні сервера | нативний інструмент OpenAI Responses                 | Так, коли ввімкнено вебпошук і не закріплено постачальника |
| Зображення                | `image_generate`                                          | Так                                                    |
| Відео                     | `video_generate`                                          | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`          | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа        | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`     | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Вбудовування              | постачальник embedding для пам’яті                        | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та тарифікації за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ у [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API-key, якщо ви явно не примусите
    обв’язку Codex app-server. Сам GPT-5.5 наразі доступний лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через типовий виконавець PI.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Реальні запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-конфігурацій або конфігурацій, де незручно використовувати callback, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість browser callback на localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Обв’язка Codex app-server | автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати ідентифікатор постачальника `openai-codex` для команд
    автентифікації/профілю. Префікс моделі `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не вмикає автоматично вбудовану обв’язку Codex app-server.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через browser OAuth (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    У чаті `/status` показує, яка вбудована обв’язка активна для поточної
    сесії. Типова обв’язка PI відображається як `Runner: pi (embedded)` і не
    додає окремий бейдж. Коли вибрано вбудовану обв’язку Codex app-server,
    `/status` додає ідентифікатор обв’язки не-PI поруч із `Fast`, наприклад
    `Fast · codex`. Існуючі сесії зберігають зафіксований ідентифікатор обв’язки, тому використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Типове обмеження `contextTokens` під час виконання: `272000`

    Менше типове обмеження на практиці має кращі характеристики затримки та якості. Ви можете перевизначити його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту під час виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані вихідного каталогу Codex для `gpt-5.5`, коли вони
    присутні. Якщо під час реального виявлення Codex відсутній рядок `openai-codex/gpt-5.5`,
    а обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    Cron, субагент і запуски зі сконфігурованою типовою моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує і генерацію зображень OpenAI за API-ключем, і генерацію зображень
через Codex OAuth з тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                     | Codex OAuth                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                    | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                   | бекенд Codex Responses               |
| Максимум зображень на запит | 4                                 | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | За можливості безпечно зіставляється з підтримуваним розміром |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

`gpt-image-2` є типовим для перетворення тексту на зображення та редагування зображень в OpenAI.
`gpt-image-1` і надалі можна використовувати як явне перевизначення моделі, але для нових
робочих процесів OpenAI із зображеннями слід використовувати `openai/gpt-image-2`.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw знаходить збережений OAuth-токен
доступу та надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихого fallback до API-ключа для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власним базовим URL або кінцевою точкою Azure, якщо хочете використовувати прямий маршрут OpenAI Images API
замість цього.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і далі
блокує приватні/внутрішні OpenAI-сумісні кінцеві точки зображень, якщо не задано цей явний дозвіл.

Згенерувати:

```text
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагувати:

```text
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Text-to-video, image-to-video, редагування одного відео                           |
| Вхідні еталони   | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                               |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однакове накладання. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і накладання Heartbeat через інструкції розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі правила доведення до кінця та проактивного Heartbeat, навіть якщо рештою промпту обв’язки керує Codex.

Внесок GPT-5 додає позначений контракт поведінки для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Правила GPT-5 завжди ввімкнені для відповідних моделей. Дружній стиль взаємодії — окремий і налаштовуваний шар.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (типово) | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише шар дружнього стилю          |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Значення під час виконання нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` і далі зчитується як fallback для сумісності, якщо спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Вхідний шлях: завантаження аудіофайлу multipart
    - Підтримується в OpenClaw всюди, де для транскрибування вхідного аудіо використовується
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрибування вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Підказки мови та промпту передаються в OpenAI, коли вони надані
    спільною конфігурацією аудіомедіа або запитом транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Використовує з’єднання WebSocket із `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей постачальник потокової обробки призначений для шляху транскрибування в реальному часі в Voice Call; голос у Discord наразі натомість записує короткі сегменти та використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований постачальник `openai` може спрямовувати генерацію зображень на ресурс Azure OpenAI
через перевизначення базового URL. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично
перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech), щоб дізнатися про налаштування Azure
для нього.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна резидентність даних або засоби відповідності вимогам, які надає Azure
- Ви хочете залишити трафік у межах наявного tenancy Azure

### Конфігурація

Для генерації зображень через Azure у вбудованому постачальнику `openai` укажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` як
ключ Azure OpenAI (а не ключ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який власний
`openai.baseUrl` так само, як публічну кінцеву точку OpenAI, і не працюватимуть з deployment генерації
зображень у Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не задано.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
спрямованих через вбудований постачальник `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```text
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви deployment застосовується до викликів генерації зображень, спрямованих через
вбудований постачальник `openai`.

### Регіональна доступність

Генерація зображень у Azure зараз доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і переконайтеся, що потрібна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, які підтримує саме ваш deployment і версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses на Azure (окрім генерації зображень) використовуйте
потік онбордингу або окрему конфігурацію постачальника Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати форму API/автентифікації Azure. Існує
окремий постачальник `azure-openai-responses/*`; див.
акордеон про серверний Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із fallback до SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом до SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час цього періоду охолодження
    - Додає стабільні заголовки ідентифікації сесії та ходу для повторних спроб і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, fallback до SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрівання WebSocket">
    OpenClaw типово вмикає прогрівання WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрівання
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI сесій повертає сесію до типового налаштованого значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих постачальників через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Серверний Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає серверний Compaction:

    - Примусово встановлює `store: true` (якщо лише сумісність моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків постачальника OpenAI, які використовуються вбудованими запусками. Нативна обв’язка Codex app-server керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, як-от Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Власний поріг">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Вимкнути">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses і далі примусово встановлюють `store: true`, якщо лише сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, якщо доступна дія через інструмент
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI і Codex. Інші постачальники та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, характерне лише для OpenAI (`service_tier`, `store`, reasoning-compat, підказки кешу промптів)

    **Маршрути проксі/сумісності:**
    - Використовують менш строгі правила сумісності
    - Не примушують строгі схеми інструментів або заголовки, доступні лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
