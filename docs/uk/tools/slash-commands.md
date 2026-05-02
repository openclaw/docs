---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-05-02T09:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b469c4436dec92eb3712f71e5f54bf2c96b9b0b17d60a1533d8669c127caefee
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або тред прив’язано до сесії ACP, звичайний текст подальших повідомлень спрямовується до цього ACP harness. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд ACP OpenClaw, а `/status` і `/unfocus` залишаються локальними щоразу, коли для поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як його побачить модель.
    - У звичайних повідомленнях чату (не лише з директивами) вони розглядаються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та повертають підтвердження.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація надходить зі списків дозволених/спарювання каналу плюс `commands.useAccessGroups`. Для неавторизованих відправників директиви розглядаються як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Лише для відправників зі списку дозволених/авторизованих: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Вони виконуються негайно, вилучаються до того, як модель побачить повідомлення, а решта тексту продовжує проходити звичайний потік.

  </Accordion>
</AccordionGroup>

## Конфігурація

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди працюють навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Командами Slack керують у застосунку Slack, і вони не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає в порівняння узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash-команди для кожного skill). Задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску команд оболонки хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash очікує перед перемиканням у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус Plugin плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для командних/інструментальних поверхонь лише для власника. Це обліковий запис людини-оператора, який може схвалювати небезпечні дії та виконувати команди на кшталт `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через спарювання DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з розв’язаним кандидатом-власником (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішній scope `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/нерозв’язаний список кандидатів-власників **не** є достатнім — команди лише для власника на цьому каналі закриті за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як owner ids з’являються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдерами. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених/спарювання каналу та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди ядра надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди dock надходять із `src/auto-reply/commands-registry.data.ts`
- команди Plugin надходять із викликів Plugin `registerCommand()`
- фактична доступність на вашому gateway все ще залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених Plugin

### Вбудовані команди ядра

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - Control UI перехоплює введений `/new`, щоб створити та перемкнутися на свіжу сесію dashboard; введений `/reset` усе ще запускає скидання Gateway на місці.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ids сесій backend CLI та повторно виконує завантаження startup/system-prompt на місці.
    - `/compact [instructions]` ущільнює контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням прив’язки треду.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [пакет траєкторії](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібна хронологія prompt, tool і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Елементи керування моделлю та запуском">
    - `/think <level>` задає рівень мислення. Варіанти надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а власні рівні, як-от `xhigh`, `adaptive`, `max` або двійковий `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування Plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через автентифікацію провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс опції на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Черга команд](/uk/concepts/queue) і [Черга спрямування](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Виявлення та статус">
    - `/help` показує коротке зведення довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати просто зараз.
    - `/status` показує статус виконання/runtime, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, коли доступно.
    - `/diagnostics [note]` — це потік support-report лише для власника для помилок Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте діагностику правилом allow-all. Після схвалення він надсилає звіт, який можна вставити, з локальним шляхом пакета, зведенням manifest, нотатками про приватність і релевантними ids сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає релевантний feedback Codex на сервери OpenAI, а завершена відповідь перелічує ids сесій OpenClaw, ids тредів Codex і команди `codex resume <thread-id>`. Див. [Експорт діагностики](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та виправлення Crestodian з owner DM.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш sender id. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує footer використання для кожної відповіді або друкує локальне зведення вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` вирішує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками під-агентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP і параметрами середовища виконання.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` показує агентів, прив’язаних до гілки, для поточного сеансу.
    - `/kill <id|#|all>` перериває один або всі запущені під-агенти.
    - `/steer <id|#> <message>` надсилає керування запущеному під-агенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` — це псевдонім. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` і списків дозволеного `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове bash-завдання.
    - `!stop [sessionId]` зупиняє фонове bash-завдання.

  </Accordion>
</AccordionGroup>

### Згенеровані dock-команди

Dock-команди перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Див. [стикування каналів](/uk/concepts/channel-docking) для налаштування,
прикладів і усунення несправностей.

Dock-команди генеруються з channel plugins із підтримкою native-command. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте dock-команди з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному учаснику каналу.

Dock-команди потребують `session.identityLinks`. Відправник-джерело й цільовий учасник мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не пов’язаний з учасником Discord, команда відповідає підказкою з налаштування замість передавання у звичайний чат.

Стикування змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволеного каналів і не переносить історію транскрипту в інший сеанс. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану dock-команду, щоб знову перемкнути маршрут.

### Команди вбудованих plugin

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` вмикає або вимикає memory dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає пресети LINE rich card. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє та керує вбудованою обв’язкою сервера застосунку Codex. Див. [обв’язку Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- реєстрація нативних skill-команд керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, які підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
    - Для повної розбивки використання провайдера використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У каналах із кількома обліковими записами `/allowlist --account <id>`, націлена на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію plugin і може попросити перезапуск.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує guild і вибраного голосового/stage-каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки гілок Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок гілок (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` призначено для налагодження та додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише рядки трасування/налагодження, що належать plugin, і не вмикає звичайний докладний шум інструментів.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в інтерфейсі Sessions UI, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex відображають його на `service_tier=priority` у нативних Responses endpoint, тоді як прямі публічні запити Anthropic, зокрема трафік з автентифікацією OAuth, надісланий до `api.anthropic.com`, відображають його на `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішні міркування, вихід інструментів або діагностику plugin, яку ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент неактивний, наступний запуск одразу її використовує.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як відкладене й перезапускається з новою моделлю лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналу повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволеного обробляються негайно (в обхід черги + моделі).
    - **Фільтр згадок у групі:** повідомлення лише з командами від відправників зі списку дозволеного обходять вимоги до згадок.
    - **Вбудовані скорочення (лише відправники зі списку дозволеного):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує звичайний потік.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Команди Skills:** Skills типу `user-invocable` доступні як slash-команди. Назви очищуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд заважають створити окремі команди для кожного skill).
      - Типово команди Skills передаються моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти визначаються відносно цільової моделі сеансу, тому специфічні для моделі параметри, як-от рівні `/think`, відповідають перевизначенню `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання середовища виконання, а не конфігурації: **що цей агент може використовувати просто зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати обмежені сеансом, тому зміна агента, каналу, гілки, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час виконання, зокрема основні інструменти, підключені інструменти plugin та інструменти, що належать каналу.

Для редагування профілю й перевизначень використовуйте панель Control UI Tools або поверхні конфігурації/каталогу замість того, щоб розглядати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед відображенням, а відповіді `model_remains` віддають перевагу запису chat-моделі плюс позначці плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть відступати до останнього запису використання з транскрипту, коли live-знімок сеансу розріджений. Наявні ненульові live-значення все одно мають пріоритет, а fallback на транскрипт також може відновити активну мітку моделі середовища виконання плюс більшу загальну суму, орієнтовану на prompt, коли збережені підсумки відсутні або менші.
- **Виконання проти середовища виконання:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сеанс: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість на відповідь** керуються через `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/автентифікації/endpoint-ів**, а не використання.

## Вибір моделі (`/model`)

`/model` реалізовано як директиву.

Приклади:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Примітки:

- `/model` і `/model list` показують компактний нумерований вибір (родина моделі + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадаючими списками провайдера й моделі та кроком надсилання.
- `/model <#>` вибирає з цього списку (і віддає перевагу поточному провайдеру, коли це можливо).
- `/model status` показує детальний перегляд, включно з налаштованим endpoint-ом провайдера (`baseUrl`) і режимом API (`api`), коли вони доступні.

## Debug-перевизначення

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам'яті, не на диску). Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення одразу застосовуються до нових читань конфігурації, але **не** записуються в `openclaw.json`. Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Виведення трасування Plugin

`/trace` дає змогу перемикати **обмежені сеансом рядки трасування/debug Plugin** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сеансу.
- `/trace on` вмикає рядки трасування Plugin для поточного сеансу.
- `/trace off` знову вимикає їх.
- Рядки трасування Plugin можуть з'являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайне verbose-виведення інструментів/статусу й далі належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Конфігурація перевіряється перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються між перезапусками.
</Note>

## Оновлення MCP

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери вирішують, які транспорти фактично виконувані.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені plugins і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують справжнє виявлення Plugin у поточному workspace плюс конфігурацію на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; це не встановлює й не видаляє plugins.
- Після змін enable/disable перезапустіть gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сеанси на поверхню">
    - **Текстові команди** виконуються у звичайному чат-сеансі (DM спільно використовують `main`, групи мають власний сеанс).
    - **Нативні команди** використовують ізольовані сеанси:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовується на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** спрямовується на активний чат-сеанс, щоб він міг перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і далі підтримується для однієї команди в стилі `/openclaw`. Якщо ввімкнути `commands.native`, потрібно створити по одній slash-команді Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ephemeral-кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (а не `/status`), бо Slack резервує `/status`. Текстовий `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточний сеанс.

На відміну від звичайного чату:

- він використовує поточний сеанс як фоновий контекст,
- він виконується як окремий одноразовий виклик **без інструментів**,
- він не змінює майбутній контекст сеансу,
- він не записується в історію транскрипту,
- він доставляється як live побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повний опис поведінки та деталей UX клієнта.

## Пов'язане

- [Створення Skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
