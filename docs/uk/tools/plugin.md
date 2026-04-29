---
read_when:
    - Встановлення або налаштування Pluginів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin-и OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-29T05:41:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв’язками агентів, інструментами, skills, мовленням, realtime-транскрипцією, realtime-
голосом, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web
search тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів Plugin, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть Plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Якщо ви віддаєте перевагу керуванню, вбудованому в чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або проста специфікація пакета (спочатку ClawHub, потім
резервний npm).

Якщо конфігурація недійсна, встановлення зазвичай відмовляється виконуватися безпечно й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого Plugin для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей Plugin під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію Plugin у карантин, вимкнувши цей запис Plugin і видаливши
його недійсне корисне навантаження конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше неможливо знайти, але той самий
застарілий id Plugin залишається в конфігурації Plugin або записах встановлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналів без ознак застарілого Plugin все ще не проходять валідацію, щоб друкарські помилки залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugin розглядаються як інертні:
запуск Gateway пропускає роботу з виявлення/завантаження Plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin замість її автоматичного видалення. Знову ввімкніть плагіни перед
очищенням через doctor, якщо хочете видалити застарілі id Plugin.

Пакетні встановлення OpenClaw не встановлюють завчасно дерево runtime-залежностей кожного
вбудованого Plugin. Коли вбудований Plugin, що належить OpenClaw, активний із
конфігурації Plugin, застарілої конфігурації каналу або типово ввімкненого маніфесту, запуск
відновлює лише оголошені runtime-залежності цього Plugin перед його імпортом.
Сам лише збережений стан автентифікації каналу не активує вбудований канал для
відновлення runtime-залежностей під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих runtime-залежностей для цього Plugin/каналу.
Непорожній `plugins.allow` також обмежує відновлення типово ввімкнених вбудованих runtime-залежностей;
явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) все ще може
відновити залежності Plugin цього каналу.
Зовнішні плагіни й користувацькі шляхи завантаження все ще потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети Plugin](/uk/plugins/bundles), щоб дізнатися подробиці про bundle.

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native Plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині директорії пакета й резолвитися до придатного для читання
runtime-файла або до вихідного TypeScript-файла з виведеним побудованим JavaScript-
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення й
виявлення Plugin замість мовчазного повернення до вихідних шляхів.

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

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні пакетні
випуски OpenClaw уже містять багато офіційних плагінів, тож вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен Plugin, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw все ще постачає деякі пакети Plugin `@openclaw/*` в
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє про пакет Plugin `@openclaw/*` як застарілий, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте вбудований Plugin із
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

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється на вимогу, з автоматичним recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб налаштувати OpenAI-сумісні
    embeddings, приклади Ollama, обмеження recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для інструмента browser, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і типового сервісу керування браузером (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

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

| Поле            | Опис                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                           |
| `allow`          | Список дозволених Plugin (необов’язково)                               |
| `deny`           | Список заборонених Plugin (необов’язково; deny має пріоритет)                     |
| `load.paths`     | Додаткові файли/директорії Plugin                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого Plugin                               |

Зміни конфігурації **вимагають перезапуску gateway**. Якщо Gateway працює з увімкненим
спостереженням за конфігурацією + перезапуском у процесі (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Немає підтримуваного шляху hot-reload для runtime-коду native Plugin або lifecycle-
хуків; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
provider/runtime-хуки будуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. `enabled`
Plugin там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений дочірній Gateway
перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнера з
процесами-обгортками надсилайте перезапуски до фактичного процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його й видаливши його корисне навантаження конфігурації.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або директорій. Шляхи, що вказують
    назад на власні пакетні директорії вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай розв’язують bundled plugins із
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог bundled plugin
змонтовано поверх відповідного пакетного шляху до вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як bundled source overlay і виявляє його перед пакетним бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів для мейнтейнерів без потреби перемикати кожен bundled plugin назад на
вихідний код TypeScript. Встановіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`,
щоб примусово використовувати пакетні dist-бандли навіть за наявності змонтованих
source overlay.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із походженням workspace **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, як-от посилання на модель провайдера, конфігурацію каналу або
  runtime harness
- Застаріла конфігурація plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі plugins:
  `openai-codex/*` належить OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому чат-трафіку, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/config/code plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  діагностику. Небандлованим conversation hooks, таким як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь асистента.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні Gateway session/status і, під час налагодження provider payloads, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений plugin намагається володіти тим самим каналом,
setup flow або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поряд із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  plugin packages, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін встановлення, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` із
  plugin id нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти,
  що належать plugin, щоб runtime surface була однозначною.

## Слоти plugins (ексклюзивні категорії)

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

| Слот            | Що він контролює      | Значення за замовчуванням |
| --------------- | --------------------- | ------------------------- |
| `memory`        | Active memory plugin  | `memory-core`             |
| `contextEngine` | Активний context engine | `legacy` (вбудований)   |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
bundled model providers, bundled speech providers і bundled browser
plugin). Інші bundled plugins все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання в керовану ціль інсталяції.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед його ввімкненням. Якщо той самий plugin id
присутній у `plugins.deny`, install видаляє цей застарілий deny-запис, щоб
явно встановлений plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний registry plugins як cold read model для
інвентаризації plugins, власності внесків і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає тривкі install metadata у
верхньорівневому `installRecords` і перебудовувані manifest metadata у `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest view із install records, config policy і
metadata manifest/package без завантаження runtime modules plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Передавання
npm package spec із dist-tag або точною версією розв’язує назву package
назад до відстежуваного запису plugin і записує новий spec для майбутніх оновлень.
Передавання назви package без версії повертає точну pinned install назад до
типової release line registry. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній artifact identity, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування config.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace installs зберігають metadata джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — break-glass перевизначення для хибних
спрацювань вбудованого dangerous-code scanner. Воно дозволяє встановлення plugins
і оновлення plugins продовжуватися після вбудованих знахідок `critical`, але все одно
не обходить блокування plugin `before_install` policy або блокування через scan failure.
Install scans ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати пакетні test mocks;
оголошені runtime entrypoints plugin все одно скануються, навіть якщо використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків install/update plugin. Встановлення залежностей
Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub пересканувати plugin і не робить заблокований release
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable plugins.
Поточна підтримка runtime включає bundle skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в manifest
`lspServers`, Cursor command-skills і сумісні каталоги Codex hook.

`openclaw plugins inspect <id>` також повідомляє про виявлені bundle capabilities, а також
підтримувані або непідтримувані записи MCP і LSP server для plugins на основі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, GitHub shorthand на кшталт `owner/repo`, URL GitHub repo
або git URL. Для віддалених marketplaces записи plugins мають залишатися всередині
клонованого marketplace repo і використовувати лише відносні path sources.

Повні подробиці див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

Native plugins експортують entry object, який надає `register(api)`. Старіші
plugins можуть усе ще використовувати `activate(api)` як legacy alias, але нові plugins мають
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

OpenClaw завантажує entry object і викликає `register(api)` під час активації plugin.
Loader усе ще повертається до `activate(api)` для старіших plugins,
але bundled plugins і нові external plugins мають розглядати `register` як
публічний contract.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим          | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація під час виконання. Реєструє інструменти, хуки, служби, команди, маршрути й інші активні побічні ефекти.              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє провайдерів і метадані; код довіреної точки входу Plugin може завантажуватися, але активні побічні ефекти пропускаються. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                               |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна точка входу середовища виконання.                                       |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Точки входу Plugin, які відкривають сокети, бази даних, фонові робочі процеси або довгоживучі
клієнти, мають захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень для активації та не замінюють
запущений реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може виконати довірену точку входу Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб переносіть
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                    |
| --------------------------------------- | ---------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)             |
| `registerChannel`                       | Канал чату                         |
| `registerTool`                          | Інструмент агента                  |
| `registerHook` / `on(...)`              | Хуки життєвого циклу               |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                       |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі  |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо             |
| `registerImageGenerationProvider`       | Генерація зображень                |
| `registerMusicGenerationProvider`       | Генерація музики                   |
| `registerVideoGenerationProvider`       | Генерація відео                    |
| `registerWebFetchProvider`              | Провайдер отримання вебданих / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                           |
| `registerHttpRoute`                     | HTTP-ендпоінт                      |
| `registerCommand` / `registerCli`       | Команди CLI                        |
| `registerContextEngine`                 | Рушій контексту                    |
| `registerService`                       | Фонова служба                      |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скидає попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скидає попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скидає попереднє скасування.

Власний app-server Codex запускає події інструментів, нативні для Codex, через міст назад у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки не переписує аргументи інструментів, нативних для Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — створення власного Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Внутрішня будова Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugins](/uk/plugins/community) — сторонні списки
