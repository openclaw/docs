---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація за підпискою Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI за допомогою ключів API або підписки Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T06:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент програмування плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Більшість підписників ChatGPT/Codex,
які хочуть поведінку Codex, мають використовувати нативне середовище виконання сервера застосунку Codex. Префікс
моделі вибирає назву постачальника/моделі; окреме налаштування середовища виконання вибирає,
хто виконує вбудований цикл агента:

- **Ключ API** - прямий доступ до OpenAI Platform з оплатою за використання (`openai/*` models)
- **Підписка Codex з нативним середовищем виконання Codex** - вхід ChatGPT/Codex плюс виконання сервером застосунку Codex (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)
- **Підписка Codex через PI** - вхід ChatGPT/Codex зі звичайним виконавцем OpenClaw PI (`openai-codex/*` models)

OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

Постачальник, модель, середовище виконання та канал є окремими рівнями. Якщо ці мітки
змішуються між собою, прочитайте [середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                              | Примітки                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Підписка ChatGPT/Codex з нативним середовищем виконання Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Рекомендоване налаштування Codex для більшості користувачів. Увійдіть через автентифікацію `openai-codex`. |
| Пряма оплата за ключем API                               | `openai/gpt-5.5`                                 | Задайте `OPENAI_API_KEY` або запустіть налаштування OpenAI API-key.                    |
| Автентифікація підписки ChatGPT/Codex через PI           | `openai-codex/gpt-5.5`                           | Використовуйте лише тоді, коли навмисно хочете звичайний виконавець PI.                |
| Генерація або редагування зображень                          | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth.                 |
| Зображення з прозорим тлом                        | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`.     |

## Карта назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                       | Рівень             | Значення                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс постачальника   | Прямий маршрут OpenAI Platform API.                                                                 |
| `openai-codex`                     | Префікс постачальника   | Маршрут OpenAI Codex OAuth/підписки через звичайний виконавець OpenClaw PI.                      |
| `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативне середовище виконання сервера застосунку Codex і керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента     | Примусово використовує нативну обгортку сервера застосунку Codex для вбудованих ходів.                                     |
| `/codex ...`                       | Набір чат-команд  | Прив’язує/керує потоками сервера застосунку Codex із розмови.                                        |
| `runtime: "acp", agentId: "codex"` | Маршрут сеансу ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
`codex` plugin. Це коректно, коли ви хочете Codex OAuth через PI і також хочете,
щоб нативне керування чатом `/codex` було доступним. `openclaw doctor` попереджає про цю
комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і через
маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5` з `agentRuntime.id: "codex"`. Використовуйте
`openai-codex/gpt-5.5` лише для Codex OAuth через PI, або `openai/gpt-5.5`
без перевизначення середовища виконання Codex для прямого трафіку `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення OpenAI plugin або вибір моделі `openai-codex/*` не
вмикає вбудований plugin сервера застосунку Codex. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативну обгортку Codex через
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований `codex` plugin увімкнено, але `openai-codex/*` все ще розв’язується
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                           | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses          | постачальник моделі `openai/<model>`                            | Так                                                    |
| Моделі підписки Codex | `openai-codex/<model>` з `openai-codex` OAuth           | Так                                                    |
| Обгортка сервера застосунку Codex  | `openai/<model>` з `agentRuntime.id: codex`             | Так                                                    |
| Серверний вебпошук    | Нативний інструмент OpenAI Responses                               | Так, коли вебпошук увімкнено і постачальник не зафіксований |
| Зображення                    | `image_generate`                                           | Так                                                    |
| Відео                    | `video_generate`                                           | Так                                                    |
| Перетворення тексту на мовлення            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне перетворення мовлення на текст      | `tools.media.audio` / розуміння медіа                  | Так                                                    |
| Потокове перетворення мовлення на текст  | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Embeddings                | постачальник векторних представлень пам’яті                                  | Так                                                    |

## Векторні представлення пам’яті

OpenClaw може використовувати OpenAI або сумісну з OpenAI кінцеву точку векторних представлень для
індексування `memory_search` і векторних представлень запитів:

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

Для сумісних з OpenAI кінцевих точок, які потребують асиметричних міток векторних представлень, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для постачальника поля запиту `input_type`: векторні представлення запитів використовують
`queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують
`documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Get your API key">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель              | Конфігурація середовища виконання             | Маршрут                       | Автентифікація             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Обгортка сервера застосунку Codex    | Сервер застосунку Codex |

    <Note>
    `openai/*` є прямим маршрутом за ключем API OpenAI, якщо ви явно не примусите
    обгортку сервера застосунку Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний виконавець PI або використовуйте `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання сервера застосунку Codex.
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

  <Tab title="Codex subscription">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex з нативним виконанням сервера застосунку Codex замість окремого ключа API. Хмара Codex потребує входу ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несприятливих до callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the native Codex runtime">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Після запуску Gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити нативне середовище виконання сервера застосунку.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація середовища виконання | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Нативна обгортка сервера застосунку Codex | Вхід Codex або вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Все ще PI, якщо Plugin явно не заявляє `openai-codex` | Вхід Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілів. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не вмикає автоматично вбудований стенд app-server Codex. Для
    поширеного налаштування з підпискою і нативним середовищем виконання увійдіть через
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
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Щоб натомість залишити Codex OAuth на звичайному виконавці PI, використовуйте
    `openai-codex/gpt-5.5` і пропустіть перевизначення середовища виконання Codex.

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через браузерний OAuth (типово) або потік із кодом пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Типовий стенд PI відображається як `Runtime: OpenClaw Pi Default`. Коли вибрано
    вбудований стенд app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний ідентифікатор стенда, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут `openai-codex/*`,
    `openclaw doctor` попереджає, що модель усе ще розв’язується через PI.
    Залишайте конфігурацію без змін лише тоді, коли цей маршрут автентифікації підписки через PI є
    навмисним. Перейдіть на `openai/<model>` плюс `agentRuntime.id: "codex"`, коли
    потрібне нативне виконання через app-server Codex.

    ### Обмеження вікна контексту

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
    Використовуйте `contextWindow`, щоб оголошувати нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежувати бюджет контексту середовища виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу upstream Codex для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, субагентів і налаштованої типової моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Автентифікація нативного app-server Codex

Нативний стенд app-server Codex використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але його автентифікація все одно базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише
тому, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embedding. Резервний варіант env API-key використовується лише для локального шляху stdio без облікового запису; він
не надсилається до WebSocket-з’єднань app-server. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у породжений дочірній stdio app-server і надсилає вибрані облікові дані
через RPC входу app-server.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує генерацію зображень як із OpenAI API-key, так і з Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses               |
| Максимум зображень за запит | 4                                | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримуються, зокрема розміри 2K/4K | Підтримуються, зокрема розміри 2K/4K |
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

`gpt-image-2` є типовим для генерації зображень з тексту OpenAI і для редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіша опція провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI і
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні кінцеві точки зберігають
свої налаштовані назви deployment/моделей.

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
`--openai-background` залишається доступним як специфічний для OpenAI псевдонім.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw розв’язує збережений OAuth
access token і надсилає запити зображень через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий fallback до API key для цього
запиту. Налаштуйте `models.providers.openai` явно з API key,
користувацьким base URL або кінцевою точкою Azure, коли потрібен прямий маршрут OpenAI Images API.
Якщо ця користувацька кінцева точка зображень розташована в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні кінцеві точки зображень заблокованими, якщо цього opt-in немає.

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

## Внесок промпта GPT-5

OpenClaw додає спільний внесок промпта GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x його не отримують.

Вбудований нативний стенд Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника app-server Codex, тому сеанси `openai/gpt-5.x`, примусово проведені через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення справ до кінця та проактивного Heartbeat, навіть попри те, що рештою промпта стенда керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (типово) | Увімкнути дружній шар стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                      |
| `"off"`                | Вимкнути лише дружній шар стилю       |

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
Значення не чутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` досі читається як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задане.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типове значення |
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

    `extraBody` об’єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для OpenAI-сумісних кінцевих точок, які потребують додаткових ключів, як-от `lang`. Ключі прототипу ігноруються.

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS без впливу на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу через multipart
    - Підтримується OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і аудіовкладення
      каналів

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

    Підказки щодо мови та промпта передаються в OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Використовує підключення WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей постачальник потокового передавання призначений для шляху транскрибування в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує шлях пакетного транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для бекенд-мостів реального часу. Підтримує двонаправлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Talk у Control UI використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, випущеним Gateway, і прямим браузерним обміном WebRTC SDP із
    OpenAI Realtime API. Жива перевірка для супроводжувачів доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI випускає клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фіктивним медіа мікрофона, надсилає її в OpenAI і застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований постачальник `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному часі**
в розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберегти трафік у межах наявного клієнта Azure

### Конфігурація

Для генерації зображень Azure через вбудований постачальник `openai` спрямуйте
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` як
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
- Використовує шляхи, прив’язані до розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнаватимуть невдачі з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб закріпити певну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований постачальник `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували на порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створите розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви розгортання застосовується до викликів генерації зображень,
маршрутизованих через вбудований постачальник `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти опції, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише в конкретних версіях
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure зазнає невдачі з помилкою валідації, перевірте
набір параметрів, підтримуваний вашим конкретним розгортанням і версією API, на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
прихованих заголовків атрибуції OpenClaw — див. акордеон **Нативні маршрути проти OpenAI-сумісних**
у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (поза генерацією зображень) використовуйте
процес онбордингу або спеціальну конфігурацію постачальника Azure — самого `openai.baseUrl`
недостатньо для вибору форми API/автентифікації Azure. Існує окремий постачальник
`azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw насамперед використовує WebSocket із резервним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню невдачу WebSocket перед резервним переходом на SSE
    - Після збою позначає WebSocket як погіршений приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний перехід на SSE |
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
    - [Realtime API із WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
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

  <Accordion title="Fast mode">
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
    Перевизначення сесії мають перевагу над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
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
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Додає `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, що використовуються вбудованими запусками. Нативний harness сервера застосунку Codex керує власним контекстом через Codex і налаштовується окремо за допомогою `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` керує лише додаванням `context_management`. Прямі моделі OpenAI Responses все одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
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
    - Повторює хід із підказкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства GPT-5 для OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути проти OpenAI-сумісних">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують значення зусилля OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форматування запитів, специфічне для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Видаляють Completions `store` з ненативних payload `openai-completions`
    - Приймають розширений наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, як-от vLLM
    - Не примушують суворі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
