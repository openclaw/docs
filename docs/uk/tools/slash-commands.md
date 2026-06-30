---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
    - Розуміння того, як реєструються команди Skills
sidebarTitle: Slash commands
summary: Усі доступні slash-команди, директиви та вбудовані скорочення — конфігурація, маршрутизація та поведінка для кожної поверхні.
title: Команди зі скісною рискою
x-i18n:
    generated_at: "2026-06-30T14:25:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway обробляє команди, надіслані як окремі повідомлення, що починаються з `/`.
Bash-команди лише для хоста використовують `! <cmd>` (з `/bash <cmd>` як псевдонімом).

Коли розмову прив’язано до сесії ACP, звичайний текст спрямовується до
обв’язки ACP. Команди керування Gateway залишаються локальними: `/acp ...` завжди потрапляє
до обробника команд OpenClaw, а `/status` і `/unfocus` залишаються локальними щоразу,
коли для поверхні ввімкнено обробку команд.

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
    `/help`, `/commands`, `/status`, `/whoami` — виконуються негайно й
    вилучаються до того, як модель побачить решту тексту. Лише для авторизованих відправників.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Подробиці поведінки директив">
    - Директиви вилучаються з повідомлення до того, як модель його побачить.
    - У повідомленнях **лише з директивами** (повідомлення містить тільки директиви) вони
      зберігаються в сесії та повертають підтвердження.
    - У повідомленнях **звичайного чату** з іншим текстом вони діють як вбудовані підказки й
      **не** зберігають налаштування сесії.
    - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`,
      це єдиний використаний список дозволених; інакше авторизація походить зі
      списків дозволених/спарювання каналу плюс `commands.useAccessGroups`. Неавторизовані
      відправники бачать, що директиви обробляються як звичайний текст.
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
  команди працюють, навіть коли встановлено `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Реєструє нативні команди. Авто: увімкнено для Discord/Telegram; вимкнено для Slack;
  ігнорується для провайдерів без нативної підтримки. Перевизначайте для кожного каналу через
  `channels.<provider>.commands.native`. У Discord `false` пропускає реєстрацію
  slash-команд; раніше зареєстровані команди можуть залишатися видимими, доки їх не буде видалено.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Реєструє команди Skills нативно, коли це підтримується. Авто: увімкнено для
  Discord/Telegram; вимкнено для Slack. Перевизначайте через
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Вмикає `! <cmd>` для запуску команд оболонки хоста (псевдонім `/bash <cmd>`). Потребує
  списків дозволених `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Скільки bash очікує перед перемиканням у фоновий режим (`0` переводить у фон
  негайно).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Вмикає `/config` (читає/записує `openclaw.json`). Лише для власника.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Вмикає `/mcp` (читає/записує керовану OpenClaw конфігурацію MCP у `mcp.servers`). Лише для власника.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Вмикає `/plugins` (виявлення/статус plugin, а також встановлення + увімкнення/вимкнення). Запис лише для власника.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Вмикає `/debug` (перевизначення конфігурації лише під час виконання). Лише для власника.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Вмикає `/restart` і дії інструментів перезапуску gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Явний список дозволених власників для поверхонь команд, доступних лише власнику. Окремо від
  `commands.allowFrom` і доступу через спарювання DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для кожного каналу: вимагає ідентичність власника для команд, доступних лише власнику. Коли `true`,
  відправник має збігатися з `commands.ownerAllowFrom` або мати внутрішню область `operator.admin`.
  Запис із wildcard у `allowFrom` **не** є достатнім.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Керує тим, як ідентифікатори власника з’являються в системному промпті.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Секрет HMAC, який використовується, коли `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Список дозволених для кожного провайдера для авторизації команд. Коли налаштовано, це
  **єдине** джерело авторизації для команд і директив. Використовуйте `"*"` для
  глобального значення за замовчуванням; ключі конкретних провайдерів його перевизначають.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Застосовує списки дозволених/політики для команд, коли `commands.allowFrom` не задано.
</ParamField>

## Список команд

Команди надходять із трьох джерел:

- **Вбудовані в core:** `src/auto-reply/commands-registry.shared.ts`
- **Згенеровані команди dock:** `src/auto-reply/commands-registry.data.ts`
- **Команди Plugin:** виклики plugin `registerCommand()`

Доступність залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених
plugins.

### Команди core

<AccordionGroup>
  <Accordion title="Сесії та запуски">
    | Команда | Опис |
    | --- | --- |
    | `/new [model]` | Архівувати поточну сесію та почати нову |
    | `/reset [soft [message]]` | Скинути поточну сесію на місці. `soft` зберігає транскрипт, відкидає повторно використані ідентифікатори сесій CLI-бекенду та повторно запускає старт |
    | `/name <title>` | Назвати або перейменувати поточну сесію. Пропустіть назву, щоб побачити поточну назву та пропозицію |
    | `/compact [instructions]` | Стиснути контекст сесії. Див. [Compaction](/uk/concepts/compaction) |
    | `/stop` | Перервати поточний запуск |
    | `/session idle <duration\|off>` | Керувати закінченням прив’язки треду через простоювання |
    | `/session max-age <duration\|off>` | Керувати закінченням максимального віку прив’язки треду |
    | `/export-session [path]` | Експортувати поточну сесію в HTML. Псевдонім: `/export` |
    | `/export-trajectory [path]` | Експортувати пакет траєкторії JSONL для поточної сесії. Псевдонім: `/trajectory` |

    <Note>
      Control UI перехоплює введений `/new`, щоб створити та перемкнутися на нову
      сесію панелі керування, окрім випадків, коли налаштовано `session.dmScope: "main"`
      і поточний батьківський елемент є головною сесією агента — у такому разі `/new`
      скидає головну сесію на місці. Введений `/reset` усе ще запускає скидання на місці
      Gateway. Використовуйте `/model default`, коли потрібно очистити закріплений
      вибір моделі сесії.
    </Note>

  </Accordion>

  <Accordion title="Модель і керування запуском">
    | Команда | Опис |
    | --- | --- |
    | `/think <level\|default>` | Установити рівень мислення або очистити перевизначення сесії. Псевдоніми: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Перемкнути докладний вивід. Псевдонім: `/v` |
    | `/trace on\|off` | Перемкнути вивід трасування plugin для поточної сесії |
    | `/fast [status\|auto\|on\|off\|default]` | Показати, установити або очистити швидкий режим |
    | `/reasoning [on\|off\|stream]` | Перемкнути видимість reasoning. Псевдонім: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Перемкнути підвищений режим. Псевдонім: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Показати або встановити типові значення exec |
    | `/model [name\|#\|status]` | Показати або встановити модель |
    | `/models [provider] [page] [limit=<n>\|all]` | Перелічити налаштованих/доступних через auth провайдерів або моделі |
    | `/queue <mode>` | Керувати поведінкою черги активних запусків. Див. [Черга](/uk/concepts/queue) і [Спрямування черги](/uk/concepts/queue-steering) |
    | `/steer <message>` | Вставити настанову в активний запуск. Псевдонім: `/tell`. Див. [Спрямування](/uk/tools/steer) |

    <AccordionGroup>
      <Accordion title="безпека verbose / trace / fast / reasoning">
        - `/verbose` призначено для налагодження — тримайте його **вимкненим** за звичайного використання.
        - `/trace` показує лише рядки трасування/налагодження, якими володіє plugin; звичайний докладний шум лишається вимкненим.
        - `/fast auto|on|off` зберігає перевизначення сесії; використовуйте опцію `inherit` в інтерфейсі Sessions UI, щоб його очистити.
        - `/fast` залежить від провайдера: OpenAI/Codex відображають його на `service_tier=priority`; прямі запити Anthropic відображають його на `service_tier=auto` або `standard_only`.
        - `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях — вони можуть розкрити внутрішнє reasoning або діагностику plugin. Тримайте їх вимкненими в групових чатах.

      </Accordion>
      <Accordion title="Подробиці перемикання моделі">
        - `/model` негайно зберігає нову модель у сесії.
        - Якщо агент неактивний, наступний запуск одразу її використовує.
        - Якщо запуск активний, перемикання позначається як очікуване й застосовується в наступній чистій точці повторної спроби.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Виявлення та статус">
    | Команда | Опис |
    | --- | --- |
    | `/help` | Показати коротке зведення довідки |
    | `/commands` | Показати згенерований каталог команд |
    | `/tools [compact\|verbose]` | Показати, що поточний агент може використовувати прямо зараз |
    | `/status` | Показати статус виконання/середовища виконання, час безперервної роботи Gateway і системи, справність plugin, а також використання/квоту провайдера |
    | `/status plugins` | Показати докладну справність plugin: помилки завантаження, карантини, збої каналів, проблеми залежностей, повідомлення про сумісність |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Керувати стійкою [ціллю](/uk/tools/goal) поточної сесії |
    | `/diagnostics [note]` | Потік звіту підтримки лише для власника. Щоразу запитує схвалення exec |
    | `/crestodian <request>` | Запустити помічник налаштування та ремонту Crestodian з DM власника |
    | `/tasks` | Перелічити активні/нещодавні фонові завдання для поточної сесії |
    | `/context [list\|detail\|map\|json]` | Пояснити, як збирається контекст |
    | `/whoami` | Показати ваш ідентифікатор відправника. Псевдонім: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Керувати нижнім колонтитулом використання для кожної відповіді (`reset`/`inherit`/`clear`/`default` очищує перевизначення сесії, щоб знову успадкувати налаштоване значення за замовчуванням) або надрукувати локальне зведення вартості |
  </Accordion>

  <Accordion title="Skills, списки дозволених, схвалення">
    | Команда | Опис |
    | --- | --- |
    | `/skill <name> [input]` | Запустити skill за назвою |
    | `/allowlist [list\|add\|remove] ...` | Керувати записами списку дозволених. Лише текст |
    | `/approve <id> <decision>` | Вирішити запити схвалення exec або plugin |
    | `/btw <question>` | Поставити побічне запитання без зміни контексту сесії. Псевдонім: `/side`. Див. [BTW](/uk/tools/btw) |
  </Accordion>

  <Accordion title="Під-агенти та ACP">
    | Команда | Опис |
    | --- | --- |
    | `/subagents list\|log\|info` | Переглянути запуски під-агентів для поточного сеансу |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Керувати сеансами ACP і параметрами середовища виконання. Елементи керування середовищем виконання потребують зовнішнього власника або внутрішньої ідентичності адміністратора Gateway |
    | `/focus <target>` | Прив’язати поточну гілку Discord або тему Telegram до цільового сеансу |
    | `/unfocus` | Прибрати прив’язку поточної гілки |
    | `/agents` | Перелічити агентів, прив’язаних до гілки для поточного сеансу |
  </Accordion>

  <Accordion title="Записи лише для власника й адміністрування">
    | Команда | Потребує | Опис |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Читати або записувати `openclaw.json`. Лише для власника |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Читати або записувати конфігурацію MCP-сервера, якою керує OpenClaw. Лише для власника |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Переглядати або змінювати стан Plugin. Для записів лише власник. Псевдонім: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Перевизначення конфігурації лише для середовища виконання. Лише для власника |
    | `/restart` | `commands.restart: true` (типово) | Перезапустити OpenClaw |
    | `/send on\|off\|inherit` | власник | Установити політику надсилання |
  </Accordion>

  <Accordion title="Голос, TTS, керування каналом">
    | Команда | Опис |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Керувати TTS. Див. [TTS](/uk/tools/tts) |
    | `/activation mention\|always` | Установити режим активації групи |
    | `/bash <command>` | Запустити команду оболонки хоста. Псевдонім: `! <command>`. Потребує `commands.bash: true` |
    | `!poll [sessionId]` | Перевірити фонове завдання bash |
    | `!stop [sessionId]` | Зупинити фонове завдання bash |
  </Accordion>
</AccordionGroup>

### Команди докування

Команди докування перемикають маршрут відповіді активного сеансу на інший пов’язаний канал.
Див. [Докування каналів](/uk/concepts/channel-docking), щоб налаштувати й усунути неполадки.

Згенеровано з Plugin каналів із підтримкою нативних команд:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

Команди докування потребують `session.identityLinks`. Відправник джерела й цільовий учасник
мають бути в одній групі ідентичності.

### Команди вбудованих Plugin

| Команда                                                                                      | Опис                                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Перемкнути Dreaming пам’яті (власник або адміністратор Gateway). Див. [Dreaming](/uk/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Керувати спарюванням пристроїв. Див. [Спарювання](/uk/channels/pairing)                  |
| `/phone status\|arm ...\|disarm`                                                             | Тимчасово озброїти високоризикові команди телефонного вузла                            |
| `/voice status\|list\|set <voiceId>`                                                         | Керувати конфігурацією голосу Talk. Нативна назва Discord: `/talkvoice`               |
| `/card ...`                                                                                  | Надіслати пресети розширених карток LINE. Див. [LINE](/uk/channels/line)                 |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Керувати обв’язкою сервера застосунку Codex. Див. [Обв’язка Codex](/uk/plugins/codex-harness) |

Лише QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Команди Skills

Skills, які може викликати користувач, доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills можуть реєструватися як прямі команди (наприклад, `/prose` для OpenProse).
- Реєстрацією нативних команд Skills керують `commands.nativeSkills` і
  `channels.<provider>.commands.nativeSkills`.
- Назви очищаються до `a-z0-9_` (максимум 32 символи); колізії отримують числові суфікси.

<AccordionGroup>
  <Accordion title="Диспетчеризація команд Skills">
    Типово команди Skills маршрутизуються до моделі як звичайний запит.

    Skills можуть оголосити `command-dispatch: tool`, щоб маршрутизувати безпосередньо до інструмента
    (детерміновано, без участі моделі). Приклад: `/prose` (Plugin OpenProse)
    — див. [OpenProse](/uk/prose).

  </Accordion>
  <Accordion title="Аргументи нативних команд">
    Discord використовує автодоповнення для динамічних параметрів і меню кнопок, коли обов’язкові
    аргументи пропущено. Telegram і Slack показують меню кнопок для команд із
    варіантами. Динамічні варіанти визначаються відносно моделі цільового сеансу, тому специфічні
    для моделі параметри, як-от рівні `/think`, дотримуються перевизначення `/model` сеансу.
  </Accordion>
</AccordionGroup>

## `/tools` — що агент може використовувати зараз

`/tools` відповідає на питання середовища виконання: **що цей агент може використовувати просто зараз у цій
розмові** — а не статичний каталог конфігурації.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Результати обмежені сеансом. Зміна агента, каналу, гілки, авторизації
відправника або моделі може змінити вивід. Для редагування профілю й перевизначень
використовуйте панель Tools у Control UI або поверхні конфігурації.

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

У Discord `/model` і `/models` відкривають інтерактивний вибір із випадаючими списками провайдера й
моделі. Вибір враховує `agents.defaults.models`, зокрема
записи `provider/*`.

## `/config` — записи конфігурації на диску

<Note>
  Лише для власника. Типово вимкнено — увімкніть за допомогою `commands.config: true`.
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
  Лише для власника. Типово вимкнено — увімкніть за допомогою `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту вбудованого агента.

## `/debug` — перевизначення лише для середовища виконання

<Note>
  Лише для власника. Типово вимкнено — увімкніть за допомогою `commands.debug: true`.
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
  Для записів лише власник. Типово вимкнено — увімкніть за допомогою `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` оновлює конфігурацію Plugin і гаряче перезавантажує середовище виконання
Plugin Gateway для нових ходів агента. `/plugins install` автоматично перезапускає керовані
Gateway, оскільки змінилися вихідні модулі Plugin.

## `/trace` — вивід трасування Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` показує обмежені сеансом рядки трасування/налагодження Plugin без повного докладного
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
- У сеансах обв’язки Codex запускається як тимчасова побічна гілка Codex.
- **Не** змінює майбутній контекст сеансу.
- Не записується до історії transcript.

Див. [Побічні запитання BTW](/uk/tools/btw) для повної поведінки.

## Примітки щодо поверхонь

<AccordionGroup>
  <Accordion title="Область сеансу для кожної поверхні">
    - **Текстові команди:** виконуються у звичайному чат-сеансі (DM мають спільний `main`, групи мають власний сеанс).
    - **Нативні команди Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Нативні команди Slack:** `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
    - **Нативні команди Telegram:** `telegram:slash:<userId>` (націлюється на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** націлюється на активний чат-сеанс, щоб перервати поточний запуск.

  </Accordion>
  <Accordion title="Особливості Slack">
    `channels.slack.slashCommand` підтримує одну команду в стилі `/openclaw`.
    З `commands.native: true` створіть по одній slash-команді Slack для кожної вбудованої
    команди. Зареєструйте `/agentstatus` (не `/status`), оскільки Slack резервує
    `/status`. Текстова `/status` усе ще працює в повідомленнях Slack.
  </Accordion>
  <Accordion title="Швидкий шлях і вбудовані скорочення">
    - Повідомлення лише з командою від дозволених відправників обробляються негайно (в обхід черги й моделі).
    - Вбудовані скорочення (`/help`, `/commands`, `/status`, `/whoami`) також працюють у звичайних повідомленнях і видаляються до того, як модель побачить решту тексту.
    - Неавторизовані повідомлення лише з командою мовчки ігноруються; вбудовані токени `/...` трактуються як звичайний текст.

  </Accordion>
  <Accordion title="Примітки щодо аргументів">
    - Команди приймають необов’язковий `:` між командою й аргументами (`/think: high`, `/send: on`).
    - `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст трактується як тіло повідомлення.
    - `/allowlist add|remove` потребує `commands.config: true` і враховує `configWrites` каналу.

  </Accordion>
</AccordionGroup>

## Використання й стан провайдера

- **Використання/квота провайдера** (наприклад, "Claude 80% left") показується в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання.
- **Рядки токенів/кешу** в `/status` можуть повертатися до останнього запису використання transcript, коли актуальний знімок сеансу розріджений.
- **Виконання проти середовища виконання:** `/status` повідомляє `Execution` для ефективного шляху sandbox і `Runtime` для того, хто запускає сеанс: `OpenClaw Default`, `OpenAI Codex`, бекенд CLI або бекенд ACP.
- **Токени/вартість на відповідь:** керується `/usage off|tokens|full`.
- `/model status` стосується моделей/автентифікації/endpoint, а не використання.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Як реєструються й обмежуються slash-команди Skills.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть Skill, який реєструє власну slash-команду.
  </Card>
  <Card title="BTW" href="/uk/tools/btw" icon="comments">
    Побічні запитання без зміни контексту сеансу.
  </Card>
  <Card title="Steer" href="/uk/tools/steer" icon="compass">
    Спрямовуйте агента під час запуску за допомогою `/steer`.
  </Card>
</CardGroup>
