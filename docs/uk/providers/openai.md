---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агентів GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T18:07:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент програмування з плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути родини OpenAI. Більшості передплатників ChatGPT/Codex,
які хочуть поведінку Codex, слід використовувати нативне середовище виконання app-server Codex. Префікс
моделі вибирає назву постачальника/моделі; окреме налаштування середовища виконання вибирає,
хто виконує вбудований цикл агента:

- **Ключ API** - прямий доступ до OpenAI Platform із тарифікацією за використання (`openai/*` моделі)
- **Передплата Codex із нативним середовищем виконання Codex** - вхід через ChatGPT/Codex плюс виконання app-server Codex (`openai/*` моделі плюс `agents.defaults.agentRuntime.id: "codex"`)
- **Передплата Codex через PI** - вхід через ChatGPT/Codex зі звичайним раннером OpenClaw PI (`openai-codex/*` моделі)

OpenAI явно підтримує використання OAuth передплати у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Постачальник, модель, середовище виконання й канал є окремими шарами. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                                 | Використовуйте                                              | Примітки                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Передплата ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Рекомендоване налаштування Codex для більшості користувачів. Увійдіть з автентифікацією `openai-codex`. |
| Пряма тарифікація за ключем API                      | `openai/gpt-5.5`                                            | Задайте `OPENAI_API_KEY` або запустіть онбординг ключа API OpenAI.            |
| Автентифікація передплати ChatGPT/Codex через PI     | `openai-codex/gpt-5.5`                                      | Використовуйте лише тоді, коли навмисно хочете звичайний раннер PI.           |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                        | Працює або з `OPENAI_API_KEY`, або з OpenAI Codex OAuth.                      |
| Зображення з прозорим фоном                          | `openai/gpt-image-1.5`                                      | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                | Шар               | Значення                                                                                           |
| ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс постачальника | Прямий маршрут API OpenAI Platform.                                                                |
| `openai-codex`                     | Префікс постачальника | Маршрут OpenAI Codex OAuth/передплати через звичайний раннер OpenClaw PI.                          |
| `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативне середовище виконання app-server Codex і керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента | Примусово використовує нативну обгортку app-server Codex для вбудованих ходів.                    |
| `/codex ...`                       | Набір команд чату | Прив’язує/керує потоками app-server Codex із розмови.                                              |
| `runtime: "acp", agentId: "codex"` | Маршрут сеансу ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
`codex` plugin. Це коректно, коли ви хочете Codex OAuth через PI і також хочете,
щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про таке
поєднання, щоб ви могли підтвердити, що воно навмисне; він не переписує його.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і
через маршрути передплати/OAuth. Для передплати ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5` з `agentRuntime.id: "codex"`. Використовуйте
`openai-codex/gpt-5.5` лише для Codex OAuth через PI або `openai/gpt-5.5`
без перевизначення середовища виконання Codex для прямого трафіку `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення OpenAI plugin або вибір моделі `openai-codex/*` не
вмикає вбудований plugin app-server Codex. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативну обгортку Codex за допомогою
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований `codex` plugin увімкнено, але `openai-codex/*` досі розв’язується
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                           | Статус                                                 |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses          | постачальник моделі `openai/<model>`                        | Так                                                    |
| Моделі передплати Codex  | `openai-codex/<model>` з `openai-codex` OAuth               | Так                                                    |
| Обгортка app-server Codex | `openai/<model>` з `agentRuntime.id: codex`                 | Так                                                    |
| Серверний вебпошук       | Нативний інструмент OpenAI Responses                        | Так, коли вебпошук увімкнено і постачальника не закріплено |
| Зображення               | `image_generate`                                            | Так                                                    |
| Відео                    | `video_generate`                                            | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`           | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа       | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`  | Так                                                    |
| Голос у реальному часі   | Voice Call `realtime.provider: "openai"` / Control UI Talk  | Так                                                    |
| Векторні подання         | постачальник векторних подань пам’яті                       | Так                                                    |

## Векторні подання пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісну кінцеву точку векторних подань для
індексування `memory_search` і векторних подань запитів:

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

Для OpenAI-сумісних кінцевих точок, які потребують асиметричних міток векторних подань, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для постачальника поля запиту `input_type`: векторні подання запитів використовують
`queryInputType`; індексовані фрагменти пам’яті й пакетне індексування використовують
`documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу API і тарифікації за використання.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ безпосередньо:

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
    | `openai/gpt-5.5`       | пропущено / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | пропущено / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`             | Обгортка app-server Codex   | app-server Codex |

    <Note>
    `openai/*` є прямим маршрутом ключа API OpenAI, якщо ви явно не примушуєте
    обгортку app-server Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний раннер PI або використовуйте `openai/gpt-5.5` з
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

  <Tab title="Передплата Codex">
    **Найкраще для:** використання вашої передплати ChatGPT/Codex із нативним виконанням app-server Codex замість окремого ключа API. Хмара Codex потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несприятливих до callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Використайте нативне середовище виконання Codex">
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
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Нативна обгортка app-server Codex | Вхід Codex або вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | пропущено / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо plugin явно не заявляє `openai-codex` | Вхід Codex |

    <Warning>
    Не налаштовуйте старі посилання на моделі `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` або
    `openai-codex/gpt-5.3*`. Облікові записи ChatGPT/Codex OAuth тепер відхиляють
    ці моделі. Використовуйте `openai-codex/gpt-5.5` для маршруту PI OAuth або
    `openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативного виконання середовища виконання Codex.
    </Warning>

    <Note>
    Продовжуйте використовувати id провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не вмикає автоматично вбудовану обв’язку сервера застосунку Codex. Для
    типового налаштування з підпискою і нативним середовищем виконання увійдіть через
    `openai-codex`, але залиште посилання на модель як `openai/gpt-5.5` і задайте
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

    Щоб натомість залишити Codex OAuth на звичайному раннері PI, використовуйте
    `openai-codex/gpt-5.5` і опустіть перевизначення середовища виконання Codex.

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через браузерний OAuth (за замовчуванням) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Перевірка та відновлення маршрутизації Codex OAuth

    Використовуйте ці команди, щоб побачити, яку модель, середовище виконання та маршрут автентифікації використовує ваш типовий
    агент:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Для конкретного агента додайте `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Якщо запуск `doctor --fix` у версії 2026.5.5 змінив налаштування підписки GPT-5.5 з
    `openai-codex/gpt-5.5` на `openai/gpt-5.5`, перемкніть типового агента назад
    на маршрут Codex OAuth PI:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    Якщо `models auth list --provider openai-codex` не показує придатного профілю, увійдіть
    знову:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` означає ChatGPT/Codex OAuth через PI. `openai/*` з
    `agentRuntime.id: "codex"` означає нативне виконання сервера застосунку Codex.

    ### Індикатор стану

    Chat `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Типова обв’язка PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудовану обв’язку сервера застосунку Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний id обв’язки, тож використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження Doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут `openai-codex/*`,
    `openclaw doctor` попереджає, що модель усе ще розв’язується через PI.
    Залишайте конфігурацію без змін лише тоді, коли цей маршрут автентифікації підписки PI
    є навмисним. Перемкніться на `openai/<model>` плюс `agentRuntime.id: "codex"`, коли
    потрібне нативне виконання сервера застосунку Codex.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Типове обмеження середовища виконання `contextTokens`: `272000`

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу upstream Codex для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    cron, підлеглий агент і запуски з налаштованою типовою моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація сервера застосунку Codex

Нативна обв’язка сервера застосунку Codex використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але її автентифікація все одно базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис сервера застосунку, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio сервера застосунку: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли сервер застосунку повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише
тому, що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний варіант API-ключа з env використовується лише для локального шляху stdio без облікового запису; його
не надсилають до WebSocket-з’єднань сервера застосунку. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у породжений дочірній stdio-процес сервера застосунку та надсилає вибрані облікові дані
через RPC входу сервера застосунку.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за API-ключем OpenAI, так і генерацію зображень через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth              |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses               |
| Макс. зображень на запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 референсних зображень) | Увімкнено (до 5 референсних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є типовим для генерації зображень з тексту OpenAI і
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoint зберігають
налаштовані імена розгортань/моделей.

Те саме налаштування доступне для headless-запусків CLI:

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
`--openai-background` залишається доступним як OpenAI-специфічний псевдонім.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw розв’язує цей збережений OAuth
access token і надсилає запити зображень через бекенд Codex Responses. Він
не намагається спершу використати `OPENAI_API_KEY` і не перемикається непомітно на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власною базовою URL-адресою або endpoint Azure, коли потрібен прямий маршрут OpenAI Images API
.
Якщо цей власний endpoint зображень розташований у довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні endpoint зображень заблокованими, якщо цього opt-in
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

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Референсні входи | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                                 |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок підказки GPT-5

OpenClaw додає спільний внесок підказки GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують те саме накладання. Старіші моделі GPT-4.x його не отримують.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і накладання Heartbeat через developer instructions сервера застосунку Codex, тож сеанси `openai/gpt-5.x`, примусово проведені через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення справ до кінця та проактивного Heartbeat, навіть якщо Codex володіє рештою підказки обв’язки.

Внесок GPT-5 додає тегований поведінковий контракт для сталості персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і тихих повідомлень залишається у спільній системній підказці OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (типово)  | Увімкнути дружній шар стилю взаємодії       |
| `"on"`                 | Псевдонім для `"friendly"`                  |
| `"off"`                | Вимкнути лише дружній шар стилю             |

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
Під час виконання значення не чутливі до регістру, тому `"Off"` і `"off"` обидва вимикають шар дружнього стилю.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` усе ще читається як резервний варіант сумісності, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | Ключ API | `messages.tts.providers.openai.apiKey` | Повертається до `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об'єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для сумісних з OpenAI кінцевих точок, які потребують додаткових ключів, як-от `lang`. Ключі прототипів ігноруються.

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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS, не впливаючи на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і
      аудіовкладення каналів

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

    Підказки щодо мови та prompt передаються до OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований plugin `openai` реєструє транскрибування в реальному часі для Voice Call plugin.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з'єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей провайдер streaming призначений для шляху транскрибування в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований plugin `openai` реєструє голос у реальному часі для Voice Call plugin.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для backend-мостів реального часу. Підтримує двонапрямний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, створеним Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Maintainer live verification доступна з
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    частина OpenAI створює клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фіктивним медіа мікрофона, надсилає її до OpenAI і застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Перегляньте акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech), щоб дізнатися про його параметри
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете тримати трафік усередині наявного середовища Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` спрямуйте
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` на
ключ Azure OpenAI (не ключ OpenAI Platform):

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
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, сумісні з OpenAI проксі) зберігають стандартну
форму запиту зображення OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнають невдачі з deployments
зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб зафіксувати певну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами deployment

Azure OpenAI прив'язує моделі до deployments. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою Azure deployment**, яку ви налаштували на порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створюєте deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви deployment застосовується до викликів генерації зображень, маршрутизованих через
вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних
версій моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним deployment і версією API на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та сумісні з OpenAI
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (окрім генерації зображень) використовуйте
onboarding flow або спеціальну конфігурацію провайдера Azure — сам по собі `openai.baseUrl`
не підхоплює форму Azure API/auth. Існує окремий
провайдер `azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує підхід WebSocket-first з резервним SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний SSE |
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
    - [Streaming-відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI Sessions повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

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
    - Додає `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли воно недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний app-server harness Codex керує власним контекстом через Codex і налаштовується окремо за допомогою `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` керує лише додаванням `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо сумісність не встановлює `supportsStore: false`.
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
    - Більше не вважає хід лише з планом успішним поступом, коли доступна дія інструмента
    - Повторює хід зі спрямуванням діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути порівняно з OpenAI-сумісними">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово встановлюють схеми інструментів у суворий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують вільнішу поведінку сумісності
    - Вилучають Completions `store` з ненативних payload `openai-completions`
    - Приймають передавання наскрізного JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, як-от vLLM
    - Не примушують суворі схеми інструментів або нативні-only заголовки

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує прихованих заголовків атрибуції.

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
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
