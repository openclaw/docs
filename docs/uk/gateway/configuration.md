---
read_when:
    - Перше налаштування OpenClaw
    - Поширені шаблони конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T08:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях до конфігурації має вказувати на звичайний файл. Макети
`openclaw.json` із символьними посиланнями не підтримуються для записів, які виконує OpenClaw; атомарний запис може замінити
шлях замість збереження символьного посилання. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, спрямуйте `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) із готовими повними конфігураціями для копіювання й вставлення.
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
    Control UI візуалізує форму на основі живої схеми конфігурації, включно з метаданими документації
    полів `title` / `description`, а також схемами plugin і каналів, коли вони
    доступні, із редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми для конкретного шляху разом із підсумками безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол для конкретного шляху разом
із підсумками дочірніх елементів для інструментів із деталізованою навігацією. Метадані документації полів `title`/`description`
поширюються на вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми plugin і каналів під час виконання додаються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому коректну копію після кожного успішного запуску.
Якщо `openclaw.json` згодом не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується, чи до нього випадково додається рядок журналу на початку), OpenClaw зберігає зламаний файл
як `.clobbered.*`, відновлює останню відому коректну копію та записує в журнал причину
відновлення. Наступний хід агента також отримує попередження про системну подію, щоб основний
агент не перезаписав відновлену конфігурацію бездумно. Підвищення до статусу останньої відомої коректної копії
пропускається, якщо кандидат містить замасковані заповнювачі секретів, наприклад `***`.

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

    - `agents.defaults.models` визначає каталог моделей і виконує роль списку дозволених значень для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до списку дозволених значень без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскрипті/інструментах (типове значення `1200`); нижчі значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю знімків екрана.
    - Див. [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації та поведінки резервного перемикання.
    - Для користувацьких/self-hosted провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до DM контролюється окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код спаровування для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища дозволених спарених користувачів)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або списки дозволених значень, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для подробиць по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати фільтрацію згадок у групових чатах">
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

    - **Згадки в метаданих**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
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
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Не задавайте `agents.defaults.skills`, якщо типово Skills не мають обмежуватися.
    - Не задавайте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Встановіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски через моніторинг стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

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

    - `dmScope`: `main` (спільна) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) для області дії, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агентів в ізольованих середовищах ізоляції:

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

    Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

    Додайте це в конфігурацію gateway:

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

    - Дає змогу gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну relay-backed реєстрацію до ідентичності gateway, з якою був спарений застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Relay-backed надсилання застосовується лише до офіційних розповсюджених збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спаріть застосунок iOS із gateway і дозвольте підключитися сеансам node та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-backed корисне навантаження `push.apns.register` у спарений gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює кешовану relay-реєстрацію замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним варіантом для розробки лише на loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати Cron jobs">
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

    - `sessionRetention`: очищати завершені ізольовані сеанси запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю рядків, які слід зберегти.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook-и (hooks)">
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
    - Розглядайте весь вміст корисного навантаження hook/Webhook як недовірене введення.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для вхідних Webhook-ів окремий підшлях, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо тільки не виконуєте суворо обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які вибирає викликач.
    - Для агентів, керованих hook-ами, віддавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції з Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
    Запускайте кількох ізольованих агентів з окремими робочими просторами й сесіями:

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил прив’язки й профілів доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт, який його містить
    - **Масив файлів**: глибоко зливається по порядку (пізніший має пріоритет)
    - **Сусідні ключі**: зливаються після include-ів (перевизначають включені значення)
    - **Вкладені include-и**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, який виконує включення
    - **Записи, які виконує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      що підтримується include-ом одного файла, як-от `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний запис через include**: root include-и, масиви include-ів і include-и
      із сусідніми перевизначеннями завершуються безпечною відмовою для записів, які виконує OpenClaw, замість
      сплющення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору й циклічних include-ів

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач
чекає, поки вщухне активність тимчасових записів/перейменувань редактора,
зчитує фінальний файл і відхиляє недійсні зовнішні редагування, відновлюючи
останню відому коректну конфігурацію. Записи конфігурації, які виконує OpenClaw,
використовують той самий бар’єр схеми перед записом; руйнівні перезаписи, такі
як видалення `gateway.mode` або зменшення файла більш ніж наполовину, відхиляються
й зберігаються як `.rejected.*` для перевірки.

Якщо в журналах ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилене корисне навантаження, а потім запустіть
`openclaw config validate`. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Для критичних автоматично перезапускає.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Пише попередження, коли потрібен перезапуск — ви виконуєте його самі. |
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

| Категорія            | Поля                                                              | Потрібен перезапуск? |
| -------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали               | `channels.*`, `web` (WhatsApp) — усі вбудовані канали й канали plugin | Ні               |
| Агент і моделі       | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація        | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії та повідомлення| `session`, `messages`                                             | Ні                   |
| Інструменти й медіа  | `tools`, `browser`, `skills`, `audio`, `talk`                     | Ні                   |
| UI та інше           | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура       | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі макета, заданого у вихідних файлах, а не сплющеного представлення в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними, навіть коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується безпечною відмовою, якщо
вихідний макет неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, використовуйте такий потік:

- `config.schema.lookup`, щоб перевірити одне піддерево (неглибокий вузол схеми + підсумки
  дочірніх елементів)
- `config.get`, щоб отримати поточний знімок і `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти зливаються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише якщо ви справді хочете замінити всю конфігурацію
- `update.run` для явного самооновлення й перезапуску

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`)
обмежуються до 3 запитів за 60 секунд на `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім примусово застосовують 30-секундний cooldown між циклами перезапуску.
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
`note` і `restartDelayMs`. `baseHash` є обов’язковим для обох методів, якщо
конфігурація вже існує.

## Змінні середовища

OpenClaw зчитує env vars із батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо є)
- `~/.openclaw/.env` (глобальний запасний варіант)

Жоден із цих файлів не перевизначає вже наявні env vars. Ви також можете задавати inline env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт env shell (необов’язково)">
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

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для виведення буквального значення
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef-и (env, file, exec)">
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

Подробиці про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

## Повний довідник

Повний довідник по кожному полю дивіться в **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
