---
read_when:
    - Початкове налаштування OpenClaw პირველად
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: типові завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T20:52:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e873bebd26787ef480dc005c45d307645bc7fe8e5c402b9a642a31061935586a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях до конфігурації має бути звичайним файлом. Схеми `openclaw.json` із symlink
не підтримуються для записів, якими керує OpenClaw; атомарний запис може замінити
цей шлях замість збереження symlink. Якщо ви зберігаєте конфігурацію поза
типовим каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали й контролювати, хто може писати боту
- Налаштувати моделі, tools, sandboxing або автоматизацію (Cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Усі доступні поля див. у [повному довіднику](/uk/gateway/configuration-reference).

<Tip>
**Новачок у конфігурації?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Configuration Examples](/uk/gateway/configuration-examples) з готовими конфігураціями для копіювання.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використовуйте вкладку **Config**.
    Control UI відображає форму з живої схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами Plugin і каналів, коли вони
    доступні, із редактором **Raw JSON** як запасним варіантом. Для UI із
    деталізацією та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми, обмежений шляхом, плюс зведення безпосередніх дочірніх вузлів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і застосовує зміни автоматично (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або невалідні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли прив’язувати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол, обмежений шляхом, плюс
зведення дочірніх вузлів для інструментів із деталізацією. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) та гілки `anyOf`/
`oneOf`/`allOf`. Схеми Plugin і каналів під час runtime зливаються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому робочу копію після кожного успішного запуску.
Якщо `openclaw.json` згодом не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується чи має сторонній рядок журналу на початку), OpenClaw зберігає зламаний файл
як `.clobbered.*`, відновлює останню відому робочу копію й записує причину
відновлення в журнал. Наступний хід агента також отримує попередження як системну подію, щоб основний
агент не переписав відновлену конфігурацію всліпу. Підвищення до статусу останньої відомої робочої копії
пропускається, якщо кандидат містить замасковані placeholders секретів, такі як `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Кроки налаштування див. на окремій сторінці каналу:

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
    Установіть основну модель і необов’язкові fallback:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.5"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.5": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` визначає каталог моделей і працює як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень транскриптів/tools (типово `1200`); менші значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю скриншотів.
    - Перемикання моделей у чаті див. у [Models CLI](/uk/concepts/models), а обертання автентифікації й поведінку fallback — у [Model Failover](/uk/concepts/model-failover).
    - Для власних/self-hosted провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може писати боту">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для схвалення
    - `"allowlist"`: лише відправники з `allowFrom` (або парного сховища allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Докладні відомості для кожного каналу див. у [повному довіднику](/uk/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Налаштувати шлюз згадок у групових чатах">
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
    - Перевизначення для кожного каналу та режим self-chat див. у [повному довіднику](/uk/gateway/configuration-reference#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте
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

    - Не вказуйте `agents.defaults.skills`, якщо типово потрібні необмежені Skills.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Установіть `agents.list[].skills: []`, якщо Skills не потрібні.
    - Див. [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config) і
      [Configuration Reference](/uk/gateway/configuration-reference#agents-defaults-skills).

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
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального монітора.
    - Операційне налагодження див. у [Health Checks](/uk/gateway/health), а всі поля — у [повному довіднику](/uk/gateway/configuration-reference#gateway).

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
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до thread (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Докладніше про область дії, зв’язки identity та політику надсилання див. у [Session Management](/uk/concepts/session).
    - Усі поля див. у [повному довіднику](/uk/gateway/configuration-reference#session).

  </Accordion>

  <Accordion title="Увімкнути sandboxing">
    Запускайте сесії агентів в ізольованих runtime sandbox:

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

    Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing), а всі параметри — у [повному довіднику](/uk/gateway/configuration-reference#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Увімкнути push на базі relay для офіційних збірок iOS">
    Push на базі relay налаштовується в `openclaw.json`.

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

    Еквівалент у CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує грант на надсилання в межах реєстрації, який пересилається спареним застосунком iOS. Gateway не потребує relay-токена на рівні всього розгортання.
    - Прив’язує кожну реєстрацію на базі relay до identity gateway, з яким було спарено застосунок iOS, тож інший gateway не зможе повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційних розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб реєстрація й трафік надсилання потрапляли до того самого розгортання relay.

    Повний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS з gateway і дайте підключитися як сесіям Node, так і операторським сесіям.
    4. Застосунок iOS отримує identity gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` на базі relay у спарений gateway.
    5. Gateway зберігає дескриптор relay і грант на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів повторного підключення.

    Примітки з експлуатації:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свою кешовану реєстрацію relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` досі працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається лише loopback-варіантом для розробки; не зберігайте HTTP URL relay у конфігурації.

    Повний потік див. у [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds), а модель безпеки relay — у [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow).

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
    - Повний посібник див. у [Heartbeat](/uk/gateway/heartbeat).

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

    - `sessionRetention`: очищати завершені сесії ізольованих запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Огляд можливостей і приклади CLI див. у [Cron jobs](/uk/automation/cron-jobs).

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
    Увімкніть HTTP endpoint Webhook на Gateway:

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
    - Ставтеся до всього вмісту payload hook/webhook як до недовіреного вводу.
    - Використовуйте окремий `hooks.token`; не використовуйте спільний токен Gateway повторно.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний трафік webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які може вибирати викликач.
    - Для агентів, керованих hook, надавайте перевагу сильним сучасним рівням моделей і суворій політиці tools (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Усі параметри mappings та інтеграцію Gmail див. у [повному довіднику](/uk/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію з кількома агентами">
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

    Правила bindings і профілі доступу для кожного агента див. у [Multi-Agent](/uk/concepts/multi-agent) і [повному довіднику](/uk/gateway/configuration-reference#multi-agent-routing).

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

    - **Один файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: глибоко зливається в порядку переліку (пізніший має пріоритет)
    - **Сусідні ключі**: зливаються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: визначаються відносно файла, що включає
    - **Записи, якими володіє OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      що підтримується включенням одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі includes, масиви include та includes
      із сусідніми перевизначеннями завершуються безпечною відмовою для записів, якими володіє OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач
чекає, поки завершиться тимчасовий запис/перейменування редактора, читає
фінальний файл і відхиляє невалідні зовнішні редагування, відновлюючи
останню відому робочу конфігурацію. Записи конфігурації, якими володіє OpenClaw,
використовують той самий бар’єр схеми перед записом; руйнівні пошкодження, такі
як видалення `gateway.mode` або зменшення файла більш ніж удвічі, відхиляються
й зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у логах, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Контрольний список відновлення див. у [Gateway troubleshooting](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.   |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає спостереження за файлами. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія            | Поля                                                             | Потрібен перезапуск? |
| -------------------- | ---------------------------------------------------------------- | -------------------- |
| Канали               | `channels.*`, `web` (WhatsApp) — усі вбудовані канали й канали Plugin | Ні               |
| Агенти й моделі      | `agent`, `agents`, `models`, `routing`                           | Ні                   |
| Автоматизація        | `hooks`, `cron`, `agent.heartbeat`                               | Ні                   |
| Сесії та повідомлення| `session`, `messages`                                            | Ні                   |
| Tools і медіа        | `tools`, `browser`, `skills`, `audio`, `talk`                    | Ні                   |
| UI та інше           | `ui`, `logging`, `identity`, `bindings`                          | Ні                   |
| Сервер Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Так**              |
| Інфраструктура       | `discovery`, `canvasHost`, `plugins`                             | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який посилається `$include`, OpenClaw планує
перезавантаження за макетом, створеним у source, а не за сплощеним поданням у пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними навіть тоді, коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується безпечною відмовою, якщо
макет source є неоднозначним.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, надавайте перевагу такому потоку:

- `config.schema.lookup`, щоб перевірити одне піддерево (поверхневий вузол схеми + дочірні
  зведення)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти зливаються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви справді хочете замінити всю конфігурацію
- `update.run` для явного self-update з подальшим перезапуском

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`)
мають обмеження частоти: 3 запити на 60 секунд для кожної пари `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовують 30-секундний cooldown між циклами перезапуску.
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

OpenClaw читає змінні середовища з батьківського процесу, а також з:

- `.env` у поточному робочому каталозі (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні змінні середовища. Ви також можете задавати вбудовані env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт env оболонки (необов’язково)">
  Якщо цю функцію ввімкнено і очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env var у значення конфігурації">
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
- Екрануйте через `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
  Для полів, які підтримують об’єкти SecretRef, ви можете використовувати:

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
Підтримувані шляхи облікових даних перелічено в [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).
</Accordion>

Повний пріоритет і джерела див. у [Environment](/uk/help/environment).

## Повний довідник

Повний довідник по кожному полю див. в **[Configuration Reference](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Configuration Examples](/uk/gateway/configuration-examples) · [Configuration Reference](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
