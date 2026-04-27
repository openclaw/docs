---
read_when:
    - Реалізація або оновлення клієнтів WS Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-27T12:51:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f28bf8e4276b9295dc33fa3c39aa25de741e08aad1140ca36bd678b25d6a0c1
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол WS Gateway — це **єдина control plane + Node transport** для
OpenClaw. Усі клієнти (CLI, web UI, застосунок macOS, iOS/Android Nodes, headless
Nodes) підключаються через WebSocket і під час
рукостискання оголошують свою **роль** + **область**.

## Транспорт

- WebSocket, текстові фрейми з JSON payload.
- Перший фрейм **має** бути запитом `connect`.
- Розмір фреймів до підключення обмежено 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надто великі вхідні фрейми та повільні вихідні буфери створюють події `payload.large`
  до того, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, тіло сирого фрейму, токени, cookies або секретні значення.

## Рукостискання (connect)

Gateway → Client (виклик до підключення):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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
узгоджені роль/області. `canvasHostUrl` є необов’язковим.

Коли токен пристрою не видається, `hello-ok.auth` повідомляє узгоджені
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
`client.mode: "backend"`) можуть не передавати `device` у прямих loopback-підключеннях, коли
вони проходять автентифікацію за допомогою спільного токена/пароля gateway. Цей шлях зарезервовано
для внутрішніх RPC control plane і не дає застарілим базовим значенням зіставлення CLI/пристроїв
блокувати локальну backend-роботу, таку як оновлення сесій субагентів. Віддалені клієнти,
клієнти з browser-origin, Node-клієнти та явні клієнти з device-token/device-identity
і далі використовують звичайні перевірки зіставлення та підвищення scope.

Коли видається токен пристрою, `hello-ok` також містить:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час передачі в довіреному bootstrap `hello-ok.auth` також може містити
додаткові обмежені записи ролей у `deviceTokens`:

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

Для вбудованого bootstrap-процесу Node/operator основний токен Node залишається
`scopes: []`, а будь-який переданий токен operator залишається обмеженим allowlist bootstrap-оператора
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки scope під час bootstrap залишаються
прив’язаними до префікса ролі: записи operator задовольняють лише запити operator, а ролі,
які не є operator, і далі потребують scopes під префіксом власної ролі.

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

## Ролі + scopes

### Ролі

- `operator` = клієнт control plane (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Scopes (operator)

Поширені scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власний scope operator, але
зарезервовані основні admin-префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди визначаються як `operator.admin`.

Scope методу — це лише перший шлюз. Деякі слеш-команди, викликані через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди. Наприклад,
постійні записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час погодження поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з Node-командами без exec: `operator.pairing` + `operator.write`
- запити, які містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes оголошують claims можливостей під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **claims** і застосовує allowlist на боці сервера.

## Presence

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи presence включають `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження області broadcast-подій

Broadcast-події WebSocket, які надсилає сервер, обмежуються scopes, щоб сесії лише з pairing-scope або лише для Node пасивно не отримували вміст сесій.

- **Фрейми chat, agent і результатів tools** (включно з потоковими подіями `agent` і результатами викликів tools) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Broadcast `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються без обмежень, щоб стан транспорту лишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються scopes (fail-closed), якщо лише зареєстрований обробник явно не послаблює це.

Кожне клієнтське підключення має власний номер послідовності для конкретного клієнта, тому broadcast-події зберігають монотонний порядок у цьому сокеті навіть тоді, коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scope.

## Поширені сімейства RPC-методів

Публічна WS-поверхня ширша, ніж наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс експортованих методів завантажених Plugin/channel. Розглядайте його як виявлення функцій, а не як повне
перерахування `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений snapshot стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений recorder стабільності діагностики. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви channel/Plugin і session ids. Він не зберігає текст чату, тіла Webhook, результати tools, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібен scope operator read.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів зі scope admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яка використовується потоками relay і pairing.
    - `system-presence` повертає поточний snapshot presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/поширювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених runtime.
    - `usage.status` повертає зведення вікон використання провайдерів/залишкової квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає стан готовності vector-memory / embedding для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає timeseries використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Channels і допоміжні засоби входу">
    - `channels.status` повертає зведення стану вбудованих + bundled channels/Plugins.
    - `channels.logout` виконує вихід із певного channel/account, якщо channel підтримує вихід.
    - `web.login.start` запускає QR/web-процес входу для поточного web channel provider, який підтримує QR.
    - `web.login.wait` очікує завершення цього QR/web-процесу входу і запускає channel у разі успіху.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і поширює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC доставки назовні для відправлень до channel/account/thread-target поза chat runner.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway з керуванням cursor/limit і максимальним числом байтів.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає effective payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` задає/поширює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного speech provider Talk.
    - `tts.status` повертає стан увімкнення TTS, активного provider, резервних providers і стан конфігурації provider.
    - `tts.providers` повертає видимий інвентар TTS providers.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного TTS provider.
    - `tts.convert` виконує одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно визначає активні SecretRef і змінює стан секретів runtime лише за повного успіху.
    - `secrets.resolve` визначає присвоєння секретів, націлених на команди, для конкретного набору command/target.
    - `config.get` повертає поточний snapshot конфігурації та hash.
    - `config.set` записує валідований payload конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідує + замінює повний payload конфігурації.
    - `config.schema` повертає payload живої схеми конфігурації, яку використовують Control UI і CLI tooling: schema, `uiHints`, версію та метадані генерації, включно з метаданими схеми Plugin + channel, коли runtime може їх завантажити. Схема включає метадані полів `title` / `description`, отримані з тих самих міток і тексту довідки, які використовує UI, включно з гілками композиції вкладених об’єктів, wildcard, елементів масиву та `anyOf` / `oneOf` / `allOf`, коли для відповідних полів існує документація.
    - `config.schema.lookup` повертає payload пошуку, обмежений шляхом, для одного шляху конфігурації: нормалізований шлях, неглибокий вузол схеми, відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми lookup зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапори на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення було успішним.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, включно з версією після перезапуску, якщо вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.
  </Accordion>

  <Accordion title="Агент і допоміжні засоби робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і wiring робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, відкритими для агента.
    - `agent.identity.get` повертає effective identity асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, якщо він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події transcript/message для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сесій.
    - `sessions.resolve` визначає або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив прибираються з видимого тексту, XML payload викликів tools у plain-text (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів tools) та витоки ASCII/full-width токенів керування моделлю прибираються, суто тихі рядки асистента, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки можуть замінюватися заповнювачами.
  </Accordion>

  <Accordion title="Зіставлення пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені зіставлені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами зіставлення пристроїв.
    - `device.token.rotate` змінює токен зіставленого пристрою в межах його схваленої ролі та обмежень scope викликача.
    - `device.token.revoke` відкликає токен зіставленого пристрою в межах його схваленої ролі та обмежень scope викликача.
  </Accordion>

  <Accordion title="Зіставлення Node, invoke і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють зіставлення Node і перевірку bootstrap.
    - `node.list` і `node.describe` повертають стан відомих/підключених Nodes.
    - `node.rename` оновлює мітку зіставленого Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` передає події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas з обмеженою областю.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключених Nodes.
    - `node.pending.enqueue` і `node.pending.drain` керують надійною очікуваною роботою для offline/disconnected Nodes.
  </Accordion>

  <Accordion title="Сімейства погоджень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на погодження exec, а також пошук/повторення очікуваних погоджень.
    - `exec.approval.waitDecision` очікує рішення для одного очікуваного погодження exec і повертає фінальне рішення (або `null` за тайм-аутом).
    - `exec.approvals.get` і `exec.approvals.set` керують snapshot політики погоджень exec gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою погоджень exec Node через relay-команди Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки погоджень, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills і tools">
    - Автоматизація: `wake` планує негайне або на наступний Heartbeat вбудовування тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills і tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, такі як `chat.inject` та інші
  події чату лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для
  сесії з підпискою.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення snapshot system presence.
- `tick`: періодична keepalive / liveness-подія.
- `health`: оновлення snapshot стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни run/job Cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл зіставлення Node.
- `node.invoke.request`: broadcast запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл зіставленого пристрою.
- `voicewake.changed`: конфігурація тригерів wake-word змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  погодження exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  погодження Plugin.

### Допоміжні методи Node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для перевірок auto-allow.

### Допоміжні методи operator

- Operators можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-інвентар
  команд для агента.
  - `agentId` необов’язковий; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, яку поверхню націлює основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають names native з урахуванням provider,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить native name з урахуванням provider, коли вона існує.
  - `provider` необов’язковий і впливає лише на native naming плюс доступність native
    команд Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Operators можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог tools для
  агента. Відповідь містить згруповані tools і метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є tool Plugin необов’язковим
- Operators можуть викликати `tools.effective` (`operator.read`), щоб отримати effective runtime-інвентар tools
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway визначає довірений контекст runtime із сесії на боці сервера, замість того щоб приймати
    наданий викликачем контекст auth або delivery.
  - Відповідь має область сесії та відображає, що активна розмова може використовувати прямо зараз,
    включно з tools core, Plugin і channel.
- Operators можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Operators можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operators можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку Skill у директорію `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operators можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Погодження exec

- Коли запит exec потребує погодження, gateway поширює `exec.approval.requested`.
- Operator-клієнти виконують погодження, викликаючи `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після погодження переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним пересиланням погодженого `system.run`,
  gateway відхиляє виконання замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запитати вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, internal/webchat-сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Ці значення
стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                             | Джерело                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` ms                                            | `src/gateway/client.ts`                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує effective `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не значень за замовчуванням до рукостискання.

## Auth

- Автентифікація gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму auth.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку auth під час connect на основі
  заголовків запиту, а не `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для приватного ingress повністю пропускає auth connect через спільний секрет; не відкривайте цей режим у публічному/недовіреному ingress.
- Після зіставлення Gateway видає **токен пристрою**, обмежений роллю + scopes
  підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений схвалений набір scope для цього токена. Це зберігає доступ на
  читання/probe/status, який уже було надано, і не дає повторним підключенням непомітно звузитися до
  вужчого неявного admin-only scope.
- Збирання client-side connect auth (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний shared token,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (ключ за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жодне з попередніх значень не визначило
    `auth.token`. Shared token або будь-який визначений токен пристрою його пригнічують.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із pinned `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передачі bootstrap.
  Зберігайте їх лише тоді, коли connect використовував bootstrap auth через довірений transport,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scope залишається авторитетним; кешовані scopes повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристрою можна змінювати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у записі зіставлення цього пристрою; зміна токена не може розширити
  або націлитися на роль пристрою, яку схвалення зіставлення ніколи не надавало.
- Для сесій токенів зіставлених пристроїв керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/змінювати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scope цільового токена operator
  відносно поточних scope сесії викликача. Викликачі без admin
  не можуть змінювати або відкликати ширший токен operator, ніж той, який уже мають.
- Збої auth включають `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу із кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати інструкції для дій оператора.

## Ідентичність пристрою + зіставлення

- Nodes мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateways видають токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні погодження зіставлення, якщо не ввімкнено локальне auto-approval.
- Auto-approval зіставлення зосереджено на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький локальний шлях self-connect для backend/container
  для довірених потоків допоміжних засобів зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості все одно розглядаються як віддалені для зіставлення й
  потребують погодження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки operator без device — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з insecure HTTP лише для localhost.
  - успішна auth operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback-RPC backend `gateway-client`, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати nonce `connect.challenge`, наданий сервером.

### Діагностика міграції auth пристроїв

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку public key.     |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат public key / канонізація не пройшли.        |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який включає server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily` на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але прив’язка метаданих paired-device усе одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти за бажанням можуть закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls` плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язані теми

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
