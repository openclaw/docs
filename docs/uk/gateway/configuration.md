---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-03T17:12:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із симлінками не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження симлінка. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, спрямуйте `OPENCLAW_CONFIG_PATH` безпосередньо на справжній файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Під’єднати канали та керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сеанси, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів рівня окремих полів перед редагуванням конфігурації. Використовуйте цю сторінку для орієнтованих на завдання вказівок і
[довідник конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і значень за замовчуванням.

<Tip>
**Новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) із повними конфігураціями для копіювання.
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
  <Tab title="Інтерфейс керування">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Конфігурація**.
    Інтерфейс керування відображає форму з актуальної схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми з обмеженням за шляхом і зведення найближчих дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` напряму. Gateway відстежує файл і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, що повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` друкує канонічну JSON Schema, яку використовують інтерфейс керування
і валідація. `config.schema.lookup` отримує один вузол з обмеженням за шляхом і
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) та гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому справну копію після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить валідацію (зокрема локальну валідацію plugin), запуск Gateway завершується помилкою або
перезавантаження пропускається, а поточний runtime зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб виправити конфігурацію з префіксами/перезаписами або
відновити останню відому справну копію. Просування до останньої відомої справної копії пропускається, коли
кандидат містить редаговані заповнювачі секретів, як-от `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації під `channels.<provider>`. Див. спеціальну сторінку каналу для кроків налаштування:

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
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи allowlist без видалення наявних моделей. Прості заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень у стенограмі/інструментах (за замовчуванням `1200`); нижчі значення зазвичай зменшують використання vision-token у запусках із великою кількістю скриншотів.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [Відмовостійкість моделей](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервних варіантів.
    - Для власних/самостійно розгорнутих провайдерів див. [Власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може писати боту">
    Доступ DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (за замовчуванням): невідомі відправники отримують одноразовий код спарювання для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сховищі дозволених спарених)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей за каналами.

  </Accordion>

  <Accordion title="Налаштувати обмеження згадок у груповому чаті">
    Групові повідомлення за замовчуванням **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнаті на стандартному шляху message-tool, якщо ви навмисно не хочете застарілі автоматичні фінальні відповіді:

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
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень за каналами та режиму чату із самим собою.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте окремих
    агентів за допомогою `agents.list[].skills`:

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

    - Опустіть `agents.defaults.skills`, щоб Skills за замовчуванням були необмежені.
    - Опустіть `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Встановіть `agents.list[].skills: []`, щоб Skills не було.
    - Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану каналів Gateway">
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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати тайм-аут WebSocket-рукостискання Gateway">
    Дайте локальним клієнтам більше часу на завершення pre-auth WebSocket-рукостискання на
    навантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - За замовчуванням `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для одноразових перевизначень сервісу або shell.
    - Спершу краще виправити зависання запуску/event-loop; цей регулятор призначений для хостів, які справні, але повільні під час прогрівання.

  </Accordion>

  <Accordion title="Налаштувати сеанси та скидання">
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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сеансів, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) для областей дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнення ізоляції">
    Запускайте сеанси агентів в ізольованих середовищах виконання:

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

    Спочатку зберіть образ — із робочої копії джерельного коду запустіть `scripts/sandbox-setup.sh`, або для встановлення з npm дивіться вбудовану команду `docker build` у розділі [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Дивіться [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнення relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

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

    - Дає змогу gateway надсилати `push.test`, wake nudges і reconnect wakes через зовнішній relay.
    - Використовує scoped-to-registration дозвіл на надсилання, переданий спареним застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну relay-backed реєстрацію до ідентичності gateway, з яким було спарено застосунок iOS, тож інший gateway не зможе повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Relay-backed надсилання застосовуються лише до офіційних розповсюджуваних збірок, зареєстрованих через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дайте змогу сеансам node та оператора підключитися.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-backed payload `push.apns.register` у спарений gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, wake nudges і reconnect wakes.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви постачаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого relay origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише для розробки через loopback; не зберігайте HTTP URL relay у конфігурації.

    Дивіться [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Потік автентифікації та довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштування heartbeat (періодичних check-ins)">
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
    - `directPolicy`: `allow` (за замовчуванням) або `block` для DM-style цілей heartbeat
    - Дивіться [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

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

    - `sessionRetention`: очищає завершені ізольовані сеанси запусків із `sessions.json` (за замовчуванням `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: очищає `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Дивіться [Завдання Cron](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштування webhooks (hooks)">
    Увімкніть HTTP webhook endpoint-и на Gateway:

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
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте webhook ingress на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте чітко обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити session keys, вибрані викликачем.
    - Для агентів, керованих hooks, надавайте перевагу сильним сучасним рівням моделей і строгій політиці інструментів (наприклад, лише messaging плюс ізоляція, де це можливо).

    Дивіться [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштування маршрутизації multi-agent">
    Запускайте кількох ізольованих агентів з окремими робочими просторами та сеансами:

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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил binding і профілів доступу для окремих агентів.

  </Accordion>

  <Accordion title="Поділ конфігурації на кілька файлів ($include)">
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
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, який виконує include
    - **Записи, що належать OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений однофайловим include, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний write-through**: кореневі includes, масиви includes і includes
      із сусідніми перевизначеннями завершуються закрито для записів, що належать OpenClaw, замість
      flattening конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися в межах каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як список шляхів (`:` на POSIX, `;` на Windows) до
      додаткових каталогів, на які можуть посилатися includes. Символічні посилання розв’язуються
      й перевіряються повторно, тому шлях, який лексично розташований у каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного кореня, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично — ручний перезапуск не потрібен для більшості налаштувань.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Watcher чекає,
поки вщухне churn тимчасового запису/перейменування редактора, читає фінальний файл і відхиляє
некоректні зовнішні редагування без переписування `openclaw.json`. Записи конфігурації, що належать OpenClaw,
використовують той самий schema gate перед записом; руйнівні clobbers, як-от
видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються та
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або під час запуску повідомляється `Invalid
config`, перевірте конфігурацію, запустіть `openclaw config validate`, а потім запустіть `openclaw
doctor --fix` для ремонту. Дивіться [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для контрольного списку.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск — ви обробляєте це. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлів. Зміни набирають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів гаряче застосовуються без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані та plugin канали   | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їхня зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі авторського макета джерела, а не вирівняного подання в пам’яті.
Це робить рішення щодо гарячого перезавантаження (гаряче застосування чи перезапуск)
передбачуваними, навіть коли один верхньорівневий розділ міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується без змін, якщо
макет джерела неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, надавайте перевагу такому процесу:

- `config.schema.lookup`, щоб переглянути одне піддерево (неглибокий вузол схеми + зведення
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення разом із перезапуском; додайте `continuationMessage`, коли після перезапуску сесія має виконати один наступний хід
- `update.status`, щоб переглянути останній сторожовий маркер перезапуску після оновлення й перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як перше місце для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли потрібна ширша карта конфігурації, значення за замовчуванням або посилання на окремі
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`)
обмежені за частотою до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовується 30-секундний період очікування між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністративною областю, оскільки сторожовий маркер перезапуску може
містити зведення кроків оновлення та кінцеві фрагменти виводу команд.
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

<Accordion title="Env var substitution in config values">
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

Подробиці SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведені в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічені в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment), щоб дізнатися повний пріоритет і джерела.

## Повний довідник

Повний довідник за всіма полями див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
