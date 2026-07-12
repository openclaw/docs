---
read_when:
    - Ви хочете перевірити налаштування OpenClaw на відповідність створеній вами політиці policy.jsonc
    - Ви хочете бачити виявлені порушення політик у lint-перевірці doctor
    - Вам потрібен хеш атестації політики як доказ для аудиту
summary: Довідник CLI для перевірок відповідності `openclaw policy`
title: Політика
x-i18n:
    generated_at: "2026-07-12T13:06:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` надається вбудованим Plugin політики. Це корпоративний рівень
відповідності поверх наявних налаштувань OpenClaw, а не друга система
конфігурації. Ви задаєте вимоги у `policy.jsonc`; OpenClaw спостерігає за активним
робочим простором як джерелом доказів; політика повідомляє про розбіжності через
`doctor --lint`. Політика не контролює виклики інструментів, не переписує
поведінку середовища виконання під час запиту й не засвідчує сховища облікових
даних окремих агентів, як-от `auth-profiles.json`.

Політика перевіряє налаштовані канали, сервери MCP, постачальників моделей,
захищеність мережі від SSRF, вхідний доступ і доступ до каналів, відкритість
Gateway і політику команд вузлів, доступ агентів до робочого простору, стан
пісочниці, політику обробки даних, стан постачальників секретів і профілів
автентифікації, а також метадані керованих інструментів (`TOOLS.md`).
Використовуйте її, коли робочому простору потрібне довготривале твердження, яке
можна перевірити, наприклад «Telegram не має бути ввімкнено» або «керовані
інструменти мають містити метадані про ризик і власника». Якщо вам потрібна лише
локальна поведінка без засвідчення чи виявлення розбіжностей, достатньо звичайної
конфігурації.

## Швидкий початок

```bash
openclaw plugins enable policy
```

Plugin залишається ввімкненим, навіть якщо `policy.jsonc` відсутній, тому doctor
може повідомити про відсутній артефакт, а не мовчки пропустити перевірки.

Створюйте `policy.jsonc` вручну; він не генерується з поточних налаштувань. Кожен
розділ верхнього рівня є простором імен правил: перевірка виконується лише тоді,
коли в ньому наявне конкретне правило (непідтримувані розділи або ключі
спричиняють помилку `policy/policy-jsonc-invalid`, а не мовчки ігноруються).
Мінімальний приклад, що охоплює всі підтримувані розділи:

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
    "nodes": {
      "denyCommands": ["system.run"],
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

Наскрізні примітки, які не є очевидними з наведених нижче таблиць правил:

- Якщо не вказати `gateway.bind`, заборонивши прив’язування не до local loopback,
  це означає, що ви приймаєте стандартне значення середовища виконання; для
  суворої відповідності встановіть `gateway.bind: "loopback"`.
- Для агента з доступом лише для читання встановіть для пісочниці `mode` у
  значення `all` або `non-main` у відповідних стандартних налаштуваннях чи
  налаштуваннях агента, а `workspaceAccess` — у `none` або `ro`. Відсутній режим
  пісочниці або значення `off` не відповідає політиці доступу лише для читання.
- `agents.workspace.denyTools` приймає `exec`, `process`, `write`, `edit`,
  `apply_patch`. Групи заборони інструментів конфігурації `group:fs` (змінення
  файлів) і `group:runtime` (оболонка/процеси) забезпечують еквівалентну політику.
- Перевірки схвалення виконання читають активний артефакт `exec-approvals.json`,
  лише коли наявне правило `execApprovals`; відсутній або недійсний артефакт є
  неспостережуваним доказом, а не штучно успішною перевіркою.
- Докази щодо секретів і профілів автентифікації містять лише відомості про стан
  постачальника/джерела та метадані SecretRef, але ніколи не містять необроблених
  значень. Політика не читає й не засвідчує сховища облікових даних окремих
  агентів, як-от `auth-profiles.json`.
- Докази щодо обробки даних відображають лише стан на рівні конфігурації (режим
  редагування конфіденційних даних, перемикач збирання телеметрії, режим
  обслуговування сеансів, налаштування індексування розшифровок). Вони не
  перевіряють журнали, експорти телеметрії, розшифровки або файли пам’яті, а
  успішний результат не доводить відсутності в них персональних даних чи
  секретів.

### Довідник правил політики

Кожне наведене нижче правило є необов’язковим; перевірка виконується лише за
наявності правила. Спостережуваний стан — це наявна конфігурація OpenClaw або
метадані робочого простору.

#### Накладання з областю дії

Використовуйте `scopes.<scopeName>`, коли для певних агентів або каналів потрібна
суворіша політика, ніж базова політика верхнього рівня. Назва області дії — лише
мітка; зіставлення використовує селектор усередині області. Накладання є
додатковими: глобальне правило продовжує виконуватися, а правило з областю дії
може додати власний результат перевірки для тих самих доказів.

| Селектор     | Підтримувані розділи                                                           | Коли використовувати                                      |
| ------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Одному або кільком агентам виконання потрібні суворіші правила. |
| `channelIds` | `ingress.channels`                                                             | Одному або кільком каналам потрібні суворіші правила вхідного доступу. |

Якщо запис `agentIds` відсутній у `agents.list[]`, OpenClaw оцінює правило з
областю дії за успадкованою глобальною/стандартною політикою для цього
ідентифікатора агента виконання, а не пропускає його.

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

Той самий агент може входити до кількох областей дії, якщо кожна з них керує
іншим полем, як у прикладі вище. Повторюване поле з областю дії для того самого
агента має бути настільки ж або більш обмежувальним; слабше повторне твердження
відхиляється (списки дозволів мають бути підмножинами, списки заборон —
надмножинами, а обов’язкові булеві значення є фіксованими).

Правила стану контейнерів (`sandbox.containers.*`) перевіряються лише за
доказами, які може надати серверна частина пісочниці зіставленого агента. Якщо
серверна частина не може спостерігати ввімкнене для неї правило, політика
повідомляє `policy/sandbox-container-posture-unobservable`, а не зараховує
перевірку як успішну; обмежуйте правила контейнерів областю дії для груп агентів,
які використовують серверну частину, здатну надати такі докази.

`ingress.session.requireDmScope` верхнього рівня залишається глобальним;
`session.dmScope` не є доказом, який можна віднести до певного каналу, тому його
не можна обмежити областю дії через `channelIds`.

Кожна область дії у `policy.jsonc` має бути дійсною та придатною до застосування.

#### Канали

| Поле політики                        | Спостережуваний стан                    | Коли використовувати                                      |
| ------------------------------------ | --------------------------------------- | --------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Постачальник `channels.*` і стан увімкнення | Заборонити налаштовані канали постачальника, як-от `telegram`. |
| `channels.denyRules[].reason`        | Повідомлення результату перевірки та контекст підказки щодо виправлення | Пояснити, чому постачальника заборонено. |

#### Сервери MCP

| Поле політики       | Спостережуваний стан | Коли використовувати                                      |
| ------------------- | --------------------- | --------------------------------------------------------- |
| `mcp.servers.allow` | Ідентифікатори `mcp.servers.*` | Вимагати, щоб кожен налаштований сервер MCP був у списку дозволів. |
| `mcp.servers.deny`  | Ідентифікатори `mcp.servers.*` | Заборонити певні ідентифікатори налаштованих серверів MCP. |

#### Постачальники моделей

| Поле політики            | Спостережуваний стан                                  | Коли використовувати                                      |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------- |
| `models.providers.allow` | Ідентифікатори `models.providers.*` і посилання на вибрані моделі | Вимагати, щоб налаштовані постачальники та посилання на вибрані моделі використовували схвалених постачальників. |
| `models.providers.deny`  | Ідентифікатори `models.providers.*` і посилання на вибрані моделі | Заборонити налаштованих постачальників і посилання на вибрані моделі за ідентифікатором постачальника. |

#### Мережа

| Поле політики                  | Спостережуваний стан                  | Коли використовувати                                      |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------- |
| `network.privateNetwork.allow` | Обхідні шляхи захисту від SSRF для приватної мережі | Установіть `false`, щоб вимагати, аби доступ до приватної мережі залишався вимкненим. |

#### Вхідний доступ і доступ до каналів

| Поле політики                             | Спостережуваний стан                                          | Коли використовувати                                                   |
| ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                             | Вимагати перевірену область ізоляції прямих повідомлень.                |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` і застарілі поля політики приватних повідомлень каналу | Дозволяти лише перевірені політики каналів для прямих повідомлень.      |
| `ingress.channels.denyOpenGroups`         | Політика вхідного доступу для каналу, облікового запису та групи | Забороняти відкритий груповий вхідний доступ для налаштованих каналів і облікових записів. |
| `ingress.channels.requireMentionInGroups` | Конфігурація шлюзу згадок для каналу, облікового запису, групи, сервера та вкладених рівнів | Вимагати шлюзи згадок, коли груповий вхідний доступ відкритий або обмежений згадками. |

#### Gateway

| Поле політики                           | Спостережуваний стан                                  | Коли використовувати                                                                  |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                        | Установіть `false`, щоб вимагати прив’язування Gateway до local loopback.              |
| `gateway.exposure.allowTailscaleFunnel` | Режим доступу Gateway через Tailscale Serve/Funnel    | Установіть `false`, щоб заборонити доступ через Tailscale Funnel.                      |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                   | Установіть `true`, щоб відхиляти вимкнену автентифікацію Gateway.                      |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                              | Установіть `true`, щоб вимагати явної конфігурації обмеження частоти автентифікації.   |
| `gateway.controlUi.allowInsecure`       | Небезпечні перемикачі автентифікації, пристрою та джерела в Control UI | Установіть `false`, щоб заборонити небезпечні перемикачі доступу до Control UI.         |
| `gateway.remote.allow`                  | Режим і конфігурація віддаленого Gateway              | Установіть `false`, щоб заборонити режим віддаленого Gateway.                          |
| `gateway.http.denyEndpoints`            | Кінцеві точки HTTP API Gateway                        | Забороняти ідентифікатори кінцевих точок, як-от `chatCompletions` або `responses`.     |
| `gateway.http.requireUrlAllowlists`     | Вхідні дані Gateway для отримання ресурсів за URL     | Установіть `true`, щоб вимагати списки дозволених URL для таких вхідних даних.         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                          | Вимагати, щоб точні ідентифікатори команд вузла, як-от `system.run`, були заборонені в конфігурації OpenClaw. |

`gateway.nodes.denyCommands` — це точне правило надмножини заборон, чутливе до регістру.
Використовуйте його, коли політика має підтвердити, що привілейовані команди вузла явно
заборонені конфігурацією OpenClaw. Розгортання, яке навмисно дозволяє привілейовану
команду вузла, має після перевірки оновити `policy.jsonc`, а не покладатися лише на
`gateway.nodes.allowCommands`.

#### Робочий простір агента

| Поле політики                    | Спостережуваний стан                                                                 | Коли використовувати                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` і `agents.list[].sandbox.workspaceAccess` | Дозволяти лише такі значення доступу до робочого простору пісочниці, як `none` або `ro`.   |
| `agents.workspace.denyTools`     | Глобальна та поагентна конфігурація заборони інструментів                            | Вимагати заборони інструментів внесення змін (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Режим захисту пісочниці

| Поле політики                                        | Спостережуваний стан                                   | Коли використовувати                                                 |
| ---------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` і поагентний режим      | Дозволяти лише перевірені режими пісочниці, як-от `all` або `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` і поагентний бекенд  | Дозволяти лише перевірені бекенди пісочниці, як-от `docker`.          |
| `sandbox.containers.denyHostNetwork`                  | Мережевий режим контейнерної пісочниці або браузера    | Забороняти режим мережі хоста.                                       |
| `sandbox.containers.denyContainerNamespaceJoin`       | Мережевий режим контейнерної пісочниці або браузера    | Забороняти приєднання до мережевого простору імен іншого контейнера.  |
| `sandbox.containers.requireReadOnlyMounts`            | Режим монтування контейнерної пісочниці або браузера   | Вимагати монтування лише для читання.                                 |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Цілі монтування контейнерної пісочниці або браузера    | Забороняти монтування сокетів середовища виконання контейнерів.       |
| `sandbox.containers.denyUnconfinedProfiles`           | Режим профілю безпеки контейнера                       | Забороняти необмежені профілі безпеки контейнерів.                    |
| `sandbox.browser.requireCdpSourceRange`               | Діапазон джерел CDP браузера пісочниці                 | Вимагати зазначення діапазону джерел для доступу до CDP браузера.     |

Політика трактує відсутній `sandbox.mode` як його неявне типове значення `off`, тому
`sandbox.requireMode` повідомляє, що нова або неналаштована пісочниця не входить до
списку дозволених значень, як-от `["all"]`.

#### Обробка даних

| Поле політики                                      | Спостережуваний стан                                                                | Коли використовувати                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                           | Установіть `true`, щоб відхиляти `logging.redactSensitive: "off"`.               |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                   | Установіть `true`, щоб відхиляти захоплення вмісту телеметрією.                  |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                          | Установіть `true`, щоб вимагати ефективний режим обслуговування сеансів `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` і `agents.*.memorySearch.experimental.sessionMemory` | Установіть `true`, щоб відхиляти індексування стенограм сеансів у пам’яті.        |

#### Секрети

| Поле політики                     | Спостережуваний стан                                            | Коли використовувати                                                       |
| --------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRef у конфігурації та оголошення `secrets.providers.*`    | Установіть `true`, щоб вимагати, аби SecretRef посилалися на оголошених постачальників. |
| `secrets.denySources`             | Джерела постачальників секретів і джерела SecretRef             | Забороняти такі джерела, як `exec`, `file` або інше налаштоване ім’я джерела. |
| `secrets.allowInsecureProviders`  | Прапорці небезпечного режиму постачальників секретів            | Установіть `false`, щоб відхиляти постачальників, які вмикають небезпечний режим. |

#### Схвалення виконання

Перевірки схвалень виконання читають артефакт середовища виконання `exec-approvals.json`:
типово `~/.openclaw/exec-approvals.json` або
`$OPENCLAW_STATE_DIR/exec-approvals.json`, коли встановлено `OPENCLAW_STATE_DIR`.
Правила режиму захисту в `execApprovals.defaults.*` або `execApprovals.agents.*`
вимагають доступних для читання доказів з артефакту; відсутній або недійсний артефакт
позначається як недоступний для спостереження доказ, а не як умовно успішна перевірка.
Коли артефакт доступний для читання, пропущені поля успадковують типові значення
середовища виконання: відсутній `defaults.security` має значення `full`, а відсутній
рівень безпеки агента успадковує це типове значення. Докази містять `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, необов’язковий `argPattern`, ефективний
режим `autoAllowSkills` і джерело запису, але ніколи не містять шлях або токен сокета,
`commandText`, `lastUsedCommand`, розв’язані шляхи чи часові позначки.

| Поле політики                              | Спостережуваний стан                                                                  | Коли використовувати                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `execApprovals.requireFile`                 | Активний шлях середовища виконання до `exec-approvals.json`                           | Установіть `true`, щоб вимагати наявності та успішного розбору артефакту схвалень.    |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, типово `full`                                                    | Дозволяти лише схвалені типові режими безпеки схвалень.                               |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, що успадковує типові значення                                    | Дозволяти лише схвалені ефективні поагентні режими безпеки схвалень.                  |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` і `agents.*.autoAllowSkills`, що успадковують типові значення середовища виконання | Установіть `false`, щоб вимагати суворих ручних списків дозволів без неявного схвалення CLI Skills. |
| `execApprovals.agents.allowlist.expected`   | Сукупні записи шаблонів `agents.*.allowlist[]` і необов’язкові записи argPattern      | Вимагати, щоб список дозволів схвалень відповідав перевіреному набору шаблонів.       |

Приклад: вимагати артефакт схвалень, заборонити надмірно дозвільні типові значення та дозволяти
лише перевірений режим схвалення виконання для вибраних агентів.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Режими безпеки: "deny", "allowlist" або "full".
      // Це типове значення дозволяє лише суворо обмежений режим deny.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Вибрані агенти можуть використовувати перевірений режим allowlist, але не "full".
          "allowSecurity": ["allowlist"],
          // false означає, що CLI Skills мають бути в перевіреному списку дозволів, а не
          // отримувати неявне схвалення через autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Простий запис: точний перевірений шаблон виконуваного файла без argPattern.
              "travel-hub",
              // Обмежений запис: шаблон разом із перевіреним регулярним виразом аргументів.
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

| Поле політики                   | Спостережуваний стан                         | Коли використовувати                                                                         |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Метадані постачальника та режиму `auth.profiles.*` | Вимагати в профілях автентифікації конфігурації ключі метаданих, як-от `provider` і `mode`. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Дозволяти лише підтримувані режими профілів автентифікації, як-от `api_key`, `aws-sdk`, `oauth` або `token`. |

#### Метадані інструментів

| Поле політики           | Спостережуваний стан             | Коли використовувати                                                                                     |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Керовані оголошення `TOOLS.md`   | Вимагати, щоб керовані інструменти оголошували ключі метаданих, як-от `risk`, `sensitivity` або `owner`. |

#### Режим інструментів

| Поле політики                   | Спостережуваний стан                                       | Коли використовувати                                                                                                      |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` і `agents.list[].tools.profile`            | Дозволяти лише ідентифікатори профілів інструментів, як-от `minimal`, `messaging` або `coding`.                            |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` і перевизначення `tools.fs` для окремих агентів | Установити `true`, щоб вимагати режиму інструментів файлової системи лише для робочої області.                |
| `tools.exec.allowSecurity`      | `tools.exec.security` і безпека виконання для окремих агентів | Дозволяти лише режими безпеки виконання, як-от `deny` або `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` і режим запиту виконання для окремих агентів | Вимагати режиму схвалення, як-от `always`.                                                                       |
| `tools.exec.allowHosts`         | `tools.exec.host` і маршрутизація хоста виконання для окремих агентів | Дозволяти лише режими маршрутизації хоста виконання, як-от `sandbox`.                                  |
| `tools.elevated.allow`          | `tools.elevated.enabled` і привілейований режим для окремих агентів | Установити `false`, щоб вимагати, аби привілейований режим інструментів залишався вимкненим.                  |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` і `tools.alsoAllow` для окремих агентів  | Вимагати точні записи `alsoAllow` і повідомляти про відсутні або неочікувані додаткові дозволи інструментів.               |
| `tools.denyTools`               | `tools.deny` і `agents.list[].tools.deny`                  | Вимагати, щоб налаштовані списки заборон інструментів містили ідентифікатори інструментів або групи, як-от `group:runtime` і `group:fs`. |

## Запуск перевірок

Під час створення запускайте лише перевірки політики:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` запускає лише набір перевірок політики та виводить докази, результати
й хеші атестації. Ті самі результати також з’являються в
`openclaw doctor --lint`, коли Plugin політики ввімкнено.

Порівняйте файл політики оператора зі створеним базовим варіантом:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` перевіряє синтаксис файла політики відносно синтаксису файла політики; він
не перевіряє стан середовища виконання, докази, облікові дані чи секрети. Він використовує ті самі
метадані правил, які керують накладеннями з областю дії: списки дозволів мають залишатися однаковими або
вужчими, списки заборон — однаковими або ширшими, обов’язкові логічні значення мають зберігати
своє значення, упорядковані рядки можуть рухатися лише до суворішого кінця
налаштованого порядку, а точні списки мають збігатися. Базовим варіантом може бути
політика, створена організацією; перевірювана політика може додавати суворіші значення або
додаткові правила. Перевірюване правило верхнього рівня може задовольняти правило базового варіанта з областю дії, якщо
воно таке саме або суворіше. Назви областей дії у файлах не обов’язково мають
збігатися; порівняння виконується за селектором (`agentIds`/`channelIds`) і полем.

Успішне порівняння (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Успішний результат `policy check --json` містить стабільні хеші, які оператор або
система нагляду може записати:

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

Конфігурація політики міститься в `plugins.entries.policy.config`.

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

| Налаштування              | Призначення                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `enabled`                 | Увімкнути перевірки політики ще до появи `policy.jsonc`.                      |
| `workspaceRepairs`        | Дозволити `doctor --fix` редагувати керовані політикою налаштування робочої області. |
| `expectedHash`            | Необов’язкова фіксація хешу схваленого артефакту політики.                    |
| `expectedAttestationHash` | Необов’язкова фіксація хешу останньої прийнятої успішної перевірки політики.  |
| `path`                    | Розташування артефакту політики відносно робочої області.                     |

Установіть `plugins.entries.policy.config.enabled` у `false`, щоб вимкнути перевірки
політики для робочої області, залишивши Plugin встановленим.

## Прийняття стану політики

Приклад виводу JSON:

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash` ідентифікує створений артефакт правил. `evidence`
записує спостережуваний стан OpenClaw, використаний перевірками, а
`workspace.hash` ідентифікує це корисне навантаження доказів. `findingsHash` ідентифікує
точний набір результатів. `checkedAt` фіксує час виконання перевірки.
`attestationHash` ідентифікує стабільне твердження (хеш політики, хеш доказів,
хеш результатів і успішний/неуспішний стан) та навмисно не включає `checkedAt`,
тому той самий стан політики завжди створює той самий хеш атестації. Разом
ці чотири значення утворюють аудиторський кортеж однієї перевірки політики.

Якщо Gateway або система нагляду використовує політику для блокування, схвалення чи анотування
дії середовища виконання, вона має записувати хеш атестації з останньої успішної
перевірки. `checkedAt` залишається у виводі JSON для журналів аудиту, але не є частиною
стабільного хешу.

Життєвий цикл прийняття стану політики:

1. Створіть або перевірте `policy.jsonc`.
2. Виконайте `openclaw policy check --json`.
3. Якщо перевірка успішна, запишіть `attestation.policy.hash` як `expectedHash`.
4. Запишіть `attestation.attestationHash` як `expectedAttestationHash`.
5. Повторно виконайте `openclaw doctor --lint` у CI або на контрольних етапах випуску.

Якщо правила політики змінено навмисно, оновіть обидва прийняті хеші за
результатами чистої перевірки. Якщо змінено лише налаштування робочого простору
(політика залишається незмінною), зазвичай змінюється лише `expectedAttestationHash`.

Увімкнення або оновлення правил `agents.workspace` додає свідчення `agentWorkspace`
до хешу робочого простору та хешу атестації; після ввімкнення перегляньте нові
свідчення й оновіть прийняті хеші атестації. Увімкнення або оновлення правил
стану інструментів так само додає свідчення `toolPosture`.

`openclaw policy watch` повторно запускає перевірку та повідомляє, коли поточні
свідчення більше не відповідають `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Використовуйте `--once` у CI або сценаріях, яким потрібна одноразова оцінка
відхилення. Без `--once` за замовчуванням опитування виконується кожні дві
секунди; щоб змінити інтервал, використовуйте `--interval-ms`.

## Виявлені проблеми

| Ідентифікатор перевірки                                  | Виявлена проблема                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Політику ввімкнено, але файл `policy.jsonc` відсутній.                                                    |
| `policy/policy-jsonc-invalid`                            | Політику неможливо проаналізувати або вона містить неправильно сформовані записи правил.                  |
| `policy/policy-hash-mismatch`                            | Політика не відповідає налаштованому `expectedHash`.                                                      |
| `policy/attestation-hash-mismatch`                       | Поточні свідчення політики більше не відповідають прийнятій атестації.                                    |
| `policy/policy-conformance-invalid`                      | Базовий або перевірюваний файл політики має некоректний синтаксис порівняння.                             |
| `policy/policy-conformance-missing`                      | У перевірюваному файлі політики відсутнє правило, обов’язкове згідно з базовим файлом політики.           |
| `policy/policy-conformance-weaker`                       | Значення в перевірюваному файлі політики слабше, ніж у базовому файлі політики.                           |
| `policy/channels-denied-provider`                        | Увімкнений канал відповідає правилу заборони каналу.                                                      |
| `policy/mcp-denied-server`                               | Налаштований сервер MCP заборонено політикою.                                                             |
| `policy/mcp-unapproved-server`                           | Налаштований сервер MCP не входить до списку дозволених.                                                 |
| `policy/models-denied-provider`                          | Налаштований постачальник моделі або посилання на модель використовує забороненого постачальника.        |
| `policy/models-unapproved-provider`                      | Налаштований постачальник моделі або посилання на модель не входить до списку дозволених.                 |
| `policy/network-private-access-enabled`                  | Дозволено обхід захисту від SSRF для приватної мережі, хоча політика його забороняє.                      |
| `policy/ingress-dm-policy-unapproved`                    | Політика приватних повідомлень каналу не входить до списку дозволених політикою.                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` не відповідає області ізоляції приватних повідомлень, яку вимагає політика.             |
| `policy/ingress-open-groups-denied`                      | Для політики груп каналу встановлено `open`, хоча політика забороняє відкриті вхідні повідомлення груп.   |
| `policy/ingress-group-mention-required`                  | Запис каналу або групи вимикає перевірки згадок, хоча політика вимагає їх.                                |
| `policy/gateway-non-loopback-bind`                       | Режим прив’язки Gateway дозволяє доступ не через local loopback, хоча політика це забороняє.              |
| `policy/gateway-auth-disabled`                           | Автентифікацію Gateway вимкнено, хоча політика вимагає автентифікації.                                    |
| `policy/gateway-rate-limit-missing`                      | Режим обмеження частоти автентифікації Gateway не задано явно, хоча політика цього вимагає.               |
| `policy/gateway-control-ui-insecure`                     | Увімкнено перемикачі небезпечного доступу до інтерфейсу керування Gateway.                                |
| `policy/gateway-tailscale-funnel`                        | Доступ через Gateway Tailscale Funnel увімкнено, хоча політика його забороняє.                            |
| `policy/gateway-remote-enabled`                          | Віддалений режим Gateway активний, хоча політика його забороняє.                                         |
| `policy/gateway-http-endpoint-enabled`                   | Кінцеву точку HTTP API Gateway увімкнено, хоча політика її забороняє.                                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Для вхідних даних отримання URL через HTTP у Gateway відсутній обов’язковий список дозволених URL.        |
| `policy/gateway-node-command-denied`                     | Команду Node, заборонену політикою, не заборонено в конфігурації OpenClaw.                                |
| `policy/agents-workspace-access-denied`                  | Режим пісочниці агента або доступ до робочого простору не входить до списку дозволених політикою.         |
| `policy/agents-tool-not-denied`                          | У конфігурації агента або конфігурації за замовчуванням не заборонено інструмент, як того вимагає політика. |
| `policy/tools-profile-unapproved`                        | Налаштований глобальний або агентський профіль інструментів не входить до списку дозволених.              |
| `policy/tools-fs-workspace-only-required`                | Інструменти файлової системи не налаштовано на доступ до шляхів лише в межах робочого простору.           |
| `policy/tools-exec-security-unapproved`                  | Режим безпеки виконання не входить до списку дозволених політикою.                                       |
| `policy/tools-exec-ask-unapproved`                       | Режим запиту виконання не входить до списку дозволених політикою.                                        |
| `policy/tools-exec-host-unapproved`                      | Маршрутизація вузла виконання не входить до списку дозволених політикою.                                 |
| `policy/tools-elevated-enabled`                          | Режим інструментів із підвищеними привілеями ввімкнено, хоча політика його забороняє.                     |
| `policy/tools-also-allow-missing`                        | У налаштованому списку `alsoAllow` відсутній запис, обов’язковий згідно з політикою.                      |
| `policy/tools-also-allow-unexpected`                     | Налаштований список `alsoAllow` містить запис, не передбачений політикою.                                 |
| `policy/tools-required-deny-missing`                     | Глобальний або агентський список заборонених інструментів не містить обов’язкового забороненого інструмента. |
| `policy/sandbox-mode-unapproved`                         | Режим пісочниці не входить до списку дозволених політикою.                                               |
| `policy/sandbox-backend-unapproved`                      | Серверна частина пісочниці не входить до списку дозволених політикою.                                    |
| `policy/sandbox-container-posture-unobservable`          | Правило стану контейнера ввімкнено для серверної частини, яка не може його відстежувати.                  |
| `policy/sandbox-container-host-network-denied`           | Контейнерна пісочниця або браузер використовує мережевий режим хоста.                                    |
| `policy/sandbox-container-namespace-join-denied`         | Контейнерна пісочниця або браузер приєднується до простору імен іншого контейнера.                        |
| `policy/sandbox-container-mount-mode-required`           | Монтування в контейнерній пісочниці або браузері не доступне лише для читання.                            |
| `policy/sandbox-container-runtime-socket-mount`          | Монтування в контейнерній пісочниці або браузері відкриває доступ до сокета середовища виконання контейнерів. |
| `policy/sandbox-container-unconfined-profile`            | Профіль контейнерної пісочниці не має обмежень, хоча політика це забороняє.                               |
| `policy/sandbox-browser-cdp-source-range-missing`        | Діапазон джерел CDP браузера пісочниці відсутній, хоча політика вимагає його.                             |
| `policy/data-handling-redaction-disabled`                | Редагування конфіденційних даних у журналах вимкнено, хоча політика вимагає його.                         |
| `policy/data-handling-telemetry-content-capture`         | Збирання вмісту телеметрії ввімкнено, хоча політика його забороняє.                                      |
| `policy/data-handling-session-retention-not-enforced`    | Обслуговування строку зберігання сеансів не виконується, хоча політика цього вимагає.                     |
| `policy/data-handling-session-transcript-memory-enabled` | Індексування стенограм сеансів у пам’яті ввімкнено, хоча політика його забороняє.                         |
| `policy/secrets-unmanaged-provider`                      | SecretRef у конфігурації посилається на постачальника, не оголошеного в `secrets.providers`.              |
| `policy/secrets-denied-provider-source`                  | Постачальник секретів або SecretRef у конфігурації використовує джерело, заборонене політикою.            |
| `policy/secrets-insecure-provider`                       | Постачальника секретів налаштовано на небезпечний режим, хоча політика його забороняє.                    |
| `policy/auth-profile-invalid-metadata`                   | У профілі автентифікації конфігурації відсутні дійсні метадані постачальника або режиму.                  |
| `policy/auth-profile-unapproved-mode`                    | Режим профілю автентифікації конфігурації не входить до списку дозволених політикою.                      |
| `policy/exec-approvals-missing`                          | Політика вимагає `exec-approvals.json`, але цей артефакт відсутній.                                      |
| `policy/exec-approvals-invalid`                          | Налаштований артефакт схвалень виконання неможливо проаналізувати.                                       |
| `policy/exec-approvals-default-security-unapproved`      | Типові параметри схвалення виконання використовують режим безпеки, що не входить до списку дозволених політикою. |
| `policy/exec-approvals-agent-security-unapproved`        | Чинний режим безпеки схвалення виконання для агента не входить до списку дозволених.                      |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Агент схвалення виконання неявно автоматично дозволяє CLI Skills, хоча політика це забороняє.             |
| `policy/exec-approvals-allowlist-missing`                | У списку дозволених схвалень відсутній шаблон, обов’язковий згідно з політикою.                           |
| `policy/exec-approvals-allowlist-unexpected`             | Список дозволених схвалень містить шаблон, не передбачений політикою.                                    |
| `policy/tools-missing-risk-level`                        | У декларації керованого інструмента відсутні метадані ризику.                                            |
| `policy/tools-unknown-risk-level`                        | Декларація керованого інструмента використовує невідоме значення ризику.                                 |
| `policy/tools-missing-sensitivity-token`                 | У декларації керованого інструмента відсутні метадані чутливості.                                        |
| `policy/tools-missing-owner`                             | У декларації керованого інструмента відсутні метадані власника.                                         |
| `policy/tools-unknown-sensitivity-token`                 | Декларація керованого інструмента використовує невідоме значення чутливості.                             |

Виявлена проблема може містити як `target` (спостережуваний об’єкт робочого
простору, що не відповідає вимогам), так і `requirement` (задане правило,
через яке виникла проблема). Наразі обидва поля є рядками адрес `oc://`, але
назви полів описують роль у політиці, а не формат адреси.

Приклади виявлених проблем:

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

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

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

`doctor --lint` і `policy check` працюють лише в режимі читання.

`doctor --fix` редагує налаштування робочого простору, керовані політикою, лише коли
`workspaceRepairs` явно ввімкнено; інакше перевірки повідомляють, що саме вони
виправили б, і залишають налаштування без змін.

У цій версії виправлення може вимкнути канали, заборонені правилами `channels.denyRules`, і
застосувати наведені нижче автоматичні виправлення зі звуженням дозволів. Вмикайте `workspaceRepairs`
лише після перевірки файлу політики, оскільки чинне правило може змінити
конфігурацію робочого простору:

- установити `tools.elevated.enabled=false`, коли глобальна політика забороняє інструменти з підвищеними привілеями
- додати відсутні ідентифікатори інструментів, які обов’язково мають бути заборонені, до `tools.deny` або
  `agents.list[].tools.deny`, коли політика вимагає заборонити ці інструменти
- установити небезпечні перемикачі `gateway.controlUi.*` у значення `false`
- установити `gateway.mode=local`, коли політика забороняє віддалений режим Gateway
- установити для зазначених шляхів `gateway.http.endpoints.*.enabled` значення `false`, коли політика
  забороняє кінцеві точки HTTP API Gateway
- установити для зазначених шляхів вхідного трафіку каналів `groupPolicy` значення `allowlist`, коли політика
  забороняє відкритий груповий вхідний трафік
- установити для зазначених шляхів вхідного трафіку каналів `requireMention` значення `true`, коли політика
  вимагає згадок у групах
- установити `logging.redactSensitive=tools`, коли політика вимагає редагування
  конфіденційних даних у журналах
- установити `diagnostics.otel.captureContent=false` або
  `diagnostics.otel.captureContent.enabled=false` для налаштувань збирання телеметрії
  у формі об’єкта, коли політика забороняє збирання вмісту телеметрії

Виправлення інструментів із підвищеними привілеями з обмеженою областю дії доступні лише для виявлення. Виправлення обробки даних з обмеженою областю дії
також пропускаються, коли результат перевірки вказує на спільну конфігурацію журналювання або телеметрії,
оскільки зміна спільного налаштування вплинула б не лише на ціль політики
з обмеженою областю дії.

Виправлення обов’язкових заборон з обмеженою областю дії пропускаються, коли результат перевірки вказує на успадковане
кореневе налаштування `tools.deny`, оскільки додавання обов’язкового інструмента до кореневої конфігурації вплинуло б
не лише на ціль політики з обмеженою областю дії. Локальні для агента виправлення обов’язкових заборон можуть оновити
зазначений шлях `agents.list[].tools.deny`.

Виправлення вхідного трафіку каналів з обмеженою областю дії пропускаються, коли результат перевірки вказує на успадковане
налаштування `channels.defaults.*`, оскільки зміна спільного типового налаштування каналу вплинула б
не лише на ціль політики з обмеженою областю дії. Результати перевірки списку дозволених URL-адрес для отримання даних через HTTP у Gateway
потребують ручного виправлення, оскільки автоматичне виправлення не може вибрати правильні значення
списку дозволених URL-адрес кінцевих точок.

Результати перевірки прив’язки Gateway і команд Node потребують перевірки. Коли
`policy/gateway-non-loopback-bind` або `policy/gateway-node-command-denied`
можна зіставити зі шляхом конфігурації, `doctor --fix` повідомляє про запропоновану
зміну `gateway.bind` або `gateway.nodes.denyCommands` як пропущену рекомендацію
попереднього перегляду. Він не застосовує зміну, а результат перевірки не вважається
виправленим, доки оператор не перевірить і не оновить конфігурацію або політику.

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

## Коди завершення

| Команда          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | На заданому пороговому рівні результатів перевірки немає.                          | Один або кілька результатів перевірки досягли порогового рівня.                             | Помилка аргументів або виконання. |
| `policy compare` | Файл політики щонайменше такий самий суворий, як базовий. | Файл політики недійсний, відсутній або слабший за базові правила. | Помилка аргументів або виконання. |
| `policy watch`   | Результатів перевірки немає, а прийнятий хеш актуальний.              | Є результати перевірки або прийнята атестація застаріла.                    | Помилка аргументів або виконання. |

## Пов’язані матеріали

- [Режим перевірки Doctor](/uk/cli/doctor#lint-mode)
- [CLI шляхів](/uk/cli/path)
