---
read_when:
    - Підключення Codex, Claude Code або іншого клієнта MCP до каналів на базі OpenClaw
    - Виконується `openclaw mcp serve`
    - Керування визначеннями серверів MCP, збереженими в OpenClaw
sidebarTitle: MCP
summary: Надавайте доступ до розмов у каналах OpenClaw через MCP і керуйте збереженими визначеннями серверів MCP
title: MCP
x-i18n:
    generated_at: "2026-07-16T17:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` має два завдання:

- запускати OpenClaw як сервер MCP за допомогою `openclaw mcp serve`
- керувати визначеннями вихідних серверів MCP під керуванням OpenClaw за допомогою `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` і `unset`

`serve` — це OpenClaw, що працює як сервер MCP. Інші підкоманди — це OpenClaw, що працює як клієнтський реєстр MCP для серверів, які згодом можуть використовувати його власні середовища виконання.

<Note>
  `list`, `show`, `set` і `unset` лише читають і записують записи `mcp.servers` під керуванням OpenClaw у конфігурації OpenClaw. Вони не охоплюють сервери mcporter з `config/mcporter.json`; для цього реєстру використовуйте `mcporter list`.
</Note>

Використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має самостійно розміщувати сеанс середовища програмування та спрямовувати це середовище виконання через ACP.

## Вибір правильного шляху MCP

| Мета                                                                | Використовуйте                                                        | Чому                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Дозволити зовнішньому клієнту MCP читати й надсилати повідомлення в розмовах каналів OpenClaw | `openclaw mcp serve`                                                 | OpenClaw є сервером MCP і надає через stdio розмови, підтримувані Gateway.                                      |
| Зберегти сторонні сервери MCP для запусків агентів під керуванням OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw є клієнтським реєстром MCP і згодом передає ці сервери до придатних середовищ виконання.                |
| Перевірити збережений сервер без запуску ходу агента                | `openclaw mcp status`, `doctor`, `probe`                             | `status` і `doctor` перевіряють конфігурацію; `probe` відкриває активне з’єднання MCP і виводить список можливостей. |
| Редагувати конфігурацію MCP у браузері                              | Control UI `/settings/mcp` (псевдонім `/mcp`)                            | Сторінка показує перелік, стан увімкнення, зведення OAuth/фільтрів, підказки щодо команд і редактор `mcp` з обмеженою областю дії. |
| Надати Codex app-server нативний сервер MCP з обмеженою областю дії | `mcp.servers.<name>.codex`                                           | Блок `codex` впливає лише на проєкцію потоків Codex app-server і вилучається перед передаванням нативної конфігурації. |
| Запускати сеанси середовища, розміщені через ACP                    | [`openclaw acp`](/uk/cli/acp) і [Агенти ACP](/uk/tools/acp-agents-setup) | Режим мосту ACP не приймає впровадження сервера MCP для окремого сеансу; натомість налаштуйте мости Gateway/Plugin. |

<Tip>
Якщо ви не впевнені, який шлях потрібен, почніть із `openclaw mcp status --verbose`. Він показує, що збережено в OpenClaw, не запускаючи жодних серверів MCP.
</Tip>

## OpenClaw як сервер MCP

Це шлях `openclaw mcp serve`.

### Коли використовувати serve

Використовуйте `openclaw mcp serve`, коли:

- Codex, Claude Code або інший клієнт MCP має безпосередньо взаємодіяти з розмовами каналів, підтримуваними OpenClaw
- у вас уже є локальний або віддалений OpenClaw Gateway із маршрутизованими сеансами
- вам потрібен один сервер MCP, який працює з усіма серверними частинами каналів OpenClaw, замість запуску окремих мостів для кожного каналу

Натомість використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має самостійно розміщувати середовище виконання для програмування та утримувати сеанс агента в OpenClaw.

### Принцип роботи

`openclaw mcp serve` запускає сервер MCP через stdio. Цей процес належить клієнту MCP. Поки клієнт утримує сеанс stdio відкритим, міст підключається через WebSocket до локального або віддаленого OpenClaw Gateway і надає маршрутизовані розмови каналів через MCP.

<Steps>
  <Step title="Клієнт запускає міст">
    Клієнт MCP запускає `openclaw mcp serve`.
  </Step>
  <Step title="Міст підключається до Gateway">
    Міст підключається до OpenClaw Gateway через WebSocket.
  </Step>
  <Step title="Сеанси стають розмовами MCP">
    Маршрутизовані сеанси стають розмовами MCP та інструментами для стенограм і журналу.
  </Step>
  <Step title="Події наживо стають у чергу">
    Події наживо зберігаються в черзі в пам’яті, доки міст підключений.
  </Step>
  <Step title="Необов’язкові push-сповіщення Claude">
    Якщо ввімкнено режим каналу Claude, той самий сеанс також може отримувати push-сповіщення, специфічні для Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Важливі особливості">
    - стан черги подій наживо починається з моменту підключення мосту
    - давніша історія стенограм читається за допомогою `messages_read`
    - push-сповіщення Claude існують лише протягом активного сеансу MCP
    - коли клієнт відключається, міст завершує роботу, а черга подій наживо зникає
    - одноразові точки входу агента, як-от `openclaw agent` і `openclaw infer model run`, завершують роботу всіх відкритих ними вбудованих середовищ виконання MCP після завершення відповіді, тому повторні сценарні запуски не накопичують дочірні процеси MCP через stdio
    - сервери MCP через stdio, запущені OpenClaw (вбудовані або налаштовані користувачем), під час завершення роботи зупиняються разом з усім деревом процесів, тому дочірні підпроцеси, запущені сервером, не продовжують роботу після завершення батьківського клієнта stdio
    - видалення або скидання сеансу звільняє клієнти MCP цього сеансу через спільний шлях очищення середовища виконання, тому не залишається активних з’єднань stdio, пов’язаних із видаленим сеансом

  </Accordion>
</AccordionGroup>

### Вибір режиму клієнта

<Tabs>
  <Tab title="Універсальні клієнти MCP">
    Лише стандартні інструменти MCP. Використовуйте `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` та інструменти схвалення.
  </Tab>
  <Tab title="Claude Code">
    Стандартні інструменти MCP і адаптер каналу, специфічний для Claude. Увімкніть `--claude-channel-mode on` або залиште стандартне значення `auto`.
  </Tab>
</Tabs>

<Note>
Наразі `auto` працює так само, як `on`. Виявлення можливостей клієнта ще не реалізовано.
</Note>

### Що надає serve

Міст використовує наявні метадані маршрутів сеансів Gateway, щоб надавати розмови, підтримувані каналами. Розмова з’являється, коли OpenClaw уже має стан сеансу з відомим маршрутом, наприклад:

- `channel`
- метадані одержувача або призначення
- необов’язковий `accountId`
- необов’язковий `threadId`

Завдяки цьому клієнти MCP можуть в одному місці:

- переглядати список нещодавніх маршрутизованих розмов
- читати недавню історію стенограм
- очікувати нових вхідних подій
- надсилати відповідь тим самим маршрутом
- переглядати запити на схвалення, що надходять, поки міст підключений

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
  <Tab title="Докладний режим / Claude вимкнено">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Інструменти мосту

<AccordionGroup>
  <Accordion title="conversations_list">
    Виводить список нещодавніх розмов на основі сеансів, які вже мають метадані маршруту в стані сеансів Gateway.

    Фільтри: `limit` (макс. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Повертає одну розмову за `session_key` за допомогою прямого пошуку сеансу Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Читає недавні повідомлення стенограми для однієї розмови на основі сеансу. Стандартне значення `limit` — 20, максимальне — 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Видобуває нетекстові блоки вмісту повідомлення з одного повідомлення стенограми. Це подання метаданих вмісту стенограми, а не окреме довготривале сховище двійкових об’єктів вкладень.
  </Accordion>
  <Accordion title="events_poll">
    Читає події з черги, починаючи із числового курсора. Максимальне значення `limit` — 200.
  </Accordion>
  <Accordion title="events_wait">
    Виконує тривале опитування, доки не надійде наступна відповідна подія в черзі або не мине час очікування (стандартно 30s, максимально 300s).

    Використовуйте це, коли універсальному клієнту MCP потрібне доставлення майже в реальному часі без протоколу push-сповіщень, специфічного для Claude.

  </Accordion>
  <Accordion title="messages_send">
    Надсилає текст тим самим маршрутом, який уже записано для сеансу.

    Поточна поведінка:

    - потребує наявного маршруту розмови
    - використовує канал, одержувача, ідентифікатор облікового запису та ідентифікатор гілки сеансу
    - надсилає лише текст

  </Accordion>
  <Accordion title="permissions_list_open">
    Виводить список нерозглянутих запитів на схвалення виконання/Plugin, які міст виявив після підключення до Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Розв’язує один нерозглянутий запит на схвалення виконання/Plugin за допомогою:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Модель подій

Поки міст підключений, він зберігає чергу подій у пам’яті.

Поточні типи подій:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- черга містить лише події наживо; вона починається із запуском мосту MCP
- `events_poll` і `events_wait` самі по собі не відтворюють давнішу історію Gateway
- довготривалий журнал невиконаних подій слід читати за допомогою `messages_read`

</Warning>

### Сповіщення каналу Claude

Міст також може надавати сповіщення каналу, специфічні для Claude. Це еквівалент адаптера каналу Claude Code в OpenClaw: стандартні інструменти MCP залишаються доступними, але вхідні повідомлення наживо також можуть надходити як сповіщення MCP, специфічні для Claude.

<Tabs>
  <Tab title="вимкнено">
    `--claude-channel-mode off`: лише стандартні інструменти MCP.
  </Tab>
  <Tab title="увімкнено">
    `--claude-channel-mode on`: увімкнути сповіщення каналу Claude.
  </Tab>
  <Tab title="автоматично (стандартне значення)">
    `--claude-channel-mode auto`: поточне стандартне значення; поведінка мосту така сама, як у `on`.
  </Tab>
</Tabs>

Коли режим каналу Claude увімкнено, сервер оголошує експериментальні можливості Claude і може надсилати:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Поточна поведінка мосту:

- вхідні повідомлення стенограми `user` пересилаються як `notifications/claude/channel`
- запити Claude на дозвіл, отримані через MCP, відстежуються в пам’яті
- якщо власник команди в пов’язаній розмові згодом надсилає `yes <id>` або `no <id>` (`<id>` — це 5-літерний ідентифікатор запиту без `l`), міст перетворює це на `notifications/claude/channel/permission`
- ці сповіщення доступні лише протягом активного сеансу; якщо клієнт MCP відключається, ціль для push-сповіщень відсутня

Це навмисно залежить від конкретного клієнта. Універсальні клієнти MCP мають покладатися на стандартні інструменти опитування.

### Конфігурація клієнта MCP

Приклад конфігурації клієнта stdio:

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

Для більшості універсальних клієнтів MCP почніть зі стандартного набору інструментів та ігноруйте режим Claude. Вмикайте режим Claude лише для клієнтів, які справді розуміють специфічні для Claude методи сповіщень.

### Параметри

`openclaw mcp serve` підтримує:

<ParamField path="--url" type="string">
  URL-адреса WebSocket Gateway. Типове значення — `gateway.remote.url`, якщо налаштовано.
</ParamField>
<ParamField path="--token" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Прочитати токен із файлу.
</ParamField>
<ParamField path="--password" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Прочитати пароль із файлу.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Режим сповіщень Claude. Типове значення — `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Докладні журнали у stderr.
</ParamField>

<Tip>
За можливості віддавайте перевагу `--token-file` або `--password-file` замість секретів, указаних безпосередньо.
</Tip>

### Межа безпеки й довіри

Міст не вигадує маршрутизацію. Він лише надає доступ до розмов, які Gateway уже вміє маршрутизувати.

Це означає:

- списки дозволених відправників, сполучення та довіра на рівні каналу й надалі належать до базової конфігурації каналу OpenClaw
- `messages_send` може відповідати лише через наявний збережений маршрут
- стан схвалення існує лише наживо в пам’яті протягом поточного сеансу мосту
- для автентифікації мосту слід використовувати ті самі засоби керування токеном або паролем Gateway, яким ви довірили б будь-якого іншого віддаленого клієнта Gateway

Якщо розмова відсутня в `conversations_list`, зазвичай причина не в конфігурації MCP. Причиною є відсутні або неповні метадані маршруту в базовому сеансі Gateway.

### Тестування

OpenClaw постачається з детермінованим Docker-смоук-тестом для цього мосту:

```bash
pnpm test:docker:mcp-channels
```

Цей смоук-тест запускає один контейнер: він заповнює стан розмови, запускає Gateway, потім породжує `openclaw mcp serve` як дочірній процес stdio та керує ним як клієнтом MCP. Він перевіряє виявлення розмов, читання розшифровок, читання метаданих вкладень, поведінку черги подій наживо, а також сповіщення про канали й дозволи у стилі Claude через справжній міст MCP stdio. Маршрутизація вихідного надсилання (`messages_send` із повторним використанням збереженого маршруту розмови) окремо покривається модульними тестами в `src/mcp/channel-server.test.ts`.

Це найшвидший спосіб довести працездатність мосту без підключення справжнього облікового запису Telegram, Discord або iMessage до тестового запуску.

Ширший контекст тестування див. у розділі [Тестування](/uk/help/testing).

### Усунення несправностей

<AccordionGroup>
  <Accordion title="Розмови не повертаються">
    Зазвичай це означає, що сеанс Gateway ще не придатний для маршрутизації. Переконайтеся, що базовий сеанс містить збережені метадані маршруту каналу/провайдера, одержувача та, за потреби, облікового запису/гілки.
  </Accordion>
  <Accordion title="events_poll або events_wait пропускає старіші повідомлення">
    Це очікувана поведінка. Черга подій наживо запускається, коли міст підключається. Читайте старішу історію розшифровки за допомогою `messages_read`.
  </Accordion>
  <Accordion title="Сповіщення Claude не з’являються">
    Перевірте все наведене нижче:

    - клієнт не закрив сеанс MCP stdio
    - `--claude-channel-mode` має значення `on` або `auto`
    - клієнт справді розуміє специфічні для Claude методи сповіщень
    - вхідне повідомлення надійшло після підключення мосту

  </Accordion>
  <Accordion title="Схвалення відсутні">
    `permissions_list_open` показує лише запити на схвалення, отримані під час підключення мосту. Це не API довготривалої історії схвалень.
  </Accordion>
</AccordionGroup>

## OpenClaw як реєстр клієнтів MCP

Це шлях `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` та `unset`.

Ці команди не надають доступ до OpenClaw через MCP. Вони керують визначеннями серверів MCP, якими керує OpenClaw, у розділі `mcp.servers` конфігурації OpenClaw. Вони не читають сервери mcporter з `config/mcporter.json`.

Збережені визначення призначені для середовищ виконання, які OpenClaw запускає або налаштовує пізніше, як-от вбудований OpenClaw та інші адаптери середовищ виконання. OpenClaw зберігає визначення централізовано, щоб цим середовищам виконання не доводилося зберігати власні дублікати списків серверів MCP.

<AccordionGroup>
  <Accordion title="Важлива поведінка">
    - ці команди лише читають або записують конфігурацію OpenClaw
    - `status`, `list`, `show`, `doctor` без `--probe`, `set`, `configure`, `tools`, `logout`, `reload` та `unset` не підключаються до цільового сервера MCP
    - `login` виконує мережевий потік OAuth MCP для налаштованого HTTP-сервера та зберігає отримані локальні облікові дані
    - `status --verbose` виводить визначені підказки щодо транспорту, автентифікації, часу очікування, фільтрів і паралельних викликів інструментів без підключення
    - `doctor` перевіряє збережені визначення на локальні проблеми налаштування, як-от відсутні команди stdio, недійсні робочі каталоги, відсутні файли TLS, вимкнені сервери, буквальні конфіденційні значення заголовків/змінних середовища та незавершена авторизація OAuth
    - `doctor --probe` додає таку саму перевірку підключення наживо, як `probe`, після успішного проходження статичних перевірок
    - `probe` підключається до вибраного сервера або всіх налаштованих серверів, перелічує інструменти та повідомляє про можливості/діагностику
    - `add` створює визначення з прапорців і перевіряє його перед збереженням, якщо не встановлено `--no-probe` або спочатку не потрібна авторизація OAuth
    - адаптери середовищ виконання під час виконання визначають, які форми транспорту вони справді підтримують
    - `enabled: false` зберігає сервер, але виключає його з виявлення вбудованим середовищем виконання
    - `timeout` та `connectTimeout` задають для кожного сервера час очікування запитів і підключення в секундах
    - `supportsParallelToolCalls: true` позначає сервери, які адаптери можуть викликати паралельно
    - HTTP-сервери можуть використовувати статичні заголовки, вхід через OAuth, керування перевіркою TLS і шляхи до сертифіката/ключа mTLS
    - вбудований OpenClaw надає налаштовані інструменти MCP у звичайних профілях інструментів `coding` та `messaging`; `minimal` усе ще приховує їх, а `tools.deny: ["bundle-mcp"]` явно вимикає
    - параметри `toolFilter.include` та `toolFilter.exclude` для кожного сервера фільтрують виявлені інструменти MCP, перш ніж вони стануть інструментами OpenClaw
    - сервери, що оголошують ресурси або запити, також надають допоміжні інструменти для переліку/читання ресурсів і переліку/отримання запитів; ці створені допоміжні назви (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) використовують той самий фільтр включення/виключення
    - динамічні зміни списку інструментів MCP роблять кешований каталог для цього сеансу недійсним; наступне виявлення/використання оновлює його із сервера
    - повторювані помилки запитів інструментів/протоколу MCP ненадовго призупиняють цей сервер, щоб один несправний сервер не займав увесь хід
    - пакетні середовища виконання MCP з областю дії сеансу завершуються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10 хвилин; установіть `0`, щоб вимкнути), а одноразові вбудовані запуски очищають їх наприкінці запуску

  </Accordion>
</AccordionGroup>

Адаптери середовищ виконання можуть нормалізувати цей спільний реєстр до форми, яку очікує їхній нижчий клієнт. Наприклад, вбудований OpenClaw безпосередньо споживає значення OpenClaw `transport`, тоді як Claude Code і Gemini отримують нативні для CLI значення `type`, як-от `http`, `sse` або `stdio`.

Codex app-server також враховує необов’язковий блок `codex` на кожному сервері. Це
метадані проєкції OpenClaw лише для гілок Codex app-server; вони не
змінюють сеанси ACP, конфігурацію універсального середовища Codex або інші адаптери середовищ виконання.
Використовуйте непорожній `codex.agents`, щоб проєктувати сервер лише в певні
ідентифікатори агентів OpenClaw. Порожні, незаповнені або недійсні списки агентів відхиляються під час перевірки
конфігурації та пропускаються шляхом проєкції середовища виконання замість того, щоб ставати
глобальними. Використовуйте `codex.defaultToolsApprovalMode` (`auto`, `prompt` або `approve`),
щоб створити нативний `default_tools_approval_mode` Codex для довіреного сервера.
OpenClaw вилучає метадані `codex`, перш ніж передати нативну конфігурацію `mcp_servers`
до Codex.

### Збережені визначення серверів MCP

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
- `show` без назви виводить повний об’єкт налаштованого сервера MCP.
- `status` класифікує налаштовані транспорти без підключення. `--verbose` включає визначені відомості про запуск, час очікування, OAuth, фільтри та паралельні виклики.
- `doctor` виконує статичні перевірки без підключення. Додайте `--probe`, якщо команда також має перевірити підключення ввімкнених серверів.
- `probe` підключається та повідомляє кількість інструментів, підтримку ресурсів/запитів, підтримку зміни списку й діагностику.
- `add` приймає прапорці stdio, як-от `--command`, `--arg`, `--env` та `--cwd`, або прапорці HTTP, як-от `--url`, `--transport`, `--header`, `--auth oauth`, а також прапорці TLS, часу очікування й вибору інструментів.
- `set` очікує одне значення об’єкта JSON у командному рядку.
- `configure` оновлює стан увімкнення, фільтри інструментів, часи очікування, OAuth, TLS і підказки щодо паралельних викликів інструментів без заміни всього визначення сервера. Додайте `--probe`, щоб перевірити оновлений сервер перед збереженням.
- `tools` оновлює фільтри інструментів для кожного сервера. Записи включення/виключення — це назви інструментів MCP і прості шаблони `*`.
- `login` запускає потік OAuth для HTTP-серверів, налаштованих із `auth: "oauth"`. Перший запуск виводить URL-адресу авторизації; після схвалення запустіть повторно з `--code`.
- `logout` очищає збережені облікові дані OAuth для вказаного сервера, не видаляючи збережене визначення сервера.
- `reload` звільняє кешовані внутрішньопроцесні середовища виконання MCP лише для поточного процесу CLI. Процеси Gateway або агента в іншому процесі все одно потребують власного способу перезавантаження чи перезапуску.
- Використовуйте `transport: "streamable-http"` для серверів MCP Streamable HTTP. `openclaw mcp set` також нормалізує нативний для CLI `type: "http"` до тієї самої канонічної форми конфігурації для сумісності.
- `unset` завершується помилкою, якщо вказаний сервер не існує.

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

Ці приклади лише зберігають визначення серверів. Після цього запустіть `openclaw mcp doctor --probe`, щоб переконатися, що сервер запускається та надає інструменти.

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

    Обмежуйте сервери файлової системи найменшим деревом каталогів, яке агент повинен читати або редагувати.

  </Tab>
  <Tab title="Пам’ять">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Використовуйте фільтр інструментів, якщо сервер надає інструменти запису, які не мають бути доступні звичайним агентам.

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

    `doctor` перевіряє, що `cwd` існує та що команда визначається в налаштованому середовищі.

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

    Використовуйте OAuth, коли віддалений сервер його підтримує. Якщо серверу потрібні статичні заголовки, не додавайте буквальні токени носія до комітів.

  </Tab>
  <Tab title="Робочий стіл/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Сервери безпосереднього керування робочим столом успадковують дозволи процесу, який вони запускають. Використовуйте вузькі фільтри інструментів і запити дозволів на рівні ОС.

  </Tab>
</Tabs>

### Структури виводу JSON

Використовуйте `--json` для скриптів і панелей керування. Набори полів можуть із часом розширюватися, тому споживачі мають ігнорувати невідомі ключі.

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Облікові дані OAuth не авторизовано; запустіть openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` завершується з ненульовим кодом, коли будь-який увімкнений перевірений сервер має проблему рівня `error`. Проблеми `warning` і `info` повідомляються, але самі собою не спричиняють помилку команди.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` відкриває активний сеанс клієнта MCP і виводить його результат безпосередньо; на відміну від `status`/`doctor`, вивід не має поля верхнього рівня `path`. Ключі `resources` і `prompts` наявні лише тоді, коли сервер справді оголошує відповідну можливість (сервер без запитів не містить ключа `prompts`, а не повідомляє `false`). Використовуйте `probe` для підтвердження доступності та можливостей, а не для статичного аудиту конфігурації.

  </Accordion>
</AccordionGroup>

Приклад структури конфігурації:

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

| Поле                       | Опис                                  |
| -------------------------- | ------------------------------------- |
| `command`                  | Виконуваний файл для запуску (обов’язково) |
| `args`                     | Масив аргументів командного рядка     |
| `env`                      | Додаткові змінні середовища           |
| `cwd` / `workingDirectory` | Робочий каталог процесу               |

<Warning>
**Фільтр безпеки середовища Stdio**

OpenClaw відхиляє ключі середовища для запуску інтерпретатора, перехоплення завантажувача та ініціалізації оболонки перед запуском MCP-сервера stdio, навіть якщо вони містяться в блоці `env` сервера. Для цього застосовується та сама політика безпеки середовища хоста, що й для інших процесів, запущених OpenClaw: блокуються відомі перехоплювачі запуску інтерпретатора (наприклад, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), префікси впровадження спільних бібліотек і функцій (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) та подібні змінні керування середовищем виконання. Під час запуску вони мовчки вилучаються, а система записує попередження, щоб вони не могли впровадити неявний пролог, замінити інтерпретатор, увімкнути налагоджувач або перехопити динамічний компонувальник процесу stdio. Явний список дозволених значень дає змогу використовувати звичайні змінні середовища з обліковими даними MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), а також звичайні змінні середовища проксі та конкретного сервера (`HTTP_PROXY`, спеціальні `*_API_KEY` тощо). Інші ключі `AWS_*`, як-от `AWS_CONFIG_FILE` і `AWS_SHARED_CREDENTIALS_FILE`, залишаються заблокованими, оскільки вони вказують на файли облікових даних, а не безпосередньо містять значення облікових даних.

Якщо MCP-серверу справді потрібна одна із заблокованих змінних, задайте її для процесу хоста Gateway, а не в `env` сервера stdio.
</Warning>

### Транспорт SSE / HTTP

Підключається до віддаленого MCP-сервера через події HTTP Server-Sent Events.

| Поле                           | Опис                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `url`                          | URL-адреса HTTP або HTTPS віддаленого сервера (обов’язково)           |
| `headers`                      | Необов’язкове відображення ключів і значень заголовків HTTP (наприклад, токенів автентифікації) |
| `connectionTimeoutMs`          | Час очікування підключення для окремого сервера в мс (необов’язково)  |
| `connectTimeout`               | Час очікування підключення для окремого сервера в секундах (необов’язково) |
| `timeout` / `requestTimeoutMs` | Час очікування запиту MCP для окремого сервера в секундах або мс      |
| `auth: "oauth"`                | Використовувати облікові дані MCP OAuth, збережені командою `openclaw mcp login` |
| `sslVerify`                    | Установлюйте false лише для явно довірених приватних кінцевих точок HTTPS |
| `clientCert` / `clientKey`     | Шляхи до сертифіката й ключа клієнта mTLS                             |
| `supportsParallelToolCalls`    | Вказує, що паралельні виклики безпечні для цього сервера              |

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

Конфіденційні значення в `url` (відомостях про користувача) і `headers` приховуються в журналах і виводі стану. `openclaw mcp doctor` попереджає, коли схожі на конфіденційні записи `headers` або `env` містять буквальні значення, щоб оператори могли винести їх із конфігурації, доданої до комітів.

### Робочий процес OAuth

OAuth призначено для MCP-серверів HTTP, які оголошують підтримку потоку MCP OAuth. Статичні заголовки `Authorization` ігноруються для сервера, коли ввімкнено `auth: "oauth"`. Облікові дані, збережені командою `openclaw mcp login`, працюють із вбудованим MCP, засобами запуску CLI та локальним сервером застосунку Codex.

Доки облікові дані недоступні, OpenClaw вилучає з середовища виконання агента лише цей MCP-сервер, а не завершує хід агента з помилкою. Після цього оператор або агент із доступом до оболонки може запустити `openclaw mcp login <name>` і скористатися сервером у наступному ході.

Якщо віддалена служба MCP уже використовує окремий профіль автентифікації OpenClaw із можливістю оновлення, можна додатково встановити `oauth.authProfileId`. OpenClaw оновлює будь-яке із джерел облікових даних перед проєкцією середовища виконання та передає нижчому клієнту MCP лише поточний токен доступу.

<Steps>
  <Step title="Збережіть сервер">
    Додайте або оновіть сервер за допомогою `auth: "oauth"` та будь-яких необов’язкових метаданих OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Для токена носія, пов’язаного з профілем автентифікації, збережіть прив’язку профілю:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Розпочніть вхід">
    Запустіть вхід, щоб створити запит на авторизацію.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw виводить URL-адресу авторизації та зберігає тимчасовий стан верифікатора OAuth у каталозі стану OpenClaw.

  </Step>
  <Step title="Завершіть за допомогою коду">
    Після схвалення в браузері передайте повернений код назад до OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Перевірка авторизації">
    Скористайтеся status або doctor, щоб підтвердити наявність токенів.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Очищення облікових даних">
    Вихід видаляє збережені облікові дані OAuth, але зберігає визначення сервера.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Якщо постачальник змінює токени або стан авторизації зависає, виконайте `openclaw mcp logout <name>`, а потім повторіть `login`. `logout` може очистити облікові дані збереженого HTTP-сервера навіть після видалення `auth: "oauth"` з конфігурації, якщо ім’я та URL-адреса сервера все ще дають змогу ідентифікувати запис у сховищі облікових даних.

### Потоковий транспорт HTTP

`streamable-http` — це додатковий варіант транспорту поряд із `sse` та `stdio`. Він використовує потокове передавання HTTP для двостороннього обміну даними з віддаленими серверами MCP.

| Поле                           | Опис                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`             | URL-адреса віддаленого сервера за протоколом HTTP або HTTPS (обов’язково)               |
| `transport`             | Установіть `"streamable-http"`, щоб вибрати цей транспорт; якщо значення не вказано, OpenClaw використовує `sse` |
| `headers`             | Необов’язкова мапа HTTP-заголовків «ключ — значення» (наприклад, токенів автентифікації) |
| `connectionTimeoutMs`             | Час очікування підключення для окремого сервера в мс (необов’язково)                    |
| `connectTimeout`             | Час очікування підключення для окремого сервера у секундах (необов’язково)              |
| `timeout` / `requestTimeoutMs` | Час очікування запиту MCP для окремого сервера у секундах або мс             |
| `auth: "oauth"`             | Використовувати облікові дані MCP OAuth, збережені за допомогою `openclaw mcp login`       |
| `sslVerify`             | Установлюйте false лише для явно довірених приватних кінцевих точок HTTPS               |
| `clientCert` / `clientKey` | Шляхи до клієнтського сертифіката та ключа mTLS                              |
| `supportsParallelToolCalls`             | Ознака того, що паралельні виклики безпечні для цього сервера                           |

У конфігурації OpenClaw канонічним написанням є `transport: "streamable-http"`. Значення `type: "http"`, властиві MCP у CLI, приймаються під час збереження через `openclaw mcp set` і виправляються командою `openclaw doctor --fix` в наявній конфігурації, але вбудований OpenClaw безпосередньо використовує `transport`.

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
Команди реєстру не запускають міст каналу. Лише `probe` та `doctor --probe` відкривають активний клієнтський сеанс MCP, щоб перевірити доступність цільового сервера.
</Note>

## Інтерфейс керування

Браузерний інтерфейс керування містить окрему сторінку налаштувань MCP за адресою `/settings/mcp`; попередній шлях `/mcp` залишається псевдонімом. На сторінці відображаються кількість налаштованих серверів, зведення щодо ввімкнення, OAuth і фільтрів, рядки транспорту для кожного сервера, елементи керування ввімкненням і вимкненням, поширені команди CLI та редактор із визначеною областю для розділу конфігурації `mcp`.

Використовуйте цю сторінку для операторського редагування та швидкого перегляду ресурсів. Використовуйте `openclaw mcp doctor --probe` або `openclaw mcp probe`, коли потрібна перевірка сервера в реальному часі.

Робочий процес оператора:

1. Відкрийте інтерфейс керування та виберіть **MCP**.
2. Перегляньте картки зведення із загальною кількістю серверів, а також кількістю ввімкнених серверів, серверів з OAuth і відфільтрованих серверів.
3. Використовуйте рядок кожного сервера, щоб переглянути підказки щодо транспорту, автентифікації, фільтра, часу очікування та команд.
4. Перемикайте стан увімкнення, коли потрібно зберегти визначення, але виключити його з виявлення під час виконання.
5. Редагуйте розділ конфігурації `mcp` із визначеною областю для структурних змін, як-от додавання нових серверів, заголовків, TLS, метаданих OAuth або фільтрів інструментів.
6. Виберіть **Save**, щоб лише зберегти конфігурацію, або **Save & Publish**, щоб застосувати її через шлях конфігурації Gateway.
7. Виконайте `openclaw mcp doctor --probe`, коли потрібна перевірка в реальному часі, що відредагований сервер запускається та повертає список інструментів.

Примітки:

- у фрагментах команд імена серверів беруться в лапки, щоб незвичні імена можна було скопіювати в оболонку
- відображувані значення, схожі на URL-адреси, приховуються перед відтворенням, якщо вони містять вбудовані облікові дані
- сторінка сама не запускає транспорти MCP
- активним середовищам виконання може знадобитися `openclaw mcp reload`, публікація конфігурації Gateway або перезапуск процесу залежно від того, який процес керує клієнтами MCP

## Застосунки MCP

OpenClaw може відтворювати інструменти, які реалізують стабільне [розширення MCP Apps](https://modelcontextprotocol.io/extensions/apps). Застосунки потрібно вмикати окремо, оскільки їхній HTML надходить із налаштованого сервера MCP і може запитувати видимі застосунку інструменти або ресурси з того самого сервера.

Увімкніть міст хоста:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Перезапустіть Gateway після зміни цього параметра. Коли його ввімкнено, OpenClaw запускає призначений лише для пісочниці слухач HTTP(S) на порту Gateway плюс один (для типового Gateway — `18790`). Інтерфейс керування завантажує застосунки з цього окремого джерела; слухач ніколи не обслуговує інтерфейс керування, автентифіковані маршрути Gateway або дані користувачів.

Для прямих підключень до Gateway потрібен доступ до обох портів. Якщо зворотний проксі-сервер або термінатор TLS відкриває доступ до інтерфейсу керування, надайте застосункам окреме загальнодоступне джерело та проксіюйте лише його до слухача пісочниці:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Джерело пісочниці має відрізнятися від джерела інтерфейсу керування. Не розміщуйте в ньому інший автентифікований або конфіденційний вміст.

Наприклад, офіційну базову демонстрацію React можна налаштувати так:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Поведінка та межі безпеки:

- OpenClaw оголошує розширення `io.modelcontextprotocol/ui` лише тоді, коли застосунки ввімкнено.
- Відтворюються лише ресурси `ui://` із точним MIME-типом `text/html;profile=mcp-app`.
- Розмір ресурсів інтерфейсу обмежено 2 MiB; вони розміщуються за проксі-сервером із подвійним iframe у спеціальному зовнішньому джерелі, завантажуються в непрозоре внутрішнє джерело застосунку й обмежуються політикою CSP, сформованою з метаданих ресурсу.
- Інструменти лише для застосунків (`_meta.ui.visibility: ["app"]`) не потрапляють до списків інструментів моделі. Застосунки можуть викликати лише видимі застосунку інструменти на своєму сервері-власнику, які також відповідають чинній політиці інструментів OpenClaw для запуску, що створив подання.
- Прив’язані до джерела дозволи застосунку, як-от доступ до камери, мікрофона та геолокації, не надаються, поки внутрішні документи застосунку використовують непрозорі джерела для ізоляції між застосунками.
- HTML застосунку, повні аргументи інструментів і необроблені результати зберігаються в обмеженій десятхвилинній оренді подання в пам’яті та не записуються на диск і не копіюються до метаданих попереднього перегляду розшифрування. У розшифруванні зберігається лише обмежений дескриптор сервера, інструмента й ресурсу, пов’язаний з ідентифікатором початкового виклику інструмента. Після перезапуску Gateway інтерфейс керування може перевірити цей дескриптор за розшифруванням автентифікованого сеансу та повторно отримати ресурс `ui://`; відновлені подання доступні лише для читання, доки новий запуск не встановить поточні дозволи інструментів.
- `openclaw security audit` попереджає, поки міст увімкнено. Вимкніть його за допомогою `openclaw config set mcp.apps.enabled false --strict-json`, коли він не потрібен.

## Поточні обмеження

На цій сторінці описано міст у його поточному випущеному стані.

Поточні обмеження:

- виявлення розмов залежить від наявних метаданих маршрутів сеансів Gateway
- немає універсального протоколу надсилання даних, окрім адаптера, специфічного для Claude
- інструментів редагування повідомлень або додавання реакцій поки немає
- транспорт HTTP/SSE/streamable-http підключається до одного віддаленого сервера; мультиплексованої висхідної передачі поки немає
- `permissions_list_open` містить лише схвалення, зафіксовані під час підключення мосту

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Плагіни](/uk/cli/plugins)
