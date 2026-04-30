---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T13:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для програмування в межах плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає
маршрут провайдера/автентифікації; окреме налаштування середовища виконання вибирає, хто виконує
вбудований цикл агента:

- **Ключ API** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Оснастка app-server Codex** — нативне виконання app-server Codex (моделі `openai/*` плюс `agents.defaults.agentRuntime.id: "codex"`)

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Провайдер, модель, середовище виконання та канал — це окремі рівні. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                          | Використовуйте                                  | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Пряма оплата за ключем API                    | `openai/gpt-5.5`                                 | Установіть `OPENAI_API_KEY` або запустіть онбординг ключа API OpenAI.        |
| GPT-5.5 з автентифікацією підписки ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Типовий маршрут PI для OAuth Codex. Найкращий перший вибір для налаштувань із підпискою. |
| GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Примусово вмикає оснастку app-server Codex для цього посилання на модель.   |
| Генерація або редагування зображень           | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth.                            |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Карта назв

Назви подібні, але не взаємозамінні:

| Назва, яку ви бачите              | Рівень            | Значення                                                                                          |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс провайдера | Прямий маршрут API OpenAI Platform.                                                               |
| `openai-codex`                     | Префікс провайдера | Маршрут OAuth/підписки OpenAI Codex через звичайний runner PI OpenClaw.                           |
| `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативне середовище виконання app-server Codex і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента | Примусово вмикає нативну оснастку app-server Codex для вбудованих ходів.                         |
| `/codex ...`                       | Набір команд чату | Прив’язуйте/керуйте потоками app-server Codex із розмови.                                         |
| `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                         |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
Plugin `codex`. Це коректно, коли вам потрібен OAuth Codex через PI, а також потрібно,
щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про цю
комбінацію, щоб ви могли підтвердити, що вона навмисна; він не переписує її.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і через
маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
`OPENAI_API_KEY`, `openai-codex/gpt-5.5` для OAuth Codex через PI або
`openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативної оснастки
app-server Codex.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin app-server Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативну оснастку Codex за допомогою
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований Plugin `codex` увімкнено, але `openai-codex/*` усе одно розв’язується
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                           | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses           | провайдер моделей `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`              | Так                                                    |
| Оснастка app-server Codex | `openai/<model>` з `agentRuntime.id: codex`                | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                       | Так, коли вебпошук увімкнено і провайдер не закріплено |
| Зображення                | `image_generate`                                           | Так                                                    |
| Відео                     | `video_generate`                                           | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа                     | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Вбудовування              | провайдер вбудовувань пам’яті                              | Так                                                    |

## Вбудовування пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісну кінцеву точку вбудовувань для
індексування `memory_search` і вбудовувань запитів:

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

Для OpenAI-сумісних кінцевих точок, які потребують асиметричних міток вбудовування, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для провайдера поля запиту `input_type`: вбудовування запитів використовують
`queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують
`documentInputType`. Повний приклад дивіться в [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте ключ API">
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

    ### Підсумок маршруту

    | Посилання на модель    | Конфігурація середовища виконання | Маршрут                     | Автентифікація  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Оснастка app-server Codex   | app-server Codex |

    <Note>
    `openai/*` — це прямий маршрут ключа API OpenAI, якщо ви явно не примушуєте
    оснастку app-server Codex. Використовуйте `openai-codex/*` для OAuth Codex через
    стандартний runner PI або використовуйте `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого ключа API. Хмара Codex потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

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

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація середовища виконання | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Все ще PI, якщо Plugin явно не заявляє `openai-codex` | Вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Оснастка app-server Codex | Автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс
    моделі `openai-codex/*` також є явним маршрутом PI для OAuth Codex.
    Він не вибирає і не вмикає автоматично вбудовану оснастку app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує OAuth-матеріал із `~/.codex`. Увійдіть через OAuth у браузері (за замовчуванням) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор статусу

    Chat `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Стандартний PI harness відображається як `Runtime: OpenClaw Pi Default`. Коли вибрано
    вбудований harness Codex app-server, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають свій записаний ідентифікатор harness, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження Doctor

    Якщо вбудований plugin `codex` увімкнено, а маршрут
    `openai-codex/*` цієї вкладки вибрано, `openclaw doctor` попереджає, що модель
    усе ще розв’язується через PI. Залиште конфігурацію без змін, коли це
    очікуваний маршрут автентифікації через підписку. Перемикайтеся на `openai/<model>` плюс
    `agentRuntime.id: "codex"` лише тоді, коли потрібне нативне виконання Codex
    app-server.

    ### Обмеження контекстного вікна

    OpenClaw трактує метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартне обмеження runtime `contextTokens`: `272000`

    Менше стандартне обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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

    OpenClaw використовує метадані upstream-каталогу Codex для `gpt-5.5`, коли вони
    присутні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    cron, sub-agent і запуски з налаштованою стандартною моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація Codex app-server

Нативний harness Codex app-server використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але його автентифікація все одно базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід через підписку ChatGPT/Codex не замінюється лише
тому, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервне використання API-ключа з env застосовується лише до локального stdio-шляху без облікового запису; він
не надсилається до WebSocket-з’єднань app-server. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у породжений дочірній процес stdio app-server і надсилає вибрані облікові дані
через login RPC app-server.

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію зображень через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth              |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses               |
| Макс. зображень на запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не пересилається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є стандартним варіантом як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними для використання як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виведення PNG/WebP
із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
все ще приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoints зберігають
свої налаштовані назви deployment/model.

Той самий параметр доступний для headless CLI-запусків:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Використовуйте ті самі прапорці `--output-format` і `--background` з
`openclaw infer image edit`, коли починаєте з вхідного файлу.
`--openai-background` залишається доступним як OpenAI-специфічний alias.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли налаштовано
OAuth-профіль `openai-codex`, OpenClaw розв’язує збережений OAuth
access token і надсилає запити зображень через бекенд Codex Responses. Він
спершу не пробує `OPENAI_API_KEY` і не виконує тихий fallback до API-ключа для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власним базовим URL або Azure endpoint, коли потрібен прямий маршрут OpenAI Images API
натомість.
Якщо цей власний image endpoint розташований у довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні image endpoints заблокованими, якщо цього opt-in
немає.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                  |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                     |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x не отримують його.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay heartbeat через developer instructions Codex app-server, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення до кінця та проактивного heartbeat, навіть хоча рештою harness-промпта володіє Codex.

Внесок GPT-5 додає тегований контракт поведінки для сталості persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Канально-специфічна поведінка відповідей і silent-message залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар interaction-style є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (стандартно) | Увімкнути дружній шар interaction-style |
| `"on"`                 | Alias для `"friendly"`                      |
| `"off"`                | Вимкнути лише дружній style layer           |

<Tabs>
  <Tab title="Конфігурація">
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
Значення не чутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній style layer.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` все ще читається як compatibility fallback, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Fallback до `OPENAI_API_KEY` |
    | Базовий URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрипції media-understanding OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження multipart audio file
    - Підтримується OpenClaw скрізь, де транскрипція вхідного audio використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і канальні
      audio attachments

    Щоб примусово використовувати OpenAI для транскрипції вхідного аудіо:

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

    Підказки щодо мови та промпту передаються до OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з'єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий provider призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через конфігураційні ключі `azureEndpoint` і `azureDeployment` для бекенд-мостів реального часу. Підтримує двонапрямні виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Talk в Control UI використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, згенерованим Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Підтримувачі можуть виконати live-перевірку за допомогою
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI створює клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фіктивним мікрофонним медіа, надсилає її до OpenAI й застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований provider `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Дивіться accordion **Realtime
voice** у розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете тримати трафік у межах наявного тенанта Azure

### Конфігурація

Для генерації зображень Azure через вбудований provider `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і задайте `apiKey` як
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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи, прив'язані до deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, проксі, сумісні з OpenAI) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень provider `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершаться помилкою з
deployment зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб закріпити конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами deployment

Azure OpenAI прив'язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований provider `openai`, поле `model` в OpenClaw
має бути **назвою Azure deployment**, яку ви налаштували на порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створюєте deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований provider `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних версій
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваш конкретний deployment і версія API, на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — дивіться accordion **Native vs OpenAI-compatible
routes** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
процес onboarding або окрему конфігурацію provider Azure — самого `openai.baseUrl`
недостатньо, щоб застосувати формат API/auth Azure. Існує окремий
provider `azure-openai-responses/*`; дивіться accordion про серверну Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та turn для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервно SSE |
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

    Пов'язані документи OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw вмикає warm-up WebSocket за замовчуванням для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого turn.

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

  <Accordion title="Fast mode">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в Sessions UI повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Задайте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який provider через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) потокова обгортка Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово задає `store: true` (якщо model compat не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків provider OpenAI, які використовують embedded runs. Нативний harness сервера застосунку Codex керує власним контекстом через Codex і налаштовується окремо за допомогою `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Enable explicitly">
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses все одно примусово використовують `store: true`, якщо compat не встановлює `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Режим strict-agentic GPT">
    Для запусків родини GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

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
    - Повторює хід із підказкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Застосовується лише до запусків OpenAI і Codex родини GPT-5. Інші провайдери та старіші родини моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують рівень зусилля OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Вилучають Completions `store` з ненативних payload `openai-completions`
    - Приймають наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують суворі схеми інструментів або лише нативні заголовки

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
