---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-29T23:55:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS-протокол є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери породжують події
  `payload.large` до того, як gateway закриє або відкине відповідний фрейм.
  Ці події зберігають розміри, ліміти, поверхні та безпечні коди причин.
  Вони не зберігають тіло повідомлення, вміст вкладень, сире тіло фрейму,
  токени, cookies або секретні значення.

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

Поки Gateway ще завершує запуск допоміжних компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE`, де `details.reason` має значення
`"startup-sidecars"` і вказано `retryAfterMs`. Клієнти мають повторювати таку
відповідь у межах свого загального бюджету підключення, а не показувати її як
остаточний збій handshake.

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і
повідомляє узгоджені роль/області дії. `canvasHostUrl` є необов’язковим.

Коли токен пристрою не видано, `hello-ok.auth` повідомляє узгоджені дозволи без
полів токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть пропускати `device` у прямих підключеннях
local loopback, коли вони автентифікуються спільним токеном/паролем gateway.
Цей шлях зарезервований для внутрішніх RPC площини керування і не дає застарілим
базовим лініям прив’язування CLI/пристрою блокувати локальну backend-роботу,
наприклад оновлення сесій subagent. Віддалені клієнти, клієнти з browser-origin,
node-клієнти та явні клієнти з токеном пристрою/ідентичністю пристрою й надалі
використовують звичайні перевірки прив’язування та підвищення області дії.

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

Під час довіреної передачі bootstrap `hello-ok.auth` також може містити
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

Для вбудованого bootstrap-потоку вузол/оператор основний токен вузла лишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим
allowlist bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap-областей дії
лишаються префіксованими роллю: записи оператора задовольняють лише запити
оператора, а неоператорським ролям усе ще потрібні області дії під власним
префіксом ролі.

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

## Ролі + області дії

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області дії (оператор)

Поширені області дії:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

Зареєстровані Plugin RPC-методи gateway можуть запитувати власну область дії
оператора, але зарезервовані основні admin-префікси (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди розв’язуються в
`operator.admin`.

Область дії методу є лише першим gate. Деякі slash-команди, доступні через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди.
Наприклад, постійні записи `/config set` і `/config unset` потребують
`operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення
поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec node-командами: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують твердження про можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для виклику.
- `permissions`: гранулярні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **твердження** і застосовує server-side allowlist.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  час свого поточного підключення як `lastSeenAtMs` із причиною `connect`; прив’язані вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані прив’язування.

### Фонова подія active стану вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що прив’язаний вузол був
активним під час фонового пробудження, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є тривалою лише для автентифікованих node
сесій пристроїв; сесії без пристрою або без прив’язування повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway все ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають сприймати це як
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження області дії broadcast-подій

Серверні WebSocket broadcast-події обмежуються областю дії, щоб сесії з pairing-областю або лише node-сесії не отримували пасивно вміст сесій.

- **Фрейми чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Plugin-визначені broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимим для кожної автентифікованої сесії.
- **Невідомі родини broadcast-подій** за замовчуванням обмежуються областю дії (fail-closed), якщо зареєстрований обробник явно не послаблює це обмеження.

Кожне клієнтське підключення має власний поклієнтський порядковий номер, тож broadcast-події зберігають монотонний порядок на цьому сокеті навіть тоді, коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областю дії.

## Поширені родини RPC-методів

Публічна WS-поверхня ширша за наведені вище приклади handshake/auth. Це
не згенерований dump — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів Plugin/channel. Сприймайте його як виявлення функцій, а не як
повний перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система й ідентичність">
    - `health` повертає кешований або щойно перевірений snapshot стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений recorder діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви channel/plugin і ids сесій. Він не зберігає текст чату, тіла webhook, результати інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібна operator read scope.
    - `status` повертає gateway-зведення у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яку використовують потоки relay і pairing.
    - `system-presence` повертає поточний snapshot присутності для підключених operator/node-пристроїв.
    - `system-event` додає системну подію і може оновлювати/broadcast контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений середовищем виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибору (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення використання вартості за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів площини керування. Він може включати шляхи робочого простору, фрагменти пам’яті, відтворений grounded markdown і кандидатів для deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і пакетних каналів/plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису там, де канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного QR-сумісного провайдера вебканалу.
    - `web.login.wait` чекає на завершення цього QR/web-потоку входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push зареєстрованому iOS-вузлу.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC для вихідної доставки, націленої на канал/обліковий запис/тред, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з елементами керування курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно визначає активні SecretRefs і замінює стан секретів середовища виконання лише за повного успіху.
    - `secrets.resolve` визначає призначення секретів, націлені на команду, для певного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірений payload конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повний payload конфігурації.
    - `config.schema` повертає живий payload схеми конфігурації, який використовують Control UI та інструменти CLI: schema, `uiHints`, version і метадані генерації, включно з метаданими схем plugin + channel, коли середовище виконання може їх завантажити. Схема включає метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, що використовує UI, включно з вкладеним об’єктом, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає payload пошуку з областю шляху для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і безпосередні зведення дочірніх елементів для деталізації UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та загальні поля перевірки (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає останній кешований sentinel перезапуску після оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та метаданими середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність assistant для агента або сесії.
    - `agent.wait` чекає завершення запуску та повертає кінцевий знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, включно з метаданими `agentRuntime` для кожного рядка, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для певних ключів сесій.
    - `sessions.resolve` визначає або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов’язковий `runId`, або передати лише `runId` для активних запусків, які Gateway може зіставити із сесією.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє визначену канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` display-нормалізовано для UI-клієнтів: inline directive tags вилучаються з видимого тексту, plaintext XML payloads викликів інструментів (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками tool-call) та leaked ASCII/full-width model control tokens вилучаються, рядки assistant лише з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені placeholder.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його схваленої ролі та меж області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі та меж області викликача.

  </Accordion>

  <Accordion title="Сполучення вузлів, invoke та очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною очікуваною роботою для offline/відключених вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec плюс пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` чекає на одне очікуване схвалення exec і повертає фінальне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди node relay.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, skills та інструменти">
    - Автоматизація: `wake` планує негайне або на наступний heartbeat вставлення wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші події чату лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи вузлів

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов’язковий; опустіть його, щоб прочитати робочу область агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлений основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають provider-aware нативні імена,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить provider-aware нативне ім’я команди, коли воно існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність
    нативних команд Plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime каталог інструментів для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime контекст із сесії на боці сервера замість приймання
    наданого викликачем контексту auth або доставки.
  - Відповідь обмежена сесією і відображає те, що активна розмова може використовувати просто зараз,
    включно з інструментами ядра, Plugin і каналу.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар навичок для агента.
  - `agentId` необов’язковий; опустіть його, щоб прочитати робочу область агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку навички в каталог `skills/` робочої області агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочій області агента за замовчуванням.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Опущено або `"default"`: поточна runtime поведінка. Якщо `agents.defaults.models` налаштовано, відповіддю є дозволений каталог; інакше відповіддю є повний каталог Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе ще має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає жодних налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора розв’язують це викликом `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` повинен містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`,
  Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервний варіант доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє повернення до виконання лише в сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, внутрішні/webchat сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
стабільні в protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                      | Джерело                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Таймаут запиту (на RPC)                   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Таймаут Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початкова затримка повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальна затримка повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Таймаут `stopAndWait()` за замовчуванням  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти повинні дотримуватися цих значень,
а не значень за замовчуванням до handshake.

## Auth

- Auth Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму auth.
- Режими, що несуть ідентичність, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку connect auth з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає connect auth зі спільним секретом;
  не відкривайте цей режим на публічному/недовіреному ingress.
- Після pairing Gateway видає **device token**, обмежений роллю з’єднання
  + scopes. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  затверджений набір scope для цього токена. Це зберігає вже наданий доступ
  read/probe/status і запобігає тихому звуженню повторних підключень до
  неявного scope лише для admin.
- Збирання connect auth на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен на пристрій (ключований за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли нічого з наведеного вище не дало
    `auth.token`. Спільний токен або будь-який визначений device token пригнічує його.
  - Автопросування збереженого device token під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth на довіреному транспорті,
  такому як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scope залишається авторитетним; кешовані scopes лише
  повторно використовуються, коли клієнт повторно використовує збережений токен на пристрій.
- Device tokens можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він відлунює replacement
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  device token, щоб клієнти лише з токеном могли зберегти replacement перед
  повторним підключенням. Shared/admin ротації не відлунюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у pairing entry цього пристрою; мутація токена не може розширити або
  націлити роль пристрою, яку pairing approval ніколи не надавав.
- Для сесій paired-device token керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/обертати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scope
  токена оператора щодо поточних scope сесії викликача. Викликачі без admin
  не можуть обертати або відкликати ширший токен оператора, ніж уже мають.
- Збої Auth містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном на пристрій.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати оператору інструкції щодо дій.

## Ідентичність пристрою + pairing

- Node-вузли мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateway видає токени для кожного пристрою + ролі.
- Затвердження сполучення потрібні для нових ID пристроїв, якщо не ввімкнено
  локальне автоматичне затвердження.
- Автоматичне затвердження сполучення зосереджене на прямих підключеннях через local loopback.
- OpenClaw також має вузький шлях самопідключення всередині бекенда/контейнера для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з тієї самої машини через tailnet або LAN все одно вважаються віддаленими для сполучення та
  потребують затвердження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (оператор +
  вузол). Єдині винятки оператора без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з незахищеним HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (екстрений доступ, серйозне зниження безпеки).
  - backend RPCs `gateway-client` через прямий loopback, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| ---------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає payload v2. |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного відхилення. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не пройшли перевірку. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додаток до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення
  метаданих сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть необов’язково закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол надає **повний API gateway** (статус, канали, моделі, чат,
агент, сесії, вузли, затвердження тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
