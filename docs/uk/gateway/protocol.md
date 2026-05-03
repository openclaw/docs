---
read_when:
    - Реалізація або оновлення WS-клієнтів для Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-03T12:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свою **роль** + **scope** під час
handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери створюють події `payload.large`
  до того, як Gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло фрейму, токени, cookies або секретні значення.

## Handshake (connect)

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

Поки Gateway ще завершує запуск допоміжних sidecar-компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, встановленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цю відповідь
у межах свого загального бюджету підключення, а не показувати її як остаточний
збій handshake.

`server`, `features`, `snapshot` і `policy` усі обов’язкові за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджені роль/scopes. `canvasHostUrl` необов’язковий.

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
`client.mode: "backend"`) можуть опускати `device` у прямих підключеннях local loopback, коли
вони автентифікуються спільним токеном/паролем Gateway. Цей шлях зарезервований
для внутрішніх RPC площини керування й запобігає тому, щоб застарілі базові значення
спарювання CLI/пристрою блокували локальну backend-роботу, як-от оновлення сесій subagent. Віддалені клієнти,
клієнти з browser-origin, вузлові клієнти та явні клієнти з токеном пристрою/ідентичністю пристрою
далі використовують звичайні перевірки спарювання та підвищення scope.

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

Під час довіреної передачі bootstrap `hello-ok.auth` також може містити додаткові
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

Для вбудованого потоку bootstrap вузла/оператора первинний токен вузла лишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим allowlist
оператора bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки scope bootstrap лишаються
префіксованими роллю: записи оператора задовольняють лише запити оператора, а ролям не оператора
далі потрібні scopes під власним префіксом ролі.

### Приклад вузла

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

Повну модель scope оператора, перевірки під час затвердження та семантику спільних секретів
див. у [Scopes оператора](/uk/gateway/operator-scopes).

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Scopes (оператор)

Поширені scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власний scope оператора, але
зарезервовані адміністративні префікси ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди перетворюються на `operator.admin`.

Scope методу є лише першою перевіркою. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки рівня команди зверху. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час затвердження поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами вузла не exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (вузол)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує це як **заяви** й застосовує allowlist на стороні сервера.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спарені вузли також можуть повідомляти
  стійку фонову присутність, коли довірена подія вузла оновлює їхні метадані спарювання.

### Фонова подія alive вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарений вузол був
активний під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки тригера нормалізуються до
`background` Gateway перед збереженням. Подія є стійкою лише для автентифікованих сесій пристроїв
вузла; сесії без пристрою або без спарювання повертають `handled: false`.

Успішні Gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші Gateway можуть досі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як стійке збереження присутності.

## Scope широкомовних подій

Широкомовні події WebSocket, що надсилаються сервером, обмежуються за scope, щоб сесії зі scope спарювання або лише вузлові сесії не отримували пасивно вміст сесій.

- **Фрейми чату, агента й результатів інструментів** (включно зі streaming-подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin широкомовлення `plugin.*`** обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються за scope (fail-closed), якщо зареєстрований handler явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер на клієнта, щоб широкомовлення зберігали монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scope.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади handshake/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком discovery, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/channel. Трактуйте його як discovery функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений snapshot стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черг/сесій, назви channel/plugin та ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, вихід інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібен scope читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator зі scope admin.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують потоки relay і спарювання.
    - `system-presence` повертає поточний snapshot присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених середовищем виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спершу, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / зведення залишку квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам'яті / кешованих embedding для робочого простору активного стандартного агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів control-plane. Він може містити шляхи робочого простору, фрагменти пам'яті, відрендерений grounded markdown і кандидатів для deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає використання у форматі часового ряду для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих + пакетних каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим outbound-delivery RPC для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований хвіст file-log Gateway з керуванням курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` задає/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв'язує активні SecretRefs і замінює runtime-стан секретів лише після повного успіху.
    - `secrets.resolve` розв'язує призначення секретів, націлені на команду, для певного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене навантаження конфігурації.
    - `config.patch` об'єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне навантаження конфігурації.
    - `config.schema` повертає live-навантаження схеми конфігурації, яке використовують інструменти Control UI і CLI: schema, `uiHints`, version і metadata генерації, включно з metadata схем Plugin + каналів, коли середовище виконання може її завантажити. Схема містить metadata полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, включно з вкладеними object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає path-scoped lookup payload для одного шляху конфігурації: нормалізований шлях, поверхневий вузол schema, відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли lookup schema зберігають користувацьку документацію та спільні поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object, а також прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише коли саме оновлення виконалося успішно; викликачі із сесією можуть додати `continuationMessage`, щоб запуск відновив один наступний хід агента через чергу продовження після перезапуску. Оновлення через менеджер пакетів примусово виконують невідкладений restart без cooldown після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований sentinel перезапуску після оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та runtime metadata.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив'язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають transcript-derived зведення артефактів і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розв'язують власну сесію на боці сервера та повертають лише transcript media з відповідним походженням; небезпечні або локальні джерела URL повертають unsupported downloads замість server-side fetch.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, включно з metadata `agentRuntime` для кожного рядка, коли налаштовано backend runtime агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на transcript/message event для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для певних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` розв'язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є interrupt-and-steer варіантом для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов'язковий `runId` або передати лише `runId` для активних запусків, які Gateway може розв'язати до сесії.
    - `sessions.patch` оновлює metadata/overrides сесії та повідомляє розв'язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` display-normalized для UI-клієнтів: inline directive tags вилучаються з видимого тексту, plain-text XML payload викликів інструментів (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і truncated tool-call blocks) та leaked ASCII/full-width model control tokens вилучаються, чисті рядки асистента silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої в очікуванні та схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі та області викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його схваленої ролі та області викликача.

  </Accordion>

  <Accordion title="Спарювання Node, виклик і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання Node та bootstrap verification.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює мітку спареного Node.
    - `node.invoke` пересилає команду на підключений Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять із Node, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` є API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec плюс lookup/replay схвалень в очікуванні.
    - `exec.approval.waitDecision` очікує одне pending exec approval і повертає фінальне рішення (або `null` після timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики exec approval Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою exec approval через node relay commands.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють plugin-defined approval flows.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat вставку wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI чату, як-от `chat.inject` та інші події чату лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для підписаної сесії.
- `sessions.changed`: індекс сесій або metadata змінилися.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення event stream Heartbeat.
- `cron`: подія зміни Cron run/job.
- `shutdown`: сповіщення про завершення роботи Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання Node.
- `node.invoke.request`: broadcast запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурація тригерів wake-word змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл exec approval.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл plugin approval.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд runtime
  для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлено основний `name`:
    - `text` повертає основний токен текстової команди без початкового `/`
    - `native` і стандартний шлях `both` повертають провайдерно-обізнані нативні назви,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить провайдерно-обізнану нативну назву команди, коли така існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність
    нативних команд Plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог runtime-інструментів для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний інвентар
  інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сесії на серверному боці замість приймання
    auth- або delivery-контексту, наданого викликачем.
  - Відповідь має сесійний scope і відображає те, що активна розмова може використовувати прямо зараз,
    включно з core-, Plugin- і channel-інструментами.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов’язкові.
  - Якщо присутні і `sessionKey`, і `agentId`, визначений агент сесії має збігатися з
    `agentId`.
  - Відповідь є envelope для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими
    полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочий простір агента за замовчуванням.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих secret-значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих discovery ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill у директорію `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна поведінка runtime. Якщо `agents.defaults.models` налаштовано, відповіддю є дозволений каталог; інакше відповіддю є повний каталог Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли налаштованих рядків моделей немає.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики й discovery UI, а не для звичайних picker моделей.

## Схвалення exec

- Коли exec-запит потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора вирішують це викликом `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервний варіант delivery агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити outbound delivery.
- `bestEffortDeliver=false` зберігає строгий режим: нерозв’язані або лише внутрішні цілі delivery повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли жоден зовнішній deliverable route не може бути розв’язаний (наприклад, внутрішні/webchat-сесії або неоднозначні multi-channel конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Референсний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
стабільні в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                      | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| Таймаут запиту (на RPC)                   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Таймаут preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет server/client) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Обмеження швидкого повтору після закриття device-token | `250` ms                                   | `src/gateway/client.ts`                                                                   |
| Grace force-stop перед `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Стандартний таймаут `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                   |
| Закриття через tick-timeout               | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                         |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не стандартних значень до handshake.

## Auth

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентифікацією, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення через
  заголовки запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення
  зі спільним секретом; не відкривайте цей режим на публічному/ненадійному ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений роллю підключення
  + scopes. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений затверджений набір scopes для цього токена. Це зберігає доступ
  read/probe/status, який уже було надано, і не дає повторним підключенням непомітно
  звузитися до вужчого неявного scope лише для адміністратора.
- Формування автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди передається, коли його задано.
  - `auth.token` заповнюється в порядку пріоритету: спершу явний спільний токен,
    потім явний `deviceToken`, потім збережений токен окремого пристрою (ключований за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є bootstrap-токенами передавання.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію через довірений транспорт,
  як-от `wss://` або loopback/локальне сполучення.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен окремого пристрою.
- Токени пристрою можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів з того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Ротації через спільний/адміністративний доступ не віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі сполучення цього пристрою; мутація токена не може розширити або
  націлитися на роль пристрою, яку схвалення сполучення ніколи не надавало.
- Для сесій токенів сполучених пристроїв керування пристроями є самообмеженим, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/ротувати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes
  операторського токена щодо поточних scopes сесії викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший операторський токен, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть зробити одну обмежену повторну спробу з кешованим токеном окремого пристрою.
  - Якщо ця повторна спроба завершується невдало, клієнти мають припинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дій.

## Ідентичність пристрою + сполучення

- Node-и мають містити стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateways видають токени для кожного пристрою + ролі.
- Схвалення сполучення потрібні для нових ідентифікаторів пристроїв, якщо локальне автоматичне схвалення
  не ввімкнено.
- Автоматичне схвалення сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе одно вважаються віддаленими для сполучення та
  потребують схвалення.
- WS-клієнти зазвичай містять ідентичність `device` під час `connect` (operator +
  node). Єдині винятки оператора без пристрою — явні шляхи довіри:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only сумісності з небезпечним HTTP.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback backend RPC `gateway-client`, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристроїв

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
detail-коди `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає v2 payload.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана часова позначка поза дозволеним відхиленням. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалася. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте v2 payload, що містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятними для сумісності, але pinning метаданих
  сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть необов’язково закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол надає **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
TypeBox-схемами в `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
