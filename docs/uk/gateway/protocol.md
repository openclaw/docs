---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-01T08:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android, безголові
вузли) підключаються через WebSocket і оголошують свої **role** + **scope** під час
рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери генерують події `payload.large`
  до того, як Gateway закриє або відкине відповідний фрейм. Ці події зберігають
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

Поки Gateway ще завершує запуск допоміжних компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE`, де `details.reason` встановлено на
`"startup-sidecars"` і вказано `retryAfterMs`. Клієнти мають повторити цей запит
у межах свого загального бюджету підключення, а не показувати його як остаточну
помилку рукостискання.

`server`, `features`, `snapshot` і `policy` усі обов’язкові за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджені role/scopes. `canvasHostUrl` необов’язковий.

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

Довірені бекенд-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть пропускати `device` у прямих підключеннях local loopback,
коли вони автентифікуються спільним токеном/паролем Gateway. Цей шлях зарезервований
для внутрішніх RPC площини керування й не дає застарілим базовим даним парування CLI/пристрою
блокувати локальну бекенд-роботу, наприклад оновлення сесій підлеглих агентів. Віддалені клієнти,
клієнти з браузерним origin, вузлові клієнти та явні клієнти з токеном пристрою/ідентичністю
пристрою й надалі використовують звичайні перевірки парування та підвищення scope.

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

Для вбудованого bootstrap-потоку вузол/оператор основний токен вузла лишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим allowlist
оператора bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки scope bootstrap лишаються
префіксованими роллю: записи оператора задовольняють лише запити оператора, а ролі
неоператорів усе ще потребують scopes під власним префіксом ролі.

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
зарезервовані основні адміністративні префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope методу є лише першою перевіркою. Деякі slash-команди, доступні через
`chat.send`, накладають суворіші перевірки рівня команди поверх цього. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час затвердження поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (вузол)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: гранулярні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **claims** і застосовує серверні allowlists.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спаровані вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані парування.

### Фонова подія активності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарований вузол був
активний під час фонового пробудження, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` Gateway перед збереженням. Подія є тривалою лише для автентифікованих сесій
пристроїв вузлів; сесії без пристрою або без парування повертають `handled: false`.

Успішні Gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші Gateway усе ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження області broadcast-подій

Broadcast-події WebSocket, які надсилає сервер, обмежені за scope, щоб сесії з областю парування або лише вузлові сесії не отримували пасивно вміст сесій.

- **Фрейми чату, агента та результатів інструментів** (включно зі streamed подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються scope (fail-closed), якщо зареєстрований handler явно не послаблює їх.

Кожне клієнтське підключення зберігає власний поклієнтський порядковий номер, тому broadcast-події зберігають монотонне впорядкування на цьому сокеті навіть тоді, коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scope.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/каналів. Сприймайте його як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система й ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібен scope читання оператора.
    - `status` повертає підсумок Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів зі scope адміністратора.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують потоки ретрансляції та парування.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/broadcast контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку Heartbeat у Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених середовищем виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / зведення залишку квоти.
    - `usage.cost` повертає агреговані зведення використання вартості за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної памʼяті / кешованих embedding для активної типової робочої області агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче виконати живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів площини керування. Він може містити шляхи робочої області, фрагменти памʼяті, відрендерений обґрунтований markdown і кандидатів для глибокого просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання по сеансах.
    - `sessions.usage.timeseries` повертає часові ряди використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає зведення статусів вбудованих і bundled каналів/плагінів.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим RPC для вихідної доставки, орієнтованої на канал/обліковий запис/thread, поза chat runner.
    - `logs.tail` повертає налаштований tail файлового журналу Gateway із cursor/limit і засобами керування max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розвʼязує активні SecretRefs і замінює стан секретів середовища виконання лише за повного успіху.
    - `secrets.resolve` розвʼязує призначення секретів, орієнтовані на команду, для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує валідоване корисне навантаження конфігурації.
    - `config.patch` обʼєднує часткове оновлення конфігурації.
    - `config.apply` валідує та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують інструменти Control UI і CLI: схему, `uiHints`, версію та метадані генерації, включно з метаданими схем Plugin і каналів, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих labels і довідкового тексту, які використовує UI, включно з вкладеними обʼєктами, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і короткі зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно. Оновлення через менеджер пакетів примусово виконують невідкладений перезапуск після оновлення без cooldown після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований sentinel перезапуску після оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають доступ до майстра onboarding через WS RPC.

  </Accordion>

  <Accordion title="Допоміжні засоби агента та робочої області">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та метаданими середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і привʼязкою робочих областей.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочої області, доступними для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають зведення артефактів, похідних від transcript, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розвʼязують власний сеанс на боці сервера та повертають лише transcript-медіа з відповідним provenance; небезпечні або локальні джерела URL повертають непідтримувані завантаження замість отримання на боці сервера.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
    - `agent.wait` очікує завершення run і повертає кінцевий знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сеансом">
    - `sessions.list` повертає поточний індекс сеансів, включно з метаданими `agentRuntime` для кожного рядка, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сеансів для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сеансів.
    - `sessions.resolve` розвʼязує або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` є interrupt-and-steer варіантом для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу. Викликач може передати `key` плюс необовʼязковий `runId` або передати лише `runId` для активних run, які Gateway може розвʼязати до сеансу.
    - `sessions.patch` оновлює метадані/overrides сеансу та повідомляє розвʼязану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансу.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтам UI: inline directive tags вилучаються з видимого тексту, plain-text XML payloads викликів інструментів (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів) і витеклі ASCII/full-width керівні токени моделі вилучаються, суто silent-token рядки асистента, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надто великі рядки можуть бути замінені placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої, що очікують, і затверджені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його затвердженої ролі та меж області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його затвердженої ролі та меж області викликача.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення Node і bootstrap verification.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює label сполученого Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, створені Node, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` є API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною роботою в очікуванні для offline/disconnected Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec плюс пошук/повторне відтворення схвалень в очікуванні.
    - `exec.approval.waitDecision` очікує одне схвалення exec в очікуванні й повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою схвалення exec через relay-команди Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалень, визначені Plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat інʼєкцію wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші події чату лише transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для підписаного сеансу.
- `sessions.changed`: індекс сеансів або метадані змінено.
- `presence`: оновлення знімків присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни run/job Cron.
- `shutdown`: сповіщення про завершення роботи Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення Node.
- `node.invoke.request`: трансляція запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення Plugin.

### Допоміжні методи Node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлюється основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають нативні імена з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить нативне ім’я команди з урахуванням провайдера, коли воно існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність
    нативних команд Plugin.
  - `includeArgs=false` не включає серіалізовані метадані аргументів у відповідь.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний
  інвентар інструментів для сеансу.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сеансу на серверному боці, замість приймати
    контекст автентифікації або доставлення, наданий викликачем.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати просто зараз,
    включно з інструментами ядра, Plugin і каналу.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов’язкові.
  - Якщо наявні і `sessionKey`, і `agentId`, агент розв’язаного сеансу має збігатися з
    `agentId`.
  - Відповідь є конвертом для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими
    полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Опущено або `"default"`: поточна runtime-поведінка. Якщо налаштовано `agents.defaults.models`, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо налаштовано `agents.defaults.models`, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли exec-запит потребує схвалення, Gateway транслює `exec.approval.requested`.
- Операторські клієнти виконують розв’язання, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переспрямовані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та остаточним схваленим переспрямуванням `system.run`, Gateway
  відхиляє запуск замість довіряти зміненому payload.

## Резервний варіант доставлення агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідне доставлення.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставлення повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сеансі, коли неможливо розв’язати зовнішній доставний маршрут (наприклад, внутрішні/webchat-сеанси або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Клієнтські константи

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` мс                                          | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початкова затримка reconnect              | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальна затримка reconnect            | `30_000` мс                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` мс                                      | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` мс                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` мс                                          | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | код `4000`, коли мовчання перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                           | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентифікацією, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації підключення за
  заголовками запиту, а не через `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для приватного входу повністю пропускає
  автентифікацію підключення зі спільним секретом; не відкривайте цей режим для
  публічного або ненадійного входу.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю підключення
  + scopes. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має
  повторно використовувати збережений затверджений набір scopes для цього токена.
  Це зберігає вже наданий доступ для читання/перевірки/статусу й уникає
  непомітного звуження повторних підключень до неявного scope лише для адміністратора.
- Збирання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є незалежним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спершу явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для окремого пристрою
    (ключований за `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище
    варіантів не дав `auth.token`. Спільний токен або будь-який знайдений токен
    пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей запитаний
  викликачем набір scopes лишається авторитетним; кешовані scopes повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен
  для окремого пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані
  цим токеном пристрою, щоб клієнти лише з токеном могли зберегти свою заміну до
  повторного підключення. Ротації через спільний/адміністративний доступ не
  віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів лишаються обмеженими затвердженим набором ролей,
  записаним у записі спарювання цього пристрою; мутація токена не може розширити
  або націлитися на роль пристрою, яку затвердження спарювання ніколи не надавало.
- Для сесій токенів спарених пристроїв керування пристроєм має self-scoped характер,
  якщо викликач також не має `operator.admin`: неадміністративні викликачі можуть
  видаляти/відкликати/ротувати лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scopes цільового
  токена оператора щодо поточних scopes сесії викликача. Неадміністративні викликачі
  не можуть ротувати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Збої автентифікації містять `error.details.code` разом із підказками для відновлення:
  - `error.details.canRetryWithDeviceToken` (булеве значення)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для окремого пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати оператору інструкції щодо дій.

## Ідентичність пристрою + спарювання

- Nodes мають містити стабільну ідентичність пристрою (`device.id`), виведену з
  відбитка ключової пари.
- Gateways видають токени для кожного пристрою + ролі.
- Затвердження спарювання потрібні для нових ідентифікаторів пристроїв, якщо
  локальне автоматичне затвердження не ввімкнене.
- Автоматичне затвердження спарювання зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях локального самопідключення backend/контейнера для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з того самого хоста через tailnet або LAN все одно розглядаються як віддалені для спарювання та
  потребують затвердження.
- WS-клієнти зазвичай додають ідентичність `device` під час `connect` (оператор +
  node). Єдині винятки для оператора без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності небезпечного HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - прямі loopback backend RPC `gateway-client`, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до виклику, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного відхилення. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалися. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте payload v2, який містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів пристрою/клієнта/ролі/scopes/токена/nonce.
- Застарілі підписи `v2` лишаються прийнятими для сумісності, але закріплення
  метаданих спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-з’єднань.
- Клієнти можуть за потреби закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API Gateway** (статус, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
TypeBox-схемами у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
