---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
    - Розуміння того, як реєструються команди Skills
sidebarTitle: Slash commands
summary: Усі доступні slash-команди, директиви та вбудовані скорочення — конфігурація, маршрутизація та поведінка для кожної поверхні.
title: Команди зі слешем
x-i18n:
    generated_at: "2026-06-27T18:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway обробляє команди, надіслані як окремі повідомлення, що починаються з `/`.
Bash-команди лише для хоста використовують `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову прив’язано до ACP-сеансу, звичайний текст спрямовується до ACP
harness. Команди керування Gateway залишаються локальними: `/acp ...` завжди потрапляє
до обробника команд OpenClaw, а `/status` і `/unfocus` залишаються локальними щоразу,
коли для поверхні ввімкнено обробку команд.

## Три типи команд

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Окремі повідомлення `/...`, які обробляє Gateway. Вони мають бути єдиним
    вмістом повідомлення.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — вилучаються з повідомлення до того, як модель
    його побачить. Зберігають налаштування сеансу, коли надіслані окремо; діють
    як вбудовані підказки, коли надіслані з іншим текстом.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — запускаються негайно й
    вилучаються до того, як модель побачить решту тексту. Лише авторизовані відправники.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У повідомленнях **лише з директивами** (повідомлення містить тільки директиви) вони
      зберігаються в сеансі й відповідають підтвердженням.
    - У повідомленнях **звичайного чату** з іншим текстом вони діють як вбудовані підказки й
      **не** зберігають налаштування сеансу.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо встановлено
      `commands.allowFrom`, використовується тільки цей список дозволених; інакше авторизація надходить із
      списків дозволених/сполучення каналу плюс `commands.useAccessGroups`. Неавторизовані
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
  Вмикає розбір `/...` у повідомленнях чату. На поверхнях без нативних команд
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) текстові
  команди працюють навіть тоді, коли встановлено `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Автоматично: увімкнено для Discord/Telegram; вимкнено для Slack;
  ігнорується для провайдерів без нативної підтримки. Перевизначайте для кожного каналу через
  `channels.<provider>.commands.native`. У Discord `false` пропускає реєстрацію slash-команд;
  раніше зареєстровані команди можуть залишатися видимими, доки їх не буде видалено.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди Skills нативно, коли це підтримується. Автоматично: увімкнено для
  Discord/Telegram; вимкнено для Slack. Перевизначайте через
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску shell-команд хоста (псевдонім `/bash <cmd>`). Потребує
  списків дозволених `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Як довго bash чекає перед переходом у фоновий режим (`0` одразу переводить у фон).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`). Лише для власника.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`). Лише для власника.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/стан Plugin, а також установлення й увімкнення/вимкнення). Запис — лише для власника.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення конфігурації лише під час виконання). Лише для власника.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` і дії інструмента перезапуску Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Явний список дозволених власників для поверхонь команд лише для власника. Окремо від
  `commands.allowFrom` і доступу через сполучення DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: вимагає ідентичність власника для команд лише для власника. Коли `true`,
  відправник має збігатися з `commands.ownerAllowFrom` або мати внутрішню область `operator.admin`.
  Запис із символом-замінником в `allowFrom` **не** є достатнім.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника відображаються в системному prompt.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Секрет HMAC, який використовується, коли `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Список дозволених для авторизації команд за провайдерами. Коли налаштовано, це
  **єдине** джерело авторизації для команд і директив. Використовуйте `"*"` для
  глобального типового значення; ключі конкретних провайдерів його перевизначають.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не встановлено.
</ParamField>

## Список команд

Команди надходять із трьох джерел:

- **Вбудовані команди ядра:** `src/auto-reply/commands-registry.shared.ts`
- **Згенеровані команди dock:** `src/auto-reply/commands-registry.data.ts`
- **Команди Plugin:** виклики `registerCommand()` у Plugin

Доступність залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених
plugins.

### Команди ядра

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Команда | Опис |
    | --- | --- |
    | `/new [model]` | Архівувати поточний сеанс і почати новий |
    | `/reset [soft [message]]` | Скинути поточний сеанс на місці. `soft` зберігає стенограму, відкидає повторно використані ідентифікатори сеансу CLI backend і повторно запускає старт |
    | `/name <title>` | Назвати або перейменувати поточний сеанс. Опустіть назву, щоб побачити поточну назву й пропозицію |
    | `/compact [instructions]` | Стиснути контекст сеансу. Див. [Compaction](/uk/concepts/compaction) |
    | `/stop` | Перервати поточний запуск |
    | `/session idle <duration\|off>` | Керувати завершенням прив’язки потоку через бездіяльність |
    | `/session max-age <duration\|off>` | Керувати завершенням прив’язки потоку за максимальним віком |
    | `/export-session [path]` | Експортувати поточний сеанс у HTML. Псевдонім: `/export` |
    | `/export-trajectory [path]` | Експортувати JSONL-пакет траєкторії для поточного сеансу. Псевдонім: `/trajectory` |

    <Note>
      Control UI перехоплює введену `/new`, щоб створити новий dashboard-сеанс і перейти до нього,
      окрім випадків, коли налаштовано `session.dmScope: "main"`
      і поточний батьківський сеанс є головним сеансом агента — у такому разі `/new`
      скидає головний сеанс на місці. Введена `/reset` усе ще виконує
      скидання на місці через Gateway. Використовуйте `/model default`, коли потрібно очистити закріплений
      вибір моделі сеансу.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Команда | Опис |
    | --- | --- |
    | `/think <level\|default>` | Установити рівень мислення або очистити перевизначення сеансу. Псевдоніми: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Перемкнути докладний вивід. Псевдонім: `/v` |
    | `/trace on\|off` | Перемкнути вивід трасування Plugin для поточного сеансу |
    | `/fast [status\|auto\|on\|off\|default]` | Показати, установити або очистити швидкий режим |
    | `/reasoning [on\|off\|stream]` | Перемкнути видимість міркувань. Псевдонім: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Перемкнути elevated-режим. Псевдонім: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Показати або встановити типові значення exec |
    | `/model [name\|#\|status]` | Показати або встановити модель |
    | `/models [provider] [page] [limit=<n>\|all]` | Перелічити налаштованих/доступних через auth провайдерів або моделі |
    | `/queue <mode>` | Керувати поведінкою черги активних запусків. Див. [Черга](/uk/concepts/queue) і [Керування чергою](/uk/concepts/queue-steering) |
    | `/steer <message>` | Вставити настанову в активний запуск. Псевдонім: `/tell`. Див. [Керування](/uk/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` призначена для налагодження — тримайте її **вимкненою** під час звичайного використання.
        - `/trace` розкриває лише рядки трасування/налагодження, що належать Plugin; звичайний докладний шум залишається вимкненим.
        - `/fast auto|on|off` зберігає перевизначення сеансу; використовуйте опцію `inherit` в UI сеансів, щоб його очистити.
        - `/fast` залежить від провайдера: OpenAI/Codex відображають її на `service_tier=priority`; прямі запити Anthropic відображають її на `service_tier=auto` або `standard_only`.
        - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях — вони можуть розкрити внутрішні міркування або діагностику Plugin. Тримайте їх вимкненими в групових чатах.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` негайно зберігає нову модель у сеансі.
        - Якщо агент неактивний, наступний запуск одразу її використовує.
        - Якщо запуск активний, перемикання позначається як очікуване й застосовується в наступній чистій точці повторної спроби.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Команда | Опис |
    | --- | --- |
    | `/help` | Показати короткий підсумок довідки |
    | `/commands` | Показати згенерований каталог команд |
    | `/tools [compact\|verbose]` | Показати, що поточний агент може використати прямо зараз |
    | `/status` | Показати стан виконання/середовища, час безвідмовної роботи Gateway і системи, стан Plugin, а також використання/квоту провайдера |
    | `/status plugins` | Показати докладний стан Plugin: помилки завантаження, карантини, збої каналів, проблеми залежностей, повідомлення про сумісність |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Керувати довготривалою [ціллю](/uk/tools/goal) поточного сеансу |
    | `/diagnostics [note]` | Потік звіту підтримки лише для власника. Щоразу запитує схвалення exec |
    | `/crestodian <request>` | Запустити помічник налаштування й ремонту Crestodian із DM власника |
    | `/tasks` | Перелічити активні/нещодавні фонові завдання для поточного сеансу |
    | `/context [list\|detail\|map\|json]` | Пояснити, як збирається контекст |
    | `/whoami` | Показати ваш ідентифікатор відправника. Псевдонім: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Керувати футером використання для кожної відповіді (`reset`/`inherit`/`clear`/`default` очищає перевизначення сеансу, щоб знову успадкувати налаштоване типове значення) або вивести локальний підсумок вартості |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Команда | Опис |
    | --- | --- |
    | `/skill <name> [input]` | Запустити skill за назвою |
    | `/allowlist [list\|add\|remove] ...` | Керувати записами списку дозволених. Лише текст |
    | `/approve <id> <decision>` | Розв’язати запити схвалення exec або Plugin |
    | `/btw <question>` | Поставити побічне запитання без зміни контексту сеансу. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw) |
  </Accordion>

  <Accordion title="Субагенти та ACP">
    | Команда | Опис |
    | --- | --- |
    | `/subagents list\|log\|info` | Перегляд запусків субагентів для поточного сеансу |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Керування сеансами ACP і параметрами середовища виконання |
    | `/focus <target>` | Прив’язати поточну гілку Discord або тему Telegram до цільового сеансу |
    | `/unfocus` | Видалити прив’язку поточної гілки |
    | `/agents` | Показати агентів, прив’язаних до гілки для поточного сеансу |
  </Accordion>

  <Accordion title="Записи лише для власника та адміністрування">
    | Команда | Вимагає | Опис |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Читання або запис `openclaw.json`. Лише для власника |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Читання або запис конфігурації MCP-сервера, керованої OpenClaw. Лише для власника |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Перегляд або зміна стану Plugin. Запис лише для власника. Псевдонім: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Перевизначення конфігурації лише під час виконання. Лише для власника |
    | `/restart` | `commands.restart: true` (типово) | Перезапустити OpenClaw |
    | `/send on\|off\|inherit` | власник | Установити політику надсилання |
  </Accordion>

  <Accordion title="Голос, TTS, керування каналом">
    | Команда | Опис |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Керування TTS. Див. [TTS](/uk/tools/tts) |
    | `/activation mention\|always` | Установити режим активації групи |
    | `/bash <command>` | Виконати команду оболонки хоста. Псевдонім: `! <command>`. Вимагає `commands.bash: true` |
    | `!poll [sessionId]` | Перевірити фонове завдання bash |
    | `!stop [sessionId]` | Зупинити фонове завдання bash |
  </Accordion>
</AccordionGroup>

### Команди докування

Команди докування перемикають маршрут відповіді активного сеансу на інший пов’язаний канал.
Налаштування та усунення несправностей див. у [Докування каналів](/uk/concepts/channel-docking).

Згенеровано з Plugin каналів із підтримкою нативних команд:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Команди докування вимагають `session.identityLinks`. Відправник джерела та цільовий співрозмовник
мають бути в одній групі ідентичностей.

### Команди вбудованих Plugin

| Команда                                                                                      | Опис                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Увімкнути або вимкнути Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming)      |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Керування сполученням пристроїв. Див. [Сполучення](/uk/channels/pairing)             |
| `/phone status\|arm ...\|disarm`                                                             | Тимчасово активувати високоризикові команди телефонного вузла                     |
| `/voice status\|list\|set <voiceId>`                                                         | Керування конфігурацією голосу Talk. Нативна назва Discord: `/talkvoice`          |
| `/card ...`                                                                                  | Надсилати пресети розширених карток LINE. Див. [LINE](/uk/channels/line)             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Керування harness сервера застосунку Codex. Див. [Codex harness](/uk/plugins/codex-harness) |

Лише QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Команди Skills

Skills, які може викликати користувач, доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills можуть реєструватися як прямі команди (наприклад, `/prose` для OpenProse).
- Нативна реєстрація команд Skills керується `commands.nativeSkills` і
  `channels.<provider>.commands.nativeSkills`.
- Імена нормалізуються до `a-z0-9_` (максимум 32 символи); колізії отримують числові суфікси.

<AccordionGroup>
  <Accordion title="Диспетчеризація команд Skills">
    Типово команди Skills маршрутизуються до моделі як звичайний запит.

    Skills можуть оголосити `command-dispatch: tool`, щоб маршрутизуватися безпосередньо до інструмента
    (детерміновано, без участі моделі). Приклад: `/prose` (OpenProse plugin)
    — див. [OpenProse](/uk/prose).

  </Accordion>
  <Accordion title="Аргументи нативних команд">
    Discord використовує автодоповнення для динамічних параметрів і меню кнопок, коли обов’язкові
    аргументи пропущено. Telegram і Slack показують меню кнопок для команд із
    варіантами вибору. Динамічні варіанти визначаються відносно моделі цільового сеансу, тому
    параметри, специфічні для моделі, як-от рівні `/think`, враховують перевизначення `/model` сеансу.
  </Accordion>
</AccordionGroup>

## `/tools` — що агент може використовувати зараз

`/tools` відповідає на питання середовища виконання: **що цей агент може використовувати прямо зараз у цій
розмові** — а не статичний каталог конфігурації.

```text
/tools         # компактний вигляд
/tools verbose # з короткими описами
```

Результати обмежені сеансом. Зміна агента, каналу, гілки, авторизації
відправника або моделі може змінити вивід. Для редагування профілю та перевизначень
використовуйте панель Tools в Control UI або поверхні конфігурації.

## `/model` — вибір моделі

```text
/model             # показати вибір моделі
/model list        # те саме
/model 3           # вибрати за номером із вибору
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # очистити вибір моделі для сеансу
/model status      # докладний вигляд з endpoint і режимом API
```

У Discord `/model` і `/models` відкривають інтерактивний вибір із випадаючими списками провайдера та
моделі. Вибір враховує `agents.defaults.models`, зокрема
записи `provider/*`.

## `/config` — записи конфігурації на диску

<Note>
  Лише для власника. Вимкнено типово — увімкніть за допомогою `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Конфігурація перевіряється перед записом. Недійсні зміни відхиляються. Оновлення `/config`
зберігаються після перезапусків.

## `/mcp` — конфігурація MCP-сервера

<Note>
  Лише для власника. Вимкнено за замовчуванням — увімкніть за допомогою `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту вбудованого агента.

## `/debug` — перевизначення лише для runtime

<Note>
  Лише для власника. Вимкнено за замовчуванням — увімкніть за допомогою `commands.debug: true`.
  Перевизначення застосовуються негайно до нових читань конфігурації, але **не** записуються на диск.
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
  Лише для власника для операцій запису. Вимкнено за замовчуванням — увімкніть за допомогою `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` оновлює конфігурацію Plugin і гаряче перезавантажує runtime
Plugin у Gateway для нових ходів агента. `/plugins install` автоматично перезапускає керовані
Gateway, оскільки вихідні модулі Plugin змінилися.

## `/trace` — вивід трасування Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` показує рядки трасування/налагодження Plugin в межах сеансу без повного докладного
режиму. Він не замінює `/debug` (перевизначення runtime) або `/verbose` (звичайний
вивід інструмента).

## `/btw` — побічні запитання

`/btw` — це швидке побічне запитання про поточний контекст сеансу. Псевдонім: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

На відміну від звичайного повідомлення:

- Використовує поточний сеанс як фоновий контекст.
- У сеансах Codex harness запускається як ефемерна побічна гілка Codex.
- **Не** змінює майбутній контекст сеансу.
- Не записується в історію транскрипта.

Див. [побічні запитання BTW](/uk/tools/btw), щоб дізнатися повну поведінку.

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Область дії сеансу для кожної поверхні">
    - **Текстові команди:** виконуються у звичайному чат-сеансі (DM спільно використовують `main`, групи мають власний сеанс).
    - **Нативні команди Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Нативні команди Slack:** `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
    - **Нативні команди Telegram:** `telegram:slash:<userId>` (ціляться в чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** цілиться в активний чат-сеанс, щоб перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` підтримує одну команду в стилі `/openclaw`.
    З `commands.native: true` створіть одну slash-команду Slack для кожної вбудованої
    команди. Зареєструйте `/agentstatus` (не `/status`), оскільки Slack резервує
    `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.
  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - Повідомлення лише з командами від дозволених відправників обробляються негайно (обхід черги + моделі).
    - Вбудовані скорочення (`/help`, `/commands`, `/status`, `/whoami`) також працюють у звичайних повідомленнях і вилучаються до того, як модель побачить решту тексту.
    - Несанкціоновані повідомлення лише з командами тихо ігноруються; вбудовані токени `/...` розглядаються як звичайний текст.

  </Accordion>
  <Accordion title="Примітки щодо аргументів">
    - Команди приймають необов'язковий `:` між командою та аргументами (`/think: high`, `/send: on`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст розглядається як тіло повідомлення.
    - `/allowlist add|remove` потребує `commands.config: true` і враховує `configWrites` каналу.

  </Accordion>
</AccordionGroup>

## Використання та статус провайдера

- **Використання/квота провайдера** (наприклад, "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання з транскрипта, коли живий знімок сеансу неповний.
- **Виконання проти runtime:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто запускає сеанс: `OpenClaw Default`, `OpenAI Codex`, backend CLI або backend ACP.
- **Токени/вартість на відповідь:** керується через `/usage off|tokens|full`.
- `/model status` стосується моделей/автентифікації/endpoint-ів, а не використання.

## Пов'язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Як реєструються та обмежуються slash-команди Skills.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть skill, який реєструє власну slash-команду.
  </Card>
  <Card title="BTW" href="/uk/tools/btw" icon="comments">
    Побічні запитання без зміни контексту сеансу.
  </Card>
  <Card title="Керування" href="/uk/tools/steer" icon="compass">
    Спрямовуйте агента під час виконання за допомогою `/steer`.
  </Card>
</CardGroup>
