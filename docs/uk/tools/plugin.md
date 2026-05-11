---
read_when:
    - Установлення або налаштування plugins
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-11T21:02:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
агентні середовища, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання веб-вмісту, вебпошук тощо. Деякі плагіни є **основними**
(постачаються з OpenClaw), інші є **зовнішніми**. Більшість зовнішніх
плагінів публікуються й виявляються через
[ClawHub](/uk/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція
завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації,
готові для копіювання й вставлення, див. у
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
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує
    runtime-поверхні плагінів у процесі, а нові ходи агента перебудовують свій
    список інструментів з оновленого реєстру. `/plugins install` змінює
    вихідний код плагіна, тому Gateway запитує перезапуск замість того, щоб
    удавати, ніби поточний процес може безпечно перезавантажити вже імпортовані
    модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти,
    служби, методи Gateway, хуки або CLI-команди, що належать плагіну. Звичайний
    `inspect` є холодною перевіркою маніфесту/реєстру й навмисно уникає імпорту
    runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий розпізнавач, що й CLI: локальний шлях/архів,
явний `clawhub:<pkg>`, явний `npm:<pkg>`, явний `npm-pack:<path.tgz>`,
явний `git:<repo>` або просту специфікацію пакета через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закрито й
спрямовує вас до `openclaw doctor --fix`. Єдиний виняток для відновлення —
вузький шлях повторного встановлення вбудованого плагіна для плагінів, які
явно вмикають `openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується закрито, як і
будь-яка інша недійсна конфігурація. Запустіть `openclaw doctor --fix`, щоб
ізолювати погану конфігурацію плагіна, вимкнувши цей запис плагіна й видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації
зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна виявити,
але той самий застарілий id плагіна залишається в конфігурації плагіна або
записах встановлення, запуск Gateway записує попередження в журнал і пропускає
цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна;
невідомі ключі каналу без доказів застарілого плагіна й надалі не проходять
валідацію, щоб друкарські помилки залишалися видимими.
Якщо задано `plugins.enabled: false`, застарілі посилання на плагіни вважаються
інертними: запуск Gateway пропускає виявлення/завантаження плагінів, а
`openclaw doctor` зберігає вимкнену конфігурацію плагінів замість автоматичного
видалення. Знову ввімкніть плагіни перед запуском очищення doctor, якщо хочете
видалити застарілі id плагінів.

Встановлення залежностей плагіна відбувається лише під час явних потоків
встановлення/оновлення або відновлення doctor. Запуск Gateway, перезавантаження
конфігурації та інспекція runtime не запускають менеджери пакетів і не
відновлюють дерева залежностей. Локальні плагіни вже повинні мати встановлені
залежності, тоді як npm-, git- і ClawHub-плагіни встановлюються в керовані
корені плагінів OpenClaw. Залежності npm можуть бути підняті в межах керованого
npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні плагіни
та власні шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний
`dependencyStatus` для кожного видимого плагіна без імпорту runtime-коду або
відновлення залежностей.
Див. [Вирішення залежностей плагінів](/uk/plugins/dependency-resolution) для
життєвого циклу під час встановлення.

### Власність заблокованого шляху плагіна

Якщо діагностика плагіна повідомляє
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
а валідація конфігурації далі показує `plugin present but blocked`, OpenClaw
знайшов файли плагіна, що належать іншому користувачу Unix, ніж процес, який їх
завантажує. Залиште конфігурацію плагіна на місці; виправте власність файлової
системи або запускайте OpenClaw від імені того самого користувача, якому належить
каталог стану.

Для встановлень Docker офіційний образ запускається як `node` (uid `1000`), тому
змонтовані з хоста каталоги конфігурації та робочого простору OpenClaw зазвичай
мають належати uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Якщо ви навмисно запускаєте OpenClaw як root, відновіть власність керованого
кореня плагінів на root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Після виправлення власності повторно запустіть `openclaw doctor --fix` або
`openclaw plugins registry --refresh`, щоб збережений реєстр плагінів відповідав
відновленим файлам.

Для встановлень npm змінні селектори на кшталт `latest` або dist-tag
розв’язуються перед встановленням, а потім закріплюються до точної перевіреної
версії в керованому npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє,
що встановлений запис `package-lock.json` досі відповідає розв’язаній версії та
цілісності. Якщо npm записує інші метадані пакета, встановлення завершується
помилкою, а керований пакет відкочується замість прийняття іншого артефакту
плагіна.
Керовані npm-корені також успадковують npm `overrides` OpenClaw на рівні пакета,
тому захисні закріплення, які захищають упакований хост, також застосовуються до
піднятих залежностей зовнішніх плагінів.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати
над вбудованими плагінами, запустіть `pnpm install`; після цього OpenClaw
завантажує вбудовані плагіни з `extensions/<id>`, тож правки й локальні
залежності пакета використовуються напряму.
Звичайні кореневі встановлення npm призначені для упакованого OpenClaw, а не для
розробки з вихідного checkout.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або у вихідний TypeScript-файл з виведеним збудованим JavaScript
відповідником, наприклад `src/index.ts` до `dist/index.js`.
Упаковані встановлення повинні постачати цей JavaScript runtime-вивід. Резервний
варіант із TypeScript-вихідником призначений для вихідних checkout-ів і локальних
шляхів розробки, а не для npm-пакетів, установлених у керований корінь плагінів
OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів, потрібних
OpenClaw під час runtime. Це проблема пакування плагіна, а не локальної
конфігурації. Оновіть або перевстановіть плагін після того, як видавець
перевипустить скомпільований JavaScript, або вимкніть/видаліть цей плагін, доки
виправлений пакет не стане доступним.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не
розташовані за тими самими шляхами, що й вихідні записи. Якщо `runtimeExtensions`
наявний, він має містити рівно один запис для кожного запису `extensions`.
Невідповідні списки призводять до помилки встановлення й виявлення плагіна
замість мовчазного повернення до вихідних шляхів. Якщо ви також публікуєте
`openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його
збудованого JavaScript-відповідника; цей файл є обов’язковим, якщо оголошений.

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

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні
упаковані випуски OpenClaw уже містять багато офіційних плагінів, тому в
звичайних налаштуваннях їм не потрібні окремі npm-встановлення. Доки кожен
плагін, що належить OpenClaw, не мігрує до ClawHub, OpenClaw все ще постачає
деякі пакети плагінів `@openclaw/*` в npm для старіших/власних встановлень і
прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарілий, ця версія пакета
належить до старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін
із поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший
npm-пакет.

| Плагін          | Пакет                    | Документація                                       |
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
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам'яті">
    - `memory-core` - вбудований пошук пам'яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` - довготривала пам'ять на базі LanceDB з автоматичним пригадуванням/збереженням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Пам'ять LanceDB](/uk/plugins/memory-lancedb) щодо налаштування OpenAI-сумісних
    ембедингів, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` - вбудований браузерний плагін для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та типової служби керування браузером (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` - міст VS Code Copilot Proxy (типово вимкнено)

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
| `enabled`          | Головний перемикач (типово: `true`)                           |
| `allow`            | Список дозволених плагінів (необов'язково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих плагінів (типово `allowlist`)    |
| `deny`             | Список заборонених плагінів (необов'язково; заборона має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги плагінів                            |
| `slots`            | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі й конфігурація для кожного плагіна                               |

`plugins.allow` має виключну дію. Коли він непорожній, завантажуватися
або відкривати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента, що належить плагіну. Якщо список дозволених інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
конфігурацію.

`plugins.bundledDiscovery` для нових конфігурацій типово має значення `"allowlist"`, тому
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані плагіни
провайдерів, зокрема виявлення провайдера вебпошуку під час виконання. Під час міграції засіб перевірки позначає старіші
обмежувальні конфігурації списку дозволів значенням `"compat"`, щоб під час оновлень зберігалася
застаріла поведінка вбудованих провайдерів, доки оператор не перейде на суворіший режим.
Порожній `plugins.allow` усе ще розглядається як незаданий/відкритий.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження плагінів Gateway у поточному процесі. Нові ходи агента перебудовують свій список інструментів з
оновленого реєстру плагінів. Операції, що змінюють джерела, як-от встановлення,
оновлення та видалення, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі плагінів не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів.
Плагін зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, фактичному
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній і недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає задекларованій схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та вилучивши його конфігураційний вміст.

</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує плагіни в такому порядку (перше зіставлення має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` - явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб вилучити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні встановлення та образи Docker зазвичай знаходять вбудовані плагіни в
скомпільованому дереві `dist/extensions`. Якщо каталог вихідного коду вбудованого плагіна
змонтовано bind-mount-ом поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерел
як накладення вбудованого вихідного коду й виявляє його перед запакованим
бандлом `/app/dist/extensions/synology-chat`. Це зберігає робочими контейнерні цикли
супровідників без перемикання кожного вбудованого плагіна назад на джерела TypeScript.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-бандли
навіть за наявності змонтованих накладень джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни й пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над дозволами
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані плагіни, що потребують явного ввімкнення, автоматично вмикаються, коли конфігурація називає
  поверхню, що належить плагіну, як-от посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація плагінів зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете вилучити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить до плагіна OpenAI, тоді як вбудований плагін сервера застосунку Codex
  вибирається канонічними посиланнями агента `openai/*`, явним
  `agentRuntime.id: "codex"` провайдера/моделі або застарілими посиланнями моделей `codex/*`

## Усунення несправностей хуків середовища виконання

Якщо плагін відображається в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в живому трафіку чату, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він запускається перед
  визначенням моделі для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  створить вихід асистента.
- Щоб підтвердити фактичну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway, а під час налагодження payload-ів провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагіна

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
зокрема ідентифікатор плагіна, задекларовані назви інструментів, форму результату та те, чи є інструмент
необов'язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика працює
щонайменше 1 с або загальна підготовка фабрик інструментів плагінів триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів плагінів для повторних визначень
з тим самим фактичним контекстом запиту. Ключ кешу містить фактичну
конфігурацію виконання, робочий простір, ідентифікатори агента/сеансу, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан володіння, тому фабрики, які
залежать від цих довірених полів, повторно запускаються, коли контекст змінюється.

Якщо один плагін домінує за часом, перевірте його реєстрації виконання:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори плагінів мають переносити
дороге завантаження залежностей у шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дубль випадковий, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або вилучіть застаріле встановлення
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать плагінам, щоб поверхня виконання була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії ексклюзивні (активною може бути лише одна за раз):

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

| Слот            | Що контролює      | Типове значення             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний плагін пам'яті  | `memory-core`       |
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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для планових оновлень відстежуваних npm
плагінів. Він не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає ідентифікатор
встановленого плагіна до цього списку дозволів перед увімкненням. Якщо той самий ідентифікатор плагіна
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр плагінів як модель холодного читання для
інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна. Той самий файл
`plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів плагіна.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторів життєвого циклу плагінів вимкнено.
Натомість керуйте вибором пакетів плагінів і конфігурацією через джерело Nix для
встановлення; для nix-openclaw почніть з agent-first
[Короткого старту](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад до
стандартної лінії випусків реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` працює на beta-каналі, записи плагінів npm і ClawHub
стандартної лінії спочатку пробують `@beta` і повертаються до default/latest, коли beta-випуску
плагіна немає. Точні версії та явні теги залишаються закріпленими.

`--pin` призначено лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення плагінів
і оновлення плагінів продовжувати попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові mock-об’єкти;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його ще раз. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно сканувати плагін і не робить заблокований випуск
публічним.

Сумісні пакети беруть участь у тому самому потоці списку/інспектування/увімкнення/вимкнення
плагінів. Поточна runtime-підтримка включає bundle Skills, command-skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і
оголошені в маніфесті стандартні значення `lspServers`, command-skills Cursor і сумісні каталоги
хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакета.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повні подробиці.

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
але вбудовані плагіни та нові зовнішні плагіни мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.                      |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; довірений код точки входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                 |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує runtime-точки входу.                                                        |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Точки входу плагінів, які відкривають сокети, бази даних, фонові workers або довгоживучі
клієнти, мають захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але не є import-free:
OpenClaw може виконати довірену точку входу плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а
мережеві клієнти, subprocesses, listeners, читання облікових даних і запуск служб
переміщуйте за шляхи full-runtime.

Поширені методи реєстрації:

| Метод                                   | Що реєструє                  |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)   |
| `registerChannel`                       | Канал чату                   |
| `registerTool`                          | Інструмент агента            |
| `registerHook` / `on(...)`              | Хуки життєвого циклу         |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Потокове STT                 |
| `registerRealtimeVoiceProvider`         | Дуплексний голос realtime    |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`       | Генерація зображень          |
| `registerMusicGenerationProvider`       | Генерація музики             |
| `registerVideoGenerationProvider`       | Генерація відео              |
| `registerWebFetchProvider`              | Постачальник web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                     |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | Команди CLI                  |
| `registerContextEngine`                 | Контекстний рушій            |
| `registerService`                       | Фонова служба                |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дії та не очищає попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дії та не очищає попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дії та не очищає попереднє скасування.

Нативний сервер застосунку Codex передає події інструментів, нативних для Codex, назад у цю поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати за результатами через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст ще не переписує аргументи нативних інструментів Codex. Точна межа підтримки середовища виконання Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness-runtime#v1-support-contract).

Повну типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) - створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) - сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) - схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) - додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - модель можливостей і конвеєр завантаження
- [ClawHub](/uk/clawhub) - пошук сторонніх plugins
