---
read_when:
    - Потрібні всі поля конфігурації обв’язки Codex
    - Ви змінюєте поведінку транспорту, автентифікації, виявлення або тайм-аутів app-server
    - Ви налагоджуєте запуск Codex harness, виявлення моделей або ізоляцію середовища
summary: Довідник із конфігурації, автентифікації, виявлення та сервера застосунку для Codex harness
title: Довідка про середовище Codex
x-i18n:
    generated_at: "2026-06-27T17:50:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Цей довідник охоплює детальну конфігурацію для вбудованого Plugin `codex`. Щодо налаштування та рішень маршрутизації почніть із
[обв’язки Codex](/uk/plugins/codex-harness).

## Конфігураційна поверхня Plugin

Усі налаштування обв’язки Codex розміщені в `plugins.entries.codex.config`.

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

| Поле                       | За замовчуванням         | Значення                                                                                                                                  |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | увімкнено                | Налаштування виявлення моделей для Codex app-server `model/list`.                                                                        |
| `appServer`                | керований stdio app-server | Налаштування транспорту, команди, автентифікації, схвалення, пісочниці та тайм-ауту.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Використовуйте `"direct"`, щоб розмістити динамічні інструменти OpenClaw безпосередньо в початковому контексті інструментів Codex.       |
| `codexDynamicToolsExclude` | `[]`                     | Додаткові назви динамічних інструментів OpenClaw, які слід пропускати під час ходів Codex app-server.                                    |
| `codexPlugins`             | вимкнено                 | Нативна підтримка Plugin/застосунків Codex для мігрованих добірних плагінів, установлених із вихідного коду. Див. [нативні Plugin Codex](/uk/plugins/codex-native-plugins). |
| `computerUse`              | вимкнено                 | Налаштування Codex Computer Use. Див. [Codex Computer Use](/uk/plugins/codex-computer-use).                                                  |

## Транспорт app-server

За замовчуванням OpenClaw запускає керований двійковий файл Codex, що постачається з вбудованим
Plugin:

```bash
codex app-server --listen stdio://
```

Це прив’язує версію app-server до вбудованого Plugin `codex`, а не до
будь-якого окремого Codex CLI, який може бути встановлений локально. Задавайте
`appServer.command` лише тоді, коли навмисно хочете запустити інший
виконуваний файл.

Для app-server, який уже запущено, використовуйте транспорт WebSocket:

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

| Поле                                          | За замовчуванням                                      | Значення                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                                                                                                                                                                                                                                                                                 |
| `command`                                     | керований двійковий файл Codex                         | Виконуваний файл для транспорту stdio. Залиште незаданим, щоб використовувати керований двійковий файл.                                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Аргументи для транспорту stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | не задано                                              | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | не задано                                              | Bearer-токен для транспорту WebSocket. Приймає літеральний рядок або SecretInput, наприклад `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | Додаткові заголовки WebSocket. Значення заголовків приймають літеральні рядки або значення SecretInput, наприклад `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Додаткові назви змінних середовища, які видаляються зі створеного процесу stdio app-server після того, як OpenClaw побудує своє успадковане середовище.                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | не задано                                              | Корінь віддаленого робочого простору Codex app-server. Якщо задано, OpenClaw виводить корінь локального робочого простору з розв'язаного робочого простору OpenClaw, зберігає поточний суфікс cwd під цим віддаленим коренем і надсилає до Codex лише фінальний cwd app-server. Якщо cwd перебуває поза розв'язаним коренем робочого простору OpenClaw, OpenClaw завершується закрито замість надсилання локального для Gateway шляху до віддаленого app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Тайм-аут для викликів площини керування app-server.                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Тихе вікно після того, як Codex приймає хід, або після запиту app-server у межах ходу, поки OpenClaw очікує на `turn/completed`.                                                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Захист простою завершення та прогресу, що використовується після передавання інструменту, завершення нативного інструменту, прогресу сирого асистента після інструменту, завершення сирого міркування або прогресу міркування, поки OpenClaw очікує на `turn/completed`. Використовуйте це для довірених або важких робочих навантажень, де синтез після інструменту може законно залишатися тихим довше, ніж фінальний бюджет випуску асистента. |
| `mode`                                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Пресет для YOLO або виконання з перевіркою опікуном.                                                                                                                                                                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` або дозволена політика схвалення опікуна     | Нативна політика схвалення Codex, що надсилається під час запуску потоку, відновлення та ходу.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` або дозволена пісочниця опікуна | Нативний режим пісочниці Codex, що надсилається під час запуску та відновлення потоку. Активні пісочниці OpenClaw звужують ходи `danger-full-access` до Codex `workspace-write`; прапорець мережі ходу відповідає вихідному трафіку пісочниці OpenClaw.                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` або дозволений рецензент-опікун               | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити схвалення, коли це дозволено.                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | поточний каталог процесу                               | Робочий простір, який використовується `/codex bind`, коли `--cwd` опущено.                                                                                                                                                                                                                                                                                                                      |
| `serviceTier`                                 | не задано                                              | Необов'язковий рівень сервісу Codex app-server. `"priority"` вмикає маршрутизацію швидкого режиму, `"flex"` запитує гнучке оброблення, а `null` очищує перевизначення. Застаріле `"fast"` приймається як `"priority"`.                                                                                                                                                                            |
| `networkProxy`                                | вимкнено                                               | Увімкнення мережі профілю дозволів Codex для команд app-server. OpenClaw визначає вибрану конфігурацію `permissions.<profile>.network` і вибирає її через `default_permissions` замість надсилання `sandbox`.                                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Попереднє ввімкнення, яке реєструє середовище Codex на основі пісочниці OpenClaw у Codex app-server 0.132.0 або новішому, щоб нативне виконання Codex могло працювати всередині активної пісочниці OpenClaw.                                                                                                                                                                                       |

`appServer.networkProxy` є явним, тому що він змінює контракт пісочниці Codex.
Коли його ввімкнено, OpenClaw також задає `features.network_proxy.enabled` і
`default_permissions` у конфігурації потоку Codex, щоб згенерований профіль
дозволів міг запустити керовану мережею Codex роботу. За замовчуванням OpenClaw
генерує стійку до колізій назву профілю `openclaw-network-<fingerprint>` з тіла
профілю; використовуйте `profileName` лише тоді, коли потрібна стабільна локальна назва.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Якщо звичайний runtime app-server був би `danger-full-access`, увімкнення
`networkProxy` використовує доступ до файлової системи у стилі робочого простору
для згенерованого профілю дозволів. Кероване Codex мережеве застосування правил
є мережею в пісочниці, тому профіль із повним доступом не захищав би вихідний трафік.

Plugin блокує старіші або неверсіоновані рукостискання app-server. Codex app-server
має повідомляти стабільну версію `0.125.0` або новішу.

OpenClaw розглядає WebSocket URL-и app-server, що не є loopback, як віддалені та вимагає
WebSocket автентифікацію з ідентифікаційними даними через `appServer.authToken` або
заголовок `Authorization`. `appServer.authToken` і кожне значення `appServer.headers.*`
може бути SecretInput; secrets runtime розв’язує SecretRefs і скорочення env
перед тим, як OpenClaw будує параметри запуску app-server, а нерозв’язані
структуровані SecretRefs завершуються помилкою до надсилання будь-якого токена чи заголовка.
Коли налаштовано нативні Plugin-и Codex, OpenClaw використовує plugin control
plane підключеного app-server, щоб установити або оновити ці Plugin-и, а потім
оновлює інвентар застосунків, щоб застосунки, що належать Plugin-ам, були видимі
для потоку Codex. `app/list` і надалі є авторитетним джерелом інвентарю та
метаданих, але політика OpenClaw вирішує, чи надсилає `thread/start`
`config.apps[appId].enabled = true` для переліченого доступного застосунку,
навіть якщо Codex наразі позначає його як вимкнений. Невідомі або відсутні id
застосунків залишаються fail-closed; цей шлях лише активує marketplace Plugin-и
через `plugin/install` і оновлює інвентар. Підключайте OpenClaw лише до
віддалених app-server, яким довірено приймати керовані OpenClaw встановлення
Plugin-ів і оновлення інвентарю застосунків.

## Режими схвалення та sandbox

Локальні stdio сеанси app-server типово використовують режим YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Така довірена позиція локального оператора дає
змогу неуважним ходам OpenClaw і Heartbeat просуватися без нативних запитів
схвалення, на які нікому відповісти.

Якщо локальний файл системних вимог Codex забороняє неявні значення схвалення
YOLO, рецензента або sandbox, OpenClaw натомість розглядає неявне типове
значення як guardian і вибирає дозволені дозволи guardian. `tools.exec.mode: "auto"`
також примусово вмикає схвалення Codex із guardian-рецензуванням і не зберігає
небезпечні застарілі перевизначення `approvalPolicy: "never"` або
`sandbox: "danger-full-access"`; задайте `tools.exec.mode: "full"` для навмисної
позиції без схвалень. Записи
`[[remote_sandbox_config]]` у тому самому файлі вимог, що збігаються за hostname,
враховуються для рішення про типове значення sandbox.

Задайте `appServer.mode: "guardian"` для схвалень Codex із guardian-рецензуванням:

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
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`, коли ці
значення дозволені. Окремі поля політики перевизначають `mode`. Старіше
значення рецензента `guardian_subagent` досі приймається як сумісний псевдонім,
але нові конфігурації мають використовувати `auto_review`.

Коли sandbox OpenClaw активний, локальний процес Codex app-server все одно
працює на хості Gateway. Тому OpenClaw вимикає нативний Code Mode Codex,
користувацькі MCP-сервери та виконання Plugin-ів, підтриманих застосунками, для
цього ходу, замість того щоб вважати sandboxing на боці хоста Codex еквівалентом
sandbox backend OpenClaw. Доступ до shell надається через динамічні інструменти,
підтримані sandbox OpenClaw, як-от `sandbox_exec` і `sandbox_process`, коли
звичайні інструменти exec/process доступні.

На хостах Ubuntu/AppArmor Codex bwrap може завершитися помилкою в
`workspace-write` до запуску shell-команди, коли ви навмисно запускаєте нативний
Codex `workspace-write` без активного sandboxing OpenClaw. Якщо бачите
`bwrap: setting up uid map: Permission denied` або
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, запустіть
`openclaw doctor` і виправте повідомлену політику namespace хоста для
службового користувача OpenClaw, замість надання ширших привілеїв Docker
контейнеру. Надавайте перевагу обмеженому профілю AppArmor для процесу служби;
резервний варіант `kernel.apparmor_restrict_unprivileged_userns=0` діє на весь
хост і має компроміси безпеки.

## Нативне виконання в sandbox

Стабільне типове значення є fail-closed: активний sandboxing OpenClaw вимикає
нативні поверхні виконання Codex, які інакше запускалися б із хоста Codex
app-server. Використовуйте `appServer.experimental.sandboxExecServer: true`
лише тоді, коли хочете спробувати підтримку віддаленого середовища Codex із
sandbox backend OpenClaw. Цей preview-шлях потребує Codex app-server 0.132.0 або
новішого.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Коли прапорець увімкнено і поточний сеанс OpenClaw працює в sandbox, OpenClaw
запускає exec-server через local loopback, підтриманий активним sandbox,
реєструє його в Codex app-server і запускає потік та хід Codex із цим
середовищем, що належить OpenClaw. Якщо app-server не може зареєструвати
середовище, виконання fail-closed, замість мовчазного відкату до виконання на
хості.

Цей preview-шлях є лише локальним. Віддалений WebSocket app-server не може
досягти loopback exec-server, якщо він не працює на тому самому хості, тому
OpenClaw відхиляє таку комбінацію.

## Автентифікація та ізоляція середовища

Автентифікація вибирається в такому порядку:

1. Явний профіль автентифікації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а автентифікація
   OpenAI досі потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він
видаляє `CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу
Codex. Це залишає API-ключі рівня Gateway доступними для embeddings або прямих
моделей OpenAI, не дозволяючи нативним ходам Codex app-server випадково
тарифікуватися через API.

Явні профілі Codex з API-ключем і локальний stdio fallback env-ключа
використовують вхід app-server замість успадкованого env дочірнього процесу.
WebSocket підключення app-server не отримують Gateway env API-key fallback;
використовуйте явний профіль автентифікації або власний обліковий запис
віддаленого app-server.

Запуски stdio app-server типово успадковують середовище процесу OpenClaw.
OpenClaw володіє мостом облікового запису Codex app-server і задає `CODEX_HOME`
як окремий для агента каталог у стані OpenClaw цього агента. Це тримає
конфігурацію Codex, облікові записи, кеш/дані Plugin-ів і стан потоків у межах
агента OpenClaw, замість витікання з персонального home оператора `~/.codex`.

OpenClaw не переписує `HOME` для звичайних локальних запусків app-server.
Підпроцеси, запущені Codex, як-от `openclaw`, `gh`, `git`, хмарні CLI та
shell-команди, бачать звичайний home процесу й можуть знаходити конфігурацію та
токени user-home. Codex також може виявляти `$HOME/.agents/skills` і
`$HOME/.agents/plugins/marketplace.json`; це виявлення `.agents` навмисно
спільне з home оператора й окреме від ізольованого стану `~/.codex`.

Plugin-и OpenClaw і знімки Skills OpenClaw і надалі проходять через власний
реєстр Plugin-ів і завантажувач skill OpenClaw. Персональні активи Codex
`~/.codex` не проходять. Якщо у вас є корисні Skills або Plugin-и Codex CLI з
Codex home, які мають стати частиною агента OpenClaw, явно інвентаризуйте їх:

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
OpenClaw видаляє `CODEX_HOME` і `HOME` із цього списку під час нормалізації
локального запуску: `CODEX_HOME` залишається окремим для агента, а `HOME`
залишається успадкованим, щоб підпроцеси могли використовувати звичайний стан
user-home.

## Динамічні інструменти

Динамічні інструменти Codex типово завантажуються як `searchable`. OpenClaw не
надає динамічні інструменти, які дублюють нативні workspace-операції Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Більшість решти інтеграційних інструментів OpenClaw, як-от messaging, media,
cron, browser, nodes, gateway, `heartbeat_respond` і `web_search`, доступні
через пошук інструментів Codex у namespace `openclaw`. Це зменшує початковий
контекст моделі. `sessions_yield` і відповіді джерела лише для message-tool
залишаються прямими, бо це контракти керування ходом. `sessions_spawn`
залишається searchable, щоб нативний `spawn_agent` Codex залишався основною
поверхнею subagent Codex, тоді як явне делегування OpenClaw або ACP досі
доступне через namespace динамічних інструментів `openclaw`.

Задавайте `codexDynamicToolsLoading: "direct"` лише під час підключення до
кастомного Codex app-server, який не може шукати відкладені динамічні
інструменти, або під час налагодження повного payload інструментів.

## Тайм-аути

Виклики динамічних інструментів, що належать OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`. Кожен запит Codex `item/tool/call` використовує
перший доступний тайм-аут у такому порядку:

- Додатний аргумент `timeoutMs` для окремого виклику.
- Для `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Для `image_generate` без налаштованого тайм-ауту, типове значення
  image-generation 120 секунд.
- Для інструмента media-understanding `image`, `tools.media.image.timeoutSeconds`,
  перетворене в мілісекунди, або типове значення media 60 секунд. Для image
  understanding це застосовується до самого запиту й не зменшується попередньою
  підготовчою роботою.
- Типове значення dynamic-tool 90 секунд.

Цей watchdog є зовнішнім бюджетом динамічного `item/tool/call`. Специфічні для
провайдера тайм-аути запитів виконуються всередині цього виклику й зберігають
власну семантику тайм-аутів. Бюджети динамічних інструментів обмежені
600000 ms. У разі тайм-ауту OpenClaw перериває сигнал інструмента, де це
підтримується, і повертає невдалу відповідь dynamic-tool до Codex, щоб хід міг
продовжитися, замість залишати сеанс у `processing`.

Після того як Codex приймає хід, і після того як OpenClaw відповідає на запит
app-server у межах ходу, harness очікує, що Codex просуватиметься в поточному
ході й зрештою завершить нативний хід через `turn/completed`. Якщо app-server
мовчить протягом `appServer.turnCompletionIdleTimeoutMs`, OpenClaw best-effort
перериває хід Codex, записує діагностичний тайм-аут і звільняє lane сеансу
OpenClaw, щоб наступні повідомлення чату не стояли в черзі за застарілим
нативним ходом.

Більшість нетермінальних сповіщень для того самого ходу вимикають цей короткий watchdog,
оскільки Codex довів, що хід досі активний. Передавання інструментам використовують довший
бюджет простою після інструмента: після того як OpenClaw повертає відповідь `item/tool/call`, після
завершення нативних елементів інструментів, як-от `commandExecution`, після завершень сирих
`custom_tool_call_output`, а також після сирого прогресу асистента після інструмента,
завершень сирого reasoning або прогресу reasoning. Захист використовує
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, коли його налаштовано, а інакше
за замовчуванням становить п’ять хвилин. Той самий післяінструментний бюджет також розширює
watchdog прогресу для тихого вікна синтезу перед тим, як Codex випустить наступну подію
поточного ходу. Завершення reasoning, завершення commentary
`agentMessage` і сирий прогрес reasoning або асистента до інструмента можуть
супроводжуватися автоматичною фінальною відповіддю, тому вони використовують захист відповіді
після прогресу замість негайного звільнення смуги сесії. Лише
фінальні/некоментарні завершені елементи `agentMessage` і сирі завершення асистента
до інструмента вмикають звільнення виводу асистента: якщо після цього Codex замовкає без
`turn/completed`, OpenClaw у режимі best-effort перериває нативний хід і звільняє
смугу сесії. Безпечні для повторного відтворення збої stdio app-server, зокрема
тайм-аути простою завершення ходу без доказів асистента, інструмента, активного елемента або
побічного ефекту, повторюються один раз у свіжій спробі app-server. Небезпечні
тайм-аути все одно списують завислий клієнт app-server і звільняють смугу сесії
OpenClaw. Вони також очищають застаріле прив’язування нативного потоку замість
автоматичного повторного відтворення. Тайм-аути спостереження за завершенням показують
специфічний для Codex текст тайм-ауту: у безпечних для повторення випадках зазначено, що
відповідь може бути неповною, тоді як небезпечні випадки просять користувача перевірити
поточний стан перед повторною спробою. Публічна діагностика тайм-аутів містить структурні
поля, як-от останній метод сповіщення app-server, ідентифікатор/тип/роль сирого елемента
відповіді асистента, кількість активних запитів/елементів і стан увімкненого спостереження.
Коли останнє сповіщення є сирим елементом відповіді асистента, вона також містить
обмежений попередній перегляд тексту асистента. Вона не містить сирого prompt або
вмісту інструментів.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Доступність
моделей належить Codex app-server, тому список може змінюватися, коли OpenClaw
оновлює вбудовану версію `@openai/codex` або коли розгортання спрямовує
`appServer.command` на інший бінарний файл Codex. Доступність також може бути
обмежена обліковим записом. Використовуйте `/codex models` на запущеному gateway, щоб побачити живий каталог
для цього harness і облікового запису.

Якщо виявлення зазнає збою або тайм-ауту, OpenClaw використовує вбудований fallback-каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Поточний вбудований harness — це `@openai/codex` `0.139.0`. Проба `model/list`
проти цього вбудованого app-server повернула:

| Ідентифікатор моделі | Типова | Прихована | Модальності введення | Рівні зусиль reasoning   |
| -------------------- | ------ | --------- | -------------------- | ------------------------ |
| `gpt-5.5`            | Так    | Ні        | text, image          | low, medium, high, xhigh |
| `gpt-5.4`            | Ні     | Ні        | text, image          | low, medium, high, xhigh |
| `gpt-5.4-mini`       | Ні     | Ні        | text, image          | low, medium, high, xhigh |
| `gpt-5.3-codex`      | Ні     | Ні        | text, image          | low, medium, high, xhigh |
| `gpt-5.2`            | Ні     | Ні        | text, image          | low, medium, high, xhigh |

Приховані моделі можуть повертатися каталогом app-server для внутрішніх або
спеціалізованих потоків, але вони не є звичайними варіантами у виборі моделей.

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

Вимкніть виявлення, коли хочете, щоб запуск уникав зондування Codex і використовував лише
fallback-каталог:

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

## Файли bootstrap робочої області

Codex сам обробляє `AGENTS.md` через нативне виявлення проєктної документації. OpenClaw
не записує синтетичні файли проєктної документації Codex і не залежить від fallback-
імен файлів Codex для файлів persona, оскільки fallback Codex застосовується лише тоді, коли
`AGENTS.md` відсутній.

Для паритету робочої області OpenClaw harness Codex розв’язує інші bootstrap-
файли. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` і `USER.md` передаються як
developer-інструкції OpenClaw Codex, оскільки вони визначають активного агента,
доступні вказівки робочої області та профіль користувача. Компактний список Skills
OpenClaw передається як developer-інструкції співпраці, обмежені ходом.
Вміст `HEARTBEAT.md` не інжектується; ходи heartbeat отримують вказівник режиму співпраці
прочитати файл, коли він існує і не порожній. Вміст `MEMORY.md`
із налаштованої робочої області агента не вставляється в нативний вхід ходу Codex,
коли інструменти пам’яті доступні для цієї робочої області; коли він існує, harness
додає невеликий вказівник workspace-memory до developer-інструкцій співпраці, обмежених ходом,
і Codex має використовувати `memory_search` або `memory_get`, коли довготривала
пам’ять є релевантною. Якщо інструменти вимкнені, пошук пам’яті недоступний або
активна робоча область відрізняється від робочої області пам’яті агента, `MEMORY.md` використовує
звичайний обмежений шлях контексту ходу.
`BOOTSTRAP.md`, коли він присутній, передається як довідковий контекст входу ходу OpenClaw.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Config
бажаніший для повторюваних розгортань, оскільки він тримає поведінку Plugin у тому самому
переглянутому файлі, що й решту налаштування harness Codex.

## Пов’язане

- [Harness Codex](/uk/plugins/codex-harness)
- [Runtime harness Codex](/uk/plugins/codex-harness-runtime)
- [Нативні plugins Codex](/uk/plugins/codex-native-plugins)
- [Codex Computer Use](/uk/plugins/codex-computer-use)
- [Провайдер OpenAI](/uk/providers/openai)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
