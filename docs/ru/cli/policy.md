---
read_when:
    - Вы хотите проверить настройки OpenClaw по заданному файлу policy.jsonc
    - Вам нужны выводы по политикам в doctor lint
    - Вам нужен хэш аттестации политики для аудиторских доказательств
summary: Справочник CLI для проверок соответствия `openclaw policy`
title: Политика
x-i18n:
    generated_at: "2026-06-28T22:45:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` предоставляется встроенным Plugin Policy. Policy — это
корпоративный слой соответствия поверх существующих настроек OpenClaw. Он не добавляет
вторую систему конфигурации. `policy.jsonc` определяет заданные требования,
OpenClaw наблюдает активную рабочую область как доказательство, а проверки состояния политики
сообщают о расхождениях через `doctor --lint`. Итоговый сигнал соответствия — чистый
запуск `doctor --lint`; политика добавляет findings в эту общую поверхность lint
вместо создания отдельного шлюза состояния.

Policy сейчас управляет настроенными каналами, MCP-серверами, поставщиками моделей,
состоянием сетевой защиты от SSRF, состоянием доступа ingress/каналов, состоянием экспозиции Gateway, состоянием рабочей области агента,
состоянием обработки данных, состоянием поставщика секретов/профиля auth в конфигурации OpenClaw и управляемыми
объявлениями инструментов. Например, IT или оператор рабочей области может зафиксировать, что Telegram
не является одобренным поставщиком канала, ограничить MCP-серверы и ссылки на модели
одобренными записями, требовать, чтобы доступ fetch/browser к частной сети оставался
отключенным, требовать, чтобы изоляция сессий личных сообщений и состояние ingress каналов
оставались в проверенных пределах, требовать, чтобы bind/auth/HTTP-экспозиция Gateway оставалась в проверенных
пределах, требовать, чтобы доступ агента к рабочей области и запреты инструментов оставались в проверенном
состоянии, требовать, чтобы SecretRefs конфигурации OpenClaw использовали управляемых поставщиков, требовать,
чтобы профили auth конфигурации содержали метаданные поставщика/режима, требовать, чтобы управляемые инструменты
содержали метаданные риска и чувствительности, требовать редактирования чувствительного логирования, запрещать
захват содержимого телеметрии, требовать обслуживание срока хранения сессий, запрещать индексирование памяти
транскриптов сессий, а затем использовать `doctor --lint` как общий
шлюз соответствия.

Используйте policy, когда рабочей области нужно устойчивое утверждение вроде «эти каналы
не должны быть включены» или «управляемые инструменты должны объявлять метаданные одобрения», а также
повторяемый способ доказать, что OpenClaw по-прежнему соответствует этому утверждению. Используйте
только обычную конфигурацию и документацию рабочей области, когда вам нужно лишь локальное поведение и
не нужны findings политики или вывод аттестации.

## Быстрый старт

Включите встроенный Plugin Policy перед первым использованием:

```bash
openclaw plugins enable policy
```

Когда policy включена, doctor может загружать проверки состояния policy без активации
произвольных plugins. Plugin остается включенным, если `policy.jsonc` отсутствует, чтобы
doctor мог сообщить об отсутствующем артефакте.

Policy задается вручную, а не генерируется из текущих настроек пользователя. Минимальная
policy для каналов, MCP-серверов, поставщиков моделей, сетевого состояния, доступа ingress/каналов, экспозиции Gateway,
состояния рабочей области агента, состояния настроенной sandbox runtime, состояния обработки данных
OpenClaw, состояния поставщика секретов/профиля auth конфигурации, состояния файла одобрений exec
и метаданных инструментов выглядит так:

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

Правила являются источником истины. Блок категории — это только пространство имен; проверки выполняются
тогда, когда присутствует конкретное правило. OpenClaw читает текущие настройки `channels.*`,
`mcp.servers.*`, `models.providers.*`, выбранные ссылки на модели агентов, настройки сетевого SSRF,
область сессий личных сообщений, политику DM канала, групповую политику канала,
шлюзы упоминаний канала/группы, состояние bind/auth/Control UI/Tailscale/remote/HTTP Gateway,
состояние доступа рабочей области sandbox агента в конфигурации OpenClaw и запретов инструментов,
состояние конфигурации обработки данных, происхождение поставщика секретов
и SecretRef в конфигурации, метаданные профиля auth конфигурации, настроенное
глобальное/покомпонентное состояние инструментов агента и объявления `TOOLS.md` как доказательство, затем
сообщает о наблюдаемом состоянии, которое не соответствует требованиям. Если policy запрещает не-loopback
bind Gateway, опускайте `gateway.bind` только тогда, когда вы
готовы проверять runtime default; задайте `gateway.bind=loopback` для
строгого соответствия конфигурации. Для состояния агента только для чтения настройте режим sandbox
в применимых defaults или агенте и задайте `workspaceAccess` как `none` или
`ro`; опущенный или `off` режим sandbox не удовлетворяет policy read-only/no-write.
`agents.workspace.denyTools` поддерживает `exec`, `process`, `write`,
`edit` и `apply_patch`; конфигурация OpenClaw `group:fs` покрывает инструменты изменения файлов,
а `group:runtime` покрывает shell/process-инструменты. Policy состояния инструментов наблюдает
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` и те же переопределения на уровне агента
`agents.list[].tools.*`. Policy одобрений exec читает именованный
продуктовый артефакт `exec-approvals.json` только при наличии правила `execApprovals`;
доказательство фиксирует defaults, состояние на уровне агента и шаблоны allowlist
без socket tokens или текста последней использованной команды. Policy не принуждает вызовы инструментов
во время runtime. Доказательства секретов фиксируют
состояние поставщика/источника и метаданные SecretRef, но никогда не сырые значения секретов. Policy
не читает и не аттестует хранилища учетных данных на уровне агента, такие как `auth-profiles.json`;
эти хранилища остаются во владении существующих потоков auth и учетных данных.
Доказательства обработки данных — это только состояние на уровне конфигурации: они проверяют настроенный
режим редактирования, переключатели захвата содержимого телеметрии, режим обслуживания сессий и
настройки индексирования памяти транскриптов сессий. Они не проверяют сырые логи,
экспорты телеметрии, содержимое транскриптов, файлы памяти и не доказывают, что персональные
данные или секреты отсутствуют.

### Справочник правил policy

Каждое поле policy ниже необязательно. Проверка выполняется только тогда, когда соответствующее правило
присутствует в `policy.jsonc`. Наблюдаемое состояние — это существующая конфигурация OpenClaw или
метаданные рабочей области; policy сообщает о расхождениях, но не переписывает runtime-поведение,
если путь исправления не доступен явно и не включен.
Файлы policy строгие: неподдерживаемые секции или ключи правил сообщаются как
`policy/policy-jsonc-invalid`, а не игнорируются.

Оверлеи policy сохраняют широкие правила верхнего уровня глобальными, затем позволяют именованным блокам scope
добавлять более строгие обычные секции policy для явных селекторов. Имя scope — это
только описательная группа; сопоставление использует значения селектора внутри scope.
Оверлей аддитивен: глобальные утверждения продолжают выполняться, а scoped-утверждение может создать
собственный finding для той же наблюдаемой конфигурации.

#### Scoped-оверлеи

Используйте `scopes.<scopeName>`, когда одному набору агентов или каналов нужна более строгая
policy, чем базовый уровень верхнего уровня. Секции, scoped по агентам, используют `agentIds`, который
поддерживает `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`
и `execApprovals.*`. Ingress, scoped по каналам,
использует `channelIds`, который поддерживает `ingress.channels.*`. Неподдерживаемые
секции отклоняются, а не игнорируются. Если запись `agentIds` отсутствует
в `agents.list[]`, OpenClaw оценивает scoped-правило относительно унаследованного
глобального/default-состояния для этого runtime agent id.

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

Один и тот же агент может присутствовать в нескольких scopes, когда каждый scope управляет разными
полями, как показано выше. Повторяющееся scoped-поле для одного и того же агента должно быть
столь же или более ограничительным согласно метаданным policy; более слабые дублирующиеся
утверждения отклоняются. Метаданные строгости трактуют allow-lists как подмножества,
deny-lists как надмножества, а обязательные булевы значения как фиксированные требования.

Policy состояния контейнеров оценивается только по доказательствам, которые OpenClaw может
наблюдать для сопоставленного агента. Если включенное правило `sandbox.containers.*` применяется
к агенту, чей backend sandbox не может предоставить это поле, policy сообщает
`policy/sandbox-container-posture-unobservable` вместо того, чтобы считать утверждение
выполненным. Используйте отдельные scopes `agentIds` для групп агентов, которые используют разные
backends sandbox, и оставляйте неподдерживаемые правила контейнеров неустановленными или false для
групп, где эти поля нельзя наблюдать.

`ingress.session.requireDmScope` верхнего уровня остается глобальным, потому что
`session.dmScope` не является доказательством, атрибутируемым каналу.

| Селектор     | Поддерживаемые разделы                                                            | Когда использовать                                         |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` и `execApprovals` | Одному или нескольким runtime-агентам нужны более строгие правила. |
| `channelIds` | `ingress.channels`                                                                 | Одному или нескольким каналам нужны более строгие правила входящего трафика. |

Каждая область действия, присутствующая в `policy.jsonc`, должна быть допустимой и принудительно применимой.

#### Каналы

| Поле политики                      | Наблюдаемое состояние                  | Когда использовать                                        |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Провайдер `channels.*` и состояние включения | Запретить настроенные каналы от провайдера, например `telegram`. |
| `channels.denyRules[].reason`        | Сообщение о находке и контекст подсказки по исправлению | Объяснить, почему провайдер запрещен.                       |

#### MCP-серверы

| Поле политики       | Наблюдаемое состояние | Когда использовать                                      |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | id `mcp.servers.*` | Требовать, чтобы каждый настроенный MCP-сервер был в списке разрешенных. |
| `mcp.servers.deny`  | id `mcp.servers.*` | Запретить конкретные id настроенных MCP-серверов.          |

#### Провайдеры моделей

| Поле политики            | Наблюдаемое состояние                             | Когда использовать                                                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | id `models.providers.*` и выбранные ссылки на модели | Требовать, чтобы настроенные провайдеры и выбранные ссылки на модели использовали одобренных провайдеров. |
| `models.providers.deny`  | id `models.providers.*` и выбранные ссылки на модели | Запретить настроенных провайдеров и выбранные ссылки на модели по id провайдера. |

#### Сеть

| Поле политики                  | Наблюдаемое состояние                  | Когда использовать                                               |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Лазейки обхода SSRF для частной сети | Установите `false`, чтобы требовать, чтобы доступ к частной сети оставался отключенным. |

#### Входящий трафик и доступ к каналам

| Поле политики                             | Наблюдаемое состояние                                      | Когда использовать                                               |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Требовать проверенную область изоляции личных сообщений.          |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` и устаревшие поля политики DM канала      | Разрешать только проверенные политики каналов для личных сообщений. |
| `ingress.channels.denyOpenGroups`         | Политика входящего трафика канала, аккаунта и группы           | Запретить открытый входящий трафик групп для настроенных каналов и аккаунтов. |
| `ingress.channels.requireMentionInGroups` | Конфигурация шлюза упоминаний для канала, аккаунта, группы, guild и вложенных упоминаний | Требовать шлюзы упоминаний, когда входящий трафик групп открыт или ограничен упоминаниями. |

#### Gateway

| Поле политики                           | Наблюдаемое состояние                         | Когда использовать                                        |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Установите `false`, чтобы требовать привязку Gateway к loopback. |
| `gateway.exposure.allowTailscaleFunnel` | Положение Tailscale serve/funnel для Gateway   | Установите `false`, чтобы запретить экспонирование Tailscale Funnel. |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Установите `true`, чтобы отклонять отключенную аутентификацию Gateway. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Установите `true`, чтобы требовать явную конфигурацию лимита скорости аутентификации. |
| `gateway.controlUi.allowInsecure`       | Небезопасные переключатели аутентификации/устройства/origin для Control UI | Установите `false`, чтобы запретить небезопасные переключатели экспонирования Control UI. |
| `gateway.remote.allow`                  | Режим/конфигурация удаленного Gateway          | Установите `false`, чтобы запретить режим удаленного Gateway. |
| `gateway.http.denyEndpoints`            | Конечные точки HTTP API Gateway                | Запретить id конечных точек, такие как `chatCompletions` или `responses`. |
| `gateway.http.requireUrlAllowlists`     | Входные данные URL-fetch Gateway HTTP          | Установите `true`, чтобы требовать списки разрешенных URL для входных данных URL-fetch. |

#### Рабочее пространство агента

| Поле политики                    | Наблюдаемое состояние                                                                 | Когда использовать                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` и `agents.list[].sandbox.workspaceAccess` | Разрешать только значения доступа к рабочему пространству песочницы, такие как `none` или `ro`.                    |
| `agents.workspace.denyTools`     | Глобальная и поагентная конфигурация запрета инструментов                            | Требовать запрета инструментов изменения рабочего пространства/runtime, таких как `exec`, `process`, `write`, `edit` или `apply_patch`. |

#### Положение песочницы

| Поле политики                                         | Наблюдаемое состояние                                  | Когда использовать                                             |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` и поагентный режим       | Разрешать только проверенные режимы песочницы, такие как `all` или `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` и поагентный backend | Разрешать только проверенные backend песочницы, такие как `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Сетевой режим песочницы/браузера на базе контейнера     | Запретить сетевой режим хоста.                                |
| `sandbox.containers.denyContainerNamespaceJoin`       | Сетевой режим песочницы/браузера на базе контейнера     | Запретить присоединение к пространству имен сети другого контейнера. |
| `sandbox.containers.requireReadOnlyMounts`            | Режим монтирования песочницы/браузера на базе контейнера | Требовать, чтобы точки монтирования были только для чтения.    |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Цели монтирования песочницы/браузера на базе контейнера | Запретить монтирование сокетов runtime контейнеров.            |
| `sandbox.containers.denyUnconfinedProfiles`           | Положение профиля безопасности контейнера               | Запретить неограниченные профили безопасности контейнера.      |
| `sandbox.browser.requireCdpSourceRange`               | Диапазон источника CDP браузера песочницы               | Требовать, чтобы экспонирование CDP браузера объявляло диапазон источника. |

Политика трактует отсутствующий `sandbox.mode` как неявное значение по умолчанию `off`, поэтому
`sandbox.requireMode` сообщает о новой или ненастроенной песочнице как находящейся вне
списка разрешенных, например `["all"]`.

#### Обработка данных

| Поле политики                                       | Наблюдаемое состояние                                                              | Когда использовать                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Установите `true`, чтобы отклонять `logging.redactSensitive: "off"`. |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Установите `true`, чтобы отклонять захват содержимого телеметрией.    |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Установите `true`, чтобы требовать эффективный режим обслуживания сеансов `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` и `agents.*.memorySearch.experimental.sessionMemory` | Установите `true`, чтобы отклонять индексацию стенограмм сеансов в память. |

#### Секреты

| Поле политики                     | Наблюдаемое состояние                                      | Когда использовать                                                     |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs и объявления `secrets.providers.*` | Установите `true`, чтобы требовать, чтобы SecretRefs указывали на объявленных провайдеров. |
| `secrets.denySources`             | Источники провайдеров секретов и источники SecretRef      | Запретить источники, такие как `exec`, `file` или другое настроенное имя источника. |
| `secrets.allowInsecureProviders`  | Флаги небезопасного положения провайдера секретов         | Установите `false`, чтобы отклонять провайдеров, которые явно выбирают небезопасное положение. |

#### Подтверждения exec

Политика подтверждений exec наблюдает активный runtime-артефакт `exec-approvals.json`.
По умолчанию это `~/.openclaw/exec-approvals.json`; когда задан
`OPENCLAW_STATE_DIR`, Policy читает
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Фактические правила положения, такие как
`execApprovals.defaults.*` или `execApprovals.agents.*`, требуют читаемых
доказательств из артефакта; отсутствующий или недопустимый артефакт сообщается как ненаблюдаемое доказательство,
а не становится best-effort прохождением проверки относительно синтетических runtime-значений по умолчанию. После того как
артефакт становится читаемым, пропущенные поля подтверждений наследуют runtime-значения по умолчанию: отсутствующее
`defaults.security` равно `full`, а отсутствующая безопасность агента наследует это
значение по умолчанию. Доказательства включают `defaults`, `agents.*` и
`agents.*.allowlist[].pattern`, а также необязательный `argPattern`, эффективное
положение `autoAllowSkills` и источник записи. Они не включают путь
сокета/токен, `commandText`, `lastUsedCommand`, разрешенные пути или метки времени.

| Поле политики                              | Наблюдаемое состояние                                                                  | Когда использовать                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Путь активного runtime-артефакта `exec-approvals.json`                                 | Установите `true`, чтобы требовать существования и разбора артефакта подтверждений.     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, по умолчанию `full`                                               | Разрешать только утвержденные режимы безопасности подтверждений по умолчанию.           |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, наследует значения по умолчанию                                   | Разрешать только утвержденные эффективные режимы безопасности подтверждений для агента. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` и `agents.*.autoAllowSkills`, наследуют runtime defaults    | Установите `false`, чтобы требовать строгие ручные allowlist без неявного подтверждения CLI Skills. |
| `execApprovals.agents.allowlist.expected`   | Совокупность шаблона `agents.*.allowlist[]` и необязательных записей argPattern        | Требовать, чтобы allowlist подтверждений совпадал с проверенным набором шаблонов.       |

Например, требуйте артефакт подтверждений, запрещайте разрешающие значения по
умолчанию и разрешайте только проверенную позицию подтверждения exec для
выбранных агентов:

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

#### Профили аутентификации

| Поле политики                  | Наблюдаемое состояние                         | Когда использовать                                                                        |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Метаданные провайдера и режима `auth.profiles.*` | Требовать ключи метаданных, такие как `provider` и `mode`, в профилях аутентификации config. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Разрешать только поддерживаемые режимы профиля аутентификации, такие как `api_key`, `aws-sdk`, `oauth` или `token`. |

#### Метаданные инструментов

| Поле политики          | Наблюдаемое состояние              | Когда использовать                                                                        |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Управляемые объявления `TOOLS.md` | Требовать, чтобы управляемые инструменты объявляли ключи метаданных, такие как `risk`, `sensitivity` или `owner`. |

#### Позиция инструментов

| Поле политики                  | Наблюдаемое состояние                                      | Когда использовать                                                                                   |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` и `agents.list[].tools.profile`             | Разрешать только ids профилей инструментов, такие как `minimal`, `messaging` или `coding`.             |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` и переопределения `tools.fs` для агента | Установите `true`, чтобы требовать позицию filesystem-инструмента только в пределах workspace.          |
| `tools.exec.allowSecurity`      | `tools.exec.security` и безопасность exec для агента        | Разрешать только режимы безопасности exec, такие как `deny` или `allowlist`.                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` и режим запроса exec для агента            | Требовать позицию подтверждения, например `always`.                                                     |
| `tools.exec.allowHosts`         | `tools.exec.host` и маршрутизация exec host для агента      | Разрешать только режимы маршрутизации exec host, такие как `sandbox`.                                   |
| `tools.elevated.allow`          | `tools.elevated.enabled` и elevated-позиция для агента      | Установите `false`, чтобы требовать, чтобы elevated-режим инструмента оставался отключенным.            |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` и `tools.alsoAllow` для агента            | Требовать точные записи `alsoAllow` и сообщать об отсутствующих или неожиданных дополнительных разрешениях инструментов. |
| `tools.denyTools`               | `tools.deny` и `agents.list[].tools.deny`                   | Требовать, чтобы настроенные списки запрета инструментов включали ids или группы инструментов, такие как `group:runtime` и `group:fs`. |

Запускайте проверки только политики во время авторинга:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` запускает только набор проверок политики и выводит доказательства,
findings и хэши аттестации. Те же findings также появляются в
`openclaw doctor --lint`, когда Policy plugin включен.

Сравните файл политики оператора с authored baseline-файлом политики:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` сравнивает синтаксис файла политики с синтаксисом файла
политики. Он не проверяет runtime-состояние OpenClaw, доказательства, учетные
данные или секреты. Команда использует те же метаданные правил политики, которые
управляют scoped overlays: allowlist должны оставаться равными или более узкими,
denylist должны оставаться равными или более широкими, обязательные булевы
значения должны сохранять требуемое значение, упорядоченные строки должны
смещаться только к более ограничительному концу настроенного порядка, а точные
списки должны совпадать.

Файл baseline может быть политикой, authored организацией. Проверяемая политика
может использовать более строгие значения или добавлять дополнительные правила
политики. Проверяемое правило верхнего уровня также может удовлетворять scoped
baseline-правилу, когда оно столь же или более ограничительное, потому что
политика верхнего уровня применяется широко. Имена scope не обязаны совпадать;
scoped-сравнение привязано к значению селектора, такому как `agentIds` или
`channelIds`, и к проверяемому полю политики.

Пример чистого JSON-вывода compare сообщает только состояние сравнения файлов
политики:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Пример чистого вывода `policy check --json` включает стабильные хэши, которые
оператор или supervisor может записать:

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

## Настройка политики

Конфигурация политики находится в `plugins.entries.policy.config`.

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

| Настройка                 | Назначение                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Включить проверки политики даже до появления `policy.jsonc`.    |
| `workspaceRepairs`        | Разрешить `doctor --fix` редактировать управляемые политикой настройки workspace. |
| `expectedHash`            | Необязательная hash-lock для утвержденного артефакта политики. |
| `expectedAttestationHash` | Необязательная hash-lock для последней принятой чистой проверки политики. |
| `path`                    | Расположение артефакта политики относительно workspace.         |

Установите `plugins.entries.policy.config.enabled` в `false`, чтобы отключить
проверки политики для workspace, оставив Plugin установленным.

Требования к метаданным инструментов authored в `policy.jsonc` с помощью
`tools.requireMetadata`, например `["risk", "sensitivity", "owner"]`.

## Принятие состояния политики

Пример JSON-вывода:

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

Хеш политики идентифицирует созданный артефакт правил. Блок доказательств
записывает наблюдаемое состояние OpenClaw, использованное проверками политики. Значение
`workspace.hash` идентифицирует эту полезную нагрузку доказательств для проверенной области.
Хеш находок идентифицирует точный набор находок, возвращенный проверкой.
`checkedAt` фиксирует время выполнения оценки. Хеш аттестации идентифицирует
стабильное утверждение: хеш политики, хеш доказательств, хеш находок и то,
был ли результат чистым. Он намеренно не включает `checkedAt`, поэтому одно и то же
состояние политики создает одну и ту же аттестацию при повторных проверках. Вместе
они образуют аудиторский кортеж для этой проверки политики.

Если позже Gateway или супервизор использует политику, чтобы блокировать, одобрять или аннотировать
действие во время выполнения, он должен записывать хеш аттестации из последней чистой проверки политики.
`checkedAt` остается в выводе JSON для журналов аудита, но не является частью
стабильного хеша аттестации.

Используйте этот жизненный цикл при принятии состояния политики:

1. Создайте или проверьте `policy.jsonc`.
2. Запустите `openclaw policy check --json`.
3. Если результат чистый, запишите `attestation.policy.hash` как `expectedHash`.
4. Запишите `attestation.attestationHash` как `expectedAttestationHash`.
5. Повторно запустите `openclaw doctor --lint` в CI или релизных шлюзах.

Если правила политики намеренно изменяются, обновите оба принятых хеша из чистой
проверки. Если настройки рабочей области намеренно изменяются, но политика остается прежней,
обычно изменяется только `expectedAttestationHash`.

Включение или обновление правил `agents.workspace` добавляет доказательство `agentWorkspace` в
хеш рабочей области и хеш аттестации. Операторам следует проверить новое
доказательство и обновить принятые хеши аттестации после включения этих правил.
Включение или обновление правил состояния инструментов добавляет доказательство `toolPosture` тем же
образом.

`openclaw policy watch` многократно выполняет ту же проверку и сообщает, когда
текущие доказательства больше не соответствуют `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Используйте `--once` в CI или скриптах, которым нужна только одна оценка дрейфа. Без
`--once` команда по умолчанию опрашивает каждые две секунды; используйте `--interval-ms`, чтобы
выбрать другой интервал.

## Находки

Политика сейчас проверяет:

| ID проверки | Находка |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing` | Политика включена, но `policy.jsonc` отсутствует. |
| `policy/policy-jsonc-invalid` | Политику не удается разобрать или она содержит некорректные записи правил. |
| `policy/policy-hash-mismatch` | Политика не соответствует настроенному `expectedHash`. |
| `policy/attestation-hash-mismatch` | Текущие доказательства политики больше не соответствуют принятой аттестации. |
| `policy/policy-conformance-invalid` | Базовый или проверяемый файл политики содержит недопустимый синтаксис сравнения. |
| `policy/policy-conformance-missing` | В проверяемом файле политики отсутствует правило, требуемое базовым файлом политики. |
| `policy/policy-conformance-weaker` | В проверяемом файле политики значение слабее, чем в базовом файле политики. |
| `policy/channels-denied-provider` | Включенный канал соответствует правилу запрета канала. |
| `policy/mcp-denied-server` | Настроенный MCP-сервер запрещен политикой. |
| `policy/mcp-unapproved-server` | Настроенный MCP-сервер находится вне списка разрешений. |
| `policy/models-denied-provider` | Настроенный поставщик моделей или ссылка на модель использует запрещенного поставщика. |
| `policy/models-unapproved-provider` | Настроенный поставщик моделей или ссылка на модель находится вне списка разрешений. |
| `policy/network-private-access-enabled` | Обход SSRF для частной сети включен, хотя политика запрещает его. |
| `policy/ingress-dm-policy-unapproved` | Политика личных сообщений канала находится вне списка разрешений политики. |
| `policy/ingress-dm-scope-unapproved` | `session.dmScope` не соответствует области изоляции личных сообщений, требуемой политикой. |
| `policy/ingress-open-groups-denied` | Политика группы канала имеет значение `open`, хотя политика запрещает входящий доступ для открытых групп. |
| `policy/ingress-group-mention-required` | Запись канала или группы отключает шлюзы упоминаний, хотя политика требует их. |
| `policy/gateway-non-loopback-bind` | Состояние привязки Gateway допускает доступ не через loopback, хотя политика запрещает его. |
| `policy/gateway-auth-disabled` | Аутентификация Gateway отключена, хотя политика требует аутентификацию. |
| `policy/gateway-rate-limit-missing` | Состояние ограничения частоты для аутентификации Gateway не задано явно, хотя политика требует этого. |
| `policy/gateway-control-ui-insecure` | Включены переключатели небезопасного доступа к Gateway Control UI. |
| `policy/gateway-tailscale-funnel` | Доступ через Gateway Tailscale Funnel включен, хотя политика запрещает его. |
| `policy/gateway-remote-enabled` | Удаленный режим Gateway активен, хотя политика запрещает его. |
| `policy/gateway-http-endpoint-enabled` | HTTP API endpoint Gateway включен, хотя он запрещен политикой. |
| `policy/gateway-http-url-fetch-unrestricted` | Ввод URL-fetch Gateway HTTP не имеет требуемого списка разрешенных URL. |
| `policy/agents-workspace-access-denied` | Режим песочницы агента или доступ к рабочей области находится вне списка разрешений политики. |
| `policy/agents-tool-not-denied` | Агент или конфигурация по умолчанию не запрещает инструмент, требуемый политикой. |
| `policy/tools-profile-unapproved` | Настроенный глобальный или агентский профиль инструментов находится вне списка разрешений. |
| `policy/tools-fs-workspace-only-required` | Инструменты файловой системы не настроены на состояние путей только в рабочей области. |
| `policy/tools-exec-security-unapproved` | Режим безопасности exec находится вне списка разрешений политики. |
| `policy/tools-exec-ask-unapproved` | Режим запроса exec находится вне списка разрешений политики. |
| `policy/tools-exec-host-unapproved` | Маршрутизация хоста exec находится вне списка разрешений политики. |
| `policy/tools-elevated-enabled` | Повышенный режим инструмента включен, хотя политика запрещает его. |
| `policy/tools-also-allow-missing` | В настроенном списке `alsoAllow` отсутствует запись, требуемая политикой. |
| `policy/tools-also-allow-unexpected` | Настроенный список `alsoAllow` включает запись, не ожидаемую политикой. |
| `policy/tools-required-deny-missing` | Глобальный или агентский список запрета инструментов не включает обязательный запрещенный инструмент. |
| `policy/sandbox-mode-unapproved` | Режим песочницы находится вне списка разрешений политики. |
| `policy/sandbox-backend-unapproved` | Бэкенд песочницы находится вне списка разрешений политики. |
| `policy/sandbox-container-posture-unobservable` | Правило состояния контейнера включено для бэкенда, который не может его наблюдать. |
| `policy/sandbox-container-host-network-denied` | Песочница или браузер на базе контейнера использует режим сети хоста. |
| `policy/sandbox-container-namespace-join-denied` | Песочница или браузер на базе контейнера присоединяется к пространству имен другого контейнера. |
| `policy/sandbox-container-mount-mode-required` | Монтирование песочницы или браузера на базе контейнера не является доступным только для чтения. |
| `policy/sandbox-container-runtime-socket-mount` | Монтирование песочницы или браузера на базе контейнера открывает сокет среды выполнения контейнера. |
| `policy/sandbox-container-unconfined-profile` | Профиль контейнерной песочницы является неограниченным, хотя политика запрещает это. |
| `policy/sandbox-browser-cdp-source-range-missing` | Диапазон источника CDP браузера песочницы отсутствует, хотя политика требует его. |
| `policy/data-handling-redaction-disabled` | Редактирование чувствительных данных в журналах отключено, хотя политика требует его. |
| `policy/data-handling-telemetry-content-capture` | Захват содержимого телеметрии включен, хотя политика запрещает его. |
| `policy/data-handling-session-retention-not-enforced` | Обслуживание срока хранения сеансов не применяется, хотя политика требует его. |
| `policy/data-handling-session-transcript-memory-enabled` | Индексация памяти расшифровок сеансов включена, хотя политика запрещает ее. |
| `policy/secrets-unmanaged-provider` | Config SecretRef ссылается на поставщика, не объявленного в `secrets.providers`. |
| `policy/secrets-denied-provider-source` | Поставщик секретов конфигурации или SecretRef использует источник, запрещенный политикой. |
| `policy/secrets-insecure-provider` | Поставщик секретов выбирает небезопасное состояние, хотя политика запрещает его. |
| `policy/auth-profile-invalid-metadata` | В профиле аутентификации конфигурации отсутствуют корректные метаданные поставщика или режима. |
| `policy/auth-profile-unapproved-mode` | Режим профиля аутентификации конфигурации находится вне списка разрешений политики. |
| `policy/exec-approvals-missing` | Политика требует `exec-approvals.json`, но артефакт отсутствует. |
| `policy/exec-approvals-invalid` | Настроенный артефакт утверждений exec не удается разобрать. |
| `policy/exec-approvals-default-security-unapproved` | Значения утверждений exec по умолчанию используют режим безопасности вне списка разрешений политики. |
| `policy/exec-approvals-agent-security-unapproved` | Эффективный режим безопасности утверждения exec для агента находится вне списка разрешений. |
| `policy/exec-approvals-auto-allow-skills-enabled` | Агент утверждения exec неявно автоматически разрешает CLI Skills, хотя политика запрещает это. |
| `policy/exec-approvals-allowlist-missing` | В списке разрешений утверждений отсутствует шаблон, требуемый политикой. |
| `policy/exec-approvals-allowlist-unexpected` | Список разрешений утверждений включает шаблон, не ожидаемый политикой. |
| `policy/tools-missing-risk-level` | В управляемом объявлении инструмента отсутствуют метаданные риска. |
| `policy/tools-unknown-risk-level` | Управляемое объявление инструмента использует неизвестное значение риска. |
| `policy/tools-missing-sensitivity-token` | В управляемом объявлении инструмента отсутствуют метаданные чувствительности. |
| `policy/tools-missing-owner` | В управляемом объявлении инструмента отсутствуют метаданные владельца. |
| `policy/tools-unknown-sensitivity-token` | Управляемое объявление инструмента использует неизвестное значение чувствительности. |

Находки политики могут включать и `target`, и `requirement`. `target` — это
наблюдаемый объект рабочей области, который не соответствует требованиям. `requirement` — это созданное
правило политики, из-за которого он стал находкой. Сегодня оба значения являются адресами, обычно
путями `oc://`, но имена полей описывают их роль в политике, а не
формат адреса.

Пример JSON-находки:

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

Пример находки инструмента:

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

Пример MCP-находки:

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

Пример находки поставщика модели:

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

Пример сетевой находки:

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

Пример обнаружения раскрытия Gateway:

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

Пример обнаружения рабочей области агента:

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

## Исправление

`doctor --lint` и `policy check` доступны только для чтения.

`doctor --fix` изменяет управляемые политиками настройки рабочей области только тогда, когда
`workspaceRepairs` явно включен. Без этого явного согласия проверки политик
сообщают, что они бы исправили, и оставляют настройки без изменений.

В этой версии исправление может отключать каналы, которые включены в конфигурации OpenClaw,
но запрещены `channels.denyRules`. Включайте `workspaceRepairs` только после
проверки файла политики, потому что корректное правило запрета может отключить
настроенный канал:

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

## Коды выхода

| Команда          | `0`                                                    | `1`                                                                 | `2`                                 |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------- |
| `policy check`   | Нет находок на пороге.                                 | Одна или несколько находок достигли порога.                         | Ошибка аргументов или выполнения.   |
| `policy compare` | Файл политики не менее строгий, чем базовый уровень.   | Файл политики недействителен, отсутствует или слабее базовых правил. | Ошибка аргументов или выполнения.   |
| `policy watch`   | Нет находок, и принятый хэш актуален.                  | Находки существуют или принятое свидетельство устарело.             | Ошибка аргументов или выполнения.   |

## См. также

- [Режим lint для Doctor](/ru/cli/doctor#lint-mode)
- [CLI Path](/ru/cli/path)
