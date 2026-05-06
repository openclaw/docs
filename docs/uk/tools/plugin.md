---
read_when:
    - Встановлення або налаштування Plugin-ів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте plugins OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-06T12:51:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
оболонками агентів, інструментами, skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, веботриманням, вебпошуком
та іншим. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **external**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання див. у
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому конфігураційному файлі.

  </Step>

  <Step title="Керування через чат">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    плагінів у процесі, а нові ходи агентів перебудовують свій список інструментів із
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск замість того, щоб удавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, служби, методи gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру та навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або специфікація пакета без префікса через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується закритою відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію плагіна,
вимкнувши цей запис плагіна та вилучивши його недійсне конфігураційне навантаження; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах встановлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб вилучити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна й надалі не проходять валідацію, щоб друкарські помилки залишалися
видимими.
Якщо задано `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного вилучення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете вилучити застарілі ідентифікатори плагінів.

Встановлення залежностей плагінів відбувається лише під час явних потоків встановлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни мають уже
мати встановлені залежності, тоді як плагіни npm, git і ClawHub
встановлюються в керовані корені плагінів OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення вилучає керовані npm пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно мають встановлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду або ремонту залежностей.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) для
життєвого циклу під час встановлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагінів повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
а валідація конфігурації далі показує `plugin present but blocked`, OpenClaw знайшов
файли плагіна, власником яких є інший Unix-користувач, ніж процес, що їх завантажує.
Залиште конфігурацію плагіна на місці; виправте володіння у файловій системі або запускайте
OpenClaw від того самого користувача, якому належить каталог стану.

Для встановлень Docker офіційний образ запускається як `node` (uid `1000`), тому
примонтовані з хоста каталоги конфігурації та робочої області OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість відремонтуйте керований корінь плагінів до
володіння root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав
відремонтованим файлам.

Для встановлень npm змінні селектори, такі як `latest` або dist-tag, розв’язуються
перед встановленням, а потім фіксуються до точної перевіреної версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` і далі відповідає розв’язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується невдало, а керований пакет
відкочується замість прийняття іншого артефакту плагіна.
Керовані npm-корені також успадковують package-level npm `overrides` OpenClaw, тому
безпекові фіксації, що захищають упакований хост, також застосовуються до hoisted зовнішніх
залежностей плагінів.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; тоді OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож зміни та package-local залежності використовуються напряму.
Звичайні npm-встановлення в корінь призначені для упакованого OpenClaw, а не для розробки
source checkout.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; відображається на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети плагінів](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та розв’язуватися до читаного
runtime-файлу або до вихідного TypeScript-файлу з виведеним зібраним JavaScript
парником, наприклад від `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime-вивід. Резервний варіант
із TypeScript-джерелом призначений для source checkout-ів і локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час runtime. Це проблема пакування плагіна, а не локальної конфігурації.
Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки не стане доступним виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли наявний `runtimeExtensions`, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення плагіна замість тихого fallback до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript парника; цей файл є обов’язковим, коли його оголошено.

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
релізи OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Поки кожен плагін, що належить OpenClaw,
не мігрував до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*`
на npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарілий, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте вбудований плагін із
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

### Core (постачається з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin-и пам’яті">
    - `memory-core` - вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embedding,
    сумісного з OpenAI, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований browser plugin для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання браузера та стандартного сервісу керування браузером (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (типово вимкнено)

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

| Поле              | Опис                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (типово: `true`)                       |
| `allow`            | Список дозволених plugins (необов’язково)                 |
| `bundledDiscovery` | Режим виявлення вбудованих plugins (типово `allowlist`)   |
| `deny`             | Список заборонених plugins (необов’язково; deny перемагає) |
| `load.paths`       | Додаткові файли/каталоги plugins                          |
| `slots`            | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі + конфігурація для окремого plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, можуть завантажуватися
або надавати інструменти лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить plugin. Якщо список дозволених інструментів посилається на інструменти plugins, додайте id власницьких plugins
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про цю
форму.

`plugins.bundledDiscovery` типово має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані provider
plugins, включно з виявленням провайдера вебпошуку під час виконання. Doctor позначає старіші
обмежувальні конфігурації allowlist значенням `"compat"` під час міграції, щоб оновлення зберігали
застарілу поведінку вбудованого провайдера, доки оператор не ввімкне суворіший режим.
Порожній `plugins.allow` і надалі вважається незаданим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Gateway plugin у поточному процесі. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру plugins. Операції зі зміною джерела, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, бо вже імпортовані
модулі plugin не можна безпечно замінити на місці.

`openclaw plugins list` є локальним знімком реєстру/конфігурації plugins. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом plugin. У налаштуваннях VPS/контейнерів
з wrapper-процесами надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id plugin, який виявлення не знайшло.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перемагає перший збіг):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих plugins OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнено типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення й Docker-образи зазвичай знаходять вбудовані plugins з
скомпільованого дерева `dist/extensions`. Якщо каталог джерел вбудованого plugin
змонтовано поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерел
як накладення джерел для вбудованого plugin і виявляє його перед упакованим
bundle `/app/dist/extensions/synology-chat`. Це зберігає робочі цикли контейнерів
maintainer без перемикання кожного вбудованого plugin назад на джерела TypeScript.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist bundles
навіть за наявності змонтованих накладень джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди перемагає allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins з походженням із робочого простору **типово вимкнені** (їх треба явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору, увімкненого типово, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, як-от посилання на модель провайдера, конфігурацію каналу або середовище виконання harness
- Застаріла конфігурація plugin зберігається, поки активний `plugins.enabled: false`;
  знову ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі plugins:
  `openai-codex/*` належить OpenAI plugin, тоді як вбудований app-server plugin Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в live chat traffic, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, profile, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін install/config/code для plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює assistant output.
- Для підтвердження фактичної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway, а під час налагодження payloads провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть trace logging і
перевірте рядки часу виконання фабрик інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів plugin,
включно з id plugin, оголошеними назвами інструментів, формою результату та тим, чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1s або загальна підготовка фабрик інструментів plugin триває щонайменше 5s.

OpenClaw кешує успішні результати фабрик інструментів plugin для повторних розв’язань
з тим самим фактичним контекстом запиту. Ключ кешу містить фактичну
runtime config, workspace, ids агента/сеансу, політику sandbox, налаштування браузера,
контекст доставки, ідентичність requester і стан ownership, тому фабрики, що
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один plugin домінує за часом, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори plugins мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструментів.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина - зовнішній channel plugin,
встановлений поруч із вбудованим plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  packages plugin, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, пріоритетний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти,
  що належать plugin, щоб runtime surface була однозначною.

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
| `memory`        | Активний memory plugin | `memory-core`       |
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

Вбудовані plugins постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або пакет hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль установлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор установленого plugin до цього allowlist перед його увімкненням. Якщо той самий ідентифікатор plugin
присутній у `plugins.deny`, установлення видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр plugins як модель холодного читання для
інвентаризації plugins, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану plugin. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів установлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів plugin.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторів життєвого циклу plugins вимкнено.
Натомість керуйте вибором пакетів plugin і конфігурацією через джерело Nix для
встановлення; для nix-openclaw почніть з agent-first
[Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точне закріплене встановлення до
стандартної лінії випусків реєстру. Якщо встановлений npm-plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.
Коли `openclaw update` працює на beta-каналі, записи plugins стандартної лінії npm і ClawHub
спочатку пробують `@beta` і повертаються до default/latest, коли beta-випуску plugin
немає. Точні версії та явні теги залишаються закріпленими.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
plugins і оновлення plugins продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, такі як `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб уникнути блокування запакованих тестових mock-об’єктів;
оголошені runtime entrypoints plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків установлення/оновлення plugin. Установлення
залежностей Skills на базі Gateway використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель керування ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно просканувати plugin або зробити заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable для plugins.
Поточна runtime-підтримка включає bundle skills, Claude command-skills,
стандартні налаштування Claude `settings.json`, стандартні налаштування Claude `.lsp.json` і
оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для plugins на базі bundle.

Джерелами marketplace можуть бути відома назва Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugins мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Дивіться [довідку CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Нативні plugins експортують entry-об’єкт, який надає `register(api)`. Старіші
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

OpenClaw завантажує entry-об’єкт і викликає `register(api)` під час
активації plugin. Завантажувач усе ще повертається до `activate(api)` для старіших plugins,
але вбудовані plugins і нові зовнішні plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, сервіси, commands, routes та інші живі побічні ефекти.                              |
| `discovery`     | Read-only виявлення можливостей. Реєструйте providers і метадані; довірений entry-код plugin може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування channel через легкий setup entry.                                                            |
| `setup-runtime` | Завантаження налаштування channel, яке також потребує runtime entry.                                                             |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Entry points plugin, які відкривають сокети, бази даних, фонові workers або довгоживучі
clients, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від activation-завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але не є import-free:
OpenClaw може оцінити довірений entry plugin або модуль channel plugin, щоб побудувати
snapshot. Тримайте module top levels легкими та без побічних ефектів, а
network clients, subprocesses, listeners, credential reads і service startup переміщуйте
за full-runtime paths.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Чат-канал                   |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Фоновий сервіс              |

Поведінка guard для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попередній block.
- `before_install`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попередній block.
- `message_sending`: `{ cancel: true }` є terminal; handlers із нижчим priority пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попередній cancel.

Запуски нативного сервера застосунку Codex передають події інструментів, нативних для Codex, назад у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge поки не переписує аргументи інструментів, нативних для Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Щоб дізнатися про повну типізовану поведінку хуків, див. [огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) - створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Спільнотні plugins](/uk/plugins/community) - списки сторонніх розробників
