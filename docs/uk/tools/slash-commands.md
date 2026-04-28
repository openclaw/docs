---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-04-28T11:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e799ffb979cb405ee29e606ac914684595ddb59d7f878fab741c7dda90401a4c
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Хостова команда bash-чату використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмова або гілка прив’язана до ACP-сесії, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними щоразу, коли обробку команд увімкнено для цієї поверхні.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії й відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація походить зі списків дозволених каналів/спарювання плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

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
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash commands); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash command для кожного skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску команд оболонки хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед переходом у фоновий режим (`0` переводить у фон негайно).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/стан Plugin, а також елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструмента перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для командних/інструментальних поверхонь лише для власника. Окремо від `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: вимагає **ідентичність власника** для виконання команд лише для власника на цій поверхні. Коли `true`, відправник має або відповідати розв’язаному кандидату власника (наприклад, запису в `commands.ownerAllowFrom` або нативним для провайдера метаданим власника), або мати внутрішню область дії `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/нерозв’язаний список кандидатів власника **не** є достатнім — команди лише для власника на цьому каналі відмовляють за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власників відображаються в системному промпті.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдером. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених каналів/спарювання та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди ядра походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди докування походять із `src/auto-reply/commands-registry.data.ts`
- команди Plugin походять із викликів Plugin `registerCommand()`
- фактична доступність на вашому gateway усе ще залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані команди ядра

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - `/reset soft [message]` зберігає поточну стенограму, відкидає повторно використані ідентифікатори сесій бекенда CLI та повторно запускає завантаження стартового/системного промпта на місці.
    - `/compact [instructions]` ущільнює контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив'язки потоку.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` експортує JSONL [пакет траєкторії](/uk/tools/trajectory) для поточної сесії. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Модель і керування запуском">
    - `/think <level>` задає рівень мислення. Параметри беруться з профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а користувацькі рівні, як-от `xhigh`, `adaptive`, `max`, або двійковий `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість міркування. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає підвищений режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові параметри exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами на кшталт `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Виявлення та стан">
    - `/help` показує коротку довідку.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
    - `/status` показує стан виконання/середовища виконання, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, якщо доступно.
    - `/crestodian <request>` запускає помічник налаштування та ремонту Crestodian з DM власника.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або друкує локальний підсумок вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволів, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволів. Лише текст.
    - `/approve <id> <decision>` вирішує запити схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і параметрами середовища виконання.
    - `/focus <target>` прив'язує поточний потік Discord або тему/розмову Telegram до цілі сесії.
    - `/unfocus` видаляє поточну прив'язку.
    - `/agents` перелічує агентів, прив'язаних до потоку, для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/steer <id|#> <message>` надсилає керування запущеному субагенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує керовану OpenClaw конфігурацію MCP-сервера в `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Запис лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише на час виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли увімкнено. Типово: увімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списки дозволів `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди докування

Команди докування перемикають маршрут відповіді поточної сесії на інший зв'язаний
канал. Див. [Докування каналів](/uk/concepts/channel-docking) щодо налаштування,
прикладів і усунення несправностей.

Команди dock генеруються з каналів plugins із підтримкою native-command. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди dock із прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший прив’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному співрозмовнику каналу.

Команди dock потребують `session.identityLinks`. Початковий відправник і цільовий співрозмовник мають бути в тій самій групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправника не прив’язано до співрозмовника Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Docking змінює лише активний маршрут сеансу. Він не створює облікові записи каналів, не надає доступ, не обходить allowlists каналів і не переносить історію стенограми до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду dock, щоб знову перемкнути маршрут.

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує процесом сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди phone node.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає пресети насичених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє і керує вбудованим harness сервера застосунку Codex. Див. [Harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- нативна реєстрація команд Skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Нотатки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст вважається тілом повідомлення.
    - Для повного розподілу використання провайдера використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатооблікових каналах орієнтовані на конфігурацію `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб вимкнути його.
    - `/plugins install <spec>` приймає ті самі специфікації Plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію Plugin і може запропонувати перезапуск.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує guild і вибраного голосового/stage каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки потоків Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок потоків (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка під час виконання: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
    - `/trace` вужчий за `/verbose`: він розкриває лише trace/debug-рядки, що належать plugin, і не вмикає звичайний verbose-шум інструментів.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в UI Sessions, щоб очистити його та повернутися до стандартних значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex відображають його в `service_tier=priority` на нативних endpoints Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, відображають його в `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки помилок інструментів усе ще показуються, коли доречно, але докладний текст помилки включається лише тоді, коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin, яку ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент неактивний, наступний запуск одразу її використовує.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускається з новою моделлю лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від rescue mode каналу повідомлень і не надає віддалених повноважень на зміну конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях і inline-скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників з allowlist обробляються негайно (обхід черги + моделі).
    - **Обмеження згадками в групах:** повідомлення лише з командами від відправників з allowlist обходять вимоги до згадки.
    - **Inline-скорочення (лише відправники з allowlist):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує оброблятися звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами тихо ігноруються, а inline-токени `/...` трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** skills `user-invocable` доступні як slash-команди. Назви санітизуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дають створити окремі команди для кожної skill).
      - За замовчуванням команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголосити `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних опцій (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти визначаються відносно цільової моделі сеансу, тому специфічні для моделі опції, як-от рівні `/think`, враховують перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання про середовище виконання, а не про конфігурацію: **що цей агент може використовувати просто зараз у цій розмові**.

- Стандартний `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сеансу, тому зміна агента, каналу, потоку, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час виконання, зокрема основні інструменти, підключені інструменти plugin і інструменти, що належать каналу.

Для редагування профілю та перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу, замість того щоб трактувати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax поля відсотка лише залишку інвертуються перед показом, а відповіді `model_remains` віддають перевагу запису chat-model плюс позначці плану з тегом моделі.
- **Рядки token/cache** у `/status` можуть повертатися до останнього запису використання стенограми, коли live-знімок сеансу розріджений. Наявні ненульові live-значення все одно мають пріоритет, а резервне використання стенограми також може відновити активну мітку runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Execution vs runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично виконує сеанс: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість для кожної відповіді** керуються `/usage off|tokens|full` (додається до звичайних відповідей).
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

Нотатки:

- `/model` і `/model list` показують компактний нумерований picker (родина моделі + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний picker з dropdown провайдера й моделі плюс крок Submit.
- `/model <#>` вибирає з цього picker (і за можливості віддає перевагу поточному провайдеру).
- `/model status` показує докладний вигляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли доступно.

## Перевизначення debug

`/debug` дає змогу встановлювати **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення застосовуються негайно до нових читань конфігурації, але **не** записуються в `openclaw.json`. Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід trace plugin

`/trace` дає змогу перемикати **прив’язані до сеансу trace/debug-рядки plugin** без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Нотатки:

- `/trace` без аргументів показує поточний стан trace сеансу.
- `/trace on` вмикає trace-рядки plugin для поточного сеансу.
- `/trace off` знову вимикає їх.
- Trace-рядки plugin можуть з’являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний verbose-вивід інструментів/статусу все ще належить до `/verbose`.

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
Конфігурація перевіряється перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються після перезапусків.
</Note>

## Оновлення MCP

`/mcp` записує визначення MCP-серверів, керовані OpenClaw, у `mcp.servers`. Лише для власників. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери визначають, які транспорти фактично можна виконувати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати знайдені plugins і перемикати їх увімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення plugin для поточної робочої області плюс конфігурацію на диску.
- `/plugins enable|disable` оновлює лише конфігурацію plugin; це не встановлює й не видаляє plugins.
- Після змін увімкнення/вимкнення перезапустіть Gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії для кожної поверхні">
    - **Текстові команди** виконуються у звичайній сесії чату (DM використовують спільну `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовує до сесії чату через `CommandTargetSessionKey`)
    - **`/stop`** спрямовується до активної сесії чату, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і надалі підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити по одній slash-команді Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack надсилаються як ephemeral кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (а не `/status`), оскільки Slack резервує `/status`. Текстова `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Додаткові запитання BTW

`/btw` — це швидке **додаткове запитання** про поточну сесію.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипту,
- воно доставляється як живий побічний результат, а не як звичайне повідомлення асистента.

Завдяки цьому `/btw` корисна, коли потрібне тимчасове уточнення, поки основне завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Додаткові запитання BTW](/uk/tools/btw), щоб дізнатися повну поведінку та деталі UX клієнта.

## Пов’язане

- [Створення Skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
