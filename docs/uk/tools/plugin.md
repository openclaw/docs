---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T13:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6aa1819e086c66fd9cb035d17f0dea0ddc7fcd0c0d5490fac09c843fb1d74a39
    source_path: tools/plugin.md
    workflow: 16
---

Plugin-и розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
оболонками агентів, інструментами, skills, мовленням, транскрипцією в реальному
часі, голосом у реальному часі, розумінням медіа, генерацією зображень,
генерацією відео, веботриманням, вебпошуком тощо. Деякі plugin-и є **core**
(постачаються з OpenClaw), інші є **зовнішніми**. Більшість зовнішніх plugin-ів
публікуються й виявляються через [ClawHub](/uk/tools/clawhub). Npm залишається
підтримуваним для прямих встановлень і для тимчасового набору пакетів plugin-ів,
що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Керування безпосередньо з чату">
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime
    поверхні plugin-ів у процесі, а нові ходи агента перебудовують свій список
    інструментів з оновленого реєстру. `/plugins install` змінює вихідний код plugin-а,
    тому Gateway запитує перезапуск замість удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти,
    служби, методи gateway, hooks або команди CLI, що належать plugin-у. Звичайний
    `inspect` є холодною перевіркою маніфесту/реєстру й навмисно уникає імпорту
    runtime plugin-а.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікація bare package
(спочатку ClawHub, потім fallback на npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується безпечною відмовою й указує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugin-ів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного plugin-а ізолюється до цього plugin-а:
запуск записує проблему `plugins.entries.<id>.config`, пропускає цей plugin під час
завантаження та залишає інші plugin-и й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити неправильну конфігурацію plugin-а в карантин, вимкнувши цей запис plugin-а й видаливши
його недійсний payload конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не виявляється, але той самий
застарілий id plugin-а залишається в конфігурації plugin-ів або записах встановлення, запуск Gateway
записує попередження та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin-а; невідомі
ключі каналу без доказів застарілого plugin-а все одно не проходять валідацію, щоб друкарські помилки
залишалися видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin-и вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugin-ів, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin-ів замість автоматичного видалення. Повторно ввімкніть plugin-и перед
запуском очищення doctor, якщо хочете видалити застарілі id plugin-ів.

Встановлення залежностей plugin-а відбувається лише під час явних потоків install/update або
repair через doctor. Запуск Gateway, перезавантаження конфігурації та runtime inspection не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні plugin-и вже повинні
мати встановлені залежності, тоді як plugin-и npm, git і ClawHub встановлюються під керовані
корені plugin-ів OpenClaw. Залежності npm можуть бути hoisted у межах керованого npm root OpenClaw;
install/update сканує цей керований root перед довірою, а uninstall видаляє npm-managed пакети через npm.
Зовнішні plugin-и та власні load paths все одно мають встановлюватися через `openclaw plugins install`.
Див. [Розв’язання залежностей plugin-ів](/uk/plugins/dependency-resolution) щодо життєвого циклу
під час встановлення.

Source checkouts є pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над bundled
plugin-ами, запустіть `pnpm install`; OpenClaw тоді завантажує bundled plugin-и з
`extensions/<id>`, тож редагування й локальні для пакета залежності використовуються напряму.
Звичайні кореневі встановлення npm призначені для packaged OpenClaw, а не для розробки
source checkout.

## Типи plugin-ів

OpenClaw розпізнає два формати plugin-ів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; виконується in-process    | Офіційні plugin-и, пакети спільноти npm                |
| **Bundle** | Layout, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native plugin, почніть із [Створення plugin-ів](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Entrypoints пакета

Пакети native plugin npm повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й вирішуватися до читабельного
runtime file або до вихідного файлу TypeScript з виведеним збудованим JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime files не розташовані за
тими самими шляхами, що й source entries. Коли присутній `runtimeExtensions`, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення й
виявлення plugin-а замість тихого fallback на source paths. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript peer; цей файл є обов’язковим, коли його оголошено.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні plugin-и

### npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості plugin-ів. Поточні packaged
релізи OpenClaw уже містять багато офіційних plugin-ів, тому вони не потребують
окремих встановлень npm у звичайних налаштуваннях. Доки кожен plugin, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw все ще постачає деякі пакети plugin-ів `@openclaw/*` на
npm для старіших/власних встановлень і прямих npm workflows.

Якщо npm повідомляє, що пакет plugin-а `@openclaw/*` deprecated, ця версія пакета
походить зі старішої external package train. Використовуйте bundled plugin із
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший пакет npm.

| Plugin          | Пакет                      | Документація                               |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/uk/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/uk/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/uk/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/uk/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/uk/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/uk/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/uk/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/uk/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/uk/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/uk/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/uk/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/uk/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/uk/plugins/zalouser)         |

### Core (постачається з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin-и пам’яті">
    - `memory-core` — bundled memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser plugin для browser tool, CLI `openclaw browser`, gateway method `browser.request`, browser runtime і стандартної browser control service (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugin-и? Див. [Plugin-и спільноти](/uk/plugins/community).

## Конфігурація

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Поле            | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Allowlist plugin-ів (необов’язково)                      |
| `deny`           | Denylist plugin-ів (необов’язково; deny перемагає)        |
| `load.paths`     | Додаткові файли/каталоги plugin-ів                       |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремих plugin-ів          |

`plugins.allow` є ексклюзивним. Коли він не порожній, завантажуватися
або expose tools можуть лише перелічені plugin-и, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить plugin-у. Якщо allowlist інструментів посилається на plugin tools, додайте ids plugin-ів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у Gateway в межах процесу. Нові ходи агента перебудовують список інструментів із
оновленого реєстру плагінів. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі плагінів неможливо безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Якщо
плагін там має стан `enabled`, це означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом плагіна. У середовищах VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, фактичному
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли звіт про перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: disabled, missing та invalid">
  - **Disabled**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw шукає плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні packaged каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Packaged встановлення та образи Docker зазвичай знаходять вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого плагіна
примонтовано поверх відповідного packaged шляху джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як оверлей вбудованого джерела й виявляє його перед packaged
бандлом `/app/dist/extensions/synology-chat`. Це зберігає робочими контейнерні
цикли супровідників без перемикання кожного вбудованого плагіна назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати packaged dist-бандли
навіть за наявності монтувань оверлеїв джерела.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору default-on, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель провайдера, конфігурацію каналу або
  runtime стенда
- Застаріла конфігурація плагінів зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання моделей `codex/*`

## Усунення проблем runtime-хуків

Якщо плагін з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в живому чат-трафіку, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або подайте сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудованим хукам розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вихід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway і, під час налагодження навантажень провайдера, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагіна

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
перевірте рядки таймінгів фабрик інструментів плагінів:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів плагінів,
включно з ідентифікатором плагіна, оголошеними назвами інструментів, формою результату та тим, чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1 с або загальна підготовка фабрик інструментів плагінів триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів плагінів для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочий простір, ідентифікатори агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, що
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один плагін домінує в таймінгах, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори Plugin мають переносити
дороге завантаження залежностей у шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що понад один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти, що належать плагіну,
  щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активна лише одна за раз):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Слот            | Що контролює      | Типове значення             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Плагін Active Memory  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнено типово (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для планових оновлень відстежуваних npm
плагінів. Він не підтримується з `--link`, який повторно використовує шлях джерела замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього allowlist перед його ввімкненням. Якщо той самий ідентифікатор плагіна
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає сталий локальний реєстр plugin як холодну модель читання для
інвентаризації plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану plugin. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації пакета npm із dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно зафіксоване встановлення до
типової лінії випусків реєстру. Якщо встановлений npm plugin уже відповідає
розвʼязаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
plugin і оновлення plugin продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через помилку сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin. Встановлення
залежностей Skills, підтримані Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його ще раз. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
компʼютері; він не просить ClawHub повторно сканувати plugin і не робить заблокований випуск
публічним.

Сумісні пакети беруть участь у тому самому потоці переліку/перегляду/увімкнення/вимкнення
plugin. Поточна runtime-підтримка включає Skills у пакетах, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` та оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також
підтримувані або непідтримувані записи серверів MCP і LSP для plugin, підтриманих пакетами.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні plugin експортують обʼєкт входу, що надає `register(api)`. Старіші
plugin можуть усе ще використовувати `activate(api)` як застарілий псевдонім, але нові plugin мають
використовувати `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw завантажує обʼєкт входу та викликає `register(api)` під час активації
plugin. Завантажувач усе ще повертається до `activate(api)` для старіших plugin,
але вбудовані plugin і нові зовнішні plugin мають вважати `register` публічним
контрактом.

`api.registrationMode` повідомляє plugin, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструє інструменти, hooks, сервіси, команди, маршрути та інші живі побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє постачальників і метадані; довірений код точки входу plugin може завантажуватися, але має пропускати живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковагову точку входу налаштування.                                                                |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує runtime-точки входу.                                                                         |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Точки входу plugin, які відкривають сокети, бази даних, фонових працівників або довгоживучі
клієнти, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може виконати довірену точку входу plugin або модуль channel plugin, щоб побудувати
знімок. Тримайте верхні рівні модулів легковаговими та без побічних ефектів, а
мережеві клієнти, subprocesses, listeners, читання облікових даних і запуск сервісів
переносьте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Постачальник моделі (LLM)   |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Hooks життєвого циклу       |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний realtime-голос   |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Постачальник web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпоінт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту hooks для типізованих hooks життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний app-server Codex передає нативні для Codex події інструментів назад у цю
поверхню hooks. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст ще не переписує аргументи нативних інструментів Codex.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки harness Codex v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Повʼязане

- [Створення plugin](/uk/plugins/building-plugins) — створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні plugin](/uk/plugins/community) — сторонні переліки
