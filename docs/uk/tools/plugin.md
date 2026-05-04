---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-04T22:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
агентними обв’язками, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, отриманням даних з вебу, вебпошуком
та іншим. Деякі plugins є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і далі підтримується для прямих встановлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання й вставлення дивіться в
[Керування plugins](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть plugin">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у своєму файлі конфігурації.

  </Step>

  <Step title="Керування з чату">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні plugin
    у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код plugin, тому
    Gateway запитує перезапуск замість того, щоб вдавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, служби, методи gateway,
    hooks або CLI-команди, що належать plugin. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпортування runtime plugin.

  </Step>
</Steps>

Якщо ви надаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікацію пакета без префікса
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закрито та спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація plugin завершується закрито, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію plugin,
вимкнувши цей запис plugin і видаливши його недійсний payload конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна знайти, але
той самий застарілий id plugin лишається в конфігурації plugin або записах встановлення, запуск Gateway
записує попередження в журнали й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналів без доказів застарілого plugin і далі не проходять перевірку, щоб друкарські помилки лишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість її автоматичного видалення. Повторно увімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі id plugin.

Встановлення залежностей plugin відбувається лише під час явних потоків install/update або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні plugins уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub plugins
встановлюються під керованими коренями plugins OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє керовані npm пакети через npm. Зовнішні plugins
і користувацькі шляхи завантаження все одно мають встановлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпорту runtime-коду чи відновлення залежностей.
Дивіться [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) для
життєвого циклу під час встановлення.

Для встановлень npm змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед встановленням, а потім закріплюються за точною перевіреною версією в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` і далі відповідає розв’язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту plugin.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над bundled
plugins, запустіть `pnpm install`; після цього OpenClaw завантажуватиме bundled plugins з
`extensions/<id>`, тож зміни й локальні для пакета залежності використовуватимуться напряму.
Звичайні npm-встановлення в корінь призначені для упакованого OpenClaw, а не для розробки
з вихідного checkout.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, npm-пакети спільноти               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Дивіться [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundles.

Якщо ви пишете native plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Npm-пакети native plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або в вихідний TypeScript-файл із виведеним збудованим JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime output. Fallback на TypeScript
source призначений для checkout-ів з вихідного коду та локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь plugins OpenClaw.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й source-записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення plugin замість тихого fallback до source-шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript peer; цей файл є обов’язковим, якщо оголошений.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні plugins

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом дистрибуції для більшості plugins. Поточні упаковані
випуски OpenClaw уже bundling багато офіційних plugins, тому їм не потрібні
окремі npm-встановлення у звичайних налаштуваннях. Доки кожен plugin, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw все ще постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm workflows.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` deprecated, ця версія пакета
походить зі старішої зовнішньої лінії пакетів. Використовуйте bundled plugin з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Plugin          | Пакет                    | Документація                                       |
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
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — bundled memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичними recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Дивіться [Memory LanceDB](/uk/plugins/memory-lancedb) для OpenAI-сумісного
    налаштування embedding, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser plugin для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Дивіться [Plugins спільноти](/uk/plugins/community).

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

| Поле              | Опис                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (за замовчуванням: `true`)                           |
| `allow`            | Список дозволених Plugin (необов’язково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих Plugin (`allowlist` за замовчуванням)    |
| `deny`             | Список заборонених Plugin (необов’язково; заборона має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги Plugin                            |
| `slots`            | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для окремого Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте ідентифікатори Plugin-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` за замовчуванням має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані
plugins постачальників, зокрема виявлення постачальника вебпошуку під час виконання. Doctor позначає старіші
обмежувальні конфігурації списку дозволених як `"compat"` під час міграції, щоб оновлення зберігали
успадковану поведінку вбудованих постачальників, доки оператор не ввімкне суворіший режим.
Порожній `plugins.allow` усе ще вважається невстановленим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у Gateway в межах поточного процесу. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У середовищах VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, фактичному
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай розв’язують вбудовані plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого Plugin
змонтовано поверх відповідного упакованого шляху до вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як вихідне накладання вбудованого Plugin і виявляє його перед упакованим
пакетом `/app/dist/extensions/synology-chat`. Це дає змогу підтримувати контейнерні
цикли супроводжувачів без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-пакети,
навіть коли наявні монтування вихідних накладань.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над дозволом
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins походженням із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору увімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель постачальника, конфігурацію каналу або runtime
  випробувального стенда
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить до Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення неполадок runtime hooks

Якщо Plugin з’являється у `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому трафіку чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hook і
  діагностику. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для доказу фактичної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо ходи агента наче зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
перевірте рядки таймінгів фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема ідентифікатор Plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
із тим самим фактичним контекстом запиту. Ключ кешу містить фактичну
runtime-конфігурацію, робочий простір, ідентифікатори агента/сеансу, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, що
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один Plugin домінує в таймінгу, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених plugins намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з ідентифікатором
  Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активною може бути лише одна одночасно):

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

| Слот            | Що він контролює      | За замовчуванням             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin активної пам’яті  | `memory-core`       |
| `contextEngine` | Активний контекстний рушій | `legacy` (вбудований) |

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

openclaw plugins install <package>         # install from npm by default
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

Вбудовані plugins постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований браузерний
plugin). Інші вбудовані plugins все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або пакет hook на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Він не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор установленого plugin до цього allowlist перед його ввімкненням. Якщо той самий ідентифікатор plugin
присутній у `plugins.deny`, установлення видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр plugin як модель холодного читання для
інвентаризації plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневих `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів установлення, політики конфігурації та
метаданих manifest/package без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
стандартної лінії випуску реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, повторного встановлення або переписування конфігурації.
Коли `openclaw update` виконується на beta-каналі, записи npm і ClawHub
plugin стандартної лінії спершу пробують `@beta` і повертаються до default/latest, якщо beta-випуску
plugin не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
marketplace-установлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення plugin
і оновлення plugin продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через збій сканування.
Сканування встановлень ігнорує поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin. Встановлення
залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, прихований або заблокований скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно просканувати plugin і не робить заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці списку/інспектування/ввімкнення/вимкнення
plugin. Поточна runtime-підтримка включає bundle Skills, command-skills Claude,
стандартні налаштування Claude `settings.json`, стандартні налаштування Claude `.lsp.json` і
оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook
Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для plugin на базі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Нативні plugins експортують об’єкт входу, який надає `register(api)`. Старіші
plugins можуть усе ще використовувати `activate(api)` як застарілий alias, але нові plugins мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації plugin. Завантажувач усе ще повертається до `activate(api)` для старіших plugins,
але вбудовані plugins і нові зовнішні plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, чому завантажується його entry:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, services, commands, routes та інші активні побічні ефекти.                          |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте providers і metadata; довірений entry-код plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування channel через легковаговий setup entry.                                                      |
| `setup-runtime` | Завантаження налаштування channel, якому також потрібен runtime entry.                                                           |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Entry plugin, які відкривають sockets, databases, background workers або довгоживучі
clients, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Discovery є неактиваційним, але не import-free:
OpenClaw може виконати довірений entry plugin або module channel plugin, щоб побудувати
snapshot. Тримайте верхній рівень modules легким і без побічних ефектів, а
network clients, subprocesses, listeners, читання credentials і запуск service переносіть
за full-runtime шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє              |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)       |
| `registerChannel`                       | Chat channel                 |
| `registerTool`                          | Agent tool                   |
| `registerHook` / `on(...)`              | Lifecycle hooks              |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний realtime voice    |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`       | Генерація зображень          |
| `registerMusicGenerationProvider`       | Генерація музики             |
| `registerVideoGenerationProvider`       | Генерація відео              |
| `registerWebFetchProvider`              | Web fetch / scrape provider  |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | Команди CLI                  |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Background service           |

Поведінка guard для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є завершальним; handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попереднє block.
- `before_install`: `{ block: true }` є завершальним; handlers із нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попереднє block.
- `message_sending`: `{ cancel: true }` є завершальним; handlers із нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попереднє cancel.

Нативний app-server Codex прокидає нативні для Codex події tools назад у цю
поверхню hook. Plugins можуть блокувати нативні tools Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у затвердженнях Codex
`PermissionRequest`. Bridge поки що не переписує аргументи нативних tools Codex.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hook див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — каталоги сторонніх розробників
