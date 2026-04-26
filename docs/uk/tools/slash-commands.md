---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові проти нативних, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-04-26T08:15:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`. Команда чату bash лише для хоста використовує `! <cmd>` (з псевдонімом `/bash <cmd>`).

Коли розмову або тред прив’язано до сесії ACP, звичайний подальший текст маршрутизується до цього harness ACP. Команди керування Gateway все одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними щоразу, коли для цієї поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У звичайних повідомленнях чату (не лише з директивами) вони трактуються як "вбудовані підказки" і **не** зберігають налаштування сесії.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії та повертають підтвердження.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується лише цей список дозволу; інакше авторизація походить зі списків дозволу каналу/прив’язки плюс `commands.useAccessGroups`. Для неавторизованих відправників директиви трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Лише для відправників зі списку дозволу/авторизованих: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте слеш-команди); ігнорується для провайдерів без нативної підтримки. Щоб перевизначити для окремого провайдера, задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native` (bool або `"auto"`). Значення `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються у застосунку Slack і не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди **Skills** нативно, коли це підтримується. Авто: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створити слеш-команду для кожного skill). Щоб перевизначити для окремого провайдера, задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills` (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску shell-команд хоста (`/bash <cmd>` — псевдонім; потребує списків дозволу `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Керує тим, скільки часу bash чекає перед переходом у фоновий режим (`0` одразу переводить у фон).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує конфігурацію MCP, якою керує OpenClaw, у `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус plugin-ів, а також керування встановленням і ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (лише перевизначення під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart`, а також дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Встановлює явний список дозволу власника для поверхонь команд/інструментів, доступних лише власнику. Окремо від `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для виконання на цій поверхні. Якщо `true`, відправник має або відповідати визначеному кандидату у власники (наприклад, запису в `commands.ownerAllowFrom` або нативним метаданим власника провайдера), або мати внутрішню область доступу `operator.admin` на внутрішньому каналі повідомлень. Підстановний запис у `allowFrom` каналу або порожній/невизначений список кандидатів у власники **не** є достатнім — команди лише для власника в цьому каналі забороняються за замовчуванням. Залишайте це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише `ownerAllowFrom` і стандартними списками дозволу команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника відображаються в системному prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  За потреби задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволу для авторизації команд за провайдером. Якщо налаштовано, це єдине джерело авторизації для команд і директив (списки дозволу каналу/прив’язки та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі для конкретних провайдерів мають пріоритет.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволу/політики до команд, якщо `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані core-команди походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди походять із `src/auto-reply/commands-registry.data.ts`
- команди plugin-ів походять із викликів `registerCommand()` у plugin-ах
- фактична доступність у вашому gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugin-ів

### Вбудовані команди core

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    - `/new [model]` запускає нову сесію; `/reset` — псевдонім для скидання.
    - `/reset soft [message]` зберігає поточний transcript, скидає повторно використані ідентифікатори сесій CLI backend і повторно запускає завантаження startup/system-prompt на місці.
    - `/compact [instructions]` стискає контекст сесії. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки до треду.
    - `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Псевдонім: `/trajectory`.
  </Accordion>
  <Accordion title="Модель і керування запуском">
    - `/think <level>` задає рівень мислення. Варіанти надходять із профілю провайдера активної моделі; поширені рівні: `off`, `minimal`, `low`, `medium` і `high`, а також спеціальні рівні на кшталт `xhigh`, `adaptive`, `max` або бінарний `on` лише там, де це підтримується. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування plugin-ів для поточної сесії.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає значення exec за замовчуванням.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`), а також параметрами на кшталт `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="Виявлення та статус">
    - `/help` показує короткий довідковий підсумок.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, чим поточний агент може користуватися прямо зараз.
    - `/status` показує статус виконання/середовища виконання, зокрема мітки `Execution`/`Runtime` і використання/квоти провайдера, якщо доступно.
    - `/crestodian <request>` запускає помічник налаштування й відновлення Crestodian із приватного повідомлення власника.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточної сесії.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або виводить локальний підсумок вартості.
  </Accordion>
  <Accordion title="Skills, списки дозволу, підтвердження">
    - `/skill <name> [input]` запускає skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволу. Лише текстовий режим.
    - `/approve <id> <decision>` обробляє запити на підтвердження exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [BTW](/uk/tools/btw).
  </Accordion>
  <Accordion title="Subagent-и та ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками subagent-ів для поточної сесії.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і параметрами середовища виконання.
    - `/focus <target>` прив’язує поточний тред Discord або тему/розмову Telegram до цільової сесії.
    - `/unfocus` знімає поточну прив’язку.
    - `/agents` перелічує агентів, прив’язаних до треду, для поточної сесії.
    - `/kill <id|#|all>` перериває один або всі запущені subagent-и.
    - `/steer <id|#> <message>` надсилає керуюче повідомлення до запущеного subagent-а. Псевдонім: `/tell`.
  </Accordion>
  <Accordion title="Запис і адміністрування лише для власника">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію сервера MCP, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан plugin-ів. `/plugin` — псевдонім. Запис — лише для власника. Потребує `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише під час виконання. Лише для власника. Потребує `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, якщо ввімкнено. За замовчуванням: увімкнено; щоб вимкнути, задайте `commands.restart: false`.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.
  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає shell-команду хоста. Лише текстовий режим. Псевдонім: `! <command>`. Потребує `commands.bash: true` і списків дозволу `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.
  </Accordion>
</AccordionGroup>

### Згенеровані dock-команди

Dock-команди генеруються з channel plugin-ів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

### Команди вбудованих plugin-ів

Вбудовані plugin-и можуть додавати більше слеш-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком прив’язки/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди вузла телефону.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає набори rich card для LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє та керує вбудованим harness app-server Codex. Див. [Codex harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди skill-ів

Skills, які може викликати користувач, також доступні як слеш-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли їх реєструє skill/plugin.
- реєстрація нативних команд skill-ів керується через `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Нотатки щодо аргументів і парсера">
    - Команди приймають необов’язковий `:` між командою та аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст трактується як тіло повідомлення.
    - Для повного розподілу використання за провайдерами використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У каналах із кількома обліковими записами `/allowlist --account <id>`, націлений на конфігурацію, і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` виводить локальний підсумок вартості з логів сесій OpenClaw.
    - `/restart` увімкнено за замовчуванням; щоб вимкнути, задайте `commands.restart: false`.
    - `/plugins install <spec>` приймає ті самі специфікації plugin-ів, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію plugin-ів і може запросити перезапуск.
  </Accordion>
  <Accordion title="Поведінка для конкретних каналів">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текстова команда). `join` потребує guild і вибраного голосового/stage-каналу. Потребує `channels.discord.voice` і нативних команд.
    - Команди прив’язки до тредів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні прив’язки до тредів були ввімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [ACP agents](/uk/tools/acp-agents).
  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
    - `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать plugin-ам, і не вмикає звичайну докладну балаканину інструментів.
    - `/fast on|off` зберігає перевизначення сесії. Щоб очистити його й повернутися до значень конфігурації за замовчуванням, використовуйте опцію `inherit` в інтерфейсі Sessions.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних ендпоінтах Responses, тоді як прямі публічні запити Anthropic, зокрема трафік з автентифікацією OAuth, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки помилок інструментів усе одно показуються, коли це доречно, але детальний текст помилки включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику plugin-ів, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.
  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сесії.
    - Якщо агент неактивний, наступний запуск одразу її використовує.
    - Якщо запуск уже активний, OpenClaw позначає живе перемикання як відкладене і перезапускає з новою моделлю лише в чистій точці повторної спроби.
    - Якщо активність інструментів або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до пізнішої можливості повторної спроби або до наступного ходу користувача.
    - У локальному TUI `/crestodian [request]` повертає зі звичайного TUI агента до Crestodian. Це окремо від режиму порятунку каналу повідомлень і не надає віддалених повноважень на зміну конфігурації.
  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволу обробляються негайно (обхід черги + моделі).
    - **Обмеження згадкою в групі:** повідомлення лише з командами від відправників зі списку дозволу обходять вимоги згадки.
    - **Вбудовані скорочення (лише для відправників зі списку дозволу):** деякі команди також працюють, коли вони вбудовані у звичайне повідомлення, і вилучаються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту продовжує проходити звичайним потоком.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` трактуються як звичайний текст.
  </Accordion>
  <Accordion title="Команди skill-ів і аргументи нативних команд">
    - **Команди skill-ів:** skills типу `user-invocable` доступні як слеш-команди. Імена нормалізуються до `a-z0-9_` (макс. 32 символи); у разі колізій додаються числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження нативних команд не дозволяють мати окрему команду для кожного skill-а).
      - За замовчуванням команди skill-ів пересилаються моделі як звичайний запит.
      - Skills можуть за бажанням оголосити `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (plugin OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і кнопкові меню, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують кнопкове меню, коли команда підтримує варіанти вибору, а ви пропускаєте аргумент. Динамічні варіанти вибору визначаються відносно моделі цільової сесії, тож параметри, залежні від моделі, як-от рівні `/think`, слідують за перевизначенням `/model` цієї сесії.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на питання про середовище виконання, а не про конфігурацію: **чим цей агент може користуватися прямо зараз у цій розмові**.

- Типове `/tools` є компактним і оптимізованим для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні з нативними командами, які підтримують аргументи, надають той самий перемикач режимів `compact|verbose`.
- Результати прив’язані до сесії, тому зміна агента, каналу, треду, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які реально доступні під час виконання, зокрема core-інструменти, інструменти під’єднаних plugin-ів і інструменти, що належать каналу.

Для редагування профілів і перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу, а не сприймайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (наприклад, "Claude 80% left") відображається в `/status` для провайдера поточної моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax поля відсотка лише залишку інвертуються перед показом, а відповіді `model_remains` віддають перевагу запису chat-моделі разом із міткою плану, позначеною моделлю.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання transcript-а, якщо живий знімок сесії неповний. Наявні ненульові живі значення все одно мають пріоритет, а резервне використання transcript-а також може відновити мітку активної моделі середовища виконання та більший сумарний обсяг, орієнтований на prompt, коли збережені підсумки відсутні або менші.
- **Execution проти Runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично виконує сесію: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість для кожної відповіді** керуються через `/usage off|tokens|full` (додаються до звичайних відповідей).
- `/model status` стосується **моделей/auth/ендпоінтів**, а не використання.

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

- `/model` і `/model list` показують компактний нумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний засіб вибору з випадними списками провайдерів і моделей, а також кроком Submit.
- `/model <#>` вибирає з цього засобу вибору (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує докладний вигляд, зокрема налаштований ендпоінт провайдера (`baseUrl`) і режим API (`api`), якщо доступно.

## Перевизначення налагодження

`/debug` дає змогу задавати перевизначення конфігурації **лише під час виконання** (пам’ять, не диск). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

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

## Вивід trace plugin-ів

`/trace` дає змогу перемикати **рядки trace/debug plugin-ів у межах сесії** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Нотатки:

- `/trace` без аргументу показує поточний стан trace для сесії.
- `/trace on` вмикає рядки trace plugin-ів для поточної сесії.
- `/trace off` знову їх вимикає.
- Рядки trace plugin-ів можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` як і раніше керує перевизначеннями конфігурації лише під час виконання.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу все ще належить до `/verbose`.

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
Перед записом конфігурація проходить валідацію; неприпустимі зміни відхиляються. Оновлення `/config` зберігаються після перезапуску.
</Note>

## Оновлення MCP

`/mcp` записує визначення серверів MCP, якими керує OpenClaw, у `mcp.servers`. Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi. Адаптери середовища виконання вирішують, які транспорти реально можна виконувати.
</Note>

## Оновлення plugin-ів

`/plugins` дає операторам змогу перевіряти виявлені plugin-и та перемикати їх увімкнення в конфігурації. Для сценаріїв лише читання можна використовувати `/plugin` як псевдонім. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення plugin-ів у поточному робочому просторі разом із конфігурацією на диску.
- `/plugins enable|disable` оновлює лише конфігурацію plugin-ів; воно не встановлює й не видаляє plugin-и.
- Після змін `enable/disable` перезапустіть gateway, щоб застосувати їх.
</Note>

## Нотатки щодо поверхонь

<AccordionGroup>
  <Accordion title="Сесії для кожної поверхні">
    - **Текстові команди** виконуються у звичайній сесії чату (приватні повідомлення спільно використовують `main`, групи мають власну сесію).
    - **Нативні команди** використовують ізольовані сесії:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (націлюється на сесію чату через `CommandTargetSessionKey`)
    - **`/stop`** націлюється на активну сесію чату, щоб можна було перервати поточний запуск.
  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` усе ще підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну слеш-команду Slack для кожної вбудованої команди (з тими самими назвами, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: реєструйте `/agentstatus` (а не `/status`), оскільки Slack резервує `/status`. Текстова команда `/status` у повідомленнях Slack усе одно працює.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- виконується як окремий одноразовий виклик **без інструментів**,
- не змінює майбутній контекст сесії,
- не записується в історію transcript,
- доставляється як живий побічний результат, а не як звичайне повідомлення асистента.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [BTW Side Questions](/uk/tools/btw) для повного опису поведінки та деталей UX клієнта.

## Пов’язане

- [Створення skill-ів](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
