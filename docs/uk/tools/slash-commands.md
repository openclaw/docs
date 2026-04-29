---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-04-29T17:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bdc4c9e4e2d541c5be089113f144907c150b85cce1922b8a6975fd11a57927aa
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Chat-команда bash лише для хоста використовує `! <cmd>` (із `/bash <cmd>` як псевдонімом).

Коли розмову або гілку прив’язано до ACP-сесії, звичайний текст подальших відповідей маршрутизується до цього ACP-обв’язування. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними щоразу, коли для цієї поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення перед тим, як його побачить модель.
    - У звичайних chat-повідомленнях (не лише з директивами) вони трактуються як "inline-підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація береться зі списків дозволених каналу/спарювання плюс `commands.useAccessGroups`. Для неавторизованих відправників директиви трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Тільки відправники зі списку дозволених/авторизовані: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Вони виконуються негайно, вилучаються перед тим, як модель побачить повідомлення, а решта тексту проходить звичайним потоком.

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
  Вмикає розбір `/...` у chat-повідомленнях. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення в `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Нативно реєструє команди **skill**, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack потребує створення slash-команди для кожного skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для виконання команд shell хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед переходом у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус plugin плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` плюс дії інструментів перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для поверхонь команд/інструментів лише для власника. Це обліковий запис оператора-людини, який може схвалювати небезпечні дії та запускати команди, як-от `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через спарювання DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з розпізнаним кандидатом-власником (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішню область `operator.admin` у внутрішньому каналі повідомлень. Wildcard-запис у `allowFrom` каналу або порожній/нерозпізнаний список кандидатів-власників **не** є достатнім — команди лише для власника на цьому каналі закриваються за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених для команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власників з’являються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдерами. Коли його налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених каналу/спарювання та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані команди ядра надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- команди plugin надходять із викликів plugin `registerCommand()`
- фактична доступність на вашому Gateway все ще залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані команди ядра

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ідентифікатори сесій CLI backend і повторно запускає завантаження запуску/системного prompt на місці.
    - `/compact [instructions]` виконує Compaction контексту сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують закінченням терміну прив’язки гілки.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [пакет траєкторії](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібна хронологія prompt, інструментів і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Керування моделлю та запуском">
    - `/think <level>` задає рівень мислення. Параметри беруться з профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а спеціальні рівні, як-от `xhigh`, `adaptive`, `max`, або двійковий `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід trace plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated-режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних за автентифікацією провайдерів або моделі для провайдера; додайте `all`, щоб переглядати повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами на кшталт `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Виявлення та статус">
    - `/help` показує коротке зведення довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати зараз.
    - `/status` показує статус виконання/середовища виконання, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для помилок Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте діагностику правилом allow-all. Після схвалення він надсилає звіт, придатний для вставлення, з локальним шляхом пакета, зведенням manifest, примітками щодо приватності та відповідними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає відповідний Codex feedback на сервери OpenAI, а завершена відповідь містить ідентифікатори сесій OpenClaw, ідентифікатори гілок Codex і команди `codex resume <thread-id>`. Див. [Експорт діагностики](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та відновлення Crestodian з DM власника.
    - `/tasks` перелічує активні/недавні фонові задачі для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує футером використання для кожної відповіді або друкує локальне зведення вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` розв’язує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує ACP-сесіями та параметрами середовища виконання.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цілі сесії.
    - `/unfocus` вилучає поточну прив’язку.
    - `/agents` перелічує прив’язаних до гілки агентів для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/steer <id|#> <message>` надсилає steering запущеному субагенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише для власника й адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує керовану OpenClaw конфігурацію MCP-сервера в `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugins. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для runtime. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: увімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації в групі.
    - `/bash <command>` запускає shell-команду на хості. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` і allowlists `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди закріплення

Команди закріплення перемикають маршрут відповіді поточного сеансу на інший пов'язаний
канал. Див. [Закріплення каналу](/uk/concepts/channel-docking), щоб налаштувати,
переглянути приклади й усунути неполадки.

Команди закріплення генеруються з channel plugins із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди закріплення з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов'язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному peer каналу.

Команди закріплення потребують `session.identityLinks`. Відправник джерела й цільовий peer мають бути в одній групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не пов'язаний із peer Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Закріплення змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить channel allowlists і не переносить історію transcript в інший сеанс. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду закріплення, щоб знову перемкнути маршрут.

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому repo:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам'яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує процесом сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає пресети rich card LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим app-server harness Codex. Див. [Harness Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- skills також можуть з'являтися як прямі команди на кшталт `/prose`, коли skill/plugin їх реєструє.
- реєстрація нативних skill-команд керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і парсера">
    - Команди приймають необов'язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст вважається тілом повідомлення.
    - Для повної розбивки використання провайдера застосовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує channel `configWrites`.
    - У каналах із кількома обліковими записами `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує usage footer для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію plugin і може запропонувати перезапуск.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує guild і вибраного voice/stage каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив'язування thread у Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив'язок thread (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і runtime-поведінка: [ACP-агенти](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для debugging і додаткової видимості; тримайте його **вимкненим** у звичайному використанні.
    - `/trace` вужчий за `/verbose`: він показує лише trace/debug рядки, що належать plugin, і залишає звичайний verbose-шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте опцію `inherit` в інтерфейсі Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex відображають його на `service_tier=priority` на нативних Responses endpoints, тоді як прямі публічні запити Anthropic, включно з OAuth-автентифікованим трафіком, надісланим до `api.anthropic.com`, відображають його на `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових середовищах: вони можуть розкрити внутрішні міркування, вивід інструментів або diagnostics plugin, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделей">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент idle, наступний запуск використовує її одразу.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як pending і перезапускається в нову модель лише в чистій точці повтору.
    - Якщо активність інструментів або вивід відповіді вже почалися, pending-перемикання може залишатися в черзі до пізнішої можливості повтору або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму rescue каналу повідомлень і не надає віддалених повноважень на конфігурацію.

  </Accordion>
  <Accordion title="Швидкий шлях та inline-скорочення">
    - **Швидкий шлях:** повідомлення лише з командою від allowlisted відправників обробляються негайно (обхід черги + моделі).
    - **Group mention gating:** повідомлення лише з командою від allowlisted відправників обходять вимоги згадування.
    - **Inline-скорочення (лише allowlisted відправники):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь status, а решта тексту продовжує звичайний потік.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командою мовчки ігноруються, а inline токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** Skills `user-invocable` доступні як slash-команди. Імена санітизуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дозволяють окремі команди для кожного skill).
      - Типово команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов'язково оголосити `command-dispatch: tool`, щоб маршрутизувати команду напряму до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує autocomplete для динамічних опцій (і меню кнопок, коли ви пропускаєте обов'язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти вибору розв'язуються відносно цільової моделі сеансу, тому специфічні для моделі опції, як-от рівні `/think`, дотримуються перевизначення `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на runtime-запитання, а не на конфігураційне: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати обмежені сеансом, тому зміна агента, каналу, thread, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час runtime, зокрема core tools, підключені plugin tools і channel-owned tools.

Для редагування профілю та перевизначень використовуйте панель Control UI Tools або поверхні config/catalog, а не сприймайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує provider windows до `% left`; для MiniMax поля відсотків лише залишку інвертуються перед відображенням, а відповіді `model_remains` віддають перевагу запису chat-моделі та plan label із тегом моделі.
- **Рядки токенів/cache** у `/status` можуть повернутися до останнього запису використання transcript, коли live snapshot сеансу розріджений. Наявні ненульові live-значення все одно перемагають, а transcript fallback також може відновити мітку активної runtime-моделі плюс більший prompt-oriented total, коли збережені підсумки відсутні або менші.
- **Execution vs runtime:** `/status` повідомляє `Execution` для ефективного sandbox path і `Runtime` для того, хто фактично виконує сеанс: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI або backend ACP.
- **Токени/вартість для кожної відповіді** керуються `/usage off|tokens|full` (додається до звичайних відповідей).
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

- `/model` і `/model list` показують компактний нумерований picker (родина моделі + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний picker із dropdowns провайдера й моделі та кроком Submit.
- `/model <#>` вибирає з цього picker (і віддає перевагу поточному провайдеру, коли можливо).
- `/model status` показує докладний вигляд, включно з налаштованим endpoint провайдера (`baseUrl`) і режимом API (`api`), коли доступно.

## Debug-перевизначення

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам’яті, не на диску). Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.debug: true`.

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

## Вивід трасування Plugin

`/trace` дає змогу перемикати **рядки трасування/налагодження Plugin у межах сеансу** без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування сеансу.
- `/trace on` вмикає рядки трасування Plugin для поточного сеансу.
- `/trace off` знову їх вимикає.
- Рядки трасування Plugin можуть з’являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/стану й далі належить до `/verbose`.

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
Конфігурація перевіряється перед записом; недійсні зміни відхиляються. Оновлення `/config` зберігаються між перезапусками.
</Note>

## Оновлення MCP

`/mcp` записує керовані OpenClaw визначення серверів MCP у `mcp.servers`. Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

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

`/plugins` дає операторам змогу переглядати виявлені Plugin і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення Plugin для поточної робочої області разом із конфігурацією на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; він не встановлює й не видаляє Plugin.
- Після змін увімкнення/вимкнення перезапустіть gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сеанси за поверхнями">
    - **Текстові команди** виконуються у звичайному чат-сеансі (DM мають спільний `main`, групи мають власний сеанс).
    - **Нативні команди** використовують ізольовані сеанси:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (націлюється на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** націлюється на активний чат-сеанс, щоб він міг перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` усе ще підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), оскільки Slack резервує `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточний сеанс.

На відміну від звичайного чату:

- воно використовує поточний сеанс як фоновий контекст,
- виконується як окремий одноразовий виклик **без інструментів**,
- не змінює майбутній контекст сеансу,
- не записується в історію транскрипту,
- доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб отримати повний опис поведінки та деталей UX клієнта.

## Пов’язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
