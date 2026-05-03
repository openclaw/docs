---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або прав доступу
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Команди зі скісною рискою
x-i18n:
    generated_at: "2026-05-03T17:33:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b7c1f3daa9598515085fd94570172f82779ce61a2af34edac02a36ccc87543
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмова або thread прив’язана до сеансу ACP, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` плюс `/unfocus` залишаються локальними щоразу, коли обробку команд увімкнено для цієї поверхні.

Існують дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Commands">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних чат-повідомленнях (не лише з директивами) вони розглядаються як «inline hints» і **не** зберігають налаштування сеансу.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сеансі й відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується лише цей allowlist; інакше авторизація береться з allowlists/спарювання каналу плюс `commands.useAccessGroups`. Неавторизовані відправники бачать, що директиви обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Лише allowlisted/авторизовані відправники: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Вони виконуються негайно, вилучаються до того, як модель побачить повідомлення, а решта тексту продовжує проходити звичайним потоком.

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
  Умикає розбір `/...` у чат-повідомленнях. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення в `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash commands); ігнорується для провайдерів без нативної підтримки. Встановіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає в порівняння узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash command для кожного skill). Встановіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Умикає `! <cmd>` для запуску shell-команд хоста (`/bash <cmd>` є псевдонімом; потребує allowlists `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед перемиканням у фоновий режим (`0` переводить у фон негайно).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Умикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Умикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Умикає `/plugins` (виявлення/статус plugins плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Умикає `/debug` (лише runtime-перевизначення).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Умикає `/restart` плюс дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Встановлює явний owner allowlist для командних/інструментальних поверхонь лише для owner. Це обліковий запис людського оператора, який може схвалювати небезпечні дії та виконувати команди, як-от `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через DM-спарювання.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для owner вимагати **ідентичність owner** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з розв’язаним кандидатом owner (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими owner провайдера), або мати внутрішній scope `operator.admin` у внутрішньому каналі повідомлень. Запис wildcard у channel `allowFrom` або порожній/нерозв’язаний список кандидатів owner **не** є достатнім — команди лише для owner на цьому каналі відмовляють закрито. Залиште це вимкненим, якщо хочете, щоб команди лише для owner обмежувалися тільки `ownerAllowFrom` і стандартними command allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ids owner відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково встановлює HMAC secret, що використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist для авторизації команд за провайдерами. Коли налаштовано, це єдине джерело авторизації для команд і директив (channel allowlists/спарювання та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального типового значення; ключі окремих провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує allowlists/policies для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- core built-ins беруться з `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock commands беруться з `src/auto-reply/commands-registry.data.ts`
- команди plugins беруться з викликів plugin `registerCommand()`
- фактична доступність на вашому gateway все одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані команди core

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` запускає новий сеанс; `/reset` є псевдонімом скидання.
    - Control UI перехоплює введений `/new`, щоб створити та перемкнутися на свіжий сеанс dashboard; введений `/reset` все одно виконує in-place reset Gateway.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ids сеансів CLI backend і повторно запускає startup/system-prompt loading in-place.
    - `/compact [instructions]` ущільнює контекст сеансу. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки thread.
    - `/export-session [path]` експортує поточний сеанс у HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточного сеансу. Використовуйте це, коли вам потрібна хронологія prompt, tool і transcript для одного сеансу OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються owner приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` встановлює рівень thinking. Варіанти беруться з профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а власні рівні, як-от `xhigh`, `adaptive`, `max`, або двійковий `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає verbose output. Псевдонім: `/v`.
    - `/trace on|off` перемикає plugin trace output для поточного сеансу.
    - `/fast [status|on|off]` показує або встановлює fast mode.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або встановлює типові значення exec.
    - `/model [name|#|status]` показує або встановлює модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних за автентифікацією провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний catalog цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс параметри на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сеансу. Див. [Command queue](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` показує короткий довідковий підсумок.
    - `/commands` показує згенерований catalog команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати просто зараз.
    - `/status` показує execution/runtime status, включно з мітками `Execution`/`Runtime` і usage/quota провайдера, коли доступно.
    - `/diagnostics [note]` — це owner-only support-report flow для помилок Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте diagnostics правилом allow-all. Після схвалення він надсилає звіт, придатний для вставлення, з локальним шляхом bundle, підсумком manifest, privacy notes і релевантними ids сеансів. У групових чатах prompt схвалення та звіт надсилаються owner приватно. Коли активний сеанс використовує OpenAI Codex harness, те саме схвалення також надсилає релевантний Codex feedback на сервери OpenAI, а завершена відповідь перелічує ids сеансів OpenClaw, ids threads Codex і команди `codex resume <thread-id>`. Див. [Diagnostics Export](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає helper налаштування та ремонту Crestodian з DM owner.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточного сеансу.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш sender id. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує per-response usage footer або друкує local cost summary.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текст.
    - `/approve <id> <decision>` розв’язує prompts схвалення exec.
    - `/btw <question>` ставить side question без зміни майбутнього контексту сеансу. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP та параметрами середовища виконання.
    - `/focus <target>` прив’язує поточний потік Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` вилучає поточну прив’язку.
    - `/agents` показує агентів, прив’язаних до потоку, для поточного сеансу.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/steer <id|#> <message>` надсилає керування запущеному субагенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли це ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації в групі.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списки дозволів `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди стикування

Команди стикування перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Див. [Стикування каналів](/uk/concepts/channel-docking) щодо налаштування,
прикладів і усунення неполадок.

Команди стикування генеруються з channel plugins із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди стикування з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному співрозмовнику каналу.

Команди стикування потребують `session.identityLinks`. Відправник-джерело й цільовий співрозмовник мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не пов’язаний зі співрозмовником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Стикування змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволів каналів і не переносить історію транскрипта до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду стикування, щоб знову перемкнути маршрут.

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає memory dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди: `/talkvoice`.
- `/card ...` надсилає пресети багатих карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє та керує вбудованим серверним каркасом застосунку Codex. Див. [Каркас Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли skill/plugin їх реєструє.
- реєстрація нативних команд Skills контролюється `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, які підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст вважається тілом повідомлення.
    - Для повної розбивки використання провайдерів використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатокористувацьких каналах `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, оскільки вихідні модулі plugin змінилися.
    - `/plugins enable|disable` оновлює конфігурацію plugin і запускає перезавантаження plugins Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує гільдії та вибраного голосового/сценічного каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки потоків Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок потоків (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [Агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Детальний режим / трасування / fast / безпека reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише рядки трасування/налагодження, що належать plugin, і не вмикає звичайний детальний шум інструментів.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в інтерфейсі Sessions UI, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних кінцевих точках Responses, тоді як прямі публічні запити Anthropic, зокрема трафік з OAuth-автентифікацією, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли це доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент простоює, наступний запуск одразу її використовує.
    - Якщо запуск уже активний, OpenClaw позначає живе перемикання як очікуване й перезапускається в нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої нагоди повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від rescue mode каналу повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях та вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволів обробляються негайно (обхід черги + моделі).
    - **Обмеження групових згадок:** повідомлення лише з командами від відправників зі списку дозволів обходять вимоги згадки.
    - **Вбудовані скорочення (лише відправники зі списку дозволів):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються перед тим, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Несанкціоновані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** Skills `user-invocable` доступні як slash-команди. Назви очищаються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дають створити окремі команди для кожного skill).
      - Типово команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголосити `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент. Динамічні варіанти визначаються відносно моделі цільового сеансу, тому параметри, специфічні для моделі, наприклад рівні `/think`, дотримуються перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на запитання про середовище виконання, а не про конфігурацію: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати мають область дії сеансу, тому зміна агента, каналу, потоку, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які справді доступні в середовищі виконання, зокрема базові інструменти, підключені інструменти plugin та інструменти, що належать каналу.

Для редагування профілю та перевизначень використовуйте панель Tools в Control UI або поверхні конфігурації/каталогу, а не трактуйте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") відображається в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису чат-моделі плюс позначці плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання з транскрипту, коли знімок живої сесії розріджений. Наявні ненульові живі значення все одно мають пріоритет, а fallback із транскрипту також може відновити мітку активної runtime-моделі плюс більшу prompt-орієнтовану суму, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI-бекенд або ACP-бекенд.
- **Токени/вартість на відповідь** контролюється через `/usage off|tokens|full` (додається до звичайних відповідей).
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

- `/model` і `/model list` показують компактний нумерований вибірник (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибірник із випадаючими списками провайдера та моделі плюс кроком Submit.
- `/model <#>` вибирає з цього вибірника (і, коли можливо, надає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

## Debug-перевизначення

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам'яті, не на диску). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення негайно застосовуються до нових читань конфігурації, але **не** записуються в `openclaw.json`. Використайте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід трасування Plugin

`/trace` дає змогу перемикати **сесійні рядки трасування/debug Plugin** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сесії.
- `/trace on` вмикає рядки трасування Plugin для поточної сесії.
- `/trace off` знову їх вимикає.
- Рядки трасування Plugin можуть з'являтися в `/status` і як наступне діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` усе ще керує лише runtime-перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний verbose-вивід інструментів/статусу все ще належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Конфігурацію перевіряють перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються після перезапусків.
</Note>

## Оновлення MCP

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери вирішують, які транспорти фактично можна виконувати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені Plugin і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як alias. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

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
- `/plugins install` встановлює з ClawHub, npm, git, локальних каталогів і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; це не встановлює й не видаляє Plugin.
- Зміни ввімкнення й вимкнення hot-reload runtime-поверхні Plugin у Gateway для нових ходів агента; install запитує перезапуск Gateway, бо вихідні модулі Plugin змінилися.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії за поверхнею">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (цілиться в чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** цілиться в активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Специфіка Slack">
    `channels.slack.slashCommand` усе ще підтримується для однієї команди стилю `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ephemeral-кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточну сесію. `/side` є alias.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипту,
- воно доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основне завдання продовжує виконуватися.

Приклад:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повну поведінку та деталі UX клієнта.

## Пов'язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
