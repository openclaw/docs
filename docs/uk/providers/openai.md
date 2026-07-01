---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість ключів API
    - Потрібна суворіша поведінка виконання агента GPT-5
summary: Використання OpenAI через ключі API або передплату Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:35:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент для програмування з планом ChatGPT через клієнти Codex від OpenAI. OpenClaw використовує один
ідентифікатор провайдера, `openai`, для обох форм автентифікації.

OpenClaw використовує `openai/*` як канонічний маршрут моделей OpenAI. Вбудовані
ходи агента на моделях OpenAI типово виконуються через нативне середовище виконання сервера застосунку Codex;
пряма автентифікація ключем API OpenAI залишається доступною для неагентних поверхонь OpenAI,
як-от зображення, embeddings, мовлення та realtime.

- **Моделі агента** - моделі `openai/*` через середовище виконання Codex; увійдіть за допомогою
  автентифікації Codex для використання підписки ChatGPT/Codex або налаштуйте сумісний із Codex
  резервний профіль ключа API OpenAI, коли ви навмисно хочете автентифікацію ключем API.
- **Неагентні API OpenAI** - прямий доступ до OpenAI Platform із оплатою
  за використання через `OPENAI_API_KEY` або онбординг ключа API OpenAI.
- **Застаріла конфігурація** - застарілі посилання на моделі Codex виправляються
  `openclaw doctor --fix` до `openai/*` плюс середовище виконання Codex.

OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Провайдер, модель, середовище виконання та канал - це окремі рівні. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агента](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                                 | Використовуйте                                           | Примітки                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-5.5`                                         | Типове налаштування агента OpenAI. Увійдіть з автентифікацією Codex. |
| Обмежений попередній перегляд GPT-5.6                | `openai/gpt-5.6-sol`, `-terra` або `-luna`               | Потребує схваленої OpenAI організації API або робочого простору Codex. |
| Пряма оплата ключем API для моделей агента           | `openai/gpt-5.5` плюс сумісний із Codex профіль ключа API | Використовуйте `auth.order.openai`, щоб розмістити резерв після автентифікації підписки. |
| Пряма оплата ключем API через явний OpenClaw         | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `openclaw` | Виберіть звичайний профіль ключа API `openai`. |
| Останній псевдонім ChatGPT Instant API               | `openai/chat-latest`                                     | Лише прямий ключ API. Рухомий псевдонім для експериментів, не типовий варіант. |
| Автентифікація підписки ChatGPT/Codex через OpenClaw | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `openclaw` | Виберіть профіль OAuth `openai` для маршруту сумісності. |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                     | Працює або з `OPENAI_API_KEY`, або з OpenAI Codex OAuth. |
| Зображення з прозорим фоном                          | `openai/gpt-image-1.5`                                   | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Мапа назв

Назви схожі, але не взаємозамінні:

| Назва, яку ви бачите                      | Рівень            | Значення                                                                                          |
| ----------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                  | Префікс провайдера | Канонічний маршрут моделей OpenAI; ходи агента використовують середовище виконання Codex.        |
| застарілий префікс OpenAI Codex           | Застарілий префікс | Старіший простір імен моделі/профілю. `openclaw doctor --fix` мігрує його до `openai`.            |
| Plugin `codex`                            | Plugin            | Вбудований Plugin OpenClaw, що надає нативне середовище виконання сервера застосунку Codex і елементи керування чатом `/codex`. |
| провайдер/модель `agentRuntime.id: codex` | Середовище виконання агента | Примусово використовує нативний harness сервера застосунку Codex для відповідних вбудованих ходів. |
| `/codex ...`                              | Набір команд чату | Прив’язує/керує потоками сервера застосунку Codex із розмови.                                      |
| `runtime: "acp", agentId: "codex"`        | Маршрут сеансу ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити посилання на моделі `openai/*`, тоді як профілі
автентифікації вказують або на облікові дані ключа API, або на облікові дані OAuth ChatGPT/Codex. Використовуйте
`auth.order.openai` для конфігурації; `openclaw doctor --fix` переписує застарілі
посилання на моделі Codex, застарілі ідентифікатори профілів автентифікації Codex і
застарілий порядок автентифікації Codex на канонічний маршрут OpenAI.

<Note>
GPT-5.5 доступна як через прямий доступ із ключем API OpenAI Platform, так і через
маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5`; неналаштована конфігурація середовища виконання тепер вибирає harness Codex
для ходів агента OpenAI. Використовуйте профілі ключа API OpenAI лише тоді, коли вам потрібна
пряма автентифікація ключем API для моделі агента OpenAI.
</Note>

## Обмежений попередній перегляд GPT-5.6

OpenClaw розпізнає три публічні ідентифікатори моделей GPT-5.6:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Усі три надають reasoning `max` у поточному каталозі сервера застосунку Codex. Оголошення
запуску OpenAI описує Sol як флагманський рівень, Terra як
збалансований рівень, а Luna як швидкий рівень із нижчою вартістю. Див.
[оголошення про запуск GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
і [посібник із доступу до попереднього перегляду](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Доступ під час попереднього перегляду надається за списком дозволених і може бути наданий окремо для
API та Codex. Лише платний план ChatGPT не надає доступу. OpenClaw залишає
`openai/gpt-5.5` типовим варіантом; вибір посилання GPT-5.6 без доступу повертає
помилку доступу від upstream замість мовчазного fallback.

<Note>
Ходи моделей агента OpenAI потребують вбудованого Plugin сервера застосунку Codex. Явна
конфігурація середовища виконання OpenClaw залишається доступною як opt-in маршрут сумісності. Коли OpenClaw
явно вибрано з профілем OAuth `openai`, OpenClaw зберігає
публічне посилання на модель як `openai/*` і внутрішньо маршрутизує через транспорт
автентифікації Codex. Запустіть `openclaw doctor --fix`, щоб виправити застарілі
посилання на моделі Codex, `codex-cli/*` або старі прив’язки сеансів середовища виконання, які не походять з
явної конфігурації середовища виконання.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                                                              | Статус                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | провайдер моделей `openai/<model>`                                                            | Так                                                                    |
| Моделі підписки Codex     | `openai/<model>` з OpenAI OAuth                                                               | Так                                                                    |
| Застарілі посилання на моделі Codex | застарілі посилання на моделі Codex або `codex-cli/<model>`                              | Виправляється doctor до `openai/<model>`                               |
| Harness сервера застосунку Codex | `openai/<model>` з пропущеним середовищем виконання або провайдер/модель `agentRuntime.id: codex` | Так                                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                                                          | Так, коли вебпошук увімкнено й жоден провайдер не зафіксований         |
| Зображення                | `image_generate`                                                                              | Так                                                                    |
| Відео                     | `video_generate`                                                                              | Так                                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`                                                | Так                                                                    |
| Пакетне розпізнавання мовлення | `tools.media.audio` / розуміння медіа                                                     | Так                                                                    |
| Потокове розпізнавання мовлення | Voice Call `streaming.provider: "openai"`                                                 | Так                                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Так (потребує кредитів OpenAI Platform, не підписки Codex/ChatGPT)     |
| Embeddings                | провайдер embedding пам’яті                                                                   | Так                                                                    |

<Note>
  OpenAI Realtime voice (що використовується Voice Call `realtime.provider: "openai"` і
  Control UI Talk з `talk.realtime.provider: "openai"`) проходить через
  публічний **OpenAI Platform Realtime API**, який оплачується з кредитів OpenAI
  Platform, а не з квоти підписки Codex/ChatGPT. Обліковий запис
  із робочим OpenAI OAuth, який без проблем запускає моделі чату на основі Codex,
  все одно потребує профілю автентифікації ключем API OpenAI або ключа API Platform із профінансованою
  оплатою Platform для Realtime voice.

Виправлення: поповніть кредити Platform на
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
для організації, що підтримує ваші облікові дані realtime. Realtime voice приймає
профіль автентифікації ключем API `openai`, створений `openclaw onboard --auth-choice openai-api-key`,
ключ Platform `OPENAI_API_KEY`, налаштований через `talk.realtime.providers.openai.apiKey`
для Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
для Voice Call або змінну середовища `OPENAI_API_KEY`. Профілі OpenAI OAuth
можуть і далі запускати моделі чату `openai/*` на основі Codex у тій самій
інсталяції OpenClaw, але вони не налаштовують Realtime voice.
</Note>

## Embeddings пам’яті

OpenClaw може використовувати OpenAI або сумісну з OpenAI кінцеву точку embeddings для
індексування `memory_search` і embeddings запитів:

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

Для сумісних з OpenAI кінцевих точок, які потребують асиметричних міток embeddings, задайте
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw передає
їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують
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

    | Посилання на модель              | Конфігурація runtime             | Маршрут                       | Автентифікація             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | опущено / provider/model `agentRuntime.id: "codex"` | harness Codex app-server | Codex-сумісний профіль OpenAI |
    | `openai/gpt-5.4-mini` | опущено / provider/model `agentRuntime.id: "codex"` | harness Codex app-server | Codex-сумісний профіль OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | вбудований runtime OpenClaw      | Вибраний профіль `openai` |

    <Note>
    Агентські моделі `openai/*` використовують harness Codex app-server. Щоб використовувати
    автентифікацію за API-ключем для агентської моделі, створіть Codex-сумісний профіль
    API-ключа й упорядкуйте його через `auth.order.openai`; `OPENAI_API_KEY` залишається
    прямим резервним варіантом для неагентських поверхонь OpenAI API. Запустіть
    `openclaw doctor --fix`, щоб перенести старі записи порядку автентифікації legacy Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Щоб спробувати поточну модель Instant із ChatGPT через OpenAI API, задайте
    модель як `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` є рухомим псевдонімом. OpenAI документує його як найновішу
    модель Instant, що використовується в ChatGPT, і рекомендує `gpt-5.5` для
    виробничого використання API, тому залишайте `openai/gpt-5.5` стабільним
    типовим значенням, якщо ви явно не хочете поведінку цього псевдоніма.
    Наразі псевдонім приймає лише `medium` для деталізації тексту, тому
    OpenClaw нормалізує несумісні перевизначення деталізації тексту OpenAI
    для цієї моделі.

    <Warning>
    OpenClaw **не** надає `gpt-5.3-codex-spark` у прямому маршруті OpenAI API-ключа. Вона доступна лише через записи каталогу підписки Codex, коли ваш обліковий запис, у який виконано вхід, її надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex із нативним виконанням Codex app-server замість окремого API-ключа. Для хмарного Codex потрібен вхід у ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai
        ```

        Для headless-налаштувань або середовищ, де callback незручний, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Використайте канонічний маршрут моделі OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для типового шляху конфігурація runtime не потрібна. Агентські ходи OpenAI
        автоматично вибирають нативний runtime Codex app-server, а OpenClaw
        встановлює або ремонтує вбудований Plugin Codex, коли вибрано цей маршрут.
      </Step>
      <Step title="Перевірте, що автентифікація Codex доступна">
        ```bash
        openclaw models list --provider openai
        ```

        Після запуску Gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити нативний runtime app-server.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | опущено / provider/model `agentRuntime.id: "codex"` | нативний harness Codex app-server | вхід Codex або впорядкований профіль автентифікації `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | вбудований runtime OpenClaw із внутрішнім транспортом Codex-auth | Вибраний профіль OAuth `openai` |
    | legacy-посилання Codex GPT-5.5 | виправлено doctor | Legacy-маршрут переписано на `openai/gpt-5.5` | Перенесений профіль OAuth OpenAI |
    | `codex-cli/gpt-5.5` | виправлено doctor | Legacy-маршрут CLI переписано на `openai/gpt-5.5` | автентифікація Codex app-server |

    <Warning>
    Надавайте перевагу `openai/gpt-5.5` для нової агентської конфігурації,
    що спирається на підписку. Старі legacy-посилання Codex GPT є legacy-маршрутами
    OpenClaw, а не нативним шляхом runtime Codex; запустіть `openclaw doctor --fix`,
    коли хочете перенести їх до канонічних посилань `openai/*`. `gpt-5.3-codex-spark`
    залишається обмеженою для облікових записів, каталог підписки Codex яких
    оголошує цю модель; прямі посилання OpenAI API-ключа та Azure для неї
    залишаються прихованими.
    </Warning>

    <Note>
    Legacy-префікс моделі Codex є legacy-конфігурацією, яку виправляє doctor.
    Для поширеного налаштування підписки плюс нативний runtime увійдіть через
    автентифікацію Codex, але залиште посилання на модель як `openai/gpt-5.5`.
    Нова конфігурація має розміщувати порядок агентської автентифікації OpenAI
    у `auth.order.openai`; doctor переносить старі legacy-записи порядку
    автентифікації Codex.
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

    Із резервним API-ключем залишайте модель на `openai/gpt-5.5` і помістіть
    порядок автентифікації під `openai`. OpenClaw спершу спробує підписку, потім
    API-ключ, залишаючись на harness Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через браузерний OAuth (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі агентської автентифікації.
    </Note>

    ### Перевірка та відновлення маршрутизації OAuth Codex

    Використовуйте ці команди, щоб побачити, яку модель, runtime і маршрут
    автентифікації використовує ваш типовий агент:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Для конкретного агента додайте `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Якщо старіша конфігурація все ще має legacy-посилання Codex GPT або застарілий
    pin сесії runtime OpenAI без явної конфігурації runtime, виправте її:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Якщо `models auth list --provider openai` не показує придатного профілю,
    увійдіть знову:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Використовуйте `--profile-id`, коли хочете кілька OAuth-входів Codex в одному
    агенті й пізніше хочете керувати ними через порядок автентифікації або `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` є маршрутом моделі для агентських ходів OpenAI через Codex.
    Запустіть `openclaw doctor --fix`, щоб перенести старі legacy-id профілів із
    префіксом OpenAI Codex і записи порядку перед тим, як покладатися на порядок профілів.

    ### Індикатор стану

    Chat `/status` показує, який runtime моделі активний для поточної сесії.
    Вбудований harness Codex app-server відображається як `Runtime: OpenAI Codex`
    для ходів агентських моделей OpenAI. Застарілі pins сесії runtime OpenAI виправляються
    на Codex, якщо конфігурація явно не закріплює OpenClaw.

    ### Попередження doctor

    Якщо legacy-посилання моделей Codex або застарілі pins runtime OpenAI лишаються
    в конфігурації чи стані сесії, `openclaw doctor --fix` переписує їх на
    `openai/*` з runtime Codex, якщо OpenClaw не налаштовано явно.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai/gpt-5.5` через каталог OAuth Codex:

    - Нативний `contextWindow`: `1000000`
    - Типове обмеження runtime `contextTokens`: `272000`

    Менше типове обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    OpenClaw використовує upstream-метадані каталогу Codex для `gpt-5.5`, коли вони
    присутні. Якщо live-виявлення Codex пропускає рядок `gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    cron, sub-agent і запуски з налаштованою типовою моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Нативна автентифікація Codex app-server

Нативний harness Codex app-server використовує посилання моделей `openai/*` плюс
опущену конфігурацію runtime або provider/model `agentRuntime.id: "codex"`, але його
автентифікація все одно базується на обліковому записі. OpenClaw вибирає
автентифікацію в такому порядку:

1. Упорядковані профілі автентифікації OpenAI для агента, бажано під
   `auth.order.openai`. Запустіть `openclaw doctor --fix`, щоб перенести старі
   legacy-id профілів автентифікації Codex і legacy-порядок автентифікації Codex.
2. Наявний обліковий запис app-server, наприклад локальний вхід Codex CLI ChatGPT.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли app-server повідомляє про відсутність облікового запису
   й усе ще потребує автентифікації OpenAI.

Це означає, що локальний вхід підписки ChatGPT/Codex не замінюється лише тому,
що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний API-ключ з env використовується лише в локальному stdio-шляху
без облікового запису; він не надсилається до WebSocket-з’єднань app-server.
Коли вибрано профіль Codex у стилі підписки, OpenClaw також не передає
`CODEX_API_KEY` і `OPENAI_API_KEY` до дочірнього процесу stdio app-server і надсилає
вибрані облікові дані через RPC входу app-server. Коли цей профіль підписки
заблоковано лімітом використання Codex, OpenClaw може перейти до наступного
впорядкованого профілю API-ключа `openai:*`, не змінюючи вибрану модель і не
виходячи з harness Codex. Щойно час скидання підписки минає, профіль підписки
знову стає придатним.

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за API-ключем OpenAI, так і генерацію зображень
через OAuth Codex з тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | бекенд Codex Responses               |
| Макс. зображень на запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільність | Не пересилається до OpenAI Images API | Безпечно зіставляється з підтримуваним розміром |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера й поведінки відмовостійкого перемикання.
</Note>

`gpt-image-2` є стандартною моделлю як для генерації зображень з тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
з прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіша опція провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні кінцеві точки зберігають
налаштовані назви розгортання/моделі.

Те саме налаштування доступне для безголових запусків CLI:

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
Використовуйте `--quality low|medium|high|auto`, коли потрібно керувати якістю
та вартістю OpenAI Images. Використовуйте `--openai-moderation low|auto`, щоб передати
підказку модерації, специфічну для провайдера OpenAI, з `image generate` або `image edit`.

Для встановлень ChatGPT/Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai`, OpenClaw визначає збережений токен доступу OAuth
і надсилає запити зображень через бекенд Codex Responses. Він
спершу не пробує `OPENAI_API_KEY` і не переходить мовчки на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
власною базовою URL-адресою або кінцевою точкою Azure, коли вам потрібен прямий маршрут
OpenAI Images API.
Якщо ця власна кінцева точка зображень розміщена в довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні кінцеві точки зображень заблокованими, якщо цього явного вибору
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
| Еталонні вхідні дані | 1 зображення або 1 відео                                                      |
| Перевизначення розміру | Підтримується для текст-у-відео та зображення-у-відео                      |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

Запити OpenAI зображення-у-відео використовують `POST /v1/videos` із зображенням
`input_reference`. Редагування одного відео використовує `POST /v1/videos/edits` із
завантаженим відео в полі `video`.

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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера й поведінки відмовостійкого перемикання.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 на поверхнях промптів, зібраних OpenClaw. Він застосовується за ідентифікатором моделі, тому маршрути OpenClaw/провайдера, як-от застарілі refs до виправлення (застарілий ref Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні refs GPT-5, отримують той самий оверлей. Старіші моделі GPT-4.x не отримують його.

Вбудований нативний harness Codex не отримує цей оверлей OpenClaw GPT-5 через інструкції розробника Codex app-server. Нативний Codex зберігає базову поведінку, модель і поведінку документації проєкту, що належать Codex, тоді як OpenClaw вимикає вбудовану особистість Codex для нативних потоків, щоб файли особистості робочого простору агента залишалися авторитетними. OpenClaw додає лише runtime-контекст, як-от доставку каналами, динамічні інструменти OpenClaw, делегування ACP, контекст робочого простору та Skills OpenClaw.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації на відповідних промптах, зібраних OpenClaw. Поведінка відповідей, специфічна для каналів, і поведінка тихих повідомлень залишаються у спільному системному промпті OpenClaw і політиці вихідної доставки. Дружній шар стилю взаємодії окремий і налаштовуваний.

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
Значення не чутливі до регістру під час виконання, тому `"Off"` і `"off"` обидва вимикають дружній шар стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` досі читається як сумісний fallback, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Повертається до `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об'єднується з JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тому використовуйте його для OpenAI-сумісних кінцевих точок, які потребують додаткових ключів, як-от `lang`. Ключі прототипу ігноруються.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS без впливу на кінцеву точку chat API. OpenAI TTS і голос Realtime обидва налаштовуються через API-ключ OpenAI Platform; встановлення лише з OAuth усе ще можуть використовувати моделі чату на базі Codex, але не живий зворотний голос OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрибування медіарозуміння OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: завантаження аудіофайла multipart
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

    Підказки мови та промпта пересилаються до OpenAI, коли їх надає
    спільна медіаконфігурація аудіо або запит транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Realtime-транскрибування">
    Вбудований plugin `openai` реєструє Realtime-транскрибування для plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Автентифікація | `...openai.apiKey`, `OPENAI_API_KEY` або `openai` OAuth | API-ключі підключаються напряму; OAuth випускає client secret Realtime-транскрибування |

    <Note>
    Використовує WebSocket-з'єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Коли налаштовано лише `openai` OAuth, Gateway випускає ефемерний client secret Realtime-транскрибування перед відкриттям WebSocket. Цей потоковий провайдер призначений для шляху Realtime-транскрибування Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-голос">
    Вбудований plugin `openai` реєструє Realtime-голос для plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура (міст розгортання Azure) | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Початкове доповнення | `...openai.prefixPaddingMs` | `300` |
    | Зусилля reasoning | `...openai.reasoningEffort` | (не задано) |
    | Автентифікація | профіль автентифікації API-ключем `openai`, `...openai.apiKey` або `OPENAI_API_KEY` | Потрібен API-ключ OpenAI Platform; OpenAI OAuth не налаштовує голос Realtime |

    Доступні вбудовані голоси Realtime для `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI рекомендує `marin` і `cedar` для найкращої якості Realtime. Це
    окремий набір від голосів перетворення тексту на мовлення вище; не вважайте,
    що TTS-голос, як-от `fable`, `nova` або `onyx`, чинний для сеансів Realtime.

    <Note>
    Бекенд-мости OpenAI realtime використовують GA-форму сеансу Realtime WebSocket, яка не приймає `session.temperature`. Розгортання Azure OpenAI залишаються доступними через `azureEndpoint` і `azureDeployment` та зберігають сумісну з розгортанням форму сеансу. Підтримує двонапрямні виклики інструментів і аудіо G.711 u-law.
    </Note>

    <Note>
    Голос Realtime вибирається під час створення сеансу. OpenAI дозволяє змінювати
    більшість полів сеансу пізніше, але голос не можна змінити після того, як
    модель згенерувала аудіо в цьому сеансі. OpenClaw зараз надає вбудовані
    ідентифікатори голосів Realtime як рядки.
    </Note>

    <Note>
    Control UI Talk використовує браузерні сеанси OpenAI realtime з ефемерним
    клієнтським секретом, створеним Gateway, і прямим браузерним обміном WebRTC SDP
    з OpenAI Realtime API. Gateway створює цей клієнтський секрет із вибраним
    профілем автентифікації API-ключем `openai` або налаштованим API-ключем
    OpenAI Platform. Релей Gateway і бекенд-мости Voice Call realtime WebSocket
    використовують той самий шлях автентифікації лише API-ключем для нативних
    кінцевих точок OpenAI. Maintainer-перевірка наживо доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілки OpenAI перевіряють і бекенд-міст WebSocket, і браузерний обмін
    WebRTC SDP без журналювання секретів.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовувати генерацію зображень на ресурс
Azure OpenAI через перевизначення базової URL-адреси. На шляху генерації
зображень OpenClaw виявляє імена хостів Azure у `models.providers.openai.baseUrl`
і автоматично перемикається на форму запиту Azure.

<Note>
Голос Realtime використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Його налаштування Azure
див. в акордеоні **Голос Realtime** у розділі [Голос і мовлення](#voice-and-speech).
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете тримати трафік усередині наявного тенанта Azure

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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типове очікування запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це типове значення.

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають
стандартну форму запиту зображення OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який
користувацький `openai.baseUrl` як публічну кінцеву точку OpenAI і завершаться
помилкою для розгортань зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або
GA-версію Azure для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень
Azure, маршрутизованих через вбудований провайдер `openai`, поле `model` в
OpenClaw має бути **назвою розгортання Azure**, яку ви налаштували на порталі
Azure, а не публічним ідентифікатором моделі OpenAI.

Якщо ви створите розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви розгортання застосовується до викликів генерації
зображень, маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
розгортання та підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних
версій моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте набір
параметрів, який підтримує ваше конкретне розгортання та версія API, на порталі
Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути проти OpenAI-сумісних**
у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (окрім генерації зображень) використовуйте
процес онбордингу або окрему конфігурацію провайдера Azure — сам по собі
`openai.baseUrl` не підхоплює форму API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див. акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує насамперед WebSocket із резервним переходом на SSE (`"auto"`) для `openai/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сеансу та ходу для повторів і повторних підключень
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
          },
        },
      },
    }
    ```

    Пов’язані документи OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*`:

    - **Чат/UI:** `/fast status|auto|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`. `fastMode: "auto"` запускає нові виклики моделі швидко до автоматичного порогу, а потім запускає пізніші повтори, резервні переходи, виклики з результатами інструментів або продовження без швидкого режиму. Типовий поріг — 60 секунд; задайте `params.fastAutoOnSeconds` для активної моделі, щоб змінити його.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в Sessions UI повертає сеанс до налаштованого типового значення.
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
    `serviceTier` передається лише нативним кінцевим точкам OpenAI (`api.openai.com`) і нативним кінцевим точкам Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку OpenClaw у Plugin OpenAI автоматично вмикає Server-side compaction:

    - Примусово задає `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого шляху виконання OpenClaw і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний app-server harness Codex керує власним контекстом через Codex і налаштовується стандартним маршрутом агента OpenAI або політикою виконання провайдера/моделі.

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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses все одно примусово задають `store: true`, якщо сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Режим strict-agentic GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    З `strict-agentic` OpenClaw:
    - Автоматично вмикає `update_plan` для значної роботи
    - Повторює структурно порожні або лише reasoning ходи з продовженням для видимої відповіді
    - Використовує явні події плану обв’язки, коли вибрана обв’язка їх надає

    OpenClaw не класифікує прозу асистента, щоб вирішити, чи є хід планом, оновленням прогресу або фінальною відповіддю.

    <Note>
    Обмежено лише запусками сімейства OpenAI і Codex GPT-5. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та сумісні з OpenAI маршрути">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж універсальні сумісні з OpenAI проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують зусилля OpenAI `none`
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням переводять схеми інструментів у суворий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають специфічне для OpenAI формування запитів (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу поведінку сумісності
    - Видаляють Completions `store` з ненативних корисних навантажень `openai-completions`
    - Приймають наскрізний JSON для розширених `params.extra_body`/`params.extraBody` у сумісних з OpenAI проксі Completions
    - Приймають `params.chat_template_kwargs` для сумісних з OpenAI проксі Completions, таких як vLLM
    - Не примушують суворі схеми інструментів або лише нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує прихованих заголовків атрибуції.

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
