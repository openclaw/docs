---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Навігація до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-06T03:19:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із symlink не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження symlink. Якщо ви зберігаєте конфігурацію поза
типовим каталогом стану, укажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали й керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для кожного доступного поля.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних документаційних
описів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для орієнтованих на задачі вказівок і
[довідник конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і типових значень.

<Tip>
**Новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [прикладів конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання й вставлення.
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
    Інтерфейс керування відтворює форму з live-схеми конфігурації, зокрема
    документаційні метадані полів `title` / `description`, а також схеми plugin і каналу, коли
    вони доступні, з редактором **Raw JSON** як аварійним виходом. Для деталізованих
    UI та іншого інструментарію Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху та зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` напряму. Gateway стежить за файлом і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують інтерфейс керування
і валідація. `config.schema.lookup` отримує один вузол у межах шляху та
зведення дочірніх елементів для інструментарію деталізації. Документаційні метадані полів `title`/`description`
проходять крізь вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Runtime-схеми plugin і каналів об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація завершується помилкою:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену копію останньої відомої доброї конфігурації після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить валідацію (зокрема локальну валідацію plugin), запуск Gateway завершується помилкою або
перезавантаження пропускається, а поточний runtime зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб відновити конфігурацію з префіксами/перезаписами або
повернути останню відому добру копію. Просування до останньої відомої доброї конфігурації пропускається, коли
кандидат містить відредаговані placeholder секретів, як-от `***`.

## Поширені задачі

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Дивіться спеціальну сторінку каналу для кроків налаштування:

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

    Усі канали мають однаковий шаблон політики DM:

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

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень транскрипту/інструментів (типово `1200`); нижчі значення зазвичай зменшують використання vision-токенів під час запусків із великою кількістю скриншотів.
    - Дивіться [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервного переходу.
    - Для користувацьких/self-hosted провайдерів дивіться [Custom providers](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керуйте тим, хто може надсилати повідомлення боту">
    Доступ до DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або в сховищі дозволених сполучених відправників)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Перегляньте [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей за каналами.

  </Accordion>

  <Accordion title="Налаштуйте обмеження згадками для групового чату">
    Групові повідомлення типово **вимагають згадки**. Налаштуйте шаблони запуску для кожного агента та залишайте видимі відповіді в кімнаті на типовому шляху message-tool, якщо ви навмисно не хочете застарілих автоматичних фінальних відповідей:

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
    - Перегляньте [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) щодо режимів видимих відповідей, перевизначень для окремих каналів і режиму чату із собою.

  </Accordion>

  <Accordion title="Обмежте Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте конкретних
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

    - Не вказуйте `agents.defaults.skills`, щоб Skills типово були необмеженими.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Задайте `agents.list[].skills: []`, щоб Skills не було.
    - Дивіться [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштуйте моніторинг справності каналів Gateway">
    Керуйте тим, наскільки агресивно Gateway перезапускає канали, які здаються застарілими:

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

    - Задайте `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора справності.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Перегляньте [перевірки справності](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштуйте тайм-аут WebSocket handshake Gateway">
    Дайте локальним клієнтам більше часу для завершення WebSocket handshake перед автентифікацією на
    навантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Типове значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для одноразових перевизначень сервісу або оболонки.
    - Спершу бажано виправити зависання запуску або event loop; цей параметр призначений для хостів, які справні, але повільні під час прогрівання.

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

    - `dmScope`: `main` (спільна) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Дивіться [керування сесіями](/uk/concepts/session) щодо областей дії, зв’язків ідентичностей і політики надсилання.
    - Дивіться [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
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

    Спочатку зберіть образ: з робочої копії джерельного коду запустіть `scripts/sandbox-setup.sh`, або для встановлення з npm дивіться вбудовану команду `docker build` у [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Дивіться [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Задайте це в конфігурації gateway:

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

    - Дозволяє gateway надсилати `push.test`, wake nudges і пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання з областю реєстрації, переданий спареним застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою спарено застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовуються лише до офіційних розповсюджених збірок, які зареєструвалися через relay.
    - Має збігатися з базовою URL-адресою relay, вбудованою в офіційну/TestFlight збірку iOS, щоб реєстраційний трафік і трафік надсилання потрапляли до того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тією самою базовою URL-адресою relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дозвольте підключитися сеансам node та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` із підтримкою relay до спареного gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, wake nudges і пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свою кешовану реєстрацію relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` досі працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається development escape hatch лише для loopback; не зберігайте HTTP URL-адреси relay у конфігурації.

    Дивіться [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - `target`: `last` | `none` | `<channel-id>` (наприклад `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі DM
    - Дивіться [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

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

    - `sessionRetention`: видаляє завершені ізольовані сеанси запуску з `sessions.json` (типово `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: обрізає `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Дивіться [Завдання Cron](/uk/automation/cron-jobs) для огляду можливості та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати webhooks (hooks)">
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
    - Вважайте весь вміст payload hook/webhook недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте webhook ingress на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити session keys, вибрані викликачем.
    - Для агентів, керованих hook, надавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише messaging плюс ізоляція, де це можливо).

    Дивіться [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил прив’язування та профілів доступу окремих агентів.

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
    - **Масив файлів**: глибоко об’єднується по порядку (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, який виконує include
    - **Записи, що належать OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний write-through**: root includes, масиви include та includes
      із сусідніми перевизначеннями завершуються закрито для записів, що належать OpenClaw, замість
      вирівнювання конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися в межах каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як список шляхів (`:` у POSIX, `;` у Windows) до
      додаткових каталогів, на які можуть посилатися includes. Symlinks розв’язуються
      та перевіряються повторно, тому шлях, який лексично міститься в каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного root, усе одно відхиляється.
    - **Обробка помилок**: чіткі помилки для відсутніх файлів, помилок розбору та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично: для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть перевірку. Watcher чекає,
доки завершиться тимчасовий запис/перейменування редактором, читає остаточний файл і відхиляє
недійсні зовнішні редагування без перезапису `openclaw.json`. Записи конфігурації,
що належать OpenClaw, використовують той самий schema gate перед записом; destructive clobbers, як-от
видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються та
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або запуск повідомляє `Invalid
config`, перевірте конфігурацію, запустіть `openclaw config validate`, а потім запустіть `openclaw
doctor --fix` для відновлення. Дивіться [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для контрольного списку.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск: ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає спостереження за файлами. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що гаряче застосовується, а що потребує перезапуску

Більшість полів гаряче застосовуються без простою. У режимі `hybrid` зміни, які потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) - усі вбудовані та plugin канали   | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками: їхня зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який посилається `$include`, OpenClaw планує
перезавантаження з макета, створеного у вихідних файлах, а не зі сплющеного подання в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними навіть тоді, коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження безпечно завершується помилкою, якщо
вихідний макет неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, віддавайте перевагу такому процесу:

- `config.schema.lookup`, щоб перевірити одне піддерево (поверхневий вузол схеми + зведення дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сеанс має виконати один наступний хід
- `update.status`, щоб перевірити останній маркер перезапуску після оновлення та підтвердити запущену версію після перезапуску

Агенти мають вважати `config.schema.lookup` першою точкою звернення для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли їм потрібна ширша карта конфігурації, значення за замовчуванням або посилання на окремі
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`)
обмежені 3 запитами за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, після чого застосовується 30-секундна пауза між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністраторською областю, оскільки маркер перезапуску може
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
`note` і `restartDelayMs`. `baseHash` потрібен для обох методів, коли
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

Див. [Середовище](/uk/help/environment), щоб отримати повний порядок пріоритетів і джерела.

## Повний довідник

Повний довідник по кожному полю див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
