---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Команди зі скісною рискою
x-i18n:
    generated_at: "2026-04-29T21:53:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b9a4bf0106df4d8397737976ddd4df665d80709892b686d71978d8a3bafae0
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда чату bash лише для хоста використовує `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову або гілку прив'язано до сесії ACP, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway усе одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` плюс `/unfocus` залишаються локальними щоразу, коли для поверхні увімкнено обробку команд.

Є дві пов'язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони вважаються "вбудованими підказками" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії й відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація береться зі списків дозволених/сполучення каналу плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

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
  Увімкнення розбору `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Автоматично: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Командами Slack керують у застосунку Slack, і вони не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Автоматично: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash-команди для кожного skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Увімкнення `! <cmd>` для запуску команд оболонки хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash чекає перед перемиканням у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Увімкнення `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Увімкнення `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Увімкнення `/plugins` (виявлення/стан плагінів плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Увімкнення `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Увімкнення `/restart` плюс дії інструментів перезапуску Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для поверхонь команд/інструментів лише для власника. Це обліковий запис оператора-людини, який може схвалювати небезпечні дії та запускати команди, як-от `/diagnostics`, `/export-trajectory` і `/config`. Він відокремлений від `commands.allowFrom` і від доступу через сполучення DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для окремого каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з розпізнаним кандидатом у власники (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/нерозпізнаний список кандидатів у власники **не** є достатнім — команди лише для власника на цьому каналі відмовляють за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власників відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов'язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за окремими провайдерами. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених/сполучення каналу та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі, специфічні для провайдера, перевизначають його.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Забезпечує застосування списків дозволених/політик для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані core-команди надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- команди плагінів надходять із викликів `registerCommand()` плагіна
- фактична доступність на вашому gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених плагінів

### Вбудовані core-команди

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ідентифікатори сесій backend CLI та повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` ущільнює контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням прив'язки гілки.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує схвалення exec, а потім експортує JSONL [пакет trajectory](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібна часова шкала prompt, інструментів і transcript для однієї сесії OpenClaw. У групових чатах prompt схвалення та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Елементи керування моделлю та запуском">
    - `/think <level>` задає рівень мислення. Опції надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а власні рівні, як-от `xhigh`, `adaptive`, `max` або бінарний `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування плагіна для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated-режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові параметри exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних за авторизацією провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс опціями на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Черга команд](/uk/concepts/queue).

  </Accordion>
  <Accordion title="Виявлення та стан">
    - `/help` показує короткий довідковий підсумок.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
    - `/status` показує стан виконання/runtime, зокрема мітки `Execution`/`Runtime` і використання/квоту провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для помилок Gateway і запусків Codex harness. Він щоразу запитує явне схвалення exec перед запуском `openclaw gateway diagnostics export --json`; не схвалюйте діагностику правилом allow-all. Після схвалення він надсилає придатний для вставлення звіт із локальним шляхом пакета, підсумком manifest, нотатками про приватність і відповідними ідентифікаторами сесій. У групових чатах prompt схвалення та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме схвалення також надсилає відповідний feedback Codex на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори гілок Codex і команди `codex resume <thread-id>`. Див. [Експорт діагностики](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та ремонту Crestodian із DM власника.
    - `/tasks` перелічує активні/недавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує футером використання для кожної відповіді або друкує локальний підсумок вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` вирішує prompts схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і runtime-опціями.
    - `/focus <target>` прив'язує поточну гілку Discord або тему/розмову Telegram до цільової сесії.
    - `/unfocus` видаляє поточну прив'язку.
    - `/agents` перелічує прив'язаних до гілки агентів для поточної сесії.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/steer <id|#> <message>` надсилає керування запущеному субагенту. Псевдонім: `/tell`.

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, керовану OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує конфігураційними перевизначеннями лише для runtime. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS і керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду shell на хості. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс списків дозволеного `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди докування

Команди докування перемикають маршрут відповіді поточної сесії на інший пов’язаний
канал. Див. [Докування каналів](/uk/concepts/channel-docking) для налаштування,
прикладів і усунення несправностей.

Команди докування генеруються з plugin каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди докування з прямого чату, щоб перемкнути маршрут відповіді поточної сесії на інший пов’язаний канал. Агент зберігає той самий контекст сесії, але майбутні відповіді для цієї сесії доставляються вибраному peer каналу.

Команди докування потребують `session.identityLinks`. Відправник-джерело й цільовий peer мають бути в одній групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активній сесії. Якщо відправник не пов’язаний із peer Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Докування змінює лише маршрут активної сесії. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволеного каналів і не переносить історію transcript в іншу сесію. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду докування, щоб знову перемкнути маршрут.

### Команди вбудованих plugin

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає memory dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово активує високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає пресети LINE rich card. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованою обв’язкою app-server Codex. Див. [Обв’язка Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди skills

Викликані користувачем skills також відкриваються як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/plugin реєструє їх.
- нативна реєстрація skill-команд керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Примітки щодо аргументів і parser">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву provider (нечіткий збіг); якщо збігу немає, текст розглядається як тіло повідомлення.
    - Для повного розподілу використання provider використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує channel `configWrites`.
    - У каналах із кількома обліковими записами `/allowlist --account <id>` для конфігурації та `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує footer використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сесій OpenClaw.
    - `/restart` типово ввімкнено; задайте `commands.restart: false`, щоб вимкнути.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію plugin і може попросити перезапуск.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує guild і вибраного voice/stage channel. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язування thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив’язок thread (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка runtime: [Агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження й додаткової видимості; тримайте його **вимкненим** під час звичайного використання.
    - `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать plugin, і залишає звичайні докладні повідомлення інструментів вимкненими.
    - `/fast on|off` зберігає перевизначення сесії. Використовуйте опцію `inherit` в UI Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від provider: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних endpoints Responses, тоді як прямі публічні запити Anthropic, включно з OAuth-автентифікованим трафіком, надісланим до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли доречно, але детальний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сесії.
    - Якщо агент неактивний, наступний запуск одразу використовує її.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускається в нову модель лише в чистій точці повтору.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до наступної можливості повтору або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від rescue mode каналу повідомлень і не надає віддалених повноважень конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командою від відправників зі списку дозволеного обробляються негайно (обхід черги + моделі).
    - **Group mention gating:** повідомлення лише з командою від відправників зі списку дозволеного обходять вимоги згадування.
    - **Вбудовані скорочення (лише відправники зі списку дозволеного):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються перед тим, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командою мовчки ігноруються, а вбудовані токени `/...` розглядаються як звичайний текст.

  </Accordion>
  <Accordion title="Skill-команди та нативні аргументи">
    - **Skill-команди:** skills `user-invocable` відкриваються як slash-команди. Назви очищаються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд перешкоджають окремим командам для кожного skill).
      - Типово skill-команди пересилаються моделі як звичайний запит.
      - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує autocomplete для динамічних опцій (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент. Динамічні варіанти розв’язуються відносно цільової моделі сесії, тому специфічні для моделі опції, такі як рівні `/think`, відповідають перевизначенню `/model` цієї сесії.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання runtime, а не на питання конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, які підтримують аргументи, відкривають той самий перемикач режиму як `compact|verbose`.
- Результати прив’язані до сесії, тому зміна агента, каналу, thread, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які фактично доступні під час runtime, включно з core tools, підключеними plugin tools та інструментами, що належать каналу.

Для редагування профілю та перевизначень використовуйте панель Tools у Control UI або поверхні config/catalog, замість того щоб розглядати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота provider** (приклад: "Claude 80% left") показується в `/status` для поточного provider моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна provider до `% left`; для MiniMax поля відсотка лише залишку інвертуються перед відображенням, а відповіді `model_remains` віддають перевагу запису chat-model плюс позначці плану з тегом моделі.
- **Рядки token/cache** у `/status` можуть повертатися до останнього запису використання transcript, коли live-знімок сесії розріджений. Наявні ненульові live-значення все ще мають пріоритет, а fallback transcript також може відновити мітку активної runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного sandbox path і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI або backend ACP.
- **Tokens/cost для кожної відповіді** керується `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **models/auth/endpoints**, а не використання.

## Вибір моделі (`/model`)

`/model` реалізовано як directive.

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

- `/model` і `/model list` показують компактний нумерований picker (сімейство моделі + доступні provider).
- У Discord `/model` і `/models` відкривають інтерактивний picker із dropdowns provider і model плюс крок Submit.
- `/model <#>` вибирає з цього picker (і, коли можливо, віддає перевагу поточному provider).
- `/model status` показує детальний перегляд, включно зі сконфігурованим endpoint provider (`baseUrl`) і режимом API (`api`), коли доступно.

## Перевизначення debug

`/debug` дає змогу задавати **лише runtime** перевизначення конфігурації (у пам'яті, не на диску). Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.debug: true`.

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

`/trace` дає змогу перемикати **обмежені поточною сесією рядки трасування/налагодження Plugin** без увімкнення повного докладного режиму.

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
- Рядки трасування Plugin можуть з'являтися в `/status` і як подальше діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і надалі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу й надалі належить до `/verbose`.

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

`/mcp` записує керовані OpenClaw визначення серверів MCP у `mcp.servers`. Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в проєктних налаштуваннях, що належать Pi. Runtime-адаптери вирішують, які транспорти фактично можна виконати.
</Note>

## Оновлення Plugin

`/plugins` дає операторам змогу переглядати виявлені Plugin і перемикати їх увімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують справжнє виявлення Plugin для поточного робочого простору разом із конфігурацією на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; це не встановлює й не видаляє Plugin.
- Після змін увімкнення/вимкнення перезапустіть Gateway, щоб застосувати їх.

</Note>

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Текстові команди** виконуються у звичайній чат-сесії (особисті повідомлення спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (спрямовує на чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** спрямовується на активну чат-сесію, щоб мати змогу перервати поточний запуск.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` і надалі підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (з тими самими назвами, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова команда `/status` і надалі працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сесії,
- воно не записується в історію transcript,
- воно доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб дізнатися повну поведінку та подробиці UX клієнта.

## Пов'язане

- [Створення skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
