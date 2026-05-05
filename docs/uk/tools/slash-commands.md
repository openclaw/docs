---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або прав доступу
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Команди з похилою рискою
x-i18n:
    generated_at: "2026-05-05T05:56:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда bash-чату лише для хоста використовує `! <cmd>` (із `/bash <cmd>` як псевдонімом).

Коли розмова або гілка прив'язана до сесії ACP, звичайний подальший текст спрямовується до цього ACP harness. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними, коли обробку команд увімкнено для цієї поверхні.

Є дві пов'язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони розглядаються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та відповідають підтвердженням.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація береться зі списків дозволених/спарювання каналу плюс `commands.useAccessGroups`. Неавторизовані відправники бачать директиви як звичайний текст.

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
  Увімкнює розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити це значення на `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити для окремого провайдера (bool або `"auto"`). У Discord `false` пропускає реєстрацію slash-команд і очищення під час запуску; раніше зареєстровані команди можуть залишатися видимими, доки ви не видалите їх із застосунку Discord. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
У Discord специфікації нативних команд можуть містити `descriptionLocalizations`, які OpenClaw публікує як Discord `description_localizations` і включає до порівнянь узгодження.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **skill** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (Slack вимагає створення slash-команди для кожного skill). Установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити для окремого провайдера (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Увімкнює `! <cmd>` для запуску команд оболонки хоста (`/bash <cmd>` є псевдонімом; потребує списків дозволених `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, як довго bash очікує перед переходом у фоновий режим (`0` переводить у фон негайно).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Увімкнює `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Увімкнює `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Увімкнює `/plugins` (виявлення/статус plugin плюс елементи керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Увімкнює `/debug` (перевизначення лише під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Увімкнює `/restart` плюс дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених власників для поверхонь команд/інструментів, доступних лише власнику. Це обліковий запис оператора-людини, який може затверджувати небезпечні дії та запускати команди, як-от `/diagnostics`, `/export-trajectory` і `/config`. Він окремий від `commands.allowFrom` і від доступу через спарювання DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Коли `true`, відправник має або збігатися з визначеним кандидатом у власники (наприклад, записом у `commands.ownerAllowFrom` або нативними метаданими власника провайдера), або мати внутрішню область `operator.admin` у внутрішньому каналі повідомлень. Запис із wildcard у `allowFrom` каналу або порожній/невизначений список кандидатів у власники **не** є достатнім — команди лише для власника в такому каналі закриваються за замовчуванням. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися тільки `ownerAllowFrom` і стандартними списками дозволених команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов'язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдером. Коли налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених/спарювання каналу та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` для глобального значення за замовчуванням; ключі, специфічні для провайдера, перевизначають його.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані core-команди походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди походять із `src/auto-reply/commands-registry.data.ts`
- команди plugin походять із викликів plugin `registerCommand()`
- фактична доступність на вашому gateway все одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані core-команди

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` є псевдонімом скидання.
    - Control UI перехоплює введене `/new`, щоб створити й перемкнутися на нову сесію dashboard; введене `/reset` усе ще виконує скидання Gateway на місці.
    - `/reset soft [message]` зберігає поточний transcript, відкидає повторно використані ідентифікатори сесій бекенда CLI та повторно запускає завантаження стартового/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують закінченням строку прив'язки гілки.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` запитує затвердження exec, а потім експортує JSONL [пакет trajectory](/uk/tools/trajectory) для поточної сесії. Використовуйте це, коли вам потрібні prompt, інструмент і timeline transcript для однієї сесії OpenClaw. У групових чатах prompt затвердження та результат експорту надсилаються власнику приватно. Псевдонім: `/trajectory`.

  </Accordion>
  <Accordion title="Модель і елементи керування запуском">
    - `/think <level>` задає рівень мислення. Опції беруться з профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а користувацькі рівні, як-от `xhigh`, `adaptive`, `max` або бінарний `on`, доступні лише там, де підтримуються. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування plugin для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated-режим. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає значення exec за замовчуванням.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує налаштованих/доступних через auth провайдерів або моделі для провайдера; додайте `all`, щоб переглянути повний каталог цього провайдера.
    - `/queue <mode>` керує поведінкою queue (`steer`, застарілий `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) плюс опціями на кшталт `debounce:0.5s cap:25 drop:summarize`; `/queue default` або `/queue reset` очищає перевизначення сесії. Див. [Черга команд](/uk/concepts/queue) і [Черга steering](/uk/concepts/queue-steering).
    - `/steer <message>` вводить guidance в активний запуск для поточної сесії незалежно від режиму `/queue`. Він не запускає новий запуск, коли сесія бездіяльна. Псевдонім: `/tell`. Див. [Steer](/uk/tools/steer).

  </Accordion>
  <Accordion title="Виявлення та статус">
    - `/help` показує коротке зведення довідки.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний agent може використовувати просто зараз.
    - `/status` показує статус виконання/runtime, час роботи Gateway і системи, а також використання/квоту провайдера, коли доступно.
    - `/diagnostics [note]` — це потік звіту підтримки лише для власника для помилок Gateway і запусків Codex harness. Він щоразу запитує явне затвердження exec перед запуском `openclaw gateway diagnostics export --json`; не затверджуйте diagnostics правилом allow-all. Після затвердження він надсилає звіт, який можна вставити, з локальним шляхом пакета, зведенням manifest, нотатками про приватність і відповідними ідентифікаторами сесій. У групових чатах prompt затвердження та звіт надсилаються власнику приватно. Коли активна сесія використовує OpenAI Codex harness, те саме затвердження також надсилає відповідний Codex feedback на сервери OpenAI, а завершена відповідь перелічує ідентифікатори сесій OpenClaw, ідентифікатори гілок Codex і команди `codex resume <thread-id>`. Див. [Експорт Diagnostics](/uk/gateway/diagnostics).
    - `/crestodian <request>` запускає помічник налаштування та ремонту Crestodian з DM власника.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує footer використання для кожної відповіді або друкує локальне зведення вартості.

  </Accordion>
  <Accordion title="Skills, списки дозволених, затвердження">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` вирішує prompts затвердження exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw).

  </Accordion>
  <Accordion title="Субагенти та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP та параметрами середовища виконання.
    - `/focus <target>` прив'язує поточну гілку Discord або тему/розмову Telegram до цілі сеансу.
    - `/unfocus` видаляє поточну прив'язку.
    - `/agents` показує прив'язаних до гілки агентів для поточного сеансу.
    - `/kill <id|#|all>` перериває одного або всіх запущених субагентів.
    - `/subagents steer <id|#> <message>` надсилає керування запущеному субагенту. Див. [Керування](/uk/tools/steer).

  </Accordion>
  <Accordion title="Записи лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin. `/plugin` є псевдонімом. Записи лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для середовища виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, коли ввімкнено. Типово: увімкнено; задайте `commands.restart: false`, щоб вимкнути це.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.

  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду оболонки хоста. Лише текст. Псевдонім: `! <command>`. Потребує `commands.bash: true` і списків дозволених `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.

  </Accordion>
</AccordionGroup>

### Згенеровані команди стикування

Команди стикування перемикають маршрут відповіді поточного сеансу на інший зв'язаний
канал. Див. [Стикування каналів](/uk/concepts/channel-docking), щоб налаштувати,
переглянути приклади й усунути несправності.

Команди стикування генеруються з channel plugins із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди стикування з прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший зв'язаний канал. Агент зберігає той самий контекст сеансу, але майбутні відповіді для цього сеансу доставляються вибраному одноранговому каналу.

Команди стикування потребують `session.identityLinks`. Відправник-джерело й цільовий одноранговий учасник мають бути в тій самій групі ідентичності, наприклад `["telegram:123", "discord:456"]`. Якщо користувач Telegram з id `123` надсилає `/dock_discord`, OpenClaw зберігає `lastChannel: "discord"` і `lastTo: "456"` в активному сеансі. Якщо відправник не зв'язаний з одноранговим учасником Discord, команда відповідає підказкою з налаштування замість переходу до звичайного чату.

Стикування змінює лише маршрут активного сеансу. Воно не створює облікові записи каналів, не надає доступ, не обходить списки дозволених каналів і не переносить історію транскрипту до іншого сеансу. Використовуйте `/dock-telegram`, `/dock-slack`, `/dock-mattermost` або іншу згенеровану команду стикування, щоб знову перемкнути маршрут.

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам'яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком сполучення/налаштування пристрою. Див. [Сполучення](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди телефонного вузла.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди: `/talkvoice`.
- `/card ...` надсилає пресети розширених карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` перевіряє й керує вбудованим серверним каркасом застосунку Codex. Див. [Каркас Codex](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з'являтися як прямі команди на кшталт `/prose`, коли skill/plugin реєструє їх.
- реєстрація нативних команд Skills керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.
- специфікації команд можуть надавати `descriptionLocalizations` для нативних поверхонь, що підтримують локалізовані описи, зокрема Discord.

<AccordionGroup>
  <Accordion title="Нотатки щодо аргументів і парсера">
    - Команди приймають необов'язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст вважається тілом повідомлення.
    - Для повного розподілу використання провайдерів використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатооблікових каналах орієнтовані на конфігурацію `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує футером використання для кожної відповіді; `/usage cost` друкує локальний підсумок вартості з журналів сеансів OpenClaw.
    - `/restart` увімкнено типово; задайте `commands.restart: false`, щоб вимкнути це.
    - `/plugins install <spec>` приймає ті самі специфікації plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет, `git:<repo>` або `clawhub:<pkg>`, а потім запитує перезапуск Gateway, оскільки вихідні модулі plugin змінилися.
    - `/plugins enable|disable` оновлює конфігурацію plugin і запускає перезавантаження plugins Gateway для нових ходів агента.

  </Accordion>
  <Accordion title="Поведінка, специфічна для каналу">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступно як текст). `join` потребує сервера й вибраного голосового/сценічного каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив'язки гілок Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують увімкнених ефективних прив'язок гілок (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [Агенти ACP](/uk/tools/acp-agents).

  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження й додаткової видимості; тримайте його **вимкненим** за звичайного використання.
    - `/trace` вужчий за `/verbose`: він розкриває лише trace/debug-рядки, що належать plugin, і залишає звичайний verbose-шум інструментів вимкненим.
    - `/fast on|off` зберігає перевизначення сеансу. Використовуйте параметр `inherit` в UI Sessions, щоб очистити його й повернутися до типових значень конфігурації.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних кінцевих точках Responses, тоді як прямі публічні запити Anthropic, зокрема OAuth-автентифікований трафік, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе ще показуються, коли доречно, але докладний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin, які ви не мали наміру показувати. Бажано залишати їх вимкненими, особливо в групових чатах.

  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент неактивний, наступний запуск одразу використає її.
    - Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускає з новою моделлю лише в чистій точці повтору.
    - Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повтору або наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від rescue-режиму каналу повідомлень і не надає віддалених повноважень для конфігурації.

  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволених обробляються негайно (обхід черги + моделі).
    - **Обмеження згадками в групі:** повідомлення лише з командами від відправників зі списку дозволених обходять вимоги щодо згадок.
    - **Вбудовані скорочення (лише відправники зі списку дозволених):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються перед тим, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує звичайний потік.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Команди Skills і нативні аргументи">
    - **Команди Skills:** Skills `user-invocable` доступні як slash-команди. Назви очищуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд перешкоджають окремим командам для кожного skill).
      - Типово команди Skills пересилаються моделі як звичайний запит.
      - Skills можуть необов'язково оголосити `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (OpenProse plugin) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов'язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти й ви пропускаєте аргумент. Динамічні варіанти визначаються відносно цільової моделі сеансу, тому специфічні для моделі параметри, як-от рівні `/think`, відповідають перевизначенню `/model` цього сеансу.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання середовища виконання, а не на питання конфігурації: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати обмежені сеансом, тому зміна агента, каналу, гілки, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які справді доступні в середовищі виконання, зокрема основні інструменти, підключені інструменти plugins та інструменти, що належать каналу.

Для редагування профілю й перевизначень використовуйте панель Tools в Control UI або поверхні конфігурації/каталогу замість того, щоб вважати `/tools` статичним каталогом.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") відображається в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля відсотків лише із залишком інвертуються перед відображенням, а відповіді `model_remains` надають перевагу запису чат-моделі плюс мітці плану з тегом моделі.
- **Рядки токенів/кешу** у `/status` можуть повертатися до останнього запису використання з транскрипту, коли поточний знімок сесії розріджений. Наявні ненульові поточні значення все одно мають пріоритет, а резервний варіант із транскрипту також може відновити мітку активної runtime-моделі плюс більший prompt-орієнтований підсумок, коли збережені підсумки відсутні або менші.
- **Виконання проти runtime:** `/status` показує `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично запускає сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість на відповідь** керується через `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/автентифікації/ендпоінтів**, а не використання.

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
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадаючими списками провайдера й моделі та кроком Submit.
- `/model <#>` вибирає з цього списку (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує докладний вигляд, зокрема налаштований ендпоінт провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

## Налагоджувальні перевизначення

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
Перевизначення негайно застосовуються до нових читань конфігурації, але **не** записуються в `openclaw.json`. Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.
</Note>

## Вивід трасування Plugin

`/trace` дає змогу перемикати **обмежені сесією рядки трасування/налагодження plugin** без увімкнення повного докладного режиму.

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
- Рядки трасування Plugin можуть з’являтися в `/status` і як наступне діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує лише runtime перевизначеннями конфігурації.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу все ще належить до `/verbose`.

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

`/mcp` записує керовані OpenClaw визначення MCP-серверів у `mcp.servers`. Лише для власника. Вимкнено за замовчуванням; увімкніть через `commands.mcp: true`.

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

`/plugins` дає операторам змогу переглядати знайдені plugins і перемикати ввімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. Вимкнено за замовчуванням; увімкніть через `commands.plugins: true`.

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
- `/plugins install` встановлює з ClawHub, npm, git, локальних каталогів і архівів.
- `/plugins enable|disable` оновлює лише конфігурацію plugin; це не встановлює й не видаляє plugins.
- Зміни ввімкнення й вимкнення гаряче перезавантажують runtime-поверхні plugin у Gateway для нових ходів агента; встановлення запитує перезапуск Gateway, бо змінилися вихідні модулі plugin.

</Note>

## Нотатки щодо поверхонь

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Текстові команди** виконуються у звичайній чат-сесії (DM використовують спільну `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (цілиться в чат-сесію через `CommandTargetSessionKey`)
    - **`/stop`** цілиться в активну чат-сесію, щоб вона могла перервати поточний запуск.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` досі підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (ті самі назви, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: зареєструйте `/agentstatus` (не `/status`), бо Slack резервує `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії. `/side` — псевдонім.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- виконується як окремий одноразовий виклик **без інструментів**,
- не змінює майбутній контекст сесії,
- не записується в історію транскрипту,
- доставляється як живий побічний результат замість звичайного повідомлення асистента.

Це робить `/btw` корисним, коли потрібне тимчасове уточнення, поки основне завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Див. [Побічні запитання BTW](/uk/tools/btw), щоб дізнатися про повну поведінку й подробиці UX клієнта.

## Пов’язане

- [Створення Skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
