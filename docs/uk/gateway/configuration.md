---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-08T05:15:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та визначити, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

<Tip>
**Новачок у конфігурації?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) із готовими повними конфігураціями для копіювання.
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
    Control UI відображає форму на основі актуальної схеми конфігурації, зокрема метадані документації полів
    `title` / `description`, а також схеми plugins і каналів, коли вони
    доступні, із редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми, обмежений шляхом, разом із короткими зведеннями безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` напряму. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Вважайте цей вивід схеми канонічним машинозчитуваним контрактом для
  `openclaw.json`; цей огляд і довідник конфігурації її узагальнюють.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів і формових інструментів.
- Вкладені об’єкти, записи з шаблоном (`*`) і елементи масивів (`[]`) успадковують ті самі
  метадані документації там, де існує відповідна документація поля.
- Гілки композицій `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ту саму довідку для поля.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі
  та подібні поля валідації), відповідними метаданими UI-підказок і короткими зведеннями безпосередніх дочірніх
  елементів для інструментів деталізації.
- Схеми plugins/каналів під час виконання додаються через злиття, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розходження між артефактами базової конфігурації, орієнтованими на документацію,
  і поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

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
          allowFrom: ["tg:123"], // лише для allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Вибрати й налаштувати моделі">
    Налаштуйте основну модель і необов’язкові резервні:

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
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у стенограмах/інструментах (типове значення `1200`); нижчі значення зазвичай зменшують використання vision-token у сесіях із великою кількістю знімків екрана.
    - Див. [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації й поведінки резервного перемикання.
    - Для користувацьких/self-hosted providers див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlists, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати gating згадувань у групових чатах">
    Для групових повідомлень типово **потрібна згадка**. Налаштуйте шаблони для кожного агента:

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

    - **Metadata mentions**: нативні @-згадування (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Text patterns**: безпечні regex-шаблони в `mentionPatterns`
    - Див. [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень по каналах і режиму self-chat.

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
          { id: "writer" }, // успадковує github, weather
          { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
          { id: "locked-down", skills: [] }, // без Skills
        ],
      },
    }
    ```

    - Не вказуйте `agents.defaults.skills`, якщо типово Skills мають бути без обмежень.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Встановіть `agents.list[].skills: []`, щоб не було жодних Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) і
      [Довідник конфігурації](/uk/gateway/configuration-reference#agentsdefaultsskills).

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю та ізоляцією розмов:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // рекомендовано для багатьох користувачів
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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) для області дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агентів в ізольованих контейнерах Docker:

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

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Додайте це до конфігурації gateway:

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
    - Використовує право надсилання, прив’язане до реєстрації, яке пересилає paired iOS app. Gateway не потребує relay-токена рівня всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було paired iOS app, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційних розповсюджуваних збірок, що зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до одного й того самого розгортання relay.

    Повний потік роботи:

    1. Встановіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Виконайте pairing iOS app із gateway і дочекайтеся підключення сесій вузла й оператора.
    4. iOS app отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції app, а потім публікує payload `push.apns.register` через relay до paired gateway.
    5. Gateway зберігає relay handle і право надсилання, а потім використовує їх для `push.test`, сигналів пробудження й пробуджень повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте iOS app на інший gateway, перепідключіть app, щоб воно могло опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, app оновлює кешовану реєстрацію relay замість повторного використання старого походження relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові env-перевизначення.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише для loopback як шлях обходу в середовищі розробки; не зберігайте HTTP URL relay у конфігурації.

    Див. [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для повного потоку й [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати heartbeat (періодичні перевірки)">
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

    - `every`: рядок тривалості (`30m`, `2h`). Встановіть `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад, `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для heartbeat-цілей у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати cron jobs">
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

    - `sessionRetention`: очищати завершені ізольовані сесії запуску з `sessions.json` (типове значення `24h`; встановіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду функції та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати webhooks (hooks)">
    Увімкніть HTTP webhook endpoints на Gateway:

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
    - Автентифікація hooks працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; залишайте webhook ingress на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапори обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте строго обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які вибирає викликач.
    - Для агентів, керованих hooks, надавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mappings і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію multi-agent">
    Запускайте кількох ізольованих агентів з окремими workspace і сесіями:

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил bindings і профілів доступу для кожного агента.

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
    - **Масив файлів**: deep-merge у вказаному порядку (пізніші мають пріоритет)
    - **Сусідні ключі**: зливаються після include’ів (перевизначають включені значення)
    - **Вкладені include’и**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, який виконує включення
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу й циклічних include’ів

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості налаштувань ручний перезапуск не потрібен.

### Режими перезавантаження

| Режим                  | Поведінка                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Безпечно застосовує зміни одразу. Автоматично перезапускається для критичних змін.     |
| **`hot`**              | Лише безпечно застосовує зміни. Записує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway після будь-якої зміни конфігурації, безпечної чи ні.              |
| **`off`**              | Вимикає стеження за файлом. Зміни набирають чинності після наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, які потребують перезапуску, обробляються автоматично.

| Категорія         | Поля                                                                 | Потрібен перезапуск? |
| ----------------- | -------------------------------------------------------------------- | -------------------- |
| Канали            | `channels.*`, `web` (WhatsApp) — усі вбудовані й extension канали    | Ні                   |
| Агент і моделі    | `agent`, `agents`, `models`, `routing`                               | Ні                   |
| Автоматизація     | `hooks`, `cron`, `agent.heartbeat`                                   | Ні                   |
| Сесії й повідомлення | `session`, `messages`                                             | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                      | Ні                   |
| UI та інше        | `ui`, `logging`, `identity`, `bindings`                              | Ні                   |
| Сервер gateway    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Так**              |
| Інфраструктура    | `discovery`, `canvasHost`, `plugins`                                 | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** викликає перезапуск.
</Note>

## Config RPC (програмні оновлення)

<Note>
RPC керуючої площини для запису (`config.apply`, `config.patch`, `update.run`) мають обмеження швидкості: **3 запити на 60 секунд** для кожної пари `deviceId+clientIp`. У разі обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий потік:

- `config.schema.lookup`: переглянути одне піддерево конфігурації, обмежене шляхом, з неглибоким
  вузлом схеми, відповідними метаданими підказок і короткими зведеннями безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + hash
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Якщо ви не замінюєте всю конфігурацію, надавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє, записує повну конфігурацію та перезапускає Gateway одним кроком.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (optional) — hash конфігурації з `config.get` (обов’язковий, якщо конфігурація вже існує)
    - `sessionKey` (optional) — ключ сесії для ping пробудження після перезапуску
    - `note` (optional) — примітка для restart sentinel
    - `restartDelayMs` (optional) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє 30-секундна пауза.

    ```bash
    openclaw gateway call config.get --params '{}'  # отримати payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (часткове оновлення)">
    Зливає часткове оновлення з наявною конфігурацією (семантика JSON merge patch):

    - Об’єкти зливаються рекурсивно
    - `null` видаляє ключ
    - Масиви замінюються

    Параметри:

    - `raw` (string) — JSON5 лише з ключами, які треба змінити
    - `baseHash` (required) — hash конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — те саме, що й для `config.apply`

    Поведінка перезапуску така сама, як у `config.apply`: об’єднання очікуваних перезапусків і 30-секундна пауза між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw читає env vars із батьківського процесу, а також:

- `.env` із поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні env vars. Ви також можете задавати inline env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт env із shell (необов’язково)">
  Якщо це ввімкнено й очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

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

- Збігаються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні env vars викликають помилку під час завантаження
- Екрануйте як `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Inline substitution: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Докладніше про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) див. у [Secrets Management](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

## Повний довідник

Для повного довідника за полями див. **[Configuration Reference](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
