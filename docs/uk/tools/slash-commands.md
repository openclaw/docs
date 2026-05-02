---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові проти нативних, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-05-02T02:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або гілку прив’язано до ACP-сесії, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway усе одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними, коли для цієї поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Commands">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з directives) вони трактуються як «вбудовані підказки» і **не** зберігають налаштування сесії.
    - У повідомленнях лише з directives (повідомлення містить тільки directives) вони зберігаються в сесії й відповідають підтвердженням.
    - Directives застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація походить зі списків дозволених каналу/сполучення плюс `commands.useAccessGroups`. Неавторизовані відправники бачать directives як звичайний текст.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Лише відправники зі списку дозволених/авторизовані: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash commands); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Командами Slack керують у застосунку Slack, і вони не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає до порівнянь узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash command для кожного skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску команд оболонки хоста (`/bash <cmd>` є псевдонімом; потрібні списки дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash очікує перед переходом у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує MCP-конфігурацію, керовану OpenClaw, у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус plugin, а також елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (лише runtime-перевизначення).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструментів перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власника для командних/інструментальних поверхонь лише для власника. Це обліковий запис людини-оператора, який може схвалювати небезпечні дії та запускати команди, як-от `/diagnostics`, `/export-trajectory` і `/config`. Він відокремлений від `commands.allowFrom` і від доступу через DM-сполучення.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для окремого каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з визначеним кандидатом-власником (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішній scope `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у канальному `allowFrom` або порожній/невизначений список кандидатів-власників **не** є достатнім — команди лише для власника в цьому каналі fail closed. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як owner ids відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  За бажанням задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для кожного провайдера для авторизації команд. Коли він налаштований, це єдине джерело авторизації для команд і directives (списки дозволених каналу/сполучення та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Забезпечує застосування списків дозволених/політик для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані core-команди походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди dock походять із `src/auto-reply/commands-registry.data.ts`
- команди plugin походять із викликів plugin `registerCommand()`
- фактична доступність на вашому gateway усе ще залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані core-команди

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - `/reset soft [message]` зберігає поточну стенограму, відкидає повторно використані ідентифікатори сесій CLI backend і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують закінченням терміну прив’язки гілки.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [пакет trajectory](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли потрібна хронологія prompt, tool і стенограми для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` задає рівень мислення. Варіанти походять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а спеціальні рівні, як-от `xhigh`, `adaptive`, `max`, або бінарний `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід trace plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає fast mode.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає exec defaults.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через auth провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, застаріле `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс параметрами на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Черга команд](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` показує коротке зведення допомоги.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний agent може використовувати просто зараз.
    - `/status` показує статус виконання/runtime, включно з мітками `Execution`/`Runtime` та використанням/квотою провайдера, коли доступно.
    - `/diagnostics [note]` — це support-report flow лише для власника для багів Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте diagnostics правилом allow-all. Після схвалення він надсилає звіт, придатний для вставлення, з локальним шляхом до bundle, зведенням manifest, нотатками про приватність і релевантними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає релевантний Codex feedback на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори гілок Codex і команди `codex resume <thread-id>`. Див. [Експорт діагностики](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та відновлення Crestodian з DM власника.
    - `/tasks` перелічує активні/нещодавні фонові задачі для поточної сесії.
    - `/context [list|detail|json]` пояснює, як складається контекст.
    - `/whoami` показує ваш sender id. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує футером використання для кожної відповіді або друкує локальне зведення вартості.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` вирішує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує ACP-сесіями та runtime-параметрами.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цільової сесії.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` перелічує прив’язаних до гілки agents для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених sub-agents.
    - `/steer <id|#> <message>` надсилає steering запущеному sub-agent. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише власником і адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує лише runtime-перевизначеннями конфігурації. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
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

### Згенеровані команди dock

Команди dock перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Налаштування, приклади й усунення несправностей див. у [стикуванні каналів](/uk/concepts/channel-docking).

Команди dock генеруються з channel plugins із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди dock із прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному peer каналу.

Команди dock потребують `session.identityLinks`. Відправник-джерело й цільовий peer мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не пов’язаний із peer Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Docking змінює лише маршрут активного сеансу. Це не створює облікові записи каналів, не надає доступ, не обходить списки дозволів каналів і не переносить історію транскрипта до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду dock, щоб знову перемкнути маршрут.

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає пресети насичених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим app-server harness Codex. Див. [Codex harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- реєстрацією нативних команд skill керують `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, які підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Нотатки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву provider (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
    - Для повної розбивки використання provider скористайтеся `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У каналах із кількома обліковими записами орієнтовані на конфігурацію `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансу OpenClaw.
    - `/restart` типово ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію plugin і може запропонувати перезапуск.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує guild і вибраного голосового/stage-каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки thread у Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок thread (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка runtime: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження й додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, що належать plugin, і залишає звичайний докладний шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в інтерфейсі Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від provider: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних endpoints Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin, які ви не мали наміру показувати. Бажано залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент неактивний, наступний запуск одразу використовує її.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускається в нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму rescue для каналів повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях та inline-скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволів обробляються негайно (обхід черги + моделі).
    - **Обмеження згадками в групі:** повідомлення лише з командами від відправників зі списку дозволів обходять вимоги до згадок.
    - **Inline-скорочення (лише відправники зі списку дозволів):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` викликає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а inline-токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** skills `user-invocable` доступні як slash-команди. Імена нормалізуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дають створити окремі команди для кожного skill).
      - Типово команди skill пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних опцій (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти розв’язуються відносно цільової моделі сеансу, тому специфічні для моделі опції, як-от рівні `/think`, наслідують перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на runtime-запитання, а не на запитання конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сеансу, тому зміна агента, каналу, thread, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час runtime, зокрема core-інструменти, підключені інструменти plugin та інструменти, що належать каналу.

Для редагування профілю й перевизначень використовуйте панель Tools в Control UI або поверхні конфігурації/каталогу, замість того щоб трактувати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота provider** (приклад: "Claude 80% left") показується в `/status` для provider поточної моделі, коли відстеження використання ввімкнено. OpenClaw нормалізує вікна provider до `% left`; для MiniMax поля відсотків лише залишку інвертуються перед показом, а відповіді `model_remains` надають перевагу запису chat-моделі плюс позначці plan із тегом моделі.
- **Рядки token/cache** у `/status` можуть повертатися до останнього запису використання транскрипта, коли live-знімок сеансу розріджений. Наявні ненульові live-значення все ще мають пріоритет, а fallback транскрипта також може відновити активну мітку runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Execution проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сеанс: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Token/cost для кожної відповіді** керується `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **models/auth/endpoints**, а не використання.

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

Нотатки:

- `/model` і `/model list` показують компактний нумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадними списками провайдера й моделі, а також кроком Submit.
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

## Перевизначення для налагодження

`/debug` дає змогу встановити **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише для власника. Вимкнено за замовчуванням; увімкніть за допомогою `commands.debug: true`.

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

`/trace` дає змогу перемикати **прив’язані до сесії рядки трасування/налагодження Plugin** без увімкнення повного докладного режиму.

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
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу й далі належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. Вимкнено за замовчуванням; увімкніть за допомогою `commands.config: true`.

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

`/mcp` записує визначення MCP-серверів, керовані OpenClaw, у `mcp.servers`. Лише для власника. Вимкнено за замовчуванням; увімкніть за допомогою `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi. Runtime-адаптери вирішують, які транспорти фактично можна виконати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені Plugin і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть за допомогою `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення Plugin у поточній робочій області разом із конфігурацією на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; це не встановлює й не видаляє Plugin.
- Після змін увімкнення/вимкнення перезапустіть Gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії для кожної поверхні">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM використовують спільну `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовує на чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** спрямовується на активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` усе ще підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ephemeral кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипта,
- воно доставляється як живий побічний результат, а не як звичайне повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб ознайомитися з повною поведінкою та деталями UX клієнта.

## Пов’язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
