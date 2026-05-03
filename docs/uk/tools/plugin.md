---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-03T13:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 037b0e672efc1009a75af0c01d8f83d249e738e96524a33225e2b7ed4c62d950
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
оболонки агентів, інструменти, skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання вебвмісту, вебпошук тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і далі підтримується для прямих встановлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, поки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання й вставлення див.
у [Керування plugins](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Переглянути, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановити plugin">
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

  <Step title="Перезапустити Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Керування з чату">
    У запущеному Gateway доступні лише власнику команди `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні plugin
    в поточному процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код plugin, тому
    Gateway запитує перезапуск замість того, щоб удавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірити plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести наявність зареєстрованих інструментів, сервісів, методів Gateway,
    хуків або CLI-команд, що належать plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або голу специфікацію пакета
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей plugin під час
завантаження й залишає інші plugins і канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити несправну конфігурацію plugin у карантин, вимкнувши цей запис plugin і видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не виявляється, але той самий
застарілий id plugin лишається в конфігурації plugin або записах встановлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналів без доказів застарілого plugin і далі не проходять валідацію, щоб друкарські помилки залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugins вважаються інертними:
запуск Gateway пропускає виявлення/завантаження plugins, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Повторно ввімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі id plugin.

Встановлення залежностей plugin відбувається лише під час явних потоків встановлення/оновлення або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні plugins мають уже
мати встановлені залежності, тоді як npm, git і ClawHub plugins
встановлюються під керованими коренями plugins OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні plugins
і користувацькі шляхи завантаження все одно мають встановлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпорту runtime-коду чи відновлення залежностей.
Див. [Розв’язання залежностей plugin](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

Для встановлень npm змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед встановленням, а потім фіксуються до точної перевіреної версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` досі відповідає розв’язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту plugin.

Вихідні checkout-и є pnpm workspace-ами. Якщо ви клонували OpenClaw, щоб працювати над bundled
plugins, запустіть `pnpm install`; після цього OpenClaw завантажує bundled plugins з
`extensions/<id>`, тож зміни й локальні залежності пакета використовуються напряму.
Звичайні кореневі встановлення npm призначені для запакованого OpenClaw, а не для розробки
у вихідному checkout.

## Типи plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, пакети npm спільноти               |
| **Bundle** | Сумісний із Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native plugin, почніть із [Створення plugins](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Пакети native plugin npm мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися до читабельного
runtime-файлу або до TypeScript-файлу джерел із виведеним побудованим JavaScript
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й записи джерел. Коли `runtimeExtensions` наявний, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення plugin замість тихого відкату до шляхів джерел. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого
JavaScript-відповідника; цей файл є обов’язковим, коли оголошений.

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

### Пакети npm, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні запаковані
релізи OpenClaw уже містять багато офіційних plugins, тому в типових налаштуваннях для них не потрібні
окремі встановлення npm. Поки кожен plugin, що належить OpenClaw, не
перейшов до ClawHub, OpenClaw і далі постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє про пакет plugin `@openclaw/*` як deprecated, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте bundled plugin з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший пакет npm.

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
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — bundled memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на основі LanceDB з автоматичним recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embedding, прикладів Ollama, лімітів recall і усунення неполадок.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser plugin для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і стандартного сервісу керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Plugins спільноти](/uk/plugins/community).

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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених Plugin (необов'язково)                  |
| `deny`           | Список заборонених Plugin (необов'язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugin                           |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого Plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені Plugin, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте id Plugin-власників
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin Gateway у межах процесу. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерела, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, бо вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та Docker-образи зазвичай розв'язують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо каталог джерел вбудованого Plugin
змонтовано поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог джерел
як накладення джерел вбудованого Plugin і виявляє його перед запакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на джерела TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-пакети
навіть за наявності змонтованих накладень джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із походженням з робочого простору **вимкнені типово** (мають бути явно ввімкнені)
- Вбудовані Plugin дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от ref моделі провайдера, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація Plugin зберігається, доки активне `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  ref моделей `codex/*`

## Усунення проблем runtime-хуків

Якщо Plugin з'являється у `plugins list`, але побічні ефекти або хуки `register(api)`
не запускаються в живому трафіку чату, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудованим хукам розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він запускається перед розв'язанням моделі
  для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  створює вивід асистента.
- Для доказу фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway і, під час налагодження payload провайдера, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо ходи агента, здається, зависають під час підготовки інструментів, увімкніть трасувальне логування та
перевірте рядки таймінгів factory інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок містить загальний час factory і найповільніші factory інструментів Plugin,
зокрема id Plugin, оголошені назви інструментів, форму результату та те, чи є інструмент
необов'язковим. Повільні рядки підвищуються до попереджень, коли один factory триває
щонайменше 1 с або загальна підготовка factory інструментів Plugin триває щонайменше 5 с.

OpenClaw кешує успішні результати factory інструментів Plugin для повторних розв'язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочий простір, id агента/сесії, політику sandbox, налаштування browser,
контекст доставки, ідентичність запитувача та стан власності, тож factory, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один Plugin домінує за таймінгами, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині factory інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать Plugin,
  щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (лише одна активна одночасно):

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

| Слот            | Що він контролює      | Типово              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active memory  | `memory-core`       |
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

Комплектні plugins постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
комплектні провайдери моделей, комплектні провайдери мовлення та комплектний браузерний
plugin). Інші комплектні plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або пакет hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Він не підтримується разом із `--link`, який повторно використовує шлях до вихідних файлів
замість копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
установленого plugin до цього allowlist перед увімкненням. Якщо той самий id plugin
присутній у `plugins.deny`, установлення видаляє цей застарілий запис deny, щоб
явне встановлення одразу можна було завантажити після перезапуску.

OpenClaw зберігає сталий локальний реєстр plugins як модель холодного читання для
інвентаризації plugins, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану plugin. Той самий файл
`plugins/installs.json` зберігає довговічні метадані встановлення у верхньорівневому
`installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` відновлює його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
стандартної лінії випусків реєстру. Якщо встановлений npm plugin уже відповідає
визначеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.
Коли `openclaw update` працює в beta-каналі, записи npm і ClawHub
plugin стандартної лінії спочатку пробують `@beta` і повертаються до default/latest, якщо beta-випуску
plugin не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` призначений лише для npm. Він не підтримується разом із `--marketplace`, бо
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
plugins і оновлення plugin продовжуватися після вбудованих знахідок `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через помилку сканування.
Сканування під час установлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків установлення/оновлення plugin. Установлення
залежностей Skills, що підтримуються Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно сканувати plugin і не робить заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable для plugin.
Поточна підтримка runtime включає bundle Skills, command-skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP- і LSP-серверів для plugin на основі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні plugins експортують об’єкт входу, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як застарілий alias, але нові plugins мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час активації plugin.
Loader усе ще повертається до `activate(api)` для старіших plugins,
але комплектні plugins і нові зовнішні plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте tools, hooks, сервіси, команди, маршрути та інші живі побічні ефекти.                             |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте providers і метадані; довірений код entry plugin може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування channel через легковажний setup entry.                                                      |
| `setup-runtime` | Завантаження налаштування channel, якому також потрібен runtime entry.                                                          |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                             |

Plugin entries, які відкривають sockets, бази даних, фонові workers або довгоживучі
clients, мають захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від activation-завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але не є import-free:
OpenClaw може виконати довірений entry plugin або модуль channel plugin, щоб побудувати
snapshot. Тримайте верхні рівні модулів легкими та без побічних ефектів, а
network clients, subprocesses, listeners, читання credentials і запуск сервісів переносьте
за full-runtime шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє              |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)       |
| `registerChannel`                       | Chat channel                 |
| `registerTool`                          | Agent tool                   |
| `registerHook` / `on(...)`              | Lifecycle hooks              |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний realtime voice    |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`       | Генерація зображень          |
| `registerMusicGenerationProvider`       | Генерація музики             |
| `registerVideoGenerationProvider`       | Генерація відео              |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | Команди CLI                  |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Фоновий сервіс               |

Поведінка guard для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищає раніший block.
- `before_install`: `{ block: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищає раніший block.
- `message_sending`: `{ cancel: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищає раніший cancel.

Нативний app-server Codex передає події нативних tools Codex назад у цю
поверхню hook. Plugins можуть блокувати нативні tools Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge ще не переписує аргументи нативних tools Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Bundles Plugin](/uk/plugins/bundles) — сумісність bundles Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додайте agent tools у plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Community plugins](/uk/plugins/community) — сторонні listings
