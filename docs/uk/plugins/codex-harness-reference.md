---
read_when:
    - Вам потрібне кожне поле конфігурації обгортки Codex
    - Ви змінюєте транспорт app-server, автентифікацію, виявлення або поведінку тайм-аутів
    - Ви налагоджуєте запуск обв’язки Codex, виявлення моделей або ізоляцію середовища
summary: Довідник із конфігурації, автентифікації, виявлення та сервера застосунку для обв’язки Codex
title: Довідник з обв’язки Codex
x-i18n:
    generated_at: "2026-05-11T20:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

У цьому довіднику описано детальну конфігурацію для вбудованого плагіна `codex`. Для налаштування й рішень щодо маршрутизації почніть із
[Codex harness](/uk/plugins/codex-harness).

## Поверхня конфігурації Plugin

Усі налаштування Codex harness розташовані в `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Підтримувані поля верхнього рівня:

| Поле                       | Типове значення          | Значення                                                                                                                                  |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | увімкнено                | Налаштування виявлення моделей для Codex app-server `model/list`.                                                                         |
| `appServer`                | керований stdio app-server | Налаштування транспорту, команди, автентифікації, схвалення, sandbox і тайм-аутів.                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Використайте `"direct"`, щоб розмістити динамічні інструменти OpenClaw безпосередньо в початковому контексті інструментів Codex.          |
| `codexDynamicToolsExclude` | `[]`                     | Додаткові назви динамічних інструментів OpenClaw, які потрібно пропускати в ходах Codex app-server.                                       |
| `codexPlugins`             | вимкнено                 | Нативна підтримка плагінів/app Codex для мігрованих curated plugins, установлених із вихідного коду. Див. [Нативні плагіни Codex](/uk/plugins/codex-native-plugins). |
| `computerUse`              | вимкнено                 | Налаштування Codex Computer Use. Див. [Codex Computer Use](/uk/plugins/codex-computer-use).                                                  |

## Транспорт app-server

За замовчуванням OpenClaw запускає керований бінарний файл Codex, що постачається з вбудованим плагіном:

```bash
codex app-server --listen stdio://
```

Це прив’язує версію app-server до вбудованого плагіна `codex`, а не до будь-якого окремого Codex CLI, який може бути встановлений локально. Установлюйте
`appServer.command` лише тоді, коли свідомо хочете запускати інший виконуваний файл.

Для app-server, який уже запущений, використовуйте транспорт WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Підтримувані поля `appServer`:

| Поле                          | Типове значення                                        | Значення                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                                                                                                                 |
| `command`                     | керований бінарний файл Codex                          | Виконуваний файл для транспорту stdio. Залиште невстановленим, щоб використовувати керований бінарний файл.                                                                                     |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Аргументи для транспорту stdio.                                                                                                                                                                 |
| `url`                         | не встановлено                                         | URL WebSocket app-server.                                                                                                                                                                       |
| `authToken`                   | не встановлено                                         | Bearer token для транспорту WebSocket.                                                                                                                                                          |
| `headers`                     | `{}`                                                   | Додаткові заголовки WebSocket.                                                                                                                                                                  |
| `clearEnv`                    | `[]`                                                   | Додаткові назви змінних середовища, які видаляються з породженого процесу stdio app-server після того, як OpenClaw сформує успадковане середовище.                                              |
| `requestTimeoutMs`            | `60000`                                                | Тайм-аут для викликів площини керування app-server.                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Тихе вікно після запиту app-server у межах ходу, поки OpenClaw очікує на `turn/completed`.                                                                                                      |
| `mode`                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Пресет для виконання YOLO або виконання з перевіркою guardian.                                                                                                                                  |
| `approvalPolicy`              | `"never"` або дозволена політика схвалення guardian    | Нативна політика схвалення Codex, надіслана під час запуску thread, resume і turn.                                                                                                              |
| `sandbox`                     | `"danger-full-access"` або дозволений sandbox guardian | Нативний режим sandbox Codex, надісланий під час запуску й resume thread.                                                                                                                       |
| `approvalsReviewer`           | `"user"` або дозволений рецензент guardian             | Використайте `"auto_review"`, щоб дозволити Codex переглядати нативні запити схвалення, коли це дозволено.                                                                                      |
| `defaultWorkspaceDir`         | поточний каталог процесу                               | Робочий простір, який використовується `/codex bind`, коли `--cwd` пропущено.                                                                                                                   |
| `serviceTier`                 | не встановлено                                         | Необов’язковий рівень сервісу Codex app-server. `"priority"` вмикає маршрутизацію fast-mode, `"flex"` запитує flex-обробку, а `null` очищає перевизначення. Застаріле `"fast"` приймається як `"priority"`. |

Плагін блокує старіші або неверсійовані handshake app-server. Codex app-server має повідомляти стабільну версію `0.125.0` або новішу.

## Режими схвалення й sandbox

Локальні сеанси stdio app-server типово використовують режим YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Така довірена локальна операторська позиція дає змогу не супроводжуваним ходам OpenClaw і heartbeats просуватися без нативних запитів схвалення, на які ніхто не зможе відповісти.

Якщо файл локальних системних вимог Codex забороняє неявні значення схвалення YOLO, reviewer або sandbox, OpenClaw натомість розглядає неявне типове значення як guardian і вибирає дозволені дозволи guardian. Записи
`[[remote_sandbox_config]]` у тому самому файлі вимог, що збігаються з hostname, враховуються під час вибору типового sandbox.

Установіть `appServer.mode: "guardian"` для схвалень Codex із перевіркою guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`, коли ці значення дозволені. Окремі поля політики перевизначають `mode`. Старіше значення reviewer
`guardian_subagent` усе ще приймається як сумісний псевдонім, але в нових конфігураціях слід використовувати `auto_review`.

## Автентифікація та ізоляція середовища

Автентифікація вибирається в такому порядку:

1. Явний профіль автентифікації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а автентифікація OpenAI усе ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він видаляє
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це зберігає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI, не дозволяючи нативним ходам Codex app-server випадково оплачуватися через API.

Явні профілі API-ключів Codex і локальний резервний варіант env-key для stdio використовують login app-server замість успадкованого середовища дочірнього процесу. Підключення WebSocket app-server не отримують резервний API-key середовища Gateway; використовуйте явний профіль автентифікації або власний обліковий запис віддаленого app-server.

Запуски stdio app-server типово успадковують середовище процесу OpenClaw, але OpenClaw керує мостом облікового запису Codex app-server і встановлює як `CODEX_HOME`, так і
`HOME` у каталоги для кожного агента в межах стану OpenClaw цього агента. Власний завантажувач Skills Codex читає `$CODEX_HOME/skills` і `$HOME/.agents/skills`, тому обидва значення ізольовані для локальних запусків app-server. Це утримує нативні для Codex skills, plugins, config, accounts і thread state у межах агента OpenClaw, замість витоку з особистого Codex CLI home оператора.

Плагіни OpenClaw і snapshots Skills OpenClaw усе ще проходять через власний реєстр плагінів і завантажувач Skills OpenClaw. Особисті ресурси Codex CLI не проходять. Якщо у вас є корисні Skills або plugins Codex CLI, які мають стати частиною агента OpenClaw, внесіть їх в інвентар явно:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Якщо розгортанню потрібна додаткова ізоляція середовища, додайте ці змінні до
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` впливає лише на породжений дочірній процес Codex app-server.
`CODEX_HOME` і `HOME` залишаються зарезервованими для ізоляції Codex для кожного агента OpenClaw під час локальних запусків.

## Динамічні інструменти

Динамічні інструменти Codex типово використовують завантаження `searchable`. OpenClaw не відкриває динамічні інструменти, які дублюють нативні операції робочого простору Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Інші інструменти інтеграції OpenClaw, як-от обмін повідомленнями, сеанси, медіа, cron,
браузер, вузли, gateway, `heartbeat_respond` і `web_search`, доступні
через пошук інструментів Codex у просторі імен `openclaw`. Це зменшує початковий
контекст моделі. `sessions_yield` і відповіді джерела лише через інструмент повідомлень
залишаються прямими, оскільки це контракти керування ходом.

Встановлюйте `codexDynamicToolsLoading: "direct"` лише під час підключення до користувацького Codex
app-server, який не може шукати відкладені динамічні інструменти, або під час налагодження повного
навантаження інструментів.

## Тайм-аути

Динамічні виклики інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`. Кожен запит Codex `item/tool/call` використовує перший
доступний тайм-аут у такому порядку:

- Позитивний аргумент `timeoutMs` для окремого виклику.
- Для `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Для інструмента `image` розуміння медіа, `tools.media.image.timeoutSeconds`,
  перетворений у мілісекунди, або стандартне значення 60 секунд для медіа.
- Стандартне значення 30 секунд для динамічних інструментів.

Бюджети динамічних інструментів обмежені 600000 мс. У разі тайм-ауту OpenClaw перериває
сигнал інструмента там, де це підтримується, і повертає Codex відповідь про невдале виконання
динамічного інструмента, щоб хід міг продовжитися, замість залишати сеанс у стані `processing`.

Після того як OpenClaw відповідає на обмежений ходом запит Codex app-server, harness
також очікує, що Codex завершить нативний хід через `turn/completed`. Якщо
app-server мовчить протягом `appServer.turnCompletionIdleTimeoutMs` після цієї
відповіді, OpenClaw у міру можливості перериває хід Codex, записує діагностичний
тайм-аут і звільняє смугу сеансу OpenClaw, щоб подальші повідомлення чату
не ставали в чергу за застарілим нативним ходом.

Будь-яке нетермінальне сповіщення для того самого ходу, зокрема
`rawResponseItem/completed`, вимикає цей короткий сторожовий таймер, оскільки Codex
довів, що хід усе ще живий. Довший термінальний сторожовий таймер продовжує
захищати справді завислі ходи. Діагностика тайм-аутів містить останній метод
сповіщення app-server і, для сирих елементів відповіді асистента, тип елемента, роль,
id та обмежений попередній перегляд тексту асистента.

## Виявлення моделей

За замовчуванням Codex Plugin запитує в app-server доступні моделі. Доступністю
моделей володіє Codex app-server, тому список може змінюватися, коли OpenClaw
оновлює вбудовану версію `@openai/codex` або коли розгортання вказує
`appServer.command` на інший бінарний файл Codex. Доступність також може залежати
від облікового запису. Використовуйте `/codex models` на запущеному gateway, щоб побачити живий каталог
для цього harness і облікового запису.

Якщо виявлення завершується помилкою або тайм-аутом, OpenClaw використовує вбудований резервний каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Поточний вбудований harness — `@openai/codex` `0.130.0`. Зонд `model/list`
для цього вбудованого app-server повернув:

| ID моделі             | За замовчуванням | Прихована | Модальності вводу | Зусилля reasoning        |
| --------------------- | ---------------- | --------- | ----------------- | ------------------------ |
| `gpt-5.5`             | Так              | Ні        | text, image       | low, medium, high, xhigh |
| `gpt-5.4`             | Ні               | Ні        | text, image       | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Ні               | Ні        | text, image       | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Ні               | Ні        | text, image       | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Ні               | Ні        | text              | low, medium, high, xhigh |
| `gpt-5.2`             | Ні               | Ні        | text, image       | low, medium, high, xhigh |

Приховані моделі можуть повертатися каталогом app-server для внутрішніх або
спеціалізованих потоків, але вони не є звичайними варіантами у виборі моделі.

Налаштуйте виявлення в `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Вимкніть виявлення, якщо хочете, щоб запуск не зондував Codex і використовував лише
резервний каталог:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Файли початкового налаштування робочого простору

Codex сам обробляє `AGENTS.md` через нативне виявлення документації проєкту. OpenClaw
не записує синтетичні файли документації проєкту Codex і не залежить від резервних
імен файлів Codex для файлів персони, оскільки резервні варіанти Codex застосовуються лише тоді, коли
`AGENTS.md` відсутній.

Для паритету робочого простору OpenClaw harness Codex розв’язує інші файли початкового налаштування,
зокрема `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` і `MEMORY.md`, коли вони присутні, і пересилає їх
через інструкції розробника Codex у `thread/start` і `thread/resume`.
Це зберігає контекст персони й профілю робочого простору видимим на нативній смузі
формування поведінки Codex без дублювання `AGENTS.md`.

## Перевизначення середовища

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є бажаною для повторюваних розгортань, оскільки вона зберігає поведінку Plugin у тому самому
переглянутому файлі, що й решта налаштування harness Codex.

## Пов’язане

- [Codex harness](/uk/plugins/codex-harness)
- [Codex harness runtime](/uk/plugins/codex-harness-runtime)
- [Нативні Plugin Codex](/uk/plugins/codex-native-plugins)
- [Codex Computer Use](/uk/plugins/codex-computer-use)
- [Провайдер OpenAI](/uk/providers/openai)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
