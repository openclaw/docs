---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: типові завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-03T12:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b17a72368bb8d178174ccd3ff401657c67911096efd5960e5a1aa8cf0d303c81
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символьними посиланнями не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження символьного посилання. Якщо ви зберігаєте конфігурацію поза
типовим каталогом стану, укажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні стандартні значення. Поширені причини додати конфігурацію:

- Під’єднати канали й контролювати, хто може писати боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, хуки)
- Налаштувати сеанси, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для практичних настанов і
[довідник конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і стандартних значень.

<Tip>
**Вперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [приклади конфігурації](/uk/gateway/configuration-examples) із повними конфігураціями для копіювання.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Config**.
    Control UI відтворює форму з живої схеми конфігурації, включно з метаданими документації
    `title` / `description` для полів, а також схемами Plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми, обмежений шляхом, разом зі зведеннями безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильно сформовані типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол, обмежений шляхом, разом зі
зведеннями дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми Plugin і каналів часу виконання об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню справну копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується чи має випадково доданий на початку рядок журналу), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню справну копію й записує причину відновлення
до журналу. Наступний хід агента також отримує попередження системної події, щоб основний
агент не переписав відновлену конфігурацію наосліп. Підвищення до останньої справної
копії пропускається, коли кандидат містить відредаговані заповнювачі секретів, як-от `***`.
Коли кожна проблема валідації обмежена `plugins.entries.<id>...`, OpenClaw
не виконує відновлення всього файлу. Він залишає поточну конфігурацію активною й
показує локальний збій Plugin, щоб невідповідність схеми Plugin або версії хоста
не могла відкотити непов’язані налаштування користувача.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Див. окрему сторінку каналу для кроків налаштування:

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
    Установіть основну модель і необов’язкові резервні варіанти:

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
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень транскрипту/інструментів (стандартно `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю знімків екрана.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [резервування моделей](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервних варіантів.
    - Для власних або self-hosted провайдерів див. [власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (стандартно): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сховищі дозволених після сполучення)
    - `"open"`: дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для подробиць за каналами.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Групові повідомлення стандартно **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнаті на стандартному шляху інструмента повідомлень, якщо ви навмисно не хочете застарілих автоматичних фінальних відповідей:

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
    - **Видимі відповіді**: `messages.visibleReplies` може вимагати надсилання через інструмент повідомлень глобально; `messages.groupChat.visibleReplies` перевизначає це для груп/каналів.
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень за каналами та режиму self-chat.

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

    - Не вказуйте `agents.defaults.skills`, щоб Skills були необмеженими за замовчуванням.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
    - Установіть `agents.list[].skills: []`, щоб вимкнути Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) і
      [довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, що здаються неактивними:

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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Дайте локальним клієнтам більше часу завершити pre-auth WebSocket handshake на
    завантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Стандартне значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для одноразових перевизначень сервісу або shell.
    - Спочатку бажано виправити зависання запуску/циклу подій; цей параметр призначений для хостів, які справні, але повільні під час прогрівання.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Сеанси керують безперервністю та ізоляцією розмови:

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
    - Див. [Керування сеансами](/uk/concepts/session) щодо областей дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
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

    Спочатку зберіть образ — з вихідного checkout виконайте `scripts/sandbox-setup.sh`, або для встановлення з npm див. вбудовану команду `docker build` у [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup).

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через ретранслятор для офіційних збірок iOS">
    Push через ретранслятор налаштовується в `openclaw.json`.

    Задайте це в конфігурації Gateway:

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

    - Дає Gateway змогу надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній ретранслятор.
    - Використовує дозвіл на надсилання, прив’язаний до реєстрації, який пересилає спарений застосунок iOS. Gateway не потребує токена ретранслятора для всього розгортання.
    - Прив’язує кожну реєстрацію через ретранслятор до ідентичності Gateway, з якою спарено застосунок iOS, тому інший Gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через ретранслятор застосовується лише до офіційних розповсюджених збірок, які зареєструвалися через ретранслятор.
    - Має збігатися з базовим URL ретранслятора, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації й надсилання потрапляв до того самого розгортання ретранслятора.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL ретранслятора.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на Gateway.
    3. Спарте застосунок iOS із Gateway і дайте підключитися сеансам вузла та оператора.
    4. Застосунок iOS отримує ідентичність Gateway, реєструється в ретрансляторі за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через ретранслятор у спарений Gateway.
    5. Gateway зберігає handle ретранслятора й дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо перемкнути застосунок iOS на інший Gateway, повторно підключіть застосунок, щоб він міг опублікувати нову реєстрацію ретранслятора, прив’язану до цього Gateway.
    - Якщо випустити нову збірку iOS, яка вказує на інше розгортання ретранслятора, застосунок оновлює кешовану реєстрацію ретранслятора замість повторного використання старого походження ретранслятора.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається обхідним механізмом розробки лише для local loopback; не зберігайте HTTP URL ретранслятора в конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) щодо наскрізного потоку та [Автентифікація й потік довіри](/uk/platforms/ios#authentication-and-trust-flow) щодо моделі безпеки ретранслятора.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні перевірки)">
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

    - `every`: рядок тривалості (`30m`, `2h`). Задайте `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати завдання Cron">
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

    - `sessionRetention`: очищати завершені ізольовані сеанси запусків із `sessions.json` (типово `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду можливості та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook-и (hooks)">
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
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний Webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ввімкнути `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, вибрані викликачем.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) щодо правил прив’язки та профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділити конфігурацію на кілька файлів ($include)">
    Використовуйте `$include`, щоб упорядкувати великі конфігурації:

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
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший перемагає)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, що виконує include
    - **Записи, якими володіє OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний write-through**: кореневі include, масиви include та include
      із сусідніми перевизначеннями відмовляють закрито для записів, якими володіє OpenClaw, замість
      згладжування конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися в межах каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як список шляхів (`:` у POSIX, `;` у Windows) до
      додаткових каталогів, на які можуть посилатися include. Симлінки розв’язуються
      і перевіряються повторно, тому шлях, який лексично перебуває в каталозі конфігурації, але реальна
      ціль якого виходить за межі кожного дозволеного кореня, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються ненадійними, доки не пройдуть перевірку. Watcher чекає,
доки завершаться тимчасові записи/перейменування редактора, читає остаточний файл і відхиляє
недійсні зовнішні редагування, відновлюючи останню справну конфігурацію. Записи конфігурації,
якими володіє OpenClaw, використовують той самий schema gate перед записом; руйнівні перезаписи,
як-от видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Помилки локальної перевірки Plugin є винятком: якщо всі проблеми перебувають під
`plugins.entries.<id>...`, перезавантаження зберігає поточну конфігурацію й повідомляє про проблему
Plugin замість відновлення `.last-good`.

Якщо в журналах ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перегляньте відповідний файл
`.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.   |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви виконуєте його. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлів. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія           | Поля                                                              | Потрібен перезапуск? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та Plugin-канали | Ні              |
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
перезавантаження з авторського макета джерела, а не зі сплощеного подання в пам’яті.
Це зберігає передбачуваність рішень щодо гарячого перезавантаження (гаряче застосування чи перезапуск), навіть коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується закрито, якщо
макет джерела неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, віддавайте перевагу такому потоку:

- `config.schema.lookup`, щоб переглянути одне піддерево (поверхневий вузол схеми + зведення дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сеанс має виконати один наступний хід
- `update.status`, щоб переглянути останній sentinel перезапуску оновлення та перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як першу точку для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли їм потрібні ширша карта конфігурації, типові значення або посилання на окремі
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`)
обмежені частотою до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовують 30-секундне охолодження між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністративною областю, бо sentinel перезапуску може
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
`note` і `restartDelayMs`. `baseHash` є обов’язковим для обох методів, коли
конфігурація вже існує.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із файлів не перевизначає наявні змінні середовища. Ви також можете задавати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт середовища оболонки (необов’язково)">
  Якщо ввімкнено й очікувані ключі не задані, OpenClaw запускає вашу оболонку входу та імпортує лише відсутні ключі:

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

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні або порожні змінні спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
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

Відомості про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment) для повного пріоритету та джерел.

## Повний довідник

Повний довідник по кожному полю див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
