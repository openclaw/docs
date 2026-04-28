---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'WebSocket-протокол Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-28T20:11:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95845fc2aa56b0a53cf8c62c517b70d2624b15e707d84503c791af572360aff2
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android, безголові
вузли) підключаються через WebSocket і оголошують свою **роль** + **область дії** під час
рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні кадри та повільні вихідні буфери створюють події `payload.large`
  до того, як Gateway закриє або відкине відповідний кадр. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло кадру, токени, cookies або секретні значення.

## Рукостискання (connect)

Gateway → Клієнт (виклик перед підключенням):

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

`server`, `features`, `snapshot` і `policy` усі є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджену роль/області дії. `canvasHostUrl` є необов’язковим.

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

Довірені клієнти бекенда в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не вказувати `device` на прямих підключеннях local loopback, коли
вони автентифікуються спільним токеном/паролем Gateway. Цей шлях зарезервований
для внутрішніх RPC площини керування і не дає застарілим базовим станам спарювання CLI/пристрою
блокувати локальну роботу бекенда, як-от оновлення сесій субагентів. Віддалені клієнти,
клієнти з браузерним походженням, вузлові клієнти та явні клієнти токена пристрою/ідентичності пристрою
й надалі використовують звичайні перевірки спарювання та підвищення області дії.

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

Для вбудованого потоку bootstrap вузла/оператора основний токен вузла залишається
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим allowlist оператора
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки області дії bootstrap залишаються
префіксованими за роллю: записи оператора задовольняють лише запити оператора, а ролі, що не є операторами,
й надалі потребують областей дії під власним префіксом ролі.

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

## Обрамлення

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

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власну область дії оператора, але
зарезервовані основні адміністративні префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область дії методу є лише першим шлюзом перевірки. Деякі slash-команди, доступні через
`chat.send`, застосовують поверх цього суворіші перевірки на рівні команд. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують претензії на можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для виклику.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **претензії** і застосовує серверні allowlist.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спарені вузли також можуть повідомляти
  стійку фонову присутність, коли довірена подія вузла оновлює їхні метадані спарювання.

### Фонова подія активності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарений вузол був
активний під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` Gateway перед збереженням. Подія є стійкою лише для автентифікованих сесій
пристроїв вузлів; сесії без пристрою або без спарювання повертають `handled: false`.

Успішні Gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші Gateway можуть усе ще повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як стійке збереження присутності.

## Обмеження області дії широкомовних подій

Серверні широкомовні події WebSocket обмежуються областями дії, щоб сесії, обмежені спарюванням або лише вузлами, пасивно не отримували вміст сесій.

- **Кадри чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin широкомовлення `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin зареєстрував їх.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі родини широкомовних подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер на клієнта, тому широкомовлення зберігають монотонне впорядкування на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями дії.

## Поширені родини RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів plugin/channel. Сприймайте його як виявлення можливостей, а не повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібна область дії читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з адміністративною областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують потоки relay і спарювання.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію і може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених у runtime. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера/зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping embedding-провайдера.
    - `sessions.usage` повертає зведення використання за сесіями.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих + bundled каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web-входу для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку QR/web-входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований фрагмент кінця файлового журналу gateway з керуванням cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Розмова та TTS">
    - `talk.config` повертає ефективне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів runtime лише в разі повного успіху.
    - `secrets.resolve` розв’язує призначення секретів, націлені на команду, для певного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне навантаження конфігурації.
    - `config.schema` повертає живе навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: schema, `uiHints`, version і метадані генерації, зокрема метадані схем Plugin + каналів, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, виведені з тих самих міток і довідкового тексту, які використовує UI, зокрема для вкладених об’єктів, wildcard, array-item і гілок композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля перевірки (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення успішне.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, зокрема версію, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочої області">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочої області.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочої області, доступними для агента.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення запуску та повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесією">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для певних ключів сесій.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення UI-клієнтам: inline directive tags вилучаються з видимого тексту, plain-text XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) і leaked ASCII/full-width model control tokens вилучаються, рядки асистента лише з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої зі сполученням, які очікують підтвердження або вже схвалені.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його схваленої ролі та області дії викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі та області дії викликача.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду до підключеного вузла.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени scoped canvas-capability.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують надійною відкладеною роботою для offline/disconnected вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалень exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою схвалень exec через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалень, визначені Plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat ін’єкцію wake-тексту; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject`, та інші chat-події лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурація тригерів wake-word змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення Plugin.

### Допоміжні методи Node

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар runtime-команд для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочу область агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлюється основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають provider-aware native names, коли вони доступні
  - `textAliases` містить точні slash aliases, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware native command name, коли він існує.
  - `provider` необов’язковий і впливає лише на native naming плюс доступність native Plugin-команд.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сесії на серверному боці, замість приймати auth або delivery context, наданий викликачем.
  - Відповідь обмежена сесією та відображає те, що активна розмова може використовувати просто зараз, зокрема інструменти ядра, Plugin і каналів.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочу область агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та санітизовані варіанти встановлення без розкриття raw secret values.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку Skills у каталог `skills/` робочої області агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на gateway host.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один tracked slug або всі tracked ClawHub installs у робочій області агента за замовчуванням.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Представлення `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна поведінка середовища виконання. Якщо налаштовано `agents.defaults.models`, відповіддю є дозволений каталог; інакше відповіддю є повний каталог Gateway.
- `"configured"`: поведінка розміру вибирача. Якщо налаштовано `agents.defaults.models`, він все одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway з обходом `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних вибирачів моделей.

## Затвердження Exec

- Коли запит exec потребує затвердження, Gateway транслює `exec.approval.requested`.
- Клієнти оператора виконують вирішення, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після затвердження перенаправлені виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним затвердженим пересиланням `system.run`, Gateway
  відхиляє запуск замість того, щоб довіряти зміненому корисному навантаженню.

## Резервний варіант доставлення агентом

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідне доставлення.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставлення повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сеансу, коли неможливо визначити зовнішній маршрут доставлення (наприклад, внутрішні/webchat-сеанси або неоднозначні багатоканальні конфігурації).

## Керування версіями

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | Типово                                                | Джерело                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`15_000`) |
| Початкова затримка повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Макс. затримка повторного підключення     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Обмеження швидкої повторної спроби після закриття device-token | `250` ms                              | `src/gateway/client.ts`                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до рукостискання.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими, що несуть ідентичність, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"` задовольняють перевірку автентифікації підключення з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення зі спільним секретом;
  не відкривайте цей режим для публічного/ненадійного ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений роллю +
  областями підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір областей для цього токена. Це зберігає доступ для читання/перевірки/статусу,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  вужчої неявної області лише адміністратора.
- Збирання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  такому як `wss://` або loopback/локальне сполучення.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей залишається авторитетним; кешовані області лише
  повторно використовуються, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів з того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти свою заміну перед
  повторним підключенням. Ротації спільного/адміністративного доступу не віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі сполучення цього пристрою; зміна токена не може розширити або
  націлитися на роль пристрою, яку затвердження сполучення ніколи не надавало.
- Для сеансів токенів сполученого пристрою керування пристроями є самообмеженим, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей цільового операторського
  токена відносно поточних областей сеансу викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший операторський токен, ніж той, який вони вже мають.
- Збої автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба завершується невдало, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дій.

## Ідентичність пристрою + сполучення

- Nodes мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateways видають токени на пристрій + роль.
- Затвердження сполучення потрібні для нових ідентифікаторів пристроїв, якщо не ввімкнено локальне автоматичне затвердження.
- Автоматичне затвердження сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з того самого хоста через tailnet або LAN усе одно розглядаються як віддалені для сполучення та
  потребують затвердження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки операторів без пристрою — явні довірчі шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only insecure HTTP compatibility.
  - успішна автентифікація operator Control UI `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback backend RPCs `gateway-client`, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди подробиць `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося перевірити формат/канонікалізацію відкритого ключа. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення
  метаданих сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть необов’язково закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол мосту](/uk/gateway/bridge-protocol)
- [Операційний посібник Gateway](/uk/gateway)
