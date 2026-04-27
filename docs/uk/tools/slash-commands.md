---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
sidebarTitle: Slash commands
summary: 'Слеш-команди: текстові чи нативні, конфігурація та підтримувані команди'
title: Слеш-команди
x-i18n:
    generated_at: "2026-04-27T21:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0d9d28e74cd81d0484990dab6a4c83ea03a84d267f78f0488c53552ddcba38
    source_path: tools/slash-commands.md
    workflow: 15
---

Команди обробляє Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, яке починається з `/`. Чат-команда bash лише для хоста використовує `! <cmd>` (із псевдонімом `/bash <cmd>`).

Коли розмова або гілка прив’язана до сеансу ACP, звичайний подальший текст маршрутизується до цього ACP harness. Команди керування Gateway усе одно залишаються локальними: `/acp ...` завжди потрапляє до обробника команд OpenClaw ACP, а `/status` і `/unfocus` залишаються локальними всюди, де для цієї поверхні ввімкнено обробку команд.

Є дві пов’язані системи:

<AccordionGroup>
  <Accordion title="Команди">
    Окремі повідомлення `/...`.
  </Accordion>
  <Accordion title="Директиви">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Директиви видаляються з повідомлення до того, як його побачить модель.
    - У звичайних чат-повідомленнях (не лише з директивами) вони розглядаються як «вбудовані підказки» і **не** зберігають налаштування сеансу.
    - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сеансі та повертають підтвердження.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується лише цей список дозволених; інакше авторизація визначається списками дозволених каналу/спарюванням і `commands.useAccessGroups`. Для неавторизованих відправників директиви обробляються як звичайний текст.

  </Accordion>
  <Accordion title="Вбудовані скорочення">
    Лише для відправників зі списку дозволених/авторизованих: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Вони виконуються негайно, видаляються до того, як повідомлення побачить модель, а решта тексту проходить звичайним шляхом.

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
  Вмикає розбір `/...` у чат-повідомленнях. На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо встановити `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (поки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки. Щоб перевизначити для конкретного провайдера, установіть `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native` (bool або `"auto"`). Значення `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє нативно команди **Skill**, якщо це підтримується. Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створити slash-команду для кожного Skill). Щоб перевизначити для конкретного провайдера, установіть `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills` (bool або `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для виконання команд shell на хості (`/bash <cmd>` — псевдонім; потрібні списки дозволених `tools.elevated`).
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
  Вмикає `/plugins` (виявлення/стан плагінів, а також встановлення й елементи керування ввімкненням/вимкненням).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (лише перевизначення під час виконання).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart`, а також дії інструментів перезапуску gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Задає явний список дозволених для власника для поверхонь команд/інструментів лише для власника. Окремо від `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: змушує команди лише для власника вимагати **ідентичність власника** для виконання на цій поверхні. Якщо `true`, відправник має або відповідати визначеному кандидату у власники (наприклад, запису в `commands.ownerAllowFrom` або нативним метаданим власника провайдера), або мати внутрішню область дії `operator.admin` на внутрішньому каналі повідомлень. Запис-шаблон у `allowFrom` каналу або порожній/невизначений список кандидатів у власники **не** є достатнім — команди лише для власника в цьому каналі за замовчуванням блокуються. Залиште це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише `ownerAllowFrom` і стандартними списками дозволених для команд.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника відображаються в system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Список дозволених за провайдером для авторизації команд. Якщо налаштовано, це єдине джерело авторизації для команд і директив (списки дозволених каналу/спарювання та `commands.useAccessGroups` ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі конкретних провайдерів мають вищий пріоритет.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Поточне джерело істини:

- вбудовані базові команди походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди dock походять із `src/auto-reply/commands-registry.data.ts`
- команди плагінів походять із викликів `registerCommand()` плагінів
- фактична доступність у вашому gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених плагінів

### Вбудовані базові команди

<AccordionGroup>
  <Accordion title="Сеанси та запуски">
    - `/new [model]` запускає новий сеанс; `/reset` — псевдонім для скидання.
    - `/reset soft [message]` зберігає поточний transcript, скидає повторно використані ідентифікатори сеансів CLI backend і повторно запускає завантаження startup/system prompt на місці.
    - `/compact [instructions]` стискає контекст сеансу. Див. [Compaction](/uk/concepts/compaction).
    - `/stop` перериває поточний запуск.
    - `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки до гілки.
    - `/export-session [path]` експортує поточний сеанс у HTML. Псевдонім: `/export`.
    - `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточного сеансу. Псевдонім: `/trajectory`.
  </Accordion>
  <Accordion title="Модель і керування запуском">
    - `/think <level>` задає рівень мислення. Варіанти надходять із профілю провайдера активної моделі; поширені рівні — `off`, `minimal`, `low`, `medium` і `high`, а також користувацькі рівні, як-от `xhigh`, `adaptive`, `max`, або двійкове `on` лише там, де це підтримується. Псевдоніми: `/thinking`, `/t`.
    - `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
    - `/trace on|off` перемикає вивід трасування плагіна для поточного сеансу.
    - `/fast [status|on|off]` показує або задає швидкий режим.
    - `/reasoning [on|off|stream]` перемикає видимість міркувань. Псевдонім: `/reason`.
    - `/elevated [on|off|ask|full]` перемикає режим elevated. Псевдонім: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
    - `/model [name|#|status]` показує або задає модель.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
    - `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`), а також параметрами на кшталт `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="Виявлення та стан">
    - `/help` показує короткий довідковий підсумок.
    - `/commands` показує згенерований каталог команд.
    - `/tools [compact|verbose]` показує, що поточний агент може використовувати просто зараз.
    - `/status` показує стан виконання/середовища виконання, включно з мітками `Execution`/`Runtime` і використанням/квотою провайдера, якщо доступно.
    - `/crestodian <request>` запускає помічник налаштування та відновлення Crestodian із DM власника.
    - `/tasks` перелічує активні/нещодавні фонові завдання для поточного сеансу.
    - `/context [list|detail|json]` пояснює, як збирається контекст.
    - `/whoami` показує ваш ідентифікатор відправника. Псевдонім: `/id`.
    - `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або виводить локальний підсумок вартості.
  </Accordion>
  <Accordion title="Skills, списки дозволених, схвалення">
    - `/skill <name> [input]` запускає Skill за назвою.
    - `/allowlist [list|add|remove] ...` керує записами списку дозволених. Лише текст.
    - `/approve <id> <decision>` обробляє запити на схвалення exec.
    - `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сеансу. Див. [BTW](/uk/tools/btw).
  </Accordion>
  <Accordion title="Subagents і ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточного сеансу.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сеансами ACP і параметрами середовища виконання.
    - `/focus <target>` прив’язує поточну гілку Discord або тему/розмову Telegram до цільового сеансу.
    - `/unfocus` видаляє поточну прив’язку.
    - `/agents` перелічує агентів, прив’язаних до гілки, для поточного сеансу.
    - `/kill <id|#|all>` перериває один або всі запущені sub-agent.
    - `/steer <id|#> <message>` надсилає керування запущеному sub-agent. Псевдонім: `/tell`.
  </Accordion>
  <Accordion title="Запис лише для власника та адміністрування">
    - `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потрібно `commands.config: true`.
    - `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потрібно `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан плагіна. `/plugin` — псевдонім. Запис — лише для власника. Потрібно `commands.plugins: true`.
    - `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише під час виконання. Лише для власника. Потрібно `commands.debug: true`.
    - `/restart` перезапускає OpenClaw, якщо ввімкнено. Типово: увімкнено; установіть `commands.restart: false`, щоб вимкнути.
    - `/send on|off|inherit` задає політику надсилання. Лише для власника.
  </Accordion>
  <Accordion title="Голос, TTS, керування каналом">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` керує TTS. Див. [TTS](/uk/tools/tts).
    - `/activation mention|always` задає режим активації групи.
    - `/bash <command>` запускає команду shell на хості. Лише текст. Псевдонім: `! <command>`. Потрібно `commands.bash: true` і списки дозволених `tools.elevated`.
    - `!poll [sessionId]` перевіряє фонове завдання bash.
    - `!stop [sessionId]` зупиняє фонове завдання bash.
  </Accordion>
</AccordionGroup>

### Згенеровані команди dock

Команди dock генеруються з плагінів каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Використовуйте команди dock із прямого чату, щоб перемкнути маршрут відповіді поточного сеансу на інший пов’язаний канал. Відправник джерела й цільовий співрозмовник мають бути в одній групі `session.identityLinks`, наприклад `["telegram:123", "discord:456"]`.

### Команди вбудованих плагінів

Вбудовані плагіни можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає memory dreaming. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком спарювання/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди phone node.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord назва нативної команди — `/talkvoice`.
- `/card ...` надсилає попередньо налаштовані rich card для LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє та керує вбудованим app-server harness Codex. Див. [Codex harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skill

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли Skill/плагін їх реєструє.
- Реєстрація нативних команд Skill керується `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Нотатки про аргументи та парсер">
    - Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
    - Для повного розподілу використання провайдера використовуйте `openclaw status --usage`.
    - `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
    - У багатoоблікових каналах орієнтовані на конфігурацію `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
    - `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` виводить локальний підсумок вартості з журналів сеансу OpenClaw.
    - `/restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб вимкнути його.
    - `/plugins install <spec>` приймає ті самі специфікації плагінів, що й `openclaw plugins install`: локальний шлях/архів, npm package або `clawhub:<pkg>`.
    - `/plugins enable|disable` оновлює конфігурацію плагіна й може запропонувати перезапуск.
  </Accordion>
  <Accordion title="Поведінка для конкретних каналів">
    - Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (недоступна як текст). `join` потребує guild і вибраного голосового/stage-каналу. Потрібні `channels.discord.voice` і нативні команди.
    - Команди прив’язки до гілки Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) вимагають, щоб ефективні прив’язки до гілки були ввімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
    - Довідник команд ACP і поведінка середовища виконання: [ACP agents](/uk/tools/acp-agents).
  </Accordion>
  <Accordion title="Безпека verbose / trace / fast / reasoning">
    - `/verbose` призначено для налагодження й додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
    - `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать плагіну, і не вмикає звичайний докладний вивід інструментів.
    - `/fast on|off` зберігає перевизначення для сеансу. Щоб очистити його й повернутися до значень конфігурації за замовчуванням, використовуйте опцію `inherit` в інтерфейсі Sessions.
    - `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних endpoints Responses, тоді як прямі публічні запити Anthropic, зокрема трафік з автентифікацією OAuth, надісланий до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
    - Підсумки збоїв інструментів усе одно показуються, коли це доречно, але детальний текст збою включається лише коли `/verbose` має значення `on` або `full`.
    - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішні міркування, вивід інструментів або діагностику плагіна, яку ви не планували показувати. Краще залишати їх вимкненими, особливо в групових чатах.
  </Accordion>
  <Accordion title="Перемикання моделі">
    - `/model` негайно зберігає нову модель сеансу.
    - Якщо агент неактивний, наступний запуск одразу її використає.
    - Якщо запуск уже активний, OpenClaw позначає живе перемикання як відкладене й перезапускає на новій моделі лише в чистій точці повторної спроби.
    - Якщо активність інструмента або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до пізнішої можливості повторної спроби або до наступного ходу користувача.
    - У локальному TUI, `/crestodian [request]` повертає з нормального TUI агента до Crestodian. Це окремо від режиму порятунку каналу повідомлень і не надає віддалених повноважень на зміну конфігурації.
  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - **Швидкий шлях:** повідомлення лише з командами від відправників зі списку дозволених обробляються негайно (в обхід черги й моделі).
    - **Обмеження згадкою в групі:** повідомлення лише з командами від відправників зі списку дозволених обходять вимоги щодо згадки.
    - **Вбудовані скорочення (лише для відправників зі списку дозволених):** деякі команди також працюють, коли вбудовані в звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
      - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту проходить звичайним шляхом.
    - Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.
  </Accordion>
  <Accordion title="Команди Skill і аргументи нативних команд">
    - **Команди Skill:** Skills із `user-invocable` доступні як slash-команди. Назви санітизуються до `a-z0-9_` (максимум 32 символи); для колізій додаються числові суфікси (наприклад, `_2`).
      - `/skill <name> [input]` запускає Skill за назвою (корисно, коли обмеження нативних команд не дозволяють мати окрему команду для кожного Skill).
      - За замовчуванням команди Skill пересилаються моделі як звичайний запит.
      - Skills можуть за бажанням оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
      - Приклад: `/prose` (плагін OpenProse) — див. [OpenProse](/uk/prose).
    - **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних параметрів (і меню кнопок, коли ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент. Динамічні варіанти визначаються відносно цільової моделі сеансу, тому специфічні для моделі параметри, як-от рівні `/think`, дотримуються перевизначення `/model` цього сеансу.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` відповідає на запитання про середовище виконання, а не про конфігурацію: **що цей агент може використовувати прямо зараз у цій розмові**.

- Типовий `/tools` — компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні з нативними командами, які підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сеансу, тому зміна агента, каналу, гілки, авторизації відправника або моделі може змінити вивід.
- `/tools` включає інструменти, які справді доступні під час виконання, зокрема базові інструменти, інструменти підключених плагінів і інструменти, що належать каналу.

Для редагування профілів і перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу, а не розглядайте `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (приклад: "Claude 80% left") з’являється в `/status` для поточного провайдера моделі, коли відстеження використання ввімкнено. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax поля відсотка, що містять лише залишок, інвертуються перед показом, а відповіді `model_remains` надають перевагу запису chat-model плюс мітці тарифного плану з тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання transcript, коли живий знімок сеансу розріджений. Наявні ненульові живі значення все одно мають пріоритет, а fallback до transcript також може відновити мітку активної моделі середовища виконання плюс більший загальний показник, орієнтований на prompt, коли збережені підсумки відсутні або менші.
- **Execution проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто фактично виконує сеанс: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend або ACP backend.
- **Токени/вартість для кожної відповіді** керуються через `/usage off|tokens|full` (додаються до звичайних відповідей).
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

- `/model` і `/model list` показують компактний, пронумерований засіб вибору (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний засіб вибору зі спадними списками провайдера й моделі та кроком Submit.
- `/model <#>` вибирає з цього засобу вибору (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує докладний вигляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), якщо доступно.

## Перевизначення налагодження

`/debug` дає змогу задавати **перевизначення конфігурації лише під час виконання** (пам’ять, не диск). Лише для власника. Типово вимкнено; увімкніть через `commands.debug: true`.

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

## Вивід trace плагіна

`/trace` дає змогу перемикати **рядки trace/debug плагіна в межах сеансу** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Нотатки:

- `/trace` без аргументу показує поточний стан trace для сеансу.
- `/trace on` вмикає рядки trace плагіна для поточного сеансу.
- `/trace off` знову їх вимикає.
- Рядки trace плагіна можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує перевизначеннями конфігурації лише під час виконання.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу все ще належить `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. Типово вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Перед записом конфігурація проходить перевірку; недійсні зміни відхиляються. Оновлення `/config` зберігаються після перезапуску.
</Note>

## Оновлення MCP

`/mcp` записує визначення MCP-серверів, якими керує OpenClaw, у `mcp.servers`. Лише для власника. Типово вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi. Адаптери середовища виконання вирішують, які транспорти справді можна виконати.
</Note>

## Оновлення плагінів

`/plugins` дає змогу операторам перевіряти виявлені плагіни й перемикати стан увімкнення в конфігурації. Для сценаріїв лише читання можна використовувати `/plugin` як псевдонім. Типово вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` і `/plugins show` використовують реальне виявлення плагінів відносно поточного робочого простору та конфігурації на диску.
- `/plugins enable|disable` оновлює лише конфігурацію плагіна; він не встановлює й не видаляє плагіни.
- Після змін `enable/disable` перезапустіть gateway, щоб застосувати їх.
</Note>

## Нотатки про поверхні

<AccordionGroup>
  <Accordion title="Сеанси для кожної поверхні">
    - **Текстові команди** виконуються у звичайному чат-сеансі (DM використовують спільний `main`, групи мають власний сеанс).
    - **Нативні команди** використовують ізольовані сеанси:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс можна налаштувати через `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (націлюється на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** націлюється на активний чат-сеанс, щоб можна було перервати поточний запуск.
  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` досі підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (з тими самими назвами, що й у `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.

    Виняток для нативних команд Slack: реєструйте `/agentstatus` (а не `/status`), тому що Slack резервує `/status`. Текстова `/status` у повідомленнях Slack усе одно працює.

  </Accordion>
</AccordionGroup>

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточного сеансу.

На відміну від звичайного чату:

- воно використовує поточний сеанс як фоновий контекст,
- воно виконується як окремий одноразовий виклик **без інструментів**,
- воно не змінює майбутній контекст сеансу,
- воно не записується в історію transcript,
- воно доставляється як живий побічний результат, а не як звичайне повідомлення асистента.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основне завдання триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [BTW Side Questions](/uk/tools/btw), щоб дізнатися повну поведінку та подробиці UX клієнта.

## Пов’язане

- [Створення Skills](/uk/tools/creating-skills)
- [Skills](/uk/tools/skills)
- [Конфігурація Skills](/uk/tools/skills-config)
