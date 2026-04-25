---
read_when:
    - Використання або налаштування chat-команд
    - Налагодження маршрутизації команд або дозволів
summary: 'Слеш-команди: текстові vs native, config і підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-04-25T00:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01d8c7a30f9a7bf9ea08ec6372bf47feb5d6153859f616cb0531cb910557d17e
    source_path: tools/slash-commands.md
    workflow: 15
---

Команди обробляються Gateway. Більшість команд мають надсилатися як **окреме** повідомлення, що починається з `/`.
Чат-команда bash лише для хоста використовує `! <cmd>` (з псевдонімом `/bash <cmd>`).

Є дві пов’язані системи:

- **Команди**: окремі повідомлення `/...`.
- **Директиви**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Директиви видаляються з повідомлення до того, як модель його побачить.
  - У звичайних чат-повідомленнях (не лише з директивами) вони трактуються як «вбудовані підказки» і **не** зберігають налаштування сесії.
  - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та повертають підтвердження.
  - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується лише цей
    allowlist; інакше авторизація походить із allowlist каналу/пейрингу плюс `commands.useAccessGroups`.
    Для неавторизованих відправників директиви трактуються як звичайний текст.

Є також кілька **вбудованих shortcut** (лише для allowlisted/авторизованих відправників): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Вони запускаються негайно, видаляються до того, як модель побачить повідомлення, а решта тексту проходить звичайний потік.

## Config

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

- `commands.text` (за замовчуванням `true`) вмикає парсинг `/...` у чат-повідомленнях.
  - На поверхнях без native-команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення в `false`.
- `commands.native` (за замовчуванням `"auto"`) реєструє native-команди.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без native-підтримки.
  - Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити значення для окремого провайдера (bool або `"auto"`).
  - `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
- `commands.nativeSkills` (за замовчуванням `"auto"`) реєструє native-команди **skill**, коли це підтримується.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створювати окрему slash-команду для кожного skill).
  - Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити значення для окремого провайдера (bool або `"auto"`).
- `commands.bash` (за замовчуванням `false`) вмикає `! <cmd>` для виконання shell-команд хоста (`/bash <cmd>` — псевдонім; потрібні allowlist `tools.elevated`).
- `commands.bashForegroundMs` (за замовчуванням `2000`) керує тим, скільки часу bash чекає перед переходом у фоновий режим (`0` одразу переводить у фон).
- `commands.config` (за замовчуванням `false`) вмикає `/config` (читання/запис `openclaw.json`).
- `commands.mcp` (за замовчуванням `false`) вмикає `/mcp` (читання/запис конфігурації MCP під керуванням OpenClaw у `mcp.servers`).
- `commands.plugins` (за замовчуванням `false`) вмикає `/plugins` (виявлення/стан plugin плюс керування install + enable/disable).
- `commands.debug` (за замовчуванням `false`) вмикає `/debug` (лише runtime overrides).
- `commands.restart` (за замовчуванням `true`) вмикає `/restart` плюс tool actions перезапуску gateway.
- `commands.ownerAllowFrom` (необов’язково) задає явний allowlist власника для поверхонь команд/tool лише для власника. Це окремо від `commands.allowFrom`.
- Поканальний `channels.<channel>.commands.enforceOwnerForCommands` (необов’язково, за замовчуванням `false`) змушує команди лише для власника вимагати **ідентичність власника** для виконання на цій поверхні. Якщо значення `true`, відправник має або відповідати знайденому кандидату власника (наприклад, запису в `commands.ownerAllowFrom` або native-метаданим власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Wildcard-запис у channel `allowFrom` або порожній/нерозв’язаний список кандидатів власника **не** є достатнім — команди лише для власника для цього каналу завершуються за принципом fail closed. Залишайте це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише `ownerAllowFrom` і стандартними command allowlist.
- `commands.ownerDisplay` керує тим, як id власника з’являються в system prompt: `raw` або `hash`.
- `commands.ownerDisplaySecret` необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (необов’язково) задає allowlist для окремих провайдерів для авторизації команд. Якщо його налаштовано, це
  єдине джерело авторизації для команд і директив (allowlist каналу/пейринг і `commands.useAccessGroups`
  ігноруються). Використовуйте `"*"` для глобального значення за замовчуванням; ключі окремих провайдерів мають пріоритет.
- `commands.useAccessGroups` (за замовчуванням `true`) застосовує allowlist/політики для команд, коли `commands.allowFrom` не задано.

## Список команд

Поточне єдине джерело істини:

- вбудовані команди core надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- команди plugin надходять із викликів `registerCommand()` у plugin
- фактична доступність на вашому gateway усе одно залежить від прапорців config, поверхні каналу та встановлених/увімкнених plugin

### Вбудовані команди core

Доступні сьогодні вбудовані команди:

- `/new [model]` починає нову сесію; `/reset` — це псевдонім скидання.
- `/reset soft [message]` зберігає поточний транскрипт, відкидає повторно використані id сесій бекенда CLI і повторно запускає завантаження startup/system-prompt на місці.
- `/compact [instructions]` ущільнює контекст сесії. Див. [/concepts/compaction](/uk/concepts/compaction).
- `/stop` перериває поточний запуск.
- `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки треда.
- `/think <level>` задає рівень мислення. Варіанти надходять із профілю провайдера активної моделі; типовими рівнями є `off`, `minimal`, `low`, `medium` і `high`, із користувацькими рівнями, як-от `xhigh`, `adaptive`, `max`, або двійковим `on` лише там, де це підтримується. Псевдоніми: `/thinking`, `/t`.
- `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
- `/trace on|off` перемикає вивід trace plugin для поточної сесії.
- `/fast [status|on|off]` показує або задає швидкий режим.
- `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
- `/elevated [on|off|ask|full]` перемикає elevated-режим. Псевдонім: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає значення exec за замовчуванням.
- `/model [name|#|status]` показує або задає модель.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
- `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами, як-от `debounce:2s cap:25 drop:summarize`.
- `/help` показує коротке резюме довідки.
- `/commands` показує згенерований каталог команд.
- `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
- `/status` показує стан виконання/runtime, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, коли доступно.
- `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
- `/context [list|detail|json]` пояснює, як збирається контекст.
- `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
- `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Псевдонім: `/trajectory`.
- `/whoami` показує ваш id відправника. Псевдонім: `/id`.
- `/skill <name> [input]` запускає skill за назвою.
- `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текстова команда.
- `/approve <id> <decision>` розв’язує запити на схвалення exec.
- `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [/tools/btw](/uk/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточної сесії.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і параметрами runtime.
- `/focus <target>` прив’язує поточний тред Discord або topic/conversation Telegram до цілі сесії.
- `/unfocus` видаляє поточну прив’язку.
- `/agents` перелічує агентів, прив’язаних до треда, для поточної сесії.
- `/kill <id|#|all>` перериває один або всі запущені sub-agent.
- `/steer <id|#> <message>` надсилає керування запущеному sub-agent. Псевдонім: `/tell`.
- `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потрібно `commands.config: true`.
- `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера під керуванням OpenClaw у `mcp.servers`. Лише для власника. Потрібно `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` інспектує або змінює стан plugin. `/plugin` — псевдонім. Запис лише для власника. Потрібно `commands.plugins: true`.
- `/debug show|set|unset|reset` керує overrides config лише на runtime. Лише для власника. Потрібно `commands.debug: true`.
- `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або виводить локальне зведення вартості.
- `/tts on|off|status|provider|limit|summary|audio|help` керує TTS. Див. [/tools/tts](/uk/tools/tts).
- `/restart` перезапускає OpenClaw, коли це дозволено. За замовчуванням: увімкнено; установіть `commands.restart: false`, щоб вимкнути.
- `/activation mention|always` задає режим активації групи.
- `/send on|off|inherit` задає політику надсилання. Лише для власника.
- `/bash <command>` запускає shell-команду хоста. Лише текстова команда. Псевдонім: `! <command>`. Потрібно `commands.bash: true` плюс allowlist `tools.elevated`.
- `!poll [sessionId]` перевіряє фонове завдання bash.
- `!stop [sessionId]` зупиняє фонове завдання bash.

### Згенеровані dock-команди

Dock-команди генеруються з channel plugin із підтримкою native-команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

### Команди вбудованих plugin

Вбудовані plugin можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає memory dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком пейрингу/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди phone node.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва native-команди — `/talkvoice`.
- `/card ...` надсилає preset rich card для LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` інспектує і керує вбудованим harness app-server Codex. Див. [Codex Harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди skill

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- Реєстрація native skill-команд керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

Примітки:

- Команди приймають необов’язковий `:` між командою та args (наприклад, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
- Для повної деталізації використання провайдера використовуйте `openclaw status --usage`.
- `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
- У каналах із кількома обліковими записами config-орієнтовані `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
- `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` виводить локальне зведення вартості з журналів сесій OpenClaw.
- `/restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб вимкнути його.
- `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний path/archive, npm package або `clawhub:<pkg>`.
- `/plugins enable|disable` оновлює config plugin і може запросити перезапуск.
- Native-команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (потребує `channels.discord.voice` і native-команд; недоступна як текстова команда).
- Команди прив’язування тредів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні прив’язки тредів були увімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
- Довідник команд ACP і поведінка runtime: [ACP Agents](/uk/tools/acp-agents).
- `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
- `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, що належать plugin, і не вмикає звичайний докладний шум від tool.
- `/fast on|off` зберігає override сесії. Використовуйте параметр `inherit` в інтерфейсі Sessions, щоб очистити його і повернутися до значень config за замовчуванням.
- `/fast` залежить від провайдера: OpenAI/OpenAI Codex відображають його як `service_tier=priority` у native endpoint Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік до `api.anthropic.com`, відображають його як `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
- Підсумки збоїв tool усе ще показуються, коли це доречно, але детальний текст збоїв включається лише тоді, коли `/verbose` має значення `on` або `full`.
- `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід tool або діагностику plugin, яку ви не збиралися показувати. Краще залишати їх вимкненими, особливо в групових чатах.
- `/model` негайно зберігає нову модель сесії.
- Якщо агент неактивний, наступний запуск одразу її використовує.
- Якщо запуск уже активний, OpenClaw позначає live-перемикання як відкладене і перезапускає з новою моделлю лише в чистій точці повторної спроби.
- Якщо активність tool або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до пізнішої можливості повторної спроби або до наступного ходу користувача.
- **Швидкий шлях:** повідомлення лише з командою від allowlisted-відправників обробляються негайно (в обхід черги + моделі).
- **Обмеження згадок у групах:** повідомлення лише з командою від allowlisted-відправників обходять вимоги згадок.
- **Вбудовані shortcut (лише для allowlisted-відправників):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
  - Приклад: `hey /status` викликає відповідь зі статусом, а решта тексту продовжує проходити звичайний потік.
- Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Неавторизовані повідомлення лише з командою тихо ігноруються, а вбудовані токени `/...` трактуються як звичайний текст.
- **Команди skill:** Skills з `user-invocable` доступні як slash-команди. Назви очищаються до `a-z0-9_` (максимум 32 символи); у разі колізій додаються числові суфікси (наприклад, `_2`).
  - `/skill <name> [input]` запускає skill за назвою (це зручно, коли обмеження native-команд не дозволяють мати окремі команди для кожного skill).
  - За замовчуванням команди skill пересилаються моделі як звичайний запит.
  - Skills можуть необов’язково оголосити `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до tool (детерміновано, без моделі).
  - Приклад: `/prose` (plugin OpenProse) — див. [OpenProse](/uk/prose).
- **Args native-команд:** Discord використовує autocomplete для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові args). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте arg.

## `/tools`

`/tools` відповідає на питання runtime, а не config: **що цей агент може використовувати прямо зараз у
цій розмові**.

- `/tools` за замовчуванням компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні native-команд, які підтримують аргументи, мають той самий перемикач режимів `compact|verbose`.
- Результати прив’язані до сесії, тому зміна агента, каналу, треда, авторизації відправника або моделі може
  змінити вивід.
- `/tools` включає tool, які реально доступні в runtime, зокрема core tool, підключені
  tool plugin і tool, що належать каналу.

Для редагування профілів та overrides використовуйте панель Tools у Control UI або поверхні config/catalog, а не
сприймайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: «Claude 80% left») показується в `/status` для поточного провайдера моделі, коли відстеження використання ввімкнене. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише для залишку інвертуються перед показом, а відповіді `model_remains` віддають перевагу запису chat-model плюс мітці плану з тегом моделі.
- **Рядки token/cache** у `/status` можуть повертатися до останнього запису використання в транскрипті, коли live-знімок сесії бідний на дані. Наявні ненульові live-значення все одно мають пріоритет, а fallback до транскрипту також може відновити мітку активної runtime-моделі плюс більше загальне значення, орієнтоване на prompt, коли збережені підсумки відсутні або менші.
- **Execution vs runtime:** `/status` показує `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично виконує сесію: `OpenClaw Pi Default`, `OpenAI Codex`, бекенд CLI або бекенд ACP.
- **Кількість token/вартість на відповідь** контролюється через `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/auth/endpoint**, а не використання.

## Вибір моделі (`/model`)

`/model` реалізовано як директиву.

Приклади:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Примітки:

- `/model` і `/model list` показують компактний нумерований picker (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний picker із випадаючими списками провайдера та моделі плюс кроком Submit.
- `/model <#>` вибирає з цього picker (і, якщо можливо, віддає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

## Debug overrides

`/debug` дає змогу задавати overrides config **лише для runtime** (у пам’яті, не на диску). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Примітки:

- Overrides застосовуються негайно до нових читань config, але **не** записуються в `openclaw.json`.
- Використовуйте `/debug reset`, щоб очистити всі overrides і повернутися до config на диску.

## Вивід trace plugin

`/trace` дає змогу вмикати **trace/debug-рядки plugin у межах сесії** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан trace для сесії.
- `/trace on` вмикає рядки trace plugin для поточної сесії.
- `/trace off` знову їх вимикає.
- Рядки trace plugin можуть з’являтися в `/status` і як діагностичне follow-up повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує overrides config лише для runtime.
- `/trace` не замінює `/verbose`; звичайний докладний вивід tool/status і далі належить `/verbose`.

## Оновлення Config

`/config` записує в config на диску (`openclaw.json`). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.config: true`.

Приклади:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Примітки:

- Перед записом config проходить валідацію; некоректні зміни відхиляються.
- Оновлення `/config` зберігаються після перезапусків.

## Оновлення MCP

`/mcp` записує визначення MCP-серверів під керуванням OpenClaw у `mcp.servers`. Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Примітки:

- `/mcp` зберігає config у config OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi.
- Runtime-адаптери вирішують, які транспорти реально можна виконувати.

## Оновлення Plugin

`/plugins` дозволяє операторам інспектувати виявлені plugin і перемикати стан увімкнення в config. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Примітки:

- `/plugins list` і `/plugins show` використовують реальне виявлення plugin у поточному workspace плюс config на диску.
- `/plugins enable|disable` оновлює лише config plugin; він не встановлює і не видаляє plugin.
- Після змін enable/disable перезапустіть gateway, щоб застосувати їх.

## Примітки щодо поверхонь

- **Текстові команди** працюють у звичайній чат-сесії (DM використовують `main`, групи мають власну сесію).
- **Native-команди** використовують ізольовані сесії:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (націлюється на чат-сесію через `CommandTargetSessionKey`)
- **`/stop`** націлюється на активну чат-сесію, щоб можна було перервати поточний запуск.
- **Slack:** `channels.slack.slashCommand` усе ще підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (з тими самими назвами, що й `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.
  - Виняток native для Slack: реєструйте `/agentstatus` (а не `/status`), оскільки Slack резервує `/status`. Текстова `/status` у повідомленнях Slack усе ще працює.

## BTW side questions

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- виконується як окремий **одноразовий** виклик без tool,
- не змінює майбутній контекст сесії,
- не записується в історію транскрипту,
- доставляється як живий побічний результат, а не як звичайне повідомлення асистента.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основне
завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [BTW Side Questions](/uk/tools/btw) для повного опису поведінки та деталей UX
клієнта.

## Пов’язане

- [Skills](/uk/tools/skills)
- [Skills config](/uk/tools/skills-config)
- [Creating skills](/uk/tools/creating-skills)
