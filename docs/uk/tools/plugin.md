---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T04:02:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 118c856507965f496d87edc1fef8cb67d36c7ef62acc84d5ad130ffd3a3f5568
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв'язками агентів, інструментами, skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, отриманням вебвмісту, вебпошуком
та іншим. Деякі plugins є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих установлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки цю міграцію не завершено.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання й вставлення див.
[Керування plugins](/uk/plugins/manage-plugins).

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

  <Step title="Керування через чат">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні plugins
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

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, gateway
    методи, hooks або CLI-команди, що належать plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпортування runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікація пакета без префікса
через npm.

Якщо конфігурація недійсна, установлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація plugin завершується закритою відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб помістити погану конфігурацію plugin у карантин,
вимкнувши цей запис plugin і вилучивши його недійсне payload конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна знайти, але той самий
застарілий id plugin лишається в конфігурації plugin або записах установлення, запуск Gateway
записує попередження в журнали та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб вилучити застарілі записи каналу/plugin; невідомі
ключі каналів без доказів застарілого plugin і далі провалюють валідацію, щоб помилки введення лишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного вилучення. Повторно ввімкніть plugins перед
запуском очищення doctor, якщо хочете вилучити застарілі id plugin.

Установлення залежностей plugin відбувається лише під час явних потоків install/update або
repair у doctor. Запуск Gateway, перезавантаження конфігурації та runtime inspection
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні plugins уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub plugins
установлюються в керовані OpenClaw корені plugins. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall вилучає керовані npm пакети через npm. Зовнішні plugins
і користувацькі шляхи завантаження все одно мають бути встановлені через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпортування runtime-коду або ремонту залежностей.
Див. [Розв'язання залежностей Plugin](/uk/plugins/dependency-resolution) для
життєвого циклу під час установлення.

### Заблоковане володіння шляхом plugin

Якщо діагностика plugin повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і після цього валідація конфігурації видає `plugin present but blocked`, OpenClaw знайшов
файли plugin, що належать іншому Unix-користувачу, ніж процес, який їх завантажує.
Залиште конфігурацію plugin на місці; виправте володіння файлової системи або запускайте
OpenClaw від того самого користувача, який володіє каталогом стану.

Для Docker-установлень офіційний образ запускається як `node` (uid `1000`), тому
примонтовані з хоста каталоги конфігурації та workspace OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw від root, натомість виправте керований корінь plugin на
root ownership:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр plugin відповідав
виправленим файлам.

Для npm-установлень змінні селектори, як-от `latest` або dist-tag, розв'язуються
перед установленням, а потім фіксуються до точної перевіреної версії в керованому npm-корені OpenClaw.
Після завершення npm OpenClaw перевіряє, що встановлений запис
`package-lock.json` і далі відповідає розв'язаній версії та integrity. Якщо
npm записує інші метадані пакета, установлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту plugin.

Source checkouts є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
plugins, запустіть `pnpm install`; тоді OpenClaw завантажуватиме bundled plugins з
`extensions/<id>`, тож зміни та локальні для пакета залежності використовуватимуться напряму.
Звичайні npm root installs призначені для упакованого OpenClaw, а не для розробки
source checkout.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, спільнотні npm-пакети               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; мапиться на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles), щоб дізнатися деталі bundle.

Якщо ви пишете native plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Native npm-пакети plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й розв'язуватися до читабельного
runtime-файлу або до вихідного TypeScript-файлу з виведеним збудованим JavaScript
парним файлом, наприклад `src/index.ts` до `dist/index.js`.
Упаковані установлення мають постачати цей JavaScript runtime output. TypeScript
source fallback призначений для source checkouts і локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь plugin OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
які OpenClaw потребує під час runtime. Це проблема пакування plugin, а не локальної конфігурації.
Оновіть або перевстановіть plugin після того, як publisher перевидасть скомпільований
JavaScript, або вимкніть/видаліть цей plugin, доки виправлений пакет не стане доступним.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й source entries. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють установлення та
виявлення plugin замість тихого fallback до source paths. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript peer; цей файл є обов'язковим, коли його оголошено.

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

### npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні упаковані
релізи OpenClaw уже містять багато офіційних plugins, тому для звичайних налаштувань вони не потребують
окремих npm-установлень. Доки кожен plugin, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw і далі постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/користувацьких установлень і прямих npm workflows.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` є deprecated, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled plugin з
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
    - `memory-core` - bundled memory search (default via `plugins.slots.memory`)
    - `memory-lancedb` - LanceDB-backed long-term memory with auto-recall/capture (set `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування ембедингів, сумісних з OpenAI,
    прикладів Ollama, лімітів пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - пакетний браузерний плагін для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, браузерного runtime та стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Плагіни спільноти](/uk/plugins/community).

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

| Поле              | Опис                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (за замовчуванням: `true`)             |
| `allow`            | Список дозволених плагінів (необов’язково)                |
| `bundledDiscovery` | Режим виявлення пакетних плагінів (за замовчуванням `allowlist`) |
| `deny`             | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`       | Додаткові файли/каталоги плагінів                         |
| `slots`            | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для кожного плагіна             |

`plugins.allow` є ексклюзивним. Коли він не порожній, завантажуватися
або показувати інструменти можуть лише перелічені плагіни, навіть якщо
`tools.allow` містить `"*"` або назву інструмента, що належить конкретному
плагіну. Якщо список дозволених інструментів посилається на інструменти
плагінів, додайте id плагінів-власників до `plugins.allow` або приберіть
`plugins.allow`; `openclaw doctor` попереджає про таку форму.

`plugins.bundledDiscovery` за замовчуванням має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені пакетні
плагіни постачальників, зокрема виявлення постачальників веб-пошуку під час виконання. Doctor під час міграції позначає старіші
конфігурації з обмежувальним списком дозволених як `"compat"`, щоб оновлення зберігали
застарілу поведінку пакетних постачальників, доки оператор не перейде до суворішого режиму.
Порожній `plugins.allow` і далі вважається неналаштованим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
внутрішньопроцесне перезавантаження плагінів Gateway. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру плагінів. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, все ще перезапускають процес Gateway, оскільки вже імпортовані
модулі плагінів не можна безпечно замінити на місці.

`openclaw plugins list` є локальним знімком реєстру плагінів/конфігурації. Плагін
зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній і недійсний">
  - **Вимкнений**: плагін існує, але правила вмикання його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує плагіни в такому порядку (перемагає перший збіг):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні пакетні каталоги плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб прибрати ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Пакетні плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного вмикання.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай розв’язують пакетні плагіни з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог пакетного плагіна
змонтовано поверх відповідного пакетного шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як оверлей джерел пакетного плагіна та виявляє його перед пакетним
бандлом `/app/dist/extensions/synology-chat`. Це зберігає робочі контейнерні цикли
мейнтейнерів без перемикання кожного пакетного плагіна назад на джерела TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-бандли
навіть за наявності змонтованих оверлеїв джерел.

### Правила вмикання

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Пакетні плагіни дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі пакетні opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або
  середовище виконання стенду
- Застаріла конфігурація плагінів зберігається, поки активний `plugins.enabled: false`;
  знову ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як пакетний плагін
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime-хуків

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в live-трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live-Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або просигнальте дочірній
  процес `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Непакетні хуки розмов, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює вивід асистента.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження payload постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагіна

Якщо здається, що ходи агента зупиняються під час підготовки інструментів, увімкніть trace-логування та
перевірте рядки часу фабрик інструментів плагінів:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів плагінів,
зокрема id плагіна, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1 с або загальна підготовка фабрик інструментів плагінів триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів плагінів для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу включає ефективну
runtime-конфігурацію, робочу область, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан володіння, тому фабрики, які
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один плагін домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поряд із пакетним плагіном, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого id каналу, пріоритетний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з
  id плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте належні плагіну
  інструменти, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активною одночасно може бути лише одна):

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

| Слот            | Що він контролює      | За замовчуванням     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний плагін пам’яті  | `memory-core`       |
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

Вбудовані Plugin-и постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований браузерний
Plugin). Інші вбудовані Plugin-и все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений Plugin або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для планових оновлень відстежуваних npm
Plugin-ів. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого Plugin-а до цього allowlist перед увімкненням. Якщо той самий id Plugin-а
присутній у `plugins.deny`, встановлення вилучає цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає персистентний локальний реєстр Plugin-ів як модель холодного читання для
інвентаря Plugin-ів, належності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin-а.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневих `installRecords` і метадані маніфестів, які можна перебудувати, у
`plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфестів/пакетів без завантаження runtime-модулів Plugin-ів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом Plugin-а та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
типової лінії випусків реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи переписування конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи Plugin-ів npm і ClawHub
типової лінії спочатку пробують `@beta` і повертаються до default/latest, коли beta-випуску
Plugin-а немає. Точні версії та явні теги залишаються закріпленими.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення Plugin-ів
і оновлення Plugin-ів продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики Plugin-а `before_install` або блокування через збій сканування.
Сканування під час встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові mocks;
оголошені runtime-точки входу Plugin-а все одно скануються, навіть якщо використовують одну з
цих назв.

Цей CLI-прапорець застосовується лише до потоків встановлення/оновлення Plugin-ів. Встановлення
залежностей Skills, підтримані Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно сканувати Plugin або робити заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable для Plugin-ів.
Поточна runtime-підтримка включає bundle Skills, Claude command-skills,
типові налаштування Claude `settings.json`, типові налаштування Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin-ів, підтриманих bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом
`marketplace.json`, GitHub-скороченням на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи Plugin-ів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [CLI-довідник `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin-а

Нативні Plugin-и експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin-и все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin-и мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час активації
Plugin-а. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin-ів,
але вбудовані Plugin-и та нові зовнішні Plugin-и мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin-у, чому завантажується його entry:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші живі побічні ефекти.                         |
| `discovery`     | Read-only виявлення можливостей. Реєструйте провайдерів і метадані; довірений код входу Plugin-а може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий setup entry.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime entry.                                                            |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                              |

Entry Plugin-ів, які відкривають сокети, бази даних, фонові workers або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але не є import-free:
OpenClaw може виконати довірений entry Plugin-а або модуль channel Plugin-а, щоб побудувати
snapshot. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а
мережеві клієнти, subprocesses, listeners, читання credentials і запуск сервісів переносіть
за full-runtime шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделей (LLM)     |
| `registerChannel`                       | Чат-канал                   |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI-команди                 |
| `registerContextEngine`                 | Контекстний engine          |
| `registerService`                       | Фоновий сервіс              |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є terminal; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищає попередній block.
- `before_install`: `{ block: true }` є terminal; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищає попередній block.
- `message_sending`: `{ cancel: true }` є terminal; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищає попередній cancel.

Нативний app-server Codex запускає bridge для нативних подій інструментів Codex назад у цю
поверхню хуків. Plugin-и можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge ще не переписує аргументи нативних інструментів Codex.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. у [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) - створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Спільнотні plugins](/uk/plugins/community) - списки сторонніх розробників
