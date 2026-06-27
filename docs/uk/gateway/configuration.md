---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-06-27T17:31:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символічними посиланнями не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження символічного посилання. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для прикладних інструкцій і
[довідник з конфігурації](/uk/gateway/configuration-reference) для ширшої
мапи полів і значень за замовчуванням.

<Tip>
**Новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання.
</Tip>

## Мінімальна конфігурація

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Редагування конфігурації

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Конфігурація**.
    Control UI відображає форму з поточної схеми конфігурації, зокрема метадані документації полів
    `title` / `description`, а також схеми plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як аварійним виходом. Для деталізованих
    UI та інших інструментів Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми для певного шляху та зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення змушують Gateway **відмовитися від запуску**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли прикріплювати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол для певного шляху та
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню справну копію після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить валідацію (зокрема локальну валідацію plugin), запуск Gateway завершується невдачею або
перезавантаження пропускається, а поточний runtime зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб виправити конфігурацію з префіксами/перезаписами або
відновити останню справну копію. Підвищення до останньої справної копії пропускається, коли
кандидат містить замасковані placeholders секретів, наприклад `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Див. спеціальну сторінку каналу для кроків налаштування:

    - [WhatsApp](/uk/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/uk/channels/telegram) - `channels.telegram`
    - [Discord](/uk/channels/discord) - `channels.discord`
    - [Feishu](/uk/channels/feishu) - `channels.feishu`
    - [Google Chat](/uk/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/uk/channels/msteams) - `channels.msteams`
    - [Slack](/uk/channels/slack) - `channels.slack`
    - [Signal](/uk/channels/signal) - `channels.signal`
    - [iMessage](/uk/channels/imessage) - `channels.imessage`
    - [Mattermost](/uk/channels/mattermost) - `channels.mattermost`

    Усі канали мають спільний шаблон політики DM:

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

  <Accordion title="Choose and configure models">
    Встановіть основну модель і необов’язкові резервні варіанти:

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

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`; записи `provider/*` фільтрують `/model`, `/models` і вибирачі моделей до вибраних провайдерів, водночас використовуючи динамічне виявлення моделей.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень transcript/інструментів (за замовчуванням `1200`); нижчі значення зазвичай зменшують використання vision-token у запусках із великою кількістю скриншотів.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [відмовостійкість моделей](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервних варіантів.
    - Для власних/self-hosted провайдерів див. [власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Доступ до DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (за замовчуванням): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сполученому сховищі allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist для конкретного каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для подробиць за каналами.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Групові повідомлення за замовчуванням **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента. Звичайні відповіді в групах/каналах публікуються автоматично; увімкніть шлях message-tool для спільних кімнат, де агент має вирішувати, коли говорити:

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

    - **Згадки в метаданих**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
    - **Видимі відповіді**: `messages.visibleReplies` може вимагати надсилання через message-tool глобально; `messages.groupChat.visibleReplies` перевизначає це для груп/каналів.
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) щодо режимів видимих відповідей, перевизначень для каналів і режиму self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Використовуйте `agents.defaults.skills` для спільної бази, а потім перевизначайте конкретних
    агентів через `agents.list[].skills`:

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

    - Пропустіть `agents.defaults.skills`, щоб Skills за замовчуванням були необмеженими.
    - Пропустіть `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Встановіть `agents.list[].skills: []`, щоб не мати Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник з конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Керуйте тим, наскільки агресивно Gateway перезапускає канали, які виглядають застарілими:

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб вимкнути перезапуски health-monitor глобально.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Дайте локальним клієнтам більше часу для завершення pre-auth WebSocket handshake на
    завантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Значення за замовчуванням — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для разових перевизначень сервісу або shell.
    - Спершу бажано виправити зависання startup/event-loop; цей регулятор призначений для хостів, які здорові, але повільні під час прогріву.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Сесії керують неперервністю й ізоляцією розмови:

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

    - `dmScope`: `main` (спільна) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сеансів, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) щодо областей дії, зв’язків ідентичності та політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути sandboxing">
    Запускайте сеанси агентів в ізольованих sandbox-середовищах виконання:

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

    Спочатку зберіть образ - із source checkout запустіть `scripts/sandbox-setup.sh`, або після встановлення з npm див. inline-команду `docker build` у [Sandboxing § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути relay-backed push для офіційних збірок iOS">
    Relay-backed push для публічних збірок App Store/TestFlight використовує розміщений relay OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Власні розгортання relay потребують навмисно окремого шляху збірки/розгортання iOS, URL relay якого збігається з URL relay Gateway. Якщо ви використовуєте власну relay-збірку, задайте це в конфігурації gateway:

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

    Еквівалент CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, підштовхування пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує grant на надсилання у межах реєстрації, пересланий спареним застосунком iOS. Gateway не потребує deployment-wide relay token.
    - Прив’язує кожну relay-backed реєстрацію до ідентичності gateway, з яким спарений застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Relay-backed надсилання застосовуються лише до офіційних розповсюджених збірок, зареєстрованих через relay.
    - Має збігатися з базовим URL relay, вбудованим у збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний flow:

    1. Установіть офіційну/TestFlight збірку iOS.
    2. Необов’язково: налаштуйте `gateway.push.apns.relay.baseUrl` на gateway лише під час використання навмисно окремої власної relay-збірки.
    3. Спаруйте застосунок iOS із gateway і дозвольте підключитися як вузловим, так і операторським сеансам.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest плюс квитанції застосунку, а потім публікує relay-backed payload `push.apns.register` до спареного gateway.
    5. Gateway зберігає relay handle і grant на надсилання, а потім використовує їх для `push.test`, підштовхувань пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого походження relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` досі працюють як тимчасові перевизначення env.
    - Власні URL relay gateway мають збігатися з базовим URL relay, вбудованим у збірку iOS. Публічна release lane App Store відхиляє власні перевизначення URL relay iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` лишається аварійним шляхом розробки лише для local loopback; не зберігайте HTTP URL relay у config.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного flow і [Автентифікація та trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні check-in)">
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

    - `every`: рядок тривалості (`30m`, `2h`). Установіть `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для DM-style цілей Heartbeat
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати Cron jobs">
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

    - `sessionRetention`: видаляти завершені ізольовані сеанси запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: видаляти збережені рядки run-history Cron для кожного завдання. `maxBytes` лишається прийнятним для старіших file-backed журналів запусків.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати webhooks (hooks)">
    Увімкніть HTTP webhook endpoints на Gateway:

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

    Примітка щодо безпеки:
    - Вважайте весь вміст payload hook/webhook ненадійним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно активні secrets автентифікації Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query-string відхиляються.
    - `hooks.path` не може бути `/`; тримайте webhook ingress на окремому subpath, наприклад `/hooks`.
    - Тримайте прапорці обходу unsafe-content вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити session keys, вибрані caller.
    - Для hook-driven агентів віддавайте перевагу потужним сучасним tiers моделей і суворій політиці інструментів (наприклад, лише messaging плюс sandboxing, де можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати multi-agent routing">
    Запускайте кілька ізольованих агентів з окремими робочими просторами та сеансами:

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) щодо правил binding і профілів доступу per-agent.

  </Accordion>

  <Accordion title="Розділити config на кілька файлів ($include)">
    Використовуйте `$include`, щоб організувати великі configs:

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

    - **Один файл**: замінює об’єкт, що його містить
    - **Масив файлів**: deep-merged по порядку (пізніший перемагає)
    - **Sibling keys**: об’єднуються після includes (перевизначають included values)
    - **Вкладені includes**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, що виконує include
    - **Формат шляху**: include paths не повинні містити null bytes і мають бути строго коротшими за 4096 символів до та після resolution
    - **Записи, якими володіє OpenClaw**: коли запис змінює лише одну top-level секцію,
      backed by single-file include, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей included файл і лишає `openclaw.json` без змін
    - **Непідтримуваний write-through**: root includes, include arrays та includes
      із sibling overrides fail closed для записів, якими володіє OpenClaw, замість
      flattening config
    - **Ізоляція**: шляхи `$include` мають resolve під директорією, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як path-list (`:` на POSIX, `;` на Windows) додаткових
      директорій, на які можуть посилатися includes. Symlinks resolve
      і перевіряються повторно, тому шлях, який лексично живе в config dir, але чия
      реальна ціль виходить за межі кожного дозволеного root, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок parse, circular includes, недійсного формату шляху та надмірної довжини

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway стежить за `~/.openclaw/openclaw.json` і застосовує зміни автоматично - для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються ненадійними, доки не пройдуть валідацію. Watcher чекає,
поки припиниться churn temp-write/rename від редактора, читає остаточний файл і відхиляє
недійсні зовнішні редагування без перезапису `openclaw.json`. Записи config, якими
володіє OpenClaw, використовують той самий schema gate перед записом; destructive clobbers, як-от
видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються і
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або startup повідомляє `Invalid
config`, перевірте config, запустіть `openclaw config validate`, потім запустіть `openclaw
doctor --fix` для repair. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для checklist.

### Режими reload

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво hot-applies безпечні зміни. Автоматично перезапускається для критичних.         |
| **`hot`**              | Hot-applies лише безпечні зміни. Логує попередження, коли потрібен перезапуск - ви виконуєте його. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни config, безпечної чи ні.                        |
| **`off`**              | Вимикає file watching. Зміни набирають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що hot-applies, а що потребує перезапуску

Більшість полів hot-apply без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) - усі вбудовані та Plugin-канали   | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії й повідомлення | `session`, `messages`                                           | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `plugins`                                            | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками - їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі авторської структури джерела, а не вирівняного представлення в пам'яті.
Це робить рішення гарячого перезавантаження (гаряче застосування проти перезапуску) передбачуваними навіть тоді, коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується відмовою, якщо
структура джерела неоднозначна.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, надавайте перевагу такому процесу:

- `config.schema.lookup`, щоб переглянути одне піддерево (неглибокий вузол схеми + зведення
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об'єкти об'єднуються, `null`
  видаляє, масиви замінюються після явного підтвердження через `replacePaths`, якщо
  записи буде вилучено)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сесія має виконати один наступний хід
- `update.status`, щоб переглянути найновіший sentinel перезапуску оновлення та перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як першу зупинку для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли їм потрібна ширша мапа конфігурації, стандартні значення або посилання на спеціалізовані
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`) обмежені
до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об'єднуються, а потім застосовують 30-секундне охолодження між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністратором, бо sentinel перезапуску може
містити зведення кроків оновлення та хвости виводу команд.
</Note>

Приклад часткового патча:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

І `config.apply`, і `config.patch` приймають `raw`, `baseHash`, `sessionKey`,
`note` і `restartDelayMs`. `baseHash` потрібен для обох методів, коли
конфігурація вже існує.

`config.patch` також приймає `replacePaths`, масив шляхів конфігурації, заміна масивів у яких
є навмисною. Якщо патч замінив би або видалив наявний масив
із меншою кількістю записів, Gateway відхиляє запис, якщо цей точний шлях не вказано
в `replacePaths`; вкладені масиви під записами масиву використовують `[]`, наприклад
`agents.list[].skills`. Це запобігає тому, щоб усічені знімки `config.get`
непомітно перезаписували масиви маршрутизації або списків дозволених елементів. Використовуйте `config.apply`, коли ви
маєте намір замінити всю конфігурацію.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні змінні середовища. Ви також можете задавати inline-змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Якщо ввімкнено й очікувані ключі не задані, OpenClaw запускає ваш login shell та імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент змінної середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Посилайтеся на змінні середовища в будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Збігаються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні або порожні змінні спричиняють помилку під час завантаження
- Екрануйте за допомогою `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Inline-підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Для полів, які підтримують об'єкти SecretRef, можна використовувати:

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

Докладні відомості про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Повний порядок пріоритету й джерела див. у [Середовище](/uk/help/environment).

## Повний довідник

Повний довідник поле за полем див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов'язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов'язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Операційний посібник Gateway](/uk/gateway)
