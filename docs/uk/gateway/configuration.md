---
read_when:
    - Перше налаштування OpenClaw
    - Пошук типових шаблонів конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: типові завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-01T21:15:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із symlink не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження symlink. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на справжній файл.

Якщо файл відсутній, OpenClaw використовує безпечні стандартні значення. Поширені причини додати конфігурацію:

- Під’єднати канали й керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сеанси, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для кожного доступного поля.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для орієнтованих на завдання порад і
[довідник конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і стандартних значень.

<Tip>
**Новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [приклади конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використовуйте вкладку **Config**.
    Control UI рендерить форму з актуальної схеми конфігурації, зокрема метадані документації полів
    `title` / `description`, а також схеми plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним виходом. Для детальних
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху плюс підсумки безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і застосовує зміни автоматично (дивіться [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора перевірка

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і перевірка. `config.schema.lookup` отримує один вузол у межах шляху плюс
підсумки дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми plugin і каналів часу виконання об’єднуються, коли
завантажено реєстр manifest.

Коли перевірка не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню справну копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить перевірку (або втрачає `gateway.mode`, різко
зменшується чи має випадково доданий на початку рядок журналу), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню справну копію й записує причину відновлення
в журнал. Наступний хід агента також отримує попередження системної події, щоб головний
агент не переписав відновлену конфігурацію без перевірки. Підвищення до останньої справної
копії пропускається, коли кандидат містить замінники відредагованих секретів, як-от `***`.
Коли кожна проблема перевірки обмежена `plugins.entries.<id>...`, OpenClaw
не виконує відновлення всього файлу. Він залишає поточну конфігурацію активною й
показує локальну помилку plugin, щоб невідповідність схеми plugin або версії host
не могла відкотити непов’язані користувацькі налаштування.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігурації під `channels.<provider>`. Дивіться спеціальну сторінку каналу для кроків налаштування:

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
    Задайте основну модель і необов’язкові резервні варіанти:

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

    - `agents.defaults.models` визначає каталог моделей і працює як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень transcript/tool (стандартно `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю скриншотів.
    - Дивіться [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [відмовостійкість моделей](/uk/concepts/model-failover) для ротації авторизації й поведінки резервних варіантів.
    - Для кастомних/самостійно розміщених provider дивіться [кастомні provider](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Доступ DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (стандартно): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сховищі дозволених після сполучення)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей за каналами.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Групові повідомлення за замовчуванням **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнатах на стандартному шляху message-tool, якщо ви навмисно не хочете застарілі автоматичні фінальні відповіді:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
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
    - **Видимі відповіді**: `messages.visibleReplies` може вимагати надсилання через message-tool глобально; `messages.groupChat.visibleReplies` перевизначає це для груп/каналів.
    - Дивіться [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень за каналами й режиму self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Використовуйте `agents.defaults.skills` для спільної базової лінії, а потім перевизначайте конкретних
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

    - Не вказуйте `agents.defaults.skills`, щоб Skills були необмеженими за замовчуванням.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
    - Встановіть `agents.list[].skills: []`, щоб не було Skills.
    - Дивіться [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, які здаються застарілими:

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Дивіться [перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Дайте локальним клієнтам більше часу завершити pre-auth WebSocket handshake на
    завантажених або малопотужних host:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Стандартне значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для одноразових перевизначень service або shell.
    - Спочатку краще виправити зависання запуску/event-loop; цей параметр призначений для host, які справні, але повільні під час warmup.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Сеанси керують безперервністю та ізоляцією розмов:

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
    - Див. [Керування сеансами](/uk/concepts/session) щодо областей дії, прив’язок ідентичності та політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) щодо всіх полів.

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

    Спочатку зберіть образ — з робочої копії джерельного коду запустіть `scripts/sandbox-setup.sh`, або для встановлення з npm див. вбудовану команду `docker build` у розділі [Sandboxing § Образи й налаштування](/uk/gateway/sandboxing#images-and-setup).

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) щодо всіх параметрів.

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    Push через relay налаштовується в `openclaw.json`.

    Установіть це в конфігурації Gateway:

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

    - Дає Gateway змогу надсилати `push.test`, wake-підштовхування та reconnect wake через зовнішній relay.
    - Використовує дозвіл на надсилання з областю дії реєстрації, пересланий спарованим застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності Gateway, з яким спарований застосунок iOS, тож інший Gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовується лише до офіційних розповсюджуваних збірок, зареєстрованих через relay.
    - Має відповідати базовій URL-адресі relay, вбудованій в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання доходив до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тією самою базовою URL-адресою relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на Gateway.
    3. Спаруйте застосунок iOS із Gateway і дайте сеансам вузла та оператора під’єднатися.
    4. Застосунок iOS отримує ідентичність Gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до спарованого Gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, wake-підштовхувань і reconnect wake.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший Gateway, перепід’єднайте застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього Gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого походження relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним варіантом розробки лише для local loopback; не зберігайте HTTP URL-адреси relay у конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) щодо наскрізного потоку та [Автентифікація й потік довіри](/uk/platforms/ios#authentication-and-trust-flow) щодо моделі безпеки relay.

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
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [завдання Cron](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

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
    - Вважайте весь вміст payload hook/webhook ненадійними вхідними даними.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхід webhook на виділеному підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, вибрані викликачем.
    - Для агентів, керованих hook, віддавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandbox, де можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) щодо всіх параметрів зіставлення та інтеграції Gmail.

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) щодо правил прив’язування та профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    Використовуйте `$include`, щоб упорядковувати великі конфігурації:

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
    - **Вкладені includes**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файла, що виконує include
    - **Записи, що належать OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: root includes, масиви include та includes
      із сусідніми перевизначеннями закриваються з помилкою для записів, що належать OpenClaw, замість
      сплющення конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися в межах каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, установіть
      `OPENCLAW_INCLUDE_ROOTS` на список шляхів (`:` у POSIX, `;` у Windows) до
      додаткових каталогів, на які можуть посилатися includes. Символічні посилання розв’язуються
      і перевіряються повторно, тому шлях, який лексично розташований у каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного root, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файла вважаються ненадійними, доки не пройдуть перевірку. Спостерігач чекає,
поки тимчасові записи/перейменування редактора стабілізуються, читає фінальний файл і відхиляє
некоректні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
що належать OpenClaw, використовують той самий schema gate перед записом; руйнівні перезаписи, як-от
видалення `gateway.mode` або зменшення файла більш ніж наполовину, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Виняток становлять помилки локальної валідації Plugin: якщо всі проблеми розташовані під
`plugins.entries.<id>...`, перезавантаження зберігає поточну конфігурацію та повідомляє про проблему Plugin
замість відновлення `.last-good`.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у журналах, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово) | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.           |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                                 |
| **`off`**              | Вимикає відстеження файлів. Зміни набирають чинності під час наступного ручного перезапуску.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні              |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                            | Ні              |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                | Ні              |
| Сеанси й повідомлення | `session`, `messages`                                             | Ні              |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Ні              |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                           | Ні              |
| Сервер Gateway      | `gateway.*` (порт, прив’язка, автентифікація, tailscale, TLS, HTTP) | **Так**         |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                              | **Так**         |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі макета, заданого у вихідних файлах, а не плаского подання в пам’яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (гаряче застосування чи перезапуск), навіть коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується без змін, якщо
вихідний макет неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через Gateway API, надавайте перевагу такому потоку:

- `config.schema.lookup`, щоб переглянути одне піддерево (поверхневий вузол схеми + підсумки
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском
- `update.status`, щоб переглянути найновіший сторожовий маркер перезапуску оновлення й перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як перше місце для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли потрібна ширша мапа конфігурації, значення за замовчуванням або посилання на окремі
довідники підсистем.

<Note>
Записи рівня керування (`config.apply`, `config.patch`, `update.run`) мають
обмеження частоти до 3 запитів на 60 секунд для кожної пари `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовують 30-секундне очікування між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністраторською областю, бо сторожовий маркер перезапуску може
містити підсумки кроків оновлення та кінцеві фрагменти виводу команд.
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
`note` та `restartDelayMs`. `baseHash` є обов’язковим для обох методів, коли
конфігурація вже існує.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо він існує)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні змінні середовища. Ви також можете задати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт середовища оболонки (необов’язково)">
  Якщо ввімкнено і очікувані ключі не задані, OpenClaw запускає вашу login shell та імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент змінної середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка змінних середовища у значеннях конфігурації">
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
- Екрануйте за допомогою `$${VAR}` для буквального виводу
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

Подробиці SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment), щоб отримати повний порядок пріоритету та джерела.

## Повний довідник

Повний довідник за кожним полем див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
