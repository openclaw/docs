---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T03:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a862ffa5549a4185bd6398b30fbfcd8a21d5d443ed1096e3cc832609652fcd85
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі,
голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web
search тощо. Деякі plugins є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm лишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки ця міграція завершиться.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання див.
[Керування plugins](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Подивитися, що завантажено">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у своєму файлі конфігурації.

  </Step>

  <Step title="Керування безпосередньо в чаті">
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні plugin
    у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код plugin, тому
    Gateway запитує перезапуск, а не вдає, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірити plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, методи gateway,
    hooks або CLI-команди, що належать plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або голу специфікацію пакета
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою та вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація plugin завершується закритою відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб помістити погану конфігурацію plugin у карантин,
вимкнувши цей запис plugin і видаливши його недійсне навантаження конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна знайти, але
той самий застарілий ідентифікатор plugin лишається в конфігурації plugin або записах встановлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналів без ознак застарілого plugin і далі не проходять валідацію, щоб друкарські помилки
лишалися видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugins, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Повторно увімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори plugin.

Встановлення залежностей plugin відбувається лише під час явних потоків install/update або
виправлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не виправляють дерева залежностей. Локальні plugins уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub plugins
встановлюються під керованими коренями plugins OpenClaw. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє керовані npm пакети через npm. Зовнішні plugins
і користувацькі шляхи завантаження все одно мають бути встановлені через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпорту runtime-коду або виправлення залежностей.
Див. [Розв’язання залежностей plugin](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

### Заблоковане володіння шляхом plugin

Якщо діагностика plugin повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і далі валідація конфігурації показує `plugin present but blocked`, OpenClaw знайшов
файли plugin, власником яких є інший Unix-користувач, ніж процес, що їх завантажує.
Залиште конфігурацію plugin на місці; виправте володіння у файловій системі або запускайте
OpenClaw від того самого користувача, якому належить каталог стану.

Для Docker-встановлень офіційний образ запускається як `node` (uid `1000`), тому
примонтовані з хоста каталоги конфігурації OpenClaw і робочої області зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість виправте керований корінь plugin до
володіння root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр plugin відповідав
виправленим файлам.

Для npm-встановлень змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед встановленням, а потім закріплюються до точної перевіреної версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, встановлення завершується невдачею, а керований пакет
відкочується замість прийняття іншого артефакту plugin.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
plugins, запустіть `pnpm install`; після цього OpenClaw завантажує bundled plugins з
`extensions/<id>`, тому зміни та локальні для пакета залежності використовуються напряму.
Звичайні npm-встановлення в корінь призначені для упакованого OpenClaw, а не для розробки
з вихідного checkout.

## Типи plugins

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, спільнотні npm-пакети               |
| **Bundle** | Сумісний із Codex/Claude/Cursor layout; відображається на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва показуються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете нативний plugin, почніть з [Створення Plugins](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета та розв’язуватися в читабельний
runtime-файл або в TypeScript-вихідний файл з виведеним побудованим JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime-вивід. Запасний шлях до TypeScript
source призначений для checkout-ів вихідного коду та локальних шляхів розробки, а не для
npm-пакетів, встановлених у керований корінь plugin OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час runtime. Це проблема пакування plugin, а не локальна проблема
конфігурації. Оновіть або перевстановіть plugin після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей plugin, доки не стане доступним виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й source-записи. За наявності `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення plugin замість мовчазного fallback до source-шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого
JavaScript-відповідника; цей файл є обов’язковим, якщо його оголошено.

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
випуски OpenClaw уже містять багато офіційних plugins, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен plugin, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

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

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — bundled-пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять на основі LanceDB з автоматичним recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embedding, сумісного з OpenAI,
    прикладів Ollama, обмежень recall і усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний Plugin для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, браузерного runtime і стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
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

| Поле              | Опис                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (за замовчуванням: `true`)                           |
| `allow`            | Список дозволених plugins (необов’язково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих plugins (за замовчуванням `allowlist`)    |
| `deny`             | Список заборонених plugins (необов’язково; deny має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги plugins                            |
| `slots`            | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі + конфігурація для окремого Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте id plugins-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` для нових конфігурацій за замовчуванням має значення `"allowlist"`, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані plugins-провайдери,
зокрема runtime-виявлення провайдерів вебпошуку. Doctor під час міграції позначає старіші
обмежувальні конфігурації allowlist значенням `"compat"`, щоб оновлення зберігали
застарілу поведінку вбудованих провайдерів, доки оператор не ввімкне суворіший режим.
Порожній `plugins.allow` усе ще вважається не заданим/відкритим.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у процесі Gateway. Нові ходи агентів перебудовують свій список інструментів із
оновленого реєстру plugins. Операції, що змінюють джерело, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, тому що вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, фактичному
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани Plugin: disabled, missing і invalid">
  - **Вимкнено**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його й видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перша відповідність перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих plugins OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення й образи Docker зазвичай вирішують вбудовані plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого Plugin
змонтувати поверх відповідного запакованого шляху до джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерела
як накладення вбудованого джерела й виявляє його перед запакованим
бандлом `/app/dist/extensions/synology-chat`. Це підтримує робочі цикли контейнерів
для супровідників без перемикання кожного вбудованого Plugin назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-бандли,
навіть коли присутні монтування накладень джерела.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins із робочого простору **вимкнено за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору default-on, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація Plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить до Plugin OpenAI, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в live-трафіку чату, спочатку перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін install/config/code Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює вивід асистента.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні session/status Gateway і, під час налагодження payload провайдера, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо ходи агента ніби зависають під час підготовки інструментів, увімкніть trace-логування та
перевірте рядки часу виконання фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема id Plugin, оголошені назви інструментів, форму результату та чи інструмент є
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
із тим самим ефективним контекстом запиту. Ключ кешу включає ефективну
runtime-конфігурацію, робочий простір, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один Plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають перенести
дороге завантаження залежностей за шлях виконання інструмента, а не робити його
всередині фабрики інструмента.

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
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти, що належать Plugin,
  щоб runtime-поверхня була однозначною.

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

| Слот            | Що він контролює      | За замовчуванням             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin active memory  | `memory-core`       |
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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте `openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-плагінів. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає ідентифікатор установленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна є в `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб явно встановлений плагін можна було завантажити одразу після перезапуску.

OpenClaw зберігає сталий локальний реєстр плагінів як холодну модель читання для інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення, видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry --refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та метаданих маніфесту/пакета без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень. Передавання назви пакета без версії повертає точно закріплене встановлення до стандартної лінії релізів реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення без завантаження, повторного встановлення або переписування конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи npm і ClawHub-плагінів зі стандартної лінії спершу пробують `@beta` і повертаються до standard/latest, якщо beta-релізу плагіна немає. Точні версії та явні теги залишаються закріпленими.

`--pin` призначено лише для npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення та оновлення плагінів попри вбудовані знахідки `critical`, але все одно не обходить блокування політик плагіна `before_install` або блокування через збій сканування. Сканування під час встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній машині; він не просить ClawHub повторно сканувати плагін і не робить заблокований реліз публічним.

Сумісні пакети беруть участь у тому самому потоці списку/інспектування/ввімкнення/вимкнення плагінів. Поточна підтримка runtime включає Skills пакетів, command-skills Claude, стандартні налаштування Claude `settings.json`, стандартні налаштування Claude `.lsp.json` і оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи MCP- і LSP-серверів для плагінів на базі пакетів.

Джерела marketplace можуть бути відомою назвою marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом `marketplace.json`, GitHub-скороченням на кшталт `owner/repo`, URL репозиторію GitHub або git-URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Повні відомості див. в [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають використовувати `register`.

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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів, але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його точка входу:

| Режим          | Значення                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                                       |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                                  |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                                         |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                                |

Точки входу плагінів, які відкривають сокети, бази даних, фонові workers або довгоживучі клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`. Завантаження для виявлення кешуються окремо від завантажень активації та не замінюють поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту: OpenClaw може оцінити довірену точку входу плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережевих клієнтів, підпроцеси, слухачі, читання облікових даних і запуск сервісів переносьте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що реєструє                       |
| --------------------------------------- | --------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)            |
| `registerChannel`                       | Чат-канал                         |
| `registerTool`                          | Інструмент агента                 |
| `registerHook` / `on(...)`              | Хуки життєвого циклу              |
| `registerSpeechProvider`                | Text-to-speech / STT              |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                     |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо            |
| `registerImageGenerationProvider`       | Генерація зображень               |
| `registerMusicGenerationProvider`       | Генерація музики                  |
| `registerVideoGenerationProvider`       | Генерація відео                   |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape      |
| `registerWebSearchProvider`             | Вебпошук                          |
| `registerHttpRoute`                     | HTTP-ендпойнт                     |
| `registerCommand` / `registerCli`       | Команди CLI                       |
| `registerContextEngine`                 | Рушій контексту                   |
| `registerService`                       | Фоновий сервіс                    |

Поведінка запобіжників хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний app-server Codex запускає міст, який повертає нативні події інструментів Codex у цю поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex. Точна межа підтримки runtime Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні plugins](/uk/plugins/community) — списки сторонніх розробників
