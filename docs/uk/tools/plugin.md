---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:54:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному
часі, розумінням медіа, генерацією зображень, генерацією відео, веботриманням, вебпошуком
та іншим. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих установлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання див.
[Керування плагінами](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
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
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    плагінів у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск, а не вдає, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, методи gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру та навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або специфікація пакета без префікса через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою та спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується закритою відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати неправильну конфігурацію плагіна,
вимкнувши цей запис плагіна та вилучивши його недійсне конфігураційне навантаження; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження в журнал і пропускає цей канал, замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб вилучити застарілі записи каналу/плагіна; невідомі
ключі каналів без ознак застарілого плагіна все одно не проходять валідацію, щоб друкарські помилки залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни розглядаються як інертні:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного вилучення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете вилучити застарілі ідентифікатори плагінів.

Встановлення залежностей плагіна відбувається лише під час явних потоків встановлення/оновлення або
відновлення через doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні плагіни вже повинні
мати встановлені залежності, тоді як npm, git і ClawHub-плагіни
встановлюються в керовані корені плагінів OpenClaw. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно мають бути встановлені через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду або відновлення залежностей.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагіна повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і валідація конфігурації далі показує `plugin present but blocked`, OpenClaw знайшов
файли плагіна, власником яких є інший користувач Unix, ніж процес, що їх завантажує.
Залиште конфігурацію плагіна на місці; виправте володіння у файловій системі або запускайте
OpenClaw від того самого користувача, який володіє каталогом стану.

Для встановлень Docker офіційний образ запускається як `node` (uid `1000`), тому
змонтовані з хоста каталоги конфігурації та робочого простору OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість відновіть керований корінь плагінів до
володіння root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав
відновленим файлам.

Для npm-установлень змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед установленням, а потім закріплюються за точною перевіреною версією в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту плагіна.
Керовані npm-корені також успадковують npm `overrides` на рівні пакета OpenClaw, тому
security pins, які захищають упакований хост, також застосовуються до піднятих зовнішніх
залежностей плагінів.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож правки та локальні для пакета залежності використовуються напряму.
Звичайні npm-установлення в корені призначені для упакованого OpenClaw, а не для розробки
з checkout вихідного коду.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Codex/Claude/Cursor-сумісна структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundle див. [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете нативний плагін, почніть з [Побудови плагінів](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та розв’язуватися до читабельного
runtime-файлу або до TypeScript-файлу вихідного коду з виведеним збудованим JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime-вивід. Резервний шлях до TypeScript
вихідного коду призначений для checkout-ів вихідного коду та локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час runtime. Це проблема пакування плагіна, а не локальної конфігурації.
Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки не буде доступний виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й записи вихідного коду. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення плагінів, а не мовчки повертаються до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
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

## Офіційні плагіни

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні упаковані
релізи OpenClaw уже містять багато офіційних плагінів, тому в нормальних налаштуваннях їм не потрібні
окремі npm-установлення. Поки кожен плагін, що належить OpenClaw, не
мігрував до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` у
npm для старіших/користувацьких установлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` deprecated, ця версія пакета
належить до старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Плагін          | Пакет                    | Документація                                       |
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

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - вбудований пошук у памʼяті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала памʼять на основі LanceDB з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування сумісних з OpenAI
    embeddings, прикладів Ollama, лімітів пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - вбудований browser plugin для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання браузера та типової служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Community Plugins](/uk/plugins/community).

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
| `enabled`          | Головний перемикач (типово: `true`)                           |
| `allow`            | Список дозволених Plugin (необовʼязково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих Plugin (`allowlist` за замовчуванням)    |
| `deny`             | Список заборонених Plugin (необовʼязково; заборона має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги Plugin                            |
| `slots`            | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі та конфігурація для окремих Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента,
що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте id відповідних Plugin
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` типово має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані provider
plugins, зокрема виявлення provider для web-search під час виконання. Doctor позначає старіші
обмежувальні конфігурації allowlist значенням `"compat"` під час міграції, щоб оновлення зберігали
застарілу поведінку вбудованих provider, доки оператор не перейде на суворіший режим.
Порожній `plugins.allow` і надалі вважається не заданим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у процесі Gateway. Нові ходи agent перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, бо вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin.
Plugin зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте рестарти або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Вимкнено**: plugin існує, але правила увімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його й вилучивши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перша відповідність перемагає):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні упаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб вилучити ці застарілі псевдоніми.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (model providers, мовлення).
    Інші потребують явного увімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай розвʼязують вбудовані plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог джерела вбудованого Plugin
змонтовано поверх відповідного упакованого шляху джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог джерела
як накладення вбудованого джерела та виявляє його перед упакованим
bundle `/app/dist/extensions/synology-chat`. Це дає змогу maintainer container
loops працювати без перемикання кожного вбудованого Plugin назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist bundles
навіть за наявності монтувань накладення джерела.

### Правила увімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins, що походять із workspace, **вимкнені за замовчуванням** (мають бути явно увімкнені)
- Вбудовані plugins дотримуються вбудованого набору, увімкненого за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово увімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  surface, що належить Plugin, як-от посилання на модель provider, конфігурацію channel або середовище виконання
  harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете вилучити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить до OpenAI plugin, тоді як вбудований Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin зʼявляється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому chat traffic, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, profile, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін install/config/code Plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  розвʼязання моделі для ходів agent; `llm_output` виконується лише після того, як спроба моделі
  створює assistant output.
- Для доказу ефективної моделі session використовуйте `openclaw sessions` або
  surface session/status Gateway, а під час налагодження provider payloads запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи agent зависають під час підготовки інструментів, увімкніть trace logging і
перевірте рядки timing factory для інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час factory і найповільніші tool factories Plugin,
зокрема id Plugin, оголошені назви інструментів, форму результату та чи інструмент є
необовʼязковим. Повільні рядки підвищуються до warnings, коли один factory займає
принаймні 1 с або загальна підготовка tool factory Plugin займає принаймні 5 с.

OpenClaw кешує успішні результати tool factory Plugin для повторних розвʼязань
з тим самим ефективним request context. Ключ кешу містить ефективну
runtime config, workspace, id agent/session, sandbox policy, browser settings,
delivery context, requester identity і ownership state, тому factories, що
залежать від цих довірених полів, повторно запускаються, коли context змінюється.

Якщо один plugin домінує в timing, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори Plugin мають перемістити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині tool factory.

### Дублювання власності channel або tool

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим channel,
setup flow або назвою tool. Найпоширеніша причина — зовнішній channel plugin,
установлений поруч із вбудованим plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і diagnostics.
- Запустіть `openclaw plugins registry --refresh` після встановлення або вилучення
  packages Plugin, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або вилучіть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для channel або перейменуйте tools,
  що належать Plugin, щоб runtime surface був однозначним.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активна лише одна):

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

| Слот            | Чим керує      | Типове значення             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний memory plugin  | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор установленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна
є в `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб
явно встановлений плагін можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр плагінів як модель холодного читання для
інвентаризації плагінів, власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в
`plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` відновлює його представлення маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів плагінів.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) засоби зміни життєвого циклу плагінів вимкнені.
Натомість керуйте вибором пакетів плагінів і конфігурацією через джерело Nix для
встановлення; для nix-openclaw почніть із орієнтованого на агента
[швидкого старту](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
стандартної лінії випусків реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` виконується на бета-каналі, записи npm і ClawHub
плагінів стандартної лінії спершу пробують `@beta` і повертаються до default/latest, якщо бета-випуску плагіна
не існує. Точні версії та явні теги залишаються закріпленими.

OpenClaw ще не надає каналів плагінів із LTS або щомісячною підтримкою. Запланована
робота над щомісячною лінією підтримки потребуватиме, щоб теги npm і ClawHub плагінів дотримувалися
тієї самої лінії підтримки, що й основний пакет, замість тихого використання `latest`.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення плагінів
і оновлення плагінів попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI-прапорець застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills
із підтримкою Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`,
тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно сканувати плагін або зробити заблокований випуск
публічним.

Сумісні набори беруть участь у тому самому потоці списку/інспектування/увімкнення/вимкнення
плагінів. Поточна runtime-підтримка охоплює Skills із наборів, командні Skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію
GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Докладні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому його запис завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                     |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                                                  |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime-запис.                                                            |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                              |

Записи плагінів, які відкривають сокети, бази даних, фонових працівників або довгоживучі
клієнти, мають обмежувати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може виконати довірений запис плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів переміщуйте
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє              |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Провайдер моделей (LLM)      |
| `registerChannel`                       | Канал чату                   |
| `registerTool`                          | Інструмент агента            |
| `registerHook` / `on(...)`              | Хуки життєвого циклу         |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`       | Генерація зображень          |
| `registerMusicGenerationProvider`       | Генерація музики             |
| `registerVideoGenerationProvider`       | Генерація відео              |
| `registerWebFetchProvider`              | Провайдер вебзавантаження / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                     |
| `registerHttpRoute`                     | HTTP-точка входу             |
| `registerCommand` / `registerCli`       | CLI-команди                  |
| `registerContextEngine`                 | Рушій контексту              |
| `registerService`                       | Фоновий сервіс               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попередній блок.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попередній блок.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний Codex app-server передає події нативних для Codex інструментів назад у цю
поверхню хуків. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних для Codex інструментів.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) - створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) - списки сторонніх розробників
