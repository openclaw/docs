---
read_when:
    - Ви хочете використовувати комплектний app-server harness Codex
    - Вам потрібні приклади конфігурації Codex harness
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість fallback до PI
summary: Запускайте вбудовані цикли агентів OpenClaw через комплектний app-server harness Codex
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T05:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дає змогу OpenClaw запускати вбудовані цикли агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, якщо хочете, щоб Codex керував низькорівневою сесією агента: виявленням
model, нативним відновленням thread, нативною Compaction і виконанням app-server.
OpenClaw усе ще керує каналами чату, файлами сесій, вибором model, tools,
approvals, доставкою медіа та видимим дзеркалом transcript.

Якщо ви лише орієнтуєтеся, почніть із
[Agent runtimes](/uk/concepts/agent-runtimes). Коротка версія така:
`openai/gpt-5.5` — це посилання на model, `codex` — це runtime, а Telegram,
Discord, Slack або інший канал залишається поверхнею комунікації.

Нативні цикли Codex зберігають hooks Plugin OpenClaw як публічний рівень сумісності.
Це внутрішньопроцесні hooks OpenClaw, а не командні hooks Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` для дзеркальних записів transcript
- `agent_end`

Plugins також можуть реєструвати runtime-neutral middleware результатів tools, щоб переписувати
динамічні результати tools OpenClaw після того, як OpenClaw виконає tool, і перед тим,
як результат буде повернено до Codex. Це окремо від публічного
hook Plugin `tool_result_persist`, який перетворює записи результатів tools у transcript, що належать OpenClaw.

Про саму семантику hooks Plugin див. [Plugin hooks](/uk/plugins/hooks)
і [Plugin guard behavior](/uk/tools/plugin).

Harness за замовчуванням вимкнено. Нові конфігурації мають зберігати посилання на model OpenAI
у канонічному вигляді `openai/gpt-*` і явно примусово задавати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли вони
хочуть нативне виконання через app-server. Застарілі посилання на model `codex/*` усе ще автоматично вибирають
harness для сумісності, але застарілі префікси provider, підкріплені runtime,
не показуються як звичайні варіанти model/provider.

## Виберіть правильний префікс model

Маршрути сімейства OpenAI чутливі до префікса. Використовуйте `openai-codex/*`, якщо хочете
Codex OAuth через PI; використовуйте `openai/*`, якщо хочете прямий доступ до OpenAI API або
коли примусово використовуєте нативний app-server harness Codex:

| Посилання на model                                  | Шлях runtime                                | Використовуйте, коли                                                        |
| --------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                    | provider OpenAI через plumbing OpenClaw/PI  | Вам потрібен поточний прямий доступ до API OpenAI Platform з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                              | OAuth OpenAI Codex через OpenClaw/PI        | Вам потрібна автентифікація підписки ChatGPT/Codex із типовим runner PI.    |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | app-server harness Codex                    | Вам потрібне нативне виконання через app-server для вбудованого циклу агента. |

GPT-5.5 у OpenClaw зараз доступна лише через subscription/OAuth. Використовуйте
`openai-codex/gpt-5.5` для OAuth через PI або `openai/gpt-5.5` з harness app-server
Codex. Прямий доступ за API key для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` досі приймаються як псевдоніми сумісності. Doctor
міграція сумісності переписує застарілі основні посилання runtime на канонічні посилання model
і записує політику runtime окремо, тоді як застарілі посилання лише для fallback залишаються без змін,
оскільки runtime налаштовується для всього контейнера агента.
Нові конфігурації PI Codex OAuth мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного
app-server harness мають використовувати `openai/gpt-*` плюс
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` дотримується того самого розділення префіксів. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має йти через шлях provider OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений цикл app-server Codex. Model app-server Codex має
оголошувати підтримку вхідних зображень; текстові model Codex завершуються помилкою до того, як почнеться цикл медіа.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо
вибір виглядає несподіваним, увімкніть debug-логування для підсистеми `agents/harness`
і перевірте структурований запис gateway `agent harness selected`. Він
містить id вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є елементом керування живою сесією. Коли вбудований цикл виконується,
OpenClaw записує id вибраного harness для цієї сесії й продовжує використовувати його
для наступних циклів у межах того самого id сесії. Змініть конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням
наявної розмови між PI і Codex. Це дає змогу уникнути повторного програвання
одного transcript через дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи прив’язок harness, трактуються як прив’язані до PI,
щойно вони мають історію transcript. Використовуйте `/new` або `/reset`, щоб перевести
цю розмову на Codex після зміни конфігурації.

`/status` показує ефективний runtime model. Типовий harness PI відображається як
`Runtime: OpenClaw Pi Default`, а app-server harness Codex — як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або неверсіоновані handshakes app-server. Це зберігає
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, як-от `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово задайте harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди й `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Застарілі конфігурації, які задають `agents.defaults.model` або model агента як
`codex/<model>`, усе ще автоматично вмикають комплектний Plugin `codex`. Нові конфігурації мають
надавати перевагу `openai/<model>` плюс явний запис `embeddedHarness`, наведений вище.

## Додайте Codex поряд з іншими model

Не задавайте `runtime: "codex"` глобально, якщо той самий агент має вільно перемикатися
між Codex і model інших provider. Примусовий runtime застосовується до кожного
вбудованого циклу для цього агента або сесії. Якщо ви виберете model Anthropic, поки
такий runtime примусово задано, OpenClaw все одно спробує harness Codex і завершиться помилкою,
замість того щоб мовчки маршрутизувати цей цикл через PI.

Натомість використовуйте одну з таких форм:

- Розмістіть Codex на окремому агенті з `embeddedHarness.runtime: "codex"`.
- Залиште типовому агенту `runtime: "auto"` і fallback до PI для звичайного змішаного
  використання provider.
- Використовуйте застарілі посилання `codex/*` лише для сумісності. Нові конфігурації мають надавати перевагу
  `openai/*` плюс явна політика runtime Codex.

Наприклад, така конфігурація зберігає для типового агента звичайний автоматичний вибір
і додає окремого агента Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

За такої форми:

- Типовий агент `main` використовує звичайний шлях provider і fallback сумісності з PI.
- Агент `codex` використовує app-server harness Codex.
- Якщо Codex відсутній або не підтримується для агента `codex`, цикл
  завершується помилкою замість тихого використання PI.

## Розгортання лише з Codex

Примусово використовуйте harness Codex, коли потрібно гарантувати, що кожен вбудований цикл агента
використовує Codex. Явні runtime Plugin за замовчуванням не мають fallback до PI, тому
`fallback: "none"` є необов’язковим, але часто корисним як документація:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово задано, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не може запуститися. Установлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`, лише якщо ви навмисно хочете, щоб PI обробляв
відсутній вибір harness.

## Codex для окремого агента

Ви можете зробити одного агента лише для Codex, тоді як типовий агент збереже звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії, щоб перемикати агентів і model. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread
і дає змогу наступному циклу знову визначити harness із поточної конфігурації.

## Виявлення model

За замовчуванням Plugin Codex запитує app-server про доступні model. Якщо
виявлення не вдається або завершується за timeout, він використовує комплектний fallback-каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Ви можете налаштувати виявлення в `plugins.entries.codex.config.discovery`:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не було перевірки Codex і використовувався
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

## Підключення app-server і політика

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це поза довіри локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві tools без
зупинки на нативних prompt approval, на які нікому відповісти.

Щоб увімкнути approvals Codex, які перевіряє guardian, задайте `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Режим Guardian використовує нативний шлях auto-review approval у Codex. Коли Codex просить
вийти із sandbox, писати поза workspace або додати дозволи, як-от доступ до мережі,
Codex маршрутизує цей запит approval до нативного reviewer, а не до prompt для людини.
Reviewer застосовує модель ризику Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо хочете більше запобіжників, ніж у режимі YOLO,
але все одно потребуєте, щоб unattended agents могли просуватися далі.

Preset `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля політики все одно перевизначають `mode`, тож розширені розгортання можуть поєднувати
preset із явними параметрами. Старіше значення reviewer `guardian_subagent`
усе ще приймається як псевдонім сумісності, але нові конфігурації мають використовувати
`auto_review`.

Для app-server, який уже працює, використовуйте транспорт WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
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

| Поле                | Типове значення                         | Значення                                                                                                            |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                               | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                     |
| `command`           | `"codex"`                               | Виконуваний файл для транспорту stdio.                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                                     |
| `url`               | не задано                               | URL WebSocket app-server.                                                                                           |
| `authToken`         | не задано                               | Bearer token для транспорту WebSocket.                                                                              |
| `headers`           | `{}`                                    | Додаткові заголовки WebSocket.                                                                                      |
| `requestTimeoutMs`  | `60000`                                 | Timeout для викликів control plane app-server.                                                                      |
| `mode`              | `"yolo"`                                | Preset для виконання в режимі YOLO або з approvals, перевіреними guardian.                                          |
| `approvalPolicy`    | `"never"`                               | Нативна політика approval Codex, яка надсилається під час start/resume/turn thread.                                |
| `sandbox`           | `"danger-full-access"`                  | Нативний режим sandbox Codex, який надсилається під час start/resume thread.                                       |
| `approvalsReviewer` | `"user"`                                | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні prompt approval. `guardian_subagent` лишається застарілим псевдонімом. |
| `serviceTier`       | не задано                               | Необов’язковий service tier app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старі змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задане:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань перевага надається конфігурації, оскільки вона зберігає поведінку Plugin в тому самому
перевіреному файлі, що й решта налаштувань harness Codex.

## Поширені рецепти

Локальний Codex із типовим транспортом stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Перевірка harness лише для Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approvals Codex, перевірені Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Віддалений app-server з явними заголовками:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Перемикання model залишається під контролем OpenClaw. Коли сесію OpenClaw приєднано
до наявного thread Codex, наступний цикл знову надсилає поточну вибрану
model OpenAI, provider, політику approval, sandbox і service tier до
app-server. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку thread, але просить Codex продовжити з новою вибраною model.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона
загальна й працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення app-server, model, обліковий запис, ліміти rate, сервери MCP і Skills.
- `/codex models` показує список живих model app-server Codex.
- `/codex threads [filter]` показує список нещодавніх thread Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction приєднаного thread.
- `/codex review` запускає нативну перевірку Codex для приєднаного thread.
- `/codex account` показує стан облікового запису та лімітів rate.
- `/codex mcp` показує список станів серверів MCP app-server Codex.
- `/codex skills` показує список Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних циклів. На наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану model OpenClaw до app-server і зберігає розширену історію
увімкненою.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Межі hooks

Harness Codex має три шари hooks:

| Шар                                   | Власник                  | Призначення                                                        |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| hooks Plugin OpenClaw                 | OpenClaw                 | Сумісність продукту/Plugin між harness PI та Codex.               |
| middleware розширення app-server Codex | комплектні plugins OpenClaw | Адаптерна поведінка для кожного циклу навколо динамічних tools OpenClaw. |
| нативні hooks Codex                   | Codex                    | Низькорівневий життєвий цикл Codex і нативна політика tools із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Для підтримуваного мосту нативних tools і дозволів
OpenClaw ін’єктує конфігурацію Codex для конкретного thread для `PreToolUse`, `PostToolUse` і
`PermissionRequest`. Інші hooks Codex, як-от `SessionStart`,
`UserPromptSubmit` і `Stop`, залишаються елементами керування на рівні Codex; у контракті v1 вони не відкриті
як hooks Plugin OpenClaw.

Для динамічних tools OpenClaw виконує tool після того, як Codex запитує
виклик, тож OpenClaw запускає поведінку Plugin і middleware, якою він володіє, у
адаптері harness. Для нативних tools Codex канонічним записом tool володіє Codex.
OpenClaw може віддзеркалювати окремі події, але не може переписувати нативний thread Codex,
якщо Codex не надає цю операцію через app-server або callbacks нативних
hooks.

Проєкції Compaction і життєвого циклу LLM надходять зі сповіщень app-server Codex
і стану адаптера OpenClaw, а не з команд нативних hooks Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтовими копіями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для trajectory і налагодження.
Вони не викликають hooks Plugin OpenClaw.

## Контракт підтримки V1

Режим Codex — це не PI з іншим викликом model під капотом. Codex володіє більшою частиною
нативного циклу model, а OpenClaw адаптує свої поверхні Plugin і сесії
навколо цієї межі.

Підтримується в runtime Codex v1:

| Поверхня                                | Підтримка                               | Чому                                                                                                                                         |
| --------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл model OpenAI через Codex           | Підтримується                           | app-server Codex володіє циклом OpenAI, нативним відновленням thread і нативним продовженням tools.                                        |
| Маршрутизація та доставка каналів OpenClaw | Підтримується                        | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза runtime model.                                                 |
| Динамічні tools OpenClaw                | Підтримується                           | Codex просить OpenClaw виконувати ці tools, тож OpenClaw залишається на шляху виконання.                                                    |
| Plugins prompt і контексту              | Підтримується                           | OpenClaw будує накладки prompt і проєктує контекст у цикл Codex перед запуском або відновленням thread.                                     |
| Життєвий цикл контекстного рушія        | Підтримується                           | Assemble, ingest або обслуговування after-turn і координація Compaction контекстного рушія виконуються для циклів Codex.                    |
| Hooks динамічних tools                  | Підтримується                           | `before_tool_call`, `after_tool_call` і middleware результатів tools виконуються навколо динамічних tools, якими володіє OpenClaw.          |
| Hooks життєвого циклу                   | Підтримуються як спостереження адаптера | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними payload для режиму Codex.          |
| Нативний shell і блокування або спостереження patch | Підтримується через relay нативних hooks | `PreToolUse` і `PostToolUse` Codex ретранслюються для підтримуваних поверхонь нативних tools. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів               | Підтримується через relay нативних hooks | `PermissionRequest` Codex можна маршрутизувати через політику OpenClaw там, де runtime це дозволяє.                                         |
| Захоплення trajectory app-server        | Підтримується                           | OpenClaw записує запит, який він надіслав до app-server, і сповіщення, які отримує від app-server.                                          |

Не підтримується в runtime Codex v1:

| Поверхня                                           | Межа V1                                                                                                                                         | Майбутній шлях                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Мутація аргументів нативних tools                  | Нативні pre-tool hooks Codex можуть блокувати, але OpenClaw не переписує аргументи нативних tools Codex.                                       | Потребує підтримки hook/schema у Codex для заміни вхідних даних tool.                                       |
| Редагована історія нативного transcript Codex      | Codex володіє канонічною історією нативного thread. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не має змінювати непідтримувані внутрішні механізми. | Додати явні API app-server Codex, якщо потрібна нативна хірургія thread.                                   |
| `tool_result_persist` для записів нативних tools Codex | Цей hook перетворює записи transcript, якими володіє OpenClaw, а не записи нативних tools Codex.                                          | Може віддзеркалювати перетворені записи, але канонічне переписування потребує підтримки Codex.             |
| Розширені нативні метадані Compaction              | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільний список збережених/відкинутих елементів, дельту токенів або payload підсумку. | Потребує багатших подій Compaction у Codex.                                                                 |
| Втручання в Compaction                             | Поточні hooks Compaction в OpenClaw у режимі Codex працюють на рівні сповіщень.                                                                | Додати hooks pre/post Compaction у Codex, якщо Plugins мають забороняти або переписувати нативну Compaction. |
| Stop або gate для фінальної відповіді              | Codex має нативні hooks stop, але OpenClaw не надає gate для фінальної відповіді як контракт Plugin v1.                                        | Майбутній opt-in primitive із захистом від циклів і timeout.                                                |
| Паритет нативних hooks MCP як зафіксована поверхня v1 | Relay є загальним, але OpenClaw ще не version-gated і не протестував наскрізну поведінку нативних hooks MCP pre/post.                      | Додати тести relay MCP у OpenClaw і документацію, щойно підтримуваний нижній поріг протоколу app-server покриє ці payload. |
| Побайтове захоплення запиту до API model           | OpenClaw може захоплювати запити й сповіщення app-server, але ядро Codex внутрішньо будує фінальний запит до OpenAI API.                      | Потребує події трасування запиту model Codex або debug API.                                                 |

## Tools, медіа і Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список tools і отримує результати динамічних tools від
harness. Текст, зображення, відео, музика, TTS, approvals і вивід tool для повідомлень
продовжують проходити звичайним шляхом доставки OpenClaw.

Relay нативних hooks навмисно є загальним, але контракт підтримки v1
обмежено нативними шляхами tools і дозволів Codex, які OpenClaw тестує. Не
припускайте, що кожна майбутня подія hook Codex є поверхнею Plugin OpenClaw, доки
контракт runtime прямо цього не визначить.

Запити на approval для tools MCP Codex маршрутизуються через потік approval
Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Prompt-и Codex `request_user_input` надсилаються назад до
чату походження, а наступне повідомлення у черзі відповідає на цей нативний
запит сервера замість того, щоб бути спрямованим як додатковий контекст. Інші
запити elicitation MCP, як і раніше, завершуються помилкою за принципом fail closed.

Коли вибрана model використовує harness Codex, нативну Compaction thread делеговано
app-server Codex. OpenClaw зберігає дзеркало transcript для історії каналів,
пошуку, `/new`, `/reset` і майбутнього перемикання model або harness. Дзеркало
включає prompt користувача, фінальний текст асистента і полегшені записи
reasoning або plan Codex, коли їх видає app-server. Наразі OpenClaw лише
записує сигнали початку й завершення нативної Compaction. Він ще не надає
людинозрозумілого підсумку Compaction або придатного для аудиту списку того, які записи Codex
зберіг після Compaction.

Оскільки Codex володіє канонічним нативним thread, `tool_result_persist` наразі
не переписує записи результатів нативних tools Codex. Він застосовується лише тоді,
коли OpenClaw записує результат tool у transcript сесії, яким володіє OpenClaw.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа, як і раніше, використовують відповідні налаштування provider/model, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється як звичайний provider у `/model`:** це очікувана поведінка для
нових конфігурацій. Виберіть model `openai/gpt-*` з
`embeddedHarness.runtime: "codex"` (або застаріле посилання `codex/*`), увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** `runtime: "auto"` усе ще може використовувати PI як
бекенд сумісності, коли жоден harness Codex не бере цей запуск. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування. Примусовий
runtime Codex тепер завершується помилкою замість fallback до PI, якщо ви
явно не встановите `embeddedHarness.fallback: "pi"`. Щойно буде вибрано app-server Codex,
його збої проявлятимуться напряму без додаткової конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення model повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і чи віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не-Codex використовує PI:** це очікувано, якщо тільки ви не примусово задали
`embeddedHarness.runtime: "codex"` для цього агента або не вибрали застаріле
посилання `codex/*`. Звичайні посилання `openai/gpt-*` та посилання інших provider залишаються на своєму звичайному
шляху provider в режимі `auto`. Якщо ви примусово задаєте `runtime: "codex"`, кожен вбудований
цикл для цього агента має бути model OpenAI, яку підтримує Codex.

## Пов’язане

- [Agent harness plugins](/uk/plugins/sdk-agent-harness)
- [Agent runtimes](/uk/concepts/agent-runtimes)
- [Model providers](/uk/concepts/model-providers)
- [OpenAI provider](/uk/providers/openai)
- [Status](/uk/cli/status)
- [Plugin hooks](/uk/plugins/hooks)
- [Configuration reference](/uk/gateway/configuration-reference)
- [Testing](/uk/help/testing-live#live-codex-app-server-harness-smoke)
