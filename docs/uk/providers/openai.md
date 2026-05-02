---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI в OpenClaw за допомогою API-ключів або підписки Codex
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T02:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7e98179f5a7d90289ed6cdad1c4dd03834f42e3fcc747d24c7d29a47e103392
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для кодування в межах плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремими, щоб конфігурація лишалася передбачуваною.

OpenClaw підтримує три маршрути родини OpenAI. Більшості підписників ChatGPT/Codex,
яким потрібна поведінка Codex, слід використовувати нативне середовище виконання сервера застосунку Codex. Префікс
моделі вибирає провайдера/назву моделі; окреме налаштування середовища виконання вибирає,
хто виконує вбудований цикл агента:

- **Ключ API** - прямий доступ до OpenAI Platform з оплатою за використання (`openai/*` models)
- **Підписка Codex з нативним середовищем виконання Codex** - вхід через ChatGPT/Codex плюс виконання сервером застосунку Codex (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)
- **Підписка Codex через PI** - вхід через ChatGPT/Codex зі звичайним раннером OpenClaw PI (`openai-codex/*` models)

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

Провайдер, модель, середовище виконання та канал є окремими шарами. Якщо ці мітки
змішуються, прочитайте [середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                                 | Використовуйте                                              | Примітки                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Підписка ChatGPT/Codex з нативним середовищем виконання Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Рекомендоване налаштування Codex для більшості користувачів. Увійдіть за допомогою автентифікації `openai-codex`. |
| Пряма оплата за ключем API                               | `openai/gpt-5.5`                                 | Установіть `OPENAI_API_KEY` або запустіть онбординг ключа API OpenAI.                    |
| Автентифікація підписки ChatGPT/Codex через PI           | `openai-codex/gpt-5.5`                           | Використовуйте лише тоді, коли свідомо хочете звичайний раннер PI.                |
| Генерування або редагування зображень                          | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth.                 |
| Зображення з прозорим тлом                        | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`.     |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                       | Шар             | Значення                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс провайдера   | Прямий маршрут API OpenAI Platform.                                                                 |
| `openai-codex`                     | Префікс провайдера   | Маршрут OpenAI Codex OAuth/підписки через звичайний раннер OpenClaw PI.                      |
| `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативне середовище виконання сервера застосунку Codex і керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента     | Примусово використовувати нативну обв’язку сервера застосунку Codex для вбудованих ходів.                                     |
| `/codex ...`                       | Набір чат-команд  | Прив’язувати/керувати потоками сервера застосунку Codex із розмови.                                        |
| `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
`codex` plugin. Це коректно, коли вам потрібен Codex OAuth через PI і також потрібні
доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про цю
комбінацію, щоб ви могли підтвердити, що вона навмисна; він не переписує її.

<Note>
GPT-5.5 доступна як через прямий доступ ключем API OpenAI Platform, так і через
маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5` з `agentRuntime.id: "codex"`. Використовуйте
`openai-codex/gpt-5.5` лише для Codex OAuth через PI, або `openai/gpt-5.5`
без перевизначення середовища виконання Codex для прямого трафіку `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення OpenAI plugin або вибір моделі `openai-codex/*` не
вмикає вбудований plugin сервера застосунку Codex. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативну обв’язку Codex за допомогою
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований `codex` plugin увімкнено, але `openai-codex/*` усе ще обробляється
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                           | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses          | Провайдер моделі `openai/<model>`                            | Так                                                    |
| Моделі підписки Codex | `openai-codex/<model>` з `openai-codex` OAuth           | Так                                                    |
| Обв’язка сервера застосунку Codex  | `openai/<model>` з `agentRuntime.id: codex`             | Так                                                    |
| Серверний вебпошук    | Нативний інструмент OpenAI Responses                               | Так, коли вебпошук увімкнено і провайдера не закріплено |
| Зображення                    | `image_generate`                                           | Так                                                    |
| Відео                    | `video_generate`                                           | Так                                                    |
| Перетворення тексту на мовлення            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне перетворення мовлення на текст      | `tools.media.audio` / розуміння медіа                  | Так                                                    |
| Потокове перетворення мовлення на текст  | Голосовий виклик `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі            | Голосовий виклик `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Ембеддинги                | Провайдер ембеддингів пам’яті                                  | Так                                                    |

## Ембеддинги пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісну кінцеву точку ембеддингів для
індексації `memory_search` і ембеддингів запитів:

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

Для OpenAI-сумісних кінцевих точок, яким потрібні асиметричні мітки ембеддингів, установіть
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для провайдера поля запиту `input_type`: ембеддинги запитів використовують
`queryInputType`; індексовані фрагменти пам’яті та пакетна індексація використовують
`documentInputType`. Див. повний приклад у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

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

    | Посилання на модель              | Конфігурація середовища виконання             | Маршрут                       | Автентифікація             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Обв’язка сервера застосунку Codex    | Сервер застосунку Codex |

    <Note>
    `openai/*` є прямим маршрутом ключа API OpenAI, якщо ви явно не примусите
    обв’язку сервера застосунку Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний раннер PI або використовуйте `openai/gpt-5.5` з
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

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex з нативним виконанням сервером застосунку Codex замість окремого ключа API. Хмара Codex потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових налаштувань або середовищ, ворожих до callback, додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Використайте нативне середовище виконання Codex">
        ```bash
        openclaw config set plugins.entries.codex '{ enabled: true }' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{ id: "codex", fallback: "none" }' --strict-json
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
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Нативна обв’язка сервера застосунку Codex | Вхід Codex або вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо plugin явно не заявляє `openai-codex` | Вхід Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не вмикає автоматично вбудовану обв’язку app-server Codex. Для
    поширеного налаштування з підпискою і native runtime увійдіть через
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
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Щоб натомість залишити Codex OAuth на звичайному runner PI, використовуйте
    `openai-codex/gpt-5.5` і опустіть перевизначення runtime Codex.

    <Note>
    Onboarding більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через browser OAuth (типово) або через flow device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, який runtime моделі активний для поточної сесії.
    Типова обв’язка PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудовану обв’язку app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний ідентифікатор обв’язки, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований plugin `codex` увімкнено, коли вибрано маршрут `openai-codex/*`,
    `openclaw doctor` попереджає, що модель усе ще resolve через PI.
    Залишайте конфігурацію без змін лише тоді, коли цей маршрут автентифікації підписки PI
    є навмисним. Перейдіть на `openai/<model>` плюс `agentRuntime.id: "codex"`, коли
    потрібне native виконання app-server Codex.

    ### Ліміт контекстного вікна

    OpenClaw розглядає metadata моделі й ліміт runtime context як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Native `contextWindow`: `1000000`
    - Типовий ліміт runtime `contextTokens`: `272000`

    Менший типовий ліміт на практиці має кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголошувати native metadata моделі. Використовуйте `contextTokens`, щоб обмежувати бюджет runtime context.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує upstream metadata каталогу Codex для `gpt-5.5`, коли вона
    присутня. Якщо live discovery Codex пропускає рядок `openai-codex/gpt-5.5`, коли
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    cron, sub-agent і запуски з налаштованою типовою моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Native автентифікація app-server Codex

Native обв’язка app-server Codex використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але її автентифікація все одно базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід із підпискою ChatGPT/Codex не замінюється лише
через те, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Fallback через env API-key — це лише локальний шлях stdio без облікового запису; його
не надсилають до WebSocket-з’єднань app-server. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у породжений дочірній процес stdio app-server і надсилає вибрані облікові дані
через login RPC app-server.

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за OpenAI API-key, так і генерацію зображень через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | OpenAI API key                     | Codex OAuth                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Посилання на модель      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація           | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth              |
| Транспорт                | OpenAI Images API                  | Backend Codex Responses              |
| Макс. зображень на запит | 4                                  | 4                                    |
| Режим редагування        | Увімкнено (до 5 reference images)  | Увімкнено (до 5 reference images)    |
| Перевизначення розміру   | Підтримуються, включно з розмірами 2K/4K | Підтримуються, включно з розмірами 2K/4K |
| Aspect ratio / resolution | Не передається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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

`gpt-image-2` є типовим для генерації OpenAI text-to-image і редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI і
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні endpoints зберігають
свої налаштовані deployment/model names.

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
`openclaw infer image edit`, коли починаєте з input file.
`--openai-background` залишається доступним як alias, специфічний для OpenAI.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw resolve збережений access token OAuth
і надсилає запити зображень через backend Codex Responses. Він
не пробує спершу `OPENAI_API_KEY` і не виконує тихий fallback до API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
користувацьким base URL або Azure endpoint, коли натомість потрібен прямий маршрут OpenAI Images API.
Якщо цей користувацький image endpoint розташований у довіреній LAN/приватній адресі, також задайте
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
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Text-to-video, image-to-video, single-video edit                                  |
| Reference inputs | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримуються                                                                    |
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

OpenClaw додає спільний внесок промпта GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за model id, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудована native обв’язка Codex використовує ту саму поведінку GPT-5 і overlay heartbeat через developer instructions app-server Codex, тому сесії `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ті самі настанови follow-through і проактивного heartbeat, хоча Codex володіє рештою промпта обв’язки.

Внесок GPT-5 додає tagged behavior contract для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Channel-specific поведінка відповідей і silent-message залишається у спільному system prompt OpenClaw і outbound delivery policy. Настанови GPT-5 завжди увімкнені для відповідних моделей. Friendly interaction-style layer є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути friendly interaction-style layer |
| `"on"`                 | Alias для `"friendly"`                     |
| `"off"`                | Вимкнути лише friendly style layer         |

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
Під час runtime значення не залежать від регістру, тому `"Off"` і `"off"` обидва вимикають friendly style layer.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` досі читається як compatibility fallback, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для surface `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
    | Базовий URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об’єднується з JSON запиту `/audio/speech` після полів, згенерованих OpenClaw, тому використовуйте його для OpenAI-сумісних кінцевих точок, які потребують додаткових ключів, як-от `lang`. Ключі прототипу ігноруються.

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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрипції для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw всюди, де вхідна аудіотранскрипція використовує
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

    Підказки мови та промпта передаються в OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований plugin `openai` реєструє транскрипцію в реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований plugin `openai` реєструє голос у реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для бекенд-мостів реального часу. Підтримує двонапрямлені виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, виданим Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Жива перевірка супровідником доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI створює клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фіктивним медіа мікрофона, надсилає її в OpenAI і застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень шляхом перевизначення базового URL. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному часі**
у розділі [Голос і мовлення](#voice-and-speech) для його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є передплата Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете утримувати трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і задайте `apiKey` як
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
- Використовує шляхи з областю розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це типове значення.

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнають помилки з розгортаннями
зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб закріпити конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Імена моделей є іменами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **іменем розгортання Azure**, яке ви налаштували на порталі Azure, а не
публічним id моделі OpenAI.

Якщо ви створюєте розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імені розгортання застосовується до викликів генерації зображень, маршрутизованих через
вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` на `gpt-image-2`), або надавати їх лише в окремих версіях
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure зазнає помилки перевірки, перевірте
набір параметрів, підтримуваний вашим конкретним розгортанням і версією API, на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
прихованих заголовків атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (поза генерацією зображень) використовуйте
процес онбордингу або спеціальну конфігурацію провайдера Azure — одного лише `openai.baseUrl`
недостатньо, щоб підхопити форму API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує підхід WebSocket-first із резервним SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і повторних підключень
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

    Пов’язані документи OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw вмикає прогрів WebSocket типово для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

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

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
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
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не встановлює `supportsStore: false`)
    - Додає `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

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
    `responsesServerCompaction` керує лише додаванням `context_management`. Прямі моделі OpenAI Responses все одно примусово встановлюють `store: true`, якщо сумісність не встановлює `supportsStore: false`.
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
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Застосовується лише до запусків OpenAI і Codex сімейства GPT-5. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та маршрути, сумісні з OpenAI">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене міркування для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням переводять схеми інструментів у суворий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують менш сувору поведінку сумісності
    - Видаляють Completions `store` з ненативних payload `openai-completions`
    - Приймають розширений наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, як-от vLLM
    - Не примушують суворі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

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
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
