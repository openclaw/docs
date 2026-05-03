---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI в OpenClaw через API-ключі або підписку Codex
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T04:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для програмування в межах плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути родини OpenAI. Більшості передплатників ChatGPT/Codex,
які хочуть поведінку Codex, слід використовувати нативне середовище виконання сервера застосунку Codex. Префікс
моделі вибирає постачальника/назву моделі; окреме налаштування середовища виконання вибирає,
хто виконує вбудований цикл агента:

- **Ключ API** - прямий доступ до OpenAI Platform з оплатою за використання (`openai/*` models)
- **Передплата Codex з нативним середовищем виконання Codex** - вхід ChatGPT/Codex плюс виконання сервером застосунку Codex (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)
- **Передплата Codex через PI** - вхід ChatGPT/Codex зі звичайним виконавцем OpenClaw PI (`openai-codex/*` models)

OpenAI явно підтримує використання OAuth передплати в зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Постачальник, модель, середовище виконання й канал — це окремі рівні. Якщо ці позначки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                              | Примітки                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Передплата ChatGPT/Codex з нативним середовищем виконання Codex | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Рекомендоване налаштування Codex для більшості користувачів. Увійдіть через автентифікацію `openai-codex`. |
| Пряма оплата за ключем API                               | `openai/gpt-5.5`                                 | Задайте `OPENAI_API_KEY` або запустіть онбординг ключа API OpenAI.                    |
| Автентифікація передплати ChatGPT/Codex через PI           | `openai-codex/gpt-5.5`                           | Використовуйте лише тоді, коли навмисно хочете звичайний виконавець PI.                |
| Генерація або редагування зображень                          | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth.                 |
| Зображення з прозорим тлом                        | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`.     |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                       | Рівень             | Значення                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс постачальника   | Прямий маршрут API OpenAI Platform.                                                                 |
| `openai-codex`                     | Префікс постачальника   | Маршрут OpenAI Codex OAuth/передплати через звичайний виконавець OpenClaw PI.                      |
| `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативне середовище виконання сервера застосунку Codex і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента     | Примусово використати нативний каркас сервера застосунку Codex для вбудованих ходів.                                     |
| `/codex ...`                       | Набір команд чату  | Прив’язати/керувати потоками сервера застосунку Codex з розмови.                                        |
| `runtime: "acp", agentId: "codex"` | Маршрут сеансу ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
`codex` plugin. Це коректно, коли ви хочете Codex OAuth через PI, а також хочете
мати доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про цю
комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і через
маршрути передплати/OAuth. Для передплати ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5` з `agentRuntime.id: "codex"`. Використовуйте
`openai-codex/gpt-5.5` лише для Codex OAuth через PI або `openai/gpt-5.5`
без перевизначення середовища виконання Codex для прямого трафіку `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin сервера застосунку Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативний каркас Codex через
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований Plugin `codex` увімкнено, але `openai-codex/*` досі розв’язується
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                           | Стан                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Постачальник моделі `openai/<model>`                            | Так                                                    |
| Моделі передплати Codex | `openai-codex/<model>` з OAuth `openai-codex`           | Так                                                    |
| Каркас сервера застосунку Codex  | `openai/<model>` з `agentRuntime.id: codex`             | Так                                                    |
| Серверний вебпошук    | Нативний інструмент OpenAI Responses                               | Так, коли вебпошук увімкнено і постачальника не зафіксовано |
| Зображення                    | `image_generate`                                           | Так                                                    |
| Відео                    | `video_generate`                                           | Так                                                    |
| Перетворення тексту на мовлення            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне перетворення мовлення на текст      | `tools.media.audio` / розуміння медіа                  | Так                                                    |
| Потокове перетворення мовлення на текст  | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Ембеддинги                | постачальник ембеддингів пам’яті                                  | Так                                                    |

## Ембеддинги пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісну кінцеву точку ембеддингів для
індексування `memory_search` і ембеддингів запитів:

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

Для OpenAI-сумісних кінцевих точок, які потребують асиметричних міток ембеддингів, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для постачальника поля запиту `input_type`: ембеддинги запитів використовують
`queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують
`documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

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

    | Посилання на модель              | Конфігурація середовища виконання             | Маршрут                       | Автентифікація             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Каркас сервера застосунку Codex    | Сервер застосунку Codex |

    <Note>
    `openai/*` — це прямий маршрут ключа API OpenAI, якщо ви явно не примусите
    каркас сервера застосунку Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний виконавець PI або використовуйте `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання сервером застосунку Codex.
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
    **Найкраще для:** використання вашої передплати ChatGPT/Codex із нативним виконанням сервером застосунку Codex замість окремого ключа API. Хмара Codex потребує входу ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових або несприятливих до callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

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
        у чаті, щоб перевірити нативне середовище виконання сервера застосунку.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація середовища виконання | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Нативний каркас сервера застосунку Codex | Вхід Codex або вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Досі PI, якщо Plugin явно не заявляє `openai-codex` | Вхід Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не вмикає автоматично вбудований серверний застосунковий каркас Codex. Для
    типової конфігурації з підпискою і нативним середовищем виконання увійдіть через
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

    Щоб натомість залишити Codex OAuth на звичайному виконавці PI, використовуйте
    `openai-codex/gpt-5.5` і пропустіть перевизначення середовища виконання Codex.

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через браузерний OAuth (за замовчуванням) або через потік із кодом пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Стандартний каркас PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований серверний застосунковий каркас Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний ідентифікатор каркаса, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження Doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут `openai-codex/*`,
    `openclaw doctor` попереджає, що модель усе ще визначається через PI.
    Залишайте конфігурацію без змін лише тоді, коли цей маршрут автентифікації через підписку PI є
    навмисним. Перейдіть на `openai/<model>` разом із `agentRuntime.id: "codex"`, коли
    потрібне нативне виконання через серверний застосунковий каркас Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі й обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартне обмеження середовища виконання `contextTokens`: `272000`

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу Codex з upstream для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, коли
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, під-агентів і налаштованої стандартної моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація серверного застосункового каркаса Codex

Нативний серверний застосунковий каркас Codex використовує посилання на моделі `openai/*` разом із
`agentRuntime.id: "codex"`, але його автентифікація все ще базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис серверного застосунку, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків серверного застосунку через stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли серверний застосунок повідомляє, що облікового запису немає, і все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід через підписку ChatGPT/Codex не замінюється лише
тому, що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний варіант із ключем API з env використовується лише для локального шляху stdio без облікового запису; він
не надсилається до WebSocket-з’єднань серверного застосунку. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також прибирає `CODEX_API_KEY` і `OPENAI_API_KEY`
із породженого дочірнього процесу stdio серверного застосунку й надсилає вибрані облікові дані
через RPC входу серверного застосунку.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за ключем API OpenAI, так і генерацію зображень через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | Ключ API OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth              |
| Транспорт                 | OpenAI Images API                  | Backend Codex Responses              |
| Максимум зображень на запит | 4                                | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є стандартним варіантом як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні кінцеві точки зберігають
налаштовані імена розгортання/моделі.

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
`openclaw infer image edit`, коли починаєте з вхідного файлу.
`--openai-background` залишається доступним як OpenAI-специфічний alias.

Для інсталяцій Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw визначає збережений access token OAuth
і надсилає запити на зображення через backend Codex Responses. Він
не пробує спершу `OPENAI_API_KEY` і не переходить непомітно на ключ API для цього
запиту. Налаштуйте `models.providers.openai` явно з ключем API,
власним базовим URL або кінцевою точкою Azure, коли потрібен прямий маршрут OpenAI Images API.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній адресі, також встановіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні кінцеві точки зображень заблокованими, якщо цей opt-in
не присутній.

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

| Можливість        | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                   |
| Режими            | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Еталонні входи    | 1 зображення або 1 відео                                                          |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 між провайдерами. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x не отримують його.

Вбудований нативний каркас Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника серверного застосунку Codex, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають такі самі настанови щодо доведення до кінця та проактивного Heartbeat, навіть якщо рештою prompt каркаса керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для сталості персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і тихих повідомлень залишається в спільному системному prompt OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (стандартно) | Увімкнути дружній шар стилю взаємодії     |
| `"on"`                 | Alias для `"friendly"`                      |
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
Значення під час виконання не чутливі до регістру, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` усе ще читається як fallback для сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | Ключ API | `messages.tts.providers.openai.apiKey` | За відсутності використовує `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об’єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для OpenAI-сумісних кінцевих точок, яким потрібні додаткові ключі, як-от `lang`. Ключі прототипу ігноруються.

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

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції розуміння медіа OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і аудіовкладення каналів

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

    Підказки мови й промпту передаються до OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | За відсутності використовує `OPENAI_API_KEY` |

    <Note>
    Використовує з’єднання WebSocket з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує шлях пакетної транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | За відсутності використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для бекенд-мостів реального часу. Підтримує двоспрямований виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, створеним Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Для супровідників доступна жива перевірка з
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ланка OpenAI створює клієнтський секрет у Node, генерує браузерну пропозицію SDP
    з фіктивним медіа мікрофона, надсилає її до OpenAI та застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовувати генерацію зображень на ресурс Azure OpenAI
через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Дивіться акордеон **Realtime
voice** у розділі [Голос і мовлення](#voice-and-speech) для його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібне регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберігати трафік усередині наявного тенанта Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` спрямуйте
`models.providers.openai.baseUrl` на свій ресурс Azure і встановіть `apiKey` як
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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнаватимуть помилки з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
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

Якщо ви створили розгортання під назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви розгортання застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
розгортання й підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише для конкретних версій
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваше конкретне розгортання й версія API, на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — дивіться акордеон **Native vs OpenAI-compatible
routes** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (поза генерацією зображень) використовуйте
потік початкового налаштування або виділену конфігурацію провайдера Azure — самого `openai.baseUrl`
недостатньо, щоб застосувати формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; дивіться акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує підхід WebSocket-first із резервним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як погіршений приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і повторних з’єднань
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
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw вмикає розігрів WebSocket за замовчуванням для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

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

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw відображає швидкий режим на пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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

  <Accordion title="Priority processing (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Налаштуйте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Серверна Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо сумісність не встановлює `supportsStore: false`.
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

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із підказкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства GPT-5 від OpenAI та Codex. Інші провайдери й старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути й маршрути, сумісні з OpenAI">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні проксі `/v1`, сумісні з OpenAI:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене міркування для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово встановлюють схеми інструментів у суворий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, сумісність міркування, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують слабшу поведінку сумісності
    - Вилучають Completions `store` з ненативних payload `openai-completions`
    - Приймають розширене наскрізне передавання JSON `params.extra_body`/`params.extraBody` для проксі Completions, сумісних з OpenAI
    - Приймають `params.chat_template_kwargs` для проксі Completions, сумісних з OpenAI, таких як vLLM
    - Не примушують суворі схеми інструментів або лише нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкості.
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
