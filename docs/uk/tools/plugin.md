---
read_when:
    - Встановлення або налаштування plugins
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T08:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв’язками агентів, інструментами, skills, мовленням, транскрибуванням у реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, web fetch, web
search тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція не завершиться.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення й публікації для копіювання дивіться в
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

  <Step title="Керування в чаті">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    плагінів у процесі, а нові ходи агента перебудовують свій список інструментів із
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

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, служби, методи gateway,
    hooks або CLI-команди, що належать плагіну. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий розв’язувач, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або специфікація пакета без префікса через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується без змін і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується без змін, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію плагіна,
вимкнувши цей запис плагіна й видаливши його недійсне конфігураційне навантаження; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах встановлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все одно не проходять валідацію, щоб друкарські помилки залишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Повторно ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Встановлення залежностей плагіна відбувається лише під час явних потоків встановлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже повинні
мати встановлені залежності, тоді як npm, git і ClawHub-плагіни
встановлюються в керовані OpenClaw корені плагінів. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає npm-керовані пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно мають встановлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду або ремонту залежностей.
Дивіться [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) для
життєвого циклу під час встановлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагіна повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і після цього валідація конфігурації показує `plugin present but blocked`, OpenClaw знайшов
файли плагіна, власником яких є інший Unix-користувач, ніж процес, що їх завантажує.
Залиште конфігурацію плагіна на місці; виправте володіння файлової системи або запускайте
OpenClaw від того самого користувача, який володіє каталогом стану.

Для встановлень Docker офіційний образ запускається як `node` (uid `1000`), тому
примонтовані з хоста каталоги конфігурації та робочого простору OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, натомість відремонтуйте керований корінь плагінів
до володіння root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав
відремонтованим файлам.

Для встановлень npm змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед встановленням, а потім фіксуються до точної перевіреної версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакта плагіна.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; тоді OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож зміни й локальні залежності пакета використовуються напряму.
Звичайні встановлення в npm-корінь призначені для упакованого OpenClaw, а не для розробки
у checkout вихідного коду.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі     | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; мапиться на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Дивіться [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Npm-пакети native-плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або у вихідний TypeScript-файл із виведеним збудованим JavaScript
парним файлом, наприклад `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime-вивід. Fallback на TypeScript
джерело призначений для checkout-ів вихідного коду й локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час runtime. Це проблема пакування плагіна, а не проблема локальної конфігурації.
Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки не буде доступний виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення й
виявлення плагіна замість тихого fallback до шляхів джерел. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript-парного файлу; цей файл є обов’язковим, коли оголошений.

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
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*`
на npm для старіших/користувацьких встановлень і прямих npm-потоків.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` є deprecated, ця версія пакета
належить до старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін із
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Плагін          | Пакет                      | Документація                               |
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

  <Accordion title="Плагіни пам’яті">
    - `memory-core` - вбудований пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування embedding, сумісного з OpenAI,
    прикладів Ollama, обмежень recall і усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований plugin браузера для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
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

| Поле              | Опис                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (за замовчуванням: `true`)             |
| `allow`            | Список дозволених plugins (необов'язково)                 |
| `bundledDiscovery` | Режим виявлення вбудованих plugins (за замовчуванням `allowlist`) |
| `deny`             | Список заборонених plugins (необов'язково; deny має перевагу) |
| `load.paths`       | Додаткові файли/каталоги plugin                           |
| `slots`            | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для окремого plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента,
що належить plugin. Якщо список дозволених інструментів посилається на інструменти plugin, додайте ідентифікатори plugin-власників
до `plugins.allow` або приберіть `plugins.allow`; `openclaw doctor` попереджає про таку форму.

Для нових конфігурацій `plugins.bundledDiscovery` за замовчуванням має значення `"allowlist"`, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані
plugins провайдерів, зокрема виявлення runtime-провайдерів вебпошуку. Під час міграції Doctor позначає старі
обмежувальні конфігурації зі списком дозволених як `"compat"`, щоб після оновлень зберігалася
успадкована поведінка вбудованих провайдерів, доки оператор не перейде на суворіший режим.
Порожній `plugins.allow` і далі вважається невстановленим/відкритим.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження plugins Gateway у межах процесу. Нові ходи агента перебудовують свій список інструментів з
оновленого реєстру plugins. Операції зі зміною джерел, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, бо вже імпортовані
модулі plugin не можна безпечно замінити на місці.

`openclaw plugins list` - це локальний знімок реєстру/конфігурації plugins. Позначка
`enabled` для plugin там означає, що збережений реєстр і поточна конфігурація дозволяють
plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом plugin. У конфігураціях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор plugin, який не було знайдено під час виявлення.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих plugins OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочої області">
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

Запаковані встановлення та образи Docker зазвичай розв'язують вбудовані plugins з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого plugin
змонтовано поверх відповідного запакованого шляху до джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований вихідний каталог
як оверлей джерела вбудованого plugin і виявляє його перед запакованим
пакетом `/app/dist/extensions/synology-chat`. Це підтримує контейнерні цикли
супровідників без перемикання кожного вбудованого plugin назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-пакети,
навіть коли присутні змонтовані оверлеї джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins з робочої області **вимкнені за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору ввімкнення за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins автоматично вмикаються, коли конфігурація називає
  поверхню, що належить plugin, наприклад посилання на модель провайдера, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugins:
  `openai-codex/*` належить до plugin OpenAI, тоді як вбудований plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або успадковані
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з'являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому трафіку чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін install/config/code plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  розв'язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід assistant.
- Для доказу ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансів/статусу Gateway і, під час налагодження payloads провайдера, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо ходи агента, здається, зависають під час підготовки інструментів, увімкніть trace-журналювання і
перевірте рядки часу виконання фабрик інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення показує загальний час фабрик і найповільніші фабрики інструментів plugin,
зокрема ідентифікатор plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов'язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика виконується
щонайменше 1 с або загальна підготовка фабрик інструментів plugin триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів plugin для повторних розв'язань
із тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, ідентифікатори агента/сеансу, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, які
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори plugins мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині фабрики інструмента.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина - зовнішній channel plugin,
встановлений поруч із вбудованим plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрілого plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін install, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать plugin,
  щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (лише одна активна за раз):

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

| Слот            | Що він контролює      | За замовчуванням    |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active memory  | `memory-core`       |
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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте `openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-плагінів. Цей прапорець не підтримується з `--link`, який повторно використовує шлях до джерела замість копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає ідентифікатор установленого плагіна до цього allowlist перед його ввімкненням. Якщо той самий ідентифікатор плагіна присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб явно встановлений плагін можна було завантажити одразу після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як модель холодного читання для інвентаря плагінів, власності внесків і планування запуску. Потоки встановлення, оновлення, видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в `installRecords` верхнього рівня та відновлювані метадані маніфестів у `plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry --refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та метаданих маніфестів/пакетів без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень. Передавання назви пакета без версії повертає точне закріплене встановлення до стандартної лінії випусків реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення без завантаження, повторного встановлення або перезапису конфігурації.
Коли `openclaw update` виконується на beta-каналі, записи плагінів npm і ClawHub зі стандартною лінією спочатку пробують `@beta`, а потім повертаються до default/latest, якщо beta-випуск плагіна відсутній. Точні версії та явні теги залишаються закріпленими.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, тому що встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Воно дає змогу встановленням і оновленням плагінів продовжуватися попри вбудовані знахідки `critical`, але все одно не обходить блокування політики плагіна `before_install` або блокування через збій сканування. Сканування під час встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з таких назв.

Цей CLI-прапорець застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному комп’ютері; він не просить ClawHub повторно просканувати плагін або зробити заблокований випуск публічним.

Сумісні пакети беруть участь у тому самому потоці list/inspect/enable/disable для плагінів. Поточна підтримка runtime охоплює bundle skills, командні Skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті `lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома Claude назва marketplace з `~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Докладну інформацію див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні плагіни експортують об’єкт точки входу, який надає `register(api)`. Старіші плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають використовувати `register`.

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

OpenClaw завантажує об’єкт точки входу та викликає `register(api)` під час активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів, але вбудовані плагіни та нові зовнішні плагіни мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші живі побічні ефекти.                         |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; довірений код точки входу плагіна може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                  |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                       |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                              |

Точки входу плагінів, які відкривають сокети, бази даних, фонові воркери або довгоживучі клієнти, мають обмежувати ці побічні ефекти перевіркою `api.registrationMode === "full"`. Завантаження для виявлення кешуються окремо від завантажень активації та не замінюють запущений реєстр Gateway. Виявлення є неактивувальним, але не вільним від імпорту: OpenClaw може виконати довірену точку входу плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів переміщуйте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                         |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)              |
| `registerChannel`                       | Канал чату                              |
| `registerTool`                          | Інструмент агента                       |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                    |
| `registerSpeechProvider`                | Text-to-speech / STT                    |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                           |
| `registerRealtimeVoiceProvider`         | Дуплексний realtime-голос               |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                  |
| `registerImageGenerationProvider`       | Генерація зображень                     |
| `registerMusicGenerationProvider`       | Генерація музики                        |
| `registerVideoGenerationProvider`       | Генерація відео                         |
| `registerWebFetchProvider`              | Постачальник web fetch / scrape         |
| `registerWebSearchProvider`             | Вебпошук                                |
| `registerHttpRoute`                     | HTTP endpoint                           |
| `registerCommand` / `registerCli`       | CLI-команди                             |
| `registerContextEngine`                 | Рушій контексту                         |
| `registerService`                       | Фоновий сервіс                          |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попереднє скасування.

Нативний app-server Codex передає події нативних інструментів Codex назад у цю поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex. Точна межа підтримки runtime Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) - створіть власний plugin
- [Plugin bundles](/uk/plugins/bundles) - сумісність bundle Codex/Claude/Cursor
- [Plugin manifest](/uk/plugins/manifest) - схема manifest
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) - додайте agent tools у plugin
- [Plugin internals](/uk/plugins/architecture) - модель capability і конвеєр завантаження
- [Community plugins](/uk/plugins/community) - сторонні списки
