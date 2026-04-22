---
read_when:
    - Налаштування OpenClaw уперше
    - Шукаєте поширені шаблони конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-22T22:50:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b8fccabd04e075f3a59c3b94fe11eca19ddffa2e405d76a9fe92be38ea5a8da
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та завертальні коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях до конфігурації має вказувати на звичайний файл. Схеми
`openclaw.json` із символічними посиланнями не підтримуються для записів,
якими керує OpenClaw; атомарний запис може замінити шлях замість збереження
символічного посилання. Якщо ви зберігаєте конфігурацію поза типовим
каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) із готовими конфігураціями для копіювання та вставлення.
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
    openclaw onboard       # повний процес початкового налаштування
    openclaw configure     # майстер конфігурації
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використовуйте вкладку **Config**.
    Control UI відображає форму на основі живої схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами plugin і каналів,
    коли вони доступні, з редактором **Raw JSON** як запасним варіантом. Для
    деталізованих UI та інших інструментів gateway також надає `config.schema.lookup` для
    отримання одного вузла схеми, обмеженого шляхом, разом із підсумками
    безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призведуть до того, що Gateway **відмовиться запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

Нотатки щодо інструментів схем:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Розглядайте цей вивід схеми як канонічний машиночитаний контракт для
  `openclaw.json`; цей огляд і довідник з конфігурації його узагальнюють.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів і інструментів побудови форм.
- Вкладені об’єкти, записи з шаблоном (`*`) і елементи масиву (`[]`) успадковують ті самі
  метадані документації, де існує відповідна документація поля.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ту саму довідку полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові обмеження
  та схожі поля валідації), відповідними метаданими підказок UI і підсумками
  безпосередніх дочірніх елементів для інструментів деталізації.
- Схеми runtime plugin/каналів об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між артефактами базових конфігурацій
  для документації та поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Виконайте `openclaw doctor`, щоб побачити точні проблеми
- Виконайте `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню відому справну копію після успішного запуску. Якщо
`openclaw.json` пізніше змінено поза OpenClaw і він більше не проходить валідацію, під час запуску
та гарячого перезавантаження пошкоджений файл зберігається як знімок `.clobbered.*` із часовою
міткою, відновлюється остання відома справна копія, а в журнали записується
помітне попередження з причиною відновлення. Відновлення під час читання на
запуску також розглядає різке зменшення розміру, відсутність метаданих
конфігурації та відсутність `gateway.mode` як критичні ознаки пошкодження, якщо
в останній відомій справній копії ці поля були.
Якщо рядок статусу/журналу випадково додається на початку перед інакше
коректною JSON-конфігурацією, запуск gateway і `openclaw doctor --fix` можуть
видалити цей префікс, зберегти забруднений файл як `.clobbered.*` і продовжити
роботу з відновленим JSON.
Наступний хід основного агента також отримує попередження про системну подію, яке повідомляє,
що конфігурацію було відновлено і її не можна бездумно перезаписувати. Підвищення статусу
останньої відомої справної копії оновлюється після валідованого запуску та після прийнятих
гарячих перезавантажень, включно із записами конфігурації, якими керує OpenClaw, коли хеш
збереженого файла все ще збігається з прийнятим записом. Підвищення статусу пропускається,
якщо кандидат містить замасковані заповнювачі секретів, такі як `***` або скорочені значення токенів.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Перегляньте окрему сторінку каналу для кроків налаштування:

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

  <Accordion title="Вибрати та налаштувати моделі">
    Установіть основну модель і необов’язкові резервні:

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
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскрипті/інструментах (типове значення `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю скриншотів.
    - Перегляньте [Models CLI](/uk/concepts/models), щоб перемикати моделі в чаті, і [Model Failover](/uk/concepts/model-failover), щоб дізнатися про ротацію автентифікації та поведінку резервного перемикання.
    - Для користувацьких/self-hosted provider перегляньте [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або списки дозволених, специфічні для каналу.

    Перегляньте [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access), щоб дізнатися деталі для кожного каналу.

  </Accordion>

  <Accordion title="Налаштувати gating згадувань у груповому чаті">
    Для групових повідомлень типовим є режим **вимагати згадування**. Налаштуйте шаблони для кожного агента:

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

    - **Згадування в метаданих**: нативні @-згадування (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
    - Перегляньте [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating), щоб дізнатися про перевизначення для окремих каналів і режим self-chat.

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

    - Опустіть `agents.defaults.skills`, щоб за замовчуванням Skills не були обмежені.
    - Опустіть `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Установіть `agents.list[].skills: []`, щоб не використовувати Skills.
    - Перегляньте [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [Довідник з конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану каналів gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, які виглядають неактивними:

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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски моніторингу стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального моніторингу.
    - Перегляньте [Health Checks](/uk/gateway/health) для операційного налагодження і [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю розмови та ізоляцією:

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Перегляньте [Керування сесіями](/uk/concepts/session), щоб дізнатися про область дії, зв’язки ідентичностей і політику надсилання.
    - Перегляньте [повний довідник](/uk/gateway/configuration-reference#session), щоб побачити всі поля.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агентів в ізольованих runtime ізоляції:

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

    Перегляньте [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Установіть це в конфігурації gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Необов’язково. Типове значення: 10000
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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та пробудження для перепідключення через зовнішній relay.
    - Використовує право надсилання, обмежене реєстрацією, яке пересилає спарений застосунок iOS. Gateway не потрібен relay-токен для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою був спарений застосунок iOS, тож інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовуються лише до офіційно розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Повний потік роботи:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дозвольте підключитися як сесіям node, так і сесіям оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до спареного gateway.
    5. Gateway зберігає relay handle і право надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для перепідключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює кешовану реєстрацію relay замість повторного використання старого relay origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається доступним лише для loopback аварійним варіантом розробки; не зберігайте HTTP URL relay у конфігурації.

    Перегляньте [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для повного потоку та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - Перегляньте [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати завдання Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: очищення завершених ізольованих сесій запуску з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищення `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Перегляньте [Завдання Cron](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook-и (hooks)">
    Увімкніть HTTP endpoint-и Webhook на Gateway:

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
    - Вважайте весь вміст payload hook/Webhook ненадійним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для вхідних Webhook окремий підшлях, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте строго обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які може вибирати викликач.
    - Для агентів, що працюють через hooks, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де це можливо).

    Перегляньте [повний довідник](/uk/gateway/configuration-reference#hooks), щоб побачити всі параметри mapping і інтеграцію з Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
    Запускайте кількох ізольованих агентів з окремими робочими просторами та сесіями:

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

    Перегляньте [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing), щоб дізнатися про правила binding і профілі доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після include-ів (перевизначають включені значення)
    - **Вкладені include-и**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, який виконує включення
    - **Обробка помилок**: чіткі помилки для відсутніх файлів, помилок парсингу та циклічних include-ів

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

Прямі зміни файлу вважаються ненадійними, доки не пройдуть валідацію. Спостерігач
чекає, поки завершиться тимчасовий запис/перейменування редактора, зчитує
фінальний файл і відхиляє недійсні зовнішні зміни, відновлюючи останню відому
справну конфігурацію. Записи конфігурації, якими керує OpenClaw, проходять ту саму перевірку схемою перед записом; руйнівні пошкодження, такі
як видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите в журналах `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Перегляньте [Усунення проблем Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config),
щоб ознайомитися з контрольним списком відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Для критичних змін автоматично перезапускає. |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлу. Зміни набудуть чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія            | Поля                                                              | Потрібен перезапуск? |
| -------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали               | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали plugin | Ні                   |
| Агент і моделі       | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація        | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                            | Ні                   |
| Інструменти й медіа  | `tools`, `browser`, `skills`, `audio`, `talk`                     | Ні                   |
| UI та інше           | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура       | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** спричиняє перезапуск.
</Note>

## RPC конфігурації (програмні оновлення)

<Note>
RPC керувальної площини для запису (`config.apply`, `config.patch`, `update.run`) обмежуються до **3 запитів за 60 секунд** на `deviceId+clientIp`. При спрацюванні обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий потік:

- `config.schema.lookup`: перевірка одного піддерева конфігурації, обмеженого шляхом, з поверхневим
  вузлом схеми, відповідними метаданими підказок і підсумками безпосередніх дочірніх елементів
- `config.get`: отримання поточного знімка + hash
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Коли ви не замінюєте всю конфігурацію, віддавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Виконує валідацію + записує повну конфігурацію та перезапускає Gateway за один крок.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (optional) — hash конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (optional) — ключ сесії для wake-up ping після перезапуску
    - `note` (optional) — примітка для restart sentinel
    - `restartDelayMs` (optional) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє 30-секундний cooldown.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (часткове оновлення)">
    Об’єднує часткове оновлення з наявною конфігурацією (семантика JSON merge patch):

    - Об’єкти об’єднуються рекурсивно
    - `null` видаляє ключ
    - Масиви замінюються

    Параметри:

    - `raw` (string) — JSON5 лише з тими ключами, які потрібно змінити
    - `baseHash` (required) — hash конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — такі самі, як у `config.apply`

    Поведінка перезапуску збігається з `config.apply`: об’єднання відкладених перезапусків плюс 30-секундний cooldown між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw зчитує env vars з батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо є)
- `~/.openclaw/.env` (глобальний запасний варіант)

Жоден із цих файлів не перевизначає наявні env vars. Ви також можете встановлювати вбудовані env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо ввімкнено і очікувані ключі не встановлено, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env var у значеннях конфігурації">
  Посилайтеся на env vars у будь-якому рядковому значенні конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Використовуйте `$${VAR}` для буквального виводу
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

Докладно про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) можна прочитати в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Перегляньте [Середовище](/uk/help/environment), щоб дізнатися про повний пріоритет і джерела.

## Повний довідник

Повний довідник по полях дивіться в **[Довіднику з конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник з конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
