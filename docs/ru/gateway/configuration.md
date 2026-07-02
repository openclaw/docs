---
read_when:
    - Настройка OpenClaw в первый раз
    - Поиск распространенных шаблонов конфигурации
    - Переход к определенным разделам конфигурации
summary: 'Обзор конфигурации: распространенные задачи, быстрая настройка и ссылки на полный справочник'
title: Конфигурация
x-i18n:
    generated_at: "2026-07-02T08:42:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читает необязательную конфигурацию <Tooltip tip="JSON5 поддерживает комментарии и завершающие запятые">**JSON5**</Tooltip> из `~/.openclaw/openclaw.json`.
Активный путь конфигурации должен быть обычным файлом. Макеты `openclaw.json`
с символическими ссылками не поддерживаются для записей, которыми владеет OpenClaw; атомарная запись может заменить
путь вместо сохранения символической ссылки. Если вы храните конфигурацию вне
каталога состояния по умолчанию, укажите `OPENCLAW_CONFIG_PATH` напрямую на реальный файл.

Если файл отсутствует, OpenClaw использует безопасные значения по умолчанию. Частые причины добавить конфигурацию:

- Подключить каналы и управлять тем, кто может писать боту
- Настроить модели, инструменты, изоляцию или автоматизацию (cron, хуки)
- Настроить сеансы, медиа, сеть или UI

См. [полный справочник](/ru/gateway/configuration-reference) для всех доступных полей.

Агенты и автоматизация должны использовать `config.schema.lookup` для точной документации
на уровне полей перед редактированием конфигурации. Используйте эту страницу для практических рекомендаций
и [справочник конфигурации](/ru/gateway/configuration-reference) для более широкой
карты полей и значений по умолчанию.

<Tip>
**Впервые настраиваете конфигурацию?** Начните с `openclaw onboard` для интерактивной настройки или посмотрите руководство [примеры конфигурации](/ru/gateway/configuration-examples) с готовыми конфигурациями для копирования и вставки.
</Tip>

## Минимальная конфигурация

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Редактирование конфигурации

<Tabs>
  <Tab title="Интерактивный мастер">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (однострочные команды)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI управления">
    Откройте [http://127.0.0.1:18789](http://127.0.0.1:18789) и используйте вкладку **Конфигурация**.
    UI управления отображает форму из актуальной схемы конфигурации, включая
    метаданные документации полей `title` / `description`, а также схемы Plugin и каналов, когда
    они доступны, с редактором **Raw JSON** как запасным вариантом. Для UI
    с детализацией и других инструментов Gateway также предоставляет `config.schema.lookup`, чтобы
    получить один узел схемы для заданного пути плюс сводки непосредственных дочерних элементов.
  </Tab>
  <Tab title="Прямое редактирование">
    Редактируйте `~/.openclaw/openclaw.json` напрямую. Gateway отслеживает файл и применяет изменения автоматически (см. [горячую перезагрузку](#config-hot-reload)).
  </Tab>
</Tabs>

## Строгая валидация

<Warning>
OpenClaw принимает только конфигурации, которые полностью соответствуют схеме. Неизвестные ключи, некорректные типы или недопустимые значения приводят к тому, что Gateway **откажется запускаться**. Единственное исключение на корневом уровне — `$schema` (строка), чтобы редакторы могли подключать метаданные JSON Schema.
</Warning>

`openclaw config schema` выводит каноническую JSON Schema, используемую UI управления
и валидацией. `config.schema.lookup` получает один узел для заданного пути плюс
сводки дочерних элементов для инструментов с детализацией. Метаданные документации полей `title`/`description`
передаются через вложенные объекты, wildcard (`*`), элементы массива (`[]`) и ветви `anyOf`/
`oneOf`/`allOf`. Схемы Runtime Plugin и каналов объединяются, когда
загружен реестр манифестов.

Когда валидация завершается неудачно:

- Gateway не загружается
- Работают только диагностические команды (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустите `openclaw doctor`, чтобы увидеть точные проблемы
- Запустите `openclaw doctor --fix` (или `--yes`), чтобы применить исправления

Gateway сохраняет доверенную последнюю корректную копию после каждого успешного запуска,
но запуск и горячая перезагрузка не восстанавливают ее автоматически. Если `openclaw.json`
не проходит валидацию (включая локальную валидацию Plugin), запуск Gateway завершается неудачно или
перезагрузка пропускается, а текущий Runtime сохраняет последнюю принятую конфигурацию.
Запустите `openclaw doctor --fix` (или `--yes`), чтобы исправить конфигурацию с префиксом/перезаписью или
восстановить последнюю корректную копию. Продвижение в последнюю корректную копию пропускается, когда
кандидат содержит отредактированные заполнители секретов, такие как `***`.

## Типовые задачи

<AccordionGroup>
  <Accordion title="Настроить канал (WhatsApp, Telegram, Discord и т. д.)">
    У каждого канала есть собственный раздел конфигурации в `channels.<provider>`. См. страницу конкретного канала для шагов настройки:

    - [WhatsApp](/ru/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/ru/channels/telegram) - `channels.telegram`
    - [Discord](/ru/channels/discord) - `channels.discord`
    - [Feishu](/ru/channels/feishu) - `channels.feishu`
    - [Google Chat](/ru/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/ru/channels/msteams) - `channels.msteams`
    - [Slack](/ru/channels/slack) - `channels.slack`
    - [Signal](/ru/channels/signal) - `channels.signal`
    - [iMessage](/ru/channels/imessage) - `channels.imessage`
    - [Mattermost](/ru/channels/mattermost) - `channels.mattermost`

    Все каналы используют один и тот же шаблон политики личных сообщений:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Выбрать и настроить модели">
    Задайте основную модель и необязательные резервные варианты:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` определяет каталог моделей и работает как список разрешенных моделей для `/model`; записи `provider/*` фильтруют `/model`, `/models` и средства выбора моделей по выбранным провайдерам, при этом продолжая использовать динамическое обнаружение моделей.
    - Используйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, чтобы добавить записи в список разрешенных моделей без удаления существующих моделей. Обычные замены, которые удалили бы записи, отклоняются, если не передать `--replace`.
    - Ссылки на модели используют формат `provider/model` (например, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` управляет уменьшением изображений в транскриптах/инструментах (по умолчанию `1200`); более низкие значения обычно уменьшают использование vision-токенов в запусках с большим количеством скриншотов.
    - См. [CLI моделей](/ru/concepts/models) для переключения моделей в чате и [аварийное переключение модели](/ru/concepts/model-failover) для ротации авторизации и поведения резервных вариантов.
    - Для пользовательских/самостоятельно размещенных провайдеров см. [пользовательские провайдеры](/ru/gateway/config-tools#custom-providers-and-base-urls) в справочнике.

  </Accordion>

  <Accordion title="Управлять тем, кто может писать боту">
    Доступ к личным сообщениям управляется для каждого канала через `dmPolicy`:

    - `"pairing"` (по умолчанию): неизвестные отправители получают одноразовый код сопряжения для подтверждения
    - `"allowlist"`: только отправители в `allowFrom` (или в сопряженном хранилище разрешений)
    - `"open"`: разрешить все входящие личные сообщения (требует `allowFrom: ["*"]`)
    - `"disabled"`: игнорировать все личные сообщения

    Для групп используйте `groupPolicy` + `groupAllowFrom` или списки разрешений, специфичные для канала.

    См. [полный справочник](/ru/gateway/config-channels#dm-and-group-access) для сведений по каждому каналу.

  </Accordion>

  <Accordion title="Настроить фильтрацию упоминаний в групповых чатах">
    Групповые сообщения по умолчанию **требуют упоминания**. Настройте шаблоны срабатывания для каждого агента. Обычные ответы в группах/каналах публикуются автоматически; включите путь инструмента сообщений для общих комнат, где агент должен решать, когда говорить:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Упоминания из метаданных**: нативные @-упоминания (WhatsApp tap-to-mention, Telegram @bot и т. д.)
    - **Текстовые шаблоны**: безопасные regex-шаблоны в `mentionPatterns`
    - **Видимые ответы**: `messages.visibleReplies` может требовать отправки через инструмент сообщений глобально; `messages.groupChat.visibleReplies` переопределяет это для групп/каналов.
    - См. [полный справочник](/ru/gateway/config-channels#group-chat-mention-gating) для режимов видимых ответов, переопределений по каналам и режима чата с самим собой.

  </Accordion>

  <Accordion title="Ограничить Skills для каждого агента">
    Используйте `agents.defaults.skills` для общей базовой настройки, затем переопределяйте конкретных
    агентов с помощью `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Не задавайте `agents.defaults.skills`, чтобы Skills по умолчанию были без ограничений.
    - Не задавайте `agents.list[].skills`, чтобы наследовать значения по умолчанию.
    - Установите `agents.list[].skills: []`, чтобы отключить Skills.
    - См. [Skills](/ru/tools/skills), [конфигурацию Skills](/ru/tools/skills-config) и
      [справочник конфигурации](/ru/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Настроить мониторинг состояния каналов Gateway">
    Управляйте тем, насколько активно Gateway перезапускает каналы, которые выглядят зависшими:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Установите `gateway.channelHealthCheckMinutes: 0`, чтобы глобально отключить перезапуски мониторинга состояния.
    - `channelStaleEventThresholdMinutes` должен быть больше или равен интервалу проверки.
    - Используйте `channels.<provider>.healthMonitor.enabled` или `channels.<provider>.accounts.<id>.healthMonitor.enabled`, чтобы отключить автоматические перезапуски для одного канала или учетной записи без отключения глобального монитора.
    - См. [проверки состояния](/ru/gateway/health) для операционной отладки и [полный справочник](/ru/gateway/configuration-reference#gateway) для всех полей.

  </Accordion>

  <Accordion title="Настроить тайм-аут рукопожатия WebSocket Gateway">
    Дайте локальным клиентам больше времени, чтобы завершить pre-auth рукопожатие WebSocket на
    нагруженных или маломощных хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Значение по умолчанию — `15000` миллисекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` по-прежнему имеет приоритет для разовых переопределений службы или оболочки.
    - Сначала предпочтительно исправить задержки запуска/цикла событий; этот параметр предназначен для хостов, которые исправны, но медленны во время прогрева.

  </Accordion>

  <Accordion title="Настроить сеансы и сбросы">
    Сеансы управляют непрерывностью и изоляцией разговоров:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
```

    - `dmScope`: `main` (общая) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальные значения по умолчанию для маршрутизации сеансов, привязанных к тредам (Discord поддерживает `/focus`, `/unfocus`, `/agents`, `/session idle` и `/session max-age`).
    - См. [Управление сеансами](/ru/concepts/session) для областей действия, связей идентичностей и политики отправки.
    - См. [полный справочник](/ru/gateway/config-agents#session) для всех полей.

  </Accordion>

  <Accordion title="Включение изоляции в песочнице">
    Запускайте сеансы агентов в изолированных средах выполнения песочницы:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Сначала соберите образ: из исходного checkout запустите `scripts/sandbox-setup.sh`, а при установке из npm см. встроенную команду `docker build` в [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup).

    См. [Песочница](/ru/gateway/sandboxing) для полного руководства и [полный справочник](/ru/gateway/config-agents#agentsdefaultssandbox) для всех параметров.

  </Accordion>

  <Accordion title="Включение push через relay для официальных сборок iOS">
    Push через relay для публичных сборок App Store использует размещенный relay OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Пользовательские развертывания relay требуют намеренно отдельного пути сборки/развертывания iOS, URL relay которого совпадает с URL relay Gateway. Если вы используете пользовательскую сборку с relay, задайте это в конфигурации Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Эквивалент CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Что это делает:

    - Позволяет Gateway отправлять `push.test`, сигналы пробуждения и пробуждения для переподключения через внешний relay.
    - Использует разрешение на отправку в области регистрации, переданное сопряженным приложением iOS. Gateway не нужен общий токен relay для всего развертывания.
    - Привязывает каждую регистрацию через relay к идентичности Gateway, с которой было сопряжено приложение iOS, поэтому другой Gateway не сможет повторно использовать сохраненную регистрацию.
    - Оставляет локальные/ручные сборки iOS на прямом APNs. Отправки через relay применяются только к официально распространяемым сборкам, зарегистрированным через relay.
    - Должно совпадать с базовым URL relay, встроенным в сборку iOS, чтобы трафик регистрации и отправки попадал в одно и то же развертывание relay.

    Сквозной поток:

    1. Установите официальное приложение iOS.
    2. Необязательно: настройте `gateway.push.apns.relay.baseUrl` на Gateway только при использовании намеренно отдельной пользовательской сборки с relay.
    3. Сопрягите приложение iOS с Gateway и дайте подключиться сеансам node и оператора.
    4. Приложение iOS получает идентичность Gateway, регистрируется в relay с помощью App Attest и квитанции приложения, а затем публикует payload `push.apns.register` с поддержкой relay в сопряженный Gateway.
    5. Gateway сохраняет дескриптор relay и разрешение на отправку, затем использует их для `push.test`, сигналов пробуждения и пробуждений для переподключения.

    Операционные примечания:

    - Если вы переключаете приложение iOS на другой Gateway, переподключите приложение, чтобы оно могло опубликовать новую регистрацию relay, привязанную к этому Gateway.
    - Если вы выпускаете новую сборку iOS, указывающую на другое развертывание relay, приложение обновляет кэшированную регистрацию relay вместо повторного использования старого источника relay.

    Примечание о совместимости:

    - `OPENCLAW_APNS_RELAY_BASE_URL` и `OPENCLAW_APNS_RELAY_TIMEOUT_MS` по-прежнему работают как временные переопределения env.
    - Пользовательские URL relay Gateway должны совпадать с базовым URL relay, встроенным в сборку iOS. Публичная линия выпуска App Store отклоняет пользовательские переопределения URL relay iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` остается обходным вариантом разработки только для local loopback; не сохраняйте URL relay HTTP в конфигурации.

    См. [Приложение iOS](/ru/platforms/ios#relay-backed-push-for-official-builds) для сквозного потока и [Поток аутентификации и доверия](/ru/platforms/ios#authentication-and-trust-flow) для модели безопасности relay.

  </Accordion>

  <Accordion title="Настройка Heartbeat (периодические отметки)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: строка длительности (`30m`, `2h`). Задайте `0m`, чтобы отключить.
    - `target`: `last` | `none` | `<channel-id>` (например, `discord`, `matrix`, `telegram` или `whatsapp`)
    - `directPolicy`: `allow` (по умолчанию) или `block` для целей Heartbeat в стиле личных сообщений
    - См. [Heartbeat](/ru/gateway/heartbeat) для полного руководства.

  </Accordion>

  <Accordion title="Настройка заданий Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: удалять завершенные изолированные сеансы запусков из `sessions.json` (по умолчанию `24h`; задайте `false`, чтобы отключить).
    - `runLog`: очищать сохраняемые строки истории запусков Cron для каждого задания. `maxBytes` остается допустимым для старых файловых журналов запусков.
    - См. [Задания Cron](/ru/automation/cron-jobs) для обзора функции и примеров CLI.

  </Accordion>

  <Accordion title="Настройка Webhook (hooks)">
    Включите HTTP-эндпоинты Webhook на Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Примечание по безопасности:
    - Рассматривайте все содержимое payload hook/Webhook как недоверенный ввод.
    - Используйте выделенный `hooks.token`; не используйте повторно активные секреты аутентификации Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` или `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Аутентификация hook работает только через заголовок (`Authorization: Bearer ...` или `x-openclaw-token`); токены в строке запроса отклоняются.
    - `hooks.path` не может быть `/`; держите входящий трафик Webhook на выделенном подпути, например `/hooks`.
    - Оставляйте флаги обхода небезопасного содержимого отключенными (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), кроме случаев строго ограниченной отладки.
    - Если вы включаете `hooks.allowRequestSessionKey`, также задайте `hooks.allowedSessionKeyPrefixes`, чтобы ограничить ключи сеансов, выбранные вызывающей стороной.
    - Для агентов, управляемых hook, предпочитайте сильные современные уровни моделей и строгую политику инструментов (например, только обмен сообщениями плюс песочница, где возможно).

    См. [полный справочник](/ru/gateway/configuration-reference#hooks) для всех параметров сопоставления и интеграции Gmail.

  </Accordion>

  <Accordion title="Настройка маршрутизации нескольких агентов">
    Запускайте несколько изолированных агентов с отдельными рабочими областями и сеансами:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    См. [Multi-Agent](/ru/concepts/multi-agent) и [полный справочник](/ru/gateway/config-agents#multi-agent-routing) для правил привязки и профилей доступа для каждого агента.

  </Accordion>

  <Accordion title="Разделение конфигурации на несколько файлов ($include)">
    Используйте `$include`, чтобы организовать большие конфигурации:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Один файл**: заменяет содержащий объект
    - **Массив файлов**: глубоко объединяется по порядку (поздний имеет приоритет)
    - **Соседние ключи**: объединяются после include (переопределяют включенные значения)
    - **Вложенные include**: поддерживаются до 10 уровней в глубину
    - **Относительные пути**: разрешаются относительно включающего файла
    - **Формат пути**: пути include не должны содержать нулевые байты и должны быть строго короче 4096 символов до и после разрешения
    - **Записи, принадлежащие OpenClaw**: когда запись изменяет только один раздел верхнего уровня,
      подкрепленный однофайловым include, например `plugins: { $include: "./plugins.json5" }`,
      OpenClaw обновляет этот включенный файл и оставляет `openclaw.json` без изменений
    - **Неподдерживаемая сквозная запись**: корневые include, массивы include и include
      с соседними переопределениями закрываются с ошибкой для записей, принадлежащих OpenClaw, вместо
      развертывания конфигурации
    - **Ограничение**: пути `$include` должны разрешаться внутри каталога, содержащего
      `openclaw.json`. Чтобы совместно использовать дерево на разных машинах или пользователями, задайте
      `OPENCLAW_INCLUDE_ROOTS` как список путей (`:` в POSIX, `;` в Windows) к
      дополнительным каталогам, на которые могут ссылаться include. Символические ссылки разрешаются
      и проверяются повторно, поэтому путь, который лексически находится в каталоге конфигурации, но чей
      реальный целевой путь выходит за пределы каждого разрешенного корня, все равно отклоняется.
    - **Обработка ошибок**: понятные ошибки для отсутствующих файлов, ошибок разбора, циклических include, недопустимого формата пути и чрезмерной длины

  </Accordion>
</AccordionGroup>

## Горячая перезагрузка конфигурации

Gateway отслеживает `~/.openclaw/openclaw.json` и применяет изменения автоматически: ручной перезапуск не нужен для большинства настроек.

Прямые правки файла считаются недоверенными, пока не пройдут проверку. Наблюдатель ждет,
пока уляжется активность временной записи/переименования редактора, читает итоговый файл и отклоняет
недопустимые внешние правки без перезаписи `openclaw.json`. Записи конфигурации,
принадлежащие OpenClaw, используют тот же шлюз схемы перед записью; разрушительные перезаписи, такие как
удаление `gateway.mode` или сокращение файла более чем наполовину, отклоняются и
сохраняются как `.rejected.*` для проверки.

Если вы видите `config reload skipped (invalid config)` или при запуске появляется `Invalid
config`, проверьте конфигурацию, запустите `openclaw config validate`, затем запустите `openclaw
doctor --fix` для исправления. См. [Устранение неполадок Gateway](/ru/gateway/troubleshooting#gateway-rejected-invalid-config)
для контрольного списка.

### Режимы перезагрузки

| Режим                  | Поведение                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (по умолчанию) | Мгновенно применяет безопасные изменения на горячую. Автоматически перезапускает для критических. |
| **`hot`**              | Применяет на горячую только безопасные изменения. Записывает предупреждение, когда нужен перезапуск: вы выполняете его сами. |
| **`restart`**          | Перезапускает Gateway при любом изменении конфигурации, безопасном или нет.             |
| **`off`**              | Отключает наблюдение за файлами. Изменения вступают в силу при следующем ручном перезапуске. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Что применяется на горячую, а что требует перезапуска

Большинство полей применяются на горячую без простоя. В режиме `hybrid` изменения, требующие перезапуска, обрабатываются автоматически.

| Категория          | Поля                                                              | Требуется перезапуск? |
| ------------------ | ----------------------------------------------------------------- | --------------------- |
| Каналы             | `channels.*`, `web` (WhatsApp) - все встроенные и plugin-каналы   | Нет                   |
| Агент и модели     | `agent`, `agents`, `models`, `routing`                            | Нет                   |
| Автоматизация      | `hooks`, `cron`, `agent.heartbeat`                                | Нет                   |
| Сессии и сообщения | `session`, `messages`                                             | Нет                   |
| Инструменты и медиа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Нет                   |
| UI и прочее        | `ui`, `logging`, `identity`, `bindings`                           | Нет                   |
| Сервер Gateway     | `gateway.*` (порт, привязка, auth, tailscale, TLS, HTTP)          | **Да**                |
| Инфраструктура     | `discovery`, `plugins`                                            | **Да**                |

<Note>
`gateway.reload` и `gateway.remote` — исключения: их изменение **не** запускает перезапуск.
</Note>

### Планирование перезагрузки

Когда вы редактируете исходный файл, на который ссылается `$include`, OpenClaw планирует
перезагрузку по исходной авторской структуре, а не по развернутому представлению в памяти.
Это делает решения горячей перезагрузки (горячее применение или перезапуск) предсказуемыми, даже когда
один раздел верхнего уровня находится в собственном подключенном файле, например
`plugins: { $include: "./plugins.json5" }`. Планирование перезагрузки завершается отказом, если
исходная структура неоднозначна.

## Config RPC (программные обновления)

Для инструментов, которые записывают конфигурацию через API Gateway, предпочитайте такой поток:

- `config.schema.lookup`, чтобы проверить одно поддерево (поверхностный узел схемы + сводки
  дочерних элементов)
- `config.get`, чтобы получить текущий снимок вместе с `hash`
- `config.patch` для частичных обновлений (JSON merge patch: объекты объединяются, `null`
  удаляет, массивы заменяются, когда это явно подтверждено через `replacePaths`, если
  элементы будут удалены)
- `config.apply` только когда вы намерены заменить всю конфигурацию
- `update.run` для явного самообновления с перезапуском; добавьте `continuationMessage`, когда сессия после перезапуска должна выполнить один последующий ход
- `update.status`, чтобы проверить последний sentinel перезапуска обновления и подтвердить работающую версию после перезапуска

Агенты должны считать `config.schema.lookup` первой точкой для точной
документации и ограничений на уровне полей. Используйте [справочник по конфигурации](/ru/gateway/configuration-reference),
когда нужна более широкая карта конфигурации, значения по умолчанию или ссылки на отдельные
справочники подсистем.

<Note>
Записи плоскости управления (`config.apply`, `config.patch`, `update.run`)
ограничены 3 запросами за 60 секунд на `deviceId+clientIp`. Запросы на перезапуск
объединяются, а затем между циклами перезапуска применяется 30-секундное ожидание.
`update.status` доступен только для чтения, но ограничен областью администратора, потому что sentinel перезапуска может
включать сводки шагов обновления и хвосты вывода команд.
</Note>

Пример частичного патча:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

И `config.apply`, и `config.patch` принимают `raw`, `baseHash`, `sessionKey`,
`note` и `restartDelayMs`. `baseHash` обязателен для обоих методов, когда
конфигурация уже существует.

`config.patch` также принимает `replacePaths` — массив путей конфигурации, для которых
замена массива является намеренной. Если патч заменит или удалит существующий массив
с меньшим количеством элементов, Gateway отклонит запись, если этот точный путь не указан
в `replacePaths`; вложенные массивы внутри элементов массива используют `[]`, например
`agents.list[].skills`. Это предотвращает незаметную перезапись массивов маршрутизации или allowlist
усеченными снимками `config.get`. Используйте `config.apply`, когда вы
намерены заменить всю конфигурацию.

## Переменные окружения

OpenClaw читает переменные окружения из родительского процесса, а также из:

- `.env` из текущего рабочего каталога (если есть)
- `~/.openclaw/.env` (глобальный fallback)

Ни один из файлов не переопределяет существующие переменные окружения. Вы также можете задать встроенные переменные окружения в конфигурации:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Импорт окружения оболочки (необязательно)">
  Если включено и ожидаемые ключи не заданы, OpenClaw запускает вашу login shell и импортирует только отсутствующие ключи:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Эквивалент переменной окружения: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Подстановка переменных окружения в значениях конфигурации">
  Ссылайтесь на переменные окружения в любом строковом значении конфигурации через `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Совпадают только имена в верхнем регистре: `[A-Z_][A-Z0-9_]*`
- Отсутствующие/пустые переменные вызывают ошибку во время загрузки
- Экранируйте через `$${VAR}` для буквального вывода
- Работает внутри файлов `$include`
- Встроенная подстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Ссылки на секреты (env, file, exec)">
  Для полей, поддерживающих объекты SecretRef, можно использовать:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Подробности SecretRef (включая `secrets.providers` для `env`/`file`/`exec`) находятся в разделе [управление секретами](/ru/gateway/secrets).
Поддерживаемые пути учетных данных перечислены в [поверхности учетных данных SecretRef](/ru/reference/secretref-credential-surface).
</Accordion>

См. [окружение](/ru/help/environment) для полного порядка приоритета и источников.

## Полный справочник

Полный справочник по всем полям см. в **[справочнике по конфигурации](/ru/gateway/configuration-reference)**.

---

_Связанные материалы: [примеры конфигурации](/ru/gateway/configuration-examples) · [справочник по конфигурации](/ru/gateway/configuration-reference) · [Doctor](/ru/gateway/doctor)_

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
- [Runbook Gateway](/ru/gateway)
