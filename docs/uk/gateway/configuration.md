---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-05-07T13:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із symlink не підтримуються для записів, якими володіє OpenClaw; атомарний запис може замінити
шлях замість збереження symlink. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні стандартні значення. Поширені причини додати конфігурацію:

- Під’єднати канали й контролювати, хто може писати боту
- Задати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

Агенти та автоматизація мають використовувати `config.schema.lookup` для точних
документів на рівні полів перед редагуванням конфігурації. Використовуйте цю сторінку для практичних настанов
і [Довідник із конфігурації](/uk/gateway/configuration-reference) для ширшої
карти полів і стандартних значень.

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
  <Tab title="Control UI">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використайте вкладку **Config**.
    Control UI відображає форму з актуальної схеми конфігурації, включно з метаданими документації
    `title` / `description` для полів, а також схемами plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми в межах шляху плюс зведення безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора перевірка

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення змушують Gateway **відмовитися запускатися**. Єдиний виняток на кореневому рівні — `$schema` (string), щоб редактори могли прикріплювати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і перевірка. `config.schema.lookup` отримує один вузол у межах шляху плюс
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми plugin і каналів часу виконання об’єднуються, коли
завантажено реєстр manifest.

Коли перевірка не проходить:

- Gateway не завантажується
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому робочу копію після кожного успішного запуску,
але запуск і гаряче перезавантаження не відновлюють її автоматично. Якщо `openclaw.json`
не проходить перевірку (включно з локальною перевіркою plugin), запуск Gateway завершується невдало або
перезавантаження пропускається, а поточне середовище виконання зберігає останню прийняту конфігурацію.
Запустіть `openclaw doctor --fix` (або `--yes`), щоб відновити конфігурацію з префіксами/пошкоджену конфігурацію або
відновити останню відому робочу копію. Підвищення до останньої відомої робочої копії пропускається, коли
кандидат містить відредаговані плейсхолдери секретів, як-от `***`.

## Поширені завдання

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
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням зображень transcript/tool (стандартно `1200`); менші значення зазвичай зменшують використання vision-token у запусках із великою кількістю скриншотів.
    - Дивіться [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [Відмовостійкість моделей](/uk/concepts/model-failover) для ротації auth і поведінки fallback.
    - Для власних/self-hosted providers дивіться [Власні providers](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Контролювати, хто може писати боту">
    Доступ до DM контролюється окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (стандартно): невідомі відправники отримують одноразовий код pairing для підтвердження
    - `"allowlist"`: лише відправники в `allowFrom` (або в paired allow store)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати gating згадок у груповому чаті">
    Групові повідомлення стандартно **вимагають згадки**. Налаштуйте шаблони тригерів для кожного агента й залишайте видимі відповіді в кімнатах на стандартному шляху message-tool, якщо ви навмисно не хочете застарілих автоматичних фінальних відповідей:

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
    - Дивіться [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для режимів видимих відповідей, перевизначень по каналах і режиму self-chat.

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

    - Не вказуйте `agents.defaults.skills`, щоб Skills за замовчуванням були необмеженими.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
    - Задайте `agents.list[].skills: []`, щоб не було Skills.
    - Дивіться [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [Довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану каналів Gateway">
    Контролюйте, наскільки агресивно gateway перезапускає канали, що виглядають застарілими:

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

    - Задайте `gateway.channelHealthCheckMinutes: 0`, щоб вимкнути перезапуски монітором стану глобально.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Дивіться [Перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати timeout WebSocket handshake Gateway">
    Дайте локальним клієнтам більше часу, щоб завершити pre-auth WebSocket handshake на
    навантажених або малопотужних хостах:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Стандартне значення — `15000` мілісекунд.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` все ще має пріоритет для одноразових перевизначень сервісу або shell.
    - Спершу варто усунути зависання startup/event-loop; цей параметр призначений для хостів, які справні, але повільні під час warmup.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
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

    - `dmScope`: `main` (спільна) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні стандартні значення для маршрутизації thread-bound сесій (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Дивіться [Керування сесіями](/uk/concepts/session) для scoping, identity links і політики надсилання.
    - Дивіться [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію в sandbox">
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

    Спочатку зберіть образ: із checkout вихідного коду запустіть `scripts/sandbox-setup.sh`, або для встановлення з npm дивіться вбудовану команду `docker build` у [Sandboxing § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

    Повний посібник дивіться в [Sandboxing](/uk/gateway/sandboxing), а всі параметри — у [повному довіднику](/uk/gateway/config-agents#agentsdefaultssandbox).

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

    - Дозволяє gateway надсилати `push.test`, пробуджувальні nudges і reconnect wakes через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, переданий спареним iOS-застосунком. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з яким спарено iOS-застосунок, щоб інший gateway не міг повторно використати збережену реєстрацію.
    - Залишає локальні/ручні iOS-збірки на прямих APNs. Надсилання через relay застосовується лише до офіційних розповсюджених збірок, зареєстрованих через relay.
    - Має збігатися з базовою URL-адресою relay, вбудованою в офіційну/TestFlight iOS-збірку, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight iOS-збірку, скомпільовану з тією самою базовою URL-адресою relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте iOS-застосунок із gateway і дайте підключитися як сеансам node, так і operator.
    4. iOS-застосунок отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` із підтримкою relay до спареного gateway.
    5. Gateway зберігає handle relay і дозвіл на надсилання, а потім використовує їх для `push.test`, пробуджувальних nudges і reconnect wakes.

    Операційні примітки:

    - Якщо ви перемикаєте iOS-застосунок на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову iOS-збірку, що вказує на інше розгортання relay, застосунок оновлює свою кешовану реєстрацію relay замість повторного використання старого походження relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` досі працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним шляхом розробки лише для loopback; не зберігайте HTTP URL-адреси relay у конфігурації.

    Дивіться [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні check-ins)">
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
    - `directPolicy`: `allow` (за замовчуванням) або `block` для DM-подібних цілей Heartbeat
    - Повний посібник дивіться в [Heartbeat](/uk/gateway/heartbeat).

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

    - `sessionRetention`: очищати завершені ізольовані сеанси запусків із `sessions.json` (за замовчуванням `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Огляд функції та приклади CLI дивіться в [Завдання Cron](/uk/automation/cron-jobs).

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
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
    - Вважайте весь вміст payload hook/webhook недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; тримайте ingress Webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити вибрані викликачем ключі сеансів.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і строгій політиці інструментів (наприклад, лише messaging плюс sandboxing, де це можливо).

    Усі параметри mapping і інтеграцію Gmail дивіться в [повному довіднику](/uk/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію multi-agent">
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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) щодо правил binding і профілів доступу для кожного агента.

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
    - **Відносні шляхи**: розв’язуються відносно файла, який виконує include
    - **Записи, що належать OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний write-through**: root includes, масиви include та includes
      із сусідніми перевизначеннями fail closed для записів, що належать OpenClaw, замість
      вирівнювання конфігурації
    - **Обмеження**: шляхи `$include` мають розв’язуватися всередині каталогу, що містить
      `openclaw.json`. Щоб спільно використовувати дерево між машинами або користувачами, установіть
      `OPENCLAW_INCLUDE_ROOTS` у path-list (`:` на POSIX, `;` на Windows) з
      додаткових каталогів, на які можуть посилатися includes. Symlinks розв’язуються
      та перевіряються повторно, тому шлях, який лексично розташований у каталозі конфігурації, але чия
      реальна ціль виходить за межі кожного дозволеного root, усе одно відхиляється.
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок parsing і циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway спостерігає за `~/.openclaw/openclaw.json` і застосовує зміни автоматично: для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлів вважаються недовіреними, доки не пройдуть валідацію. Watcher чекає,
поки вщухнуть тимчасові записи/перейменування редактора, читає фінальний файл і відхиляє
недійсні зовнішні редагування без перезапису `openclaw.json`. Записи конфігурації, що належать OpenClaw,
використовують той самий schema gate перед записом; руйнівні перезаписи, як-от
видалення `gateway.mode` або зменшення файла більш ніж наполовину, відхиляються та
зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `config reload skipped (invalid config)` або startup повідомляє `Invalid
config`, перевірте конфігурацію, запустіть `openclaw config validate`, потім запустіть `openclaw
doctor --fix` для відновлення. Дивіться [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config)
для checklist.

### Режими перезавантаження

| Режим                 | Поведінка                                                                               |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово) | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**             | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск — ви виконуєте його. |
| **`restart`**         | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**             | Вимикає спостереження за файлами. Зміни набувають чинності після наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що гаряче застосовується, а що потребує перезапуску

Більшість полів гаряче застосовується без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) - усі вбудовані та Plugin-канали   | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `plugins`                                            | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їхня зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який посилаються через `$include`, OpenClaw планує
перезавантаження на основі вихідної авторської структури, а не сплощеного подання в пам’яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (гаряче застосування чи перезапуск), навіть коли
окремий розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується без змін, якщо
вихідна структура неоднозначна.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API Gateway, віддавайте перевагу такому процесу:

- `config.schema.lookup`, щоб перевірити одне піддерево (поверхневий вузол схеми + зведення дочірніх елементів)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null` видаляє, масиви замінюються)
- `config.apply` лише коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самооновлення з перезапуском; додайте `continuationMessage`, коли після перезапуску сеанс має виконати один подальший хід
- `update.status`, щоб перевірити останній sentinel перезапуску оновлення та підтвердити запущену версію після перезапуску

Агенти мають використовувати `config.schema.lookup` як першу точку для точних
документів і обмежень на рівні полів. Використовуйте [довідник конфігурації](/uk/gateway/configuration-reference),
коли потрібні ширша мапа конфігурації, значення за замовчуванням або посилання на окремі
довідники підсистем.

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`)
обмежені 3 запитами за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовується 30-секундна пауза між циклами перезапуску.
`update.status` доступний лише для читання, але має область адміністратора, оскільки sentinel перезапуску може
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
`note` та `restartDelayMs`. `baseHash` потрібен для обох методів, коли
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

<Accordion title="Імпорт середовища оболонки (необов’язково)">
  Якщо ввімкнено й очікувані ключі не задано, OpenClaw запускає вашу оболонку входу та імпортує лише відсутні ключі:

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

Докладні відомості про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [середовище](/uk/help/environment), щоб отримати повну інформацію про пріоритети та джерела.

## Повний довідник

Повний довідник по кожному полю див. у **[довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [приклади конфігурації](/uk/gateway/configuration-examples) · [довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
