---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-12T08:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
агентські harnesses, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, web fetch, web
search та інше. Деякі plugins є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються й знаходяться через
[ClawHub](/uk/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення копіюванням і вставлянням, перегляду списку, видалення, оновлення та публікації див.
у [Керування plugins](/uk/plugins/manage-plugins).

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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

  <Step title="Керування з чату">
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні plugin
    у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код plugin, тому
    Gateway запитує перезапуск замість того, щоб удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, служби, методи gateway,
    hooks або CLI-команди, що належать plugin. Простий `inspect` є холодною
    перевіркою manifest/registry і навмисно уникає імпорту runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або гола специфікація пакета через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закрито й указує на
`openclaw doctor --fix`. Єдиний виняток для відновлення - вузький шлях перевстановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація plugin завершується закрито, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію plugin,
вимкнувши цей запис plugin і видаливши його недійсний payload конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна виявити, але
той самий застарілий id plugin лишається в конфігурації plugin або записах встановлення, запуск Gateway
записує попередження й пропускає цей канал замість того, щоб блокувати всі інші канали.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи channel/plugin; невідомі
ключі каналів без доказів застарілого plugin усе ще не проходять валідацію, щоб помилки друку залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin розглядаються як інертні:
запуск Gateway пропускає виявлення/завантаження plugins, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Знову ввімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі id plugin.

Встановлення залежностей plugin відбувається лише під час явних потоків install/update або
repair у doctor. Запуск Gateway, перезавантаження конфігурації та runtime inspection
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні plugins мають уже
мати встановлені свої залежності, тоді як npm, git і ClawHub plugins
встановлюються під керованими коренями plugins OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє npm-managed packages через npm. Зовнішні plugins
і custom load paths усе ще мають установлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпорту runtime-коду або ремонту залежностей.
Див. [розв'язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

### Власність заблокованого шляху plugin

Якщо діагностика plugin каже
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і після цього валідація конфігурації показує `plugin present but blocked`, OpenClaw знайшов
файли plugin, що належать іншому Unix-користувачу, ніж процес, який їх завантажує.
Залиште конфігурацію plugin на місці; виправте власність файлової системи або запускайте
OpenClaw від того самого користувача, який володіє каталогом стану.

Для встановлень Docker офіційний образ працює як `node` (uid `1000`), тому
примонтовані з хоста каталоги конфігурації та workspace OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість виправте керований корінь plugin до
власності root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення власності повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр plugin відповідав
виправленим файлам.

Для встановлень npm змінні селектори, як-от `latest` або dist-tag, розв'язуються
перед встановленням, а потім закріплюються до точної перевіреної версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв'язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого artifact plugin.
Керовані npm-корені також успадковують npm `overrides` рівня пакета OpenClaw, тому
security pins, які захищають packaged host, також застосовуються до hoisted зовнішніх
залежностей plugin.

Source checkouts є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати з bundled
plugins, запустіть `pnpm install`; тоді OpenClaw завантажує bundled plugins з
`extensions/<id>`, щоб правки й package-local dependencies використовувалися напряму.
Звичайні npm root installs призначені для packaged OpenClaw, а не для розробки в source checkout.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується in-process    | Офіційні plugins, спільнотні npm-пакети                |
| **Bundle** | Codex/Claude/Cursor-сумісна структура; мапиться на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з'являються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native plugin, почніть з [Створення Plugins](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Пакети npm native plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв'язуватися до читабельного
runtime-файлу або до TypeScript source file з виведеним зібраним JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.
Packaged installs мають постачати цей JavaScript runtime output. TypeScript
source fallback призначений для source checkouts і локальних шляхів розробки, а не для
npm-пакетів, встановлених у керований корінь plugin OpenClaw.

Невідстежувані каталоги, скинуті в глобальний корінь extension, розглядаються як
локальні source checkouts і можуть напряму завантажувати TypeScript entries. Каталоги,
які все ще названі записом встановлення, включно з `installPath` або `sourcePath`, лишаються
керованими й зберігають вимогу compiled-output навіть тоді, коли глобальне сканування бачить
їх. Якщо ви навмисно перетворюєте кероване встановлення на невідстежуваний локальний
checkout, спершу видаліть застарілий запис встановлення через uninstall або doctor cleanup.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час runtime. Це проблема пакування plugin, а не локальна проблема
конфігурації. Оновіть або перевстановіть plugin після того, як видавець повторно опублікує зібраний
JavaScript, або вимкніть/видаліть цей plugin, доки не буде доступний виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й source entries. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення та
виявлення plugin замість тихого fallback до source paths. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript peer; цей файл є обов'язковим, якщо його оголошено.

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

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні packaged
релізи OpenClaw уже bundled багато офіційних plugins, тому їм не потрібні
окремі npm-встановлення у звичайних налаштуваннях. Доки кожен plugin, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети `@openclaw/*` plugin на
npm для старіших/custom installs і прямих npm workflows.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` deprecated, ця версія пакета
походить зі старішої external package train. Використовуйте bundled plugin з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Plugin          | Пакет                      | Документація                               |
| --------------- | -------------------------- | ------------------------------------------ |
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
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` - вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування сумісних з OpenAI
    ембедингів, прикладів Ollama, лімітів пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований браузерний Plugin для інструмента браузера, `openclaw browser` CLI, методу Gateway `browser.request`, браузерного середовища виконання та стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [ClawHub](/uk/clawhub).

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
| `slots`            | Вибір ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для окремих Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, лише перелічені Plugin можуть завантажуватися
або відкривати інструменти, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента,
що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте id Plugin-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` за замовчуванням має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані Plugin постачальників,
зокрема виявлення постачальників вебпошуку під час виконання. Doctor позначає старіші
обмежувальні конфігурації списку дозволених значенням `"compat"` під час міграції, щоб оновлення зберігали
застарілу поведінку вбудованих постачальників, доки оператор не ввімкне суворіший режим.
Порожній `plugins.allow` досі трактується як не заданий/відкритий.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin Gateway у поточному процесі. Нові ходи агента перебудовують свій список інструментів з
оновленого реєстру Plugin. Операції, що змінюють джерела, як-от install,
update та uninstall, досі перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Позначений як
`enabled` Plugin там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
з процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
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
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та Docker-образи зазвичай розв’язують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
прив’язано монтуванням поверх відповідного запакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований вихідний каталог
як накладення джерела вбудованого Plugin і виявляє його перед запакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-пакети
навіть за наявності змонтованих вихідних накладень.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з походженням із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору увімкнених за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель постачальника, конфігурацію каналу або середовище виконання harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin app-server Codex
  вибирається канонічними посиланнями агента `openai/*`, явним
  `agentRuntime.id: "codex"` постачальника/моделі або застарілими посиланнями моделей `codex/*`

## Усунення несправностей runtime hooks

Якщо Plugin з’являється у `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до розв’язання моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
перевірте рядки часу фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема id Plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
конфігурацію середовища виконання, робочий простір, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан володіння, тому фабрики, що
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один Plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти, що належать Plugin,
  щоб поверхня runtime була однозначною.

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

| Слот            | Що він контролює      | За замовчуванням             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний Plugin пам’яті  | `memory-core`       |
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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Він не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає сталий локальний реєстр плагінів як модель холодного читання для
інвентарю плагінів, належності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів.
Той самий файл `plugins/installs.json` зберігає тривалі метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` відновлює його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів плагінів.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутації життєвого циклу плагінів вимкнені.
Керуйте вибором пакетів плагінів і конфігурацією через джерело Nix для
встановлення; для nix-openclaw почніть із орієнтованого на агента
[швидкого старту](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
типової лінії релізів реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи npm і ClawHub
плагінів типової лінії спочатку пробують `@beta` і повертаються до default/latest, якщо beta-релізу
плагіна немає. Точні версії та явні теги залишаються закріпленими.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
плагінів і оновлення плагінів продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політик `before_install` плагіна або блокування через помилку сканування.
Сканування встановлення ігнорує поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані тестові моки;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills з ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно сканувати плагін або робити заблокований реліз
публічним.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable для плагінів.
Поточна runtime-підтримка включає Skills наборів, командні Skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами маркетплейсу можуть бути назва відомого маркетплейсу Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь маркетплейсу або
шлях `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію
GitHub або git URL. Для віддалених маркетплейсів записи плагінів мають залишатися всередині
клонованого репозиторію маркетплейсу та використовувати лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI для `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні плагіни експортують об’єкт точки входу, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають
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

OpenClaw завантажує об’єкт точки входу та викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому його точка входу завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                    |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; код точки входу довіреного плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                             |

Точки входу плагінів, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження в режимі виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує плагін, але не є вільним від імпорту:
OpenClaw може виконати довірену точку входу плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів переносіть
за шляхи full-runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдера моделі (LLM)     |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерацію зображень         |
| `registerMusicGenerationProvider`       | Генерацію музики            |
| `registerVideoGenerationProvider`       | Генерацію відео             |
| `registerWebFetchProvider`              | Провайдера веб-завантаження / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпоїнт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скидає попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скидає попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скидає попереднє скасування.

Нативний сервер застосунку Codex запускає міст, який повертає нативні для Codex події інструментів до цієї поверхні хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст поки не переписує аргументи нативних для Codex інструментів. Точна межа підтримки середовища виконання Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness-runtime#v1-support-contract).

Повну типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) - створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в plugin
- [Внутрішня будова Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [ClawHub](/uk/clawhub) - пошук сторонніх plugins
