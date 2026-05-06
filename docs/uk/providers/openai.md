---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використання OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T08:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як агент для програмування в межах тарифного плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці поверхні окремими, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Більшості підписників ChatGPT/Codex, які хочуть поведінку Codex, слід використовувати нативне середовище виконання Codex app-server. Префікс моделі вибирає провайдера/назву моделі; окремий параметр середовища виконання вибирає, хто виконує вбудований цикл агента:

- **API key** - прямий доступ до OpenAI Platform з оплатою за використання (`openai/*` models)
- **Підписка Codex із нативним середовищем виконання Codex** - вхід ChatGPT/Codex плюс виконання Codex app-server (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)
- **Підписка Codex через PI** - вхід ChatGPT/Codex зі звичайним OpenClaw PI runner (`openai-codex/*` models)

OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Провайдер, модель, середовище виконання та канал є окремими шарами. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                              | Примітки                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Рекомендоване налаштування Codex для більшості користувачів. Увійдіть через автентифікацію `openai-codex`. |
| Пряма оплата через API-key                           | `openai/gpt-5.5`                                            | Установіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API-key.          |
| Автентифікація підписки ChatGPT/Codex через PI       | `openai-codex/gpt-5.5`                                      | Використовуйте лише тоді, коли навмисно хочете звичайний PI runner.          |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                        | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth.                            |
| Зображення з прозорим тлом                           | `openai/gpt-image-1.5`                                      | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                 | Шар               | Значення                                                                                           |
| ------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `openai`                             | Префікс провайдера | Прямий API-маршрут OpenAI Platform.                                                                |
| `openai-codex`                       | Префікс провайдера | Маршрут OpenAI Codex OAuth/підписки через звичайний OpenClaw PI runner.                            |
| `codex` plugin                       | Plugin            | Вбудований OpenClaw plugin, який надає нативне середовище виконання Codex app-server і чат-керування `/codex`. |
| `agentRuntime.id: codex`             | Середовище виконання агента | Примусово використовує нативну оболонку Codex app-server для вбудованих ходів.                     |
| `/codex ...`                         | Набір чат-команд  | Прив’язує/керує потоками Codex app-server із розмови.                                               |
| `runtime: "acp", agentId: "codex"`   | Маршрут сесії ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
`codex` plugin. Це коректно, коли вам потрібен Codex OAuth через PI, а також
доступні нативні чат-керування `/codex`. `openclaw doctor` попереджає про таку
комбінацію, щоб ви могли підтвердити, що вона навмисна; він не переписує її.

<Note>
GPT-5.5 доступна як через прямий доступ OpenAI Platform API-key, так і через
маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання
Codex використовуйте `openai/gpt-5.5` з `agentRuntime.id: "codex"`. Використовуйте
`openai-codex/gpt-5.5` лише для Codex OAuth через PI або `openai/gpt-5.5`
без перевизначення середовища виконання Codex для прямого трафіку `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення OpenAI plugin або вибір моделі `openai-codex/*` не вмикає
вбудований Codex app-server plugin. OpenClaw вмикає цей plugin лише тоді,
коли ви явно вибираєте нативну оболонку Codex через
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований `codex` plugin увімкнено, але `openai-codex/*` усе ще резолвиться
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                           | Статус                                                 |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Провайдер моделі `openai/<model>`                           | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`                | Так                                                    |
| Оболонка Codex app-server | `openai/<model>` з `agentRuntime.id: codex`                  | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                        | Так, коли вебпошук увімкнено і провайдера не закріплено |
| Зображення                | `image_generate`                                            | Так                                                    |
| Відео                     | `video_generate`                                            | Так                                                    |
| Текст у мовлення          | `messages.tts.provider: "openai"` / `tts`                   | Так                                                    |
| Пакетне мовлення в текст  | `tools.media.audio` / розуміння медіа                       | Так                                                    |
| Потокове мовлення в текст | Voice Call `streaming.provider: "openai"`                   | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk  | Так                                                    |
| Embeddings                | Провайдер embeddings пам’яті                                | Так                                                    |

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісний endpoint для embedding
індексації та запитів `memory_search`:

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

Для OpenAI-сумісних endpoint, які потребують асиметричних міток embedding, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують
`queryInputType`; проіндексовані фрагменти пам’яті та пакетна індексація використовують
`documentInputType`. Повний приклад див. у [Довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого API-доступу та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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
    | ---------------------- | --------------------------------- | --------------------------- | --------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Оболонка Codex app-server   | Codex app-server |

    <Note>
    `openai/*` є прямим маршрутом OpenAI API-key, якщо ви явно не примушуєте
    використовувати оболонку Codex app-server. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний PI runner або `openai/gpt-5.5` з
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
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Live-запити OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex із нативним виконанням Codex app-server замість окремого API key. Codex cloud потребує входу ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або callback-hostile налаштувань додайте `--device-code`, щоб увійти через потік ChatGPT device-code замість browser callback localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Використовуйте нативне середовище виконання Codex">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Перевірте, що автентифікація Codex доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Після запуску gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити нативне середовище виконання app-server.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація середовища виконання | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Нативна оболонка Codex app-server | Вхід Codex або вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Все ще PI, якщо plugin явно не заявляє `openai-codex` | Вхід Codex |

    <Warning>
    Не налаштовуйте старі посилання на моделі `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` або
    `openai-codex/gpt-5.3*`. Облікові записи ChatGPT/Codex OAuth тепер відхиляють
    ці моделі. Використовуйте `openai-codex/gpt-5.5` для маршруту PI OAuth або
    `openai/gpt-5.5` з `agentRuntime.id: "codex"` для виконання нативного середовища виконання
    Codex.
    </Warning>

    <Note>
    Далі використовуйте ідентифікатор провайдера `openai-codex` для команд автентифікації/профілів. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не вмикає автоматично вбудований серверний harness застосунку Codex. Для
    поширеного налаштування з підпискою і нативним runtime увійдіть через
    `openai-codex`, але залиште посилання на модель як `openai/gpt-5.5` і встановіть
    `agentRuntime.id: "codex"`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Щоб натомість залишити Codex OAuth на звичайному PI runner, використовуйте
    `openai-codex/gpt-5.5` і не задавайте перевизначення runtime Codex.

    <Note>
    Онбординг більше не імпортує матеріал OAuth із `~/.codex`. Увійдіть через браузерний OAuth (типово) або через описаний вище потік з кодом пристрою — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, який runtime моделі активний для поточного сеансу.
    Типовий PI harness відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований серверний harness застосунку Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний ідентифікатор harness, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут `openai-codex/*`,
    `openclaw doctor` попереджає, що модель усе ще вирішується через PI.
    Залишайте конфігурацію без змін лише тоді, коли цей маршрут автентифікації підписки PI є
    навмисним. Перейдіть на `openai/<model>` плюс `agentRuntime.id: "codex"`, коли
    хочете нативне виконання через сервер застосунку Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі й обмеження runtime-контексту як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Типове обмеження runtime `contextTokens`: `272000`

    Менше типове обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет runtime-контексту.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує upstream-метадані каталогу Codex для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, коли
    обліковий запис автентифікований, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, субагентів і налаштованої типової моделі не завершувалися з
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація серверного застосунку Codex

Нативний серверний harness застосунку Codex використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але його автентифікація все одно прив’язана до облікового запису. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис серверного застосунку, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio серверного застосунку: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли серверний застосунок повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід із підпискою ChatGPT/Codex не замінюється лише
тому, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний шлях з API-ключем env використовується лише для локального stdio без облікового запису; він
не надсилається до WebSocket-з’єднань серверного застосунку. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
до породженого дочірнього stdio-процесу серверного застосунку й надсилає вибрані облікові дані
через RPC входу серверного застосунку.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує генерацію зображень як через API-ключ OpenAI, так і через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                         | Codex OAuth                                  |
| ------------------------ | --------------------------------------- | -------------------------------------------- |
| Посилання на модель      | `openai/gpt-image-2`                    | `openai/gpt-image-2`                         |
| Автентифікація           | `OPENAI_API_KEY`                        | Вхід OpenAI Codex OAuth                      |
| Транспорт                | OpenAI Images API                       | Бекенд Codex Responses                       |
| Макс. зображень за запит | 4                                       | 4                                            |
| Режим редагування        | Увімкнено (до 5 еталонних зображень)    | Увімкнено (до 5 еталонних зображень)         |
| Перевизначення розміру   | Підтримуються, включно з розмірами 2K/4K | Підтримуються, включно з розмірами 2K/4K      |
| Співвідношення сторін / роздільність | Не пересилається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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

`gpt-image-2` є типовим для генерації зображень OpenAI з тексту та для редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також усе ще приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoint зберігають
налаштовані назви deployment/моделей.

Та сама опція доступна для headless-запусків CLI:

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
`--openai-background` залишається доступним як OpenAI-специфічний псевдонім.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw отримує збережений access token OAuth
і надсилає запити зображень через бекенд Codex Responses. Він
не пробує спочатку `OPENAI_API_KEY` і не переходить непомітно на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власним базовим URL або endpoint Azure, коли хочете натомість прямий маршрут OpenAI Images API.
Якщо цей власний image endpoint розміщено в довіреній LAN/приватній адресі, також встановіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні image endpoint заблокованими, доки немає цієї явної згоди.

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

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                      |
| Перевизначення розміру | Підтримується                                                              |
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

## Внесок prompt для GPT-5

OpenClaw додає спільний внесок prompt для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через developer instructions серверного застосунку Codex, тому сеанси `openai/gpt-5.x`, примусово проведені через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення до кінця й проактивного Heartbeat, навіть хоча Codex володіє рештою prompt harness.

Внесок GPT-5 додає тегований контракт поведінки для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і тихих повідомлень залишається у спільному системному prompt OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути дружній шар стилю взаємодії      |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише дружній шар стилю            |

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
Значення не чутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще читається як сумісний резервний варіант, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об’єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для OpenAI-сумісних кінцевих точок, яким потрібні додаткові ключі, як-от `lang`. Прототипні ключі ігноруються.

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS, не впливаючи на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрипції для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і аудіовкладення
      каналів

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

    Підказки щодо мови та prompt передаються в OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований plugin `openai` реєструє транскрипцію в реальному часі для plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований plugin `openai` реєструє голос у реальному часі для plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для бекенд-мостів реального часу. Підтримує двонапрямні виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сеанси OpenAI у реальному часі з ефемерним
    клієнтським секретом, згенерованим Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Підтримувачам доступна жива перевірка за допомогою
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    частина OpenAI генерує клієнтський секрет у Node, створює браузерну SDP-пропозицію
    з фіктивним мікрофонним медіа, надсилає її в OpenAI і застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовуватися на ресурс Azure OpenAI для генерації
зображень шляхом перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного тенанта Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` спрямуйте
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

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи, обмежені розгортанням (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнають невдачі з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб закріпити конкретну попередню або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували на порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створюєте розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви розгортання застосовується до викликів генерації зображень, маршрутизованих через
вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних версій
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою перевірки, перевірте
набір параметрів, який підтримує ваше конкретне розгортання та версія API на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути проти OpenAI-сумісних
маршрутів** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (окрім генерації зображень) використовуйте
потік онбордингу або спеціальну конфігурацію провайдера Azure — самого `openai.baseUrl`
недостатньо, щоб застосувати форму API/auth Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw спершу використовує WebSocket із запасним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сеансу та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спершу WebSocket, запасний перехід на SSE |
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

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не перезаписує `reasoning` або `text.verbosity`.

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
    Перевизначення сеансу мають перевагу над конфігурацією. Очищення перевизначення сеансу в UI Sessions повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви спрямовуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Серверна Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) потокова обгортка Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не встановлює `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний harness сервера застосунку Codex керує власним контекстом через Codex і налаштовується окремо за допомогою `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Увімкнути явно">
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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses усе ще примусово встановлюють `store: true`, якщо сумісність не встановлює `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший контракт вбудованого виконання:

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
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 від OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути проти OpenAI-сумісних">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м'якшу поведінку сумісності
    - Видаляють `store` Completions із ненативних payload `openai-completions`
    - Приймають наскрізний JSON для розширених `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують суворі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента для зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента для відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
