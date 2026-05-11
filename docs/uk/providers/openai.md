---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI за допомогою ключів API або передплати Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як агент для програмування в межах плану ChatGPT через клієнти Codex від OpenAI. OpenClaw зберігає ці поверхні окремими, щоб конфігурація залишалася передбачуваною.

OpenClaw використовує `openai/*` як канонічний маршрут моделей OpenAI. Вбудовані ходи агента на моделях OpenAI за замовчуванням виконуються через нативне середовище виконання app-server Codex; пряма автентифікація ключем OpenAI API залишається доступною для неагентних поверхонь OpenAI, як-от зображення, embeddings, мовлення та realtime.

- **Моделі агентів** - моделі `openai/*` через середовище виконання Codex; увійдіть через автентифікацію Codex для використання підписки ChatGPT/Codex або налаштуйте Codex-сумісний резервний ключ OpenAI API, якщо ви навмисно хочете автентифікацію ключем API.
- **Неагентні API OpenAI** - прямий доступ до OpenAI Platform з оплатою за використання через `OPENAI_API_KEY` або онбординг ключа OpenAI API.
- **Застаріла конфігурація** - посилання на моделі `openai-codex/*` виправляються командою `openclaw doctor --fix` до `openai/*` плюс середовище виконання Codex.

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

Провайдер, модель, середовище виконання та канал - це окремі шари. Якщо ці мітки змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                           | Примітки                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Підписка ChatGPT/Codex з нативним середовищем виконання Codex | `openai/gpt-5.5`                                         | Стандартне налаштування агента OpenAI. Увійдіть через автентифікацію Codex. |
| Пряма оплата ключем API для моделей агентів          | `openai/gpt-5.5` плюс Codex-сумісний профіль ключа API   | Використовуйте `auth.order.openai`, щоб розмістити резерв після автентифікації підписки. |
| Пряма оплата ключем API через явний PI               | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `pi` | Виберіть звичайний профіль ключа API `openai`.                         |
| Найновіший API-псевдонім ChatGPT Instant             | `openai/chat-latest`                                     | Лише прямий ключ API. Рухомий псевдонім для експериментів, не стандартне значення. |
| Автентифікація підписки ChatGPT/Codex через явний PI  | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `pi` | Виберіть профіль автентифікації `openai-codex` для маршруту сумісності. |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                     | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.             |
| Зображення з прозорим фоном                          | `openai/gpt-image-1.5`                                   | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                    | Шар                        | Значення                                                                                                             |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Префікс провайдера         | Канонічний маршрут моделей OpenAI; ходи агента використовують середовище виконання Codex.                            |
| `openai-codex`                          | Застарілий префікс автентифікації/профілю | Старіший простір імен профілю OAuth/підписки OpenAI Codex. Наявні профілі та `auth.order.openai-codex` досі працюють. |
| Plugin `codex`                          | Plugin                     | Вбудований Plugin OpenClaw, що надає нативне середовище виконання app-server Codex і елементи керування чатом `/codex`. |
| провайдер/модель `agentRuntime.id: codex` | Середовище виконання агента | Примусово використовує нативний harness app-server Codex для відповідних вбудованих ходів.                          |
| `/codex ...`                            | Набір команд чату          | Прив’язує/керує потоками app-server Codex із розмови.                                                                |
| `runtime: "acp", agentId: "codex"`      | Маршрут сеансу ACP         | Явний резервний шлях, який запускає Codex через ACP/acpx.                                                            |

Це означає, що конфігурація може навмисно містити посилання на моделі `openai/*`, тоді як профілі автентифікації все ще вказують на Codex-сумісні облікові дані. Для нової конфігурації надавайте перевагу `auth.order.openai`; наявні профілі `openai-codex:*` і `auth.order.openai-codex` залишаються підтримуваними. `openclaw doctor --fix` переписує застарілі посилання на моделі `openai-codex/*` до канонічного маршруту моделей OpenAI.

<Note>
GPT-5.5 доступна як через прямий доступ ключем API OpenAI Platform, так і через маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex використовуйте `openai/gpt-5.5`; неналаштована конфігурація середовища виконання тепер вибирає harness Codex для ходів агентів OpenAI. Використовуйте профілі ключів OpenAI API лише тоді, коли потрібна пряма автентифікація ключем API для моделі агента OpenAI.
</Note>

<Note>
Ходи моделі агента OpenAI потребують вбудованого Plugin app-server Codex. Явна конфігурація середовища виконання PI залишається доступною як опційний маршрут сумісності. Коли PI явно вибрано з профілем автентифікації `openai-codex`, OpenClaw зберігає публічне посилання на модель як `openai/*` і внутрішньо маршрутизує PI через застарілий транспорт автентифікації Codex. Запустіть `openclaw doctor --fix`, щоб виправити застарілі посилання на моделі `openai-codex/*` або старі прив’язки сеансів PI, які не походять з явної конфігурації середовища виконання.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                                                 | Статус                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | провайдер моделі `openai/<model>`                                                | Так                                                    |
| Моделі підписки Codex     | `openai/<model>` з OAuth `openai-codex`                                          | Так                                                    |
| Застарілі посилання на моделі Codex | `openai-codex/<model>`                                                           | Виправляються doctor до `openai/<model>`               |
| Harness app-server Codex  | `openai/<model>` з пропущеним середовищем виконання або провайдером/моделлю `agentRuntime.id: codex` | Так                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                                             | Так, коли вебпошук увімкнено й провайдера не закріплено |
| Зображення                | `image_generate`                                                                 | Так                                                    |
| Відео                     | `video_generate`                                                                 | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`                                        | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа                                            | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`                                        | Так                                                    |
| Голос realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Так                                                    |
| Embeddings                | провайдер embeddings пам’яті                                                     | Так                                                    |

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або OpenAI-сумісну endpoint embeddings для індексування `memory_search` і embeddings запитів:

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

Для OpenAI-сумісних endpoint, які потребують асиметричних міток embeddings, задайте `queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують `queryInputType`; індексовані фрагменти пам’яті та пакетне індексування використовують `documentInputType`. Повний приклад див. у [довіднику конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

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
    | `openai/gpt-5.5`      | пропущено / провайдер/модель `agentRuntime.id: "codex"` | Harness app-server Codex | Codex-сумісний профіль OpenAI |
    | `openai/gpt-5.4-mini` | пропущено / провайдер/модель `agentRuntime.id: "codex"` | Harness app-server Codex | Codex-сумісний профіль OpenAI |
    | `openai/gpt-5.5`      | провайдер/модель `agentRuntime.id: "pi"`              | Вбудоване середовище виконання PI | профіль `openai` або вибраний профіль `openai-codex` |

    <Note>
    Моделі агентів `openai/*` використовують harness app-server Codex. Щоб використовувати автентифікацію ключем API для моделі агента, створіть Codex-сумісний профіль ключа API й упорядкуйте його через `auth.order.openai`; `OPENAI_API_KEY` залишається прямим резервом для неагентних поверхонь OpenAI API. Старіші записи `auth.order.openai-codex` досі працюють.
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

    `chat-latest` - це рухомий псевдонім. OpenAI документує його як найновішу модель Instant, що використовується в ChatGPT, і рекомендує `gpt-5.5` для виробничого використання API, тому залишайте `openai/gpt-5.5` стабільним стандартним значенням, якщо вам явно не потрібна поведінка цього псевдоніма. Наразі псевдонім приймає лише текстову докладність `medium`, тому OpenClaw нормалізує несумісні перевизначення текстової докладності OpenAI для цієї моделі.

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex із нативним виконанням на app-server Codex замість окремого API-ключа. Хмара Codex вимагає входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback налаштувань додайте `--device-code`, щоб увійти через device-code flow ChatGPT замість browser callback localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Використайте канонічний маршрут моделі OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для типового шляху конфігурація runtime не потрібна. Ходи агента OpenAI
        автоматично вибирають нативний runtime app-server Codex, а OpenClaw
        встановлює або відновлює вбудований plugin Codex, коли вибрано цей маршрут.
      </Step>
      <Step title="Перевірте, що автентифікація Codex доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Після запуску gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити нативний runtime app-server.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | пропущено / provider/model `agentRuntime.id: "codex"` | Нативний harness app-server Codex | Вхід Codex або впорядкований профіль автентифікації `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Вбудований runtime PI з внутрішнім транспортом Codex-auth | Вибраний профіль `openai-codex` |
    | `openai-codex/gpt-5.5` | відновлено doctor | Застарілий маршрут, переписаний на `openai/gpt-5.5` | Наявний профіль `openai-codex` |

    <Warning>
    Не налаштовуйте старіші посилання на моделі `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` або
    `openai-codex/gpt-5.3*`. Облікові записи ChatGPT/Codex OAuth тепер відхиляють
    ці моделі. Використовуйте `openai/gpt-5.5`; ходи агента OpenAI тепер типово вибирають runtime Codex.
    </Warning>

    <Note>
    Префікс моделі `openai-codex/*` є застарілою конфігурацією, яку відновлює doctor. Для
    поширеного налаштування з підпискою та нативним runtime увійдіть через автентифікацію Codex,
    але залиште посилання на модель як `openai/gpt-5.5`. Нова конфігурація має розміщувати порядок
    автентифікації агента OpenAI у `auth.order.openai`; старіші записи `auth.order.openai-codex`
    залишаються чинними.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    З резервним API-ключем залиште модель на `openai/gpt-5.5` і розмістіть
    порядок автентифікації в `openai`. OpenClaw спершу спробує підписку, потім
    API-ключ, залишаючись у harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріал OAuth із `~/.codex`. Увійдіть через browser OAuth (типово) або device-code flow вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Перевірка та відновлення маршрутизації Codex OAuth

    Використайте ці команди, щоб побачити, яку модель, runtime і маршрут автентифікації використовує ваш типовий
    агент:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Для конкретного агента додайте `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Якщо старіша конфігурація досі має `openai-codex/gpt-*` або застаріле закріплення сесії OpenAI PI
    без явної конфігурації runtime, відновіть її:

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

    `openai/*` — це маршрут моделі для ходів агента OpenAI через Codex. Ідентифікатор
    провайдера автентифікації/профілю `openai-codex` залишається прийнятним для наявних
    профілів і списків CLI.

    ### Індикатор стану

    Чатова команда `/status` показує, який runtime моделі активний для поточної сесії.
    Вбудований harness app-server Codex відображається як `Runtime: OpenAI Codex` для
    ходів моделей агента OpenAI. Застарілі закріплення сесій PI відновлюються до Codex, якщо
    конфігурація явно не закріплює PI.

    ### Попередження doctor

    Якщо маршрути `openai-codex/*` або застарілі закріплення OpenAI PI залишаються в конфігурації чи
    стані сесії, `openclaw doctor --fix` переписує їх на `openai/*` із runtime Codex, якщо PI
    не налаштовано явно.

    ### Обмеження контекстного вікна

    OpenClaw розглядає metadata моделі та обмеження runtime context як окремі значення.

    Для `openai/gpt-5.5` через каталог Codex OAuth:

    - Нативне `contextWindow`: `1000000`
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
    Використовуйте `contextWindow`, щоб оголосити нативні metadata моделі. Використовуйте `contextTokens`, щоб обмежити бюджет runtime context.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує upstream metadata каталогу Codex для `gpt-5.5`, коли вони
    наявні. Якщо live discovery Codex пропускає рядок `gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    запуски cron, sub-agent і налаштованої типової моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація app-server Codex

Нативний harness app-server Codex використовує посилання на моделі `openai/*` плюс пропущену
конфігурацію runtime або provider/model `agentRuntime.id: "codex"`, але його автентифікація
все ще базується на обліковому записі. OpenClaw вибирає автентифікацію в такому порядку:

1. Впорядковані профілі автентифікації OpenAI для агента, бажано в
   `auth.order.openai`. Наявні профілі `openai-codex:*` і
   `auth.order.openai-codex` залишаються чинними для старіших інсталяцій.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків app-server stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід за підпискою ChatGPT/Codex не замінюється лише
тому, що процес gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний API-ключ із env використовується лише в локальному stdio-шляху без облікового запису; він
не надсилається до WebSocket-з'єднань app-server. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також прибирає `CODEX_API_KEY` і `OPENAI_API_KEY`
із породженого дочірнього процесу stdio app-server і надсилає вибрані облікові дані
через RPC входу app-server. Коли цей профіль підписки заблоковано
лімітом використання Codex, OpenClaw може перейти до наступного впорядкованого профілю API-ключа `openai:*`
без зміни вибраної моделі або виходу з harness Codex. Після проходження часу скидання підписки
профіль підписки знову стає придатним.

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень через API-ключ OpenAI, так і генерацію зображень через Codex OAuth
за допомогою того самого посилання на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація                      | `OPENAI_API_KEY`                   | Вхід OpenAI Codex OAuth           |
| Транспорт                 | OpenAI Images API                  | backend Codex Responses              |
| Максимум зображень на запит    | 4                                  | 4                                    |
| Режим редагування                 | Увімкнено (до 5 референсних зображень) | Увімкнено (до 5 референсних зображень)   |
| Перевизначення розміру            | Підтримуються, зокрема розміри 2K/4K   | Підтримуються, зокрема розміри 2K/4K     |
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

`gpt-image-2` є типовим для генерації зображень із тексту OpenAI та редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
все ще приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні endpoints зберігають
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
`openclaw infer image edit`, коли починаєте з вхідного файлу.
`--openai-background` залишається доступним як специфічний для OpenAI alias.

Для інсталяцій Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw розв'язує цей збережений access token OAuth
і надсилає запити зображень через backend Codex Responses. Він
не пробує спершу `OPENAI_API_KEY` і не переходить мовчки на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власним base URL або Azure endpoint, коли потрібен прямий маршрут OpenAI Images API.
Якщо цей власний image endpoint перебуває в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні image endpoints заблокованими, якщо ця opt-in опція
відсутня.

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
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Референсні вхідні дані | 1 зображення або 1 відео                                                     |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки failover.
</Note>

## Внесок промпта GPT-5

OpenClaw додає спільний внесок промпта GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тому `openai/gpt-5.5`, застарілі refs до repair, як-от `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, та інші сумісні refs GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x не отримують його.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay heartbeat через інструкції розробника app-server Codex, тому сеанси `openai/gpt-5.x`, спрямовані через Codex, зберігають ті самі настанови щодо доведення дій до кінця та проактивного heartbeat, хоча рештою промпта harness володіє Codex.

Внесок GPT-5 додає тегований контракт поведінки для сталості persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і тихих повідомлень лишається у спільному системному промпті OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (за замовчуванням) | Увімкнути дружній шар стилю взаємодії |
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
Під час виконання значення не залежать від регістру, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` досі читається як сумісний fallback, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
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
    | API-ключ | `messages.tts.providers.openai.apiKey` | Повертається до `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об'єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тож використовуйте його для OpenAI-сумісних endpoint, які потребують додаткових ключів, як-от `lang`. Ключі прототипу ігноруються.

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS без впливу на endpoint chat API. OpenAI TTS усе ще налаштовується через API-ключ; для live talk-back лише через OAuth використовуйте шлях голосу Realtime замість мовлення agent-mode STT -> TTS.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування media-understanding OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрибування вхідного аудіо використовує
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

    Підказки щодо мови та промпта передаються до OpenAI, коли їх надано через
    спільну конфігурацію аудіомедіа або запит транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Prompt | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Автентифікація | `...openai.apiKey`, `OPENAI_API_KEY`, або OAuth `openai-codex` | API-ключі підключаються напряму; OAuth створює клієнтський секрет Realtime transcription |

    <Note>
    Використовує WebSocket-з'єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Коли налаштовано лише OAuth `openai-codex`, Gateway створює ефемерний клієнтський секрет Realtime transcription перед відкриттям WebSocket. Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура (міст розгортання Azure) | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Префіксне доповнення | `...openai.prefixPaddingMs` | `300` |
    | Зусилля reasoning | `...openai.reasoningEffort` | (не встановлено) |
    | Автентифікація | `...openai.apiKey`, `OPENAI_API_KEY`, або OAuth `openai-codex` | Browser Talk і не-Azure backend-мости можуть використовувати Codex OAuth |

    Доступні вбудовані Realtime-голоси для `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI рекомендує `marin` і `cedar` для найкращої якості Realtime. Це
    окремий набір від голосів Text-to-speech вище; не припускайте, що TTS
    голос, як-от `fable`, `nova` або `onyx`, дійсний для Realtime-сесій.

    <Note>
    Backend Realtime-мости OpenAI використовують форму GA Realtime WebSocket-сесії, яка не приймає `session.temperature`. Розгортання Azure OpenAI залишаються доступними через `azureEndpoint` і `azureDeployment` та зберігають сумісну з розгортанням форму сесії. Підтримує двонапрямні виклики інструментів і аудіо G.711 u-law.
    </Note>

    <Note>
    Голос у реальному часі вибирається під час створення сесії. OpenAI дозволяє змінювати більшість
    полів сесії пізніше, але голос не можна змінити після того, як
    модель згенерувала аудіо в цій сесії. OpenClaw наразі надає
    вбудовані ідентифікатори Realtime-голосів як рядки.
    </Note>

    <Note>
    Control UI Talk використовує браузерні Realtime-сесії OpenAI з ефемерним
    клієнтським секретом, створеним Gateway, і прямим браузерним обміном WebRTC SDP з
    OpenAI Realtime API. Коли прямий API-ключ OpenAI не налаштовано,
    Gateway може створити цей клієнтський секрет за допомогою вибраного OAuth
    профілю `openai-codex`. Gateway relay і Backend Realtime WebSocket-мости Voice Call використовують
    той самий резервний варіант OAuth для нативних кінцевих точок OpenAI. Live-перевірка
    для супровідників доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілки OpenAI перевіряють і Backend WebSocket-міст, і браузерний
    обмін WebRTC SDP без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовувати генерацію зображень до ресурсу Azure OpenAI
через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. accordion **Голос у реальному часі**
у розділі [Голос і мовлення](#voice-and-speech) для його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете залишити трафік усередині наявного клієнтського середовища Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` вкажіть
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
- Використовує шляхи з областю розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе ще перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і зазнаватимуть невдачі з розгортаннями зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не встановлено.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували на порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створите розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило щодо назви розгортання застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних версій
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, підтримуваний вашим конкретним розгортанням і версією API
на порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути проти OpenAI-сумісних
маршрутів** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (окрім генерації зображень) використовуйте
процес onboarding або окрему конфігурацію провайдера Azure — сам лише `openai.baseUrl`
не підхоплює форму Azure API/auth. Існує окремий
провайдер `azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw спершу використовує WebSocket із запасним переходом на SSE (`"auto"`) для `openai/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сеансу й ходу для повторів і повторних підключень
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
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw надає спільний перемикач fast-mode для `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє fast mode з пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і fast mode не переписує `reasoning` або `text.verbosity`.

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream-обгортка Pi-harness Plugin OpenAI автоматично вмикає server-side compaction:

    - Примусово задає `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний harness app-server Codex керує власним контекстом через Codex і налаштовується типовим маршрутом агента OpenAI або runtime-політикою провайдера/моделі.

    <Tabs>
      <Tab title="Увімкнути явно">
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses все одно примусово задають `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Режим strict-agentic GPT">
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
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 для OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути проти OpenAI-сумісних маршрутів">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, що відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Вилучають Completions `store` з ненативних payload `openai-completions`
    - Приймають наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують строгі схеми інструментів або лише нативні заголовки

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
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
