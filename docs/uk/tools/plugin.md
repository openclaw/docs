---
read_when:
    - Встановлення або налаштування plugin-ів
    - Розуміння правил виявлення та завантаження plugin-ів
    - Робота з Codex/Claude-сумісними наборами plugin-ів
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування plugin-ами OpenClaw
title: Plugin-и
x-i18n:
    generated_at: "2026-04-27T09:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66da700ed753f61891dff76adb5715aca93a9c8c51e541695dda8e54d1b191c0
    source_path: tools/plugin.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
agent harness-и, інструменти, Skills, мовлення, транскрибування в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, вебвибірка, вебпошук
та інше. Деякі plugin-и є **core** (постачаються з OpenClaw), інші
є **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # Із локального каталогу або архіву
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
</Steps>

Якщо ви надаєте перевагу керуванню безпосередньо в chat, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або звичайна специфікація пакета (спочатку ClawHub, потім
резервний перехід на npm).

Якщо конфігурація некоректна, встановлення зазвичай завершується з відмовою за замовчуванням і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого plugin-а для plugin-ів, які явно дозволяють це через
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють завчасно все дерево
залежностей виконання кожного вбудованого plugin-а. Коли вбудований plugin OpenClaw активний через
конфігурацію plugin-а, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням,
під час запуску відновлюються лише оголошені залежності виконання цього plugin-а перед його імпортом.
Сам по собі збережений стан автентифікації каналу не активує вбудований канал для
відновлення залежностей виконання Gateway під час запуску.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих залежностей виконання для цього plugin-а/каналу.
Непорожній `plugins.allow` також обмежує відновлення залежностей виконання для вбудованих plugin-ів, увімкнених за замовчуванням;
явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності plugin-а цього каналу.
External plugin-и та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи plugin-ів

OpenClaw розпізнає два формати plugin-ів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль виконання; виконується в межах процесу | Офіційні plugin-и, пакети npm від спільноти            |
| **Bundle** | Codex/Claude/Cursor-сумісний макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. в [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Точки входу пакета

Пакети npm native plugin-ів повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета й указувати на придатний для читання
файл виконання або на файл вихідного коду TypeScript із автоматично визначеним зібраним JavaScript-
аналогом, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли виконання не розташовані
за тими самими шляхами, що й вихідні записи. Якщо він присутній,
`runtimeExtensions` має містити рівно один запис для кожного запису в `extensions`. Списки, що не збігаються, призводять до помилки встановлення та
виявлення plugin-а, а не до тихого переходу до вихідних шляхів.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні plugin-и

### Придатні для встановлення (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin-и пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється за потреби, з автоматичним згадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser plugin для browser tool, CLI `openclaw browser`, методу gateway `browser.request`, browser runtime та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugin-и? Див. [Community Plugins](/uk/plugins/community).

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

| Поле            | Опис                                                      |
| --------------- | --------------------------------------------------------- |
| `enabled`       | Головний перемикач (типово: `true`)                       |
| `allow`         | Список дозволених plugin-ів (необов’язково)              |
| `deny`          | Список заборонених plugin-ів (необов’язково; deny має пріоритет) |
| `load.paths`    | Додаткові файли/каталоги plugin-ів                        |
| `slots`         | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`| Перемикачі та конфігурація для конкретного plugin-а       |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
такий перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native-коду виконання plugin-а або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки provider/runtime почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації plugin-ів. Позначка
`enabled` для plugin-а там означає, що збережений реєстр і поточна конфігурація дозволяють
plugin-у брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено з тим самим кодом plugin-а. У середовищах VPS/контейнерів із
процесами-обгортками надсилайте перезапуск фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани plugin-а: вимкнений vs відсутній vs невалідний">
  - **Вимкнений**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор plugin-а, який не було знайдено під час виявлення.
  - **Невалідний**: plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugin-и в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні пакетні каталоги вбудованих plugin-ів OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin-и робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugin-и">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugin-и">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні встановлення та Docker-образи зазвичай визначають вбудовані plugin-и з
зібраного дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого plugin-а
bind-mount-иться поверх відповідного пакетного шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як накладання вихідного коду вбудованого plugin-а та виявляє його раніше за пакетний
набір `/app/dist/extensions/synology-chat`. Це зберігає працездатність циклів
супроводу контейнерів без перемикання кожного вбудованого plugin-а назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні набори dist
навіть коли присутні монтування накладання вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugin-и
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugin-и з робочого простору **вимкнені за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані plugin-и дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані plugin-и з явною згодою вмикаються автоматично, коли конфігурація називає
  surface, що належить plugin-у, наприклад посилання на модель provider-а, конфігурацію каналу або harness
  runtime
- Маршрути Codex родини OpenAI зберігають окремі межі plugin-ів:
  `openai-codex/*` належить plugin-у OpenAI, тоді як вбудований plugin
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із runtime hooks

Якщо plugin відображається в `plugins list`, але побічні ефекти `register(api)` або хуки
не працюють у живому chat-трафіку, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — це ті, які ви редагуєте.
- Перезапустіть активний Gateway після встановлення/зміни конфігурації/зміни коду plugin-а. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, такі як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` виконується лише після того,
  як спроба моделі породить вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  surface-и сесії/статусу Gateway, а під час налагодження payload-ів provider-а запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — external plugin каналу,
встановлений поруч із вбудованим plugin-ом, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  та його походження.
- Виконайте `openclaw plugins inspect <id> --json` для кожного підозрюваного plugin-а та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin-ів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором plugin-а з нижчим пріоритетом. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле
  встановлення plugin-а.
- Якщо ви явно ввімкнули обидва plugin-и, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать plugin-у, щоб поверхня runtime була однозначною.

## Слоти plugin-ів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активною лише одна):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або ідентифікатор plugin-а
    },
  },
}
```

| Слот            | Що він керує            | Типове значення     |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory plugin    | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише увімкнені plugin-и
openclaw plugins list --verbose            # детальні рядки для кожного plugin-а
openclaw plugins list --json               # перелік у машиночитному форматі
openclaw plugins inspect <id>              # глибока деталізація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # загальна таблиця
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд стану збереженого реєстру
openclaw plugins registry --refresh        # перебудова збереженого реєстру
openclaw doctor --fix                      # відновлення стану реєстру plugin-ів

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install npm:<pkg>         # встановлення лише з npm
openclaw plugins install <spec> --force    # перезапис наявного встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # link (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # запис точного визначеного npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити все
openclaw plugins uninstall <id>          # видалити конфігурацію та записи індексу plugin-а
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані plugin-и постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser
plugin). Інші вбудовані plugin-и все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або набір hook-ів на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugin-ів. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого plugin-а до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор plugin-а
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явно встановлений plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр plugin-ів як модель читання з холодного старту для
інвентаризації plugin-ів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану
plugin-а. Той самий файл `plugins/installs.json` зберігає надійні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів plugin-ів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec із dist-tag або точною версією визначає назву пакета
назад до відстежуваного запису plugin-а та записує новий spec для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
типову лінію релізів реєстру. Якщо встановлений npm plugin уже відповідає
визначеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановленням plugin-ів
та оновленням plugin-ів продовжуватися попри вбудовані критичні
знахідки, але все одно не обходить блокування політики plugin-а `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin-ів. Встановлення залежностей Skills
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення skill-ів із ClawHub.

Сумісні набори беруть участь у тих самих потоках list/inspect/enable/disable
plugin-ів. Поточна підтримка runtime включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги hook-ів Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані чи непідтримувані записи MCP і LSP server для plugin-ів на основі bundle.

Джерела marketplace можуть бути назвою відомого marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, скороченим записом GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи plugin-ів повинні залишатися в межах
клонованого репозиторію marketplace та використовувати лише відносні шляхи до джерел.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повну інформацію.

## Огляд Plugin API

Native plugin-и експортують об’єкт entry, який надає `register(api)`. Старіші
plugin-и ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові plugin-и повинні
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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час
активації plugin-а. Завантажувач усе ще повертається до `activate(api)` для старіших plugin-ів,
але вбудовані plugin-и та нові external plugin-и повинні розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin-у, чому завантажується його entry:

| Режим          | Значення                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Активація runtime. Реєструйте інструменти, hook-и, сервіси, команди, маршрути та інші живі побічні ефекти.                    |
| `discovery`    | Виявлення можливостей у режимі лише для читання. Реєструйте провайдерів і метадані; код entry довіреного plugin-а може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`   | Завантаження метаданих налаштування каналу через полегшений entry налаштування.                                                 |
| `setup-runtime`| Завантаження налаштування каналу, якому також потрібен entry runtime.                                                           |
| `cli-metadata` | Лише збирання метаданих команди CLI.                                                                                             |

Entry plugin-ів, які відкривають сокети, бази даних, фонові працівники або довготривалі
клієнти, повинні захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активувальних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений entry plugin-а або модуль plugin-а каналу, щоб побудувати
знімок. Тримайте верхні рівні модуля легкими та без побічних ефектів, а мережеві клієнти,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переносіть
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)      |
| `registerChannel`                      | Chat-канал                  |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Хуки життєвого циклу        |
| `registerSpeechProvider`               | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider`| Потокове STT                |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Провайдер вебвибірки / скрапінгу |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | HTTP endpoint               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Context engine              |
| `registerService`                      | Фоновий сервіс              |

Поведінка guard-ів hook-ів для типізованих hook-ів життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Native-запуски app-server Codex повертають містком нативні події інструментів Codex назад у цю
поверхню hook-ів. Plugin-и можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленнях
Codex `PermissionRequest`. Місток поки що не переписує аргументи нативних інструментів Codex. Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Щоб переглянути повну поведінку типізованих hook-ів, див. [огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugin-ів](/uk/plugins/building-plugins) — створіть власний plugin
- [Набори plugin-ів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест plugin-а](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в plugin
- [Внутрішня архітектура plugin-ів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin-и спільноти](/uk/plugins/community) — сторонні переліки
