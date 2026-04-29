---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-29T10:10:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети з `openclaw.json`
як символьним посиланням не підтримуються для записів, якими керує OpenClaw; атомарний запис може замінити
шлях замість збереження символьного посилання. Якщо ви зберігаєте конфігурацію поза
каталогом стану за замовчуванням, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Під’єднати канали та керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (Cron, хуки)
- Налаштувати сеанси, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для завдань, орієнтованих на виконання, і
[довідник з конфігурації](/uk/gateway/configuration-reference) для ширшої
мапи полів і значень за замовчуванням.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [прикладів конфігурації](/uk/gateway/configuration-examples) з готовими конфігураціями для копіювання.
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
  <Tab title="Інтерактивний майстер">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (однорядкові команди)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI керування">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Конфігурація**.
    UI керування відображає форму з живої схеми конфігурації, включно з метаданими документації
    `title` / `description` для полів, а також схемами Plugin і каналів, коли
    вони доступні, з редактором **сирого JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху разом зі зведеннями безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора перевірка

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недопустимі значення змушують Gateway **відмовитися від запуску**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` друкує канонічну JSON Schema, яку використовує UI керування
і перевірка. `config.schema.lookup` отримує один вузол у межах шляху разом зі
зведеннями дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми Plugin і каналів часу виконання об’єднуються, коли
завантажено реєстр manifest.

Коли перевірка не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню робочу копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить перевірку (або втрачає `gateway.mode`, різко
зменшується чи має випадково доданий на початку рядок журналу), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню робочу копію та записує причину відновлення
в журнал. Наступний хід агента також отримує попередження системної події, щоб головний
агент не переписав відновлену конфігурацію наосліп. Просування до останньої робочої копії
пропускається, коли кандидат містить відредаговані заповнювачі секретів, як-от `***`.
Коли кожна проблема перевірки обмежена `plugins.entries.<id>...`, OpenClaw
не виконує відновлення всього файлу. Він залишає поточну конфігурацію активною та
показує локальну помилку Plugin, щоб невідповідність схеми Plugin або версії хоста
не могла відкотити непов’язані налаштування користувача.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Дивіться спеціальну сторінку каналу для кроків налаштування:

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

  <Accordion title="Вибрати й налаштувати моделі">
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

    - `agents.defaults.models` визначає каталог моделей і слугує allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскрипті/інструментах (типово `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю знімків екрана.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [Відмовостійке перемикання моделей](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервного переходу.
    - Для користувацьких/самостійно розміщених провайдерів див. [Користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керуйте тим, хто може писати боту">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або в сховищі дозволених сполучених відправників)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштуйте перевірку згадок у груповому чаті">
    Групові повідомлення типово **вимагають згадки**. Налаштуйте шаблони запуску для кожного агента й залишайте видимі відповіді в кімнаті на типовому шляху message-tool, якщо навмисно не хочете використовувати застарілі автоматичні фінальні відповіді:

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
    - **Видимі відповіді**: `messages.visibleReplies` може глобально вимагати надсилання через message-tool; `messages.groupChat.visibleReplies` перевизначає це для груп/каналів.
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень для кожного каналу та режиму self-chat.

  </Accordion>

  <Accordion title="Обмежте Skills для кожного агента">
    Використовуйте `agents.defaults.skills` як спільну базову конфігурацію, а потім перевизначайте конкретних
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

    - Не вказуйте `agents.defaults.skills`, щоб Skills типово були без обмежень.
    - Не вказуйте `agents.list[].skills`, щоб успадковувати типові значення.
    - Задайте `agents.list[].skills: []`, щоб вимкнути Skills.
    - Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [Довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштуйте моніторинг стану каналів Gateway">
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

    - Задайте `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису, не вимикаючи глобальний монітор.
    - Див. [Перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштуйте тайм-аут WebSocket-рукостискання Gateway">
    Дайте локальним клієнтам більше часу для завершення WebSocket-рукостискання до автентифікації на
    навантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Типове значення: `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` і надалі має пріоритет для одноразових перевизначень сервісу або оболонки.
    - Спершу краще виправити зависання запуску/циклу подій; цей параметр призначений для хостів, які справні, але повільні під час прогрівання.

  </Accordion>

  <Accordion title="Налаштуйте сесії та скидання">
    Сесії керують безперервністю та ізоляцією розмов:

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сеансів, прив’язаних до треду (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) щодо областей дії, зв’язків ідентичності та політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнення ізоляції">
    Запускайте сеанси агентів в ізольованих середовищах виконання sandbox:

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

  <Accordion title="Увімкнення push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

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

    - Дозволяє Gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує grant на надсилання з областю дії реєстрації, переданий спареним застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності Gateway, з якою спарився застосунок iOS, тому інший Gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовується лише до офіційних розповсюджуваних збірок, зареєстрованих через relay.
    - Має збігатися з базовою URL-адресою relay, вбудованою в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до одного й того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тією самою базовою URL-адресою relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на Gateway.
    3. Спарте застосунок iOS із Gateway і дозвольте підключитися сеансам node та оператора.
    4. Застосунок iOS отримує ідентичність Gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до спареного Gateway.
    5. Gateway зберігає relay handle і grant на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший Gateway, повторно підключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього Gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним шляхом розробки лише для loopback; не зберігайте HTTP URL-адреси relay у конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Автентифікація й потік довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштування Heartbeat (періодичні check-in)">
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
    - `directPolicy`: `allow` (за замовчуванням) або `block` для цілей Heartbeat у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштування завдань cron">
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

    - `sessionRetention`: видаляти завершені ізольовані сеанси запусків із `sessions.json` (за замовчуванням `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функцій і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштування webhooks (hooks)">
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
    - Розглядайте весь вміст payload hook/webhook як недовірений ввід.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовок (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте webhook ingress на виділеному підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте чітко обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, вибрані викликачем.
    - Для агентів, керованих hook, віддавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів мапінгу та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштування маршрутизації кількох агентів">
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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) щодо правил прив’язки та профілів доступу для окремих агентів.

  </Accordion>

  <Accordion title="Поділ конфігурації на кілька файлів ($include)">
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
    - **Масив файлів**: глибоко зливається за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: зливаються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, що включає
    - **Записи, керовані OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі include, масиви include та include
      із сусідніми перевизначеннями закриваються з помилкою для записів, керованих OpenClaw, замість
      сплющення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — ручний перезапуск для більшості налаштувань не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Watcher чекає,
доки вщухнуть тимчасові записи/перейменування редактора, читає фінальний файл і відхиляє
недійсні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
керовані OpenClaw, використовують той самий schema gate перед записом; руйнівні перезаписи,
як-от видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються
та зберігаються як `.rejected.*` для перевірки.

Збої локальної валідації Plugin є винятком: якщо всі проблеми містяться в
`plugins.entries.<id>...`, перезавантаження зберігає поточну конфігурацію та повідомляє про проблему Plugin
замість відновлення `.last-good`.

Якщо в журналах ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний файл
`.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для checklist відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **`hybrid`** (за замовчуванням) | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних. |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                    |
| **`off`**              | Вимикає спостереження за файлами. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що гаряче застосовується, а що потребує перезапуску

Більшість полів гаряче застосовуються без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія           | Поля                                                              | Потрібен перезапуск? |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані та plugin-канали   | Ні                   |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                           | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Ні                   |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження за структурою, заданою у вихідному файлі, а не за пласким поданням у пам’яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (гаряче застосування чи перезапуск), навіть коли
один розділ верхнього рівня міститься у власному підключеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується безпечним збоєм, якщо
структура джерела неоднозначна.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, надавайте перевагу такому процесу:

- `config.schema.lookup`, щоб перевірити одне піддерево (поверхневий вузол схеми + зведення
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском
- `update.status`, щоб перевірити останній sentinel перезапуску оновлення та підтвердити запущену версію після перезапуску

Агенти мають вважати `config.schema.lookup` першою зупинкою для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли потрібні ширша мапа конфігурації, типові значення або посилання на окремі
довідники підсистем.

<Note>
Записи до площини керування (`config.apply`, `config.patch`, `update.run`)
обмежені частотою до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім примусово застосовується 30-секундне очікування між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністративною областю, оскільки sentinel перезапуску може
містити зведення кроків оновлення та кінцеві фрагменти виводу команд.
</Note>

Приклад часткового patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

І `config.apply`, і `config.patch` приймають `raw`, `baseHash`, `sessionKey`,
`note` і `restartDelayMs`. `baseHash` обов’язковий для обох методів, коли
конфігурація вже існує.

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

<Accordion title="Shell env import (optional)">
  Якщо ввімкнено і очікувані ключі не задані, OpenClaw запускає вашу оболонку входу та імпортує лише відсутні ключі:

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

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні або порожні змінні спричиняють помилку під час завантаження
- Екрануйте за допомогою `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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
Підтримувані шляхи облікових даних перелічені в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment), щоб дізнатися про повний порядок пріоритету та джерела.

## Повний довідник

Повний довідник по кожному полю див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
