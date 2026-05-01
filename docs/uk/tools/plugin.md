---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення й завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-01T10:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі,
голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, веб-вибіркою, веб-
пошуком тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих установлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершиться.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
    ```bash
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

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, методи gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або голу специфікацію пакета
(спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація недійсна, установлення зазвичай завершується закрито й указує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які явно ввімкнули
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує в журнал проблему `plugins.entries.<id>.config`, пропускає цей плагін під час
завантаження й залишає інші плагіни та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію плагіна в карантин, вимкнувши цей запис плагіна й видаливши
його недійсне корисне навантаження конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий ідентифікатор плагіна лишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування кожного іншого каналу.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все одно не проходять валідацію, щоб помилки введення
лишалися видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного її видалення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Пакетовані встановлення OpenClaw не встановлюють завчасно дерево runtime-залежностей
кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний із
конфігурації плагінів, застарілої конфігурації каналу або маніфесту, увімкненого за замовчуванням, запуск
відновлює лише оголошені runtime-залежності цього плагіна перед його імпортом.
Сам лише збережений стан автентифікації каналу не активує вбудований канал для
відновлення runtime-залежностей під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню runtime-залежностей вбудованого плагіна для цього плагіна/каналу.
Непорожній `plugins.allow` також обмежує відновлення runtime-залежностей
вбудованих плагінів, увімкнених за замовчуванням; явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності плагіна цього каналу.
Зовнішні плагіни й власні шляхи завантаження все одно мають бути встановлені через
`openclaw plugins install`.
Див. [Вирішення залежностей плагінів](/uk/plugins/dependency-resolution) для повного
життєвого циклу планування й підготовки.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат      | Як це працює                                                        | Приклади                                               |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі      | Офіційні плагіни, пакети спільноти в npm               |
| **Пакет**   | Макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети плагінів](/uk/plugins/bundles), щоб дізнатися подробиці про пакети.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Npm-пакети нативних плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й резолвитися до читабельного
runtime-файлу або до вихідного файлу TypeScript із виведеним побудованим JavaScript-
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до збою встановлення та
виявлення плагіна замість тихого повернення до вихідних шляхів.

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

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні пакетовані
випуски OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих установлень npm у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` у
npm для старіших/власних установлень і прямих робочих процесів npm.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарів, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін із
поточного OpenClaw або локальну копію репозиторію, доки не буде опубліковано новіший пакет npm.

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

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготермінова пам’ять із установленням на вимогу та автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embedding,
    сумісного з OpenAI, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований плагін браузера для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та стандартного сервісу керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (за замовчуванням: `true`)             |
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого плагіна            |

`plugins.allow` є ексклюзивним. Коли він непорожній, лише перелічені плагіни можуть завантажуватися
або надавати інструменти, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить плагіну. Якщо список дозволених інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з наглядом за конфігурацією
та ввімкненим перезапуском у процесі (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично через мить після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для runtime-коду нативного плагіна або хуків життєвого циклу
немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, сервісів або
хуків постачальника/runtime.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Плагін зі статусом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнера з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: disabled, missing і invalid">
  - **Disabled**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на id плагіна, який не знайдено під час виявлення.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше співпадіння перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні каталоги упакованих вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та образи Docker зазвичай розпізнають вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого плагіна
змонтовано поверх відповідного упакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як оверлей вбудованих вихідних файлів і виявляє його перед упакованим бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого плагіна назад на вихідні файли TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-бандли
навіть за наявності змонтованих вихідних оверлеїв.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору ввімкнення за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, як-от посилання на модель провайдера, конфігурацію каналу або середовище
  виконання harness
- Застаріла конфігурація плагінів зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення проблем із runtime hooks

Якщо плагін з'являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в реальному трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду плагіна. У wrapper
  контейнерах PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед
  розв'язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway, а під час налагодження навантажень провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поряд із вбудованим плагіном, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого id каналу, бажаний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з
  id плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать плагіну, щоб runtime-поверхня була однозначною.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активною може бути лише одна за раз):

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

| Слот            | Що він контролює      | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Плагін активної пам'яті | `memory-core`       |
| `contextEngine` | Активний контекстний рушій | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для регулярних оновлень відстежуваних npm
плагінів. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання в керовану ціль установлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого плагіна до цього allowlist перед його ввімкненням. Якщо той самий id плагіна
присутній у `plugins.deny`, установлення видаляє цей застарілий deny-запис, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як холодну модель читання для
інвентаризації плагінів, власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфестів із записів установлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад на
типову лінію випусків реєстру. Якщо встановлений npm-плагін уже відповідає
розв'язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення плагінів
і оновлення плагінів продовжуватися після вбудованих знахідок `critical`, але все одно
не обходить блокування політики `before_install` плагіна або блокування через помилку сканування.
Сканування встановлення ігнорують типові тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані тестові моки;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків установлення/оновлення плагінів. Встановлення залежностей Skills,
що підтримуються Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
дашборд ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його ще раз. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп'ютері; він не просить ClawHub повторно просканувати плагін або зробити заблокований випуск
публічним.

Сумісні пакети беруть участь у тому самому процесі списку/інспектування/увімкнення/вимкнення plugins. Поточна підтримка runtime включає пакетні skills, командні skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті `lspServers`, командні skills Cursor і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи серверів MCP і LSP для plugins на основі пакетів.

Джерела marketplace можуть бути відомою назвою marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом `marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи plugins мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних відомостей.

## Огляд API Plugin

Native plugins експортують entry object, який надає `register(api)`. Старіші plugins можуть і далі використовувати `activate(api)` як застарілий alias, але нові plugins мають використовувати `register`.

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

OpenClaw завантажує entry object і викликає `register(api)` під час активації plugin. Loader все ще повертається до `activate(api)` для старіших plugins, але bundled plugins і нові external plugins мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим           | Значення                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте tools, hooks, services, commands, routes та інші активні побічні ефекти.                                 |
| `discovery`     | Read-only виявлення можливостей. Реєструйте providers і metadata; довірений код plugin entry може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження metadata налаштування channel через полегшений setup entry.                                                               |
| `setup-runtime` | Завантаження налаштування channel, якому також потрібен runtime entry.                                                                 |
| `cli-metadata`  | Лише збирання metadata команд CLI.                                                                                                     |

Plugin entries, які відкривають sockets, databases, background workers або довготривалі clients, мають обмежувати ці побічні ефекти перевіркою `api.registrationMode === "full"`. Discovery loads кешуються окремо від activating loads і не замінюють поточний registry Gateway. Discovery не активує, але не є import-free: OpenClaw може виконати довірений plugin entry або модуль channel plugin, щоб побудувати snapshot. Тримайте module top levels легкими й без побічних ефектів, а network clients, subprocesses, listeners, читання credentials і запуск service переносьте за full-runtime paths.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                         |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Model provider (LLM)                    |
| `registerChannel`                       | Chat channel                            |
| `registerTool`                          | Agent tool                              |
| `registerHook` / `on(...)`              | Lifecycle hooks                         |
| `registerSpeechProvider`                | Text-to-speech / STT                    |
| `registerRealtimeTranscriptionProvider` | Streaming STT                           |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice                   |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                  |
| `registerImageGenerationProvider`       | Генерація зображень                     |
| `registerMusicGenerationProvider`       | Генерація музики                        |
| `registerVideoGenerationProvider`       | Генерація відео                         |
| `registerWebFetchProvider`              | Web fetch / scrape provider             |
| `registerWebSearchProvider`             | Web search                              |
| `registerHttpRoute`                     | HTTP endpoint                           |
| `registerCommand` / `registerCli`       | Команди CLI                             |
| `registerContextEngine`                 | Context engine                          |
| `registerService`                       | Background service                      |

Поведінка guard для typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищає попередній block.
- `before_install`: `{ block: true }` є terminal; handlers із нижчим priority пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищає попередній block.
- `message_sending`: `{ cancel: true }` є terminal; handlers із нижчим priority пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищає попередній cancel.

Native app-server Codex передає події tools, native для Codex, назад у цю поверхню hook. Plugins можуть блокувати native tools Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Bridge поки що не переписує аргументи tools, native для Codex. Точна межа підтримки runtime Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку typed hook див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додайте agent tools у plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Plugins спільноти](/uk/plugins/community) — списки сторонніх розробників
