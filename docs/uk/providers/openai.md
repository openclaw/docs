---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете auth через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використання OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-27T11:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ef019ca3d8ed1de0e4ac8da02fec781e71e1ced551034383d7f4d306795193
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для програмування в плані ChatGPT через клієнти Codex від OpenAI. OpenClaw зберігає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає
маршрут провайдера/auth; окремий параметр runtime вибирає, хто виконує
вбудований цикл агента:

- **API key** — прямий доступ до OpenAI Platform з білінгом за використання (`openai/*` моделі)
- **Підписка Codex через PI** — вхід ChatGPT/Codex з доступом за підпискою (`openai-codex/*` моделі)
- **Harness app-server Codex** — нативне виконання Codex app-server (`openai/*` моделі плюс `agents.defaults.agentRuntime.id: "codex"`)

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Провайдер, модель, runtime і канал — це окремі шари. Якщо ці позначення
плутаються, прочитайте [Agent runtimes](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                          | Використовуйте                                 | Примітки                                                                     |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Прямий білінг через API key                   | `openai/gpt-5.5`                               | Установіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API-key.         |
| GPT-5.5 з auth через підписку ChatGPT/Codex   | `openai-codex/gpt-5.5`                         | Стандартний маршрут PI для OAuth Codex. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою Codex app-server | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Примусово використовує harness Codex app-server для цього посилання на модель. |
| Генерація або редагування зображень           | `openai/gpt-image-2`                           | Працює як з `OPENAI_API_KEY`, так і з OAuth OpenAI Codex.                    |
| Зображення з прозорим тлом                    | `openai/gpt-image-1.5`                         | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Карта назв

Назви подібні, але не взаємозамінні:

| Назва, яку ви бачите              | Шар               | Значення                                                                                           |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `openai`                          | Префікс провайдера | Прямий маршрут API OpenAI Platform.                                                                |
| `openai-codex`                    | Префікс провайдера | Маршрут OAuth/підписки OpenAI Codex через звичайний раннер OpenClaw PI.                            |
| `codex` plugin                    | Plugin            | Bundled plugin OpenClaw, який надає нативний runtime Codex app-server і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`          | Agent runtime     | Примусово використовує нативний harness Codex app-server для вбудованих ходів.                    |
| `/codex ...`                      | Набір команд чату | Прив’язка/керування потоками Codex app-server із розмови.                                          |
| `runtime: "acp", agentId: "codex"` | Маршрут ACP-сесії | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація навмисно може містити і `openai-codex/*`, і
plugin `codex`. Це коректно, якщо ви хочете OAuth Codex через PI і також хочете
мати доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про таку
комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

<Note>
GPT-5.5 доступний як через прямий доступ до OpenAI Platform API з API key, так і через
маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку через `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` для OAuth Codex через PI або
`openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативного harness
Codex app-server.
</Note>

<Note>
Увімкнення OpenAI plugin або вибір моделі `openai-codex/*` не
вмикає bundled plugin Codex app-server. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативний harness Codex через
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо bundled plugin `codex` увімкнено, але `openai-codex/*` усе ще розв’язується
через PI, `openclaw doctor` попереджає та залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | провайдер моделі `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex    | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Harness Codex app-server | `openai/<model>` з `agentRuntime.id: codex`               | Так                                                    |
| Пошук у вебі на боці сервера | Нативний інструмент OpenAI Responses                   | Так, коли вебпошук увімкнено і провайдер не закріплено |
| Зображення               | `image_generate`                                          | Так                                                    |
| Відео                    | `video_generate`                                          | Так                                                    |
| Text-to-speech           | `messages.tts.provider: "openai"` / `tts`                 | Так                                                    |
| Batch speech-to-text     | `tools.media.audio` / розуміння медіа                     | Так                                                    |
| Streaming speech-to-text | Voice Call `streaming.provider: "openai"`                 | Так                                                    |
| Realtime voice           | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings               | провайдер embedding пам’яті                               | Так                                                    |

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або сумісну з OpenAI кінцеву точку embedding для
індексування `memory_search` та embedding запитів:

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

Для сумісних з OpenAI кінцевих точок, які вимагають асиметричних міток embedding, установіть
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для провайдера поля запиту `input_type`: embedding запитів використовують
`queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують
`documentInputType`. Повний приклад див. у [Memory configuration reference](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод auth і виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та білінгу за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте key напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель   | Конфігурація runtime                  | Маршрут                     | Auth             |
    | --------------------- | ------------------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | пропущено / `agentRuntime.id: "pi"`   | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | пропущено / `agentRuntime.id: "pi"`   | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "codex"`            | Harness Codex app-server    | Codex app-server |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API-key, якщо ви явно не примусите
    harness Codex app-server. Використовуйте `openai-codex/*` для OAuth Codex через
    стандартний раннер PI або використовуйте `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання Codex app-server.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex теж її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud вимагає входу в ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або недружніх до callback конфігурацій додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback локального браузера:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація runtime | Маршрут | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо тільки plugin явно не заявляє `openai-codex` | Вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness Codex app-server | auth Codex app-server |

    <Note>
    І далі використовуйте id провайдера `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для OAuth Codex.
    Він не вибирає і не вмикає автоматично bundled harness Codex app-server.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через OAuth у браузері (за замовчуванням) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор стану

    Чат-команда `/status` показує, який runtime моделі активний для поточної сесії.
    Стандартний harness PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано bundled harness Codex app-server, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний id harness, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо bundled plugin `codex` увімкнено, поки в цій вкладці
    вибрано маршрут `openai-codex/*`, `openclaw doctor` попереджає, що модель
    усе ще розв’язується через PI. Залишайте конфігурацію без змін, якщо це
    і є задуманий маршрут auth через підписку. Перемикайтеся на `openai/<model>` плюс
    `agentRuntime.id: "codex"` лише коли хочете нативне виконання Codex
    app-server.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через OAuth Codex:

    - Нативне `contextWindow`: `1000000`
    - Стандартне обмеження `contextTokens` runtime: `272000`

    Менше стандартне обмеження на практиці дає кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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

    OpenClaw використовує метадані каталогу Codex від upstream для `gpt-5.5`, коли вони
    наявні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, поки
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    cron, субагент і запуски налаштованої моделі за замовчуванням не завершувалися з
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Bundled plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує і генерацію зображень OpenAI через API key, і генерацію зображень
через OAuth Codex через те саме посилання на модель `openai/gpt-image-2`.

| Можливість              | OpenAI API key                     | Codex OAuth                          |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель     | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                    | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт               | OpenAI Images API                  | Бекенд Codex Responses               |
| Макс. зображень на запит | 4                                 | 4                                    |
| Режим редагування       | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру  | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільність | Не передається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` — значення за замовчуванням як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту із прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; застарілий параметр провайдера `openai.background`
усе ще приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі кінцеві точки, сумісні з OpenAI, зберігають
свої налаштовані імена deployment/model.

Те саме налаштування доступне для headless запусків CLI:

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
`--openai-background` залишається доступним як специфічний для OpenAI псевдонім.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw розв’язує цей збережений токен доступу OAuth
і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не переходить мовчки до API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
користувацьким base URL або кінцевою точкою Azure, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо ця користувацька кінцева точка зображень розташована в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і надалі
блокує приватні/внутрішні кінцеві точки зображень, сумісні з OpenAI, якщо цей явний дозвіл
відсутній.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Bundled plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні входи   | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                                |
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
Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок prompt для GPT-5

OpenClaw додає спільний внесок prompt для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Bundled нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ті самі вказівки щодо доведення до кінця та проактивного Heartbeat, хоча рештою prompt harness володіє Codex.

Внесок GPT-5 додає контракт поведінки з тегами для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді й мовчазних повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Дружній стиль взаємодії — окремий і налаштовуваний шар.

| Значення               | Ефект                                           |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (за замовчуванням) | Увімкнути шар дружнього стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                      |
| `"off"`                | Вимкнути лише шар дружнього стилю               |

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
Під час виконання значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще зчитується як сумісний резервний варіант, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Bundled plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Bundled plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрибування media-understanding OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях входу: multipart-вивантаження аудіофайла
    - Підтримується в OpenClaw всюди, де вхідне транскрибування аудіо використовує
      `tools.media.audio`, включно із сегментами голосового каналу Discord і
      аудіовкладеннями каналу

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

    Підказки щодо мови та prompt передаються до OpenAI, коли вони задані
    спільною конфігурацією аудіомедіа або запитом транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Bundled plugin `openai` реєструє транскрибування в реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Prompt | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |

    <Note>
    Використовує підключення WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Bundled plugin `openai` реєструє голос у реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Bundled провайдер `openai` може спрямовувати трафік до ресурсу Azure OpenAI для
генерації зображень, перевизначивши base URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure в `models.providers.openai.baseUrl` і автоматично
перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) щодо налаштувань
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете, щоб трафік залишався в межах наявного тенанту Azure

### Конфігурація

Для генерації зображень Azure через bundled провайдер `openai` спрямуйте
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` у
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
- Використовує шляхи з областю дії deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує стандартний тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це стандартне значення.

Інші base URL (публічний OpenAI, проксі, сумісні з OpenAI) зберігають стандартний
формат запиту зображення OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершуються помилкою при роботі з deployment
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Якщо змінну не встановлено, за замовчуванням використовується `2024-12-01-preview`.

### Імена моделей є іменами deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через bundled провайдер `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
публічним id моделі OpenAI.

Якщо ви створили deployment із назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імен deployment застосовується до викликів генерації зображень,
маршрутизованих через bundled провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і переконайтеся, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише для певних версій
моделей. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним deployment і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та сумісні з OpenAI
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses на Azure (поза генерацією зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати формат API/auth Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE протягом періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (за замовчуванням) | Спочатку WebSocket, резервний перехід на SSE |
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

    Пов’язані документи OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw вмикає прогрів WebSocket за замовчуванням для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Disable warm-up
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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого значення за замовчуванням.
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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з провайдерів через проксі, OpenClaw не змінює `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream wrapper Pi-harness у plugin OpenAI автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не встановлює `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Стандартний `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо він недоступний)

    Це застосовується до вбудованого шляху Pi harness і до hooks провайдера OpenAI, які використовуються вбудованими запусками. Нативний harness Codex app-server керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Явне ввімкнення">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

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
      <Tab title="Користувацький поріг">
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
      <Tab title="Вимкнення">
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses усе ще примусово встановлюють `store: true`, якщо compat не встановлює `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Строгий агентний режим GPT">
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
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Виводить явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежується лише запусками сімейства GPT-5 OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають стандартну поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та сумісні з OpenAI маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно із загальними проксі `/v1`, сумісними з OpenAI:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують значення OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням встановлюють строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форматування запитів, специфічне для OpenAI (`service_tier`, `store`, compat reasoning, підказки кешу prompt)

    **Маршрути proxy/compatible:**
    - Використовують менш строгий compat-поведінку
    - Видаляють Completions `store` із ненативних payload `openai-completions`
    - Приймають розширений JSON наскрізної передачі `params.extra_body`/`params.extraBody` для проксі Completions, сумісних з OpenAI
    - Приймають `params.chat_template_kwargs` для проксі Completions, сумісних з OpenAI, таких як vLLM
    - Не примусово застосовують строгі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео й вибір провайдера.
  </Card>
  <Card title="OAuth та auth" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
