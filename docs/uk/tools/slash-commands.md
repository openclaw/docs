---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-05-02T13:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands are handled by the Gateway. Most commands must be sent as a **standalone** message that starts with `/`. The host-only bash chat command uses `! <cmd>` (with `/bash <cmd>` as an alias).

When a conversation or thread is bound to an ACP session, normal follow-up text routes to that ACP harness. Gateway management commands still stay local: `/acp ...` always reaches the OpenClaw ACP command handler, and `/status` plus `/unfocus` stay local whenever command handling is enabled for the surface.

There are two related systems:

<AccordionGroup>
  <Accordion title="Commands">
    Standalone `/...` messages.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives are stripped from the message before the model sees it.
    - In normal chat messages (not directive-only), they are treated as "inline hints" and do **not** persist session settings.
    - In directive-only messages (the message contains only directives), they persist to the session and reply with an acknowledgement.
    - Directives are only applied for **authorized senders**. If `commands.allowFrom` is set, it is the only allowlist used; otherwise authorization comes from channel allowlists/pairing plus `commands.useAccessGroups`. Unauthorized senders see directives treated as plain text.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Allowlisted/authorized senders only: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    They run immediately, are stripped before the model sees the message, and the remaining text continues through the normal flow.

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  Enables parsing `/...` in chat messages. On surfaces without native commands (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), text commands still work even if you set this to `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registers native commands. Auto: on for Discord/Telegram; off for Slack (until you add slash commands); ignored for providers without native support. Set `channels.discord.commands.native`, `channels.telegram.commands.native`, or `channels.slack.commands.native` to override per provider (bool or `"auto"`). `false` clears previously registered commands on Discord/Telegram at startup. Slack commands are managed in the Slack app and are not removed automatically.
</ParamField>
On Discord, native command specs may include `descriptionLocalizations`, which OpenClaw publishes as Discord `description_localizations` and includes in reconcile comparisons.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registers **skill** commands natively when supported. Auto: on for Discord/Telegram; off for Slack (Slack requires creating a slash command per skill). Set `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, or `channels.slack.commands.nativeSkills` to override per provider (bool or `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Enables `! <cmd>` to run host shell commands (`/bash <cmd>` is an alias; requires `tools.elevated` allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controls how long bash waits before switching to background mode (`0` backgrounds immediately).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Enables `/config` (reads/writes `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Enables `/mcp` (reads/writes OpenClaw-managed MCP config under `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Enables `/plugins` (plugin discovery/status plus install + enable/disable controls).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Enables `/debug` (runtime-only overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Enables `/restart` plus gateway restart tool actions.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Sets the explicit owner allowlist for owner-only command/tool surfaces. This is the human operator account that can approve dangerous actions and run commands such as `/diagnostics`, `/export-trajectory`, and `/config`. It is separate from `commands.allowFrom` and from DM pairing access.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: makes owner-only commands require **owner identity** to run on that surface. When `true`, the sender must either match a resolved owner candidate (for example an entry in `commands.ownerAllowFrom` or provider-native owner metadata) or hold internal `operator.admin` scope on an internal message channel. A wildcard entry in channel `allowFrom`, or an empty/unresolved owner-candidate list, is **not** sufficient — owner-only commands fail closed on that channel. Leave this off if you want owner-only commands gated only by `ownerAllowFrom` and the standard command allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controls how owner ids appear in the system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Optionally sets the HMAC secret used when `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Per-provider allowlist for command authorization. When configured, it is the only authorization source for commands and directives (channel allowlists/pairing and `commands.useAccessGroups` are ignored). Use `"*"` for a global default; provider-specific keys override it.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Enforces allowlists/policies for commands when `commands.allowFrom` is not set.
</ParamField>

## Command list

Current source-of-truth:

- core built-ins come from `src/auto-reply/commands-registry.shared.ts`
- generated dock commands come from `src/auto-reply/commands-registry.data.ts`
- plugin commands come from plugin `registerCommand()` calls
- actual availability on your gateway still depends on config flags, channel surface, and installed/enabled plugins

### Core built-in commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` starts a new session; `/reset` is the reset alias.
    - Control UI intercepts typed `/new` to create and switch to a fresh dashboard session; typed `/reset` still runs the Gateway's in-place reset.
    - `/reset soft [message]` keeps the current transcript, drops reused CLI backend session ids, and reruns startup/system-prompt loading in-place.
    - `/compact [instructions]` compacts the session context. See [Compaction](/uk/concepts/compaction).
    - `/stop` aborts the current run.
    - `/session idle <duration|off>` and `/session max-age <duration|off>` manage thread-binding expiry.
    - `/export-session [path]` exports the current session to HTML. Alias: `/export`.
    - `/export-trajectory [path]` asks for exec approval, then exports a JSONL [trajectory bundle](/uk/tools/trajectory) for the current session. Use it when you need the prompt, tool, and transcript timeline for one OpenClaw session. In group chats, the approval prompt and export result go to the owner privately. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` sets the thinking level. Options come from the active model's provider profile; common levels are `off`, `minimal`, `low`, `medium`, and `high`, with custom levels such as `xhigh`, `adaptive`, `max`, or binary `on` only where supported. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` toggles verbose output. Alias: `/v`.
    - `/trace on|off` toggles plugin trace output for the current session.
    - `/fast [status|on|off]` shows or sets fast mode.
    - `/reasoning [on|off|stream]` toggles reasoning visibility. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` toggles elevated mode. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` shows or sets exec defaults.
    - `/model [name|#|status]` shows or sets the model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lists configured/auth-available providers or models for a provider; add `all` to browse that provider's full catalog.
    - `/queue <mode>` manages queue behavior (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus options like `debounce:0.5s cap:25 drop:summarize`; `/queue default` or `/queue reset` clears the session override. See [Command queue](/uk/concepts/queue) and [Steering queue](/uk/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` shows the short help summary.
    - `/commands` shows the generated command catalog.
    - `/tools [compact|verbose]` shows what the current agent can use right now.
    - `/status` shows execution/runtime status, including `Execution`/`Runtime` labels and provider usage/quota when available.
    - `/diagnostics [note]` is the owner-only support-report flow for Gateway bugs and Codex harness runs. It asks for explicit exec approval every time before running `openclaw gateway diagnostics export --json`; do not approve diagnostics with an allow-all rule. After approval, it sends a pasteable report with the local bundle path, manifest summary, privacy notes, and relevant session ids. In group chats, the approval prompt and report go to the owner privately. When the active session uses the OpenAI Codex harness, the same approval also sends relevant Codex feedback to OpenAI servers and the completed reply lists the OpenClaw session ids, Codex thread ids, and `codex resume <thread-id>` commands. See [Diagnostics Export](/uk/gateway/diagnostics).
    - `/crestodian <request>` runs the Crestodian setup and repair helper from an owner DM.
    - `/tasks` lists active/recent background tasks for the current session.
    - `/context [list|detail|json]` explains how context is assembled.
    - `/whoami` shows your sender id. Alias: `/id`.
    - `/usage off|tokens|full|cost` controls the per-response usage footer or prints a local cost summary.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` runs a skill by name.
    - `/allowlist [list|add|remove] ...` manages allowlist entries. Text-only.
    - `/approve <id> <decision>` resolves exec approval prompts.
    - `/btw <question>` asks a side question without changing future session context. See [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP та параметрами середовища виконання.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` показує список агентів, прив’язаних до гілки, для поточного сеансу.
    - `/kill <id|#|all>` перериває один або всі запущені субагенти.
    - `/steer <id|#> <message>` надсилає керування запущеному субагенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потрібно `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потрібно `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан плагіна. `/plugin` є псевдонімом. Записи лише для власника. Потрібно `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потрібно `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потрібно `commands.bash: true` плюс списки дозволів `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди стикування

Команди стикування перемикають маршрут відповіді поточного сеансу на інший пов’язаний
канал. Налаштування, приклади та усунення несправностей див. у [Стикуванні каналів](/uk/concepts/channel-docking).

Команди стикування генеруються з плагінів каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди стикування з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному адресату каналу.

Команди стикування потребують `session.identityLinks`. Відправник джерела та цільовий адресат мають бути в одній групі ідентичностей, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не пов’язаний з адресатом Discord, команда відповідає підказкою щодо налаштування, а не переходить до звичайного чату.

Стикування змінює лише активний маршрут сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволів каналів і не переносить історію стенограми до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду стикування, щоб знову перемкнути маршрут.

### Команди вбудованих плагінів

Вбудовані плагіни можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди вузла телефону.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає пресети насичених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим каркасом сервера застосунку Codex. Див. [Каркас Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли Skill/плагін їх реєструє.
- нативна реєстрація команд Skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, що підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Нотатки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
    - Для повної розбивки використання провайдерів використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує канал `configWrites`.
    - У багатооблікових каналах `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації плагінів, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, бо модулі джерела плагіна змінилися.
    - `/plugins enable|disable` оновлює конфігурацію плагіна та запускає перезавантаження плагінів Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує гільдії та вибраного голосового/сценічного каналу. Потрібні `channels.discord.voice` і нативні команди.
    - Команди прив’язування гілок Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні прив’язки гілок були ввімкнені (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження й додаткової видимості; тримайте його **вимкненим** у звичайному використанні.
    - `/trace` вужчий за `/verbose`: він розкриває лише рядки трасування/налагодження, що належать плагіну, і залишає звичайний докладний шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в інтерфейсі Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних кінцевих точках Responses, тоді як прямі публічні запити Anthropic, зокрема трафік з OAuth-автентифікацією, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів і далі показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішні міркування, вивід інструментів або діагностику плагінів, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент простоює, наступний запуск використовує її відразу.
    - Якщо запуск уже активний, OpenClaw позначає перемикання наживо як очікуване й перезапускається в нову модель лише в чистій точці повтору.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повтору або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналу повідомлень і не надає віддалені повноваження конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволів обробляються негайно (обхід черги + моделі).
    - **Фільтр групових згадок:** повідомлення лише з командами від відправників зі списку дозволів обходять вимоги до згадок.
    - **Вбудовані скорочення (лише відправники зі списку дозволів):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** Skills `user-invocable` доступні як slash-команди. Назви очищуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає Skill за назвою (корисно, коли обмеження нативних команд не дають створити окремі команди для кожної Skill).
      - Типово команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб спрямувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (плагін OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти вибору розв’язуються відносно цільової моделі сеансу, тому параметри, специфічні для моделі, як-от рівні `/think`, відповідають перевизначенню `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання середовища виконання, а не конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сеансу, тому зміна агента, каналу, гілки, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час виконання, зокрема основні інструменти, підключені інструменти плагінів та інструменти, що належать каналу.

Для редагування профілів і перевизначень використовуйте панель Tools в інтерфейсі Control UI або поверхні конфігурації/каталогу, а не розглядайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") відображається в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax відсоткові поля лише із залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису чат-моделі плюс мітці плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть повертатися до найновішого запису використання транскрипту, коли живий знімок сесії розріджений. Наявні ненульові живі значення все одно мають пріоритет, а запасний варіант із транскрипту також може відновити мітку активної runtime-моделі плюс більший, орієнтований на prompt підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично виконує сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
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

- `/model` і `/model list` показують компактний нумерований вибір (родина моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадними списками провайдера та моделі, а також кроком Submit.
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, включно з налаштованим endpoint провайдера (`baseUrl`) і режимом API (`api`), коли вони доступні.

## Налагоджувальні перевизначення

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише власник. Типово вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Перевизначення застосовуються негайно для нових читань конфігурації, але **не** записуються в `openclaw.json`. Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід трасування Plugin

`/trace` дає змогу вмикати або вимикати **рядки трасування/налагодження Plugin у межах сесії** без увімкнення повного докладного режиму.

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

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише власник. Типово вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Конфігурацію перевіряють перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються між перезапусками.
</Note>

## Оновлення MCP

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Лише власник. Типово вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, що належать Pi. Runtime-адаптери вирішують, які transports фактично можна виконати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені plugins і перемикати їх увімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як alias. Типово вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення plugin у поточному workspace плюс конфігурацію на диску.
- `/plugins install` встановлює з ClawHub, npm, git, локальних директорій і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію plugin; це не встановлює і не видаляє plugins.
- Зміни ввімкнення й вимкнення гаряче перезавантажують runtime-поверхні Gateway plugin для нових ходів агентів; встановлення запитує перезапуск Gateway, бо вихідні модулі plugin змінилися.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії на поверхню">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (націлюється на чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** націлюється на активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` і далі підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити по одній slash-команді Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ephemeral кнопки Block Kit.

    Нативний виняток Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` і далі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні питання BTW

`/btw` — це швидке **побічне питання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію транскрипту,
- воно доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжує виконуватися.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні питання BTW](/uk/tools/btw) для повної поведінки та деталей UX клієнта.

## Пов’язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
