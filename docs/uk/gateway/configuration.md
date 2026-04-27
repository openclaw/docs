---
read_when:
    - Початкове налаштування OpenClaw
    - Шукаєте поширені шаблони конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-27T09:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96aedfb4ab8e2acb872d39ddb1d7a385343724f5c7358217a81cf27febdebb08
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json` із символічними посиланнями
не підтримуються для записів, якими керує OpenClaw; атомарний запис може замінити
шлях замість збереження символічного посилання. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та визначити, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сеанси, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точної
документації на рівні окремих полів перед редагуванням конфігурації. Використовуйте цю сторінку для інструкцій, орієнтованих на завдання, а
[довідник із конфігурації](/uk/gateway/configuration-reference) — для ширшої
мапи полів і значень за замовчуванням.

<Tip>
**Вперше налаштовуєте конфігурацію?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для повних конфігурацій, готових до копіювання.
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
  <Tab title="Control UI">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використайте вкладку **Config**.
    Control UI відображає форму на основі живої схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами Plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми, обмежений шляхом, а також зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол, обмежений шляхом, а також
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
поширюються на вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми Plugin і каналів часу виконання об’єднуються, коли завантажено
реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Після кожного успішного запуску Gateway зберігає довірену останню відому справну копію.
Якщо `openclaw.json` пізніше не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується чи має сторонній рядок журналу на початку), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню відому справну копію та записує причину
відновлення в журнал. Наступний хід агента також отримує попередження про системну подію, щоб основний
агент не переписав відновлену конфігурацію всліпу. Підвищення до статусу останньої відомої справної копії
пропускається, якщо кандидат містить замасковані заповнювачі секретів, такі як `***`.
Коли всі проблеми валідації обмежені `plugins.entries.<id>...`, OpenClaw
не виконує відновлення всього файла. Він зберігає поточну конфігурацію активною та
показує локальну помилку Plugin, щоб невідповідність схеми Plugin або версії хоста не
відкотила незв’язані користувацькі налаштування.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
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

  <Accordion title="Вибрати та налаштувати моделі">
    Налаштуйте основну модель і необов’язкові резервні моделі:

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

    - `agents.defaults.models` визначає каталог моделей і виконує роль allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскрипті/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у сценаріях із великою кількістю скриншотів.
    - Див. [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації та поведінки резервування.
    - Для користувацьких/self-hosted провайдерів див. [Custom providers](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код прив’язки для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або в парному сховищі allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати обмеження згадування в груповому чаті">
    Повідомлення в групах типово **вимагають згадки**. Налаштуйте шаблони для кожного агента:

    ```json5
    {
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
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для перевизначень по каналах і режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте конкретних
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

    - Не вказуйте `agents.defaults.skills`, якщо типово Skills не мають бути обмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Встановіть `agents.list[].skills: []`, щоб не було Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) і
      [довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану каналів gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, які виглядають застарілими:

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сеанси та скидання">
    Сеанси керують безперервністю розмов і ізоляцією:

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сеансів, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) для областей видимості, зв’язків ідентичностей і політики надсилання.
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

    Спочатку зберіть образ: `scripts/sandbox-setup.sh`

    Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Встановіть це в конфігурації gateway:

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

    Еквівалент у CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує грант надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потрібен токен relay для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було спарено застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційно розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання надходив до одного й того самого розгортання relay.

    Наскрізний процес:

    1. Встановіть офіційну/TestFlight збірку iOS, яку було скомпільовано з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дочекайтеся, поки підключаться сеанси як Node, так і оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest разом із квитанцією застосунку, а потім публікує payload `push.apns.register` через relay до спареного gateway.
    5. Gateway зберігає дескриптор relay і грант надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свій кешований запис реєстрації relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається шляхом обходу лише для розробки в loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Потік автентифікації та довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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

    - `every`: рядок тривалості (`30m`, `2h`). Установіть `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад, `discord`, `matrix`, `telegram` або `whatsapp`)
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

    - `sessionRetention`: очищати завершені сеанси ізольованих запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю рядків, що зберігаються.
    - Див. [завдання Cron](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
    Увімкніть HTTP-ендпойнти Webhook на Gateway:

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
    - Розглядайте весь вміст payload hook/webhook як недовірений вхідний сигнал.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхід Webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, які вибирає викликач.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил прив’язки та профілів доступу для кожного агента.

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

    - **Окремий файл**: замінює об’єкт, що його містить
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, що включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include окремого файла, такий як `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний запис наскрізь**: кореневі include, масиви include та include
      із сусідніми перевизначеннями завершуються безпечною відмовою для записів, якими керує OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору й циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
поки завершиться тимчасовий запис/перейменування редактора, читає фінальний файл і відхиляє
недійсні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують той самий бар’єр схеми перед записом; руйнівні затирання, такі
як видалення `gateway.mode` або зменшення файла більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Локальні збої валідації Plugin є винятком: якщо всі проблеми перебувають у
`plugins.entries.<id>...`, перезавантаження зберігає поточну конфігурацію та повідомляє про проблему Plugin
замість відновлення `.last-good`.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у журналах, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.   |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви керуєте ним самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлів. Зміни набувають чинності після наступного ручного перезапуску. |

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
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні               |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                           | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Ні                   |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження з авторського макета вихідного файла, а не зі сплощеного представлення в пам’яті.
Це робить рішення щодо гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними навіть тоді, коли
окремий розділ верхнього рівня розміщено у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується безпечною відмовою, якщо
макет вихідного файла неоднозначний.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, надавайте перевагу такому процесу:

- `config.schema.lookup`, щоб переглянути одне піддерево (неглибокий вузол схеми + зведення
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви справді хочете замінити всю конфігурацію
- `update.run` для явного самооновлення та перезапуску
- `update.status`, щоб перевірити sentinel останнього перезапуску після оновлення й підтвердити поточну версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як першу зупинку для точної
документації та обмежень на рівні полів. Використовуйте [довідник із конфігурації](/uk/gateway/configuration-reference),
коли їм потрібна ширша мапа конфігурації, значення за замовчуванням або посилання на спеціалізовані
довідники підсистем.

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`)
обмежуються до 3 запитів на 60 секунд для кожного `deviceId+clientIp`. Запити
на перезапуск об’єднуються, а потім застосовують 30-секундний cooldown між циклами перезапуску.
`update.status` доступний лише для читання, але має область admin, оскільки sentinel перезапуску може
містити зведення кроків оновлення та хвости виводу команд.
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
`note` і `restartDelayMs`. `baseHash` є обов’язковим для обох методів, якщо
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

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо це ввімкнено, а очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент змінної середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env var у значеннях конфігурації">
  Посилайтеся на змінні середовища в будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
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

Докладно про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) описано в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment) для повного опису пріоритетів і джерел.

## Повний довідник

Повний довідник по полях див. у **[Довіднику з конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник із конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
