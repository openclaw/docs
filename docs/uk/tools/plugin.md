---
read_when:
    - Установлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-06T10:07:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3000dbd6dd660f4dbab9a25c476e4c4e3fba0a9781ae344ea3cc147598d0b0
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, отриманням вебданих, вебпошуком та іншим. Деякі плагіни є **основними** (постачаються з OpenClaw), інші — **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих установлень і для тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання дивіться в розділі
[Керування плагінами](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
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

  <Step title="Керування безпосередньо з чату">
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні плагінів у процесі, а нові ходи агента перебудовують свій список інструментів з оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому Gateway запитує перезапуск замість того, щоб удавати, що поточний процес може безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, методи Gateway, хуки або CLI-команди, що належать плагіну. Звичайний `inspect` — це холодна перевірка маніфесту/реєстру, яка навмисно уникає імпортування runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або специфікація пакета без префікса через npm.

Якщо конфігурація недійсна, установлення зазвичай завершується закрито й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-плагіна для плагінів, які явно погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується закрито, як і будь-яка інша недійсна конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію плагіна, вимкнувши цей запис плагіна й видаливши його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна виявити, але той самий застарілий ідентифікатор плагіна лишається в конфігурації плагінів або записах установлення, запуск Gateway записує попередження в журнали й пропускає цей канал замість того, щоб блокувати всі інші канали.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі ключі каналів без ознак застарілого плагіна й надалі не проходять валідацію, щоб помилки введення лишалися видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає вимкнену конфігурацію плагінів замість її автоматичного видалення. Повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Установлення залежностей плагіна відбувається лише під час явних потоків установлення/оновлення або ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-перевірка не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже повинні мати встановлені залежності, тоді як npm-, git- і ClawHub-плагіни встановлюються в керованих коренях плагінів OpenClaw. Залежності npm можуть бути підняті в межах керованого npm-кореня OpenClaw; установлення/оновлення сканує цей керований корінь перед довірою, а видалення прибирає npm-керовані пакети через npm. Зовнішні плагіни й користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного видимого плагіна без імпортування runtime-коду або ремонту залежностей.
Дивіться [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) щодо життєвого циклу під час установлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагіна повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
а валідація конфігурації далі показує `plugin present but blocked`, OpenClaw знайшов файли плагіна, що належать іншому Unix-користувачу, ніж процес, який їх завантажує. Залиште конфігурацію плагіна на місці; виправте володіння у файловій системі або запускайте OpenClaw від того самого користувача, якому належить каталог стану.

Для встановлень Docker офіційний образ працює як `node` (uid `1000`), тому змонтовані з хоста каталоги конфігурації та робочого простору OpenClaw зазвичай мають належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість відновіть керований корінь плагінів до володіння root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав відремонтованим файлам.

Для npm-установлень змінні селектори, як-от `latest` або dist-tag, розв’язуються перед установленням, а потім фіксуються до точної перевіреної версії в керованому npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений запис
`package-lock.json` і надалі відповідає розв’язаній версії та цілісності. Якщо npm записує інші метадані пакета, установлення завершується помилкою, а керований пакет відкочується замість прийняття іншого артефакту плагіна.
Керовані npm-корені також успадковують npm `overrides` на рівні пакета OpenClaw, тому безпекові фіксації, які захищають упакований хост, також застосовуються до піднятих залежностей зовнішніх плагінів.

Вихідні checkout’и є pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над bundled-плагінами, запустіть `pnpm install`; OpenClaw тоді завантажує bundled-плагіни з
`extensions/<id>`, тож зміни й локальні для пакета залежності використовуються безпосередньо.
Звичайні npm-установлення в корені призначені для упакованого OpenClaw, а не для розробки з вихідного checkout’а.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; мапиться на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Дивіться [Plugin Bundles](/uk/plugins/bundles) для деталей про bundle.

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native-плагінів повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й розв’язуватися до читабельного runtime-файлу або до TypeScript-файлу джерела з виведеним побудованим JavaScript-парником, наприклад `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime-вивід. TypeScript fallback джерела призначений для вихідних checkout’ів і локальних шляхів розробки, а не для npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів, потрібних OpenClaw під час виконання. Це проблема пакування плагіна, а не локальної конфігурації. Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований JavaScript, або вимкніть/видаліть цей плагін, доки не буде доступний виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розміщені за тими самими шляхами, що й записи джерел. Коли `runtimeExtensions` присутній, він має містити рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють установлення й виявлення плагіна замість мовчазного fallback до шляхів джерел. Якщо ви також публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого JavaScript-парника; цей файл є обов’язковим, коли оголошений.

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

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні упаковані випуски OpenClaw уже містять багато офіційних плагінів, тому в типових налаштуваннях вони не потребують окремого встановлення через npm. Доки кожен плагін, що належить OpenClaw, не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` в npm для старіших/користувацьких установлень і прямих npm-робочих процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарів, ця версія пакета походить зі старішої лінійки зовнішніх пакетів. Використовуйте bundled-плагін із поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

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
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам'яті">
    - `memory-core` - вбудований пошук пам'яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам'ять на основі LanceDB з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб дізнатися про налаштування
    ембедингів, сумісних з OpenAI, приклади Ollama, обмеження пригадування й усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований плагін браузера для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання браузера та стандартної служби керування браузером (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (типово вимкнено)

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

| Поле              | Опис                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (типово: `true`)                           |
| `allow`            | Список дозволених плагінів (необов'язково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих плагінів (типово `allowlist`)    |
| `deny`             | Список заборонених плагінів (необов'язково; заборона має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги плагінів                            |
| `slots`            | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для окремого плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить плагіну. Якщо список дозволених інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` типово має значення `"allowlist"` для нових конфігурацій, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані плагіни
постачальників, зокрема виявлення постачальника вебпошуку під час виконання. Doctor позначає старіші
обмежувальні конфігурації списку дозволених значенням `"compat"` під час міграції, щоб оновлення зберігали
застарілу поведінку вбудованих постачальників, доки оператор не погодиться на суворіший режим.
Порожній `plugins.allow` усе ще вважається невстановленим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження плагінів Gateway у межах процесу. Нові ходи агентів перебудовують свій список інструментів з
оновленого реєстру плагінів. Операції, що змінюють джерела, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі плагінів не можна безпечно замінити на місці.

`openclaw plugins list` є локальним знімком реєстру/конфігурації плагінів. Плагін
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани плагінів: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його й видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перша відповідність перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнені типово (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай розв'язують вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо каталог джерел вбудованого плагіна
змонтовано поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог джерел
як накладення вбудованого джерела й виявляє його перед упакованим
пакетом `/app/dist/extensions/synology-chat`. Це підтримує роботу контейнерних
циклів супровідників без перемикання кожного вбудованого плагіна назад на джерела TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-пакети
навіть за наявності змонтованих накладень джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочої області **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору ввімкнених типово, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані плагіни з явним підключенням вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, як-от посилання на модель постачальника, конфігурацію каналу або середовище
  виконання harness
- Застаріла конфігурація плагіна зберігається, поки активний `plugins.enabled: false`;
  знову ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення несправностей runtime hooks

Якщо плагін з'являється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому трафіку чату, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін установлення/конфігурації/коду плагіна. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані hooks розмов, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до розв'язання моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вихід помічника.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагінів

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
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
зокрема ідентифікатор плагіна, оголошені назви інструментів, форму результату та чи є інструмент
необов'язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів плагінів займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів плагінів для повторних розв'язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
конфігурацію runtime, робочу область, ідентифікатори агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, що
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один плагін домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори плагінів мають перемістити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині фабрики інструмента.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених плагінів намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина - зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна й
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з ідентифікатором
  плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать плагінам,
  щоб runtime-поверхня була однозначною.

## Слоти плагінів (ексклюзивні категорії)

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

| Слот            | Що він контролює      | Типово             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний плагін пам'яті  | `memory-core`       |
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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або пакет хуків на місці. Використовуйте `openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-плагінів. Він не підтримується з `--link`, який повторно використовує вихідний шлях замість копіювання в керовану ціль установлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id установленого плагіна до цього списку дозволів перед його ввімкненням. Якщо той самий id плагіна є в `plugins.deny`, установлення видаляє цей застарілий запис заборони, щоб явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як холодну модель читання для інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення, видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry --refresh` відновлює його подання маніфестів із записів установлення, політики конфігурації та метаданих маніфесту/пакета без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень. Передавання назви пакета без версії повертає точно закріплене встановлення до стандартної лінії випусків реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи npm і ClawHub-плагінів зі стандартної лінії спочатку пробують `@beta` і повертаються до default/latest, коли beta-випуску плагіна не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` призначено лише для npm. Він не підтримується з `--marketplace`, тому що marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення та оновлення плагінів продовжуватися після вбудованих знахідок рівня `critical`, але все одно не обходить блокування політики плагіна `before_install` або блокування через збій сканування. Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків установлення/оновлення плагінів. Установлення залежностей Skills, підтримуване Gateway, натомість використовує відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному комп’ютері; він не просить ClawHub повторно просканувати плагін або зробити заблокований випуск публічним.

Сумісні пакети беруть участь у тому самому потоці списку/перевірки/увімкнення/вимкнення плагінів. Поточна runtime-підтримка включає Skills пакетів, командні Skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошених у маніфесті `lspServers`, командні Skills Cursor та сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи MCP- і LSP-серверів для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях `marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші плагіни можуть усе ще використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають використовувати `register`.

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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів, але вбудовані плагіни та нові зовнішні плагіни мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому його вхід завантажується:

| Режим           | Значення                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, служби, команди, маршрути та інші живі побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легкий вхід налаштування.                                                            |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime-вхід.                                                                   |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                    |

Входи плагінів, які відкривають сокети, бази даних, фонові workers або довгоживучі клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`. Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють запущений реєстр Gateway. Виявлення не активує, але не є вільним від імпорту: OpenClaw може виконати довірений вхід плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб переносьте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що реєструє                         |
| --------------------------------------- | ----------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)              |
| `registerChannel`                       | Канал чату                          |
| `registerTool`                          | Інструмент агента                   |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                |
| `registerSpeechProvider`                | Text-to-speech / STT                |
| `registerRealtimeTranscriptionProvider` | Streaming STT                       |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі   |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо              |
| `registerImageGenerationProvider`       | Генерація зображень                 |
| `registerMusicGenerationProvider`       | Генерація музики                    |
| `registerVideoGenerationProvider`       | Генерація відео                     |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape        |
| `registerWebSearchProvider`             | Вебпошук                            |
| `registerHttpRoute`                     | HTTP-ендпоінт                       |
| `registerCommand` / `registerCli`       | Команди CLI                         |
| `registerContextEngine`                 | Рушій контексту                     |
| `registerService`                       | Фонова служба                       |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не очищає попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не очищає попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не очищає попереднє скасування.

Нативний app-server Codex перекидає нативні для Codex події інструментів назад у цю поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Bridge поки що не переписує аргументи нативних інструментів Codex. Точна межа runtime-підтримки Codex міститься в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) - створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) - каталоги сторонніх розробників
