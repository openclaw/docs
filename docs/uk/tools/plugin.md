---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-28T23:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec4b58de5ec69566ce15536dfc0cf1e08b329293cb84da7aa8436763c017668f
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
агентні середовища, інструменти, skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, web fetch, web
search тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші
є **external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому конфігураційному файлі.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або bare package spec (спочатку ClawHub, потім
fallback до npm).

Якщо конфігурація недійсна, установлення зазвичай fails closed і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях повторного встановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного plugin ізолюється лише до цього plugin:
startup реєструє проблему `plugins.entries.<id>.config`, пропускає цей plugin під час
load і залишає інші plugins та канали online. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію plugin у карантин, вимкнувши цей запис plugin і видаливши
його недійсне конфігураційне payload; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна виявити, але той самий
застарілий plugin id лишається в конфігурації plugin або записах установлення, запуск Gateway
реєструє попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи channel/plugin; невідомі
ключі каналів без доказів stale-plugin усе ще не проходять валідацію, щоб одруки лишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/load plugins, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Знову ввімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі plugin ids.

Пакетовані встановлення OpenClaw не встановлюють наперед усе дерево
runtime dependency для кожного bundled plugin. Коли bundled plugin, що належить OpenClaw, активний із
конфігурації plugin, legacy channel config або manifest, увімкненого за замовчуванням, запуск
відновлює лише runtime dependencies, оголошені цим plugin, перед його імпортом.
Сам лише persisted channel auth state не активує bundled channel для
repair runtime-dependency під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному repair bundled runtime-dependency для цього plugin/channel.
Непорожній `plugins.allow` також обмежує default-enabled bundled runtime-dependency
repair; явне ввімкнення bundled channel (`channels.<id>.enabled: true`) усе ще може
відновити залежності plugin цього каналу.
External plugins і custom load paths усе ще потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; виконується in-process       | Офіційні plugins, community npm packages               |
| **Bundle** | Сумісний із Codex/Claude/Cursor layout; мапиться на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете native plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
і [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Точки входу пакетів

Native plugin npm packages мають оголошувати `openclaw.extensions` у `package.json`.
Кожен entry має лишатися всередині каталогу пакета й resolve до читабельного
runtime file або до TypeScript source file з inferred built JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime files не розташовані за
тими самими paths, що й source entries. Якщо `runtimeExtensions` присутній, він має містити
рівно один entry для кожного `extensions` entry. Невідповідні списки спричиняють помилку встановлення та
plugin discovery замість тихого fallback до source paths.

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

### Доступні для встановлення (npm)

| Plugin          | Пакет                | Документація                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — bundled memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала памʼять install-on-demand з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, обмежень recall і troubleshooting.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — bundled browser plugin для browser tool, CLI `openclaw browser`, gateway method `browser.request`, browser runtime і default browser control service (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

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

| Поле            | Опис                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                           |
| `allow`          | Plugin allowlist (необовʼязково)                               |
| `deny`           | Plugin denylist (необовʼязково; deny має пріоритет)                     |
| `load.paths`     | Додаткові plugin файли/каталоги                            |
| `slots`          | Ексклюзивні slot selectors (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого plugin                               |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з config
watch + in-process restart enabled (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Немає підтримуваного шляху hot-reload для native plugin runtime code або lifecycle
hooks; перезапустіть процес Gateway, який обслуговує live channel, перш ніж
очікувати виконання оновленого коду `register(api)`, hooks `api.on(...)`, tools, services або
provider/runtime hooks.

`openclaw plugins list` — це локальний snapshot plugin registry/config. Plugin зі станом
`enabled` там означає, що persisted registry і поточна конфігурація дозволяють
plugin брати участь. Це не доводить, що вже запущений remote Gateway
child перезапустився в той самий plugin code. У VPS/container setup з
wrapper processes надсилайте рестарти до фактичного процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Вимкнений**: plugin існує, але enablement rules вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на plugin id, який discovery не знайшов.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній schema. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може помістити недійсний entry у карантин, вимкнувши його й видаливши його config payload.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг має пріоритет):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Paths, які вказують
    назад на власні packaged bundled plugin directories OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі aliases.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (model providers, speech).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетовані встановлення та Docker images зазвичай resolve bundled plugins із
скомпільованого дерева `dist/extensions`. Якщо source directory bundled plugin
bind-mounted поверх відповідного packaged source path, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей mounted source directory
як bundled source overlay і discovers його перед packaged
bundle `/app/dist/extensions/synology-chat`. Це зберігає maintainer container
loops робочими без перемикання кожного bundled plugin назад на TypeScript source.
Встановіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати packaged dist bundles
навіть коли source overlay mounts присутні.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins з походженням workspace **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору default-on, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, як-от посилання на модель provider, конфігурацію каналу або runtime harness
- Застаріла конфігурація plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex родини OpenAI зберігають окремі межі plugins:
  `openai-codex/*` належить до plugin OpenAI, тоді як вбудований plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в live chat traffic, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  Gateway URL, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін install/config/code plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть signal дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  diagnostics. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для agent turns; `llm_output` виконується лише після того, як спроба моделі
  створить assistant output.
- Для підтвердження ефективної session model використовуйте `openclaw sessions` або
  поверхні Gateway session/status, а під час налагодження provider payloads запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
setup flow або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із вбудованим plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і origin.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і diagnostics.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  plugin packages, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  plugin id нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте tools, що належать plugin,
  щоб runtime surface була однозначною.

## Plugin slots (ексклюзивні категорії)

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

| Слот            | Чим керує            | За замовчуванням    |
| --------------- | -------------------- | ------------------- |
| `memory`        | Plugin active memory | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

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

Вбудовані plugins постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані model providers, вбудовані speech providers і вбудований browser
plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує source path замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед його ввімкненням. Якщо той самий plugin id
присутній у `plugins.deny`, install видаляє цей застарілий deny entry, щоб
явне встановлення можна було завантажити відразу після перезапуску.

OpenClaw зберігає persisted local plugin registry як cold read model для
plugin inventory, contribution ownership і startup planning. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні install metadata у
top-level `installRecords` і відновлювані manifest metadata у `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` відновлює його manifest view з install records, config policy і
manifest/package metadata без завантаження runtime modules plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних installs. Передача
npm package spec з dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису plugin і записує новий spec для майбутніх оновлень.
Передача назви пакета без версії повертає exact pinned install назад до
default release line registry. Якщо встановлений npm plugin уже збігається з
розв’язаною версією та записаною artifact identity, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування config.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace installs зберігають metadata джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це break-glass override для хибних
спрацювань вбудованого dangerous-code scanner. Він дозволяє installs plugin
і updates plugin продовжуватися після вбудованих знахідок `critical`, але все одно
не обходить policy blocks plugin `before_install` або блокування scan-failure.
Сканування install ігнорує поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати packaged test mocks;
оголошені runtime entrypoints plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI flag застосовується лише до потоків install/update plugin. Встановлення skill
dependencies на основі Gateway натомість використовують відповідний request
override `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком
завантаження/встановлення ClawHub skill.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
dashboard ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на installs на вашій власній
машині; він не просить ClawHub повторно просканувати plugin або зробити заблокований release
публічним.

Compatible bundles беруть участь у тому самому потоці list/inspect/enable/disable
plugin. Поточна runtime підтримка включає bundle skills, Claude command-skills,
значення за замовчуванням Claude `settings.json`, значення за замовчуванням Claude `.lsp.json` і manifest-declared
`lspServers`, Cursor command-skills і сумісні hook
directories Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені bundle capabilities, а також
підтримувані або непідтримувані записи server MCP і LSP для bundle-backed plugins.

Marketplace sources можуть бути Claude known-marketplace name з
`~/.claude/plugins/known_marketplaces.json`, локальним marketplace root або
шляхом `marketplace.json`, GitHub shorthand на кшталт `owner/repo`, GitHub repo
URL або git URL. Для remote marketplaces записи plugin мають лишатися всередині
cloned marketplace repo і використовувати лише relative path sources.

Див. [`openclaw plugins` CLI reference](/uk/cli/plugins) для повних подробиць.

## Огляд Plugin API

Native plugins експортують entry object, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як legacy alias, але нові plugins мають
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
activation plugin. Loader усе ще fallback до `activate(api)` для старіших plugins,
але вбудовані plugins і нові external plugins мають вважати `register` публічним
contract.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим          | Значення                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Активація середовища виконання. Реєстрація інструментів, хуків, служб, команд, маршрутів та інших активних побічних ефектів.               |
| `discovery`     | Виявлення можливостей лише для читання. Реєстрація провайдерів і метаданих; код довіреної точки входу Plugin може завантажуватися, але активні побічні ефекти пропускаються. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковагову точку входу налаштування.                                                      |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна точка входу середовища виконання.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                         |

Точки входу Plugin, які відкривають сокети, бази даних, фонових виконавців або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може виконати довірену точку входу Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легковаговими та без побічних ефектів, а
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб
переносьте за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                       |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)                |
| `registerChannel`                       | Канал чату                            |
| `registerTool`                          | Інструмент агента                     |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                  |
| `registerSpeechProvider`                | Text-to-speech / STT                  |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                         |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі     |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                |
| `registerImageGenerationProvider`       | Генерація зображень                   |
| `registerMusicGenerationProvider`       | Генерація музики                      |
| `registerVideoGenerationProvider`       | Генерація відео                       |
| `registerWebFetchProvider`              | Провайдер веботримання / скрейпінгу   |
| `registerWebSearchProvider`             | Вебпошук                              |
| `registerHttpRoute`                     | Кінцева точка HTTP                    |
| `registerCommand` / `registerCli`       | Команди CLI                           |
| `registerContextEngine`                 | Рушій контексту                       |
| `registerService`                       | Фонова служба                         |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Рідний сервер застосунку Codex передає події рідних для Codex інструментів назад на цю
поверхню хуків. Plugins можуть блокувати рідні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у затвердженнях Codex
`PermissionRequest`. Міст ще не переписує аргументи рідних для Codex інструментів.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повний опис поведінки типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні plugins](/uk/plugins/community) — списки сторонніх розробників
