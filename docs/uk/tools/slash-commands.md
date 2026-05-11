---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Команди зі скісною рискою
x-i18n:
    generated_at: "2026-05-11T21:02:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Bash-команда чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або thread прив’язано до ACP-сесії, звичайний текст подальших відповідей спрямовується до цього ACP harness. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` плюс `/unfocus` залишаються локальними, коли обробку команд увімкнено для цієї поверхні.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви видаляються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, це єдиний список дозволених; інакше авторизація походить зі списків дозволених каналів/спарювання плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Лише відправники зі списку дозволених/авторизовані: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Вони виконуються негайно, видаляються до того, як модель побачить повідомлення, а решта тексту продовжує проходити звичайний потік.

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
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash commands); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). У Discord `false` пропускає реєстрацію slash-command і очищення під час запуску; раніше зареєстровані команди можуть залишатися видимими, доки ви не видалите їх із застосунку Discord. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає в порівняння узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє **skill**-команди нативно, коли це підтримується. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash command для кожної skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску shell-команд хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, скільки bash очікує перед перемиканням у фоновий режим (`0` переводить у фон негайно).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/status plugin плюс керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс tool actions перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених owner для командних/tool-поверхонь лише для owner. Це обліковий запис оператора-людини, який може схвалювати небезпечні дії та виконувати команди на кшталт `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через DM pairing.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для owner вимагати **ідентичність owner** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з визначеним кандидатом owner (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими owner від провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/невизначений список кандидатів owner **не** є достатнім — команди лише для owner fail closed на цьому каналі. Залиште це вимкненим, якщо хочете, щоб команди лише для owner обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як owner ids відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає HMAC secret, що використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдером. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених каналів/спарювання та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального стандартного значення; ключі конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди core походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди походять із `src/auto-reply/commands-registry.data.ts`
- plugin-команди походять із викликів plugin `registerCommand()`
- фактична доступність на вашому gateway все одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані команди core

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом reset.
    - Control UI перехоплює введений `/new`, щоб створити та перемкнутися на свіжу dashboard-сесію, крім випадку, коли налаштовано `session.dmScope: "main"` і поточний parent є main-сесією агента; у такому разі `/new` скидає main-сесію на місці. Введений `/reset` все одно запускає in-place reset Gateway.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані session ids CLI backend і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням прив’язки thread.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує exec-схвалення, а потім експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли потрібна timeline prompt, tool і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються owner приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Керування моделлю та запуском">
    - `/think <level|default>` задає рівень thinking або очищає перевизначення сесії. Варіанти походять із provider profile активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а кастомні рівні на кшталт `xhigh`, `adaptive`, `max` або binary `on` доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає trace-вивід plugin для поточної сесії.
    - `/fast [status|on|off|default]` показує, задає або очищає fast mode.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає стандартні значення exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через auth провайдерів або моделі провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера. Записи `provider/*` у `agents.defaults.models` змушують `/model` і `/models` показувати виявлені моделі лише для цих провайдерів.
    - `/queue <mode>` керує поведінкою queue (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс опціями на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Command queue](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).
    - `/steer <message>` вставляє guidance в активний запуск для поточної сесії, незалежно від режиму `/queue`. Він не запускає новий запуск, коли сесія idle. Псевдонім: `/tell`. Див. [Steer](/uk/tools/steer).

  </Accordion>
  <Accordion title="Виявлення та status">
    - `/help` показує короткий підсумок довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати просто зараз.
    - `/status` показує status виконання/runtime, uptime Gateway і системи, плюс usage/quota провайдера, коли доступно.
    - `/diagnostics [note]` — це support-report flow лише для owner для багів Gateway і запусків Codex harness. Він щоразу запитує явне exec-схвалення перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте diagnostics із правилом allow-all. Після схвалення він надсилає report, який можна вставити, з локальним шляхом bundle, summary manifest, нотатками privacy та релевантними session ids. У групових чатах prompt схвалення та report надсилаються owner приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає релевантний Codex feedback на сервери OpenAI, а завершена відповідь перелічує OpenClaw session ids, Codex thread ids і команди `codex resume <thread-id>`. Див. [Diagnostics Export](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та repair Crestodian з owner DM.
    - `/tasks` перелічує активні/нещодавні background tasks для поточної сесії.
    - `/context [list|detail|map|json]` пояснює, як збирається контекст. `map` надсилає treemap-зображення контексту поточної сесії.
    - `/whoami` показує ваш sender id. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує usage footer для кожної відповіді або друкує локальний cost summary.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` розв’язує запити на схвалення виконання.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP та параметрами середовища виконання.
    - `/focus <target>` прив’язує поточний тред Discord або тему/розмову Telegram до цілі сесії.
    - `/unfocus` вилучає поточну прив’язку.
    - `/agents` показує агентів, прив’язаних до треду, для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/subagents steer <id|#> <message>` надсилає керування запущеному субагенту. Див. [Steer](/uk/tools/steer).

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан Plugin. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; встановіть `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` виконує команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списки дозволених `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди стикування

Команди стикування перемикають маршрут відповіді поточної сесії на інший пов’язаний
канал. Див. [Стикування каналів](/uk/concepts/channel-docking), щоб налаштувати,
переглянути приклади та усунути неполадки.

Команди стикування генеруються з Plugin каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди стикування з прямого чату, щоб перемкнути маршрут відповіді поточної сесії на інший пов’язаний канал. Агент зберігає той самий контекст сесії, але майбутні відповіді для цієї сесії доставляються вибраному співрозмовнику каналу.

Команди стикування потребують `session.identityLinks`. Відправник-джерело та цільовий співрозмовник мають бути в одній групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активній сесії. Якщо відправник не пов’язаний зі співрозмовником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Стикування змінює лише маршрут активної сесії. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволених каналу й не переносить історію транскрипту до іншої сесії. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду стикування, щоб знову перемкнути маршрут.

### Вбудовані команди Plugin

Вбудовані Plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком створення пари/налаштування пристрою. Див. [Створення пари](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає пресети розширених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим серверним harness застосунку Codex. Див. [harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також надаються як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills також можуть з’являтися як прямі команди, як-от `/prose`, коли skill/Plugin їх реєструє.
- нативною реєстрацією команд Skills керують `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, що підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст вважається тілом повідомлення.
    - Щоб отримати повний розподіл використання провайдера, використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У каналах із кількома обліковими записами `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сесій OpenClaw.
    - `/restart` увімкнено типово; встановіть `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації Plugin, що й `openclaw plugins install`: локальний шлях/архів, пакет npm, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, оскільки вихідні модулі Plugin змінилися.
    - `/plugins enable|disable` оновлює конфігурацію Plugin і запускає перезавантаження Plugin Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує guild і вибраного голосового/stage-каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки тредів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок тредів (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; тримайте його **вимкненим** за звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать Plugin, і тримає звичайний докладний шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сесії. Використовуйте параметр `inherit` в UI Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних endpoints Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли вони доречні, але докладний текст збою додається лише тоді, коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових середовищах: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику Plugin, які ви не планували показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сесії.
    - Якщо агент неактивний, наступний запуск використовує її одразу.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускає в новій моделі лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналів повідомлень і не надає віддалених повноважень на конфігурацію.

  </Accordion>
  <Accordion title="Швидкий шлях та inline-скорочення">
    - **Швидкий шлях:** повідомлення лише з командою від відправників зі списку дозволених обробляються негайно (обхід черги + моделі).
    - **Обмеження згадуванням у групі:** повідомлення лише з командою від відправників зі списку дозволених обходять вимоги згадування.
    - **Inline-скорочення (лише відправники зі списку дозволених):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командою тихо ігноруються, а inline-токени `/...` трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** Skills `user-invocable` надаються як slash-команди. Назви санітизуються до `a-z0-9_` (максимум 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дозволяють окремі команди для кожного skill).
      - Типово команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
    - **Нативні аргументи команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти визначаються відносно цільової моделі сесії, тому специфічні для моделі параметри, як-от рівні `/think`, дотримуються перевизначення `/model` цієї сесії.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на запитання про середовище виконання, а не про конфігурацію: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму, що й `compact|verbose`.
- Результати обмежені сесією, тому зміна агента, каналу, треду, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні в середовищі виконання, зокрема core-інструменти, підключені інструменти Plugin та інструменти, що належать каналу.

Для редагування профілю та перевизначень використовуйте панель Tools в Control UI або поверхні конфігурації/каталогу замість того, щоб трактувати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота постачальника** (приклад: "Claude 80% left") відображається в `/status` для поточного постачальника моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна постачальників до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису чат-моделі плюс позначці плану з тегом моделі.
- **Рядки токенів/кешу** у `/status` можуть повертатися до найновішого запису використання з транскрипту, коли поточний знімок сесії розріджений. Наявні ненульові поточні значення все одно мають пріоритет, а резервне використання транскрипту також може відновити мітку активної runtime-моделі плюс більший, орієнтований на prompt, підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість на відповідь** керуються через `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/auth/endpoints**, а не використання.

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

- `/model` і `/model list` показують компактний нумерований вибір (родина моделей + доступні постачальники).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із розкривними списками постачальника й моделі та кроком Submit. Вибір враховує `agents.defaults.models`, включно із записами `provider/*`, тож пошук у межах постачальника може тримати вибір нижче ліміту Discord у 25 параметрів компонента.
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному постачальнику).
- `/model status` показує докладний вигляд, включно з налаштованим endpoint постачальника (`baseUrl`) і режимом API (`api`), коли вони доступні.

## Debug-перевизначення

`/debug` дає змогу встановлювати **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише для власника. Типово вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення негайно застосовуються до нових читань конфігурації, але **не** записуються в `openclaw.json`. Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід трасування Plugin

`/trace` дає змогу перемикати **прив’язані до сесії рядки трасування/debug Plugin** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сесії.
- `/trace on` вмикає рядки трасування Plugin для поточної сесії.
- `/trace off` знову вимикає їх.
- Рядки трасування Plugin можуть з’являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний verbose-вивід інструментів/status і далі належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. Типово вимкнено; увімкніть через `commands.config: true`.

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

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Лише для власника. Типово вимкнено; увімкніть через `commands.mcp: true`.

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

`/plugins` дає операторам змогу переглядати виявлені plugins і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Типово вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують справжнє виявлення plugin для поточного workspace плюс конфігурацію на диску.
- `/plugins install` встановлює з ClawHub, npm, git, локальних директорій і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; це не встановлює й не видаляє plugins.
- Зміни ввімкнення й вимкнення гаряче перезавантажують runtime-поверхні Gateway Plugin для нових ходів агента; встановлення запитує перезапуск Gateway, бо вихідні модулі Plugin змінилися.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії для кожної поверхні">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовує на чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** спрямовано на активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і далі підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Нативний виняток Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточну сесію. `/side` є псевдонімом.

На відміну від звичайного чату:

- він використовує поточну сесію як фоновий контекст,
- у сесіях Codex harness він виконується як ефемерний побічний потік Codex із
  поточними дозволами Codex і нативною поверхнею інструментів,
- у сесіях не Codex він зберігає старішу поведінку прямого одноразового побічного виклику,
- він не змінює майбутній контекст сесії,
- він не записується в історію транскрипту,
- він доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повну поведінку та деталі клієнтського UX.

## Пов’язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
