---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-05-03T21:42:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b95b98f84fd26b706cc38d93935be509033e5df30e00b2f581e326e68b256043
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або потік прив’язано до сесії ACP, звичайний текст подальших відповідей маршрутизується до цієї ACP-обв’язки. Команди керування Gateway усе одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними, коли для цієї поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як його побачить модель.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та повертають підтвердження.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, це єдиний список дозволених; інакше авторизація надходить зі списків дозволених/спарювання каналу плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

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
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди й далі працюють, навіть якщо встановити це значення в `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Встановіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). У Discord `false` пропускає реєстрацію та очищення slash-команд під час запуску; раніше зареєстровані команди можуть залишатися видимими, доки ви не видалите їх із застосунку Discord. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає в порівняння узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **Skills** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash-команди для кожної Skills). Встановіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
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
  Вмикає `/plugins` (виявлення/стан plugin плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для поверхонь команд/інструментів лише для власника. Це обліковий запис оператора-людини, який може схвалювати небезпечні дії та виконувати команди на кшталт `/diagnostics`, `/export-trajectory` і `/config`. Він відокремлений від `commands.allowFrom` і від доступу через спарювання DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або відповідати розв’язаному кандидату-власнику (наприклад, запису в `commands.ownerAllowFrom` або нативним метаданим власника провайдера), або мати внутрішню область `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/нерозв’язаний список кандидатів-власників **не** є достатнім — команди лише для власника на цьому каналі закриваються за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власників з’являються в системному промпті.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає секрет HMAC, що використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдерами. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених/спарювання каналів і `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального типового значення; ключі конкретних провайдерів перевизначають його.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди ядра надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- команди plugin надходять із викликів plugin `registerCommand()`
- фактична доступність на вашому gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugin

### Вбудовані команди ядра

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - Control UI перехоплює введене `/new`, щоб створити й перемкнутися на свіжу сесію dashboard; введене `/reset` і далі виконує скидання Gateway на місці.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ідентифікатори сесій backend CLI і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням терміну дії прив’язки потоку.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [пакет траєкторії](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли потрібна хронологія prompt, інструментів і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Модель і керування запуском">
    - `/think <level>` задає рівень thinking. Варіанти надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, із власними рівнями на кшталт `xhigh`, `adaptive`, `max` або бінарним `on` лише там, де підтримується. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід trace plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated-режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через auth провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний catalog цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс параметри на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Черга команд](/uk/concepts/queue) і [Steering-черга](/uk/concepts/queue-steering).
    - `/steer <message>` вводить guidance в активний запуск для поточної сесії, незалежно від режиму `/queue`. Вона не запускає новий запуск, коли сесія idle. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Виявлення та стан">
    - `/help` показує короткий підсумок довідки.
    - `/commands` показує згенерований catalog команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати саме зараз.
    - `/status` показує стан виконання/середовища виконання, включно з мітками `Execution`/`Runtime` і використанням/квотою провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для помилок Gateway і запусків обв’язки Codex. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте diagnostics правилом allow-all. Після схвалення він надсилає звіт, який можна вставити, з локальним шляхом bundle, підсумком manifest, примітками щодо приватності та відповідними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує обв’язку OpenAI Codex, те саме схвалення також надсилає релевантний відгук Codex на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори потоків Codex і команди `codex resume <thread-id>`. Див. [Експорт diagnostics](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування й ремонту Crestodian з DM власника.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш sender id. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує footer використання для кожної відповіді або друкує локальний підсумок cost.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає Skills за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` вирішує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP і параметрами середовища виконання.
    - `/focus <target>` прив’язує поточний потік Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` виводить агентів, прив’язаних до потоку, для поточного сеансу.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/subagents steer <id|#> <message>` надсилає керування запущеному субагенту.

  </Accordion>
  <Accordion title="Запис лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потрібно `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію сервера MCP, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потрібно `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Запис лише для власника. Потрібно `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потрібно `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потрібно `commands.bash: true` плюс allowlists `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди закріплення

Команди закріплення перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Див. [Закріплення каналів](/uk/concepts/channel-docking) для налаштування,
прикладів і усунення несправностей.

Команди закріплення генеруються з plugin каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди закріплення з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному учаснику каналу.

Команди закріплення потребують `session.identityLinks`. Відправник-джерело та цільовий учасник мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправника не пов’язано з учасником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Закріплення змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить allowlists каналів і не переносить історію транскрипту до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду закріплення, щоб знову перемкнути маршрут.

### Команди вбудованих plugin

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає пресети насичених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє та керує вбудованим app-server harness Codex. Див. [Harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли skill/plugin їх реєструє.
- реєстрація нативних команд skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, які підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
    - Для повного розподілу використання провайдера застосовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатооблікових каналах `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, оскільки вихідні модулі plugin змінилися.
    - `/plugins enable|disable` оновлює конфігурацію plugin і запускає перезавантаження plugin Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналів">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує guild і вибраного voice/stage channel. Потрібні `channels.discord.voice` і нативні команди.
    - Команди прив’язки потоків Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок потоків (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [Агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
    - `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать plugin, і залишає звичайний verbose-шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в UI Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних Responses endpoints, тоді як прямі публічні запити Anthropic, зокрема трафік, автентифікований через OAuth і надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли це доречно, але детальний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішні міркування, вивід інструментів або діагностику plugin, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент простоює, наступний запуск використовує її відразу.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускає нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналу повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників з allowlist обробляються негайно (обхід черги + моделі).
    - **Фільтрація згадок у групах:** повідомлення лише з командами від відправників з allowlist обходять вимоги щодо згадок.
    - **Вбудовані скорочення (лише відправники з allowlist):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує звичайний потік.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Несанкціоновані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** skills `user-invocable` доступні як slash-команди. Назви санітизуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дозволяють окремі команди для кожного skill).
      - Типово команди skills пересилаються до моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (plugin OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних опцій (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти обчислюються відносно цільової моделі сеансу, тому специфічні для моделі опції, як-от рівні `/think`, дотримуються перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання про середовище виконання, а не про конфігурацію: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сеансу, тому зміна агента, каналу, потоку, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час виконання, зокрема основні інструменти, підключені інструменти plugin та інструменти, що належать каналу.

Для редагування профілів і перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу, а не сприймайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") відображається в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису чат-моделі плюс позначці плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть відступати до останнього запису використання з транскрипта, коли live-знімок сесії неповний. Наявні ненульові live-значення все одно мають пріоритет, а відступ до транскрипта також може відновити мітку активної runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху пісочниці та `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI-бекенд або ACP-бекенд.
- **Токени/вартість на відповідь** керуються `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/автентифікації/ендпоїнтів**, а не використання.

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
- У Discord `/model` і `/models` відкривають інтерактивний вибір зі спадними списками провайдера й моделі плюс кроком «Надіслати».
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, зокрема налаштований ендпоїнт провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

## Перевизначення для налагодження

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у памʼяті, не на диску). Тільки для власника. Вимкнено за замовчуванням; увімкніть через `commands.debug: true`.

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

`/trace` дає змогу перемикати **привʼязані до сесії рядки трасування/налагодження plugin** без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сесії.
- `/trace on` вмикає рядки трасування plugin для поточної сесії.
- `/trace off` знову вимикає їх.
- Рядки трасування plugin можуть зʼявлятися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/стану все ще належить до `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Тільки для власника. Вимкнено за замовчуванням; увімкніть через `commands.config: true`.

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

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Тільки для власника. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

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
- `/plugins list` і `/plugins show` використовують справжнє виявлення plugin для поточного робочого простору плюс конфігурацію на диску.
- `/plugins install` встановлює з ClawHub, npm, git, локальних каталогів і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію plugin; це не встановлює й не видаляє plugins.
- Зміни ввімкнення та вимкнення гаряче перезавантажують runtime-поверхні plugin Gateway для нових ходів агента; встановлення запитує перезапуск Gateway, бо вихідні модулі plugin змінилися.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії на поверхню">
    - **Текстові команди** виконуються у звичайній чат-сесії (приватні повідомлення спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (цілить у чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** цілить в активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` усе ще підтримується для однієї команди стилю `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити по одній slash-команді Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Нативний виняток Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточну сесію. `/side` є псевдонімом.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипта,
- воно доставляється як live-побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повну поведінку та деталі UX клієнта.

## Повʼязане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
