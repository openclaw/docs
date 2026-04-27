---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-27T14:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6a33485bb8372dca81d91d35a4fddca315613336adf601efa7ef9a418bf8480
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для програмування в плані ChatGPT через клієнти Codex від OpenAI. OpenClaw зберігає ці
поверхні окремими, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає
маршрут provider/auth; окремий параметр runtime визначає, хто виконує
вбудований цикл агента:

- **Ключ API** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Codex app-server harness** — нативне виконання Codex app-server (моделі `openai/*` плюс `agents.defaults.agentRuntime.id: "codex"`)

OpenAI явно підтримує використання subscription OAuth у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Provider, модель, runtime і канал — це окремі рівні. Якщо ці назви
плутаються між собою, прочитайте [Agent runtimes](/uk/concepts/agent-runtimes) перед
зміною конфігурації.

## Швидкий вибір

| Ціль                                          | Використовуйте                                  | Примітки                                                                     |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Прямий білінг за ключем API                   | `openai/gpt-5.5`                                | Установіть `OPENAI_API_KEY` або виконайте онбординг OpenAI з ключем API.     |
| GPT-5.5 з автентифікацією за підпискою ChatGPT/Codex | `openai-codex/gpt-5.5`                  | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою Codex app-server | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Примусово використовує Codex app-server harness для цього посилання на модель. |
| Генерація або редагування зображень           | `openai/gpt-image-2`                            | Працює або з `OPENAI_API_KEY`, або з OpenAI Codex OAuth.                     |
| Зображення з прозорим тлом                    | `openai/gpt-image-1.5`                          | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Карта назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите              | Рівень            | Значення                                                                                           |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `openai`                          | Префікс provider  | Прямий маршрут API OpenAI Platform.                                                                |
| `openai-codex`                    | Префікс provider  | Маршрут OpenAI Codex OAuth/підписки через звичайний runner PI OpenClaw.                            |
| `codex` plugin                    | Plugin            | Вбудований Plugin OpenClaw, який надає нативний runtime Codex app-server і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`          | Agent runtime     | Примусово використовувати нативний Codex app-server harness для вбудованих ходів.                 |
| `/codex ...`                      | Набір команд чату | Прив’язка/керування потоками Codex app-server із розмови.                                          |
| `runtime: "acp", agentId: "codex"` | Маршрут сеансу ACP | Явний резервний маршрут, який запускає Codex через ACP/acpx.                                      |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
plugin `codex`. Це правильно, якщо ви хочете Codex OAuth через PI і також хочете,
щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про таку
комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і
через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI, або
`openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативного
Codex app-server harness.
</Note>

<Note>
Увімкнення plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований plugin Codex app-server. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативний Codex harness через
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований plugin `codex` увімкнено, але `openai-codex/*` усе ще визначається
через PI, `openclaw doctor` виводить попередження і не змінює маршрут.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                        | Стан                                                   |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | provider моделей `openai/<model>`                        | Так                                                    |
| Моделі підписки Codex    | `openai-codex/<model>` з OAuth `openai-codex`            | Так                                                    |
| Codex app-server harness | `openai/<model>` з `agentRuntime.id: codex`              | Так                                                    |
| Server-side web search   | Нативний інструмент OpenAI Responses                     | Так, коли web search увімкнено і provider не зафіксовано |
| Зображення               | `image_generate`                                         | Так                                                    |
| Відео                    | `video_generate`                                         | Так                                                    |
| Text-to-speech           | `messages.tts.provider: "openai"` / `tts`                | Так                                                    |
| Batch speech-to-text     | `tools.media.audio` / розуміння медіа                    | Так                                                    |
| Streaming speech-to-text | Voice Call `streaming.provider: "openai"`                | Так                                                    |
| Realtime voice           | Voice Call `realtime.provider: "openai"` / розмова в Control UI | Так                                              |
| Embeddings               | provider embedding для memory                            | Так                                                    |

## Memory embeddings

OpenClaw може використовувати OpenAI або OpenAI-сумісний endpoint embedding для
індексації `memory_search` і embedding запитів:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Для OpenAI-сумісних endpoint, які вимагають асиметричних міток embedding, установіть
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw пересилає
їх як специфічні для provider поля запиту `input_type`: embedding запитів використовують
`queryInputType`; проіндексовані фрагменти memory і пакетна індексація використовують
`documentInputType`. Див. [довідник конфігурації Memory](/uk/reference/memory-config#provider-specific-config) для повного прикладу.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та білінгу за використанням.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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

    ### Підсумок маршрутів

    | Посилання на модель    | Конфігурація runtime         | Маршрут                     | Автентифікація  |
    | ---------------------- | ---------------------------- | --------------------------- | --------------- |
    | `openai/gpt-5.5`       | пропущено / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | пропущено / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`             | Codex app-server harness    | Codex app-server |

    <Note>
    `openai/*` — це прямий маршрут за ключем API OpenAI, якщо ви явно не примушуєте
    використання Codex app-server harness. Використовуйте `openai-codex/*` для Codex OAuth через
    типовий runner PI або `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання через Codex app-server.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого ключа API. Codex cloud вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-конфігурацій або конфігурацій із проблемами callback додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback локального браузера:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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

    ### Підсумок маршрутів

    | Посилання на модель | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо тільки якийсь plugin явно не заявляє `openai-codex` | вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати ідентифікатор provider `openai-codex` для команд
    auth/profile. Префікс моделі `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не автовмикає вбудований Codex app-server harness.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через browser OAuth (типово) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор стану

    Чат-команда `/status` показує, який runtime моделі активний для поточного сеансу.
    Типовий harness PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований Codex app-server harness, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний для них ID harness, тому використайте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження Doctor

    Якщо вбудований plugin `codex` увімкнено, тоді як у цій вкладці
вибрано маршрут `openai-codex/*`, `openclaw doctor` попереджає, що модель
усе ще визначається через PI. Залишайте конфігурацію без змін, якщо це і є
потрібний маршрут автентифікації за підпискою. Перемикайтеся на `openai/<model>` плюс
`agentRuntime.id: "codex"` лише тоді, коли хочете нативне виконання через Codex
app-server.

### Обмеження вікна контексту

OpenClaw розглядає метадані моделі та ліміт контексту runtime як окремі значення.

Для `openai-codex/gpt-5.5` через Codex OAuth:

- Нативне `contextWindow`: `1000000`
- Типовий ліміт runtime `contextTokens`: `272000`

Менший типовий ліміт на практиці має кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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
Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
</Note>

### Відновлення каталогу

OpenClaw використовує метадані каталогу Codex з джерела для `gpt-5.5`, коли вони
наявні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, хоча
обліковий запис автентифікований, OpenClaw синтезує цей рядок OAuth-моделі, щоб
запуски Cron, sub-agent і налаштованої моделі за замовчуванням не завершувалися помилкою
`Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за ключем API, так і генерацію зображень
через Codex OAuth через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | Ключ API OpenAI                    | Codex OAuth                           |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| Посилання на модель      | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Автентифікація           | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth         |
| Транспорт                | OpenAI Images API                  | backend Codex Responses               |
| Макс. зображень на запит | 4                                  | 4                                     |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не пересилаються в OpenAI Images API | Зіставляються з підтримуваним розміром, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

`gpt-image-2` є типовим для текстової генерації зображень OpenAI та редагування
зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр provider `openai.background`
усе ще приймається. OpenClaw також захищає публічні маршрути OpenAI і
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoint зберігають
свої налаштовані назви розгортання/моделі.

Те саме налаштування доступне і для headless-запусків CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Використовуйте ті самі прапорці `--output-format` і `--background` з
`openclaw infer image edit`, коли починаєте з вхідного файла.
`--openai-background` лишається доступним як OpenAI-специфічний псевдонім.

Для встановлень із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен доступу OAuth
і надсилає запити на зображення через backend Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не переходить непомітно на ключ API для цього
запиту. Явно налаштуйте `models.providers.openai` з ключем API,
власним base URL або endpoint Azure, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо цей власний endpoint зображень розміщено в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw тримає
приватні/внутрішні OpenAI-сумісні endpoint зображень заблокованими, якщо цей явний дозвіл
не задано.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Генерація прозорого PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість      | Значення                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| Типова модель   | `openai/sora-2`                                                                   |
| Режими          | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні входи  | 1 зображення або 1 відео                                                          |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 у різних provider. Він застосовується за ID моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однаковий оверлей. Старіші моделі GPT-4.x — ні.

Вбудований нативний Codex harness використовує ту саму поведінку GPT-5 і оверлей Heartbeat через інструкції розробника Codex app-server, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ту саму послідовність виконання та проактивні підказки Heartbeat, навіть якщо рештою prompt harness керує Codex.

Внесок GPT-5 додає позначений контракт поведінки для збереження персони, безпеки виконання, дисципліни tools, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається в спільному системному prompt OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди увімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                     |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (типово)  | Увімкнути шар дружнього стилю взаємодії   |
| `"on"`                 | Псевдонім для `"friendly"`                |
| `"off"`                | Вимкнути лише шар дружнього стилю         |

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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застарілий параметр `plugins.entries.openai.config.personality` усе ще читається як резервний механізм сумісності, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | Ключ API | `messages.tts.providers.openai.apiKey` | Якщо не задано, використовується `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрибування media-understanding OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Вхідний шлях: multipart-завантаження аудіофайла
    - Підтримується в OpenClaw скрізь, де вхідне транскрибування аудіо використовує
      `tools.media.audio`, зокрема для сегментів голосових каналів Discord і
      аудіовкладень каналів

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

    Підказки мови і prompt пересилаються до OpenAI, коли вони задані спільною
    конфігурацією audio media або запитом на транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований plugin `openai` реєструє транскрибування в реальному часі для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Якщо не задано, використовується `OPENAI_API_KEY` |

    <Note>
    Використовується з’єднання WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначено для шляху транскрибування в реальному часі plugin Voice Call; голос у Discord наразі записує короткі сегменти й використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований plugin `openai` реєструє голос у реальному часі для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Якщо не задано, використовується `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для backend-мостів реального часу. Підтримує двонапрямлений виклик tools. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Розмова в Control UI використовує браузерні сеанси OpenAI у реальному часі з
    тимчасовим секретом клієнта, випущеним Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Жива перевірка для супроводжувачів доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI випускає секрет клієнта в Node, генерує браузерну пропозицію SDP
    з фальшивим медіапотоком мікрофона, надсилає її до OpenAI і застосовує відповідь SDP
    без логування секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Вбудований provider `openai` може бути спрямований на ресурс Azure OpenAI для
генерації зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure в `models.providers.openai.baseUrl` і автоматично
перемикається на формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) для параметрів Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або механізми відповідності, які надає Azure
- Ви хочете залишити трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого provider `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure, а `apiKey` установіть у
значення ключа Azure OpenAI (а не ключа OpenAI Platform):

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

Для запитів на генерацію зображень до розпізнаного хоста Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають цей типовый параметр.

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень provider `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який власний
`openai.baseUrl` так само, як публічний endpoint OpenAI, і завершуються помилкою при роботі з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Назви моделей — це назви розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований provider `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували в порталі Azure, а не
публічним ID моделі OpenAI.

Якщо ви створили розгортання `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв розгортань застосовується до викликів генерації зображень,
маршрутизованих через вбудований provider `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перед створенням розгортання перевірте актуальний список регіонів Microsoft
і підтвердьте, що потрібна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`) або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою перевірки, перевірте
набір параметрів, підтримуваний вашим конкретним розгортанням і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативну транспортну і compat-поведінку, але не отримує
приховані заголовки attribution від OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
потік онбордингу або окрему конфігурацію provider Azure — одного лише `openai.baseUrl`
недостатньо, щоб підхопити формат API/автентифікації Azure. Існує окремий
provider `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує стратегію WebSocket-first із fallback на SSE (`"auto"`) і для `openai/*`, і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює один ранній збій WebSocket перед переходом на SSE
    - Після збою позначає WebSocket як degraded приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сеансу та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, потім fallback на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрів
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сеансу мають вищий пріоритет, ніж конфігурація. Очищення перевизначення сеансу в UI сеансів повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установлюйте її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` пересилається лише до нативних endpoint OpenAI (`api.openai.com`) і нативних endpoint Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який із provider через проксі, OpenClaw не змінює `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream-обгортка Pi harness plugin OpenAI автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо тільки compat моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо воно недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків provider OpenAI, що використовуються вбудованими запусками. Нативний Codex app-server harness керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних endpoint, таких як Azure OpenAI Responses:

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses все одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
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

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія tool
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI і Codex. Інші provider і старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Опускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим схем tools
    - Додають приховані заголовки attribution лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, reasoning-compat, підказки кешу prompt)

    **Маршрути проксі/сумісності:**
    - Використовують м’якшу compat-поведінку
    - Вилучають Completions `store` із ненативних payload `openai-completions`
    - Приймають розширений наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують суворі схеми tools або заголовки, призначені лише для нативних маршрутів

    Azure OpenAI використовує нативну транспортну і compat-поведінку, але не отримує приховані заголовки attribution.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір provider.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір provider.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
