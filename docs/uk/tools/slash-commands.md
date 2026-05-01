---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Slash-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Команди зі скісною рискою
x-i18n:
    generated_at: "2026-05-01T10:03:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfa4c8e294080e824b15f0b54842718f7913cf6d42b7edd4ca9695c3d4113924
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмова або гілка прив’язана до сеансу ACP, звичайний подальший текст спрямовується до цього середовища ACP. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` плюс `/unfocus` залишаються локальними щоразу, коли для поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як «вбудовані підказки» і **не** зберігають налаштування сеансу.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сеансі й відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація надходить зі списків дозволених/сполучення каналу плюс `commands.useAccessGroups`. Для неавторизованих відправників директиви трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Лише відправники зі списку дозволених/авторизовані відправники: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Увімкнює розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Встановіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash-команди для кожного skill). Встановіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Увімкнює `! <cmd>` для запуску shell-команд хоста (`/bash <cmd>` є псевдонімом; потребує allowlist-ів `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед перемиканням у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Увімкнює `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Увімкнює `/mcp` (читає/записує MCP-конфігурацію під керуванням OpenClaw у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Увімкнює `/plugins` (виявлення/стан plugins, а також елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Увімкнює `/debug` (лише runtime-перевизначення).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Увімкнює `/restart` і дії інструмента перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний allowlist власника для командних/інструментальних поверхонь, доступних лише власнику. Це обліковий запис оператора-людини, який може схвалювати небезпечні дії та запускати команди на кшталт `/diagnostics`, `/export-trajectory` і `/config`. Він відокремлений від `commands.allowFrom` і доступу через DM-парування.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для окремого каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з визначеним кандидатом у власники (наприклад, записом у `commands.ownerAllowFrom` чи нативними метаданими власника від провайдера), або мати внутрішню область дії `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/невизначений список кандидатів у власники **не** є достатнім — команди лише для власника на цьому каналі завершуються закрито. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними allowlist-ами команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власників відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає HMAC-секрет, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist для авторизації команд для окремих провайдерів. Коли налаштовано, це єдине джерело авторизації для команд і директив (allowlist-и/парування каналів і `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального значення за замовчуванням; ключі для конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Забезпечує застосування allowlist-ів/політик для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди core походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди dock походять із `src/auto-reply/commands-registry.data.ts`
- команди plugin походять із викликів `registerCommand()` у plugin
- фактична доступність на вашому gateway усе ще залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані команди core

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ідентифікатори CLI-сесій backend і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` ущільнює контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують закінченням строку дії прив’язки thread.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібна часова шкала prompt, tool і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` задає рівень thinking. Параметри надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а користувацькі рівні, як-от `xhigh`, `adaptive`, `max`, або бінарний `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає verbose-вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає trace-вивід plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає fast mode.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає exec-значення за замовчуванням.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних за автентифікацією провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, застаріле `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) і параметрами на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Command queue](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` показує коротке зведення довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний agent може використовувати прямо зараз.
    - `/status` показує стан виконання/runtime, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для багів Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте diagnostics правилом allow-all. Після схвалення він надсилає придатний для вставлення звіт із локальним шляхом bundle, зведенням manifest, нотатками щодо приватності та відповідними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає відповідний feedback Codex на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори thread Codex і команди `codex resume <thread-id>`. Див. [Diagnostics Export](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає helper налаштування та repair Crestodian з owner DM.
    - `/tasks` перелічує активні/недавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує footer використання для кожної відповіді або друкує локальне зведення витрат.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текст.
    - `/approve <id> <decision>` розв’язує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує ACP-сесіями та runtime-параметрами.
    - `/focus <target>` прив’язує поточний thread Discord або тему/розмову Telegram до цільової сесії.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` перелічує agent-ів, прив’язаних до thread, для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених sub-agent-ів.
    - `/steer <id|#> <message>` надсилає steer-повідомлення запущеному sub-agent. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише власником і адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера під керуванням OpenClaw у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан плагінів. `/plugin` — псевдонім. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує лише runtime-перевизначеннями конфігурації. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації в групі.
    - `/bash <command>` виконує команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списки дозволеного `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове bash-завдання.
    - `!stop [sessionId]` зупиняє фонове bash-завдання.

  </Accordion>
</AccordionGroup>

### Згенеровані dock-команди

Dock-команди перемикають маршрут відповіді поточної сесії на інший пов'язаний
канал. Див. [докінг каналів](/uk/concepts/channel-docking) щодо налаштування,
прикладів і усунення несправностей.

Dock-команди генеруються з плагінів каналів із підтримкою native-command. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте dock-команди з прямого чату, щоб перемкнути маршрут відповіді поточної сесії на інший пов'язаний канал. Агент зберігає той самий контекст сесії, але майбутні відповіді для цієї сесії доставляються вибраному співрозмовнику каналу.

Dock-команди потребують `session.identityLinks`. Відправник-джерело й цільовий співрозмовник мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активній сесії. Якщо відправник не пов'язаний зі співрозмовником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Докінг змінює лише маршрут активної сесії. Він не створює облікові записи каналів, не надає доступ, не обходить списки дозволеного каналів і не переносить історію транскрипту в іншу сесію. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану dock-команду, щоб знову перемкнути маршрут.

### Вбудовані команди плагінів

Вбудовані плагіни можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає dreaming пам'яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва native-команди — `/talkvoice`.
- `/card ...` надсилає пресети багатих карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим app-server harness Codex. Див. [harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Викликані користувачем Skills також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills також можуть з'являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- Реєстрація native-команд Skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і парсера">
    - Команди приймають необов'язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст розглядається як тіло повідомлення.
    - Для повної розбивки використання провайдера використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатооблікових каналах `/allowlist --account <id>`, спрямований на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальне зведення витрат із журналів сесій OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації плагінів, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію плагінів і може запропонувати перезапуск.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Native-команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує guild і вибраного голосового/сценічного каналу. Потребує `channels.discord.voice` і native-команд.
    - Команди прив'язки тредів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив'язок тредів (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і runtime-поведінка: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, що належать плагінам, і не вмикає звичайний verbose-шум інструментів.
    - `/fast on|off` зберігає перевизначення сесії. Використовуйте опцію `inherit` в UI сесій, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex відображають його в `service_tier=priority` на native Responses endpoints, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, відображають його в `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Зведення збоїв інструментів усе ще показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику плагінів, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделей">
    - `/model` негайно зберігає нову модель сесії.
    - Якщо агент неактивний, наступний запуск одразу використовує її.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускає в нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналів повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях та inline-скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволеного обробляються негайно (обхід черги + моделі).
    - **Обмеження згадкою в групі:** повідомлення лише з командами від відправників зі списку дозволеного обходять вимоги згадки.
    - **Inline-скорочення (лише відправники зі списку дозволеного):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує звичайний потік.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а inline-токени `/...` розглядаються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і native-аргументи">
    - **Команди Skills:** Skills з `user-invocable` доступні як slash-команди. Назви очищуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає Skill за назвою (корисно, коли обмеження native-команд не дають створити окремі команди для кожного Skill).
      - Типово команди Skills передаються моделі як звичайний запит.
      - Skills можуть необов'язково оголосити `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (плагін OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи native-команд:** Discord використовує автозавершення для динамічних опцій (і меню кнопок, коли ви пропускаєте обов'язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти розв'язуються відносно цільової моделі сесії, тому специфічні для моделі опції, як-от рівні `/think`, дотримуються перевизначення `/model` цієї сесії.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на runtime-питання, а не на питання конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні native-команд, які підтримують аргументи, надають той самий перемикач режиму: `compact|verbose`.
- Результати прив'язані до сесії, тому зміна агента, каналу, треду, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час runtime, зокрема основні інструменти, підключені інструменти плагінів та інструменти, що належать каналам.

Для редагування профілю й перевизначень використовуйте панель інструментів Control UI або поверхні конфігурації/каталогу, а не розглядайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише залишку інвертуються перед показом, а відповіді `model_remains` віддають перевагу запису chat-model плюс мітці плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання транскрипту, коли live-знімок сесії розріджений. Наявні ненульові live-значення все ще мають пріоритет, а fallback транскрипту також може відновити активну мітку runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI-бекенд або ACP-бекенд.
- **Токени/вартість для кожної відповіді** керується `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/автентифікації/endpoints**, а не використання.

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

- `/model` і `/model list` показують компактний нумерований picker (родина моделі + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний picker із dropdown-полями провайдера й моделі плюс крок Submit.
- `/model <#>` вибирає з цього picker (і віддає перевагу поточному провайдеру, коли можливо).
- `/model status` показує докладний перегляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли доступно.

## Debug-перевизначення

`/debug` дає змогу встановлювати **лише runtime** перевизначення конфігурації (у памʼяті, не на диску). Лише для власника. За замовчуванням вимкнено; увімкніть за допомогою `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення застосовуються негайно для нових зчитувань конфігурації, але **не** записуються в `openclaw.json`. Скористайтеся `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід трасування Plugin

`/trace` дає змогу перемикати **рядки трасування/налагодження plugin у межах сеансу** без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сеансу.
- `/trace on` вмикає рядки трасування plugin для поточного сеансу.
- `/trace off` знову вимикає їх.
- Рядки трасування Plugin можуть зʼявлятися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і надалі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу й надалі належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. За замовчуванням вимкнено; увімкніть за допомогою `commands.config: true`.

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

`/mcp` записує керовані OpenClaw визначення серверів MCP у `mcp.servers`. Лише для власника. За замовчуванням вимкнено; увімкніть за допомогою `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери вирішують, які транспорти фактично можна виконати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені plugins і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. За замовчуванням вимкнено; увімкніть за допомогою `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення plugin для поточного робочого простору та конфігурації на диску.
- `/plugins enable|disable` оновлює лише конфігурацію plugin; це не встановлює й не видаляє plugins.
- Після змін увімкнення/вимкнення перезапустіть gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сеанси для кожної поверхні">
    - **Текстові команди** виконуються у звичайному чат-сеансі (DM використовують спільний `main`, групи мають власний сеанс).
    - **Нативні команди** використовують ізольовані сеанси:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовується на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** спрямовується на активний чат-сеанс, щоб він міг перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і надалі підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), оскільки Slack резервує `/status`. Текстова `/status` і надалі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточний сеанс.

На відміну від звичайного чату:

- воно використовує поточний сеанс як фоновий контекст,
- виконується як окремий одноразовий виклик **без інструментів**,
- не змінює майбутній контекст сеансу,
- не записується в історію стенограми,
- доставляється як live-побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжує виконуватися.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повну інформацію про поведінку та UX клієнта.

## Повʼязане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
