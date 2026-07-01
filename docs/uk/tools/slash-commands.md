---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
    - Розуміння того, як реєструються команди Skills
sidebarTitle: Slash commands
summary: Усі доступні слеш-команди, директиви та вбудовані скорочення — конфігурація, маршрутизація та поведінка для кожної поверхні.
title: Слеш-команди
x-i18n:
    generated_at: "2026-07-01T20:36:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway обробляє команди, надіслані як окремі повідомлення, що починаються з `/`.
Bash-команди лише для хоста використовують `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову прив’язано до ACP-сесії, звичайний текст маршрутизується до ACP
harness. Команди керування Gateway залишаються локальними: `/acp ...` завжди потрапляє
до обробника команд OpenClaw, а `/status` разом із `/unfocus` залишаються локальними, коли
обробку команд увімкнено для поверхні.

## Три типи команд

<CardGroup cols={3}>
  <Card title="Команди" icon="terminal">
    Окремі повідомлення `/...`, які обробляє Gateway. Мають бути надіслані як
    єдиний вміст повідомлення.
  </Card>
  <Card title="Директиви" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — вилучаються з повідомлення до того, як модель
    його побачить. Зберігають налаштування сесії, коли надіслані окремо; діють як вбудовані підказки,
    коли надіслані з іншим текстом.
  </Card>
  <Card title="Вбудовані скорочення" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — виконуються негайно та
    вилучаються до того, як модель побачить решту тексту. Лише для авторизованих відправників.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Докладно про поведінку директив">
    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У повідомленнях **лише з директивами** (повідомлення містить тільки директиви) вони
      зберігаються в сесії та відповідають підтвердженням.
    - У повідомленнях **звичайного чату** з іншим текстом вони діють як вбудовані підказки та
      **не** зберігають налаштування сесії.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`,
      використовується тільки цей список дозволів; інакше авторизація надходить із
      списків дозволів/сполучення каналу плюс `commands.useAccessGroups`. Неавторизовані
      відправники бачать директиви як звичайний текст.
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
  Умикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) текстові
  команди працюють навіть коли встановлено `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Auto: увімкнено для Discord/Telegram; вимкнено для Slack;
  ігнорується для провайдерів без нативної підтримки. Перевизначайте для кожного каналу через
  `channels.<provider>.commands.native`. У Discord `false` пропускає реєстрацію slash-command;
  раніше зареєстровані команди можуть залишатися видимими, доки їх не видалять.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди Skills нативно, коли це підтримується. Auto: увімкнено для
  Discord/Telegram; вимкнено для Slack. Перевизначайте через
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Умикає `! <cmd>` для запуску команд оболонки хоста (псевдонім `/bash <cmd>`). Потребує
  списків дозволів `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Як довго bash чекає перед перемиканням у фоновий режим (`0` переводить у фон
  негайно).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Умикає `/config` (читає/записує `openclaw.json`). Лише для власника.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Умикає `/mcp` (читає/записує MCP-конфігурацію, керовану OpenClaw, у `mcp.servers`). Лише для власника.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Умикає `/plugins` (виявлення/статус plugin плюс встановлення та ввімкнення/вимкнення). Записи лише для власника.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Умикає `/debug` (перевизначення конфігурації лише під час виконання). Лише для власника.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Умикає `/restart` і дії інструментів перезапуску gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Явний список дозволів власника для командних поверхонь лише для власника. Окремо від
  `commands.allowFrom` і доступу через DM-сполучення.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: вимагає ідентичності власника для команд лише для власника. Коли `true`,
  відправник має збігатися з `commands.ownerAllowFrom` або мати внутрішній scope `operator.admin`.
  Запис із wildcard у `allowFrom` **не** є достатнім.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як id власників відображаються в системному prompt.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-секрет, який використовується, коли `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Список дозволів для авторизації команд для кожного провайдера. Коли налаштовано, він є
  **єдиним** джерелом авторизації для команд і директив. Використовуйте `"*"` для
  глобального значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволів/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Команди надходять із трьох джерел:

- **Вбудовані команди ядра:** `src/auto-reply/commands-registry.shared.ts`
- **Згенеровані dock-команди:** `src/auto-reply/commands-registry.data.ts`
- **Команди Plugin:** виклики `registerCommand()` plugin

Доступність залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених
plugins.

### Команди ядра

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    | Команда | Опис |
    | --- | --- |
    | `/new [model]` | Архівувати поточну сесію та почати нову |
    | `/reset [soft [message]]` | Скинути поточну сесію на місці. `soft` зберігає transcript, відкидає повторно використані id сесій CLI backend і повторно запускає старт |
    | `/name <title>` | Назвати або перейменувати поточну сесію. Пропустіть назву, щоб побачити поточну назву та пропозицію |
    | `/compact [instructions]` | Стиснути контекст сесії. Див. [Compaction](/uk/concepts/compaction) |
    | `/stop` | Перервати поточний запуск |
    | `/session idle <duration\|off>` | Керувати закінченням строку простою прив’язки thread |
    | `/session max-age <duration\|off>` | Керувати закінченням максимального віку прив’язки thread |
    | `/export-session [path]` | Експортувати поточну сесію в HTML. Псевдонім: `/export` |
    | `/export-trajectory [path]` | Експортувати JSONL-пакет trajectory для поточної сесії. Псевдонім: `/trajectory` |

    <Note>
      Control UI перехоплює введене `/new`, щоб створити та перемкнутися на нову
      dashboard-сесію, окрім випадку, коли налаштовано `session.dmScope: "main"`
      і поточний батьківський елемент є головною сесією агента — у цьому разі `/new`
      скидає головну сесію на місці. Введене `/reset` усе одно виконує
      скидання Gateway на місці. Використовуйте `/model default`, коли хочете очистити закріплений
      вибір моделі сесії.
    </Note>

  </Accordion>

  <Accordion title="Керування моделлю та запуском">
    | Команда | Опис |
    | --- | --- |
    | `/think <level\|default>` | Установити рівень thinking або очистити перевизначення сесії. Псевдоніми: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Перемкнути докладний вивід. Псевдонім: `/v` |
    | `/trace on\|off` | Перемкнути вивід трасування plugin для поточної сесії |
    | `/fast [status\|auto\|on\|off\|default]` | Показати, установити або очистити швидкий режим |
    | `/reasoning [on\|off\|stream]` | Перемкнути видимість reasoning. Псевдонім: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Перемкнути elevated-режим. Псевдонім: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Показати або встановити стандартні значення exec |
    | `/login [codex\|openai\|openai-codex]` | Сполучити вхід Codex/OpenAI із приватного чату або Web UI-сесії. Лише власник/адміністратор |
    | `/model [name\|#\|status]` | Показати або встановити модель |
    | `/models [provider] [page] [limit=<n>\|all]` | Перелічити налаштованих/доступних для auth провайдерів або моделі |
    | `/queue <mode>` | Керувати поведінкою черги активного запуску. Див. [Черга](/uk/concepts/queue) і [Керування чергою](/uk/concepts/queue-steering) |
    | `/steer <message>` | Вставити вказівки в активний запуск. Псевдонім: `/tell`. Див. [Керування](/uk/tools/steer) |

    <AccordionGroup>
      <Accordion title="Безпека verbose / trace / fast / reasoning">
        - `/verbose` призначено для налагодження — тримайте його **вимкненим** під час звичайного використання.
        - `/trace` показує лише рядки trace/debug, що належать plugin; звичайний докладний шум залишається вимкненим.
        - `/fast auto|on|off` зберігає перевизначення сесії; використовуйте опцію `inherit` у Sessions UI, щоб його очистити.
        - `/fast` залежить від провайдера: OpenAI/Codex зіставляють його з `service_tier=priority`; прямі запити Anthropic зіставляють його з `service_tier=auto` або `standard_only`.
        - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях — вони можуть розкрити внутрішнє reasoning або діагностику plugin. Тримайте їх вимкненими в групових чатах.

      </Accordion>
      <Accordion title="Докладно про перемикання моделі">
        - `/model` негайно зберігає нову модель у сесії.
        - Якщо агент простоює, наступний запуск використовує її відразу.
        - Якщо запуск активний, перемикання позначається як очікуване та застосовується в наступній чистій точці повторної спроби.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Виявлення та статус">
    | Команда | Опис |
    | --- | --- |
    | `/help` | Показати короткий підсумок довідки |
    | `/commands` | Показати згенерований каталог команд |
    | `/tools [compact\|verbose]` | Показати, що поточний агент може використовувати просто зараз |
    | `/status` | Показати статус виконання/runtime, час безперервної роботи Gateway і системи, справність plugin, а також використання/квоту провайдера |
    | `/status plugins` | Показати детальну справність plugin: помилки завантаження, карантини, збої каналів, проблеми залежностей, повідомлення про сумісність |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Керувати довготривалою [ціллю](/uk/tools/goal) поточної сесії |
    | `/diagnostics [note]` | Потік звіту підтримки лише для власника. Щоразу запитує схвалення exec |
    | `/crestodian <request>` | Запустити помічник налаштування та ремонту Crestodian з DM власника |
    | `/tasks` | Перелічити активні/недавні фонові завдання для поточної сесії |
    | `/context [list\|detail\|map\|json]` | Пояснити, як збирається контекст |
    | `/whoami` | Показати ваш sender id. Псевдонім: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Керувати footer використання для кожної відповіді (`reset`/`inherit`/`clear`/`default` очищає перевизначення сесії для повторного успадкування налаштованого стандартного значення) або вивести локальний підсумок вартості |
  </Accordion>

  <Accordion title="Skills, списки дозволів, схвалення">
    | Команда | Опис |
    | --- | --- |
    | `/skill <name> [input]` | Запустити skill за назвою |
    | `/allowlist [list\|add\|remove] ...` | Керувати записами списку дозволів. Лише текст |
    | `/approve <id> <decision>` | Вирішити запити схвалення exec або plugin |
    | `/btw <question>` | Поставити побічне запитання без зміни контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw) |
  </Accordion>

  <Accordion title="Субагенти та ACP">
    | Команда | Опис |
    | --- | --- |
    | `/subagents list\|log\|info` | Переглянути запуски субагентів для поточного сеансу |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Керувати сеансами ACP і параметрами середовища виконання. Керування середовищем виконання потребує зовнішнього власника або внутрішньої адміністраторської ідентичності Gateway |
    | `/focus <target>` | Прив’язати поточний тред Discord або тему Telegram до цільового сеансу |
    | `/unfocus` | Видалити прив’язку поточного треду |
    | `/agents` | Показати агентів, прив’язаних до треду, для поточного сеансу |
  </Accordion>

  <Accordion title="Записи лише для власника та адміністрування">
    | Команда | Потребує | Опис |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Читати або записувати `openclaw.json`. Лише для власника |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Читати або записувати конфігурацію MCP-сервера, керовану OpenClaw. Лише для власника |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Переглядати або змінювати стан Plugin. Запис лише для власника. Псевдонім: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Перевизначення конфігурації лише в середовищі виконання. Лише для власника |
    | `/restart` | `commands.restart: true` (типово) | Перезапустити OpenClaw |
    | `/send on\|off\|inherit` | власник | Налаштувати політику надсилання |
  </Accordion>

  <Accordion title="Голос, TTS, керування каналом">
    | Команда | Опис |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Керувати TTS. Див. [TTS](/uk/tools/tts) |
    | `/activation mention\|always` | Налаштувати режим активації групи |
    | `/bash <command>` | Запустити команду оболонки хоста. Псевдонім: `! <command>`. Потребує `commands.bash: true` |
    | `!poll [sessionId]` | Перевірити фонове завдання bash |
    | `!stop [sessionId]` | Зупинити фонове завдання bash |
  </Accordion>
</AccordionGroup>

### Команди стикування

Команди стикування перемикають маршрут відповіді активного сеансу на інший пов’язаний канал.
Див. [Стикування каналів](/uk/concepts/channel-docking) щодо налаштування та усунення проблем.

Згенеровано з Plugin каналів із підтримкою нативних команд:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Команди стикування потребують `session.identityLinks`. Відправник-джерело та цільовий учасник
мають бути в одній групі ідентичності.

### Команди вбудованих Plugin

| Команда                                                                                      | Опис                                                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Увімкнути або вимкнути Dreaming пам’яті (власник або адміністратор Gateway). Див. [Dreaming](/uk/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Керувати сполученням пристроїв. Див. [Сполучення](/uk/channels/pairing)                |
| `/phone status\|arm ...\|disarm`                                                             | Тимчасово активувати високоризикові команди телефонного вузла                       |
| `/voice status\|list\|set <voiceId>`                                                         | Керувати конфігурацією голосу Talk. Нативна назва Discord: `/talkvoice`             |
| `/card ...`                                                                                  | Надсилати пресети розширених карток LINE. Див. [LINE](/uk/channels/line)               |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Керувати серверним застосунком harness Codex. Див. [Codex harness](/uk/plugins/codex-harness) |

Лише QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Команди Skills

Skills, які може викликати користувач, доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills можуть реєструватися як прямі команди (наприклад, `/prose` для OpenProse).
- Реєстрація нативних команд Skills керується `commands.nativeSkills` і
  `channels.<provider>.commands.nativeSkills`.
- Імена нормалізуються до `a-z0-9_` (макс. 32 символи); колізії отримують числові суфікси.

<AccordionGroup>
  <Accordion title="Маршрутизація команд Skills">
    Типово команди Skills спрямовуються до моделі як звичайний запит.

    Skills можуть оголосити `command-dispatch: tool`, щоб спрямовуватися безпосередньо до інструмента
    (детерміновано, без участі моделі). Приклад: `/prose` (Plugin OpenProse)
    — див. [OpenProse](/uk/prose).

  </Accordion>
  <Accordion title="Аргументи нативних команд">
    Discord використовує автодоповнення для динамічних параметрів і меню кнопок, коли обов’язкові
    аргументи пропущено. Telegram і Slack показують меню кнопок для команд із
    варіантами вибору. Динамічні варіанти визначаються відносно моделі цільового сеансу, тому специфічні для моделі
    параметри, як-от рівні `/think`, відповідають перевизначенню `/model` сеансу.
  </Accordion>
</AccordionGroup>

## `/tools` — що агент може використовувати зараз

`/tools` відповідає на питання середовища виконання: **що цей агент може використовувати прямо зараз у цій
розмові** — не статичний каталог конфігурації.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Результати обмежені сеансом. Зміна агента, каналу, треду, авторизації
відправника або моделі може змінити вивід. Для редагування профілю та перевизначень
використовуйте панель Control UI Tools або поверхні конфігурації.

## `/model` — вибір моделі

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

У Discord `/model` і `/models` відкривають інтерактивний вибір із випадаючими списками провайдера та
моделі. Вибір враховує `agents.defaults.models`, включно із
записами `provider/*`.

## `/config` — записи конфігурації на диск

<Note>
  Лише для власника. Типово вимкнено — увімкніть через `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Конфігурація перевіряється перед записом. Некоректні зміни відхиляються. Оновлення `/config`
зберігаються після перезапусків.

## `/mcp` — конфігурація MCP-сервера

<Note>
  Лише для власника. Типово вимкнено — увімкніть через `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту вбудованого агента.

## `/debug` — перевизначення лише в середовищі виконання

<Note>
  Лише для власника. Типово вимкнено — увімкніть через `commands.debug: true`.
  Перевизначення негайно застосовуються до нових читань конфігурації, але **не** записуються на диск.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — керування Plugin

<Note>
  Запис лише для власника. Типово вимкнено — увімкніть через `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` оновлює конфігурацію Plugin і гаряче перезавантажує середовище виконання Plugin Gateway
для нових ходів агента. `/plugins install` автоматично перезапускає керовані
Gateway, оскільки змінилися вихідні модулі Plugin.

## `/trace` — вивід трасування Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` показує рядки трасування/налагодження Plugin, обмежені сеансом, без повного докладного
режиму. Він не замінює `/debug` (перевизначення середовища виконання) або `/verbose` (звичайний
вивід інструментів).

## `/btw` — побічні запитання

`/btw` — це швидке побічне запитання про контекст поточного сеансу. Псевдонім: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

На відміну від звичайного повідомлення:

- Використовує поточний сеанс як фоновий контекст.
- У сеансах Codex harness запускається як ефемерний побічний тред Codex.
- **Не** змінює майбутній контекст сеансу.
- Не записується в історію транскрипту.

Див. [Побічні запитання BTW](/uk/tools/btw) для повної поведінки.

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Область сеансу для кожної поверхні">
    - **Текстові команди:** виконуються у звичайному чат-сеансі (DM використовують спільний `main`, групи мають власний сеанс).
    - **Нативні команди Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Нативні команди Slack:** `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
    - **Нативні команди Telegram:** `telegram:slash:<userId>` (цілять у чат-сеанс через `CommandTargetSessionKey`)
    - **`/login codex`** надсилає коди сполучення пристрою лише через приватний чат або шляхи відповіді Web UI. Виклики з груп/тем Telegram просять власника натомість написати боту в DM.
    - **`/stop`** цілять в активний чат-сеанс, щоб перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` підтримує одну команду в стилі `/openclaw`.
    З `commands.native: true` створіть по одній slash-команді Slack для кожної вбудованої
    команди. Зареєструйте `/agentstatus` (не `/status`), оскільки Slack резервує
    `/status`. Текстова `/status` все одно працює в повідомленнях Slack.
  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - Повідомлення, що містять лише команду, від дозволених відправників обробляються негайно (в обхід черги + моделі).
    - Вбудовані скорочення (`/help`, `/commands`, `/status`, `/whoami`) також працюють усередині звичайних повідомлень і вилучаються до того, як модель побачить решту тексту.
    - Неавторизовані повідомлення, що містять лише команду, мовчки ігноруються; вбудовані токени `/...` трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Примітки щодо аргументів">
    - Команди приймають необов’язковий `:` між командою та аргументами (`/think: high`, `/send: on`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст трактується як тіло повідомлення.
    - `/allowlist add|remove` потребує `commands.config: true` і враховує `configWrites` каналу.

  </Accordion>
</AccordionGroup>

## Використання та статус провайдера

- **Використання/квота провайдера** (наприклад, "Claude 80% left") показується в `/status` для провайдера поточної моделі, коли відстеження використання ввімкнено.
- **Рядки токенів/кешу** в `/status` можуть відступати до останнього запису використання з транскрипту, коли живий знімок сеансу неповний.
- **Виконання проти середовища виконання:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто запускає сеанс: `OpenClaw Default`, `OpenAI Codex`, бекенд CLI або бекенд ACP.
- **Токени/вартість на відповідь:** керується через `/usage off|tokens|full`.
- `/model status` стосується моделей/автентифікації/endpoint, а не використання.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Як реєструються та обмежуються slash-команди Skills.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть Skill, який реєструє власну slash-команду.
  </Card>
  <Card title="BTW" href="/uk/tools/btw" icon="comments">
    Побічні запитання без зміни контексту сеансу.
  </Card>
  <Card title="Steer" href="/uk/tools/steer" icon="compass">
    Керуйте агентом під час виконання через `/steer`.
  </Card>
</CardGroup>
