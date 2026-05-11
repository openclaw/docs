---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: типові завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-11T20:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символічними посиланнями не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження символічного посилання. Якщо ви зберігаєте конфігурацію поза
типовим каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали й керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для орієнтованих на завдання вказівок і
[Довідник конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і типових значень.

<Tip>
**Уперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з готовими конфігураціями для копіювання.
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
    Control UI відображає форму з живої схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним варіантом. Для UI деталізації
    та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху плюс зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway спостерігає за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора перевірка

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і перевірка. `config.schema.lookup` отримує один вузол у межах шляху плюс
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елемент масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів об’єднуються, коли завантажено
реєстр маніфестів.

Коли перевірка не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому справну копію після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить перевірку (включно з локальною перевіркою plugin), запуск Gateway завершується помилкою або
перезавантаження пропускається, а поточний runtime зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб відремонтувати конфігурацію з префіксами/перезаписану конфігурацію або
відновити останню відому справну копію. Просування до останньої відомої справної версії пропускається, коли
кандидат містить замасковані заповнювачі секретів, як-от `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Перегляньте окрему сторінку каналу для кроків налаштування:

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

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`; записи `provider/*` фільтрують `/model`, `/models` і засоби вибору моделей до вибраних провайдерів, водночас продовжуючи використовувати динамічне виявлення моделей.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видаляли б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень transcript/tool (типово `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю скріншотів.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [Відмовостійкість моделей](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервних варіантів.
    - Для користувацьких/самостійно розміщених провайдерів див. [Користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або у сховищі дозволених сполучених)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей за каналами.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Групові повідомлення типово **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнаті на типовому шляху message-tool, якщо ви навмисно не хочете застарілі автоматичні фінальні відповіді:

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
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень за каналами та режиму self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
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

    - Пропустіть `agents.defaults.skills`, щоб типово не обмежувати skills.
    - Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
    - Встановіть `agents.list[].skills: []`, щоб не мати skills.
    - Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [Довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Перевірки стану](/uk/gateway/health) для операційного налагодження і [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

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
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` і надалі має пріоритет для одноразових перевизначень сервісу або shell.
    - Спочатку бажано виправити затримки запуску/event-loop; цей параметр призначений для хостів, які справні, але повільні під час прогріву.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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
    - `threadBindings`: глобальні типові значення для маршрутизації сеансів, прив’язаних до потоку (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) для областей дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

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

    Спершу зберіть образ: з checkout вихідного коду запустіть `scripts/sandbox-setup.sh`, або для встановлення з npm див. вбудовану команду `docker build` у [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через реле для офіційних збірок iOS">
    Push через реле налаштовується в `openclaw.json`.

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

    - Дозволяє gateway надсилати `push.test`, імпульси пробудження та пробудження повторного підключення через зовнішнє реле.
    - Використовує дозвіл на надсилання з областю реєстрації, пересланий спарованим застосунком iOS. Gateway не потребує токена реле для всього розгортання.
    - Прив’язує кожну реєстрацію через реле до ідентичності gateway, з яким спаровано застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через реле застосовується лише до офіційних розповсюджених збірок, зареєстрованих через реле.
    - Має збігатися з базовою URL-адресою реле, вбудованою в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання доходив до того самого розгортання реле.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тією самою базовою URL-адресою реле.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спаруйте застосунок iOS із gateway і дозвольте підключитися як сеансам вузла, так і сеансам оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в реле за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через реле до спарованого gateway.
    5. Gateway зберігає handle реле та дозвіл на надсилання, а потім використовує їх для `push.test`, імпульсів пробудження та пробуджень повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову реєстрацію реле, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання реле, застосунок оновлює кешовану реєстрацію реле замість повторного використання старого джерела реле.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише для розробки через local loopback; не зберігайте HTTP URL-адреси реле в конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Автентифікація і потік довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки реле.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні відмітки)">
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
    - `directPolicy`: `allow` (типово) або `block` для цілей heartbeat у стилі DM
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

    - `sessionRetention`: очищає завершені ізольовані сеанси запуску з `sessions.json` (типово `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: очищає `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (хуки)">
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
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте чітко обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, вибрані викликачем.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де можливо).

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

    - **Один файл**: замінює об’єкт, що його містить
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має перевагу)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, що виконує include
    - **Записи, що належать OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підтриманий include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі include, масиви include та include
      із сусідніми перевизначеннями fail closed для записів, що належать OpenClaw, замість
      сплющення конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися в межах каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як список шляхів (`:` на POSIX, `;` на Windows) додаткових
      каталогів, на які можуть посилатися include. Символічні посилання розв’язуються
      й перевіряються повторно, тому шлях, який лексично міститься в каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного кореня, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway спостерігає за `~/.openclaw/openclaw.json` і застосовує зміни автоматично: для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
доки завершаться тимчасові записи/перейменування редактора, читає фінальний файл і відхиляє
некоректні зовнішні редагування без перезапису `openclaw.json`. Записи конфігурації,
що належать OpenClaw, використовують той самий schema gate перед записом; руйнівні перезаписи, як-от
видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються та
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або під час запуску повідомляється `Invalid
config`, перевірте конфігурацію, запустіть `openclaw config validate`, а потім запустіть `openclaw
doctor --fix` для виправлення. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для контрольного списку.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск: ви обробляєте це. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає спостереження за файлами. Зміни набувають чинності після наступного ручного перезапуску. |

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
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) - усі вбудовані канали та канали Plugin | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `plugins`                                            | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками - їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі авторської структури джерела, а не вирівняного подання в пам'яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (гаряче застосування чи перезапуск) навіть коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується закритою відмовою, якщо
структура джерела неоднозначна.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, надавайте перевагу такому потоку:

- `config.schema.lookup`, щоб переглянути одне піддерево (поверхневий вузол схеми + зведення
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об'єкти об'єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сеанс має виконати один наступний хід
- `update.status`, щоб переглянути останній sentinel перезапуску оновлення та перевірити запущену версію після перезапуску

Агенти мають сприймати `config.schema.lookup` як першу зупинку для точних
документів і обмежень на рівні поля. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли їм потрібна ширша карта конфігурації, стандартні значення або посилання на спеціалізовані
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`)
обмежені за частотою до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об'єднуються, а потім застосовують 30-секундний період очікування між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністративною областю, оскільки sentinel перезапуску може
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

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із файлів не перевизначає наявні змінні середовища. Ви також можете задати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт середовища shell (необов'язково)">
  Якщо ввімкнено і очікувані ключі не задані, OpenClaw запускає ваш login shell та імпортує лише відсутні ключі:

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

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні або порожні змінні спричиняють помилку під час завантаження
- Екрануйте за допомогою `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
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

Подробиці SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Повний пріоритет і джерела див. у [Середовище](/uk/help/environment).

## Повний довідник

Повний довідник за кожним полем див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов'язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов'язано

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
