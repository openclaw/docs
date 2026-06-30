---
read_when:
    - Підключення Codex, Claude Code або іншого клієнта MCP до каналів на базі OpenClaw
    - Виконується `openclaw mcp serve`
    - Керування збереженими в OpenClaw визначеннями MCP-серверів
sidebarTitle: MCP
summary: Надавайте розмови каналів OpenClaw через MCP і керуйте збереженими визначеннями серверів MCP
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:34:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` має два завдання:

- запускати OpenClaw як MCP-сервер за допомогою `openclaw mcp serve`
- керувати визначеннями вихідних MCP-серверів, керованих OpenClaw, за допомогою `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` і `unset`

Іншими словами:

- `serve` — це OpenClaw, що діє як MCP-сервер
- інші підкоманди — це OpenClaw, що діє як клієнтський реєстр MCP для MCP-серверів, які його середовища виконання можуть споживати пізніше

<Note>
  `list`, `show`, `set` і `unset` лише читають і записують керовані OpenClaw записи `mcp.servers` у конфігурації OpenClaw. Вони не включають сервери mcporter з `config/mcporter.json`; для цього реєстру використовуйте `mcporter list`.
</Note>

Використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має самостійно розміщувати сеанс кодового harness і маршрутизувати це середовище виконання через ACP.

## Виберіть правильний шлях MCP

OpenClaw має кілька поверхонь MCP. Виберіть ту, що відповідає тому, хто володіє середовищем виконання агента і хто володіє інструментами.

| Мета                                                                | Використовуйте                                                       | Чому                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Дозволити зовнішньому MCP-клієнту читати/надсилати розмови каналів OpenClaw | `openclaw mcp serve`                                                 | OpenClaw є MCP-сервером і надає розмови на основі Gateway через stdio.                                          |
| Зберегти сторонні MCP-сервери для керованих OpenClaw запусків агентів | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw є клієнтським реєстром MCP і пізніше проєктує ці сервери у відповідні середовища виконання.            |
| Перевірити збережений сервер без запуску ходу агента                | `openclaw mcp status`, `doctor`, `probe`                             | `status` і `doctor` перевіряють конфігурацію; `probe` відкриває живе MCP-з'єднання і перелічує можливості.     |
| Редагувати конфігурацію MCP з браузера                              | Control UI `/mcp`                                                    | Сторінка показує інвентар, увімкнення, зведення OAuth/фільтрів, підказки команд і обмежений редактор `mcp`.     |
| Надати app-server Codex обмежений нативний MCP-сервер               | `mcp.servers.<name>.codex`                                           | Блок `codex` впливає лише на проєкцію потоків app-server Codex і видаляється перед передаванням нативної конфігурації. |
| Запускати сеанси harness, розміщені через ACP                       | [`openclaw acp`](/uk/cli/acp) і [агенти ACP](/uk/tools/acp-agents-setup)   | Режим моста ACP не приймає ін'єкцію MCP-сервера для окремого сеансу; натомість налаштуйте мости gateway/plugin. |

<Tip>
Якщо ви не впевнені, який шлях потрібен, почніть з `openclaw mcp status --verbose`. Він показує, що OpenClaw зберіг, не запускаючи MCP-сервери.
</Tip>

## OpenClaw як MCP-сервер

Це шлях `openclaw mcp serve`.

### Коли використовувати `serve`

Використовуйте `openclaw mcp serve`, коли:

- Codex, Claude Code або інший MCP-клієнт має напряму взаємодіяти з розмовами каналів на основі OpenClaw
- у вас уже є локальний або віддалений OpenClaw Gateway з маршрутизованими сеансами
- вам потрібен один MCP-сервер, що працює з бекендами каналів OpenClaw, замість запуску окремих мостів для кожного каналу

Натомість використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має самостійно розміщувати кодове середовище виконання і тримати сеанс агента всередині OpenClaw.

### Як це працює

`openclaw mcp serve` запускає stdio MCP-сервер. MCP-клієнт володіє цим процесом. Поки клієнт тримає stdio-сеанс відкритим, міст підключається до локального або віддаленого OpenClaw Gateway через WebSocket і надає маршрутизовані розмови каналів через MCP.

<Steps>
  <Step title="Клієнт запускає міст">
    MCP-клієнт запускає `openclaw mcp serve`.
  </Step>
  <Step title="Міст підключається до Gateway">
    Міст підключається до OpenClaw Gateway через WebSocket.
  </Step>
  <Step title="Сеанси стають MCP-розмовами">
    Маршрутизовані сеанси стають MCP-розмовами та інструментами стенограми/історії.
  </Step>
  <Step title="Живі події стають у чергу">
    Живі події ставляться в чергу в пам'яті, поки міст підключений.
  </Step>
  <Step title="Необов'язковий push для Claude">
    Якщо режим каналу Claude увімкнено, той самий сеанс також може отримувати специфічні для Claude push-сповіщення.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Важлива поведінка">
    - стан живої черги починається, коли міст підключається
    - старіша історія стенограми читається за допомогою `messages_read`
    - push-сповіщення Claude існують лише поки MCP-сеанс активний
    - коли клієнт відключається, міст завершує роботу, а жива черга зникає
    - одноразові точки входу агента, як-от `openclaw agent` і `openclaw infer model run`, завершують будь-які bundled MCP runtime, які вони відкривають, коли відповідь завершена, тому повторні скриптові запуски не накопичують дочірні процеси stdio MCP
    - stdio MCP-сервери, запущені OpenClaw (bundled або налаштовані користувачем), під час завершення роботи зупиняються як дерево процесів, тож дочірні subprocesses, запущені сервером, не виживають після виходу батьківського stdio-клієнта
    - видалення або скидання сеансу звільняє MCP-клієнти цього сеансу через спільний шлях очищення runtime, тому не лишається завислих stdio-з'єднань, прив'язаних до видаленого сеансу

  </Accordion>
</AccordionGroup>

### Виберіть режим клієнта

Використовуйте той самий міст двома різними способами:

<Tabs>
  <Tab title="Загальні MCP-клієнти">
    Лише стандартні MCP-інструменти. Використовуйте `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` та інструменти схвалення.
  </Tab>
  <Tab title="Claude Code">
    Стандартні MCP-інструменти плюс специфічний для Claude адаптер каналу. Увімкніть `--claude-channel-mode on` або залиште типовий режим `auto`.
  </Tab>
</Tabs>

<Note>
Сьогодні `auto` поводиться так само, як `on`. Виявлення можливостей клієнта ще немає.
</Note>

### Що надає `serve`

Міст використовує наявні метадані маршруту сеансу Gateway, щоб надавати розмови на основі каналів. Розмова з'являється, коли OpenClaw уже має стан сеансу з відомим маршрутом, наприклад:

- `channel`
- метадані отримувача або призначення
- необов'язковий `accountId`
- необов'язковий `threadId`

Це дає MCP-клієнтам одне місце, щоб:

- перелічувати нещодавні маршрутизовані розмови
- читати нещодавню історію стенограми
- чекати нових вхідних подій
- надсилати відповідь назад через той самий маршрут
- бачити запити на схвалення, що надходять, поки міст підключений

### Використання

<Tabs>
  <Tab title="Локальний Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Віддалений Gateway (токен)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Віддалений Gateway (пароль)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Докладно / Claude вимкнено">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Інструменти моста

Поточний міст надає ці MCP-інструменти:

<AccordionGroup>
  <Accordion title="conversations_list">
    Перелічує нещодавні розмови на основі сеансів, які вже мають метадані маршруту в стані сеансу Gateway.

    Корисні фільтри:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Повертає одну розмову за `session_key` за допомогою прямого пошуку сеансу Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Читає нещодавні повідомлення стенограми для однієї розмови на основі сеансу.
  </Accordion>
  <Accordion title="attachments_fetch">
    Витягує нетекстові блоки вмісту повідомлення з одного повідомлення стенограми. Це подання метаданих над вмістом стенограми, а не окреме довговічне сховище blob-вкладень.
  </Accordion>
  <Accordion title="events_poll">
    Читає поставлені в чергу живі події від числового курсора.
  </Accordion>
  <Accordion title="events_wait">
    Виконує long-polling, доки не надійде наступна відповідна подія в черзі або не спливе час очікування.

    Використовуйте це, коли загальному MCP-клієнту потрібна майже реального часу доставка без специфічного для Claude push-протоколу.

  </Accordion>
  <Accordion title="messages_send">
    Надсилає текст назад через той самий маршрут, уже записаний у сеансі.

    Поточна поведінка:

    - вимагає наявного маршруту розмови
    - використовує канал сеансу, отримувача, ідентифікатор облікового запису та ідентифікатор потоку
    - надсилає лише текст

  </Accordion>
  <Accordion title="permissions_list_open">
    Перелічує очікувані запити на схвалення exec/plugin, які міст спостеріг з моменту підключення до Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Розв'язує один очікуваний запит на схвалення exec/plugin за допомогою:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Модель подій

Міст тримає чергу подій у пам'яті, поки він підключений.

Поточні типи подій:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- черга є лише живою; вона починається, коли MCP-міст запускається
- `events_poll` і `events_wait` самі не відтворюють старішу історію Gateway
- довговічний backlog слід читати за допомогою `messages_read`

</Warning>

### Сповіщення каналу Claude

Міст також може надавати специфічні для Claude сповіщення каналу. Це еквівалент адаптера каналу Claude Code в OpenClaw: стандартні MCP-інструменти залишаються доступними, але живі вхідні повідомлення також можуть надходити як специфічні для Claude MCP-сповіщення.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: лише стандартні MCP-інструменти.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: увімкнути сповіщення каналу Claude.
  </Tab>
  <Tab title="auto (типово)">
    `--claude-channel-mode auto`: поточне типове значення; та сама поведінка моста, що й `on`.
  </Tab>
</Tabs>

Коли режим каналу Claude увімкнено, сервер оголошує експериментальні можливості Claude і може надсилати:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Поточна поведінка моста:

- вхідні повідомлення стенограми `user` пересилаються як `notifications/claude/channel`
- запити дозволів Claude, отримані через MCP, відстежуються в пам'яті
- якщо власник команди у пов'язаній розмові пізніше надсилає `yes abcde` або `no abcde`, міст перетворює це на `notifications/claude/channel/permission`
- ці сповіщення доступні лише для живого сеансу; якщо MCP-клієнт відключається, push-цілі немає

Це навмисно специфічно для клієнта. Загальні MCP-клієнти мають покладатися на стандартні інструменти опитування.

### Конфігурація MCP-клієнта

Приклад конфігурації stdio-клієнта:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Для більшості загальних MCP-клієнтів почніть зі стандартної поверхні інструментів і ігноруйте режим Claude. Увімкніть режим Claude лише для клієнтів, які справді розуміють специфічні для Claude методи сповіщень.

### Параметри

`openclaw mcp serve` підтримує:

<ParamField path="--url" type="string">
  WebSocket URL Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Читати токен із файлу.
</ParamField>
<ParamField path="--password" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Читати пароль із файлу.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Режим сповіщень Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Докладні журнали в stderr.
</ParamField>

<Tip>
За можливості надавайте перевагу `--token-file` або `--password-file` замість секретів безпосередньо в команді.
</Tip>

### Безпека та межа довіри

Міст не вигадує маршрутизацію. Він лише відкриває розмови, які Gateway уже вміє маршрутизувати.

Це означає:

- списки дозволених відправників, сполучення та довіра на рівні каналу й надалі належать базовій конфігурації каналу OpenClaw
- `messages_send` може відповідати лише через наявний збережений маршрут
- стан затвердження є активним/у пам’яті лише для поточного сеансу моста
- автентифікація моста має використовувати ті самі засоби керування токеном або паролем Gateway, яким ви довірили б будь-який інший віддалений клієнт Gateway

Якщо розмова відсутня в `conversations_list`, звичайна причина не в конфігурації MCP. Причина — відсутні або неповні метадані маршруту в базовому сеансі Gateway.

### Тестування

OpenClaw постачає детермінований Docker smoke для цього моста:

```bash
pnpm test:docker:mcp-channels
```

Цей smoke:

- запускає контейнер Gateway із початковими даними
- запускає другий контейнер, який створює `openclaw mcp serve`
- перевіряє виявлення розмов, читання транскриптів, читання метаданих вкладень, поведінку черги live-подій і маршрутизацію вихідного надсилання
- перевіряє сповіщення каналів і дозволів у стилі Claude через реальний stdio MCP-міст

Це найшвидший спосіб довести, що міст працює, без підключення реального облікового запису Telegram, Discord або iMessage до тестового запуску.

Ширший контекст тестування див. у [Тестування](/uk/help/testing).

### Усунення неполадок

<AccordionGroup>
  <Accordion title="Розмови не повертаються">
    Зазвичай це означає, що сеанс Gateway ще не маршрутизується. Переконайтеся, що базовий сеанс має збережені метадані маршруту каналу/постачальника, отримувача та необов’язково облікового запису/теми.
  </Accordion>
  <Accordion title="events_poll або events_wait пропускає старіші повідомлення">
    Очікувано. Live-черга запускається, коли міст підключається. Читайте старішу історію транскрипту за допомогою `messages_read`.
  </Accordion>
  <Accordion title="Сповіщення Claude не з’являються">
    Перевірте все це:

    - клієнт тримав stdio MCP-сеанс відкритим
    - `--claude-channel-mode` має значення `on` або `auto`
    - клієнт справді розуміє методи сповіщень, специфічні для Claude
    - вхідне повідомлення відбулося після підключення моста

  </Accordion>
  <Accordion title="Затвердження відсутні">
    `permissions_list_open` показує лише запити на затвердження, зафіксовані, поки міст був підключений. Це не довговічний API історії затверджень.
  </Accordion>
</AccordionGroup>

## OpenClaw як реєстр клієнтів MCP

Це шлях `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` і `unset`.

Ці команди не відкривають OpenClaw через MCP. Вони керують визначеннями MCP-серверів, якими керує OpenClaw, у `mcp.servers` у конфігурації OpenClaw. Вони не читають mcporter-сервери з `config/mcporter.json`.

Ці збережені визначення призначені для середовищ виконання, які OpenClaw запускає або налаштовує пізніше, як-от вбудований OpenClaw та інші адаптери середовища виконання. OpenClaw зберігає визначення централізовано, щоб цим середовищам виконання не потрібно було тримати власні дублікати списків MCP-серверів.

<AccordionGroup>
  <Accordion title="Важлива поведінка">
    - ці команди лише читають або записують конфігурацію OpenClaw
    - `status`, `list`, `show`, `doctor` без `--probe`, `set`, `configure`, `tools`, `logout`, `reload` і `unset` не підключаються до цільового MCP-сервера
    - `login` виконує мережевий потік MCP OAuth для налаштованого HTTP-сервера та зберігає отримані локальні облікові дані
    - `status --verbose` друкує підказки щодо розв’язаного транспорту, автентифікації, часу очікування, фільтра та паралельного виклику інструментів без підключення
    - `doctor` перевіряє збережені визначення на проблеми локального налаштування, як-от відсутні stdio-команди, недійсні робочі каталоги, відсутні TLS-файли, вимкнені сервери, буквальні чутливі значення заголовків/env і неповна авторизація OAuth
    - `doctor --probe` додає таке саме live-підтвердження підключення, як `probe`, після успішного проходження статичних перевірок
    - `probe` підключається до вибраного сервера або всіх налаштованих серверів, перелічує інструменти та звітує про можливості/діагностику
    - `add` будує визначення з прапорців і виконує probe перед збереженням, якщо не встановлено `--no-probe` або спершу не потрібна авторизація OAuth
    - адаптери середовища виконання вирішують, які форми транспорту вони фактично підтримують під час виконання
    - `enabled: false` зберігає сервер, але виключає його з виявлення вбудованим середовищем виконання
    - `timeout` і `connectTimeout` задають часи очікування запиту та підключення для кожного сервера в секундах
    - `supportsParallelToolCalls: true` позначає сервери, які адаптери можуть викликати конкурентно
    - HTTP-сервери можуть використовувати статичні заголовки, OAuth login, керування перевіркою TLS і шляхи до сертифіката/ключа mTLS
    - вбудований OpenClaw відкриває налаштовані MCP-інструменти у звичайних профілях інструментів `coding` і `messaging`; `minimal` і далі приховує їх, а `tools.deny: ["bundle-mcp"]` вимикає їх явно
    - фільтри `toolFilter.include` і `toolFilter.exclude` для кожного сервера фільтрують виявлені MCP-інструменти, перш ніж вони стануть інструментами OpenClaw
    - сервери, які оголошують ресурси або prompts, також відкривають службові інструменти для перелічення/читання ресурсів і перелічення/отримання prompts; ці згенеровані службові назви (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) використовують той самий фільтр включення/виключення
    - динамічні зміни списку MCP-інструментів інвалідують кешований каталог для цього сеансу; наступне виявлення/використання оновлює його із сервера
    - повторні збої запитів MCP-інструментів/протоколу ненадовго призупиняють цей сервер, щоб один несправний сервер не спожив увесь хід
    - bundled MCP-середовища виконання в межах сеансу прибираються після `mcp.sessionIdleTtlMs` мілісекунд простою (за замовчуванням 10 хвилин; задайте `0`, щоб вимкнути), а одноразові вбудовані запуски прибирають їх наприкінці запуску

  </Accordion>
</AccordionGroup>

Адаптери середовища виконання можуть нормалізувати цей спільний реєстр у форму, яку очікує їхній нижчий клієнт. Наприклад, вбудований OpenClaw споживає значення OpenClaw `transport` напряму, тоді як Claude Code і Gemini отримують CLI-native значення `type`, як-от `http`, `sse` або `stdio`.

Codex app-server також враховує необов’язковий блок `codex` на кожному сервері. Це
проєкційні метадані OpenClaw лише для потоків Codex app-server; вони не
змінюють ACP-сеанси, загальну конфігурацію Codex harness або інші адаптери середовища виконання.
Використовуйте непорожній `codex.agents`, щоб проєктувати сервер лише в конкретні
ідентифікатори агентів OpenClaw. Порожні, blank або недійсні списки агентів відхиляються валідацією
конфігурації та пропускаються шляхом проєкції середовища виконання замість того, щоб ставати
глобальними. Використовуйте `codex.defaultToolsApprovalMode` (`auto`, `prompt` або `approve`),
щоб видавати нативний для Codex `default_tools_approval_mode` для довіреного сервера.
OpenClaw видаляє метадані `codex`, перш ніж передати нативну конфігурацію `mcp_servers`
до Codex.

### Збережені визначення MCP-серверів

OpenClaw також зберігає легкий реєстр MCP-серверів у конфігурації для поверхонь, яким потрібні MCP-визначення, керовані OpenClaw.

Команди:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Примітки:

- `list` сортує назви серверів.
- `show` без назви друкує повний налаштований об’єкт MCP-сервера.
- `status` класифікує налаштовані транспорти без підключення. `--verbose` включає розв’язані відомості запуску, часу очікування, OAuth, фільтра та паралельних викликів.
- `doctor` виконує статичні перевірки без підключення. Додайте `--probe`, коли команда також має перевірити, що увімкнені сервери підключаються.
- `probe` підключається та звітує про кількість інструментів, підтримку ресурсів/prompts, підтримку змін списку та діагностику.
- `add` приймає stdio-прапорці, як-от `--command`, `--arg`, `--env` і `--cwd`, або HTTP-прапорці, як-от `--url`, `--transport`, `--header`, `--auth oauth`, TLS, час очікування та прапорці вибору інструментів.
- `set` очікує одне значення JSON-об’єкта в командному рядку.
- `configure` оновлює ввімкнення, фільтри інструментів, часи очікування, OAuth, TLS і підказки паралельних викликів інструментів без заміни всього визначення сервера.
- `tools` оновлює фільтри інструментів для кожного сервера. Записи включення/виключення — це назви MCP-інструментів і прості `*` globs.
- `login` запускає потік OAuth для HTTP-серверів, налаштованих із `auth: "oauth"`. Перший запуск друкує URL авторизації; повторно запустіть із `--code` після затвердження.
- `logout` очищає збережені облікові дані OAuth для названого сервера, не видаляючи збережене визначення сервера.
- `reload` утилізує кешовані MCP-середовища виконання в поточному процесі. Gateway або агентські процеси в іншому процесі все ще потребують власного шляху перезавантаження або перезапуску.
- Використовуйте `transport: "streamable-http"` для Streamable HTTP MCP-серверів. `openclaw mcp set` також нормалізує CLI-native `type: "http"` до тієї самої канонічної форми конфігурації для сумісності.
- `unset` завершується з помилкою, якщо названого сервера не існує.

Приклади:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Поширені рецепти серверів

Ці приклади лише зберігають визначення серверів. Після цього запустіть `openclaw mcp doctor --probe`, щоб довести, що сервер запускається та відкриває інструменти.

<Tabs>
  <Tab title="Файлова система">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Обмежуйте файлові сервери найменшим деревом каталогів, яке агент має читати або редагувати.

  </Tab>
  <Tab title="Пам’ять">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Використовуйте фільтр інструментів, якщо сервер відкриває інструменти запису, які не мають бути доступними звичайним агентам.

  </Tab>
  <Tab title="Локальний скрипт">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` перевіряє, що `cwd` існує і що команда розв’язується з налаштованого середовища.

  </Tab>
  <Tab title="Віддалений HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Використовуйте OAuth, коли віддалений сервер його підтримує. Якщо сервер потребує статичних заголовків, уникайте комітування буквальних bearer-токенів.

  </Tab>
  <Tab title="Робочий стіл/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Сервери прямого керування робочим столом успадковують дозволи процесу, який вони запускають. Використовуйте вузькі фільтри інструментів і запити дозволів на рівні ОС.

  </Tab>
</Tabs>

### Форми JSON-виводу

Використовуйте `--json` для скриптів і панелей моніторингу. Набори полів можуть з часом розширюватися, тому споживачі мають ігнорувати невідомі ключі.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` завершується з ненульовим кодом, коли будь-який увімкнений перевірений сервер має помилку. Попередження повідомляються, але самі по собі не спричиняють збій команди.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` відкриває живу клієнтську сесію MCP. Використовуйте її для підтвердження доступності та можливостей, а не для статичних аудитів конфігурації.

  </Accordion>
</AccordionGroup>

Приклад форми конфігурації:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Транспорт Stdio

Запускає локальний дочірній процес і обмінюється даними через stdin/stdout.

| Поле                       | Опис                                      |
| -------------------------- | ----------------------------------------- |
| `command`                  | Виконуваний файл для запуску (обов’язково) |
| `args`                     | Масив аргументів командного рядка         |
| `env`                      | Додаткові змінні середовища               |
| `cwd` / `workingDirectory` | Робочий каталог для процесу               |

<Warning>
**Фільтр безпеки env для Stdio**

OpenClaw відхиляє ключі env для запуску інтерпретатора, які можуть змінити те, як stdio MCP-сервер запускається до першого RPC, навіть якщо вони з’являються в блоці `env` сервера. Заблоковані ключі включають `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` та подібні змінні керування середовищем виконання. Запуск відхиляє їх із помилкою конфігурації, щоб вони не могли ін’єктувати неявну преамбулу, підмінити інтерпретатор, увімкнути налагоджувач або перенаправити вивід середовища виконання проти процесу stdio. Звичайні змінні env для облікових даних, проксі та конкретного сервера (`GITHUB_TOKEN`, `HTTP_PROXY`, користувацькі `*_API_KEY` тощо) не зачіпаються.

Якщо вашому MCP-серверу справді потрібна одна із заблокованих змінних, встановіть її для хост-процесу gateway замість блока `env` stdio-сервера.
</Warning>

### Транспорт SSE / HTTP

Підключається до віддаленого MCP-сервера через HTTP Server-Sent Events.

| Поле                           | Опис                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| `url`                          | HTTP- або HTTPS-URL віддаленого сервера (обов’язково)                   |
| `headers`                      | Необов’язкова мапа ключ-значення HTTP-заголовків (наприклад, auth-токени) |
| `connectionTimeoutMs`          | Тайм-аут підключення для сервера в мс (необов’язково)                   |
| `connectTimeout`               | Тайм-аут підключення для сервера в секундах (необов’язково)             |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запиту для сервера в секундах або мс                       |
| `auth: "oauth"`                | Використовувати сховище MCP OAuth-токенів і `openclaw mcp login`        |
| `sslVerify`                    | Установлюйте false лише для явно довірених приватних HTTPS-ендпоїнтів   |
| `clientCert` / `clientKey`     | Шляхи до клієнтського сертифіката та ключа mTLS                         |
| `supportsParallelToolCalls`    | Підказка, що паралельні виклики безпечні для цього сервера              |

Приклад:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Конфіденційні значення в `url` (userinfo) і `headers` редагуються в журналах і виводі стану. `openclaw mcp doctor` попереджає, коли схожі на конфіденційні записи `headers` або `env` містять буквальні значення, щоб оператори могли винести ці значення з коміченої конфігурації.

### Робочий процес OAuth

OAuth призначений для HTTP MCP-серверів, які оголошують потік MCP OAuth. Статичні заголовки `Authorization` ігноруються для сервера, поки ввімкнено `auth: "oauth"`.

<Steps>
  <Step title="Збережіть сервер">
    Додайте або оновіть сервер із `auth: "oauth"` і будь-якими необов’язковими метаданими OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Почніть вхід">
    Запустіть login, щоб створити запит авторизації.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw виводить URL авторизації та зберігає тимчасовий стан верифікатора OAuth у каталозі стану OpenClaw.

  </Step>
  <Step title="Завершіть кодом">
    Після схвалення в браузері передайте повернений код назад до OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Перевірте авторизацію">
    Використовуйте status або doctor, щоб підтвердити наявність токенів.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Очистьте облікові дані">
    Logout видаляє збережені облікові дані OAuth, але зберігає визначення сервера.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Якщо провайдер ротує токени або стан авторизації застрягає, запустіть `openclaw mcp logout <name>`, а потім повторіть `login`. `logout` може очистити облікові дані для збереженого HTTP-сервера навіть після видалення `auth: "oauth"` із конфігурації, доки назва сервера та URL усе ще ідентифікують запис у сховищі облікових даних.

### Транспорт Streamable HTTP

`streamable-http` — це додатковий варіант транспорту поряд із `sse` і `stdio`. Він використовує HTTP-стримінг для двоспрямованої комунікації з віддаленими MCP-серверами.

| Поле                           | Опис                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `url`                          | HTTP- або HTTPS-URL віддаленого сервера (обов’язково)                                        |
| `transport`                    | Установіть `"streamable-http"`, щоб вибрати цей транспорт; якщо пропущено, OpenClaw використовує `sse` |
| `headers`                      | Необов’язкова мапа ключ-значення HTTP-заголовків (наприклад, auth-токени)                    |
| `connectionTimeoutMs`          | Тайм-аут підключення для сервера в мс (необов’язково)                                        |
| `connectTimeout`               | Тайм-аут підключення для сервера в секундах (необов’язково)                                  |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запиту для сервера в секундах або мс                                            |
| `auth: "oauth"`                | Використовувати сховище MCP OAuth-токенів і `openclaw mcp login`                             |
| `sslVerify`                    | Установлюйте false лише для явно довірених приватних HTTPS-ендпоїнтів                        |
| `clientCert` / `clientKey`     | Шляхи до клієнтського сертифіката та ключа mTLS                                              |
| `supportsParallelToolCalls`    | Підказка, що паралельні виклики безпечні для цього сервера                                   |

Конфігурація OpenClaw використовує `transport: "streamable-http"` як канонічне написання. CLI-нативні значення MCP `type: "http"` приймаються під час збереження через `openclaw mcp set` і виправляються `openclaw doctor --fix` в наявній конфігурації, але `transport` — це те, що вбудований OpenClaw споживає напряму.

Приклад:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Команди реєстру не запускають міст каналу. Лише `probe` і `doctor --probe` відкривають живу клієнтську сесію MCP, щоб підтвердити доступність цільового сервера.
</Note>

## Control UI

Браузерний Control UI містить окрему сторінку налаштувань MCP за адресою `/mcp`. Вона показує кількість налаштованих серверів, зведення про ввімкнення/OAuth/фільтри, рядки транспорту для кожного сервера, елементи керування ввімкненням/вимкненням, поширені CLI-команди та редактор з областю дії для розділу конфігурації `mcp`.

Використовуйте сторінку для операторських редагувань і швидкої інвентаризації. Використовуйте `openclaw mcp doctor --probe` або `openclaw mcp probe`, коли потрібне живе підтвердження сервера.

Робочий процес оператора:

1. Відкрийте Control UI і виберіть **MCP**.
2. Перегляньте підсумкові картки для загальної кількості, увімкнених, OAuth і відфільтрованих серверів.
3. Використовуйте кожен рядок сервера для підказок щодо транспорту, автентифікації, фільтра, часу очікування та команди.
4. Перемикайте ввімкнення, коли потрібно зберегти визначення, але виключити його з виявлення під час виконання.
5. Редагуйте секцію конфігурації `mcp` у межах області для структурних змін, як-от нові сервери, заголовки, TLS, метадані OAuth або фільтри інструментів.
6. Виберіть **Зберегти**, щоб лише зберегти конфігурацію, або **Зберегти й опублікувати**, щоб застосувати її через шлях конфігурації Gateway.
7. Запустіть `openclaw mcp doctor --probe`, коли потрібен живий доказ, що відредагований сервер запускається та перелічує інструменти.

Примітки:

- фрагменти команд беруть назви серверів у лапки, щоб незвичні назви залишалися придатними для копіювання в shell
- відображені URL-подібні значення редагуються перед рендерингом, якщо містять вбудовані облікові дані
- сторінка сама не запускає транспорти MCP
- активним середовищам виконання може знадобитися `openclaw mcp reload`, публікація конфігурації Gateway або перезапуск процесу залежно від того, який процес володіє клієнтами MCP

## Поточні обмеження

Ця сторінка документує міст у тому вигляді, у якому він постачається сьогодні.

Поточні обмеження:

- виявлення розмов залежить від наявних метаданих маршруту сеансу Gateway
- немає універсального push-протоколу поза адаптером, специфічним для Claude
- інструментів для редагування повідомлень або реакцій поки немає
- транспорт HTTP/SSE/streamable-http підключається до одного віддаленого сервера; мультиплексованого upstream поки немає
- `permissions_list_open` містить лише схвалення, зафіксовані, поки міст підключений

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Plugins](/uk/cli/plugins)
