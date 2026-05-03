---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові та нативні, конфігурація й підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-05-03T18:10:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або тред прив’язано до ACP-сесії, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` плюс `/unfocus` залишаються локальними щоразу, коли обробку команд увімкнено для поверхні.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як "inline hints" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується лише цей список дозволених; інакше авторизація надходить зі списків дозволених/спарювання каналу плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
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
  Реєструє нативні команди. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Встановіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). У Discord значення `false` пропускає реєстрацію slash-команд і очищення під час запуску; раніше зареєстровані команди можуть залишатися видимими, доки ви не видалите їх із застосунку Discord. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає до порівнянь узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створити slash-команду для кожного skill). Встановіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску команд shell хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед перемиканням у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw MCP-конфігурацію в `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус plugin плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Встановлює явний список дозволених власників для командних/інструментальних поверхонь лише для власника. Це обліковий запис людини-оператора, який може схвалювати небезпечні дії та виконувати команди на кшталт `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через спарювання DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з розв’язаним кандидатом власника (наприклад записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/нерозв’язаний список кандидатів власника **не** є достатнім — команди лише для власника на цьому каналі відхиляються за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника з’являються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково встановлює секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдерами. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених/спарювання каналу та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального значення за замовчуванням; ключі конкретних провайдерів перевизначають його.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані core-команди надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- plugin-команди надходять із викликів plugin `registerCommand()`
- фактична доступність на вашому gateway все одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані core-команди

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - Control UI перехоплює введене `/new`, щоб створити й перемкнутися на нову сесію панелі; введене `/reset` все одно виконує скидання Gateway на місці.
    - `/reset soft [message]` зберігає поточний транскрипт, відкидає повторно використані ідентифікатори сесій CLI backend і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням прив’язки треду.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібна часова шкала prompt, інструментів і транскрипту для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Керування моделлю та запуском">
    - `/think <level>` встановлює рівень мислення. Опції надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а користувацькі рівні, як-от `xhigh`, `adaptive`, `max`, або бінарний `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає трасувальний вивід plugin для поточної сесії.
    - `/fast [status|on|off]` показує або встановлює швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає підвищений режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або встановлює типові значення exec.
    - `/model [name|#|status]` показує або встановлює модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через автентифікацію провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, застаріле `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс опціями на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Command queue](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Виявлення та статус">
    - `/help` показує короткий підсумок довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
    - `/status` показує статус виконання/runtime, включно з мітками `Execution`/`Runtime` і використанням/квотою провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для помилок Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте діагностику правилом allow-all. Після схвалення він надсилає звіт, який можна вставити, з локальним шляхом bundle, підсумком manifest, примітками про приватність і релевантними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає релевантний відгук Codex на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори тредів Codex і команди `codex resume <thread-id>`. Див. [Експорт діагностики](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та ремонту Crestodian з DM власника.
    - `/tasks` перелічує активні/недавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує футером використання для кожної відповіді або друкує локальний підсумок вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` розв’язує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками під-агентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP і параметрами runtime.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` показує агентів, прив’язаних до гілки, для поточного сеансу.
    - `/kill <id|#|all>` перериває одного або всіх запущених під-агентів.
    - `/steer <id|#> <message>` надсилає керування запущеному під-агенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан плагінів. `/plugin` є псевдонімом. Запис лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує runtime-перевизначеннями конфігурації. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, якщо ввімкнено. За замовчуванням: увімкнено; установіть `commands.restart: false`, щоб вимкнути це.
    - `/send on|off|inherit` установлює політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` установлює режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списків дозволів `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди докування

Команди докування перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Див. [Докування каналів](/uk/concepts/channel-docking), щоб налаштувати,
переглянути приклади й усунути несправності.

Команди докування генеруються з плагінів каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди докування з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному співрозмовнику каналу.

Команди докування потребують `session.identityLinks`. Відправник-джерело й цільовий співрозмовник мають бути в одній групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправника не пов’язано зі співрозмовником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Докування змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволів каналу й не переносить історію стенограми до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду докування, щоб знову перемкнути маршрут.

### Команди вбудованих плагінів

Вбудовані плагіни можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає пресети rich card LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим harness app-server Codex. Див. [Harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, доступні для виклику користувачем, також відкриваються як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли skill/plugin їх реєструє.
- реєстрація нативних команд Skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, які підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст розглядається як тіло повідомлення.
    - Для повного розподілу використання за провайдерами використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатокористувацьких каналах `/allowlist --account <id>` із ціллю конфігурації та `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб вимкнути це.
    - `/plugins install <spec>` приймає ті самі специфікації плагінів, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, бо вихідні модулі плагіна змінилися.
    - `/plugins enable|disable` оновлює конфігурацію плагінів і запускає перезавантаження плагінів Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує guild і вибраного voice/stage-каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки гілок Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок гілок (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і runtime-поведінка: [Агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` призначено для налагодження й додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, якими володіє плагін, і залишає звичайний докладний шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте параметр `inherit` в UI Sessions, щоб очистити його й повернутися до стандартних значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних кінцевих точках Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли це доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє міркування, вивід інструментів або діагностику плагінів, які ви не планували показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент простоює, наступний запуск одразу її використовує.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускається в нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від rescue mode каналу повідомлень і не надає віддалених прав на конфігурацію.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Швидкий шлях:** повідомлення, що містять лише команди, від відправників зі списку дозволів обробляються негайно (обхід черги + моделі).
    - **Обмеження згадок у групі:** повідомлення, що містять лише команди, від відправників зі списку дозволів обходять вимоги до згадок.
    - **Вбудовані скорочення (лише відправники зі списку дозволів):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються перед тим, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Несанкціоновані повідомлення, що містять лише команди, мовчки ігноруються, а вбудовані токени `/...` розглядаються як звичайний текст.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Команди Skills:** Skills із `user-invocable` відкриваються як slash-команди. Назви нормалізуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає Skills за назвою (корисно, коли обмеження нативних команд не дозволяють команди для кожного skill).
      - За замовчуванням команди Skills пересилаються до моделі як звичайний запит.
      - Skills можуть необов’язково оголосити `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (плагін OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автозаповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент. Динамічні варіанти розв’язуються відносно моделі цільового сеансу, тому специфічні для моделі параметри, як-от рівні `/think`, наслідують перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на runtime-запитання, а не на запитання конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, відкривають той самий перемикач режиму `compact|verbose`.
- Результати мають область дії сеансу, тому зміна агента, каналу, гілки, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час runtime, зокрема основні інструменти, підключені інструменти плагінів та інструменти, якими володіє канал.

Для редагування профілів і перевизначень використовуйте панель Tools у Control UI або поверхні config/catalog замість того, щоб сприймати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") відображається в `/status` для поточного провайдера моделей, коли відстеження використання ввімкнене. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису чат-моделі разом із міткою плану з тегом моделі.
- **Рядки токенів/кешу** у `/status` можуть повертатися до останнього запису використання з транскрипту, коли знімок живої сесії розріджений. Наявні ненульові живі значення все ще мають пріоритет, а fallback із транскрипту також може відновити мітку активної runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Виконання vs runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість за відповідь** керуються `/usage off|tokens|full` (додається до звичайних відповідей).
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

- `/model` і `/model list` показують компактний нумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із dropdown-полями провайдера й моделі та кроком Submit.
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, включно з налаштованим endpoint провайдера (`baseUrl`) і API-режимом (`api`), коли вони доступні.

## Debug-перевизначення

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

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

`/trace` дає змогу перемикати **рядки трасування/debug плагіна в межах сесії** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сесії.
- `/trace on` вмикає рядки трасування плагіна для поточної сесії.
- `/trace off` знову вимикає їх.
- Рядки трасування плагіна можуть з’являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний verbose-вивід інструментів/status і далі належить до `/verbose`.

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
Конфігурація перевіряється перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються між перезапусками.
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
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери вирішують, які транспорти фактично виконувані.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені плагіни й перемикати ввімкнення в конфігурації. Read-only потоки можуть використовувати `/plugin` як alias. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують справжнє виявлення плагінів у поточному workspace разом із конфігурацією на диску.
- `/plugins install` встановлює з ClawHub, npm, git, локальних каталогів і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію плагіна; це не встановлює й не видаляє плагіни.
- Зміни ввімкнення й вимкнення hot-reload runtime-поверхні плагінів Gateway для нових ходів агента; встановлення запитує перезапуск Gateway, бо змінилися source-модулі плагіна.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії на поверхню">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (цілиться в чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** цілиться в активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і далі підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну Slack slash command для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ephemeral кнопки Block Kit.

    Виняток для нативних Slack-команд: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні питання BTW

`/btw` — це швидке **побічне питання** щодо поточної сесії. `/side` є alias.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипту,
- воно доставляється як live побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Див. [Побічні питання BTW](/uk/tools/btw), щоб отримати повну поведінку й деталі UX клієнта.

## Пов’язане

- [Створення Skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
