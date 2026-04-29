---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket для Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-29T04:06:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2923919857e430b2db1d9c731025dc18499e5dbe01f248c0f873bd30041cf0e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS-протокол є **єдиною площиною керування + транспортом Node** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, iOS/Android Node, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **область доступу** під
час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-пейлоадами.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери створюють події `payload.large`
  до того, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло фрейму, токени, cookies або секретні значення.

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

`server`, `features`, `snapshot` і `policy` усі є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
узгоджену роль/області доступу. `canvasHostUrl` є необов’язковим.

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

Довірені клієнти бекенда в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` у прямих підключеннях local loopback, коли
вони автентифікуються спільним токеном/паролем gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й не дає застарілим базовим даним прив’язки CLI/пристрою
блокувати локальну роботу бекенда, як-от оновлення сесій субагентів. Віддалені клієнти,
клієнти з браузерним походженням, клієнти Node, а також явні клієнти з токеном пристрою/ідентичністю пристрою
далі використовують звичайні перевірки прив’язки та підвищення області доступу.

Коли токен пристрою видається, `hello-ok` також містить:

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

Для вбудованого потоку bootstrap Node/operator основний токен Node залишається
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим allowlist
оператора bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей доступу bootstrap залишаються
префіксованими роллю: записи оператора задовольняють лише запити оператора, а ролям не-оператора
далі потрібні області доступу під власним префіксом ролі.

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

## Обрамлення

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області доступу

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області доступу (operator)

Поширені області доступу:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

RPC-методи gateway, зареєстровані Plugin, можуть запитувати власну область доступу оператора, але
зарезервовані префікси адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди перетворюються на `operator.admin`.

Область доступу методу є лише першим бар’єром. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки рівня команди поверх цього. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області доступу під час схвалення поверх
базової області доступу методу:

- запити без команд: `operator.pairing`
- запити з командами Node, що не належать до exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заяви** і застосовує allowlist на серверному боці.

## Presence

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI міг показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені Node повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; прив’язані Node також можуть повідомляти
  тривалу фонову presence, коли довірена подія Node оновлює їхні метадані прив’язки.

### Фонова подія alive для Node

Node можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що прив’язаний Node був
живим під час фонового пробудження, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є довговічною лише для автентифікованих сесій пристрою
Node; сесії без пристрою або без прив’язки повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway можуть далі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як довговічне збереження presence.

## Обмеження області трансляції подій

Трансляційні події WebSocket, які сервер надсилає клієнтам, обмежуються областями доступу, щоб сесії з областю прив’язки або лише Node не отримували пасивно вміст сесії.

- **Фрейми чату, агента та результатів інструментів** (включно зі streamed подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin трансляції `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб справність транспорту була видимою для кожної автентифікованої сесії.
- **Невідомі сімейства трансляційних подій** за замовчуванням обмежуються областями доступу (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер на клієнта, тому трансляції зберігають монотонне впорядкування на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями доступу.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком для виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/каналів. Трактуйте його як виявлення функцій, а не повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок справності gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор стабільності діагностики. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібна область доступу operator read.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з областю доступу admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яку використовують потоки relay і прив’язки.
    - `system-presence` повертає поточний знімок presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію і може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера/зведення залишку квоти.
    - `usage.cost` повертає агреговані зведення використання витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність vector-memory / кешованих embeddings для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче live ping провайдера embeddings.
    - `sessions.usage` повертає зведення використання за сесіями.
    - `sessions.usage.timeseries` повертає timeseries використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і bundled каналів/plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного web-провайдера каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web-потоку входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий outbound-delivery RPC для надсилань, націлених на канал/обліковий запис/тред поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з керуванням cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback-провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює runtime-стан секретів лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів, націлені на команду, для певного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує валідований payload конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` валідує + замінює повний payload конфігурації.
    - `config.schema` повертає live payload схеми конфігурації, який використовують Control UI і CLI-інструменти: schema, `uiHints`, version і metadata генерації, включно з metadata схеми plugin + channel, коли runtime може її завантажити. Схема містить metadata полів `title` / `description`, похідну від тих самих labels і help text, які використовує UI, включно з вкладеними object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає path-scoped lookup payload для одного шляху конфігурації: нормалізований path, shallow schema node, matched hint + `hintPath` і immediate child summaries для UI/CLI drill-down. Lookup schema nodes зберігають користувацьку документацію та common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds, а також flags на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child summaries відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує restart лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає останній кешований update restart sentinel, включно з running version після restart, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агентів і робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з effective model і runtime metadata.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і під’єднанням workspace.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap workspace files, доступними для агента.
    - `agent.identity.get` повертає effective assistant identity для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесією">
    - `sessions.list` повертає поточний session index.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на session change event для поточного WS client.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають transcript/message event subscriptions для однієї сесії.
    - `sessions.preview` повертає bounded transcript previews для певних session keys.
    - `sessions.resolve` розв’язує або канонікалізує session target.
    - `sessions.create` створює новий session entry.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це interrupt-and-steer variant для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює metadata/overrides сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений session row.
    - Виконання чату досі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` display-normalized для UI clients: inline directive tags видаляються з видимого тексту, plain-text tool-call XML payloads (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і truncated tool-call blocks) та leaked ASCII/full-width model control tokens видаляються, pure silent-token assistant rows на кшталт точних `NO_REPLY` / `no_reply` опускаються, а oversized rows можуть бути замінені placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає pending і approved paired devices.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами device-pairing.
    - `device.token.rotate` ротує paired device token у межах його approved role і caller scope bounds.
    - `device.token.revoke` відкликає paired device token у межах його approved role і caller scope bounds.

  </Accordion>

  <Accordion title="Спарювання вузлів, invoke і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють node pairing і bootstrap verification.
    - `node.list` і `node.describe` повертають known/connected node state.
    - `node.rename` оновлює мітку paired node.
    - `node.invoke` пересилає команду до connected node.
    - `node.invoke.result` повертає результат для invoke request.
    - `node.event` передає node-originated events назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` — це connected-node queue APIs.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected nodes.

  </Accordion>

  <Accordion title="Сімейства підтверджень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють one-shot exec approval requests, а також pending approval lookup/replay.
    - `exec.approval.waitDecision` очікує одне pending exec approval і повертає final decision (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують snapshots політики gateway exec approval.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local exec approval policy через node relay commands.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють plugin-defined approval flows.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує immediate або next-heartbeat wake text injection; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують scheduled work.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI chat, як-от `chat.inject` та інші transcript-only chat
  events.
- `session.message` і `session.tool`: transcript/event-stream updates для
  subscribed session.
- `sessions.changed`: змінено session index або metadata.
- `presence`: оновлення system presence snapshot.
- `tick`: periodic keepalive / liveness event.
- `health`: оновлення gateway health snapshot.
- `heartbeat`: оновлення Heartbeat event stream.
- `cron`: event зміни cron run/job.
- `shutdown`: сповіщення про shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: lifecycle node pairing.
- `node.invoke.request`: broadcast node invoke request.
- `device.pair.requested` / `device.pair.resolved`: paired-device lifecycle.
- `voicewake.changed`: змінено конфігурацію wake-word trigger.
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle exec approval.
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle plugin approval.

### Допоміжні методи вузлів

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список skill executables
  для auto-allow checks.

### Допоміжні методи операторів

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  command inventory для агента.
  - `agentId` необов’язковий; опустіть його, щоб прочитати default agent workspace.
  - `scope` керує тим, на яку surface націлюється primary `name`:
    - `text` повертає primary text command token без початкового `/`
    - `native` і default шлях `both` повертають provider-aware native names,
      коли доступні
  - `textAliases` містить exact slash aliases, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware native command name, коли він існує.
  - `provider` необов’язковий і впливає лише на native naming, а також native plugin
    command availability.
  - `includeArgs=false` опускає serialized argument metadata з відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime tool catalog для
  агента. Відповідь містить grouped tools і provenance metadata:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є plugin tool optional
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective tool
  inventory для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить trusted runtime context із сесії на серверному боці замість приймання
    caller-supplied auth або delivery context.
  - Відповідь session-scoped і відображає те, що активна розмова може використовувати прямо зараз,
    включно з core, plugin і channel tools.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати visible
  skill inventory для агента.
  - `agentId` необов’язковий; опустіть його, щоб прочитати default agent workspace.
  - Відповідь містить eligibility, missing requirements, config checks і
    sanitized install options без розкриття raw secret values.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  ClawHub discovery metadata.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    skill folder у директорію `skills/` default agent workspace.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на gateway host.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один tracked slug або всі tracked ClawHub installs у
    default agent workspace.
  - Config mode виправляє values `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Не вказано або `"default"`: поточна поведінка runtime. Якщо налаштовано `agents.defaults.models`, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру пікера. Якщо налаштовано `agents.defaults.models`, вона все одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли налаштованих рядків моделей немає.
- `"all"`: повний каталог Gateway, оминаючи `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних пікерів моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора виконують вирішення, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переадресовані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим переадресуванням `system.run`, Gateway
  відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: невирішені або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сеансі, коли неможливо визначити зовнішній маршрут доставки (наприклад, внутрішні/webchat-сеанси або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в межах protocol v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                   |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`         |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)              |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`15_000`) |
| Початкова затримка повторного підключення | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                     |
| Максимальна затримка повторного підключення | `30_000` ms                                        | `src/gateway/client.ts` (`scheduleReconnect`)             |
| Обмеження швидкої повторної спроби після закриття device-token | `250` ms                         | `src/gateway/client.ts`                                   |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                           |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                          | `src/gateway/client.ts`                                   |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                         |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
та `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення зі спільним секретом;
  не відкривайте цей режим на публічному/ненадійному ingress.
- Після pairing Gateway видає **device token**, обмежений роллю підключення
  + областями. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  затверджений набір областей для цього токена. Це зберігає доступ read/probe/status,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  вужчої неявної області лише для адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спершу явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений device token пригнічує його.
  - Автопідвищення збереженого device token під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей залишається авторитетним; кешовані області
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Device tokens можна ротувати/відкликати через `device.token.rotate` та
  `device.token.revoke` (потрібна область `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  device token, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Ротації shared/admin не віддзеркалюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у pairing-записі цього пристрою; мутація токена не може розширити або
  націлити роль пристрою, якої pairing approval ніколи не надавало.
- Для сеансів токенів paired-device керування пристроєм є self-scoped, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір областей operator
  token щодо поточних областей сеансу викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший operator token, ніж уже мають.
- Збої автентифікації містять `error.details.code` плюс підказки відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба завершується невдачею, клієнти мають зупинити автоматичні цикли повторного підключення й показати оператору вказівки щодо дії.

## Ідентичність пристрою + pairing

- Node мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка keypair.
- Gateway видають токени для пристрою + ролі.
- Pairing approvals потрібні для нових ідентифікаторів пристроїв, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з того самого хоста через tailnet або LAN усе одно вважаються віддаленими для pairing і
  потребують схвалення.
- WS-клієнти зазвичай містять ідентичність `device` під час `connect` (operator +
  node). Єдині винятки operator без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only insecure HTTP compatibility.
  - успішна автентифікація operator Control UI `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback backend RPCs `gateway-client`, автентифіковані спільним
    gateway token/password.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які досі використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілий/неправильний nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу виходить за межі дозволеного skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалася. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення метаданих paired-device
  усе одно контролює політику команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-з’єднань.
- Клієнти можуть необов’язково закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол мосту](/uk/gateway/bridge-protocol)
- [Операційний посібник Gateway](/uk/gateway)
