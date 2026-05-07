---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте й керуйте plugins OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-07T15:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
оболонки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання вебданих, вебпошук
та інше. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих установлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, виведення списку, видалення, оновлення та публікації, які можна скопіювати й вставити, див.
[Керування плагінами](/uk/plugins/manage-plugins).

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Chat-native management">
    У запущеному Gateway команди `/plugins enable` і `/plugins disable`, доступні лише власнику,
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує поверхні виконання плагінів
    у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск замість того, щоб удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, служби, методи gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпортування runtime плагіна.

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
явний `git:<repo>` або проста специфікація пакета через npm.

Якщо конфігурація недійсна, установлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується закритою відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію плагіна,
вимкнувши цей запис плагіна й видаливши його недійсний payload конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий застарілий id плагіна залишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість того, щоб блокувати всі інші канали.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все ще не проходять валідацію, щоб друкарські помилки залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Повторно увімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі id плагінів.

Установлення залежностей плагіна відбувається лише під час явних потоків install/update або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже мають
мати встановлені залежності, тоді як npm-, git- і ClawHub-плагіни
встановлюються під керованими коренями плагінів OpenClaw. Залежності npm можуть hoist-итися
в межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє npm-керовані пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду чи відновлення залежностей.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) для
життєвого циклу під час установлення.

### Заблоковане володіння шляхом плагіна

Якщо діагностика плагіна каже
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
і далі валідація конфігурації повідомляє `plugin present but blocked`, OpenClaw знайшов
файли плагіна, що належать іншому Unix-користувачу, ніж процес, який їх завантажує.
Залиште конфігурацію плагіна на місці; виправте володіння у файловій системі або запускайте
OpenClaw від того самого користувача, якому належить каталог стану.

Для Docker-установлень офіційний образ працює як `node` (uid `1000`), тому
прив’язані з хоста каталоги конфігурації та робочого простору OpenClaw зазвичай мають
належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, відремонтуйте керований корінь плагінів до
root-володіння натомість:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення володіння повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав
відремонтованим файлам.

Для npm-установлень змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед установленням, а потім фіксуються до точної перевіреної версії в керованому npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` досі відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, установлення зазнає невдачі, а керований пакет
відкочується замість прийняття іншого артефакта плагіна.
Керовані npm-корені також успадковують npm `overrides` рівня пакета OpenClaw, тому
безпекові фіксації, які захищають упакований хост, також застосовуються до hoisted зовнішніх
залежностей плагінів.

Вихідні checkout-и є pnpm workspace-ами. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує bundled плагіни з
`extensions/<id>`, тож редагування й package-local залежності використовуються напряму.
Звичайні npm-установлення в корінь призначені для упакованого OpenClaw, а не для розробки
у вихідному checkout-і.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, npm-пакети спільноти               |
| **Bundle** | Сумісний із Codex/Claude/Cursor layout; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва показуються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете native плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або в TypeScript-файл вихідного коду з виведеним побудованим JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.
Упаковані встановлення мають постачати цей JavaScript runtime output. TypeScript
fallback вихідного коду призначений для source checkout-ів і локальних шляхів розробки, а не для
npm-пакетів, установлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час виконання. Це проблема пакування плагіна, а не локальної конфігурації.
Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки не буде доступний виправлений пакет.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розміщені за
тими самими шляхами, що й записи вихідного коду. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють невдачу встановлення та
виявлення плагінів замість тихого fallback до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого
JavaScript-відповідника; цей файл є обов’язковим, коли його оголошено.

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

ClawHub є основним шляхом поширення для більшості плагінів. Поточні упаковані
релізи OpenClaw уже містять багато офіційних плагінів, тому їм не потрібні
окремі npm-установлення у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*`
на npm для старіших/користувацьких установлень і прямих npm workflow.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` deprecated, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled плагін із
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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни памʼяті">
    - `memory-core` - вбудований пошук у памʼяті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала памʼять на основі LanceDB з автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб налаштувати сумісні з OpenAI
    embedding, приклади Ollama, обмеження пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований плагін браузера для browser tool, `openclaw browser` CLI, Gateway-методу `browser.request`, середовища виконання браузера та типової служби керування браузером (увімкнено типово; вимкніть перед заміною)
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

| Поле              | Опис                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (типово: `true`)                       |
| `allow`            | Список дозволених плагінів (необовʼязково)                |
| `bundledDiscovery` | Режим виявлення вбудованих плагінів (типово `allowlist`)  |
| `deny`             | Список заборонених плагінів (необовʼязково; deny має перевагу) |
| `load.paths`       | Додаткові файли/каталоги плагінів                         |
| `slots`            | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для окремого плагіна            |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow`
містить `"*"` або конкретну назву інструмента, що належить плагіну. Якщо список
дозволених інструментів посилається на інструменти плагінів, додайте ids
плагінів-власників до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor`
попереджає про таку форму.

`plugins.bundledDiscovery` для нових конфігурацій типово має значення `"allowlist"`, тому
обмежувальний перелік `plugins.allow` також блокує пропущені вбудовані плагіни
постачальників, зокрема виявлення постачальника web-search під час виконання. Doctor
позначає старіші конфігурації з обмежувальним allowlist значенням `"compat"` під час
міграції, щоб оновлення зберігали застарілу поведінку вбудованих постачальників,
доки оператор не перейде на суворіший режим. Порожній `plugins.allow` і далі
трактується як незаданий/відкритий.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження плагінів Gateway у поточному процесі. Нові ходи агента
перебудовують свій список інструментів з оновленого реєстру плагінів. Операції,
що змінюють джерело, як-от install, update та uninstall, і далі перезапускають
процес Gateway, бо вже імпортовані модулі плагінів неможливо безпечно замінити
на місці.

`openclaw plugins list` - це локальний знімок реєстру/конфігурації плагінів.
Плагін зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація
дозволяють плагіну брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом плагіна. У налаштуваннях
VPS/контейнера з процесами-обгортками надсилайте перезапуски або записи, що
ініціюють перезавантаження, до фактичного процесу `openclaw gateway run`, або
використовуйте `openclaw gateway restart` для запущеного Gateway, коли
перезавантаження повідомляє про збій.

<Accordion title="Стани плагінів: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та вилучивши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw шукає плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено типово (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та образи Docker зазвичай знаходять вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо каталог джерел вбудованого плагіна
змонтовано поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог джерел
як вбудоване накладання джерел і виявляє його перед запакованим пакетом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого плагіна назад на
джерела TypeScript. Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб
примусово використовувати запаковані dist-пакети, навіть коли наявні змонтовані
накладання джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, як-от посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація плагіна зберігається, доки активне `plugins.enabled: false`;
  знову ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із runtime-хуками

Якщо плагін з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в live-трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, профіль, шлях до конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін у встановленні/конфігурації/коді плагіна. У wrapper-
  контейнерах PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмов, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь асистента.
- Щоб підтвердити фактичну модель сесії, використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload-ів провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагіна

Якщо ходи агента ніби зависають під час підготовки інструментів, увімкніть trace-логування та
перевірте рядки часу виконання factory інструментів плагіна:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час factory та найповільніші factory інструментів плагінів,
зокрема id плагіна, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли один factory триває
щонайменше 1 с або загальна підготовка factory інструментів плагінів триває щонайменше 5 с.

OpenClaw кешує успішні результати factory інструментів плагінів для повторних визначень
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, workspace, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність requester-а та стан власності, тому factory, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один плагін домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори Plugin повинні переносити
дороге завантаження залежностей у шлях виконання інструмента, а не виконувати його
всередині tool factory.

### Дублювання каналу або володіння інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін у встановленні, registry або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого channel id, бажаний плагін
  має оголосити `channelConfigs.<channel-id>.preferOver` з id плагіна нижчого пріоритету.
  Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  плагіна.
- Якщо ви явно увімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  якими володіє плагін, щоб runtime-поверхня була однозначною.

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

| Слот            | Що він контролює            | Типове значення     |
| --------------- | --------------------------- | ------------------- |
| `memory`        | Активний плагін пам’яті     | `memory-core`       |
| `contextEngine` | Активний engine контексту   | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # стислий інвентар
openclaw plugins list --enabled            # лише ввімкнені plugin-и
openclaw plugins list --verbose            # рядки деталей для кожного plugin-а
openclaw plugins list --json               # машинно-читний інвентар
openclaw plugins search <query>            # пошук у каталозі plugin-ів ClawHub
openclaw plugins inspect <id>              # статичні деталі
openclaw plugins inspect <id> --runtime    # зареєстровані hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # машинно-читний
openclaw plugins inspect --all             # таблиця для всього парку
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перевірити збережений стан registry
openclaw plugins registry --refresh        # перебудувати збережений registry
openclaw doctor --fix                      # відновити стан registry plugin-ів

openclaw plugins install <package>         # типово встановити з npm
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install npm:<pkg>         # встановити лише з npm
openclaw plugins install git:<repo>        # встановити з git
openclaw plugins install git:<repo>@<ref>  # встановити з git ref
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # link (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точний resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити config і записи індексу plugin-а
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Перевірити runtime-реєстрації після встановлення.
openclaw plugins inspect <id> --runtime --json

# Запускати CLI-команди, якими володіє plugin, напряму з кореневого CLI OpenClaw.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані plugin-и постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser
plugin). Інші вбудовані plugin-и все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugin-ів. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого plugin-а до цього allowlist перед увімкненням. Якщо той самий id plugin-а
присутній у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явно встановлений plugin можна було завантажити одразу після restart.

OpenClaw зберігає локальний registry plugin-ів як модель холодного читання для
інвентарю plugin-ів, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану plugin-а.
Той самий файл `plugins/installs.json` зберігає довговічні metadata встановлення у
верхньорівневому `installRecords` і перебудовувані metadata manifest у `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest-подання із записів встановлення, політики config та
metadata manifest/package без завантаження runtime-модулів plugin-а.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторі життєвого циклу plugin-ів вимкнено.
Натомість керуйте вибором пакетів plugin-ів і config через Nix-джерело для
встановлення; для nix-openclaw почніть з agent-first
[Швидкого старту](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec з dist-tag або точною версією зіставляє назву package
назад із відстежуваним записом plugin-а та записує новий spec для майбутніх оновлень.
Передавання назви package без версії повертає точно закріплене встановлення до
типової release line registry. Якщо встановлений npm plugin уже відповідає
resolved version і записаній ідентичності artifact, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування config.
Коли `openclaw update` запускається на beta channel, записи npm і ClawHub
plugin-ів default-line спочатку пробують `@beta` і повертаються до default/latest, коли beta release
plugin-а не існує. Точні версії та явні tags залишаються pinned.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають metadata джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це break-glass override для хибних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє встановлення plugin-ів
і оновлення plugin-ів продовжуватися після вбудованих findings рівня `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через scan-failure.
Сканування встановлення ігнорує поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати packaged test mocks;
оголошені runtime entrypoints plugin-а все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI-прапорець застосовується лише до потоків install/update plugin-ів. Встановлення skill
dependencies через Gateway використовують відповідний request
override `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його ще раз. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub пересканувати plugin або зробити заблокований release
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable
для plugin-ів. Поточна runtime-підтримка охоплює bundle skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в manifest
`lspServers`, Cursor command-skills і сумісні Codex hook
directories.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані entries серверів MCP і LSP для bundle-backed plugin-ів.

Джерела Marketplace можуть бути назвою відомого marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або
шляхом `marketplace.json`, GitHub shorthand на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для remote marketplaces entries plugin-ів мають залишатися всередині
cloned marketplace repo і використовувати лише relative path sources.

Повні подробиці див. у [CLI-довіднику `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

Native plugin-и експортують entry object, який надає `register(api)`. Старіші
plugin-и все ще можуть використовувати `activate(api)` як legacy alias, але нові plugin-и мають
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

OpenClaw завантажує entry object і викликає `register(api)` під час
активації plugin-а. Loader все ще повертається до `activate(api)` для старіших plugin-ів,
але вбудовані plugin-и та нові external plugin-и мають розглядати `register` як
публічний contract.

`api.registrationMode` повідомляє plugin-у, чому завантажується його entry:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, services, commands, routes та інші live side effects.                               |
| `discovery`     | Read-only виявлення можливостей. Реєструйте providers і metadata; код trusted plugin entry може завантажуватися, але пропускайте live side effects. |
| `setup-only`    | Завантаження metadata налаштування channel через легкий setup entry.                                                             |
| `setup-runtime` | Завантаження налаштування channel, якому також потрібен runtime entry.                                                           |
| `cli-metadata`  | Лише збирання metadata CLI-команд.                                                                                               |

Plugin entries, які відкривають sockets, databases, background workers або long-lived
clients, мають захищати ці side effects умовою `api.registrationMode === "full"`.
Discovery loads кешуються окремо від activating loads і не замінюють
поточний registry Gateway. Discovery є non-activating, але не import-free:
OpenClaw може evaluate trusted plugin entry або channel plugin module, щоб побудувати
snapshot. Тримайте module top levels легкими та без side effects, а
network clients, subprocesses, listeners, credential reads і service startup перемістіть
за full-runtime paths.

Поширені registration methods:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделей (LLM)     |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | Agent tool                  |
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
| `registerCommand` / `registerCli`       | CLI commands                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Background service          |

Поведінка guard для typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищає попередній block.
- `before_install`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищає попередній block.
- `message_sending`: `{ cancel: true }` є terminal; handlers із нижчим priority пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищає попередній cancel.

Власні запуски сервера застосунку Codex передають події власних інструментів Codex назад у цю поверхню хуків. Plugin-и можуть блокувати власні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у затвердженнях Codex `PermissionRequest`. Міст поки що не переписує аргументи власних інструментів Codex. Точна межа підтримки середовища виконання Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin-ів](/uk/plugins/building-plugins) - створіть власний Plugin
- [Пакети Plugin-ів](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [Спільнотні Plugin-и](/uk/plugins/community) - сторонні списки
