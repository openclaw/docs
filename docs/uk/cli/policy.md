---
read_when:
    - Ви хочете перевірити налаштування OpenClaw на відповідність створеному policy.jsonc
    - Вам потрібні висновки щодо політик у lint-перевірці doctor
    - Вам потрібен хеш засвідчення політики для аудиторського доказу
summary: Довідник CLI для перевірок відповідності `openclaw policy`
title: Політика
x-i18n:
    generated_at: "2026-06-27T17:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` надається вбудованим Policy Plugin. Policy є корпоративним
шаром перевірки відповідності поверх наявних налаштувань OpenClaw. Він не додає
другої системи конфігурації. `policy.jsonc` визначає створені вимоги,
OpenClaw спостерігає активний робочий простір як доказ, а перевірки стану policy
повідомляють про відхилення через `doctor --lint`. Остаточний сигнал
відповідності - чистий запуск `doctor --lint`; policy додає знахідки до цієї
спільної поверхні lint замість створення окремого шлюзу стану.

Наразі Policy керує налаштованими каналами, серверами MCP, постачальниками моделей,
станом мережевого SSRF, станом доступу ingress/каналів, станом експозиції Gateway, станом робочого простору агента,
станом обробки даних, станом постачальника секретів конфігурації OpenClaw/профілю автентифікації та керованими
оголошеннями інструментів. Наприклад, IT або оператор робочого простору може зафіксувати, що Telegram
не є затвердженим постачальником каналів, обмежити сервери MCP і посилання на моделі
затвердженими записами, вимагати, щоб доступ fetch/browser до приватної мережі залишався
вимкненим, вимагати, щоб ізоляція сесій прямих повідомлень і стан channel ingress
залишалися в межах перевірених обмежень, вимагати, щоб bind/auth/HTTP експозиція Gateway залишалася в межах перевірених
обмежень, вимагати, щоб доступ до робочого простору агента й заборони інструментів залишалися в перевіреному
стані, вимагати, щоб SecretRefs конфігурації OpenClaw використовували керованих постачальників, вимагати,
щоб профілі автентифікації конфігурації містили метадані постачальника/режиму, вимагати, щоб керовані інструменти
містили метадані ризику та чутливості, вимагати редагування чутливих логів, заборонити
захоплення вмісту телеметрії, вимагати підтримування збереження сесій, заборонити індексацію пам'яті
транскриптів сесій, а потім використовувати `doctor --lint` як спільний
шлюз відповідності.

Використовуйте policy, коли робочому простору потрібне довговічне твердження на кшталт "ці канали
не повинні бути ввімкнені" або "керовані інструменти повинні оголошувати метадані затвердження" і
повторюваний спосіб довести, що OpenClaw усе ще відповідає цьому твердженню. Використовуйте
лише звичайну конфігурацію та документацію робочого простору, коли вам потрібна тільки локальна поведінка і
не потрібні знахідки policy або вихід атестації.

## Швидкий старт

Увімкніть вбудований Policy Plugin перед першим використанням:

```bash
openclaw plugins enable policy
```

Коли policy увімкнено, doctor може завантажувати перевірки стану policy без активації
довільних plugins. Plugin залишається ввімкненим, якщо `policy.jsonc` відсутній, тож
doctor може повідомити про відсутній артефакт.

Policy створюється автором, а не генерується з поточних налаштувань користувача. Мінімальна
policy для каналів, серверів MCP, постачальників моделей, мережевого стану, доступу ingress/каналів, експозиції Gateway,
стану робочого простору агента, налаштованого стану середовища виконання sandbox, стану
обробки даних OpenClaw, стану постачальника секретів конфігурації/профілю автентифікації, стану файлу
затверджень exec і метаданих інструментів має такий вигляд:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Правила є джерелом істини. Блок категорії є лише простором імен; перевірки виконуються,
коли присутнє конкретне правило. OpenClaw читає поточні налаштування `channels.*`,
`mcp.servers.*`, `models.providers.*`, вибрані посилання на моделі агента, налаштування мережевого SSRF,
область сесії прямих повідомлень, DM policy каналу, політику груп каналу,
шлюзи згадок у каналі/групі, стан bind/auth/Control UI/Tailscale/remote/HTTP Gateway,
стан доступу до робочого простору sandbox агента конфігурації OpenClaw і стан заборон інструментів,
стан конфігурації обробки даних, походження постачальника секретів
конфігурації та SecretRef, метадані профілю автентифікації конфігурації, налаштований
глобальний/поагентний стан інструментів і оголошення `TOOLS.md` як докази, а потім
повідомляє про спостережуваний стан, що не відповідає вимогам. Якщо policy забороняє non-loopback
bind Gateway, опускайте `gateway.bind` лише тоді, коли ви
готові переглядати стандартне значення runtime; установіть `gateway.bind=loopback` для
суворої відповідності конфігурації. Для стану агента лише для читання налаштуйте режим sandbox
у відповідних типових значеннях або агенті та встановіть `workspaceAccess` у `none` або
`ro`; пропущений режим sandbox або `off` не задовольняє policy лише для читання/без запису.
`agents.workspace.denyTools` підтримує `exec`, `process`, `write`,
`edit` і `apply_patch`; конфігурація OpenClaw `group:fs` охоплює інструменти мутації файлів,
а `group:runtime` охоплює інструменти shell/process. Policy стану інструментів спостерігає
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` і ті самі поагентні
перевизначення `agents.list[].tools.*`. Policy затверджень exec читає названий
продуктовий артефакт `exec-approvals.json` лише тоді, коли присутнє правило `execApprovals`;
докази записують типові значення, поагентний стан і шаблони allowlist
без socket-токенів або тексту останньої використаної команди. Policy не примусово застосовує виклики інструментів
під час runtime. Докази секретів записують
стан постачальника/джерела та метадані SecretRef, але ніколи сирі значення секретів. Policy
не читає й не атестує поагентні сховища облікових даних, як-от `auth-profiles.json`;
ці сховища залишаються у власності наявних потоків автентифікації та облікових даних.
Докази обробки даних є лише станом на рівні конфігурації: вони перевіряють налаштований
режим редагування, перемикачі захоплення вмісту телеметрії, режим підтримування сесій і
налаштування індексації пам'яті транскриптів сесій. Вони не перевіряють сирі логи,
експорти телеметрії, вміст транскриптів, файли пам'яті й не доводять, що персональних
даних або секретів не існує.

### Довідник правил policy

Кожне поле policy нижче є необов'язковим. Перевірка виконується лише тоді, коли відповідне правило
присутнє в `policy.jsonc`. Спостережуваний стан - це наявна конфігурація OpenClaw або
метадані робочого простору; policy повідомляє про відхилення, але не переписує поведінку runtime,
якщо шлях ремонту явно не доступний і не ввімкнений.
Файли policy суворі: непідтримувані секції або ключі правил повідомляються як
`policy/policy-jsonc-invalid`, а не ігноруються.

Накладення policy зберігають широкі правила верхнього рівня глобальними, а потім дозволяють іменованим блокам областей
додавати суворіші звичайні секції policy для явних селекторів. Назва області є
лише описовим контейнером; зіставлення використовує значення селекторів усередині області.
Накладення є адитивним: глобальні твердження все одно виконуються, а scoped claim може створити
власну знахідку щодо тієї самої спостережуваної конфігурації.

#### Областеві накладення

Використовуйте `scopes.<scopeName>`, коли одному набору агентів або каналів потрібна суворіша
policy, ніж базовий рівень верхнього рівня. Секції з областю агента використовують `agentIds`, що
підтримує `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`
і `execApprovals.*`. Channel-scoped
ingress використовує `channelIds`, що підтримує `ingress.channels.*`. Непідтримувані
секції відхиляються, а не ігноруються. Якщо запис `agentIds` не
присутній в `agents.list[]`, OpenClaw оцінює scoped rule щодо успадкованого
глобального/типового стану для цього runtime agent id.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Той самий агент може з'являтися в кількох областях, коли кожна область керує різними
полями, як показано вище. Повторене scoped field для того самого агента має бути
таким самим або суворішим відповідно до метаданих policy; слабші дубльовані
твердження відхиляються. Метадані суворості трактують allow-lists як підмножини,
deny-lists як надмножини, а обов'язкові булеві значення як фіксовані вимоги.

Policy стану контейнера оцінюється лише щодо доказів, які OpenClaw може
спостерігати для зіставленого агента. Якщо ввімкнене правило `sandbox.containers.*` застосовується
до агента, backend sandbox якого не може відкрити це поле, policy повідомляє
`policy/sandbox-container-posture-unobservable` замість того, щоб вважати твердження
успішним. Використовуйте окремі області `agentIds` для груп агентів, які використовують різні
backends sandbox, і залишайте непідтримувані правила контейнерів unset або false для
груп, де ці поля не можна спостерігати.

Верхньорівневе `ingress.session.requireDmScope` залишається глобальним, оскільки
`session.dmScope` не є доказом, що атрибутується каналу.

| Селектор     | Підтримувані розділи                                                               | Використовуйте, коли                                 |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | Одному або кільком агентам runtime потрібні суворіші правила. |
| `channelIds` | `ingress.channels`                                                                 | Одному або кільком каналам потрібні суворіші правила входу. |

Кожна область, наявна в `policy.jsonc`, має бути дійсною та придатною до примусового застосування.

#### Канали

| Поле політики                       | Спостережуваний стан                  | Використовуйте, коли                                      |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Постачальник `channels.*` і ввімкнений стан | Заборонити налаштовані канали від постачальника, наприклад `telegram`. |
| `channels.denyRules[].reason`        | Повідомлення знахідки та контекст підказки щодо виправлення | Пояснити, чому постачальника заборонено.                     |

#### MCP-сервери

| Поле політики      | Спостережуваний стан | Використовуйте, коли                                      |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | Ідентифікатори `mcp.servers.*` | Вимагати, щоб кожен налаштований MCP-сервер був у списку дозволених. |
| `mcp.servers.deny`  | Ідентифікатори `mcp.servers.*` | Заборонити конкретні налаштовані ідентифікатори MCP-серверів. |

#### Постачальники моделей

| Поле політики           | Спостережуваний стан                                | Використовуйте, коли                                                               |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | Ідентифікатори `models.providers.*` і вибрані посилання на моделі | Вимагати, щоб налаштовані постачальники і вибрані посилання на моделі використовували схвалених постачальників. |
| `models.providers.deny`  | Ідентифікатори `models.providers.*` і вибрані посилання на моделі | Заборонити налаштованих постачальників і вибрані посилання на моделі за ідентифікатором постачальника. |

#### Мережа

| Поле політики                 | Спостережуваний стан                    | Використовуйте, коли                                      |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Механізми обходу SSRF для приватної мережі | Установіть `false`, щоб вимагати вимкнення доступу до приватної мережі. |

#### Вхід і доступ до каналів

| Поле політики                            | Спостережуваний стан                                             | Використовуйте, коли                                      |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Вимагати перевірену область ізоляції прямих повідомлень. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` і застарілі поля політики DM каналу      | Дозволяти лише перевірені політики каналів прямих повідомлень. |
| `ingress.channels.denyOpenGroups`         | Політика входу каналу, облікового запису та групи              | Заборонити відкритий груповий вхід для налаштованих каналів і облікових записів. |
| `ingress.channels.requireMentionInGroups` | Конфігурація шлюзу згадок для каналу, облікового запису, групи, гільдії та вкладених згадок | Вимагати шлюзи згадок, коли груповий вхід відкритий або керований згадками. |

#### Gateway

| Поле політики                          | Спостережуваний стан                            | Використовуйте, коли                                      |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Установіть `false`, щоб вимагати прив’язку Gateway до loopback. |
| `gateway.exposure.allowTailscaleFunnel` | Позиція Gateway для Tailscale serve/funnel     | Установіть `false`, щоб заборонити експозицію Tailscale Funnel. |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Установіть `true`, щоб відхиляти вимкнену автентифікацію Gateway. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Установіть `true`, щоб вимагати явну конфігурацію обмеження частоти автентифікації. |
| `gateway.controlUi.allowInsecure`       | Небезпечні перемикачі автентифікації/пристрою/джерела Control UI | Установіть `false`, щоб заборонити небезпечні перемикачі експозиції Control UI. |
| `gateway.remote.allow`                  | Віддалений режим/конфігурація Gateway          | Установіть `false`, щоб заборонити віддалений режим Gateway. |
| `gateway.http.denyEndpoints`            | Кінцеві точки HTTP API Gateway                 | Заборонити ідентифікатори кінцевих точок, як-от `chatCompletions` або `responses`. |
| `gateway.http.requireUrlAllowlists`     | Вхідні дані Gateway HTTP для отримання URL     | Установіть `true`, щоб вимагати списки дозволених URL для вхідних даних отримання URL. |

#### Робочий простір агента

| Поле політики                   | Спостережуваний стан                                                                  | Використовуйте, коли                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` і `agents.list[].sandbox.workspaceAccess` | Дозволяти лише значення доступу робочого простору sandbox, як-от `none` або `ro`. |
| `agents.workspace.denyTools`     | Глобальна та поагентна конфігурація заборони інструментів                            | Вимагати заборону інструментів мутації робочого простору/runtime, як-от `exec`, `process`, `write`, `edit` або `apply_patch`. |

#### Позиція sandbox

| Поле політики                                        | Спостережуваний стан                                      | Використовуйте, коли                                      |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` і поагентний режим       | Дозволяти лише перевірені режими sandbox, як-от `all` або `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` і поагентний backend | Дозволяти лише перевірені backend-и sandbox, як-от `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Мережевий режим sandbox/browser на базі контейнера      | Заборонити режим мережі хоста. |
| `sandbox.containers.denyContainerNamespaceJoin`       | Мережевий режим sandbox/browser на базі контейнера      | Заборонити приєднання до простору імен мережі іншого контейнера. |
| `sandbox.containers.requireReadOnlyMounts`            | Режим монтування sandbox/browser на базі контейнера     | Вимагати монтування лише для читання. |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Цілі монтування sandbox/browser на базі контейнера      | Заборонити монтування сокетів runtime контейнера. |
| `sandbox.containers.denyUnconfinedProfiles`           | Позиція профілю безпеки контейнера                      | Заборонити необмежені профілі безпеки контейнера. |
| `sandbox.browser.requireCdpSourceRange`               | Діапазон джерела CDP браузера sandbox                   | Вимагати, щоб експозиція CDP браузера оголошувала діапазон джерела. |

Політика трактує відсутній `sandbox.mode` як неявне стандартне значення `off`, тому
`sandbox.requireMode` повідомляє про новий або неналаштований sandbox як такий, що перебуває поза
списком дозволених, наприклад `["all"]`.

#### Обробка даних

| Поле політики                                      | Спостережуваний стан                                                                 | Використовуйте, коли                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Установіть `true`, щоб відхиляти `logging.redactSensitive: "off"`. |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Установіть `true`, щоб відхиляти захоплення вмісту телеметрією. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Установіть `true`, щоб вимагати ефективний режим обслуговування сесій `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` і `agents.*.memorySearch.experimental.sessionMemory` | Установіть `true`, щоб відхиляти індексування стенограм сесій у пам’ять. |

#### Секрети

| Поле політики                    | Спостережуваний стан                                      | Використовуйте, коли                                                   |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs і оголошення `secrets.providers.*`    | Установіть `true`, щоб вимагати, аби SecretRefs вказували на оголошених постачальників. |
| `secrets.denySources`             | Джерела постачальників секретів і джерела SecretRef     | Заборонити джерела, як-от `exec`, `file` або іншу назву налаштованого джерела. |
| `secrets.allowInsecureProviders`  | Прапорці небезпечної позиції постачальника секретів     | Установіть `false`, щоб відхиляти постачальників, які погоджуються на небезпечну позицію. |

#### Схвалення exec

Політика схвалень exec спостерігає активний артефакт runtime `exec-approvals.json`.
За замовчуванням це `~/.openclaw/exec-approvals.json`; коли
встановлено `OPENCLAW_STATE_DIR`, Policy читає
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Фактичні правила позиції, як-от
`execApprovals.defaults.*` або `execApprovals.agents.*`, потребують доказів із придатного для читання артефакта;
відсутній або недійсний артефакт повідомляється як неспостережувані докази,
а не стає best-effort проходженням за синтетичними стандартними значеннями runtime. Щойно
артефакт доступний для читання, пропущені поля схвалення успадковують стандартні значення runtime: відсутнє
`defaults.security` дорівнює `full`, а відсутня безпека агента успадковує це
стандартне значення. Докази включають `defaults`, `agents.*` і
`agents.*.allowlist[].pattern` плюс необов’язковий `argPattern`, ефективну
позицію `autoAllowSkills` і джерело запису. Вони не включають шлях
сокета/токен, `commandText`, `lastUsedCommand`, розв’язані шляхи або часові позначки.

| Поле політики                              | Спостережений стан                                                                   | Використовуйте, коли                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`               | Шлях активного runtime-артефакта `exec-approvals.json`                               | Установіть `true`, щоб вимагати існування та успішного розбору артефакта схвалень.      |
| `execApprovals.defaults.allowSecurity`    | `defaults.security`, за замовчуванням `full`                                         | Дозволяти лише схвалені стандартні режими безпеки схвалень.                             |
| `execApprovals.agents.allowSecurity`      | `agents.*.security`, успадковує стандартні значення                                  | Дозволяти лише схвалені ефективні режими безпеки схвалень для окремих агентів.          |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` і `agents.*.autoAllowSkills`, успадковує runtime-стандарти | Установіть `false`, щоб вимагати строгі ручні списки дозволів без неявного схвалення CLI Skills. |
| `execApprovals.agents.allowlist.expected` | Сукупний шаблон `agents.*.allowlist[]` і необов’язкові записи argPattern             | Вимагати, щоб список дозволів схвалень відповідав перевіреному набору шаблонів.         |

Наприклад, вимагайте артефакт схвалень, забороніть надто permissive стандартні значення та
дозволяйте лише перевірену позицію exec-схвалень для вибраних агентів:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Профілі автентифікації

| Поле політики                  | Спостережений стан                         | Використовуйте, коли                                                                    |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Метадані провайдера та режиму `auth.profiles.*` | Вимагати ключі метаданих, як-от `provider` і `mode`, у профілях автентифікації конфігурації. |
| `auth.profiles.allowModes`    | `auth.profiles.*.mode`                     | Дозволяти лише підтримувані режими профілю автентифікації, як-от `api_key`, `aws-sdk`, `oauth` або `token`. |

#### Метадані інструментів

| Поле політики          | Спостережений стан             | Використовуйте, коли                                                                    |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Керовані оголошення `TOOLS.md` | Вимагати, щоб керовані інструменти оголошували ключі метаданих, як-от `risk`, `sensitivity` або `owner`. |

#### Позиція інструментів

| Поле політики                  | Спостережений стан                                      | Використовуйте, коли                                                                 |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `tools.profiles.allow`        | `tools.profile` і `agents.list[].tools.profile`         | Дозволяти лише ідентифікатори профілів інструментів, як-от `minimal`, `messaging` або `coding`. |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` і перевизначення `tools.fs` для окремих агентів | Установіть `true`, щоб вимагати позицію інструмента файлової системи лише в межах робочої області. |
| `tools.exec.allowSecurity`    | `tools.exec.security` і безпека exec для окремих агентів | Дозволяти лише режими безпеки exec, як-от `deny` або `allowlist`.                    |
| `tools.exec.requireAsk`       | `tools.exec.ask` і режим запиту exec для окремих агентів | Вимагати позицію схвалення, як-от `always`.                                          |
| `tools.exec.allowHosts`       | `tools.exec.host` і маршрутизація exec-хоста для окремих агентів | Дозволяти лише режими маршрутизації exec-хоста, як-от `sandbox`.                     |
| `tools.elevated.allow`        | `tools.elevated.enabled` і підвищена позиція для окремих агентів | Установіть `false`, щоб вимагати, аби підвищений режим інструментів залишався вимкненим. |
| `tools.alsoAllow.expected`    | `tools.alsoAllow` і `tools.alsoAllow` для окремих агентів | Вимагати точні записи `alsoAllow` і повідомляти про відсутні або неочікувані додаткові дозволи інструментів. |
| `tools.denyTools`             | `tools.deny` і `agents.list[].tools.deny`               | Вимагати, щоб налаштовані списки заборони інструментів містили ідентифікатори інструментів або групи, як-от `group:runtime` і `group:fs`. |

Запускайте перевірки лише політики під час авторингу:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` запускає лише набір перевірок політики та виводить докази, знахідки й
хеші атестації. Ті самі знахідки також з’являються в `openclaw doctor --lint`,
коли Plugin Policy увімкнено.

Порівняйте файл політики оператора з авторським базовим файлом політики:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` порівнює синтаксис файла політики із синтаксисом файла політики. Він не
перевіряє runtime-стан OpenClaw, докази, облікові дані чи секрети. Команда
використовує ті самі метадані правил політики, що керують scoped-накладаннями: списки дозволів мають
залишатися рівними або вужчими, списки заборон мають залишатися рівними або ширшими, обов’язкові булеві значення
мають зберігати своє обов’язкове значення, впорядковані рядки мають рухатися лише в бік більш
обмежувального кінця налаштованого порядку, а точні списки мають збігатися.

Базовий файл може бути політикою, створеною організацією. Перевірювана політика може
використовувати суворіші значення або додавати додаткові правила політики. Перевірюване правило верхнього рівня також може
задовольняти scoped-базове правило, коли воно так само або більш обмежувальне, оскільки
політика верхнього рівня застосовується широко. Назви областей не повинні збігатися; scoped-
порівняння прив’язується до значення селектора, як-от `agentIds` або `channelIds`, і до
поля політики, що перевіряється.

Приклад чистого JSON-виводу порівняння повідомляє лише стан порівняння файлів політики:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Приклад чистого виводу `policy check --json` містить стабільні хеші, які може
записати оператор або supervisor:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Налаштування політики

Конфігурація політики розміщується в `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Налаштування             | Призначення                                                     |
| ------------------------ | --------------------------------------------------------------- |
| `enabled`                | Увімкнути перевірки політики навіть до появи `policy.jsonc`.    |
| `workspaceRepairs`       | Дозволити `doctor --fix` редагувати налаштування робочої області, керовані політикою. |
| `expectedHash`           | Необов’язкове hash-lock для схваленого артефакта політики.      |
| `expectedAttestationHash` | Необов’язкове hash-lock для останньої прийнятої чистої перевірки політики. |
| `path`                   | Розташування артефакта політики відносно робочої області.       |

Установіть `plugins.entries.policy.config.enabled` у `false`, щоб вимкнути перевірки політики
для робочої області, залишивши Plugin установленим.

Вимоги до метаданих інструментів задаються в `policy.jsonc` через
`tools.requireMetadata`, наприклад `["risk", "sensitivity", "owner"]`.

## Прийняття стану політики

Приклад JSON-виводу:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

Хеш політики ідентифікує створений артефакт правил. Блок доказів
записує спостережений стан OpenClaw, використаний перевірками політики. Значення
`workspace.hash` ідентифікує це корисне навантаження доказів для перевіреної області.
Хеш виявлень ідентифікує точний набір виявлень, повернений перевіркою.
`checkedAt` записує, коли виконувалося оцінювання. Хеш атестації ідентифікує
стале твердження: хеш політики, хеш доказів, хеш виявлень і те, чи був
результат чистим. Він навмисно не включає `checkedAt`, тому однаковий
стан політики створює ту саму атестацію під час повторних перевірок. Разом
вони формують аудиторський кортеж для цієї перевірки політики.

Якщо пізніше Gateway або супервізор використовує політику, щоб блокувати, схвалювати або анотувати
дію під час виконання, він має записувати хеш атестації з останньої чистої перевірки
політики. `checkedAt` залишається в JSON-виводі для журналів аудиту, але не є частиною
стабільного хешу атестації.

Використовуйте цей життєвий цикл під час прийняття стану політики:

1. Створіть або перегляньте `policy.jsonc`.
2. Запустіть `openclaw policy check --json`.
3. Якщо результат чистий, запишіть `attestation.policy.hash` як `expectedHash`.
4. Запишіть `attestation.attestationHash` як `expectedAttestationHash`.
5. Повторно запустіть `openclaw doctor --lint` у CI або release gates.

Якщо правила політики змінюються навмисно, оновіть обидва прийняті хеші з чистої
перевірки. Якщо налаштування робочого простору змінюються навмисно, але політика залишається такою самою,
зазвичай змінюється лише `expectedAttestationHash`.

Увімкнення або оновлення правил `agents.workspace` додає докази `agentWorkspace` до
хешу робочого простору та хешу атестації. Оператори мають переглянути нові
докази й оновити прийняті хеші атестації після ввімкнення цих правил.
Увімкнення або оновлення правил стану безпеки інструментів додає докази `toolPosture` у
такий самий спосіб.

`openclaw policy watch` повторно запускає ту саму перевірку й повідомляє, коли
поточні докази більше не відповідають `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Використовуйте `--once` у CI або скриптах, яким потрібне лише одне оцінювання відхилення. Без
`--once` команда за замовчуванням опитує кожні дві секунди; використовуйте `--interval-ms`, щоб
вибрати інший інтервал.

## Виявлення

Наразі політика перевіряє:

| ID перевірки                                             | Висновок                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Політика ввімкнена, але `policy.jsonc` відсутній.                                |
| `policy/policy-jsonc-invalid`                            | Політику не вдається розібрати або вона містить некоректні записи правил.        |
| `policy/policy-hash-mismatch`                            | Політика не відповідає налаштованому `expectedHash`.                             |
| `policy/attestation-hash-mismatch`                       | Поточні докази політики більше не відповідають прийнятій атестації.              |
| `policy/policy-conformance-invalid`                      | Базовий або перевірений файл політики має недійсний синтаксис порівняння.        |
| `policy/policy-conformance-missing`                      | У перевіреному файлі політики відсутнє правило, потрібне базовим файлом політики. |
| `policy/policy-conformance-weaker`                       | Перевірений файл політики має слабше значення, ніж базовий файл політики.        |
| `policy/channels-denied-provider`                        | Увімкнений канал відповідає правилу заборони каналу.                             |
| `policy/mcp-denied-server`                               | Налаштований MCP-сервер заборонений політикою.                                   |
| `policy/mcp-unapproved-server`                           | Налаштований MCP-сервер перебуває поза списком дозволених.                       |
| `policy/models-denied-provider`                          | Налаштований постачальник моделі або посилання на модель використовує забороненого постачальника. |
| `policy/models-unapproved-provider`                      | Налаштований постачальник моделі або посилання на модель перебуває поза списком дозволених. |
| `policy/network-private-access-enabled`                  | Аварійний обхід SSRF для приватної мережі ввімкнено, хоча політика його забороняє. |
| `policy/ingress-dm-policy-unapproved`                    | Політика приватних повідомлень каналу перебуває поза списком дозволених політикою. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` не відповідає області ізоляції приватних повідомлень, яку вимагає політика. |
| `policy/ingress-open-groups-denied`                      | Політика групи каналу має значення `open`, хоча політика забороняє вхідні відкриті групи. |
| `policy/ingress-group-mention-required`                  | Запис каналу або групи вимикає шлюзи згадок, хоча політика вимагає їх.           |
| `policy/gateway-non-loopback-bind`                       | Позиція прив’язки Gateway дозволяє не-loopback-доступ, хоча політика його забороняє. |
| `policy/gateway-auth-disabled`                           | Автентифікацію Gateway вимкнено, хоча політика вимагає автентифікації.           |
| `policy/gateway-rate-limit-missing`                      | Позиція обмеження частоти автентифікації Gateway не задана явно, хоча політика цього вимагає. |
| `policy/gateway-control-ui-insecure`                     | Увімкнено перемикачі небезпечного доступу до Gateway Control UI.                 |
| `policy/gateway-tailscale-funnel`                        | Доступ через Gateway Tailscale Funnel увімкнено, хоча політика його забороняє.   |
| `policy/gateway-remote-enabled`                          | Віддалений режим Gateway активний, хоча політика його забороняє.                 |
| `policy/gateway-http-endpoint-enabled`                   | Кінцеву точку Gateway HTTP API увімкнено, хоча політика її забороняє.            |
| `policy/gateway-http-url-fetch-unrestricted`             | Вхід URL-fetch Gateway HTTP не має потрібного списку дозволених URL.             |
| `policy/agents-workspace-access-denied`                  | Режим пісочниці агента або доступ до робочої області перебуває поза списком дозволених політикою. |
| `policy/agents-tool-not-denied`                          | Агент або типова конфігурація не забороняє інструмент, якого вимагає політика.   |
| `policy/tools-profile-unapproved`                        | Налаштований глобальний або агентний профіль інструментів перебуває поза списком дозволених. |
| `policy/tools-fs-workspace-only-required`                | Інструменти файлової системи не налаштовані з позицією шляхів лише в робочій області. |
| `policy/tools-exec-security-unapproved`                  | Режим безпеки Exec перебуває поза списком дозволених політикою.                  |
| `policy/tools-exec-ask-unapproved`                       | Режим запиту Exec перебуває поза списком дозволених політикою.                   |
| `policy/tools-exec-host-unapproved`                      | Маршрутизація хоста Exec перебуває поза списком дозволених політикою.            |
| `policy/tools-elevated-enabled`                          | Підвищений режим інструментів увімкнено, хоча політика його забороняє.           |
| `policy/tools-also-allow-missing`                        | У налаштованому списку `alsoAllow` відсутній запис, потрібний політикою.         |
| `policy/tools-also-allow-unexpected`                     | Налаштований список `alsoAllow` містить запис, не очікуваний політикою.          |
| `policy/tools-required-deny-missing`                     | Глобальний або агентний список заборон інструментів не містить потрібного забороненого інструмента. |
| `policy/sandbox-mode-unapproved`                         | Режим пісочниці перебуває поза списком дозволених політикою.                     |
| `policy/sandbox-backend-unapproved`                      | Backend пісочниці перебуває поза списком дозволених політикою.                   |
| `policy/sandbox-container-posture-unobservable`          | Правило позиції контейнера ввімкнено для backend, який не може його спостерігати. |
| `policy/sandbox-container-host-network-denied`           | Пісочниця або браузер на базі контейнера використовує режим мережі хоста.        |
| `policy/sandbox-container-namespace-join-denied`         | Пісочниця або браузер на базі контейнера приєднується до простору імен іншого контейнера. |
| `policy/sandbox-container-mount-mode-required`           | Монтування пісочниці або браузера на базі контейнера не є лише для читання.      |
| `policy/sandbox-container-runtime-socket-mount`          | Монтування пісочниці або браузера на базі контейнера відкриває сокет runtime контейнера. |
| `policy/sandbox-container-unconfined-profile`            | Профіль пісочниці контейнера є необмеженим, хоча політика це забороняє.          |
| `policy/sandbox-browser-cdp-source-range-missing`        | Діапазон джерел CDP браузера пісочниці відсутній, хоча політика його вимагає.    |
| `policy/data-handling-redaction-disabled`                | Редагування чутливих даних у журналах вимкнено, хоча політика його вимагає.      |
| `policy/data-handling-telemetry-content-capture`         | Захоплення вмісту телеметрії ввімкнено, хоча політика його забороняє.            |
| `policy/data-handling-session-retention-not-enforced`    | Обслуговування зберігання сесій не застосовується, хоча політика цього вимагає.  |
| `policy/data-handling-session-transcript-memory-enabled` | Індексування пам’яті транскриптів сесій увімкнено, хоча політика його забороняє. |
| `policy/secrets-unmanaged-provider`                      | SecretRef у конфігурації посилається на постачальника, не оголошеного в `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Постачальник секретів у конфігурації або SecretRef використовує джерело, заборонене політикою. |
| `policy/secrets-insecure-provider`                       | Постачальник секретів явно обирає небезпечну позицію, хоча політика її забороняє. |
| `policy/auth-profile-invalid-metadata`                   | У профілі автентифікації конфігурації відсутні чинні метадані постачальника або режиму. |
| `policy/auth-profile-unapproved-mode`                    | Режим профілю автентифікації конфігурації перебуває поза списком дозволених політикою. |
| `policy/exec-approvals-missing`                          | Політика вимагає `exec-approvals.json`, але артефакт відсутній.                  |
| `policy/exec-approvals-invalid`                          | Налаштований артефакт схвалень exec не вдається розібрати.                       |
| `policy/exec-approvals-default-security-unapproved`      | Типові схвалення Exec використовують режим безпеки поза списком дозволених політикою. |
| `policy/exec-approvals-agent-security-unapproved`        | Ефективний режим безпеки схвалень exec для окремого агента перебуває поза списком дозволених. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Агент схвалення exec неявно автоматично дозволяє CLI Skills, хоча політика це забороняє. |
| `policy/exec-approvals-allowlist-missing`                | У списку дозволених схвалень відсутній шаблон, потрібний політикою.              |
| `policy/exec-approvals-allowlist-unexpected`             | Список дозволених схвалень містить шаблон, не очікуваний політикою.              |
| `policy/tools-missing-risk-level`                        | У керованій декларації інструмента відсутні метадані ризику.                     |
| `policy/tools-unknown-risk-level`                        | Керована декларація інструмента використовує невідоме значення ризику.           |
| `policy/tools-missing-sensitivity-token`                 | У керованій декларації інструмента відсутні метадані чутливості.                 |
| `policy/tools-missing-owner`                             | У керованій декларації інструмента відсутні метадані власника.                   |
| `policy/tools-unknown-sensitivity-token`                 | Керована декларація інструмента використовує невідоме значення чутливості.       |

Висновки політики можуть містити і `target`, і `requirement`. `target` — це
спостережуваний об’єкт робочої області, який не відповідає вимогам. `requirement` — це створене
правило політики, через яке це стало висновком. Сьогодні обидва значення є адресами, зазвичай
шляхами `oc://`, але назви полів описують їхню роль у політиці, а не
формат адреси.

Приклад висновку JSON:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Приклад висновку інструмента:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Приклад висновку MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Приклад висновку постачальника моделі:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Приклад мережевого висновку:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Приклад знахідки щодо відкритого доступу до Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Приклад знахідки щодо робочого простору агента:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Виправлення

`doctor --lint` і `policy check` призначені лише для читання.

`doctor --fix` редагує налаштування робочого простору, керовані політикою, лише коли
`workspaceRepairs` явно ввімкнено. Без цієї згоди перевірки політики
повідомляють, що саме вони відремонтували б, і залишають налаштування без змін.

У цій версії ремонт може вимикати канали, увімкнені в конфігурації OpenClaw,
але заборонені `channels.denyRules`. Вмикайте `workspaceRepairs` лише після
перегляду файлу політики, оскільки чинне правило заборони може вимкнути
налаштований канал:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Коди виходу

| Команда          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Немає знахідок на пороговому рівні.                    | Одна або більше знахідок досягли порогового рівня.                  | Помилка аргументів або виконання. |
| `policy compare` | Файл політики щонайменше такий самий суворий, як базовий. | Файл політики недійсний, відсутній або слабший за базові правила. | Помилка аргументів або виконання. |
| `policy watch`   | Немає знахідок, а прийнятий хеш актуальний.            | Знахідки існують або прийнята атестація застаріла.                  | Помилка аргументів або виконання. |

## Пов’язане

- [Режим lint для Doctor](/uk/cli/doctor#lint-mode)
- [CLI path](/uk/cli/path)
