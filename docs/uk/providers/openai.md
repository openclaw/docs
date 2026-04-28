---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агентів GPT-5
summary: Використовуйте OpenAI в OpenClaw за допомогою ключів API або підписки Codex
title: OpenAI
x-i18n:
    generated_at: "2026-04-28T11:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає developer APIs для моделей GPT, а Codex також доступний як
кодувальний агент плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає
маршрут provider/auth; окреме налаштування runtime вибирає, хто виконує
вбудований цикл агента:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Обв'язка app-server Codex** — нативне виконання app-server Codex (моделі `openai/*` плюс `agents.defaults.agentRuntime.id: "codex"`)

OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Provider, модель, runtime і канал — це окремі шари. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                          | Використовуйте                                   | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Пряма оплата через API key                    | `openai/gpt-5.5`                                 | Установіть `OPENAI_API_KEY` або запустіть onboarding для API key OpenAI.      |
| GPT-5.5 з автентифікацією підписки ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Типовий маршрут PI для OAuth Codex. Найкращий перший вибір для налаштувань із підпискою. |
| GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Примусово використовує обв'язку app-server Codex для цього посилання на модель. |
| Генерація або редагування зображень           | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OAuth OpenAI Codex.                             |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите            | Шар              | Значення                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс provider  | Прямий маршрут OpenAI Platform API.                                                               |
| `openai-codex`                     | Префікс provider  | Маршрут OAuth/підписки OpenAI Codex через звичайний runner OpenClaw PI.                           |
| `codex` plugin                     | Plugin            | Вбудований plugin OpenClaw, який надає нативний runtime app-server Codex і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Runtime агента    | Примусово використати нативну обв'язку app-server Codex для вбудованих ходів.                     |
| `/codex ...`                       | Набір команд чату | Прив'язувати/керувати потоками app-server Codex із розмови.                                       |
| `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP | Явний запасний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
plugin `codex`. Це коректно, коли ви хочете OAuth Codex через PI і також хочете,
щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про цю
комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

<Note>
GPT-5.5 доступна як через прямий доступ OpenAI Platform за API key, так і через
маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
`OPENAI_API_KEY`, `openai-codex/gpt-5.5` для OAuth Codex через PI або
`openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативної обв'язки app-server
Codex.
</Note>

<Note>
Увімкнення plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований plugin app-server Codex. OpenClaw вмикає цей plugin лише
коли ви явно вибираєте нативну обв'язку Codex за допомогою
`agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований plugin `codex` увімкнено, але `openai-codex/*` все ще проходить
через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provider моделі `openai/<model>`                          | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`              | Так                                                    |
| Обв'язка app-server Codex | `openai/<model>` з `agentRuntime.id: codex`                | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                       | Так, коли вебпошук увімкнено й provider не закріплено  |
| Зображення                | `image_generate`                                           | Так                                                    |
| Відео                     | `video_generate`                                           | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`            | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа         | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`    | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Вбудовування              | provider вбудовувань пам'яті                              | Так                                                    |

## Вбудовування пам'яті

OpenClaw може використовувати OpenAI або сумісну з OpenAI кінцеву точку вбудовувань для
індексації `memory_search` і вбудовувань запитів:

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

Для сумісних з OpenAI кінцевих точок, які потребують асиметричних міток вбудовування, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для provider поля запиту `input_type`: вбудовування запитів використовують
`queryInputType`; індексовані фрагменти пам'яті та пакетна індексація використовують
`documentInputType`. Повний приклад див. у [довіднику конфігурації пам'яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу API й оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
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

    | Посилання на модель    | Конфігурація runtime       | Маршрут                     | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | пропущено / `agentRuntime.id: "pi"` | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | пропущено / `agentRuntime.id: "pi"` | Прямий OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Обв'язка app-server Codex   | app-server Codex |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API key, якщо ви явно не примушуєте
    використання обв'язки app-server Codex. Використовуйте `openai-codex/*` для OAuth Codex через
    типовий runner PI або використовуйте `openai/gpt-5.5` з
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
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless налаштувань або налаштувань, несприятливих до callback, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

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

    | Посилання на модель | Конфігурація runtime | Маршрут | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Все ще PI, якщо plugin явно не заявляє `openai-codex` | Вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Обв'язка app-server Codex | Auth app-server Codex |

    <Note>
    Продовжуйте використовувати id provider `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для OAuth Codex.
    Він не вибирає й автоматично не вмикає вбудовану обв'язку app-server Codex.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` не є підтримуваним маршрутом OAuth Codex. Використовуйте
    `openai/gpt-5.4-mini` з API key OpenAI або використовуйте
    `openai-codex/gpt-5.5` з OAuth Codex.
    </Warning>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор статусу

    Чат `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Типова обв'язка PI відображається як `Runtime: OpenClaw Pi Default`. Коли вибрано
    вбудовану обв'язку app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають свій записаний ідентифікатор обв'язки, тому використайте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут
    `openai-codex/*` цієї вкладки, `openclaw doctor` попереджає, що модель
    усе ще розв'язується через PI. Залиште конфігурацію без змін, якщо це
    очікуваний маршрут автентифікації за підпискою. Перемикайтеся на `openai/<model>` плюс
    `agentRuntime.id: "codex"` лише тоді, коли потрібне нативне виконання
    app-server Codex.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
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

    OpenClaw використовує upstream-метадані каталогу Codex для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, коли
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, під-агента та налаштованої типової моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація app-server Codex

Нативна обв'язка app-server Codex використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але її автентифікація все одно базується на обліковому записі. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив'язаний до агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але
   досі потребує автентифікації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише тому,
що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервне використання env API-ключа застосовується тільки до локального stdio-шляху без облікового запису; він
не надсилається до WebSocket-з'єднань app-server. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
дочірньому процесу spawned stdio app-server та надсилає вибрані облікові дані
через app-server login RPC.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за API-ключем OpenAI, так і генерацію
зображень через Codex OAuth за тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth              |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses               |
| Макс. зображень на запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 референсних зображень) | Увімкнено (до 5 референсних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
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

`gpt-image-2` є типовим для генерації зображень із тексту OpenAI та редагування
зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні endpoint зберігають
свої налаштовані імена deployment/моделі.

Той самий параметр доступний для headless-запусків CLI:

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

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли налаштовано
профіль OAuth `openai-codex`, OpenClaw розв'язує цей збережений access token OAuth
і надсилає запити зображень через бекенд Codex Responses. Він
не пробує спершу `OPENAI_API_KEY` і не виконує непомітний fallback на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
користувацьким базовим URL або endpoint Azure, коли потрібен прямий маршрут OpenAI Images API.
Якщо цей користувацький endpoint зображень розміщено в довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні endpoint зображень заблокованими, якщо це opt-in не
вказано.

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
| Референсні вхідні дані | 1 зображення або 1 відео                                                    |
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

OpenClaw додає спільний внесок промпта GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв'язка Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника app-server Codex, тому сеанси `openai/gpt-5.x`, примусово пропущені через `agentRuntime.id: "codex"`, зберігають ті самі вказівки щодо доведення завдань до кінця та проактивного Heartbeat, навіть якщо Codex володіє рештою промпта обв'язки.

Внесок GPT-5 додає тегований контракт поведінки для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і silent-message залишається у спільному системному промпті OpenClaw та політиці outbound-доставки. Вказівки GPT-5 завжди ввімкнено для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (типово) | Увімкнути дружній шар стилю взаємодії       |
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
Значення нечутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` досі читається як fallback сумісності, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на endpoint Chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції media-understanding OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw скрізь, де транскрипція вхідного аудіо використовує
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

    Підказки щодо мови та промпта передаються в OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований `openai` plugin реєструє транскрибування в реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований `openai` plugin реєструє голос у реальному часі для Voice Call plugin.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через конфігураційні ключі `azureEndpoint` і `azureDeployment` для бекендових мостів реального часу. Підтримує двоспрямовані виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з виданим Gateway
    ефемерним клієнтським секретом і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Жива перевірка для мейнтейнерів доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI видає клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фейковим медіа мікрофона, надсилає її в OpenAI та застосовує SDP-відповідь
    без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовуватися на ресурс Azure OpenAI для генерації
зображень шляхом перевизначення базової URL-адреси. У шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається
на форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у
реальному часі** у розділі [Голос і мовлення](#voice-and-speech) для його
налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете тримати трафік усередині наявного середовища Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` спрямуйте
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
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий таймаут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершаться помилкою з
розгортаннями зображень Azure.
</Note>

### Версія API

Встановіть `AZURE_OPENAI_API_VERSION`, щоб закріпити конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували в порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створюєте розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв розгортань застосовується до викликів генерації зображень, маршрутизованих через
вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише для конкретних версій
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваше конкретне розгортання та версія API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
процес онбордингу або спеціальну конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб підхопити форму API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон серверної Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує WebSocket насамперед із резервним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню невдачу WebSocket перед переходом на SSE
    - Після збою позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час паузи
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

    Пов’язані документи OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) потокова обгортка Pi-harness OpenAI plugin автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний app-server harness Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` керує лише інʼєкцією `context_management`. Прямі моделі OpenAI Responses все одно примусово використовують `store: true`, якщо сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий agentic-режим GPT">
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
    - Повторює хід із підказкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства OpenAI і Codex GPT-5. Інші провайдери та старіші сімейства моделей зберігають стандартну поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути й маршрути, сумісні з OpenAI">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні проксі `/v1`, сумісні з OpenAI:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене міркування для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням переводять схеми інструментів у суворий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність міркування, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують менш сувору поведінку сумісності
    - Вилучають Completions `store` з ненативних payload `openai-completions`
    - Приймають наскрізний JSON `params.extra_body`/`params.extraBody` для проксі Completions, сумісних з OpenAI
    - Приймають `params.chat_template_kwargs` для проксі Completions, сумісних з OpenAI, таких як vLLM
    - Не вмикають примусово суворі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

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
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
