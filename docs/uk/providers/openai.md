---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агентів GPT-5
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI надає API для розробників для моделей GPT, а Codex також доступний як
агент кодування плану ChatGPT через клієнти Codex від OpenAI. OpenClaw використовує один
ідентифікатор провайдера, `openai`, для обох форм автентифікації.

OpenClaw використовує `openai/*` як канонічний маршрут моделі OpenAI. Вбудовані
ходи агента на моделях OpenAI за замовчуванням виконуються через нативне середовище
виконання app-server Codex; пряма автентифікація API-ключем OpenAI залишається
доступною для неагентних поверхонь OpenAI, як-от зображення, embeddings, мовлення та realtime.

- **Моделі агента** - моделі `openai/*` через середовище виконання Codex; увійдіть через
  автентифікацію Codex для використання підписки ChatGPT/Codex або налаштуйте сумісний із Codex
  резервний API-ключ OpenAI, коли ви навмисно хочете автентифікацію API-ключем.
- **Неагентні API OpenAI** - прямий доступ до OpenAI Platform з оплатою за використання
  через `OPENAI_API_KEY` або налаштування API-ключа OpenAI.
- **Застаріла конфігурація** - застарілі посилання на моделі Codex виправляються
  `openclaw doctor --fix` до `openai/*` плюс середовище виконання Codex.

OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Провайдер, модель, середовище виконання та канал є окремими шарами. Якщо ці мітки
змішуються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                                 | Використовуйте                                           | Примітки                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-5.5`                                         | Типове налаштування агента OpenAI. Увійдіть через автентифікацію Codex. |
| Пряма оплата API-ключем для моделей агента           | `openai/gpt-5.5` плюс сумісний із Codex профіль API-ключа | Використовуйте `auth.order.openai`, щоб розмістити резерв після автентифікації підписки. |
| Пряма оплата API-ключем через явний OpenClaw         | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `openclaw` | Виберіть звичайний профіль API-ключа `openai`. |
| Найновіший псевдонім ChatGPT Instant API             | `openai/chat-latest`                                     | Лише прямий API-ключ. Рухомий псевдонім для експериментів, не типовий варіант. |
| Автентифікація підписки ChatGPT/Codex через OpenClaw | `openai/gpt-5.5` плюс середовище виконання провайдера/моделі `openclaw` | Виберіть OAuth-профіль `openai` для маршруту сумісності. |
| Генерація або редагування зображень                  | `openai/gpt-image-2`                                     | Працює з `OPENAI_API_KEY` або OpenAI Codex OAuth. |
| Зображення з прозорим фоном                          | `openai/gpt-image-1.5`                                   | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

## Карта назв

Назви подібні, але не взаємозамінні:

| Назва, яку ви бачите                    | Шар              | Значення                                                                                          |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Префікс провайдера | Канонічний маршрут моделі OpenAI; ходи агента використовують середовище виконання Codex.          |
| застарілий префікс OpenAI Codex         | Застарілий префікс | Старіший простір імен моделі/профілю. `openclaw doctor --fix` мігрує його до `openai`.            |
| Plugin `codex`                          | Plugin           | Вбудований Plugin OpenClaw, який надає нативне середовище виконання app-server Codex і елементи керування чатом `/codex`. |
| provider/model `agentRuntime.id: codex` | Середовище виконання агента | Примусово використовує нативний harness app-server Codex для відповідних вбудованих ходів.        |
| `/codex ...`                            | Набір команд чату | Прив’язує/керує потоками app-server Codex із розмови.                                             |
| `runtime: "acp", agentId: "codex"`      | Маршрут сеансу ACP | Явний запасний шлях, який запускає Codex через ACP/acpx.                                          |

Це означає, що конфігурація може навмисно містити посилання на моделі `openai/*`, тоді як
профілі автентифікації вказують або на API-ключ, або на облікові дані ChatGPT/Codex OAuth. Використовуйте
`auth.order.openai` для конфігурації; `openclaw doctor --fix` переписує застарілі
посилання на моделі Codex, ідентифікатори застарілих профілів автентифікації Codex і
застарілий порядок автентифікації Codex до канонічного маршруту OpenAI.

<Note>
GPT-5.5 доступна як через прямий доступ API-ключем OpenAI Platform, так і через
маршрути підписки/OAuth. Для підписки ChatGPT/Codex плюс нативного виконання Codex
використовуйте `openai/gpt-5.5`; неналаштована конфігурація середовища виконання тепер вибирає harness Codex
для ходів агента OpenAI. Використовуйте профілі API-ключів OpenAI лише тоді, коли вам потрібна
пряма автентифікація API-ключем для моделі агента OpenAI.
</Note>

<Note>
Ходи моделей агента OpenAI потребують вбудованого Plugin app-server Codex. Явна
конфігурація середовища виконання OpenClaw залишається доступною як опційний маршрут сумісності. Коли OpenClaw
явно вибрано з OAuth-профілем `openai`, OpenClaw зберігає
публічне посилання на модель як `openai/*` і внутрішньо маршрутизує через транспорт
автентифікації Codex. Запустіть `openclaw doctor --fix`, щоб виправити застарілі
посилання на моделі Codex, `codex-cli/*` або старі прив’язки сеансів середовища виконання, які не походять з
явної конфігурації середовища виконання.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                                                              | Статус                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | провайдер моделей `openai/<model>`                                                            | Так                                                                    |
| Моделі підписки Codex     | `openai/<model>` з OpenAI OAuth                                                               | Так                                                                    |
| Застарілі посилання на моделі Codex | застарілі посилання на моделі Codex або `codex-cli/<model>`                           | Виправляється doctor до `openai/<model>`                               |
| Harness app-server Codex  | `openai/<model>` з пропущеним середовищем виконання або provider/model `agentRuntime.id: codex` | Так                                                                    |
| Серверний вебпошук        | Нативний інструмент OpenAI Responses                                                          | Так, коли вебпошук увімкнено й провайдера не закріплено                |
| Зображення                | `image_generate`                                                                              | Так                                                                    |
| Відео                     | `video_generate`                                                                              | Так                                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                                                     | Так                                                                    |
| Пакетне speech-to-text    | `tools.media.audio` / розуміння медіа                                                         | Так                                                                    |
| Потокове speech-to-text   | Voice Call `streaming.provider: "openai"`                                                     | Так                                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Так (потрібні кредити OpenAI Platform, не підписка Codex/ChatGPT)      |
| Embeddings                | провайдер embeddings пам’яті                                                                  | Так                                                                    |

<Note>
  OpenAI Realtime voice (використовується Voice Call `realtime.provider: "openai"` і
  Control UI Talk з `talk.realtime.provider: "openai"`) проходить через
  публічний **OpenAI Platform Realtime API**, який виставляє рахунки за кредити OpenAI
  Platform, а не за квоту підписки Codex/ChatGPT. Обліковий запис
  зі справним OpenAI OAuth, який без проблем запускає моделі чату на базі Codex,
  усе одно потребує профілю автентифікації API-ключем OpenAI або Platform API key з оплаченим
  білінгом Platform для Realtime voice.

Виправлення: поповніть кредити Platform на
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
для організації, яка підтримує ваші realtime облікові дані. Realtime voice приймає
профіль автентифікації API-ключем `openai`, створений `openclaw onboard --auth-choice openai-api-key`,
Platform `OPENAI_API_KEY`, налаштований через `talk.realtime.providers.openai.apiKey`
для Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
для Voice Call або змінну середовища `OPENAI_API_KEY`. OAuth-профілі OpenAI
можуть і далі запускати моделі чату `openai/*` на базі Codex у тій самій
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
`queryInputType` і `documentInputType` у `memorySearch`. OpenClaw пересилає
їх як специфічні для провайдера поля запиту `input_type`: embeddings запитів використовують
`queryInputType`; проіндексовані фрагменти пам’яті та пакетне індексування використовують
`documentInputType`. Повний приклад дивіться в [довіднику з конфігурації пам’яті](/uk/reference/memory-config#provider-specific-config).

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Посилання на модель  | Конфігурація середовища виконання | Маршрут                     | Автентифікація  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | пропущено / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | Сумісний із Codex профіль OpenAI |
    | `openai/gpt-5.4-mini` | пропущено / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | Сумісний із Codex профіль OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | Вбудоване середовище виконання OpenClaw | Вибраний профіль `openai` |

    <Note>
    Моделі агентів `openai/*` використовують середовище сервера застосунку Codex. Щоб використати
    автентифікацію за ключем API для моделі агента, створіть сумісний із Codex профіль ключа API й упорядкуйте
    його через `auth.order.openai`; `OPENAI_API_KEY` залишається прямим резервним варіантом для
    поверхонь API OpenAI не для агентів. Запустіть `openclaw doctor --fix`, щоб перенести старі
    застарілі записи порядку автентифікації Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Щоб спробувати поточну модель Instant ChatGPT з API OpenAI, задайте модель
    як `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` є рухомим псевдонімом. OpenAI документує його як найновішу модель Instant,
    що використовується в ChatGPT, і рекомендує `gpt-5.5` для виробничого використання API, тому
    залишайте `openai/gpt-5.5` стабільним стандартним значенням, якщо ви явно не хочете
    поведінку цього псевдоніма. Наразі псевдонім приймає лише `medium` багатослівність тексту, тому
    OpenClaw нормалізує несумісні перевизначення багатослівності тексту OpenAI для цієї
    моделі.

    <Warning>
    OpenClaw **не** відкриває `gpt-5.3-codex-spark` на прямому маршруті ключа API OpenAI. Вона доступна лише через записи каталогу підписки Codex, коли ваш обліковий запис після входу її відкриває.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex із власним виконанням сервера застосунку Codex замість окремого ключа API. Хмара Codex потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai
        ```

        Для безголових або несумісних із callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Використайте канонічний маршрут моделі OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для стандартного шляху конфігурація runtime не потрібна. Ходи агентів OpenAI
        автоматично вибирають власний runtime сервера застосунку Codex, а OpenClaw
        встановлює або відновлює вбудований plugin Codex, коли вибрано цей маршрут.
      </Step>
      <Step title="Перевірте доступність автентифікації Codex">
        ```bash
        openclaw models list --provider openai
        ```

        Після запуску Gateway надішліть `/codex status` або `/codex models`
        у чаті, щоб перевірити власний runtime сервера застосунку.
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | пропущено / provider/model `agentRuntime.id: "codex"` | Власне середовище сервера застосунку Codex | Вхід Codex або впорядкований профіль автентифікації `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Вбудований runtime OpenClaw із внутрішнім транспортом автентифікації Codex | Вибраний профіль OAuth `openai` |
    | застаріле посилання Codex GPT-5.5 | виправлено doctor | Застарілий маршрут переписано на `openai/gpt-5.5` | Перенесений профіль OAuth OpenAI |
    | `codex-cli/gpt-5.5` | виправлено doctor | Застарілий маршрут CLI переписано на `openai/gpt-5.5` | Автентифікація сервера застосунку Codex |

    <Warning>
    Надавайте перевагу `openai/gpt-5.5` для нової конфігурації агентів із підтримкою підписки. Старі
    застарілі посилання GPT Codex є застарілими маршрутами OpenClaw, а не шляхом
    власного runtime Codex; запустіть `openclaw doctor --fix`, коли хочете перенести їх до канонічних
    посилань `openai/*`. `gpt-5.3-codex-spark` залишається обмеженою обліковими записами, чий
    каталог підписки Codex оголошує цю модель; прямі посилання ключа API OpenAI та
    Azure для неї залишаються прихованими.
    </Warning>

    <Note>
    Застарілий префікс моделі Codex є застарілою конфігурацією, яку виправляє doctor. Для
    поширеного налаштування з підпискою та власним runtime увійдіть через автентифікацію Codex,
    але залиште посилання на модель як `openai/gpt-5.5`. Нова конфігурація має розміщувати порядок
    автентифікації агентів OpenAI у `auth.order.openai`; doctor переносить старі
    застарілі записи порядку автентифікації Codex.
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

    Із резервним ключем API залишайте модель на `openai/gpt-5.5` і розмістіть
    порядок автентифікації під `openai`. OpenClaw спочатку спробує підписку, потім
    ключ API, залишаючись на середовищі Codex:

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
    Onboarding більше не імпортує матеріал OAuth із `~/.codex`. Увійдіть через OAuth у браузері (стандартно) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Перевірка й відновлення маршрутизації OAuth Codex

    Використовуйте ці команди, щоб побачити, яку модель, runtime і маршрут автентифікації використовує ваш стандартний
    агент:

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

    Якщо старіша конфігурація все ще має застарілі посилання GPT Codex або застарілу прив’язку
    сеансу runtime OpenAI без явної конфігурації runtime, виправте її:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Якщо `models auth list --provider openai` не показує придатного профілю, увійдіть
    знову:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Використовуйте `--profile-id`, коли хочете мати кілька входів OAuth Codex в одному
    агенті й пізніше керувати ними через порядок автентифікації або `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` є маршрутом моделі для ходів агентів OpenAI через Codex. Запустіть
    `openclaw doctor --fix`, щоб перенести старі застарілі ідентифікатори профілів із префіксом OpenAI Codex і
    записи порядку перед тим, як покладатися на впорядкування профілів.

    ### Індикатор стану

    Чатова команда `/status` показує, який runtime моделі активний для поточного сеансу.
    Вбудоване середовище сервера застосунку Codex відображається як `Runtime: OpenAI Codex` для
    ходів моделей агентів OpenAI. Застарілі прив’язки сеансу runtime OpenAI виправляються на Codex, якщо
    конфігурація явно не фіксує OpenClaw.

    ### Попередження doctor

    Якщо застарілі посилання моделей Codex або застарілі прив’язки runtime OpenAI залишаються в конфігурації чи
    стані сеансу, `openclaw doctor --fix` переписує їх на `openai/*` із
    runtime Codex, якщо OpenClaw не налаштовано явно.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai/gpt-5.5` через каталог OAuth Codex:

    - Власний `contextWindow`: `1000000`
    - Стандартне обмеження runtime `contextTokens`: `272000`

    Менше стандартне обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує upstream-метадані каталогу Codex для `gpt-5.5`, коли вони
    наявні. Якщо живе виявлення Codex пропускає рядок `gpt-5.5`, поки
    обліковий запис автентифікований, OpenClaw синтезує цей рядок моделі OAuth, щоб
    cron, під-агент і запуски зі сконфігурованою стандартною моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Автентифікація власного сервера застосунку Codex

Власне середовище сервера застосунку Codex використовує посилання моделей `openai/*` плюс пропущену
конфігурацію runtime або provider/model `agentRuntime.id: "codex"`, але його автентифікація
все одно базується на обліковому записі. OpenClaw вибирає автентифікацію в такому порядку:

1. Упорядковані профілі автентифікації OpenAI для агента, бажано під
   `auth.order.openai`. Запустіть `openclaw doctor --fix`, щоб перенести старі
   застарілі ідентифікатори профілів автентифікації Codex і застарілий порядок автентифікації Codex.
2. Наявний обліковий запис сервера застосунку, наприклад локальний вхід ChatGPT через Codex CLI.
3. Лише для локальних запусків сервера застосунку через stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли сервер застосунку повідомляє, що облікового запису немає, але все ще потребує
   автентифікації OpenAI.

Це означає, що локальний вхід із підпискою ChatGPT/Codex не замінюється лише
тому, що процес Gateway також має `OPENAI_API_KEY` для прямих моделей OpenAI
або embeddings. Резервний env-ключ API використовується лише для локального шляху stdio без облікового запису; він
не надсилається до WebSocket-з’єднань сервера застосунку. Коли вибрано профіль Codex
у стилі підписки, OpenClaw також не передає `CODEX_API_KEY` і `OPENAI_API_KEY`
до породженого дочірнього процесу stdio сервера застосунку й надсилає вибрані облікові дані
через RPC входу сервера застосунку. Коли цей профіль підписки заблоковано
обмеженням використання Codex, OpenClaw може перейти до наступного впорядкованого API-key
профілю `openai:*` без зміни вибраної моделі або виходу із середовища Codex.
Коли час скидання підписки минає, профіль підписки знову стає придатним.

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень за ключем API OpenAI, так і генерацію зображень через OAuth Codex
через те саме посилання моделі `openai/gpt-image-2`.

| Можливість                | Ключ API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація                      | `OPENAI_API_KEY`                   | Вхід OAuth OpenAI Codex           |
| Транспорт                 | API зображень OpenAI                  | Бекенд Responses Codex              |
| Максимум зображень на запит    | 4                                  | 4                                    |
| Режим редагування                 | Увімкнено (до 5 референсних зображень) | Увімкнено (до 5 референсних зображень)   |
| Перевизначення розміру            | Підтримується, включно з розмірами 2K/4K   | Підтримується, включно з розмірами 2K/4K     |
| Співвідношення сторін / роздільність | Не пересилається до API зображень OpenAI | Зіставляється з підтримуваним розміром, коли це безпечно |

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

`gpt-image-2` є стандартним значенням як для генерації текст-у-зображення OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи прозорі запити за замовчуванням
`openai/gpt-image-2` на `gpt-image-1.5`; Azure і власні OpenAI-сумісні кінцеві
точки зберігають налаштовані назви розгортань/моделей.

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
`--openai-background` залишається доступним як OpenAI-специфічний псевдонім.
Використовуйте `--quality low|medium|high|auto`, коли потрібно керувати якістю
та вартістю OpenAI Images. Використовуйте `--openai-moderation low|auto`, щоб
передати OpenAI провайдер-специфічну підказку модерації з `image generate` або
`image edit`.

Для встановлень ChatGPT/Codex OAuth зберігайте той самий ref `openai/gpt-image-2`.
Коли налаштовано OAuth-профіль `openai`, OpenClaw визначає збережений токен
доступу OAuth і надсилає запити зображень через бекенд Codex Responses. Він
спершу не пробує `OPENAI_API_KEY` і не переходить тихо на API-ключ для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем, власною базовою
URL-адресою або кінцевою точкою Azure, коли вам потрібен прямий маршрут
OpenAI Images API.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній
адресі, також установіть `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`;
OpenClaw залишає приватні/внутрішні OpenAI-сумісні кінцеві точки зображень
заблокованими, якщо цього явного ввімкнення немає.

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
| Модель за замовчуванням | `openai/sora-2`                                                                   |
| Режими           | Перетворення тексту на відео, зображення на відео, редагування одного відео       |
| Вхідні референси | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується для перетворення тексту на відео та зображення на відео             |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

Запити OpenAI для перетворення зображення на відео використовують
`POST /v1/videos` із зображенням `input_reference`. Редагування одного відео
використовує `POST /v1/videos/edits` із завантаженим відео в полі `video`.

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

OpenClaw додає спільний внесок промпта GPT-5 для запусків родини GPT-5 на поверхнях промптів, зібраних OpenClaw. Він застосовується за ідентифікатором моделі, тому маршрути OpenClaw/провайдера, як-от застарілі refs до ремонту (застарілий ref Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні refs GPT-5, отримують те саме накладання. Старіші моделі GPT-4.x не отримують його.

Вбудований нативний harness Codex не отримує це накладання OpenClaw GPT-5 через developer instructions app-server Codex. Нативний Codex зберігає базову поведінку, модель і поведінку проєктних документів, що належать Codex, тоді як OpenClaw вимикає вбудовану особистість Codex для нативних тредів, щоб файли особистості робочого простору агента залишалися авторитетними. OpenClaw додає лише runtime-контекст, як-от доставку каналами, динамічні інструменти OpenClaw, делегування ACP, контекст робочого простору та OpenClaw skills.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації на відповідних промптах, зібраних OpenClaw. Поведінка відповідей, специфічна для каналу, і поведінка тихих повідомлень залишаються в спільному системному промпті OpenClaw та політиці вихідної доставки. Дружній шар стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (за замовчуванням) | Увімкнути дружній шар стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                      |
| `"off"`                | Вимкнути лише дружній стильовий шар       |

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
Під час виконання значення не чутливі до регістру, тому `"Off"` і `"off"` обидва вимикають дружній стильовий шар.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` досі читається як fallback сумісності, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Значення за замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Повертається до `OPENAI_API_KEY` |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Додаткове тіло | `messages.tts.providers.openai.extraBody` / `extra_body` | (не встановлено) |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` об’єднується в JSON запиту `/audio/speech` після згенерованих OpenClaw полів, тому використовуйте його для OpenAI-сумісних кінцевих точок, які потребують додаткових ключів, як-от `lang`. Ключі прототипу ігноруються.

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS, не впливаючи на кінцеву точку chat API. OpenAI TTS і Realtime voice обидва налаштовуються через API-ключ OpenAI Platform; встановлення лише з OAuth усе ще можуть використовувати моделі chat на базі Codex, але не OpenAI live talk-back.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрипції OpenClaw для розуміння медіа.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вводу: multipart-завантаження аудіофайлу
    - Підтримується OpenClaw скрізь, де вхідна транскрипція аудіо використовує
      `tools.media.audio`, включно із сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для вхідної транскрипції аудіо:

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

    Підказки мови та промпта пересилаються до OpenAI, коли їх надано спільною
    конфігурацією аудіомедіа або запитом транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Realtime-транскрипція">
    Вбудований Plugin `openai` реєструє realtime-транскрипцію для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Значення за замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Промпт | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Автентифікація | `...openai.apiKey`, `OPENAI_API_KEY` або `openai` OAuth | API-ключі підключаються напряму; OAuth випускає client secret для Realtime-транскрипції |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Коли налаштовано лише OAuth `openai`, Gateway випускає ефемерний client secret для Realtime-транскрипції перед відкриттям WebSocket. Цей streaming-провайдер призначений для шляху realtime-транскрипції Voice Call; голос Discord наразі записує короткі сегменти й натомість використовує шлях пакетної транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-голос">
    Вбудований Plugin `openai` реєструє realtime-голос для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Значення за замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура (міст розгортання Azure) | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Префіксне доповнення | `...openai.prefixPaddingMs` | `300` |
    | Зусилля reasoning | `...openai.reasoningEffort` | (не встановлено) |
    | Автентифікація | профіль автентифікації API-ключем `openai`, `...openai.apiKey` або `OPENAI_API_KEY` | Потрібен API-ключ OpenAI Platform; OpenAI OAuth не налаштовує Realtime-голос |

    Доступні вбудовані Realtime-голоси для `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI рекомендує `marin` і `cedar` для найкращої якості Realtime. Це
    окремий набір від наведених вище голосів Text-to-speech; не припускайте, що
    TTS-голос, як-от `fable`, `nova` або `onyx`, є дійсним для Realtime-сесій.

    <Note>
    Бекенд-мости OpenAI realtime використовують форму GA Realtime WebSocket-сесії, яка не приймає `session.temperature`. Розгортання Azure OpenAI залишаються доступними через `azureEndpoint` і `azureDeployment` та зберігають сумісну з розгортанням форму сесії. Підтримує двонапрямні виклики інструментів і аудіо G.711 u-law.
    </Note>

    <Note>
    Realtime-голос вибирається під час створення сесії. OpenAI дозволяє змінювати більшість
    полів сесії пізніше, але голос не можна змінити після того, як модель
    згенерувала аудіо в цій сесії. OpenClaw наразі відкриває вбудовані
    ідентифікатори Realtime-голосів як рядки.
    </Note>

    <Note>
    Control UI Talk використовує браузерні realtime-сеанси OpenAI з ефемерним
    клієнтським секретом, випущеним Gateway, і прямим браузерним обміном WebRTC
    SDP з OpenAI Realtime API. Gateway випускає цей клієнтський секрет за
    допомогою вибраного профілю автентифікації API-ключа `openai` або
    налаштованого API-ключа OpenAI Platform. Релей Gateway і realtime-мости
    WebSocket бекенда Voice Call використовують той самий шлях автентифікації
    лише за API-ключем для нативних кінцевих точок OpenAI. Maintainer live
    verification доступна через
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    гілки OpenAI перевіряють і бекендний міст WebSocket, і браузерний обмін
    WebRTC SDP без запису секретів у журнали.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для
генерації зображень через перевизначення базової URL-адреси. На шляху генерації
зображень OpenClaw виявляє імена хостів Azure у
`models.providers.openai.baseUrl` і автоматично перемикається на форму запиту
Azure.

<Note>
Realtime-голос використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон
**Realtime-голос** у розділі [Голос і мовлення](#voice-and-speech) для його
налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібні регіональне розміщення даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберегти трафік у межах наявного тенанта Azure

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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує стандартний таймаут запиту 600 с для викликів генерації
  зображень Azure. Значення `timeoutMs` для окремих викликів усе одно
  перевизначають це стандартне значення.

Інші базові URL-адреси (публічний OpenAI, проксі, сумісні з OpenAI) зберігають
стандартну форму запиту зображення OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який
користувацький `openai.baseUrl` як публічну кінцеву точку OpenAI і зазнають
помилки з розгортаннями зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб закріпити певну preview- або GA-версію
Azure для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Стандартне значення — `2024-12-01-preview`, коли змінну не задано.

### Назви моделей є назвами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень
Azure, маршрутизованих через вбудований провайдер `openai`, поле `model` в
OpenClaw має бути **назвою розгортання Azure**, яку ви налаштували на порталі
Azure, а не ідентифікатором публічної моделі OpenAI.

Якщо ви створили розгортання з назвою `gpt-image-2-prod`, яке обслуговує
`gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назви розгортання застосовується до викликів генерації
зображень, маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів (наприклад,
`eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Перевірте
поточний список регіонів Microsoft перед створенням розгортання і підтвердьте,
що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри
зображень. Azure може відхиляти параметри, які дозволяє публічний OpenAI
(наприклад, певні значення `background` для `gpt-image-2`), або надавати їх
лише для конкретних версій моделі. Ці відмінності походять від Azure і базової
моделі, а не від OpenClaw. Якщо запит Azure завершується помилкою валідації,
перевірте набір параметрів, який підтримують ваше конкретне розгортання і
версія API на порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути та
маршрути, сумісні з OpenAI** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (за межами генерації зображень)
використовуйте потік онбордингу або спеціальну конфігурацію провайдера Azure —
сам лише `openai.baseUrl` не застосовує форму API/автентифікації Azure. Існує
окремий провайдер `azure-openai-responses/*`; див. акордеон Server-side
Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket і SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) для `openai/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед резервним переходом на SSE
    - Після збою позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сеансу й ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (стандартно) | Спочатку WebSocket, резервний перехід на SSE |
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

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`. `fastMode: "auto"` запускає нові виклики моделі у швидкому режимі до автоматичного порога, а потім запускає пізніші повторні, резервні, tool-result або continuation виклики без швидкого режиму. Поріг стандартно становить 60 секунд; задайте `params.fastAutoOnSeconds` на активній моделі, щоб змінити його.

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
    Перевизначення сеансу мають перевагу над конфігурацією. Очищення перевизначення сеансу в Sessions UI повертає сеанс до налаштованого стандартного значення.
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
    `serviceTier` пересилається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Серверне Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку OpenClaw у Plugin OpenAI автоматично вмикає серверне Compaction:

    - Примусово задає `store: true` (якщо model compat не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Стандартний `compact_threshold`: 70% від `contextWindow` (або `80000`, коли недоступно)

    Це застосовується до вбудованого runtime-шляху OpenClaw і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний app-server harness Codex керує власним контекстом через Codex і налаштовується стандартним маршрутом агента OpenAI або runtime-політикою провайдера/моделі.

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
      <Tab title="Користувацький поріг">
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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses усе одно примусово задають `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий agentic-режим GPT">
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
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Повторює структурно порожні або лише reasoning ходи з продовженням видимої відповіді
    - Використовує явні події плану harness, коли вибраний harness їх надає

    OpenClaw не класифікує прозу асистента, щоб вирішити, чи є хід планом, оновленням прогресу або фінальною відповіддю.

    <Note>
    Обмежено лише запусками сімейства GPT-5 для OpenAI і Codex. Інші провайдери й старіші сімейства моделей зберігають стандартну поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та маршрути, сумісні з OpenAI">
    OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше, ніж універсальні проксі `/v1`, сумісні з OpenAI:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Стандартно переводять схеми інструментів у строгий режим
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Маршрути проксі/сумісності:**
    - Використовувати менш сувору поведінку сумісності
    - Вилучати Completions `store` з ненативних payloads `openai-completions`
    - Приймати розширений pass-through JSON `params.extra_body`/`params.extraBody` для проксі Completions, сумісних з OpenAI
    - Приймати `params.chat_template_kwargs` для проксі Completions, сумісних з OpenAI, таких як vLLM
    - Не примусово застосовувати суворі схеми інструментів або лише нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладні відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
