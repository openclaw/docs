---
read_when:
    - Використання або налаштування chat-команд
    - Налагодження маршрутизації команд або дозволів
summary: 'Slash-команди: текстові vs native, конфігурація та підтримувані команди'
title: Slash-команди
x-i18n:
    generated_at: "2026-04-23T21:17:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d525afb81228192c75e44c30bc3229aa7f27cb3ecea7e28ac21ae8168890d82
    source_path: tools/slash-commands.md
    workflow: 15
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`.
Команда bash лише для host використовує `! <cmd>` (з alias-ом `/bash <cmd>`).

Є дві пов’язані системи:

- **Commands**: окремі повідомлення `/...`.
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directives видаляються з повідомлення до того, як його побачить модель.
  - У звичайних повідомленнях чату (не лише з directives) вони трактуються як «inline hints» і **не** зберігають налаштування сесії.
  - У повідомленнях лише з directives (повідомлення містить лише directives) вони зберігаються в сесії та відповідають підтвердженням.
  - Directives застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, це єдиний
    allowlist, що використовується; інакше авторизація походить із allowlist-ів/pairing каналу плюс `commands.useAccessGroups`.
    Для неавторизованих відправників directives трактуються як звичайний текст.

Також є кілька **inline shortcuts** (лише для allowlisted/authorized senders): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Вони виконуються негайно, видаляються до того, як повідомлення побачить модель, а решта тексту продовжує оброблятися у звичайному потоці.

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

- `commands.text` (за замовчуванням `true`) вмикає розбір `/...` у повідомленнях чату.
  - На поверхнях без native commands (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо ви встановите це в `false`.
- `commands.native` (за замовчуванням `"auto"`) реєструє native-команди.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для provider-ів без native-підтримки.
  - Задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для конкретного provider-а (bool або `"auto"`).
  - `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і автоматично не видаляються.
- `commands.nativeSkills` (за замовчуванням `"auto"`) реєструє native-команди **Skills**, коли це підтримується.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створювати slash-команду для кожного Skill-а).
  - Задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для конкретного provider-а (bool або `"auto"`).
- `commands.bash` (за замовчуванням `false`) вмикає `! <cmd>` для запуску shell-команд на host (`/bash <cmd>` — alias; потребує allowlist-ів `tools.elevated`).
- `commands.bashForegroundMs` (за замовчуванням `2000`) керує тим, скільки часу bash чекає перед переходом у background mode (`0` — одразу у background).
- `commands.config` (за замовчуванням `false`) вмикає `/config` (читання/запис `openclaw.json`).
- `commands.mcp` (за замовчуванням `false`) вмикає `/mcp` (читання/запис OpenClaw-managed MCP config у `mcp.servers`).
- `commands.plugins` (за замовчуванням `false`) вмикає `/plugins` (виявлення/статус Plugin-ів плюс керування install + enable/disable).
- `commands.debug` (за замовчуванням `false`) вмикає `/debug` (перевизначення лише для runtime).
- `commands.restart` (за замовчуванням `true`) вмикає `/restart` плюс дії tool-а перезапуску gateway.
- `commands.ownerAllowFrom` (необов’язково) задає явний owner allowlist для поверхонь команд/tool-ів лише для owner. Це окремо від `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` для конкретного каналу (необов’язково, за замовчуванням `false`) змушує owner-only команди вимагати **owner identity** на цій поверхні. Коли значення `true`, відправник має або відповідати розв’язаному кандидату owner-а (наприклад, запису в `commands.ownerAllowFrom` або native metadata owner-а provider-а), або мати внутрішній scope `operator.admin` на внутрішньому каналі повідомлень. Wildcard-запис у channel `allowFrom` або порожній/нерозв’язаний список кандидатів owner-а **не** є достатнім — owner-only команди завершуються fail-closed на цьому каналі. Залишайте це вимкненим, якщо хочете, щоб owner-only команди обмежувалися лише через `ownerAllowFrom` і стандартні allowlist-и команд.
- `commands.ownerDisplay` керує тим, як ID owner-а з’являються в system prompt: `raw` або `hash`.
- `commands.ownerDisplaySecret` необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (необов’язково) задає allowlist для авторизації команд для кожного provider-а. Якщо налаштовано, це
  єдине джерело авторизації для команд і directives (`commands.useAccessGroups`
  ігнорують allowlist-и/pairing каналу). Використовуйте `"*"` для глобального значення за замовчуванням; ключі конкретних provider-ів мають пріоритет.
- `commands.useAccessGroups` (за замовчуванням `true`) застосовує allowlist-и/policies для команд, коли `commands.allowFrom` не задано.

## Список команд

Поточне джерело істини:

- core built-ins походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди походять із `src/auto-reply/commands-registry.data.ts`
- команди Plugin-ів походять із викликів `registerCommand()` у Plugin-ах
- фактична доступність на вашому gateway усе одно залежить від прапорців config, поверхні каналу та встановлених/увімкнених Plugin-ів

### Core built-in команди

Вбудовані команди, доступні зараз:

- `/new [model]` запускає нову сесію; `/reset` — це alias reset.
- `/reset soft [message]` зберігає поточний transcript, скидає reused session id backend-а CLI і повторно запускає завантаження startup/system-prompt на місці.
- `/compact [instructions]` виконує Compaction контексту сесії. Див. [/concepts/compaction](/uk/concepts/compaction).
- `/stop` перериває поточний run.
- `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії thread-binding.
- `/think <level>` задає рівень thinking. Варіанти походять із профілю provider-а активної моделі; поширені рівні — `off`, `minimal`, `low`, `medium` і `high`, а власні рівні, такі як `xhigh`, `adaptive`, `max` або бінарне `on`, доступні лише там, де підтримуються. Alias-и: `/thinking`, `/t`.
- `/verbose on|off|full` перемикає verbose output. Alias: `/v`.
- `/trace on|off` перемикає trace output Plugin-ів для поточної сесії.
- `/fast [status|on|off]` показує або задає fast mode.
- `/reasoning [on|off|stream]` перемикає видимість reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` перемикає elevated mode. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
- `/model [name|#|status]` показує або задає модель.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` показує provider-и або моделі для provider-а.
- `/queue <mode>` керує поведінкою queue (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметри на кшталт `debounce:2s cap:25 drop:summarize`.
- `/help` показує коротке зведення довідки.
- `/commands` показує згенерований каталог команд.
- `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
- `/status` показує runtime status, зокрема позначки `Runtime`/`Runner` і використання/quota provider-а, коли вони доступні.
- `/tasks` показує активні/нещодавні фонові завдання для поточної сесії.
- `/context [list|detail|json]` пояснює, як збирається контекст.
- `/export-session [path]` експортує поточну сесію в HTML. Alias: `/export`.
- `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Alias: `/trajectory`.
- `/whoami` показує ваш ID відправника. Alias: `/id`.
- `/skill <name> [input]` запускає Skill за назвою.
- `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текстова команда.
- `/approve <id> <decision>` обробляє prompt-и approval exec.
- `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [/tools/btw](/uk/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent-ів для поточної сесії.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує ACP session-ами та параметрами runtime.
- `/focus <target>` прив’язує поточний Discord thread або Telegram topic/conversation до цілі сесії.
- `/unfocus` прибирає поточну прив’язку.
- `/agents` показує агентів, прив’язаних до thread, для поточної сесії.
- `/kill <id|#|all>` перериває одного або всіх запущених sub-agent-ів.
- `/steer <id|#> <message>` надсилає steering запущеному subagent-у. Alias: `/tell`.
- `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для owner. Потребує `commands.config: true`.
- `/mcp show|get|set|unset` читає або записує OpenClaw-managed MCP server config у `mcp.servers`. Лише для owner. Потребує `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан Plugin-ів. `/plugin` — це alias. Для запису — лише для owner. Потребує `commands.plugins: true`.
- `/debug show|set|unset|reset` керує перевизначеннями config лише для runtime. Лише для owner. Потребує `commands.debug: true`.
- `/usage off|tokens|full|cost` керує footer usage для кожної відповіді або виводить локальне зведення вартості.
- `/tts on|off|status|provider|limit|summary|audio|help` керує TTS. Див. [/tools/tts](/uk/tools/tts).
- `/restart` перезапускає OpenClaw, коли це увімкнено. За замовчуванням: увімкнено; задайте `commands.restart: false`, щоб вимкнути.
- `/activation mention|always` задає режим активації групи.
- `/send on|off|inherit` задає policy надсилання. Лише для owner.
- `/bash <command>` запускає shell-команду на host. Лише текстова команда. Alias: `! <command>`. Потребує `commands.bash: true` плюс allowlist-и `tools.elevated`.
- `!poll [sessionId]` перевіряє background bash-job.
- `!stop [sessionId]` зупиняє background bash-job.

### Згенеровані dock-команди

Dock-команди генеруються з Plugin-ів channel-ів із підтримкою native-команд. Поточний bundled-набір:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Команди bundled Plugin-ів

Bundled Plugin-и можуть додавати більше slash-команд. Поточні bundled-команди в цьому repo:

- `/dreaming [on|off|status|help]` перемикає memory Dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком pairing/setup пристроїв. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди phone node.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord native-назва команди — `/talkvoice`.
- `/card ...` надсилає preset-и rich card для LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє та керує bundled harness Codex app-server. Див. [Codex Harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також надаються як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли Skill/Plugin реєструє їх.
- Реєстрація native-команд Skills керується через `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

Примітки:

- Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` приймає alias моделі, `provider/model` або назву provider-а (fuzzy match); якщо збігу немає, текст трактується як тіло повідомлення.
- Для повного розподілу використання provider-а використовуйте `openclaw status --usage`.
- `/allowlist add|remove` потребує `commands.config=true` і враховує channel `configWrites`.
- У каналах із кількома акаунтами `/allowlist --account <id>` для цільового config і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового акаунта.
- `/usage` керує footer usage для кожної відповіді; `/usage cost` виводить локальне зведення вартості з журналів сесії OpenClaw.
- `/restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб вимкнути його.
- `/plugins install <spec>` приймає ті самі специфікації Plugin-ів, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
- `/plugins enable|disable` оновлює config Plugin-ів і може запропонувати перезапуск.
- Native-команда лише для Discord: `/vc join|leave|status` керує voice-каналами (потребує `channels.discord.voice` і native-команд; недоступна як текстова).
- Команди прив’язки thread-ів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні thread bindings були увімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
- Довідник команд ACP і поведінка runtime: [ACP Agents](/uk/tools/acp-agents).
- `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
- `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, що належать Plugin-ам, і не вмикає звичайний verbose chatter від tool-ів.
- `/fast on|off` зберігає перевизначення для сесії. Використовуйте опцію `inherit` в UI Sessions, щоб очистити його й повернутися до типових значень config.
- `/fast` є provider-specific: OpenAI/OpenAI Codex відображають його в `service_tier=priority` на native Responses endpoints, тоді як прямі публічні запити Anthropic, включно з OAuth-authenticated traffic, надісланим до `api.anthropic.com`, відображають його в `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
- Зведення помилок tool-ів усе ще показуються, коли це доречно, але докладний текст помилки включається лише тоді, коли `/verbose` має значення `on` або `full`.
- `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, output tool-ів або діагностику Plugin-ів, яку ви не планували показувати. Краще залишати їх вимкненими, особливо в групових чатах.
- `/model` одразу зберігає нову модель сесії.
- Якщо агент неактивний, наступний run використає її відразу.
- Якщо run уже активний, OpenClaw позначає live switch як pending і перезапускається в нову модель лише в чистій точці retry.
- Якщо активність tool-ів або output відповіді вже почалися, pending switch може залишатися в черзі до пізнішої можливості retry або наступного ходу користувача.
- **Швидкий шлях:** повідомлення лише з командами від allowlisted senders обробляються негайно (в обхід queue + моделі).
- **Group mention gating:** повідомлення лише з командами від allowlisted senders обходять вимоги до mention.
- **Inline shortcuts (лише для allowlisted senders):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
  - Приклад: `hey /status` викликає відповідь зі status, а решта тексту продовжує оброблятися у звичайному потоці.
- Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Неавторизовані повідомлення лише з командами мовчки ігноруються, а inline-токени `/...` трактуються як звичайний текст.
- **Skill-команди:** Skills із `user-invocable` надаються як slash-команди. Назви санітизуються до `a-z0-9_` (максимум 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
  - `/skill <name> [input]` запускає Skill за назвою (це корисно, коли обмеження native-команд не дозволяють мати окремі команди для кожного Skill-а).
  - За замовчуванням Skill-команди пересилаються моделі як звичайний запит.
  - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб спрямовувати команду безпосередньо до tool-а (детерміновано, без моделі).
  - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
- **Аргументи native-команд:** Discord використовує autocomplete для динамічних параметрів (і button menu, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують button menu, коли команда підтримує варіанти, а ви пропускаєте аргумент.

## `/tools`

`/tools` відповідає на запитання runtime, а не config: **що цей агент може використовувати прямо зараз у
цій розмові**.

- Типовий `/tools` є компактним і оптимізованим для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- На поверхнях native-команд, які підтримують аргументи, доступний той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сесії, тому зміна агента, каналу, thread, авторизації відправника або моделі може
  змінити вивід.
- `/tools` включає tools, які справді доступні в runtime, зокрема core tools, підключені
  Plugin tools і tools, що належать каналу.

Для редагування profile і override використовуйте панель Tools у Control UI або поверхні config/catalog замість
того, щоб сприймати `/tools` як статичний каталог.

## Поверхні usage (що де показується)

- **Provider usage/quota** (наприклад: “Claude 80% left”) показується в `/status` для поточного provider-а моделі, коли відстеження usage увімкнене. OpenClaw нормалізує вікна provider-ів до `% left`; для MiniMax поля percent лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису chat-model plus label плану з тегом моделі.
- **Рядки token/cache** у `/status` можуть використовувати fallback до останнього запису usage transcript-а, коли live snapshot сесії бідний на дані. Наявні ненульові live-значення все одно мають пріоритет, а fallback до transcript-а також може відновити label активної runtime-моделі плюс більший total, орієнтований на prompt, коли збережені total відсутні або менші.
- **Runtime vs runner:** `/status` показує `Runtime` для ефективного шляху виконання та стану sandbox, а `Runner` — для того, хто фактично виконує сесію: вбудований Pi, provider на базі CLI або harness/backend ACP.
- **Token-и/вартість для кожної відповіді** контролюються через `/usage off|tokens|full` (додаються до звичайних відповідей).
- `/model status` стосується **моделей/auth/endpoints**, а не usage.

## Вибір моделі (`/model`)

`/model` реалізовано як directive.

Приклади:

```
/model
/model list
/model 3
/model openai/gpt-5.5
/model opus@anthropic:default
/model status
```

Примітки:

- `/model` і `/model list` показують компактний нумерований picker (сімейство моделі + доступні provider-и).
- У Discord `/model` і `/models` відкривають інтерактивний picker із випадаючими списками provider-а й моделі та кроком Submit.
- `/model <#>` вибирає зі цього picker-а (і за можливості надає перевагу поточному provider-у).
- `/model status` показує докладний вигляд, зокрема налаштований endpoint provider-а (`baseUrl`) і режим API (`api`), коли вони доступні.

## Перевизначення debug

`/debug` дає змогу задавати **перевизначення config лише для runtime** (пам’ять, не диск). Лише для owner. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Примітки:

- Перевизначення застосовуються одразу до нових читань config, але **не** записуються в `openclaw.json`.
- Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до config на диску.

## Trace output Plugin-ів

`/trace` дає змогу перемикати **trace/debug-рядки Plugin-ів у межах сесії** без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан trace для сесії.
- `/trace on` вмикає trace-рядки Plugin-ів для поточної сесії.
- `/trace off` знову їх вимикає.
- Trace-рядки Plugin-ів можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` усе ще керує перевизначеннями config лише для runtime.
- `/trace` не замінює `/verbose`; звичайний verbose output tool-ів/status усе ще належить до `/verbose`.

## Оновлення config

`/config` записує зміни у ваш config на диску (`openclaw.json`). Лише для owner. За замовчуванням вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Примітки:

- Перед записом config проходить валідацію; невалідні зміни відхиляються.
- Оновлення `/config` зберігаються після перезапусків.

## Оновлення MCP

`/mcp` записує OpenClaw-managed визначення MCP server-ів у `mcp.servers`. Лише для owner. За замовчуванням вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Примітки:

- `/mcp` зберігає config у config OpenClaw, а не в налаштуваннях проєкту, що належать Pi.
- Runtime adapters вирішують, які саме transport-и реально можна виконати.

## Оновлення Plugin-ів

`/plugins` дає змогу операторам перевіряти виявлені Plugin-и й перемикати їхній enablement у config. Для потоків лише на читання можна використовувати alias `/plugin`. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Примітки:

- `/plugins list` і `/plugins show` використовують реальне виявлення Plugin-ів у поточному workspace плюс config на диску.
- `/plugins enable|disable` оновлює лише config Plugin-ів; це не встановлює й не видаляє Plugin-и.
- Після змін enable/disable перезапустіть gateway, щоб застосувати їх.

## Примітки щодо поверхонь

- **Текстові команди** працюють у звичайній chat-сесії (DM використовують `main`, групи мають власну сесію).
- **Native-команди** використовують ізольовані сесії:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (цілиться в chat-сесію через `CommandTargetSessionKey`)
- **`/stop`** націлюється на активну chat-сесію, щоб перервати поточний run.
- **Slack:** `channels.slack.slashCommand` усе ще підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної built-in команди (з тими самими назвами, що й у `/help`). Меню аргументів команд для Slack надаються як ephemeral Block Kit buttons.
  - Виняток для native-команд Slack: зареєструйте `/agentstatus` (а не `/status`), оскільки Slack резервує `/status`. Текстова `/status` у повідомленнях Slack усе ще працює.

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточну сесію.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- запускається як окремий **одноразовий виклик без tool-ів**,
- не змінює майбутній контекст сесії,
- не записується в history transcript-а,
- доставляється як live side result, а не як звичайне повідомлення асистента.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основне
завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
```

Повну поведінку й подробиці UX клієнта див. у [BTW Side Questions](/uk/tools/btw).
