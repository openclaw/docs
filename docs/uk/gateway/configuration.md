---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-22T21:30:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36162008b66dcaaac6d51882f20d74aebd9b637bfddde00395cdfbd5721e3d20
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (Cron, хуки)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з готовими конфігураціями для копіювання.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Config**.
    Control UI відображає форму на основі актуальної схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами Plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми для заданого шляху разом із підсумками безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Вважайте цей вивід схеми канонічним машиночитаним контрактом для
  `openclaw.json`; цей огляд і довідник конфігурації його узагальнюють.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів та інструментів форм.
- Вкладені об’єкти, шаблони з wildcard (`*`) і елементи масиву (`[]`) успадковують ті самі
  метадані документації, якщо для відповідного поля є документація.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ті самі підказки для полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі
  та подібні поля валідації), відповідними метаданими підказок UI і стислими описами
  безпосередніх дочірніх елементів для інструментів деталізації.
- Схеми Plugin/каналів під час виконання об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між артефактами базової конфігурації для документації
  і поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню відому справну копію після успішного запуску. Якщо
`openclaw.json` пізніше буде змінено поза OpenClaw і він більше не проходитиме валідацію, під час запуску
та гарячого перезавантаження зіпсований файл буде збережено як позначений часовою міткою знімок `.clobbered.*`,
відновлено останню відому справну копію та записано помітне попередження з причиною відновлення.
Якщо перед інакше коректною JSON-конфігурацією випадково додано рядок статусу/журналу,
під час запуску gateway і виконання `openclaw doctor --fix` цей префікс можна видалити,
зберегти забруднений файл як `.clobbered.*` і продовжити роботу з відновленим
JSON.
Наступний хід основного агента також отримує попередження системної події про те, що
конфігурацію було відновлено і її не можна бездумно перезаписувати. Оновлення останньої відомої справної копії
відбувається після валідованого запуску та після прийнятих гарячих перезавантажень, включно з
записами конфігурації, виконаними самим OpenClaw, якщо хеш збереженого файлу все ще збігається з прийнятим
записом. Оновлення пропускається, якщо кандидат містить замасковані заповнювачі секретів
на кшталт `***` або скорочені значення токенів.

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

    - `agents.defaults.models` визначає каталог моделей і виконує роль allowlist для `/model`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскриптах/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у сценаріях із великою кількістю скриншотів.
    - Див. [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервного перемикання.
    - Для користувацьких/self-hosted provider див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM контролюється окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища дозволів після сполучення)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або специфічні для каналу allowlist.

    Див. [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати обмеження згадками в групових чатах">
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

    - **Metadata mentions**: нативні @-згадки (tap-to-mention у WhatsApp, @bot у Telegram тощо)
    - **Text patterns**: безпечні regex-шаблони в `mentionPatterns`
    - Див. [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень по каналах і режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для агента">
    Використовуйте `agents.defaults.skills` для спільного базового набору, а потім перевизначайте
    конкретних агентів через `agents.list[].skills`:

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

    - Не вказуйте `agents.defaults.skills`, якщо за замовчуванням Skills не мають бути обмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Встановіть `agents.list[].skills: []`, щоб не дозволяти жодних Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) і
      [Довідник конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітора стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційної діагностики та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) щодо області дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агентів в ізольованих середовищах sandbox:

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

    Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника і [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Вкажіть це в конфігурації gateway:

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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, який пересилається спареним застосунком iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було спарено застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовується лише до офіційно поширюваних збірок, що зареєстровані через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS з gateway і дочекайтеся підключення обох сесій: Node та операторської.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay на спарений gateway.
    5. Gateway зберігає дескриптор relay і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свій кешований запис реєстрації relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` все ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається запасним варіантом для розробки лише в loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні перевірки зв’язку)">
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
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: очищає завершені ізольовані сесії запуску з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищає `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (хуки)">
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
    - Увесь вміст payload hook/webhook слід вважати недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте спільний токен Gateway повторно.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для вхідних webhook окремий підшлях, наприклад `/hooks`.
    - Не вмикайте прапорці обходу небезпечного вмісту (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити вибір ключів сесії з боку викликача.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію між кількома агентами">
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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил прив’язки та профілів доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт, що містить його
    - **Масив файлів**: об’єднується deep-merge за порядком (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файлу, що включає
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
поки вщухне тимчасовий запис/перейменування з боку редактора, читає остаточний файл і відхиляє
некоректні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
виконані самим OpenClaw, проходять ту саму перевірку схеми перед записом; руйнівні перезаписи,
наприклад видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите в журналах `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний файл
`.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Безпечно застосовує зміни гарячим способом миттєво. Автоматично перезапускається для критичних змін. |
| **`hot`**              | Гарячим способом застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                   |
| **`off`**              | Вимикає відстеження файлу. Зміни набудуть чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гарячим способом, а що потребує перезапуску

Більшість полів застосовуються гарячим способом без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні               |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти та медіа | `tools`, `browser`, `skills`, `audio`, `talk`                  | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** спричиняє перезапуск.
</Note>

## Config RPC (програмні оновлення)

<Note>
RPC керувальної площини для запису (`config.apply`, `config.patch`, `update.run`) мають обмеження частоти: **3 запити за 60 секунд** для кожної пари `deviceId+clientIp`. Якщо ліміт перевищено, RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий процес:

- `config.schema.lookup`: перевірити одне піддерево конфігурації для заданого шляху з неглибоким
  вузлом схеми, відповідними метаданими підказок і стислими описами безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + хеш
- `config.patch`: бажаний шлях для часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Якщо ви не замінюєте всю конфігурацію, віддавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє, записує повну конфігурацію та перезапускає Gateway за один крок.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (необов’язково) — хеш конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (необов’язково) — ключ сесії для сигналу пробудження після перезапуску
    - `note` (необов’язково) — примітка для маркера перезапуску
    - `restartDelayMs` (необов’язково) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує або виконується, а між циклами перезапуску діє 30-секундна пауза.

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
    - `baseHash` (обов’язково) — хеш конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — ті самі, що й у `config.apply`

    Поведінка перезапуску збігається з `config.apply`: об’єднання очікуваних перезапусків плюс 30-секундна пауза між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw зчитує змінні середовища з батьківського процесу, а також з:

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
  Якщо цю функцію ввімкнено й очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

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
- Відсутні/порожні змінні викликають помилку під час завантаження
- Використовуйте `$${VAR}` для виведення літерала
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

Докладніше про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) див. у [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment) для повного опису пріоритетів і джерел.

## Повний довідник

Повний довідник для кожного поля див. в **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
