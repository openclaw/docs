---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування plugins OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-06T11:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cb1f43f7ccc99889b62648562319d205a13072a93cc9fbc7ca0e00c96e19ed6
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
обв’язки агентів, інструменти, навички, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
веботримання, вебпошук тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення копіюванням і вставленням, перегляду списку, видалення, оновлення та публікації див.
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

  <Step title="Керування з чату">
    У запущеному Gateway доступні лише власнику команди `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    плагіна в поточному процесі, а нові ходи агента перебудовують свій список інструментів із
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск, замість удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, служби, методи Gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпорту runtime плагіна.

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

Якщо конфігурація недійсна, встановлення зазвичай аварійно завершується в закритому режимі й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для плагінів, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна аварійно завершується в закритому режимі, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб помістити погану конфігурацію плагіна в карантин,
вимкнувши цей запис плагіна та видаливши його недійсне корисне навантаження конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий застарілий id плагіна залишається в конфігурації плагінів або записах встановлення, запуск Gateway
записує попередження в журнал і пропускає цей канал, замість блокувати всі інші канали.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все одно не проходять валідацію, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Повторно ввімкніть плагіни перед
очищенням через doctor, якщо хочете видалити застарілі id плагінів.

Встановлення залежностей плагінів відбувається лише під час явних потоків встановлення/оновлення або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні плагіни повинні вже
мати встановлені залежності, тоді як npm-, git- і ClawHub-плагіни
встановлюються в керовані корені плагінів OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно мають установлюватися через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду або відновлення залежностей.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) для
життєвого циклу під час встановлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагіна повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
а після валідації конфігурації з’являється `plugin present but blocked`, OpenClaw знайшов
файли плагіна, власником яких є інший користувач Unix, ніж процес, що їх завантажує.
Залиште конфігурацію плагіна на місці; виправте володіння файлової системи або запускайте
OpenClaw від того самого користувача, якому належить каталог стану.

Для встановлень Docker офіційний образ працює як `node` (uid `1000`), тому
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

Для npm-встановлень змінні селектори, як-от `latest` або dist-tag, розв’язуються
до встановлення, а потім закріплюються за точною перевіреною версією в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакта плагіна.
Керовані npm-корені також успадковують npm `overrides` рівня пакета OpenClaw, тому
security pins, які захищають упакований хост, також застосовуються до hoisted зовнішніх
залежностей плагінів.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
плагінами, запустіть `pnpm install`; OpenClaw потім завантажує bundled плагіни з
`extensions/<id>`, тому зміни та локальні для пакета залежності використовуються безпосередньо.
Звичайні npm-встановлення в корені призначені для упакованого OpenClaw, а не для розробки з
source checkout.

## Типи Plugin

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі     | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle-и.

Якщо ви пишете native-плагін, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Пакети npm для native-плагінів повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та розв’язуватися в читабельний
runtime-файл або у файл вихідного коду TypeScript із виведеним зібраним JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.
Упаковані встановлення повинні постачати цей JavaScript runtime output. Запасний варіант із вихідним кодом
TypeScript призначений для source checkout-ів і локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час виконання. Це проблема пакування плагіна, а не проблема локальної конфігурації.
Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки виправлений пакет не стане доступним.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він повинен містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення плагінів, замість тихо повертатися до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
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

### Пакети npm, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні упаковані
релізи OpenClaw уже включають багато офіційних плагінів, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` deprecated, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте bundled плагін із
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

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
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins пам’яті">
    - `memory-core` - вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам’ять на основі LanceDB з автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embeddings,
    сумісних з OpenAI, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований browser plugin для browser tool, `openclaw browser` CLI, методу Gateway `browser.request`, середовища виконання browser і типового сервісу керування browser (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (типово вимкнено)

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

| Поле              | Опис                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (типово: `true`)                       |
| `allow`            | Дозволений список Plugin (необов’язково)                  |
| `bundledDiscovery` | Режим виявлення вбудованих Plugin (типово `allowlist`)    |
| `deny`             | Заборонений список Plugin (необов’язково; заборона має перевагу) |
| `load.paths`       | Додаткові файли/каталоги Plugin                           |
| `slots`            | Вибирачі ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі та конфігурація для окремого Plugin            |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
відкривати tools можуть лише перелічені plugins, навіть якщо `tools.allow`
містить `"*"` або назву tool, що належить конкретному plugin. Якщо дозволений
список tools посилається на tools plugin, додайте ids відповідних plugins до
`plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про
таку форму.

`plugins.bundledDiscovery` типово має значення `"allowlist"` для нових
конфігурацій, тому обмежувальний інвентар `plugins.allow` також блокує
пропущені вбудовані plugins постачальників, зокрема виявлення постачальника
вебпошуку під час виконання. Doctor позначає старіші обмежувальні конфігурації
дозволеного списку значенням `"compat"` під час міграції, щоб після оновлення
зберігалася застаріла поведінка вбудованих постачальників, доки оператор не
увімкне суворіший режим. Порожній `plugins.allow` і далі вважається
незаданим/відкритим.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`,
запускають перезавантаження Gateway plugin у поточному процесі. Нові ходи агента
перебудовують свій список tools з оновленого реєстру plugins. Операції, що
змінюють джерела, як-от install, update і uninstall, і далі перезапускають
процес Gateway, оскільки вже імпортовані модулі plugin не можна безпечно
замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації plugin.
Plugin зі станом `enabled` там означає, що збережений реєстр і поточна
конфігурація дозволяють plugin брати участь. Це не доводить, що вже запущений
віддалений Gateway перезавантажився або перезапустився з тим самим кодом plugin.
У налаштуваннях VPS/контейнера з процесами-обгортками надсилайте перезапуски
або записи, що запускають перезавантаження, фактичному процесу
`openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній або недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id plugin, який виявлення не знайшло.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що
    вказують назад на власні запаковані каталоги вбудованих plugins OpenClaw,
    ігноруються; запустіть `openclaw doctor --fix`, щоб видалити ці застарілі
    псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнені типово (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та образи Docker зазвичай знаходять вбудовані plugins
у скомпільованому дереві `dist/extensions`. Якщо вихідний каталог вбудованого
plugin змонтовано поверх відповідного запакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний
каталог як вбудоване накладання джерел і виявляє його перед запакованим бандлом
`/app/dist/extensions/synology-chat`. Це зберігає робочі цикли контейнерів
супровідників без повернення кожного вбудованого plugin до вихідного коду
TypeScript. Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово
використовувати запаковані dist-бандли, навіть коли наявні змонтовані
накладання джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins, що походять із робочого простору, **вимкнені типово** (їх потрібно явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору типового ввімкнення, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, як-от посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить до OpenAI plugin, тоді як вбудований plugin
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін install/config/code plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження payloads постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування tools plugin

Якщо здається, що ходи агента зависають під час підготовки tools, увімкніть trace logging і
перевірте рядки часу фабрики tools plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики tools plugin,
зокрема id plugin, оголошені назви tools, форму результату та те, чи є tool
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика
триває щонайменше 1 с або загальна підготовка фабрик tools plugin триває
щонайменше 5 с.

OpenClaw кешує успішні результати фабрик tools plugin для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime config, робочий простір, ids агента/сеансу, політику sandbox, налаштування browser,
контекст доставки, ідентичність requester і стан власності, тож фабрики, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один plugin домінує в часі, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання tool, а не робити його
всередині фабрики tool.

### Дубльоване володіння каналом або tool

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених plugins намагаються володіти тим самим каналом,
потоком налаштування або назвою tool. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із вбудованим plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  packages plugin, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого id каналу, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id plugin нижчого
  пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дубль випадковий, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте tools,
  що належать plugin, щоб runtime surface була однозначною.

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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або пакет хуків на місці. Використовуйте `openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-плагінів. Він не підтримується з `--link`, який повторно використовує шлях до джерела замість копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id установленого плагіна до цього списку дозволів перед його ввімкненням. Якщо той самий id плагіна є в `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр плагінів як модель холодного читання для інвентарю плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення, видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у верхньорівневому `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry --refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та метаданих маніфестів/пакетів без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета назад із записом відстежуваного плагіна й записує нову специфікацію для майбутніх оновлень. Передавання назви пакета без версії повертає точно закріплене встановлення до стандартної релізної лінії реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи npm і ClawHub-плагінів стандартної лінії спочатку пробують `@beta` і повертаються до default/latest, якщо beta-релізу плагіна не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення та оновлення плагінів продовжуватися попри вбудовані знахідки `critical`, але все одно не обходить блокування політики `before_install` плагіна або блокування через збій сканування. Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills на основі Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували в ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній машині; він не просить ClawHub повторно просканувати плагін або зробити заблокований реліз публічним.

Сумісні пакети беруть участь у тому самому потоці list/inspect/enable/disable для плагінів. Поточна runtime-підтримка охоплює пакетні Skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакета.

Джерелами marketplace можуть бути відома назва marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API плагінів

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але новим плагінам слід використовувати `register`.

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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів, але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.                    |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Точки входу плагінів, які відкривають сокети, бази даних, фонові workers або довготривалі клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`. Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють запущений реєстр Gateway. Discovery не активує, але не є вільним від імпортів: OpenClaw може виконати довірену точку входу плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб переносьте за шляхи full-runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                        |
| --------------------------------------- | -------------------------------------- |
| `registerProvider`                      | Провайдер моделей (LLM)                |
| `registerChannel`                       | Канал чату                             |
| `registerTool`                          | Інструмент агента                      |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                   |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT  |
| `registerRealtimeTranscriptionProvider` | Потокове STT                           |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі      |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                 |
| `registerImageGenerationProvider`       | Генерація зображень                    |
| `registerMusicGenerationProvider`       | Генерація музики                       |
| `registerVideoGenerationProvider`       | Генерація відео                        |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape           |
| `registerWebSearchProvider`             | Вебпошук                               |
| `registerHttpRoute`                     | HTTP-ендпоінт                          |
| `registerCommand` / `registerCli`       | Команди CLI                            |
| `registerContextEngine`                 | Рушій контексту                        |
| `registerService`                       | Фонова служба                          |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний app-server Codex повертає події нативних інструментів Codex через міст на цю поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex. Точна межа runtime-підтримки Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) - створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) - списки сторонніх розробників
