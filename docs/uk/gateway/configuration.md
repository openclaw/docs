---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-28T22:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b425a43ea6e40b8380d3a295dc9b190e5dbce7a6d044df786133bfadf3b07c0d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язковий конфіг <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігу має бути звичайним файлом. Макети `openclaw.json`
із symlink не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження symlink. Якщо ви зберігаєте конфіг поза
типовою директорією стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфіг:

- Підключити канали й керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігу. Використовуйте цю сторінку для орієнтованих на задачі вказівок і
[довідник з конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і типових значень.

<Tip>
**Уперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [приклади конфігурації](/uk/gateway/configuration-examples) з готовими конфігами для копіювання.
</Tip>

## Мінімальний конфіг

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Редагування конфігу

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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Config**.
    Control UI відтворює форму з живої схеми конфігу, включно з метаданими документації
    `title` / `description` для полів, а також схемами plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним виходом. Для деталізованих
    UI та інших інструментів Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху та підсумки безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли приєднувати метадані JSON Schema.
</Warning>

`openclaw config schema` друкує канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол у межах шляху та
підсумки дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
проходять крізь вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів об’єднуються, коли завантажено
реєстр маніфестів.

Коли валідація завершується помилкою:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню справну копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується чи має випадково доданий рядок логу на початку), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню справну копію та записує причину відновлення
в лог. Наступний хід агента також отримує попередження системної події, щоб головний
агент не перезаписав відновлений конфіг наосліп. Підвищення до останньої справної копії
пропускається, коли кандидат містить відредаговані заповнювачі секретів, як-от `***`.
Коли кожна проблема валідації обмежена `plugins.entries.<id>...`, OpenClaw
не виконує відновлення всього файлу. Він залишає поточний конфіг активним і
показує локальну помилку plugin, щоб невідповідність схеми plugin або версії хоста
не могла відкотити непов’язані налаштування користувача.

## Поширені задачі

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігу під `channels.<provider>`. Дивіться спеціальну сторінку каналу для кроків налаштування:

    - [WhatsApp](/uk/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/uk/channels/telegram) — `channels.telegram`
    - [Discord](/uk/channels/discord) — `channels.discord`
    - [Feishu](/uk/channels/feishu) — `channels.feishu`
    - [Google Chat](/uk/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/uk/channels/msteams) — `channels.msteams`
    - [Slack](/uk/channels/slack) — `channels.slack`
    - [Signal](/uk/channels/signal) — `channels.signal`
    - [iMessage](/uk/channels/imessage) — `channels.imessage`
    - [Mattermost](/uk/channels/mattermost) — `channels.mattermost`

    Усі канали використовують однаковий шаблон політики DM:

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

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень transcript/tool (типово `1200`); нижчі значення зазвичай зменшують використання vision-token у запусках із великою кількістю знімків екрана.
    - Дивіться [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [відмовостійкість моделей](/uk/concepts/model-failover) для ротації auth і поведінки резервних варіантів.
    - Для власних/self-hosted провайдерів дивіться [власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сховищі paired allow)
    - `"open"`: дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Групові повідомлення типово **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнаті на типовому шляху message-tool, якщо ви навмисно не хочете legacy автоматичних фінальних відповідей:

    ```json5
    {
      messages: {
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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
    - **Видимі відповіді**: `message_tool` залишає звичайні фінальні відповіді приватними; агент має викликати `message(action=send)`, щоб опублікувати видимо в групі/каналі.
    - Дивіться [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень на рівні каналу та режиму self-chat.

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

    - Пропустіть `agents.defaults.skills`, щоб Skills типово були без обмежень.
    - Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
    - Встановіть `agents.list[].skills: []`, щоб не мати Skills.
    - Дивіться [Skills](/uk/tools/skills), [конфіг Skills](/uk/tools/skills-config) і
      [довідник з конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Керуйте тим, наскільки агресивно Gateway перезапускає канали, що виглядають застарілими:

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
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Дивіться [перевірки здоров’я](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

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

    - Типове значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` досі має пріоритет для одноразових перевизначень сервісу або shell.
    - Спочатку краще виправити зависання запуску/event-loop; цей регулятор призначений для хостів, які справні, але повільні під час warmup.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Сесії керують безперервністю й ізоляцією розмов:

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

    - `dmScope`: `main` (спільний) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сеансів, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) для областей дії, посилань ідентичності та політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Enable sandboxing">
    Запускайте сеанси агентів в ізольованих середовищах sandbox:

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

    Спочатку зберіть образ: `scripts/sandbox-setup.sh`

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    Push через relay налаштовується в `openclaw.json`.

    Установіть це в конфігурації gateway:

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

    - Дає змогу gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання з областю дії реєстрації, пересланий спареним застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну relay-реєстрацію до ідентичності gateway, з якою спарено застосунок iOS, щоб інший gateway не міг повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовується лише до офіційних поширюваних збірок, зареєстрованих через relay.
    - Має збігатися з базовою URL relay, вбудованою в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання доходив до одного й того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тією самою базовою URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спаруйте застосунок iOS із gateway і дайте підключитися сеансам вузла та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-підтримуване навантаження `push.apns.register` до спареного gateway.
    5. Gateway зберігає relay-дескриптор і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` досі працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише для розробки на loopback як аварійний обхід; не зберігайте HTTP URL relay у конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
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
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Configure cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: видаляти завершені ізольовані сеанси запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і збереженими рядками.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
    Увімкніть HTTP Webhook endpoints на Gateway:

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
    - Сприймайте весь вміст payload hook/webhook як недовірені вхідні дані.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовок (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхід webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте чітко обмежене налагодження.
    - Якщо вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, вибрані викликачем.
    - Для агентів, керованих hook, надавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише повідомлення плюс sandboxing, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Configure multi-agent routing">
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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил прив’язки та профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    Використовуйте `$include`, щоб організувати великі конфігурації:

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
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, який виконує include
    - **Записи, керовані OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: include в корені, масиви include та include
      із сусідніми перевизначеннями завершуються закритою помилкою для записів, керованих OpenClaw, замість
      вирівнювання конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Watcher чекає,
поки вщухнуть тимчасові записи/перейменування редактора, читає фінальний файл і відхиляє
некоректні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації, керовані OpenClaw,
використовують той самий schema gate перед записом; руйнівні перезаписи, як-от
видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Помилки локальної валідації Plugin є винятком: якщо всі проблеми розташовані під
`plugins.entries.<id>...`, перезавантаження зберігає поточну конфігурацію та повідомляє про проблему Plugin
замість відновлення `.last-good`.

Якщо бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у логах, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск — ви виконуєте його. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлу. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, які потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані та plugin-канали   | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (порт, bind, auth, Tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує перезавантаження на основі авторського макета джерела, а не сплощеного подання в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними, навіть коли один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується без змін, якщо макет джерела неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, надавайте перевагу такому потоку:

- `config.schema.lookup`, щоб переглянути одне піддерево (поверхневий вузол схеми + зведення дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null` видаляє, масиви замінюються)
- `config.apply` лише коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском
- `update.status`, щоб переглянути останній маркер перезапуску після оновлення та перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як першу зупинку для точних документів і обмежень на рівні полів. Використовуйте [Довідник із конфігурації](/uk/gateway/configuration-reference), коли потрібна ширша мапа конфігурації, стандартні значення або посилання на спеціальні довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`) мають обмеження частоти: 3 запити за 60 секунд на `deviceId+clientIp`. Запити на перезапуск об’єднуються, після чого застосовується 30-секундна пауза між циклами перезапуску.
`update.status` доступний лише для читання, але має адміністративну область дії, оскільки маркер перезапуску може містити зведення кроків оновлення та хвости виводу команд.
</Note>

Приклад часткового патча:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

І `config.apply`, і `config.patch` приймають `raw`, `baseHash`, `sessionKey`, `note` та `restartDelayMs`. `baseHash` обов’язковий для обох методів, коли конфігурація вже існує.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні змінні середовища. Ви також можете задавати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт середовища оболонки (необов’язково)">
  Якщо ввімкнено й очікувані ключі не задані, OpenClaw запускає вашу login shell та імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент змінної середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка змінних середовища в значеннях конфігурації">
  Посилайтеся на змінні середовища в будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Збігаються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні або порожні змінні спричиняють помилку під час завантаження
- Екрануйте як `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
  Для полів, які підтримують об’єкти SecretRef, можна використовувати:

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
Підтримувані шляхи облікових даних перелічено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Повний пріоритет і джерела див. у [Середовище](/uk/help/environment).

## Повний довідник

Повний довідник за всіма полями див. у **[Довіднику з конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник із конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
