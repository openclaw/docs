---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'WebSocket-протокол Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-29T05:39:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 25ef7c128bdf73c3a5e8aa152bdad59a15ffcd6ab8009ac5c26b760b16d595d0
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом Node** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, Node iOS/Android, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **область дії** під час
рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-пейлоадами.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надмірно великі вхідні фрейми та повільні вихідні буфери генерують події
  `payload.large` до того, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, сире тіло фрейму, токени, cookies або секретні значення.

## Рукостискання (connect)

Gateway → Клієнт (виклик до підключення):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Клієнт → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Клієнт:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
узгоджені роль/області дії. `canvasHostUrl` є необов’язковим.

Коли токен пристрою не видано, `hello-ok.auth` повідомляє узгоджені
дозволи без полів токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` на прямих loopback-підключеннях, коли
автентифікуються за допомогою спільного gateway-токена/пароля. Цей шлях зарезервовано
для внутрішніх RPC площини керування та не дає застарілим базовим даним прив’язки CLI/пристрою
блокувати локальну backend-роботу, таку як оновлення сесій субагентів. Віддалені клієнти,
клієнти з browser-origin, Node-клієнти та явні клієнти з токеном пристрою/ідентичністю пристрою
і далі використовують звичайні перевірки прив’язки та підвищення області дії.

Коли токен пристрою видано, `hello-ok` також містить:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час довіреної передачі bootstrap `hello-ok.auth` може також містити додаткові
обмежені записи ролей у `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Для вбудованого bootstrap-потоку Node/operator основний токен Node залишається
`scopes: []`, а будь-який переданий токен operator залишається обмеженим allowlist bootstrap
operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-перевірки областей дії залишаються
префіксованими роллю: записи operator задовольняють лише запити operator, а ролям не-operator
і далі потрібні області дії під власним префіксом ролі.

### Приклад Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Фреймування

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області дії (operator)

Поширені області дії:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

Зареєстровані Plugin методи Gateway RPC можуть запитувати власну область дії operator, але
зарезервовані основні admin-префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область дії методу є лише першим шлюзом. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команди поверх цього. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команди: `operator.pairing`
- запити з non-exec командами Node: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (Node)

Node оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заявлення** і забезпечує server-side allowlists.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені Node повідомляють
  час свого поточного підключення як `lastSeenAtMs` з причиною `connect`; прив’язані Node також можуть повідомляти
  стійку фонову присутність, коли довірена подія Node оновлює їхні метадані прив’язки.

### Фонова подія alive для Node

Node можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що прив’язаний Node був
активний під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є стійкою лише для автентифікованих сесій пристроїв Node;
сесії без пристрою або без прив’язки повертають `handled: false`.

Успішні gateways повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateways можуть і далі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як стійке збереження присутності.

## Обмеження областями дії для broadcast-подій

Broadcast-події WebSocket, які server надсилає примусово, обмежуються областями дії, щоб сесії з областю дії pairing або лише Node не отримували пасивно вміст сесії.

- **Фрейми чату, агента та результатів інструментів** (зокрема streamed події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin broadcast-и `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу та транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб стан транспорту був видимим для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний per-client номер послідовності, щоб broadcast-и зберігали монотонне впорядкування на цьому socket навіть тоді, коли різні клієнти бачать різні відфільтровані за областями дії підмножини потоку подій.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за приклади рукостискання/автентифікації вище. Це
не згенерований dump — `hello-ok.features.methods` є консервативним
списком discovery, побудованим з `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/channel. Трактуйте його як feature discovery, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений health snapshot gateway.
    - `diagnostics.stability` повертає нещодавній обмежений diagnostic stability recorder. Він зберігає операційні метадані, як-от назви подій, кількості, розміри в байтах, показники пам’яті, стан черги/сесії, назви channel/plugin і ids сесій. Він не зберігає текст чату, тіла webhook, результати інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область дії operator read.
    - `status` повертає gateway-зведення у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з областю дії admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яку використовують relay і потоки pairing.
    - `system-presence` повертає поточний snapshot присутності для підключених пристроїв operator/Node.
    - `system-event` додає системну подію та може оновити/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений середовищем виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (спочатку `agents.defaults.models`, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення про вікна використання провайдерів і залишок квоти.
    - `usage.cost` повертає зведені підсумки витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного типового робочого простору агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче виконати живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений попередній перегляд REM harness лише для читання для віддалених клієнтів площини керування. Він може містити шляхи робочого простору, фрагменти пам’яті, відрендерений обґрунтований markdown і кандидатів на глибоке просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і пакетних каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web-входу для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку QR/web-входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS-вузла.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/гілку, поза chat runner.
    - `logs.tail` повертає налаштований tail файлового журналу gateway з керуванням курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` задає/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback-провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів середовища виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів для цільової команди для певного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують Control UI і CLI-інструменти: схема, `uiHints`, версія та метадані генерації, зокрема метадані схем plugin + каналів, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, зокрема вкладені об’єкти, wildcard, елементи масивів і гілки композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, неглибокий вузол схеми, відповідну підказку + `hintPath` і безпосередні зведення дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі для чисел/рядків/масивів/об’єктів і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення успішне.
    - `update.status` повертає останній кешований sentinel перезапуску після оновлення, зокрема запущену версію після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і метадані середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і підключенням робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення запуску та повертає кінцевий знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, зокрема метадані `agentRuntime` для кожного рядка, коли налаштований backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для певних ключів сесій.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання й спрямування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розв’язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізований для відображення UI-клієнтам: вбудовані directive-теги вилучаються з видимого тексту, plain-text XML-навантаження tool-call (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки tool-call) та витіклі ASCII/повноширинні контрольні токени моделі вилучаються, суто silent-token рядки асистента на кшталт точних `NO_REPLY` / `no_reply` пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої в очікуванні та затверджені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його затвердженої ролі та меж області дії викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його затвердженої ролі та меж області дії викликача.

  </Accordion>

  <Accordion title="Спарювання Node, виклик і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання node та перевірку bootstrap.
    - `node.list` і `node.describe` повертають відомий/підключений стан node.
    - `node.rename` оновлює мітку спареного node.
    - `node.invoke` пересилає команду до підключеного node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, створені node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped токени canvas-capability.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного node.
    - `node.pending.enqueue` і `node.pending.drain` керують надійно збереженою роботою в очікуванні для офлайн/відключених node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/відтворення схвалень в очікуванні.
    - `exec.approval.waitDecision` очікує одне схвалення exec в очікуванні та повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для node політикою схвалення exec через relay-команди node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне за heartbeat введення wake-тексту; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject`, та інші події чату лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка справності gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання node.
- `node.invoke.request`: broadcast запиту invoke node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригера wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи Node

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-інвентар команд для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають provider-aware нативні назви, коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware нативну назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність нативних команд plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сесії на боці сервера замість приймання наданого викликачем контексту автентифікації або доставки.
  - Відповідь обмежена сесією та відображає те, що активна розмова може використовувати прямо зараз, включно з інструментами core, plugin і каналу.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар skill для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та санітизовані варіанти встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill у директорію `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у стандартному робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна runtime-поведінка. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Операторські клієнти вирішують це, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переспрямовані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` між підготовкою та фінальним схваленим переспрямуванням `system.run`, Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запитати вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли неможливо розв’язати зовнішній маршрут доставки (наприклад, внутрішні/webchat сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Клієнтські константи

Еталонний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення стабільні в protocol v3 і є очікуваним baseline для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                   | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env може збільшити парний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не стандартів до handshake.

## Автентифікація

- Автентифікація Gateway зі shared-secret використовує `connect.params.auth.token` або `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve (`gateway.auth.allowTailscale: true`) або не-loopback `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect із заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає shared-secret автентифікацію connect; не відкривайте цей режим на публічному/недовіреному ingress.
- Після pairing Gateway видає **device token**, обмежений роллю підключення + scopes. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений схвалений набір scopes для цього token. Це зберігає доступ read/probe/status, який уже було надано, і запобігає тихому звуженню повторних підключень до неявного admin-only scope.
- Збирання автентифікації connect на боці клієнта (`selectConnectAuth` у `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди переспрямовується, коли встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний shared token, потім явний `deviceToken`, потім збережений per-device token (ключований за `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не розв’язав `auth.token`. Shared token або будь-який розв’язаний device token пригнічує його.
  - Автопідвищення збереженого device token під час одноразової повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** — loopback або `wss://` із pinned `tlsFingerprint`. Публічний `wss://` без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є handoff tokens для bootstrap. Зберігайте їх лише тоді, коли connect використовував bootstrap auth на довіреному транспорті, як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей запитаний викликачем набір scopes залишається авторитетним; кешовані scopes повторно використовуються лише тоді, коли клієнт повторно використовує збережений per-device token.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і `device.token.revoke` (потребує scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює replacement bearer token лише для same-device викликів, які вже автентифіковані цим device token, щоб token-only клієнти могли зберегти заміну перед повторним підключенням. Shared/admin ротації не віддзеркалюють bearer token.
- Видача, ротація та відкликання token залишаються обмеженими схваленим набором ролей, записаним у pairing-записі цього пристрою; мутація token не може розширити або націлити роль пристрою, яку pairing approval ніколи не надав.
- Для сесій paired-device token керування пристроєм є self-scoped, якщо викликач також не має `operator.admin`: non-admin викликачі можуть видаляти/відкликати/ротувати лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes operator token щодо поточних scopes сесії викликача. Non-admin викликачі не можуть ротувати або відкликати ширший operator token, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим per-device token.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору інструкції щодо дій.

## Ідентичність пристрою + pairing

- Node мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка ключової пари.
- Gateway видають токени для кожного пристрою + ролі.
- Для нових ID пристроїв потрібні підтвердження спарювання, якщо не ввімкнено
  локальне автоматичне схвалення.
- Автоматичне схвалення спарювання зосереджене на прямих підключеннях через local loopback.
- OpenClaw також має вузький бекендний/локальний для контейнера шлях самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості все одно розглядаються як віддалені для спарювання і
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (оператор +
  node). Єдині винятки для оператора без пристрою - явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний доступ, серйозне зниження безпеки).
  - direct-loopback бекендні RPC `gateway-client`, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які досі використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу поза дозволеним відхиленням. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Помилка формату/канонікалізації відкритого ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте payload v2, що включає nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису - `v3`, яке прив'язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятними для сумісності, але прив'язування метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + прив'язування

- TLS підтримується для WS-підключень.
- Клієнти можуть необов'язково прив'язувати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол надає **повний API gateway** (статус, канали, моделі, чат,
агент, сеанси, Node, схвалення тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
