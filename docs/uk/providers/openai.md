---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через передплату Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через ключі API або передплату Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-01T22:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd9a8f05d31800354307c6fd7beb8cd1eed3d234e5c1e939e895cd99658b540b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає developer API для моделей GPT, а Codex також доступний як агент для програмування в плані ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає маршрут провайдера/автентифікації; окреме налаштування runtime вибирає, хто виконує вбудований цикл агента:

- **Ключ API** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)
- **Обв’язка Codex app-server** — нативне виконання Codex app-server (моделі `openai/*` плюс `agents.defaults.agentRuntime.id: "codex"`)

OpenAI явно підтримує використання OAuth за підпискою в зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

Провайдер, модель, runtime і канал — це окремі шари. Якщо ці мітки змішуються між собою, прочитайте [runtime агентів](/uk/concepts/agent-runtimes), перш ніж змінювати конфігурацію.

## Швидкий вибір

| Ціль                                          | Використовуйте                                  | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Пряма оплата за ключем API                    | `openai/gpt-5.5`                                 | Установіть `OPENAI_API_KEY` або запустіть onboarding ключа API OpenAI.       |
| GPT-5.5 з автентифікацією підписки ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Стандартний маршрут PI для OAuth Codex. Найкращий перший вибір для налаштувань із підпискою. |
| GPT-5.5 з нативною поведінкою Codex app-server | `openai/gpt-5.5` плюс `agentRuntime.id: "codex"` | Примусово вмикає обв’язку Codex app-server для цього посилання на модель.    |
| Генерація або редагування зображень           | `openai/gpt-image-2`                             | Працює з `OPENAI_API_KEY` або OAuth OpenAI Codex.                            |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                           | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите             | Шар              | Значення                                                                                          |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс провайдера | Прямий маршрут API OpenAI Platform.                                                              |
| `openai-codex`                     | Префікс провайдера | Маршрут OAuth/підписки OpenAI Codex через звичайний runner OpenClaw PI.                          |
| Plugin `codex`                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативний runtime Codex app-server і керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Runtime агента    | Примусово використовує нативну обв’язку Codex app-server для вбудованих ходів.                   |
| `/codex ...`                       | Набір команд чату | Прив’язує/керує потоками Codex app-server з розмови.                                             |
| `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP | Явний fallback-шлях, який запускає Codex через ACP/acpx.                                         |

Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і Plugin `codex`. Це коректно, коли потрібен OAuth Codex через PI, а також доступне нативне керування чатом `/codex`. `openclaw doctor` попереджає про таку комбінацію, щоб ви могли підтвердити, що вона навмисна; він не переписує її.

<Note>
GPT-5.5 доступна як через прямий доступ за ключем API OpenAI Platform, так і через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для OAuth Codex через PI або `openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативної обв’язки Codex app-server.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не вмикає вбудований Plugin Codex app-server. OpenClaw вмикає цей Plugin лише тоді, коли ви явно вибираєте нативну обв’язку Codex за допомогою `agentRuntime.id: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
Якщо вбудований Plugin `codex` увімкнено, але `openai-codex/*` усе ще визначається через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                          | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses           | Провайдер моделей `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`              | Так                                                    |
| Обв’язка Codex app-server | `openai/<model>` з `agentRuntime.id: codex`                | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                       | Так, коли вебпошук увімкнено і провайдер не закріплено |
| Зображення                | `image_generate`                                           | Так                                                    |
| Відео                     | `video_generate`                                           | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне speech-to-text    | `tools.media.audio` / розуміння медіа                      | Так                                                    |
| Потокове speech-to-text   | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                    |
| Embeddings                | Провайдер embedding для пам’яті                            | Так                                                    |

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або сумісний з OpenAI endpoint embeddings для індексації `memory_search` і embeddings запитів:

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

Для сумісних з OpenAI endpoint, які потребують асиметричних міток embeddings, задайте `queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують `queryInputType`; проіндексовані фрагменти пам’яті та пакетна індексація використовують `documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте ключ API">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Посилання на модель   | Конфігурація runtime       | Маршрут                     | Автентифікація  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Обв’язка Codex app-server  | Codex app-server |

    <Note>
    `openai/*` — це прямий маршрут ключа API OpenAI, якщо ви явно не примусите використання обв’язки Codex app-server. Використовуйте `openai-codex/*` для OAuth Codex через стандартний runner PI або `openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативного виконання Codex app-server.
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
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого ключа API. Codex cloud потребує входу ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або налаштувань, де callback незручний, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть стандартну модель">
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

    | Посилання на модель | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо Plugin явно не оголошує `openai-codex` | Вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Обв’язка Codex app-server | Автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати id провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі `openai-codex/*` також є явним маршрутом PI для OAuth Codex. Він не вибирає і не вмикає автоматично вбудовану обв’язку Codex app-server.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріал OAuth з `~/.codex`. Увійдіть через OAuth у браузері (стандартно) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор статусу

    Chat `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Стандартна обв’язка PI відображається як `Runtime: OpenClaw Pi Default`. Коли вибрано
    вбудовану обв’язку Codex app-server, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний ідентифікатор обв’язки, тому використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження Doctor

    Якщо вбудований Plugin `codex` увімкнено, коли вибрано маршрут
    `openai-codex/*` цієї вкладки, `openclaw doctor` попереджає, що модель
    досі визначається через PI. Залиште конфігурацію без змін, якщо це
    очікуваний маршрут автентифікації за підпискою. Перемикайтеся на `openai/<model>` плюс
    `agentRuntime.id: "codex"` лише тоді, коли потрібне нативне виконання
    Codex app-server.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартне обмеження `contextTokens` середовища виконання: `272000`

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

    OpenClaw використовує метадані upstream-каталогу Codex для `gpt-5.5`, коли вони
    наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, коли
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    cron, субагент і запуски зі сконфігурованою стандартною моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація Codex app-server

Нативна обв’язка Codex app-server використовує посилання на моделі `openai/*` плюс
`agentRuntime.id: "codex"`, але її автентифікація все одно прив’язана до облікового запису. OpenClaw
вибирає автентифікацію в такому порядку:

1. Явний профіль автентифікації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише
через те, що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний env API-ключ використовується лише для локального stdio-шляху без облікового запису; він
не надсилається до WebSocket-з’єднань app-server. Коли вибрано профіль Codex
підпискового типу, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у породжений дочірній процес stdio app-server і надсилає вибрані облікові дані
через RPC входу app-server.

## Генерування зображень

Вбудований Plugin `openai` реєструє генерування зображень через інструмент `image_generate`.
Він підтримує як генерування зображень за API-ключем OpenAI, так і генерування зображень через Codex OAuth
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Посилання на модель      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація           | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                | OpenAI Images API                  | Backend Codex Responses              |
| Макс. зображень на запит | 4                                  | 4                                    |
| Режим редагування        | Увімкнено (до 5 референсних зображень) | Увімкнено (до 5 референсних зображень) |
| Перевизначення розміру   | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Генерування зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є стандартним для генерування зображень із тексту OpenAI і для редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` лишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoints зберігають
сконфігуровані назви deployment/моделей.

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
`--openai-background` лишається доступним як специфічний для OpenAI псевдонім.

Для встановлень Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає збережений access token OAuth
і надсилає запити зображень через backend Codex Responses. Він
спершу не пробує `OPENAI_API_KEY` і не виконує тихий fallback до API-ключа для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власною базовою URL-адресою або endpoint Azure, коли потрібен прямий маршрут OpenAI Images API
натомість.
Якщо цей власний endpoint зображень розташований у довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні endpoints зображень заблокованими, якщо цього opt-in
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

## Генерування відео

Вбудований Plugin `openai` реєструє генерування відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                   |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Референсні вхідні дані | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                                     |
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
Див. [Генерування відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок GPT-5 у prompt

OpenClaw додає спільний внесок GPT-5 у prompt для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x не отримують.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника Codex app-server, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення справ до кінця й проактивного Heartbeat, хоча рештою prompt обв’язки керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей, специфічна для каналу, і поведінка silent-message лишаються у спільному системному prompt OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди увімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (стандартно) | Увімкнути дружній шар стилю взаємодії      |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише дружній шар стилю            |

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
Застарілий `plugins.entries.openai.config.personality` досі читається як fallback сумісності, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | fallback до `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об’єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тому використовуйте його для OpenAI-сумісних endpoints, які потребують додаткових ключів, як-от `lang`. Prototype-ключі ігноруються.

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS, не впливаючи на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрипції media-understanding OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрибування вхідного аудіо використовує
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

    Підказки щодо мови та промпта передаються до OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрибування окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Стандартне значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Промпт | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Використовує з'єднання WebSocket із `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Стандартне значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для серверних мостів реального часу. Підтримує двоспрямовані виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, створеним Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Жива перевірка для супровідників доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI створює клієнтський секрет у Node, генерує браузерну пропозицію SDP
    з фейковим мікрофонним медіа, надсилає її до OpenAI і застосовує відповідь SDP
    без логування секретів.
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
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете залишити трафік усередині наявного тенанта Azure

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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи з областю deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує стандартний тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику й далі перевизначають це стандартне значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершаться помилкою з
deployment зображень Azure.
</Note>

### Версія API

Встановіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Стандартне значення — `2024-12-01-preview`, коли змінну не встановлено.

### Назви моделей є назвами deployment

Azure OpenAI прив'язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували на порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створюєте deployment із назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

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
набір параметрів, який підтримують ваш конкретний deployment і версія API на
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
прихованих заголовків атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
процес onboarding або спеціальну конфігурацію провайдера Azure — самого лише
`openai.baseUrl` недостатньо, щоб застосувати форму Azure API/auth. Існує окремий
провайдер `azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує WebSocket як пріоритетний варіант із запасним SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню невдалу спробу WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та turn для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (стандартно) | Спочатку WebSocket, SSE як запасний варіант |
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

  <Accordion title="Прогрівання WebSocket">
    OpenClaw стандартно вмикає прогрівання WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого turn.

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
    Перевизначення сесії мають перевагу над конфігурацією. Очищення перевизначення сесії в Sessions UI повертає сесію до налаштованого стандартного значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Встановіть її для кожної моделі в OpenClaw:

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

  <Accordion title="Серверна Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) потокова обгортка Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо model compat не встановлює `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Стандартне значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до hooks провайдера OpenAI, які використовують вбудовані запуски. Нативний app-server harness Codex керує власним контекстом через Codex і налаштовується окремо за допомогою `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` керує лише інʼєкцією `context_management`. Прямі моделі OpenAI Responses усе одно примусово використовують `store: true`, якщо шар сумісності не встановлює `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Строгий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати строгіший вбудований контракт виконання:

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
    - Повторює хід зі скеровуванням діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства OpenAI і Codex GPT-5. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж універсальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, що підтримують рівень зусиль OpenAI `none`
    - Пропускають вимкнене міркування для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне лише для OpenAI (`service_tier`, `store`, сумісність міркування, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують вільнішу поведінку сумісності
    - Вилучають Completions `store` з ненативних корисних навантажень `openai-completions`
    - Приймають розширений наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують строгі схеми інструментів або лише нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відновлення після збою.
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
