---
read_when:
    - Перше налаштування OpenClaw
    - Шукаєте поширені шаблони конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-10T20:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та визначити, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Тонко налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для готових конфігурацій, які можна повністю скопіювати й вставити.
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
    Control UI відображає форму на основі актуальної схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами плагінів і каналів,
    якщо вони доступні, з редактором **Raw JSON** як запасним варіантом. Для
    UI із поглибленою навігацією та інших інструментів gateway також надає `config.schema.lookup`,
    щоб отримати один вузол схеми, обмежений шляхом, а також зведення для його безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схем:

- `openclaw config schema` виводить ту саму родину JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Сприймайте цей вивід схеми як канонічний машиночитний контракт для
  `openclaw.json`; цей огляд і довідник конфігурації узагальнюють його.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів та інструментів форм.
- Вкладені об’єкти, записи з шаблоном (`*`) і елементи масиву (`[]`) успадковують ті самі
  метадані документації там, де існує відповідна документація для полів.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ту саму довідку для полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені обмеження
  та подібні поля валідації), відповідними метаданими підказок UI і зведеннями
  для безпосередніх дочірніх елементів для інструментів із поглибленою навігацією.
- Схеми плагінів/каналів під час виконання об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між артефактами базової конфігурації для документації
  та поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

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

  <Accordion title="Вибрати й налаштувати моделі">
    Вкажіть основну модель і необов’язкові резервні варіанти:

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
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскриптах/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у сценаріях із великою кількістю скриншотів.
    - Див. [Models CLI](/uk/concepts/models), щоб перемикати моделі в чаті, і [Model Failover](/uk/concepts/model-failover) щодо ротації автентифікації та поведінки резервних варіантів.
    - Для власних/self-hosted провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM налаштовується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Перегляньте [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для подробиць по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати gating згадок у групових чатах">
    Для повідомлень у групах типово **потрібна згадка**. Налаштуйте шаблони для кожного агента:

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
    - Див. [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень по каналах і режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільного базового набору, а потім перевизначайте
    окремих агентів через `agents.list[].skills`:

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
    - Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Укажіть `agents.list[].skills: []`, якщо Skills не потрібні.
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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу або облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження і [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю розмов і ізоляцією:

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) щодо області видимості, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агентів в ізольованих Docker-контейнерах:

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

    Укажіть це в конфігурації gateway:

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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потрібен токен relay для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було спарено застосунок iOS, тож інший gateway не може повторно використати збережену реєстрацію.
    - Зберігає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційних поширюваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Повний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дайте підключитися сесіям вузла та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay на спарений gateway.
    5. Gateway зберігає дескриптор relay і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює кешовану реєстрацію relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається варіантом обходу лише для розробки на loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для повного потоку та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати heartbeat (періодичні перевірки зв’язку)">
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
    - `directPolicy`: `allow` (типово) або `block` для цілей heartbeat у стилі DM
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

    - `sessionRetention`: видаляти завершені ізольовані сесії запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати webhook-и (hooks)">
    Увімкніть кінцеві точки HTTP webhook на Gateway:

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
    - Сприймайте весь вміст payload hook/webhook як недовірений ввід.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для webhook ingress окремий підшлях, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які можуть обирати викликачі.
    - Для агентів, керованих hook, надавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція там, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mappings і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію з кількома агентами">
    Запускайте кілька ізольованих агентів з окремими робочими просторами й сесіями:

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
    Використовуйте `$include` для впорядкування великих конфігурацій:

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

    - **Окремий файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: об’єднується глибоким злиттям у вказаному порядку (пізніші мають пріоритет)
    - **Сусідні ключі**: зливаються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, що включає
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу й циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Для критичних змін автоматично перезапускається. |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Коли потрібен перезапуск, записує попередження в журнал — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway після будь-якої зміни конфігурації, безпечної чи ні.              |
| **`off`**              | Вимикає стеження за файлом. Зміни набудуть чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів гаряче застосовуються без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія           | Поля                                                                 | Потрібен перезапуск? |
| ------------------- | -------------------------------------------------------------------- | -------------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані й розширювані канали | Ні                   |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                               | Ні                   |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                   | Ні                   |
| Сесії й повідомлення | `session`, `messages`                                               | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                        | Ні                   |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                              | Ні                   |
| Сервер gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Так**              |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                                 | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: зміна цих полів **не** спричиняє перезапуск.
</Note>

## RPC конфігурації (програмні оновлення)

<Note>
RPC запису control-plane (`config.apply`, `config.patch`, `update.run`) мають обмеження частоти: **3 запити за 60 секунд** для кожної пари `deviceId+clientIp`. Після спрацювання обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий потік:

- `config.schema.lookup`: перевірити одне піддерево конфігурації, обмежене шляхом, із поверхневим
  вузлом схеми, відповідними метаданими підказок і зведеннями для безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + hash
- `config.patch`: рекомендований шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самостійне оновлення + перезапуск

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
    - `baseHash` (необов’язковий) — hash конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (необов’язковий) — ключ сесії для ping пробудження після перезапуску
    - `note` (необов’язковий) — примітка для sentinel перезапуску
    - `restartDelayMs` (необов’язковий) — затримка перед перезапуском (типово 2000)

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

    - `raw` (string) — JSON5 лише з ключами, які потрібно змінити
    - `baseHash` (обов’язковий) — hash конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — такі самі, як у `config.apply`

    Поведінка перезапуску відповідає `config.apply`: об’єднання очікуваних перезапусків плюс 30-секундний cooldown між циклами перезапуску.

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

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний запасний варіант)

Жоден із цих файлів не перевизначає наявні env vars. Ви також можете встановлювати inline env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт env shell (необов’язково)">
  Якщо це ввімкнено і очікувані ключі не встановлені, OpenClaw запускає вашу shell входу й імпортує лише відсутні ключі:

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
  Посилайтеся на env vars у будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
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

Подробиці SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) наведено в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Environment](/uk/help/environment) для повного пріоритету та джерел.

## Повний довідник

Повний довідник по кожному полю дивіться в **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
