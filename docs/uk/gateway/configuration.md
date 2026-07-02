---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-07-02T08:46:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символьними посиланнями не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження символьного посилання. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, спрямуйте `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Під’єднати канали й керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти й автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для орієнтованих на завдання порад і
[довідник із конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і значень за замовчуванням.

<Tip>
**Вперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Config**.
    Control UI відображає форму з живої схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми, обмежений шляхом, плюс зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Строга валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол, обмежений шляхом, плюс
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому справну копію після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить валідацію (включно з локальною валідацією plugin), запуск Gateway завершується невдачею або
перезавантаження пропускається, а поточний runtime зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб виправити конфігурацію з префіксами/перезаписами або
відновити останню відому справну копію. Підвищення до останньої відомої справної копії пропускається, коли
кандидат містить редаговані заповнювачі секретів, як-от `***`.

## Типові завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
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

    - `agents.defaults.models` визначає каталог моделей і діє як список дозволених для `/model`; записи `provider/*` фільтрують `/model`, `/models` і вибирачі моделей до вибраних провайдерів, водночас усе ще використовуючи динамічне виявлення моделей.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до списку дозволених без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у transcript/tool (типово `1200`); нижчі значення зазвичай зменшують використання vision-token у запусках із великою кількістю скриншотів.
    - Дивіться [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервування.
    - Для власних/self-hosted провайдерів дивіться [Custom providers](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може писати боту">
    Доступ до DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники в `allowFrom` (або в сховищі дозволених після сполучення)
    - `"open"`: дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або списки дозволених, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для подробиць щодо кожного каналу.

  </Accordion>

  <Accordion title="Налаштувати обмеження згадок у груповому чаті">
    Групові повідомлення типово **потребують згадки**. Налаштуйте шаблони тригерів для кожного агента. Звичайні відповіді в групах/каналах публікуються автоматично; увімкніть шлях message-tool для спільних кімнат, де агент має вирішувати, коли говорити:

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
    - **Видимі відповіді**: `messages.visibleReplies` може глобально вимагати надсилання через message-tool; `messages.groupChat.visibleReplies` перевизначає це для груп/каналів.
    - Дивіться [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень для кожного каналу та режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
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

    - Пропустіть `agents.defaults.skills`, щоб Skills були необмежені за замовчуванням.
    - Пропустіть `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Задайте `agents.list[].skills: []`, щоб не було Skills.
    - Дивіться [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг справності каналів gateway">
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

    - Задайте `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора справності.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Дивіться [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати тайм-аут WebSocket-рукостискання gateway">
    Дайте локальним клієнтам більше часу, щоб завершити pre-auth WebSocket-рукостискання на
    навантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Типове значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` усе ще має пріоритет для одноразових перевизначень сервісу або shell.
    - Спершу краще виправити зависання запуску/event-loop; цей параметр призначений для хостів, які справні, але повільні під час прогрівання.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
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
    - `threadBindings`: глобальні стандартні значення для маршрутизації сесій, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) щодо областей дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути пісочницю">
    Запускайте сесії агентів в ізольованих середовищах виконання пісочниці:

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

    Спочатку зберіть образ - із вихідного checkout запустіть `scripts/sandbox-setup.sh`, або з npm-інсталяції див. вбудовану команду `docker build` у [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Див. [Пісочниця](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay для публічних збірок App Store використовує розміщений relay OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Власні розгортання relay потребують навмисно окремого шляху збірки/розгортання iOS, URL relay якого збігається з URL relay Gateway. Якщо ви використовуєте власну збірку relay, задайте це в конфігурації Gateway:

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

    - Дає Gateway змогу надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання з областю реєстрації, переданий спареною програмою iOS. Gateway не потребує токена relay для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності Gateway, з якою була спарена програма iOS, щоб інший Gateway не міг повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовуються лише до офіційно розповсюджених збірок, зареєстрованих через relay.
    - Має збігатися з базовим URL relay, вбудованим у збірку iOS, щоб трафік реєстрації та надсилання доходив до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну програму iOS.
    2. Необов’язково: налаштуйте `gateway.push.apns.relay.baseUrl` на Gateway лише під час використання навмисно окремої власної збірки relay.
    3. Спаруйте програму iOS із Gateway і дозвольте підключитися як сесіям вузла, так і оператора.
    4. Програма iOS отримує ідентичність Gateway, реєструється в relay за допомогою App Attest плюс квитанції програми, а потім публікує підтримане relay корисне навантаження `push.apns.register` у спарений Gateway.
    5. Gateway зберігає дескриптор relay і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте програму iOS на інший Gateway, повторно підключіть програму, щоб вона могла опублікувати нову реєстрацію relay, прив’язану до цього Gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, програма оновлює свою кешовану реєстрацію relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - Власні URL relay Gateway мають збігатися з базовим URL relay, вбудованим у збірку iOS. Публічний release lane App Store відхиляє власні перевизначення URL relay iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише для розробки на loopback; не зберігайте URL HTTP relay у конфігурації.

    Див. [Програма iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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

    - `every`: рядок тривалості (`30m`, `2h`). Задайте `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (стандартно) або `block` для цілей Heartbeat у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати завдання Cron">
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

    - `sessionRetention`: видаляти завершені ізольовані сесії запусків із `sessions.json` (стандартно `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: обрізати збережені рядки історії запусків Cron для кожного завдання. `maxBytes` залишається прийнятим для старіших файлових журналів запусків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати вебхуки (hooks)">
    Увімкніть HTTP-ендпоїнти Webhook на Gateway:

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
    - Розглядайте весь вміст корисного навантаження hook/webhook як недовірений ввід.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно активні секрети автентифікації Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний трафік webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, вибрані викликачем.
    - Для агентів, керованих hook, надавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише messaging плюс пісочниця, де можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
    Запускайте кілька ізольованих агентів з окремими робочими просторами та сесіями:

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

    Див. [Кілька агентів](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил прив’язування та профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділити конфігурацію на кілька файлів ($include)">
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
    - **Масив файлів**: глибоко об’єднується за порядком (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів углиб
    - **Відносні шляхи**: розв’язуються відносно файлу, що включає
    - **Формат шляху**: шляхи include не мають містити null bytes і мають бути строго коротшими за 4096 символів до та після розв’язання
    - **Записи, якими володіє OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі include, масиви include та include
      із сусідніми перевизначеннями завершуються закритою помилкою для записів, якими володіє OpenClaw, замість
      сплющення конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися під каталогом, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, задайте
      `OPENCLAW_INCLUDE_ROOTS` як список шляхів (`:` у POSIX, `;` у Windows) до
      додаткових каталогів, на які можуть посилатися include. Symlink розв’язуються
      та перевіряються повторно, тому шлях, який лексично перебуває в каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного кореня, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору, циклічних include, недійсного формату шляху та надмірної довжини

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і застосовує зміни автоматично - ручний перезапуск для більшості налаштувань не потрібен.

Пряме редагування файлів вважається недовіреним, доки воно не пройде перевірку. Watcher чекає,
поки вщухне churn тимчасових записів/перейменувань редактора, читає фінальний файл і відхиляє
недійсні зовнішні редагування без перезапису `openclaw.json`. Записи конфігурації,
якими володіє OpenClaw, використовують той самий schema gate перед записом; руйнівні clobber, як-от
видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються і
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або під час запуску повідомляється `Invalid
config`, перевірте конфігурацію, запустіть `openclaw config validate`, а потім запустіть `openclaw
doctor --fix` для ремонту. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для checklist.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (стандартно) | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних. |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск - ви виконуєте його. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                 |
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
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Канали              | `channels.*`, `web` (WhatsApp) - усі вбудовані та Plugin-канали   | Ні              |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                            | Ні              |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                | Ні              |
| Сесії та повідомлення | `session`, `messages`                                           | Ні              |
| Інструменти та медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні              |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                           | Ні              |
| Сервер Gateway      | `gateway.*` (порт, прив’язка, автентифікація, Tailscale, TLS, HTTP) | **Так**        |
| Інфраструктура      | `discovery`, `plugins`                                            | **Так**         |

<Note>
`gateway.reload` і `gateway.remote` є винятками - їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі авторської структури джерела, а не сплющеного подання в пам’яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (гаряче застосування проти перезапуску), навіть коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується закритою відмовою, якщо
структура джерела неоднозначна.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, віддавайте перевагу такому процесу:

- `config.schema.lookup`, щоб переглянути одне піддерево (поверхневий вузол схеми + зведення дочірніх
  елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються, коли це явно підтверджено через `replacePaths`, якщо
  записи буде видалено)
- `config.apply` лише коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сесія має виконати один додатковий хід
- `update.status`, щоб переглянути останній маркер перезапуску оновлення та перевірити запущену версію після перезапуску

Агенти мають розглядати `config.schema.lookup` як першу точку для точних
документів і обмежень на рівні полів. Використовуйте [Довідник конфігурації](/uk/gateway/configuration-reference),
коли потрібна ширша карта конфігурації, стандартні значення або посилання на окремі
довідники підсистем.

<Note>
Записи площини керування (`config.apply`, `config.patch`, `update.run`) мають
ліміт частоти: 3 запити за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовується 30-секундна пауза між циклами перезапуску.
`update.status` доступний лише для читання, але обмежений адміністратором, оскільки маркер перезапуску може
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
`note` та `restartDelayMs`. `baseHash` обов’язковий для обох методів, коли
конфігурація вже існує.

`config.patch` також приймає `replacePaths`, масив шляхів конфігурації, для яких заміна масиву
є навмисною. Якщо патч замінив би або видалив наявний масив
з меншою кількістю записів, Gateway відхиляє запис, якщо цей точний шлях не вказано
в `replacePaths`; вкладені масиви в записах масиву використовують `[]`, наприклад
`agents.list[].skills`. Це запобігає тому, щоб обрізані знімки `config.get`
непомітно перезаписували маршрутизацію або масиви списків дозволів. Використовуйте `config.apply`, коли ви
маєте намір замінити всю конфігурацію.

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

Подробиці SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) наведено в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment), щоб отримати повний порядок пріоритетів і джерела.

## Повний довідник

Повний довідник за всіма полями див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
