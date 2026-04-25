---
read_when:
    - Ви хочете використовувати вбудований app-server harness Codex
    - Вам потрібні приклади конфігурації Codex harness
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість переходу на PI
summary: Запускайте вбудовані ходи агента OpenClaw через вбудований app-server harness Codex
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T00:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 366400f3d4018d6149e80b0b87b49ad7332c6164e8b3b70a0c4359068ee2685f
    source_path: plugins/codex-harness.md
    workflow: 15
---

Вбудований Plugin `codex` дає змогу OpenClaw виконувати вбудовані ходи агента через Codex app-server замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням thread, нативним Compaction і виконанням app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделі, tools,
approvals, доставкою медіа та видимим дзеркалом transcript.

Нативні ходи Codex зберігають plugin hooks OpenClaw як публічний шар сумісності.
Це in-process hooks OpenClaw, а не command hooks Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів transcript
- `agent_end`

Plugins також можуть реєструвати runtime-neutral middleware результатів tools, щоб переписувати динамічні результати tools OpenClaw після того, як OpenClaw виконає tool, і до того, як результат буде повернуто до Codex. Це окремо від публічного plugin hook `tool_result_persist`, який перетворює записи результатів tools у transcript, що належать OpenClaw.

Harness вимкнено за замовчуванням. Нові конфігурації повинні зберігати canonical ref-и моделей OpenAI як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли
потрібне нативне виконання через app-server. Застарілі ref-и моделей `codex/*` і далі автоматично вибирають harness для сумісності, але застарілі provider prefixes, підкріплені runtime, не показуються як звичайні варіанти model/provider.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли вам потрібна авторизація Codex OAuth через PI; використовуйте `openai/*`, коли вам потрібен прямий доступ до OpenAI API або коли ви примусово вмикаєте нативний harness Codex app-server:

| Ref моделі                                            | Шлях runtime                                | Коли використовувати                                                        |
| ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | provider OpenAI через plumbing OpenClaw/PI  | Вам потрібен поточний прямий доступ до API OpenAI Platform через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth через OpenClaw/PI        | Вам потрібна авторизація підписки ChatGPT/Codex із runner-ом PI за замовчуванням. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness Codex app-server                    | Вам потрібне нативне виконання через Codex app-server для вбудованого ходу агента. |

GPT-5.5 наразі в OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` разом із harness Codex
app-server. Прямий доступ через API key для `openai/gpt-5.5` підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі ref-и `codex/gpt-*` залишаються прийнятними як compatibility aliases. Міграція сумісності Doctor переписує застарілі primary runtime ref-и на canonical ref-и моделей і окремо записує policy runtime, тоді як застарілі ref-и лише для fallback залишаються без змін, оскільки runtime налаштовується для всього контейнера агента. Нові конфігурації PI Codex OAuth повинні використовувати `openai-codex/gpt-*`; нові конфігурації нативного harness app-server повинні використовувати `openai/gpt-*` разом із
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` дотримується того самого поділу за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розпізнавання зображень має виконуватися через шлях provider OpenAI Codex OAuth. Використовуйте `codex/gpt-*`, коли розпізнавання зображень має виконуватися через обмежений хід Codex app-server. Модель Codex app-server повинна заявляти підтримку вхідних зображень; текстові моделі Codex без підтримки зображень завершуються помилкою до початку media turn.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії. Якщо вибір здається неочікуваним, увімкніть debug logging для підсистеми `agents/harness` і перегляньте структурований запис gateway `agent harness selected`. Він містить id вибраного harness, причину вибору, policy runtime/fallback і, у режимі `auto`, результат підтримки для кожного plugin-кандидата.

Вибір harness не є елементом live-керування сесією. Коли виконується вбудований хід, OpenClaw записує id вибраного harness у цю сесію і продовжує використовувати його для наступних ходів із тим самим id сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness; використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної розмови між PI і Codex. Це дає змогу уникнути повторного програвання одного transcript через дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи прив’язки harness, трактуються як прив’язані до PI, щойно вони мають історію transcript. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на Codex після зміни конфігурації.

`/status` показує фактичний runtime моделі. Harness PI за замовчуванням відображається як
`Runtime: OpenClaw Pi Default`, а harness Codex app-server — як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Авторизація Codex, доступна для процесу app-server.

Plugin блокує старі або неверсіоновані handshake app-server. Це утримує
OpenClaw на тій поверхні protocol, з якою його було протестовано.

Для live- і Docker smoke-тестів авторизація зазвичай надходить із `OPENAI_API_KEY`, а також, за потреби, з файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали авторизації, що й ваш локальний Codex app-server.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть вбудований plugin і примусово виберіть harness `codex`:

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
        fallback: "none",
      },
    },
  },
}
```

Якщо ваша конфігурація використовує `plugins.allow`, додайте туди також `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента в
`codex/<model>`, і далі автоматично вмикають вбудований plugin `codex`. Нові конфігурації повинні надавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі ref-и `codex/*` вибирали Codex, а для всього іншого використовувався PI. Для нових конфігурацій краще явно задавати `runtime: "codex"` для агентів, які мають використовувати harness.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

У такій конфігурації:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness Codex app-server для цієї конфігурації.
- `/model opus` використовує шлях provider Anthropic.
- Якщо вибрано модель не з Codex, PI залишається harness сумісності.

## Розгортання лише з Codex

Примусово вмикайте harness Codex, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явно задані plugin runtime за замовчуванням не мають fallback до PI, тому
`fallback: "none"` необов’язковий, але часто корисний як документація:

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

Перевизначення через змінну середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово увімкнено, OpenClaw завершується помилкою на ранньому етапі, якщо plugin Codex вимкнено, app-server надто старий або app-server не може запуститися. Установлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` лише якщо ви навмисно хочете, щоб PI обробляв відсутній вибір harness.

## Codex для окремого агента

Ви можете зробити один агент лише з Codex, тоді як агент за замовчуванням зберігатиме звичайний
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

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову сесію OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread і дає змогу наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням plugin Codex запитує в app-server список доступних моделей. Якщо
виявлення завершується помилкою або спрацьовує timeout, використовується вбудований fallback catalog для:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося опитування Codex і використовувався лише fallback catalog:

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

## Підключення до app-server і policy

За замовчуванням plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується для автономних Heartbeat: Codex може використовувати shell і network tools без зупинки на нативних approval prompts, на які нікому відповідати.

Щоб увімкнути approvals Codex із перевіркою guardian, установіть `appServer.mode:
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

Guardian — це нативний reviewer approvals у Codex. Коли Codex просить вийти за межі sandbox, записати поза workspace або додати дозволи, як-от доступ до мережі, Codex спрямовує цей запит на approval до subagent reviewer, а не до prompt для людини. Reviewer застосовує framework ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібні суворіші запобіжники, ніж у режимі YOLO, але водночас потрібно, щоб unattended agents могли просуватися далі.

Preset `guardian` розгортається до `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля policy і далі мають вищий пріоритет за `mode`, тому просунуті розгортання можуть поєднувати preset із явними налаштуваннями.

Для вже запущеного app-server використовуйте транспорт WebSocket:

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

| Поле                | За замовчуванням                         | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL WebSocket app-server.                                                                                 |
| `authToken`         | не задано                                | Bearer token для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`              | `"yolo"`                                 | Preset для виконання в режимі YOLO або з approvals, перевіреними guardian.                                |
| `approvalPolicy`    | `"never"`                                | Нативна policy approvals Codex, що надсилається під час start/resume/turn thread.                         |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час start/resume thread.                                |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти prompts.                    |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задане:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурації
слід надавати перевагу для відтворюваних розгортань, оскільки вона зберігає поведінку plugin в тому самому перевіреному файлі, що й решта налаштувань harness Codex.

## Типові рецепти

Локальний Codex із transport stdio за замовчуванням:

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

Валідація harness лише для Codex, з вимкненим fallback до PI:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Approvals Codex із перевіркою guardian:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Віддалений app-server із явними заголовками:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного thread Codex, наступний хід знову надсилає до
app-server поточні вибрані модель OpenAI, provider, policy approvals, sandbox і service tier.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до
thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Вбудований plugin реєструє `/codex` як авторизовану slash-команду. Вона
є загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP servers і skills.
- `/codex models` показує список поточних моделей Codex app-server.
- `/codex threads [filter]` показує список нещодавніх thread-ів Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить Codex app-server виконати Compaction для приєднаного thread.
- `/codex review` запускає нативний review Codex для приєднаного thread.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує список станів MCP server у Codex app-server.
- `/codex skills` показує список skills Codex app-server.

`/codex resume` записує той самий sidecar binding file, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw до app-server і залишає розширену історію увімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Межі hooks

Harness Codex має три шари hooks:

| Шар                                  | Власник                  | Призначення                                                         |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                | OpenClaw                 | Сумісність продукту/plugin між harness PI та Codex.                 |
| middleware розширення Codex app-server | Вбудовані plugins OpenClaw | Поведінка адаптера для кожного ходу навколо динамічних tools OpenClaw. |
| Нативні hooks Codex                  | Codex                    | Низькорівневий життєвий цикл Codex і policy нативних tools з конфігурації Codex. |

OpenClaw не використовує project або global файли Codex `hooks.json` для маршрутизації
поведінки plugin OpenClaw. Нативні hooks Codex корисні для операцій, що належать Codex,
як-от policy shell, перевірка результатів нативних tools, обробка зупинки та нативний життєвий цикл Compaction/моделі, але вони не є API plugin OpenClaw.

Для динамічних tools OpenClaw сам виконує tool після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку plugin і middleware, якою він володіє, у
адаптері harness. Для нативних tools Codex саме Codex володіє canonical record tool.
OpenClaw може дзеркалювати окремі події, але не може переписувати нативний thread Codex,
якщо Codex не надає цю операцію через app-server або callbacks нативних hooks.

Коли новіші збірки Codex app-server почнуть надавати події hooks життєвого циклу нативних Compaction і моделі, OpenClaw має обмежувати підтримку цього protocol за версією та відображати ці події в наявний контракт hooks OpenClaw там, де семантика є чесною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтовими копіями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed` проєктуються як
події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають plugin hooks OpenClaw.

## Tools, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, будує список tools і отримує динамічні результати tools від
harness. Текст, зображення, відео, музика, TTS, approvals і вивід tools для повідомлень
і далі проходять звичайним шляхом доставки OpenClaw.

Запити на approvals для MCP tool у Codex маршрутизуються через flow approvals plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Prompts Codex `request_user_input` надсилаються назад до
початкового чату, а наступне повідомлення в черзі відповідає на цей нативний
запит server, а не спрямовується як додатковий контекст. Інші запити MCP elicitation і далі завершуються в закритому режимі.

Коли вибрана модель використовує harness Codex, нативний Compaction thread делегується Codex app-server. OpenClaw зберігає дзеркало transcript для історії каналів, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало містить prompt користувача, фінальний текст асистента та полегшені записи reasoning або plan Codex, коли app-server їх надсилає. Наразі OpenClaw записує лише сигнали початку та завершення нативного Compaction. Він ще не показує зрозумілий для людини підсумок Compaction або список для аудиту, які саме записи Codex зберіг після Compaction.

Оскільки Codex володіє canonical нативним thread, `tool_result_persist` наразі не
переписує записи результатів нативних tools Codex. Він застосовується лише тоді, коли
OpenClaw записує результат tool у transcript сесії, що належить OpenClaw.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розпізнавання медіа й далі використовують відповідні налаштування provider/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застарілий ref `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** `runtime: "auto"` все ще може використовувати PI як
backend сумісності, коли жоден harness Codex не заявляє про цей запуск. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування. Тепер
примусовий runtime Codex завершується помилкою замість fallback до PI, якщо ви
явно не встановили `embeddedHarness.fallback: "pi"`. Щойно буде вибрано Codex app-server,
його помилки надходитимуть безпосередньо без додаткової конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket відразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію protocol Codex app-server.

**Модель не з Codex використовує PI:** це очікувано, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застарілий ref `codex/*`). Звичайні
`openai/gpt-*` та ref-и інших provider залишаються на своєму звичайному шляху provider.

## Пов’язане

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Providers моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
