---
read_when:
    - Підключення Codex, Claude Code або іншого MCP-клієнта до каналів на базі OpenClaw
    - Виконується `openclaw mcp serve`
    - Керування визначеннями MCP-серверів, збереженими OpenClaw
sidebarTitle: MCP
summary: Надавайте доступ до розмов каналів OpenClaw через MCP і керуйте збереженими визначеннями MCP-серверів
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:20:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` має два завдання:

- запускати OpenClaw як MCP-сервер за допомогою `openclaw mcp serve`
- керувати визначеннями вихідних MCP-серверів, якими керує OpenClaw, за допомогою `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` і `unset`

Інакше кажучи:

- `serve` — це OpenClaw, що діє як MCP-сервер
- інші підкоманди — це OpenClaw, що діє як клієнтський реєстр MCP для MCP-серверів, які його середовища виконання можуть споживати пізніше

<Note>
  `list`, `show`, `set` і `unset` лише читають і записують записи `mcp.servers`, якими керує OpenClaw, у конфігурації OpenClaw. Вони не включають сервери mcporter з `config/mcporter.json`; для цього реєстру використовуйте `mcporter list`.
</Note>

Використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має сам розміщувати сесію кодингового harness і маршрутизувати це середовище виконання через ACP.

## Виберіть правильний шлях MCP

OpenClaw має кілька поверхонь MCP. Виберіть ту, що відповідає тому, хто володіє агентним середовищем виконання і хто володіє інструментами.

| Мета                                                                | Використовуйте                                                       | Чому                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Дозволити зовнішньому MCP-клієнту читати/надсилати розмови каналів OpenClaw | `openclaw mcp serve`                                                 | OpenClaw є MCP-сервером і надає розмови на базі Gateway через stdio.                                           |
| Зберегти сторонні MCP-сервери для керованих OpenClaw запусків агентів | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw є клієнтським реєстром MCP і пізніше проєктує ці сервери у придатні середовища виконання.             |
| Перевірити збережений сервер без запуску агентного ходу             | `openclaw mcp status`, `doctor`, `probe`                             | `status` і `doctor` перевіряють конфігурацію; `probe` відкриває живе MCP-з'єднання і перелічує можливості.     |
| Редагувати конфігурацію MCP з браузера                              | Control UI `/mcp`                                                    | Сторінка показує інвентар, увімкнення, підсумки OAuth/фільтрів, підказки команд і scoped-редактор `mcp`.        |
| Надати Codex app-server scoped нативний MCP-сервер                  | `mcp.servers.<name>.codex`                                           | Блок `codex` впливає лише на проєкцію потоку Codex app-server і вилучається перед передаванням нативної конфігурації. |
| Запускати розміщені ACP сесії harness                               | [`openclaw acp`](/uk/cli/acp) і [Агенти ACP](/uk/tools/acp-agents-setup) | Режим ACP bridge не приймає ін'єкцію MCP-сервера на рівні сесії; натомість налаштуйте gateway/plugin-мости.     |

<Tip>
Якщо ви не впевнені, який шлях вам потрібен, почніть з `openclaw mcp status --verbose`. Він показує, що OpenClaw зберіг, не запускаючи жодних MCP-серверів.
</Tip>

## OpenClaw як MCP-сервер

Це шлях `openclaw mcp serve`.

### Коли використовувати `serve`

Використовуйте `openclaw mcp serve`, коли:

- Codex, Claude Code або інший MCP-клієнт має напряму спілкуватися з розмовами каналів на базі OpenClaw
- у вас уже є локальний або віддалений OpenClaw Gateway з маршрутизованими сесіями
- вам потрібен один MCP-сервер, що працює з каналовими бекендами OpenClaw, замість запуску окремих мостів для кожного каналу

Натомість використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має сам розміщувати кодингове середовище виконання і тримати агентну сесію всередині OpenClaw.

### Як це працює

`openclaw mcp serve` запускає stdio MCP-сервер. MCP-клієнт володіє цим процесом. Поки клієнт тримає stdio-сесію відкритою, міст підключається до локального або віддаленого OpenClaw Gateway через WebSocket і надає маршрутизовані розмови каналів через MCP.

<Steps>
  <Step title="Клієнт запускає міст">
    MCP-клієнт запускає `openclaw mcp serve`.
  </Step>
  <Step title="Міст підключається до Gateway">
    Міст підключається до OpenClaw Gateway через WebSocket.
  </Step>
  <Step title="Сесії стають MCP-розмовами">
    Маршрутизовані сесії стають MCP-розмовами та інструментами стенограми/історії.
  </Step>
  <Step title="Живі події стають у чергу">
    Живі події ставляться в чергу в пам'яті, поки міст підключений.
  </Step>
  <Step title="Необов'язковий push Claude">
    Якщо режим каналу Claude увімкнено, та сама сесія також може отримувати push-сповіщення, специфічні для Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Важлива поведінка">
    - стан живої черги починається, коли міст підключається
    - старіша історія стенограми читається за допомогою `messages_read`
    - push-сповіщення Claude існують лише поки MCP-сесія активна
    - коли клієнт відключається, міст завершується, а жива черга зникає
    - одноразові точки входу агента, такі як `openclaw agent` і `openclaw infer model run`, прибирають будь-які вбудовані MCP-середовища виконання, які вони відкривають, коли відповідь завершена, тому повторні скриптові запуски не накопичують дочірні stdio MCP-процеси
    - stdio MCP-сервери, запущені OpenClaw (вбудовані або налаштовані користувачем), завершуються як дерево процесів під час вимкнення, тому дочірні підпроцеси, запущені сервером, не виживають після виходу батьківського stdio-клієнта
    - видалення або скидання сесії звільняє MCP-клієнти цієї сесії через спільний шлях очищення середовища виконання, тому не лишається завислих stdio-з'єднань, прив'язаних до вилученої сесії

  </Accordion>
</AccordionGroup>

### Виберіть режим клієнта

Використовуйте той самий міст двома різними способами:

<Tabs>
  <Tab title="Універсальні MCP-клієнти">
    Лише стандартні MCP-інструменти. Використовуйте `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` та інструменти схвалення.
  </Tab>
  <Tab title="Claude Code">
    Стандартні MCP-інструменти плюс специфічний для Claude адаптер каналу. Увімкніть `--claude-channel-mode on` або залиште стандартне `auto`.
  </Tab>
</Tabs>

<Note>
Сьогодні `auto` поводиться так само, як `on`. Виявлення можливостей клієнта ще немає.
</Note>

### Що надає `serve`

Міст використовує наявні метадані маршрутів сесій Gateway, щоб надавати розмови на базі каналів. Розмова з'являється, коли OpenClaw уже має стан сесії з відомим маршрутом, наприклад:

- `channel`
- метадані одержувача або призначення
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

### Інструменти мосту

Поточний міст надає такі MCP-інструменти:

<AccordionGroup>
  <Accordion title="conversations_list">
    Перелічує нещодавні розмови на базі сесій, які вже мають метадані маршруту в стані сесій Gateway.

    Корисні фільтри:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Повертає одну розмову за `session_key` через прямий пошук сесії Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Читає нещодавні повідомлення стенограми для однієї розмови на базі сесії.
  </Accordion>
  <Accordion title="attachments_fetch">
    Витягує нетекстові блоки вмісту повідомлення з одного повідомлення стенограми. Це подання метаданих поверх вмісту стенограми, а не окреме довговічне сховище blob-вкладень.
  </Accordion>
  <Accordion title="events_poll">
    Читає поставлені в чергу живі події після числового курсора.
  </Accordion>
  <Accordion title="events_wait">
    Виконує long-polling, доки не надійде наступна відповідна подія з черги або не спливе timeout.

    Використовуйте це, коли універсальному MCP-клієнту потрібна майже реального часу доставка без специфічного для Claude push-протоколу.

  </Accordion>
  <Accordion title="messages_send">
    Надсилає текст назад через той самий маршрут, уже записаний у сесії.

    Поточна поведінка:

    - потребує наявного маршруту розмови
    - використовує канал, одержувача, account id і thread id сесії
    - надсилає лише текст

  </Accordion>
  <Accordion title="permissions_list_open">
    Перелічує очікувані запити на схвалення exec/plugin, які міст спостерігав відтоді, як підключився до Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Вирішує один очікуваний запит на схвалення exec/plugin за допомогою:

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
- черга лише жива; вона починається, коли запускається MCP-міст
- `events_poll` і `events_wait` самі по собі не відтворюють старішу історію Gateway
- довговічний backlog слід читати за допомогою `messages_read`

</Warning>

### Сповіщення каналу Claude

Міст також може надавати специфічні для Claude сповіщення каналу. Це еквівалент OpenClaw адаптера каналу Claude Code: стандартні MCP-інструменти лишаються доступними, але живі вхідні повідомлення також можуть надходити як специфічні для Claude MCP-сповіщення.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: лише стандартні MCP-інструменти.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: увімкнути сповіщення каналу Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: поточне значення за замовчуванням; така сама поведінка мосту, як `on`.
  </Tab>
</Tabs>

Коли режим каналу Claude увімкнено, сервер оголошує експериментальні можливості Claude і може надсилати:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Поточна поведінка мосту:

- вхідні повідомлення стенограми `user` пересилаються як `notifications/claude/channel`
- запити дозволів Claude, отримані через MCP, відстежуються в пам'яті
- якщо пов'язана розмова пізніше надсилає `yes abcde` або `no abcde`, міст перетворює це на `notifications/claude/channel/permission`
- ці сповіщення доступні лише для живої сесії; якщо MCP-клієнт відключається, push-цілі немає

Це навмисно специфічно для клієнта. Універсальні MCP-клієнти мають покладатися на стандартні інструменти опитування.

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

Для більшості універсальних MCP-клієнтів почніть зі стандартної поверхні інструментів і ігноруйте режим Claude. Увімкніть режим Claude лише для клієнтів, які справді розуміють специфічні для Claude методи сповіщень.

### Параметри

`openclaw mcp serve` підтримує:

<ParamField path="--url" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Зчитати токен із файлу.
</ParamField>
<ParamField path="--password" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Зчитати пароль із файлу.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Режим сповіщень Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Докладні журнали в stderr.
</ParamField>

<Tip>
За можливості віддавайте перевагу `--token-file` або `--password-file` замість секретів, указаних безпосередньо в команді.
</Tip>

### Безпека та межа довіри

Міст не вигадує маршрутизацію. Він лише надає доступ до розмов, які Gateway уже вміє маршрутизувати.

Це означає:

- списки дозволених відправників, сполучення та довіра на рівні каналу й далі належать базовій конфігурації каналу OpenClaw
- `messages_send` може відповідати лише через наявний збережений маршрут
- стан затверджень є лише активним/у пам’яті для поточного сеансу моста
- автентифікація моста має використовувати ті самі засоби керування токеном або паролем Gateway, яким ви довірилися б для будь-якого іншого віддаленого клієнта Gateway

Якщо розмови немає в `conversations_list`, звична причина не в конфігурації MCP. Причина — відсутні або неповні метадані маршруту в базовому сеансі Gateway.

### Тестування

OpenClaw постачає детермінований Docker smoke для цього моста:

```bash
pnpm test:docker:mcp-channels
```

Цей smoke:

- запускає контейнер Gateway із початковими даними
- запускає другий контейнер, який створює `openclaw mcp serve`
- перевіряє виявлення розмов, читання транскриптів, читання метаданих вкладень, поведінку черги живих подій і маршрутизацію вихідного надсилання
- перевіряє сповіщення каналу й дозволів у стилі Claude через реальний stdio MCP-міст

Це найшвидший спосіб довести, що міст працює, без підключення реального облікового запису Telegram, Discord або iMessage до тестового запуску.

Ширший контекст тестування див. у [Тестування](/uk/help/testing).

### Усунення несправностей

<AccordionGroup>
  <Accordion title="Розмови не повертаються">
    Зазвичай означає, що сеанс Gateway ще не маршрутизований. Підтвердьте, що базовий сеанс має збережені метадані маршруту каналу/провайдера, отримувача та необов’язкового облікового запису/потоку.
  </Accordion>
  <Accordion title="events_poll або events_wait пропускає старіші повідомлення">
    Очікувано. Жива черга запускається, коли міст підключається. Читайте старішу історію транскриптів за допомогою `messages_read`.
  </Accordion>
  <Accordion title="Сповіщення Claude не з’являються">
    Перевірте все наведене:

    - клієнт залишив stdio MCP-сеанс відкритим
    - `--claude-channel-mode` має значення `on` або `auto`
    - клієнт справді розуміє специфічні для Claude методи сповіщень
    - вхідне повідомлення надійшло після підключення моста

  </Accordion>
  <Accordion title="Затвердження відсутні">
    `permissions_list_open` показує лише запити на затвердження, помічені, поки міст був підключений. Це не стійкий API історії затверджень.
  </Accordion>
</AccordionGroup>

## OpenClaw як реєстр клієнтів MCP

Це шлях `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` і `unset`.

Ці команди не відкривають OpenClaw через MCP. Вони керують визначеннями MCP-серверів, керованими OpenClaw, у `mcp.servers` у конфігурації OpenClaw. Вони не читають сервери mcporter з `config/mcporter.json`.

Ці збережені визначення призначені для середовищ виконання, які OpenClaw запускає або конфігурує пізніше, як-от вбудований OpenClaw та інші адаптери середовища виконання. OpenClaw зберігає визначення централізовано, щоб цим середовищам виконання не потрібно було тримати власні дублікати списків MCP-серверів.

<AccordionGroup>
  <Accordion title="Важлива поведінка">
    - ці команди лише читають або записують конфігурацію OpenClaw
    - `status`, `list`, `show`, `doctor` без `--probe`, `set`, `configure`, `tools`, `logout`, `reload` і `unset` не підключаються до цільового MCP-сервера
    - `login` виконує мережевий потік MCP OAuth для налаштованого HTTP-сервера та зберігає отримані локальні облікові дані
    - `status --verbose` виводить підказки щодо розв’язаного транспорту, автентифікації, тайм-ауту, фільтра й паралельних викликів інструментів без підключення
    - `doctor` перевіряє збережені визначення на локальні проблеми налаштування, як-от відсутні stdio-команди, недійсні робочі каталоги, відсутні TLS-файли, вимкнені сервери, буквальні чутливі значення заголовків/env і неповну авторизацію OAuth
    - `doctor --probe` додає такий самий доказ живого підключення, як `probe`, після проходження статичних перевірок
    - `probe` підключається до вибраного сервера або всіх налаштованих серверів, перелічує інструменти та повідомляє про можливості/діагностику
    - `add` будує визначення з прапорців і виконує probes перед збереженням, якщо не встановлено `--no-probe` або спершу не потрібна авторизація OAuth
    - адаптери середовища виконання вирішують під час виконання, які форми транспорту вони фактично підтримують
    - `enabled: false` залишає сервер збереженим, але виключає його з виявлення вбудованим середовищем виконання
    - `timeout` і `connectTimeout` задають для кожного сервера тайм-аути запиту та підключення в секундах
    - `supportsParallelToolCalls: true` позначає сервери, які адаптери можуть викликати конкурентно
    - HTTP-сервери можуть використовувати статичні заголовки, вхід OAuth, керування перевіркою TLS і шляхи до сертифіката/ключа mTLS
    - вбудований OpenClaw надає налаштовані MCP-інструменти у звичайних профілях інструментів `coding` і `messaging`; `minimal` усе ще приховує їх, а `tools.deny: ["bundle-mcp"]` явно вимикає їх
    - `toolFilter.include` і `toolFilter.exclude` для кожного сервера фільтрують виявлені MCP-інструменти, перш ніж вони стануть інструментами OpenClaw
    - сервери, які оголошують ресурси або промпти, також надають службові інструменти для переліку/читання ресурсів і переліку/отримання промптів; ці згенеровані службові назви (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) використовують той самий фільтр include/exclude
    - динамічні зміни списку MCP-інструментів інвалідовують кешований каталог для цього сеансу; наступне виявлення/використання оновлюється із сервера
    - повторні збої запитів/протоколу MCP-інструментів ненадовго призупиняють цей сервер, щоб один зламаний сервер не споживав увесь хід
    - сеансові bundled MCP-середовища виконання прибираються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10 хвилин; встановіть `0`, щоб вимкнути), а одноразові вбудовані запуски очищають їх наприкінці запуску

  </Accordion>
</AccordionGroup>

Адаптери середовища виконання можуть нормалізувати цей спільний реєстр у форму, яку очікує їхній нижчий клієнт. Наприклад, вбудований OpenClaw напряму споживає значення OpenClaw `transport`, тоді як Claude Code і Gemini отримують рідні для CLI значення `type`, як-от `http`, `sse` або `stdio`.

Codex app-server також враховує необов’язковий блок `codex` на кожному сервері. Це
проєкційні метадані OpenClaw лише для потоків Codex app-server; вони не
змінюють ACP-сеанси, загальну конфігурацію Codex harness або інші адаптери середовища виконання.
Використовуйте непорожній `codex.agents`, щоб проєктувати сервер лише в конкретні id агентів OpenClaw.
Порожні, blank або недійсні списки агентів відхиляються перевіркою
конфігурації й пропускаються шляхом проєкції середовища виконання замість того, щоб ставати
глобальними. Використовуйте `codex.defaultToolsApprovalMode` (`auto`, `prompt` або `approve`),
щоб емітувати рідний для Codex `default_tools_approval_mode` для довіреного сервера.
OpenClaw прибирає метадані `codex`, перш ніж передати рідну конфігурацію `mcp_servers`
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
- `show` без назви виводить повний налаштований об’єкт MCP-сервера.
- `status` класифікує налаштовані транспорти без підключення. `--verbose` включає розв’язані подробиці запуску, тайм-ауту, OAuth, фільтра та паралельних викликів.
- `doctor` виконує статичні перевірки без підключення. Додайте `--probe`, коли команда також має перевірити, що ввімкнені сервери підключаються.
- `probe` підключається й повідомляє кількість інструментів, підтримку ресурсів/промптів, підтримку змін списку та діагностику.
- `add` приймає stdio-прапорці, як-от `--command`, `--arg`, `--env` і `--cwd`, або HTTP-прапорці, як-от `--url`, `--transport`, `--header`, `--auth oauth`, TLS, тайм-аут і прапорці вибору інструментів.
- `set` очікує одне значення JSON-об’єкта в командному рядку.
- `configure` оновлює ввімкнення, фільтри інструментів, тайм-аути, OAuth, TLS і підказки паралельних викликів інструментів без заміни всього визначення сервера.
- `tools` оновлює фільтри інструментів для кожного сервера. Записи include/exclude — це назви MCP-інструментів і прості globs `*`.
- `login` запускає потік OAuth для HTTP-серверів, налаштованих з `auth: "oauth"`. Перший запуск виводить URL авторизації; повторіть запуск із `--code` після затвердження.
- `logout` очищає збережені облікові дані OAuth для названого сервера, не видаляючи збережене визначення сервера.
- `reload` звільняє кешовані внутрішньопроцесні MCP-середовища виконання. Gateway або агентні процеси в іншому процесі все ще потребують власного шляху reload або restart.
- Використовуйте `transport: "streamable-http"` для MCP-серверів Streamable HTTP. `openclaw mcp set` також нормалізує рідне для CLI `type: "http"` до тієї самої канонічної форми конфігурації для сумісності.
- `unset` завершується помилкою, якщо названого сервера не існує.

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

Ці приклади лише зберігають визначення серверів. Після цього запустіть `openclaw mcp doctor --probe`, щоб довести, що сервер запускається й надає інструменти.

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

    Обмежуйте сервери файлової системи найменшим деревом каталогів, яке агент має читати або редагувати.

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

    `doctor` перевіряє, що `cwd` існує і що команда розв’язується з налаштованого середовища.

  </Tab>
  <Tab title="Remote HTTP">
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

    Використовуйте OAuth, коли віддалений сервер його підтримує. Якщо сервер потребує статичних заголовків, не комітьте буквальні bearer-токени.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Сервери прямого керування робочим столом успадковують дозволи процесу, який вони запускають. Використовуйте вузькі фільтри інструментів і запити дозволів на рівні ОС.

  </Tab>
</Tabs>

### Форми виводу JSON

Використовуйте `--json` для скриптів і панелей керування. Набори полів можуть з часом розширюватися, тому споживачі мають ігнорувати невідомі ключі.

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

    `doctor --json` завершується з ненульовим кодом, коли будь-який увімкнений перевірений сервер має помилку. Попередження повідомляються, але самі по собі не призводять до збою команди.

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

    `probe` відкриває живий сеанс клієнта MCP. Використовуйте його для підтвердження доступності та можливостей, а не для статичних аудитів конфігурації.

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

| Поле                       | Опис                                         |
| -------------------------- | -------------------------------------------- |
| `command`                  | Виконуваний файл для запуску (обов’язково)   |
| `args`                     | Масив аргументів командного рядка            |
| `env`                      | Додаткові змінні середовища                  |
| `cwd` / `workingDirectory` | Робочий каталог для процесу                  |

<Warning>
**Фільтр безпеки Stdio env**

OpenClaw відхиляє ключі env запуску інтерпретатора, які можуть змінити спосіб запуску stdio MCP-сервера до першого RPC, навіть якщо вони з’являються в блоці `env` сервера. Заблоковані ключі включають `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` і подібні змінні керування середовищем виконання. Запуск відхиляє їх із помилкою конфігурації, щоб вони не могли вставити неявну преамбулу, замінити інтерпретатор, увімкнути налагоджувач або перенаправити вивід середовища виконання проти stdio-процесу. Звичайні облікові, proxy та серверні змінні env (`GITHUB_TOKEN`, `HTTP_PROXY`, власні `*_API_KEY` тощо) не зачіпаються.

Якщо ваш MCP-сервер справді потребує однієї із заблокованих змінних, задайте її в процесі хоста Gateway, а не в `env` stdio-сервера.
</Warning>

### Транспорт SSE / HTTP

Підключається до віддаленого MCP-сервера через HTTP Server-Sent Events.

| Поле                           | Опис                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `url`                          | HTTP або HTTPS URL віддаленого сервера (обов’язково)                  |
| `headers`                      | Необов’язкова мапа ключ-значення HTTP-заголовків (наприклад auth-токени) |
| `connectionTimeoutMs`          | Таймаут підключення для сервера в мс (необов’язково)                  |
| `connectTimeout`               | Таймаут підключення для сервера в секундах (необов’язково)            |
| `timeout` / `requestTimeoutMs` | Таймаут MCP-запиту для сервера в секундах або мс                      |
| `auth: "oauth"`                | Використовувати сховище OAuth-токенів MCP і `openclaw mcp login`      |
| `sslVerify`                    | Встановлюйте false лише для явно довірених приватних HTTPS endpoint   |
| `clientCert` / `clientKey`     | Шляхи до клієнтського сертифіката й ключа mTLS                        |
| `supportsParallelToolCalls`    | Підказка, що паралельні виклики безпечні для цього сервера            |

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

Чутливі значення в `url` (userinfo) і `headers` редагуються в журналах і виводі статусу. `openclaw mcp doctor` попереджає, коли схожі на чутливі записи `headers` або `env` містять буквальні значення, щоб оператори могли винести ці значення з закоміченої конфігурації.

### Робочий процес OAuth

OAuth призначений для HTTP MCP-серверів, які оголошують потік MCP OAuth. Статичні заголовки `Authorization` ігноруються для сервера, доки ввімкнено `auth: "oauth"`.

<Steps>
  <Step title="Save the server">
    Додайте або оновіть сервер із `auth: "oauth"` і будь-якими необов’язковими метаданими OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Запустіть login, щоб створити запит авторизації.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw виводить URL авторизації та зберігає тимчасовий стан OAuth verifier у каталозі стану OpenClaw.

  </Step>
  <Step title="Finish with the code">
    Після підтвердження в браузері передайте повернений code назад до OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Використайте status або doctor, щоб підтвердити наявність токенів.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout видаляє збережені облікові дані OAuth, але залишає збережене визначення сервера.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Якщо provider ротує токени або стан авторизації зависає, запустіть `openclaw mcp logout <name>`, а потім повторіть `login`. `logout` може очистити облікові дані для збереженого HTTP-сервера навіть після видалення `auth: "oauth"` з конфігурації, доки ім’я сервера та URL ідентифікують запис сховища облікових даних.

### Транспорт Streamable HTTP

`streamable-http` — це додатковий варіант транспорту поруч із `sse` і `stdio`. Він використовує HTTP streaming для двостороннього зв’язку з віддаленими MCP-серверами.

| Поле                           | Опис                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `url`                          | HTTP або HTTPS URL віддаленого сервера (обов’язково)                                         |
| `transport`                    | Встановіть `"streamable-http"`, щоб вибрати цей транспорт; якщо пропущено, OpenClaw використовує `sse` |
| `headers`                      | Необов’язкова мапа ключ-значення HTTP-заголовків (наприклад auth-токени)                     |
| `connectionTimeoutMs`          | Таймаут підключення для сервера в мс (необов’язково)                                        |
| `connectTimeout`               | Таймаут підключення для сервера в секундах (необов’язково)                                  |
| `timeout` / `requestTimeoutMs` | Таймаут MCP-запиту для сервера в секундах або мс                                            |
| `auth: "oauth"`                | Використовувати сховище OAuth-токенів MCP і `openclaw mcp login`                            |
| `sslVerify`                    | Встановлюйте false лише для явно довірених приватних HTTPS endpoint                         |
| `clientCert` / `clientKey`     | Шляхи до клієнтського сертифіката й ключа mTLS                                              |
| `supportsParallelToolCalls`    | Підказка, що паралельні виклики безпечні для цього сервера                                  |

Конфігурація OpenClaw використовує `transport: "streamable-http"` як канонічне написання. CLI-native значення MCP `type: "http"` приймаються під час збереження через `openclaw mcp set` і виправляються `openclaw doctor --fix` в наявній конфігурації, але `transport` — це те, що вбудований OpenClaw споживає напряму.

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
Команди реєстру не запускають channel bridge. Лише `probe` і `doctor --probe` відкривають живий сеанс клієнта MCP, щоб підтвердити доступність цільового сервера.
</Note>

## Control UI

Браузерний Control UI містить окрему сторінку налаштувань MCP за адресою `/mcp`. Вона показує кількість налаштованих серверів, зведення щодо ввімкнення/OAuth/фільтрів, рядки транспорту для кожного сервера, елементи керування ввімкненням/вимкненням, поширені команди CLI та scoped-редактор для секції конфігурації `mcp`.

Використовуйте сторінку для операторських правок і швидкої інвентаризації. Використовуйте `openclaw mcp doctor --probe` або `openclaw mcp probe`, коли потрібне живе підтвердження сервера.

Робочий процес оператора:

1. Відкрийте Control UI і виберіть **MCP**.
2. Перегляньте картки зведення для загальної кількості, увімкнених, OAuth і відфільтрованих серверів.
3. Використовуйте кожен рядок сервера для підказок щодо транспорту, автентифікації, фільтра, тайм-ауту та команд.
4. Перемикайте увімкнення, коли хочете зберегти визначення, але виключити його з виявлення під час виконання.
5. Редагуйте scoped-секцію конфігурації `mcp` для структурних змін, як-от нові сервери, заголовки, TLS, метадані OAuth або фільтри інструментів.
6. Виберіть **Зберегти**, щоб лише зберегти конфігурацію, або **Зберегти й опублікувати**, щоб застосувати її через шлях конфігурації Gateway.
7. Запустіть `openclaw mcp doctor --probe`, коли потрібне живе підтвердження, що відредагований сервер запускається й показує список інструментів.

Примітки:

- фрагменти команд беруть імена серверів у лапки, щоб незвичні імена залишалися придатними для копіювання в shell
- відображувані URL-подібні значення редагуються перед рендерингом, якщо містять вбудовані облікові дані
- сторінка сама не запускає транспорти MCP
- активним середовищам виконання може знадобитися `openclaw mcp reload`, публікація конфігурації Gateway або перезапуск процесу залежно від того, який процес володіє клієнтами MCP

## Поточні обмеження

Ця сторінка документує міст у тому вигляді, у якому він постачається сьогодні.

Поточні обмеження:

- виявлення розмов залежить від наявних метаданих маршруту сесії Gateway
- немає універсального push-протоколу поза адаптером, специфічним для Claude
- ще немає інструментів для редагування повідомлень або реакцій
- транспорт HTTP/SSE/streamable-http підключається до одного віддаленого сервера; мультиплексованого upstream ще немає
- `permissions_list_open` містить лише схвалення, спостережені, поки міст підключений

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Plugins](/uk/cli/plugins)
