---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію за підпискою Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI за допомогою ключів API або підписки Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T15:13:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як coding agent плану ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці поверхні окремо, щоб конфігурація залишалася передбачуваною.

OpenClaw використовує `openai/*` як канонічний маршрут моделей OpenAI. Вбудовані ходи агентів на моделях OpenAI за замовчуванням виконуються через нативне середовище виконання app-server Codex; пряма автентифікація API-ключем OpenAI залишається доступною для неагентних поверхонь OpenAI, таких як зображення, embeddings, мовлення та realtime.

- **Моделі агентів** - моделі `openai/*` через середовище виконання Codex; увійдіть з автентифікацією `openai-codex` для використання підписки ChatGPT/Codex або налаштуйте профіль API-ключа `openai-codex`, коли ви навмисно хочете автентифікацію API-ключем.
- **Неагентні API OpenAI** - прямий доступ до OpenAI Platform з оплатою за використання через `OPENAI_API_KEY` або onboarding API-ключа OpenAI.
- **Застаріла конфігурація** - посилання на моделі `openai-codex/*` виправляються командою `openclaw doctor --fix` на `openai/*` плюс середовище виконання Codex.

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Провайдер, модель, середовище виконання та канал - це окремі шари. Якщо ці мітки змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                          | Примітки                                                              |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-5.5`                                        | Стандартне налаштування агента OpenAI. Увійдіть з автентифікацією `openai-codex`. |
| Пряма оплата API-ключем для моделей агентів          | `openai/gpt-5.5` плюс профіль API-ключа `openai-codex`  | Використовуйте `auth.order.openai-codex`, щоб надати перевагу цьому профілю. |
| Пряма оплата API-ключем через явний PI               | `openai/gpt-5.5` плюс `agentRuntime.id: "pi"`           | Виберіть звичайний профіль API-ключа `openai`.                        |
| Найновіший alias ChatGPT Instant API                 | `openai/chat-latest`                                    | Лише прямий API-ключ. Рухомий alias для експериментів, не стандартний варіант. |
| Автентифікація підписки ChatGPT/Codex через явний PI | `openai/gpt-5.5` плюс `agentRuntime.id: "pi"`           | Виберіть профіль автентифікації `openai-codex` для маршруту сумісності. |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                    | Працює або з `OPENAI_API_KEY`, або з OpenAI Codex OAuth.              |
| Зображення з прозорим фоном                          | `openai/gpt-image-1.5`                                  | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Карта назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите              | Шар                 | Значення                                                                                          |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Префікс провайдера  | Канонічний маршрут моделей OpenAI; ходи агентів використовують середовище виконання Codex.        |
| `openai-codex`                     | Префікс автентифікації/профілю | Провайдер профілю автентифікації OpenAI Codex OAuth/підписки.                                     |
| Plugin `codex`                     | Plugin              | Вбудований Plugin OpenClaw, який надає нативне середовище виконання app-server Codex і елементи керування чатом `/codex`. |
| `agentRuntime.id: codex`           | Середовище виконання агента | Примусово використовує нативний app-server harness Codex для вбудованих ходів.                    |
| `/codex ...`                       | Набір команд чату   | Прив’язує/керує потоками app-server Codex із розмови.                                             |
| `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP   | Явний резервний шлях, який запускає Codex через ACP/acpx.                                         |

Це означає, що конфігурація може навмисно містити і посилання на моделі `openai/*`, і профілі автентифікації `openai-codex`. `openclaw doctor --fix` переписує застарілі посилання на моделі `openai-codex/*` на канонічний маршрут моделей OpenAI.

<Note>
GPT-5.5 доступна як через прямий доступ API-ключем OpenAI Platform, так і через маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex використовуйте `openai/gpt-5.5`; неналаштована конфігурація середовища виконання тепер вибирає harness Codex для ходів агентів OpenAI. Використовуйте профілі API-ключів OpenAI лише тоді, коли потрібна пряма автентифікація API-ключем для моделі агента OpenAI.
</Note>

<Note>
Ходи моделей агентів OpenAI потребують вбудованого Plugin app-server Codex. Явна конфігурація середовища виконання PI залишається доступною як опціональний маршрут сумісності. Коли PI явно вибрано з профілем автентифікації `openai-codex`, OpenClaw зберігає публічне посилання на модель як `openai/*` і внутрішньо маршрутизує PI через застарілий транспорт автентифікації Codex. Запустіть `openclaw doctor --fix`, щоб виправити застарілі посилання на моделі `openai-codex/*` або старі прив’язки сесій PI, які не походять із явної конфігурації середовища виконання.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                                 | Статус                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses           | Провайдер моделей `openai/<model>`                                | Так                                                    |
| Моделі підписки Codex     | `openai/<model>` з OAuth `openai-codex`                           | Так                                                    |
| Застарілі посилання на моделі Codex | `openai-codex/<model>`                                            | Виправляються doctor до `openai/<model>`               |
| Harness app-server Codex  | `openai/<model>` з пропущеним середовищем виконання або `agentRuntime.id: codex` | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                              | Так, коли вебпошук увімкнено і провайдера не закріплено |
| Зображення                | `image_generate`                                                  | Так                                                    |
| Відео                     | `video_generate`                                                  | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                         | Так                                                    |
| Пакетний speech-to-text   | `tools.media.audio` / розуміння медіа                             | Так                                                    |
| Потоковий speech-to-text  | Voice Call `streaming.provider: "openai"`                         | Так                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Так                                                    |
| Embeddings                | Провайдер embeddings пам’яті                                      | Так                                                    |

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або сумісний з OpenAI endpoint embeddings для індексування `memory_search` та embeddings запитів:

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

Для сумісних з OpenAI endpoint, які потребують асиметричних міток embeddings, задайте `queryInputType` і `documentInputType` у `memorySearch`. OpenClaw пересилає їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують `queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують `documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ із [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Посилання на модель    | Конфігурація середовища виконання | Маршрут                     | Автентифікація  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | пропущено / `agentRuntime.id: "codex"` | Harness app-server Codex | профіль `openai-codex` |
    | `openai/gpt-5.4-mini` | пропущено / `agentRuntime.id: "codex"` | Harness app-server Codex | профіль `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | Вбудоване середовище виконання PI | профіль `openai` або вибраний профіль `openai-codex` |

    <Note>
    Моделі агентів `openai/*` використовують harness app-server Codex. Щоб використовувати автентифікацію API-ключем для моделі агента, створіть профіль API-ключа `openai-codex` і впорядкуйте його через `auth.order.openai-codex`; `OPENAI_API_KEY` залишається прямим резервним варіантом для неагентних поверхонь API OpenAI.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Щоб спробувати поточну модель Instant ChatGPT з OpenAI API, задайте модель як `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` - це рухомий alias. OpenAI документує його як найновішу модель Instant, що використовується в ChatGPT, і рекомендує `gpt-5.5` для виробничого використання API, тому залишайте `openai/gpt-5.5` стабільним стандартним варіантом, якщо ви явно не хочете поведінку цього alias. Наразі alias приймає лише деталізацію тексту `medium`, тому OpenClaw нормалізує несумісні перевизначення деталізації тексту OpenAI для цієї моделі.

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Live-запити OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex із нативним виконанням app-server Codex замість окремого API-ключа. Хмара Codex потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несприятливих до callback налаштувань додайте `--device-code`, щоб увійти через device-code flow ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Використайте канонічний маршрут моделей OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для типового шляху конфігурація середовища виконання не потрібна. Ходи агента OpenAI
        автоматично вибирають нативне середовище виконання сервера застосунку Codex, а OpenClaw
        встановлює або відновлює вбудований Plugin Codex, коли вибрано цей маршрут.
      </Step>
      <Step title="Перевірте, що авторизація Codex доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Після запуску gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити нативне середовище виконання сервера застосунку.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація середовища виконання | Маршрут | Авторизація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | пропущено / `agentRuntime.id: "codex"` | Нативний каркас сервера застосунку Codex | Вхід у Codex або вибраний профіль `openai-codex` |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Вбудоване середовище виконання PI з внутрішнім транспортом авторизації Codex | Вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | відновлено doctor | Застарілий маршрут, переписаний на `openai/gpt-5.5` | Наявний профіль `openai-codex` |

    <Warning>
    Не налаштовуйте старіші посилання на моделі `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` або
    `openai-codex/gpt-5.3*`. Облікові записи ChatGPT/Codex OAuth тепер відхиляють
    ці моделі. Використовуйте `openai/gpt-5.5`; ходи агента OpenAI тепер типово вибирають середовище виконання Codex.
    </Warning>

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд авторизації/профілю. Префікс моделі
    `openai-codex/*` є застарілою конфігурацією, яку відновлює doctor. Для
    поширеного налаштування підписки з нативним середовищем виконання увійдіть через `openai-codex`,
    але залиште посилання на модель як `openai/gpt-5.5`.
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

    <Note>
    Онбординг більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через браузерний OAuth (типово) або потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі авторизації агента.
    </Note>

    ### Перевірка й відновлення маршрутизації Codex OAuth

    Використайте ці команди, щоб побачити, яку модель, середовище виконання та маршрут авторизації використовує ваш типовий
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

    Якщо старіша конфігурація все ще містить `openai-codex/gpt-*` або застаріле закріплення сеансу OpenAI PI
    без явної конфігурації середовища виконання, відновіть її:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Якщо `models auth list --provider openai-codex` не показує придатного профілю, увійдіть
    знову:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` лишається ідентифікатором провайдера авторизації/профілю. `openai/*` є
    маршрутом моделі для ходів агента OpenAI через Codex.

    ### Індикатор стану

    Чатова команда `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Вбудований каркас сервера застосунку Codex відображається як `Runtime: OpenAI Codex` для
    ходів моделі агента OpenAI. Застарілі закріплення сеансу PI відновлюються до Codex, якщо
    конфігурація явно не закріплює PI.

    ### Попередження doctor

    Якщо маршрути `openai-codex/*` або застарілі закріплення OpenAI PI залишаються в конфігурації чи
    стані сеансу, `openclaw doctor --fix` переписує їх на `openai/*` із
    середовищем виконання Codex, якщо PI не налаштовано явно.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai/gpt-5.5` через каталог Codex OAuth:

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
    наявні. Якщо live-виявлення Codex пропускає рядок `gpt-5.5`, тоді як
    обліковий запис авторизовано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, субагента та налаштованої типової моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна авторизація сервера застосунку Codex

Нативний каркас сервера застосунку Codex використовує посилання на моделі `openai/*` плюс пропущену
конфігурацію середовища виконання або `agentRuntime.id: "codex"`, але його авторизація все одно
базується на обліковому записі. OpenClaw
вибирає авторизацію в такому порядку:

1. Явний профіль авторизації OpenClaw `openai-codex`, прив’язаний до агента.
2. Наявний обліковий запис сервера застосунку, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio сервера застосунку: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли сервер застосунку повідомляє, що облікового запису немає, але все ще потребує
   авторизації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише
тому, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний API-ключ із середовища використовується лише для локального stdio-шляху без облікового запису; він
не надсилається до WebSocket-з’єднань сервера застосунку. Коли вибрано профіль Codex
підпискового типу, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
у дочірній процес stdio сервера застосунку, який запускається, і надсилає вибрані облікові дані
через RPC входу сервера застосунку.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує генерацію зображень як з API-ключем OpenAI, так і через Codex OAuth
за допомогою того самого посилання на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Авторизація                      | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth           |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses              |
| Макс. зображень на запит    | 4                                  | 4                                    |
| Режим редагування                 | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень)   |
| Перевизначення розміру            | Підтримуються, включно з розмірами 2K/4K   | Підтримуються, включно з розмірами 2K/4K     |
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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструментів, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є типовою моделлю як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними
як явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і спеціальні OpenAI-сумісні endpoints зберігають
свої налаштовані назви розгортань/моделей.

Той самий параметр доступний для безголових запусків CLI:

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

Для інсталяцій Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw розв’язує збережений OAuth
access token і надсилає запити зображень через бекенд Codex Responses. Він
не пробує спершу `OPENAI_API_KEY` і не виконує непомітний перехід на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
спеціальною базовою URL-адресою або endpoint Azure, коли потрібен прямий маршрут OpenAI Images API.
Якщо цей спеціальний endpoint зображень розташований у довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні endpoints зображень заблокованими, якщо цього opt-in немає.

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

| Можливість       | Значення                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими            | Текст-у-відео, зображення-у-відео, редагування одного відео                                  |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                                |
| Перевизначення розміру   | Підтримуються                                                                         |
| Інші перевизначення  | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструментів, вибору провайдера та поведінки failover.
</Note>

## Внесок prompt GPT-5

OpenClaw додає спільний внесок prompt GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тож `openai/gpt-5.5`, застарілі посилання до відновлення, як-от `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний каркас Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника сервера застосунку Codex, тож сеанси `openai/gpt-5.x`, примусово проведені через `agentRuntime.id: "codex"`, зберігають ті самі настанови щодо доведення справ до кінця й проактивного Heartbeat, навіть якщо Codex керує рештою prompt каркаса.

Внесок GPT-5 додає тегований поведінковий контракт для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для окремих каналів і тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                       |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Увімкнути дружній шар стилю взаємодії       |
| `"on"`                 | Псевдонім для `"friendly"`                  |
| `"off"`                | Вимкнути лише дружній стильовий шар         |

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
Значення не чутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній стильовий шар.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` досі читається як резервна сумісність, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Вбудований плагін `openai` реєструє синтез мовлення для поверхні `messages.tts`.

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

    `extraBody` об’єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для OpenAI-сумісних кінцевих точок, яким потрібні додаткові ключі, наприклад `lang`. Ключі прототипу ігноруються.

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

  <Accordion title="Speech-to-text">
    Вбудований плагін `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції розуміння медіа OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вводу: завантаження аудіофайлу через multipart
    - Підтримується OpenClaw всюди, де вхідна аудіотранскрипція використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і
      аудіовкладення каналів

    Щоб примусово використовувати OpenAI для вхідної аудіотранскрипції:

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

    Підказки мови та промпта передаються до OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований плагін `openai` реєструє транскрипцію в реальному часі для плагіна Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований плагін `openai` реєструє голос у реальному часі для плагіна Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment` для backend-мостів реального часу. Підтримує двонапрямне викликання інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сесії OpenAI у реальному часі з
    ефемерним клієнтським секретом, випущеним Gateway, і прямим браузерним
    WebRTC SDP-обміном з OpenAI Realtime API. Maintainer-перевірка наживо доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілка OpenAI випускає клієнтський секрет у Node, генерує браузерну SDP-пропозицію
    з фейковим медіа мікрофона, надсилає її до OpenAI і застосовує SDP-відповідь
    без логування секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень, якщо перевизначити базову URL-адресу. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається
на форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Дивіться акордеон **Realtime
voice** у розділі [Голос і мовлення](#voice-and-speech), щоб переглянути його параметри
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібні регіональна резидентність даних або засоби контролю відповідності, які надає Azure
- Ви хочете залишити трафік усередині наявного тенанта Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` спрямуйте
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
- Використовує шляхи, прив’язані до deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнають збою з deployment зображень
Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб закріпити конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створюєте deployment із назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` на `gpt-image-2`), або надавати їх лише в конкретних версіях
моделі. Ці відмінності походять від Azure і базової моделі, а не від OpenClaw.
Якщо запит Azure завершується помилкою валідації, перевірте набір параметрів,
підтримуваний вашим конкретним deployment і версією API в порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — дивіться акордеон **Native vs OpenAI-compatible
routes** у розділі [Розширена конфігурація](#advanced-configuration).

Для chat- або Responses-трафіку в Azure (поза генерацією зображень) використовуйте
потік onboarding або спеціальну конфігурацію провайдера Azure — сам лише `openai.baseUrl`
не підхоплює форму Azure API/auth. Існує окремий
провайдер `azure-openai-responses/*`; дивіться акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним SSE (`"auto"`) для `openai/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом до SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та turn для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (default) | Спершу WebSocket, резервний SSE |
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
          },
        },
      },
    }
    ```

    Пов’язані документи OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Підігрів WebSocket">
    OpenClaw типово вмикає підігрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

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
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не перезаписує `reasoning` або `text.verbosity`.

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
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI сеансів повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
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
    `serviceTier` пересилається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви спрямовуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Серверна Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає серверну Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо недоступно)

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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
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
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із підказкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запусками сімейства GPT-5 для OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути порівняно з OpenAI-сумісними">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та універсальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово переводять схеми інструментів у строгий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу поведінку сумісності
    - Видаляють Completions `store` з ненативних payload `openai-completions`
    - Приймають розширений наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують строгі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

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
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
