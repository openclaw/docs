---
read_when:
    - Перше налаштування OpenClaw
    - Шукаєте поширені шаблони конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T07:25:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a68c5e4d375e0910b65fa4da2bcfc6fa560cbcba750778605420dc1b83eeb15
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети
`openclaw.json` із символічними посиланнями не підтримуються для записів,
якими керує OpenClaw; атомарний запис може замінити
цей шлях замість збереження символічного посилання. Якщо ви зберігаєте конфігурацію поза
стандартним каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Тонко налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше налаштовуєте конфігурацію?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для повних готових конфігурацій, які можна скопіювати й вставити.
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
    Control UI відображає форму на основі живої схеми конфігурації, зокрема метадані документації полів
    `title` / `description`, а також схеми plugin і каналів, коли вони
    доступні, із редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми з прив’язкою до шляху разом із короткими описами безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` напряму. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

Нотатки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Вважайте цей вивід схеми канонічним машинозчитуваним контрактом для
  `openclaw.json`; цей огляд і довідник конфігурації його підсумовують.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів та інструментів форм.
- Вкладені об’єкти, записи з шаблоном (`*`) і елементи масивів (`[]`) успадковують ті самі
  метадані документації там, де існує відповідна документація поля.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані
  документації, тому варіанти union/intersection зберігають ту саму довідку полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові межі
  та подібні поля валідації), відповідними метаданими підказок UI та короткими описами безпосередніх дочірніх елементів
  для інструментів деталізованого перегляду.
- Схеми runtime plugin/каналів об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між артефактами базового рівня конфігурації для документації
  та поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню відому справну копію після успішного запуску. Якщо
`openclaw.json` пізніше змінено поза OpenClaw і він більше не проходить валідацію, запуск
і гаряче перезавантаження збережуть зіпсований файл як часовий знімок `.clobbered.*`,
відновлять останню відому справну копію та запишуть помітне попередження з причиною відновлення.
Відновлення під час читання на запуску також розглядає різке зменшення розміру, відсутність метаданих конфігурації та
відсутній `gateway.mode` як критичні ознаки пошкодження, якщо остання відома справна
копія мала ці поля.
Якщо перед інакше дійсною конфігурацією JSON випадково додано рядок статусу/журналу,
запуск gateway і `openclaw doctor --fix` можуть прибрати цей префікс,
зберегти забруднений файл як `.clobbered.*` і продовжити роботу з відновленим
JSON.
Наступний хід основного агента також отримує попередження про системну подію, яке повідомляє, що
конфігурацію було відновлено і її не можна бездумно перезаписувати. Підвищення статусу останньої відомої справної копії
оновлюється після перевіреного запуску та після прийнятих гарячих перезавантажень, зокрема
записів конфігурації, якими керує OpenClaw, якщо хеш збереженого файлу все ще збігається з прийнятим
записом. Підвищення пропускається, коли кандидат містить замасковані
заповнювачі секретів, такі як `***` або скорочені значення токенів.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Дивіться окрему сторінку каналу для кроків налаштування:

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

    Усі канали використовують однаковий шаблон політики особистих повідомлень:

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
    Налаштуйте основну модель і необов’язкові резервні варіанти:

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

    - `agents.defaults.models` визначає каталог моделей і слугує списком дозволених значень для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи до списку дозволених без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскрипті/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у сеансах із великою кількістю скриншотів.
    - Дивіться [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації та поведінки резервних варіантів.
    - Для користувацьких/self-hosted providers дивіться [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до особистих повідомлень керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища дозволених сполучених відправників)
    - `"open"`: дозволити всі вхідні особисті повідомлення (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі особисті повідомлення

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або списки дозволених, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати керування згадками в груповому чаті">
    Для групових повідомлень типовим значенням є **обов’язкова згадка**. Налаштуйте шаблони для кожного агента:

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

    - **Metadata mentions**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Text patterns**: безпечні шаблони regex у `mentionPatterns`
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень по каналах і режиму чату з самим собою.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільного базового набору, а потім перевизначайте конкретних
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

    - Не вказуйте `agents.defaults.skills`, щоб типово не обмежувати Skills.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Встановіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
    - Дивіться [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) та
      [довідник конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски моніторингу стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоматичні перезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Дивіться [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

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
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Дивіться [Керування сесіями](/uk/concepts/session) для охоплення, зв’язків ідентичності та політики надсилання.
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

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

    Дивіться [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

    Встановіть це в конфігурації gateway:

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

    Еквівалент CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує право надсилання з областю реєстрації, яке пересилає спарений застосунок iOS. Gateway не потрібен relay-токен для всього розгортання.
    - Прив’язує кожну relay-backed реєстрацію до ідентичності gateway, з якою був спарений застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Relay-backed надсилання застосовуються лише до офіційно поширюваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний процес:

    1. Встановіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спаріть застосунок iOS із gateway і дозвольте підключитися сесіям node та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-backed payload `push.apns.register` до спареного gateway.
    5. Gateway зберігає relay handle і право надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює кешовану relay-реєстрацію замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається запасним варіантом для розробки лише для loopback; не зберігайте HTTP URL relay у конфігурації.

    Дивіться [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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

    - `every`: рядок тривалості (`30m`, `2h`). Встановіть `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад, `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі особистих повідомлень
    - Дивіться [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

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

    - `sessionRetention`: очищати завершені ізольовані сесії запуску з `sessions.json` (типово `24h`; встановіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Дивіться [завдання Cron](/uk/automation/cron-jobs) для огляду функціональності та прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
    Увімкніть HTTP-ендпойнти Webhook на Gateway:

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
    - Розглядайте весь вміст payload hook/webhook як ненадійне введення.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхід Webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо лише не виконуєте дуже вузько обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, вибрані викликачем.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише надсилання повідомлень плюс ізоляція, де це можливо).

    Дивіться [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію з кількома агентами">
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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил прив’язки та профілів доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт-контейнер
    - **Масив файлів**: глибоко об’єднується за порядком (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файлу, який включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` недоторканим
    - **Непідтримуваний запис наскрізь**: кореневі includes, масиви include і includes
      із сусідніми перевизначеннями аварійно завершуються для записів, якими керує OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файлу вважаються ненадійними, доки не пройдуть валідацію. Спостерігач
чекає, доки вщухне тимчасовий запис/перейменування редактора, зчитує
остаточний файл і відхиляє недійсні зовнішні зміни, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують той самий бар’єр схеми перед записом; руйнівні пошкодження
на кшталт видалення `gateway.mode` або зменшення файлу більш ніж наполовину відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у журналах, перевірте відповідний
файл `.clobbered.*` поруч з `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Дивіться [усунення проблем Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.     |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Пише попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                |
| **`off`**              | Вимикає відстеження файлів. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що гаряче застосовується, а що потребує перезапуску

Більшість полів гаряче застосовуються без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                             | Потрібен перезапуск? |
| ------------------ | ---------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали plugin | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                           | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                               | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                   | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                          | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                             | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** запускає перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі макета, заданого у вихідних файлах, а не сплощеного подання в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними, навіть коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження аварійно завершується, якщо
вихідний макет неоднозначний.

## RPC конфігурації (програмні оновлення)

<Note>
RPC запису control-plane (`config.apply`, `config.patch`, `update.run`) мають обмеження частоти: **3 запити на 60 секунд** для кожного `deviceId+clientIp`. У разі спрацювання обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий процес:

- `config.schema.lookup`: переглянути одне піддерево конфігурації з прив’язкою до шляху з неглибоким
  вузлом схеми, відповідними метаданими підказок і короткими описами безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + хеш
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Коли ви не замінюєте всю конфігурацію, віддавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє + записує повну конфігурацію і перезапускає Gateway за один крок.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (optional) — хеш конфігурації з `config.get` (обов’язковий, коли конфігурація існує)
    - `sessionKey` (optional) — ключ сесії для ping пробудження після перезапуску
    - `note` (optional) — примітка для sentinel перезапуску
    - `restartDelayMs` (optional) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє 30-секундний період охолодження.

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
    - `baseHash` (required) — хеш конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — ті самі, що й у `config.apply`

    Поведінка перезапуску збігається з `config.apply`: об’єднання відкладених перезапусків плюс 30-секундний період охолодження між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо є)
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
  Якщо цю функцію ввімкнено, а очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

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
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екранування через `$${VAR}` для буквального виводу
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

Подробиці про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Дивіться [Середовище](/uk/help/environment) для повного порядку пріоритету та джерел.

## Повний довідник

Повний довідник по полях дивіться в **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
