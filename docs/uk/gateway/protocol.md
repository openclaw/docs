---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-06T01:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol є **єдиною площиною керування + транспортом Node** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, iOS/Android Node, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **область дії** під час
рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Першим кадром **має** бути запит `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надмірно великі вхідні кадри та повільні вихідні буфери генерують події `payload.large`
  перед тим, як gateway закриє або відкине відповідний кадр. Ці події зберігають
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

Поки Gateway ще завершує запуск допоміжних sidecar-компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, установленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цей запит
у межах свого загального бюджету підключення, а не показувати його як остаточний
збій рукостискання.

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

Довірені backend-клієнти того самого процесу (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` у прямих підключеннях local loopback, коли
вони автентифікуються за допомогою спільного токена/пароля gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й не дає застарілим базовим станам парування CLI/пристрою
блокувати локальну backend-роботу, як-от оновлення сесій subagent. Віддалені клієнти,
клієнти з browser-origin, клієнти Node, а також явні клієнти з device-token/device-identity
і далі використовують звичайні перевірки парування та підвищення області дії.

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

Для вбудованого потоку bootstrap Node/operator основний токен Node лишається
`scopes: []`, а будь-який переданий токен operator лишається обмеженим allowlist
bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки області дії bootstrap лишаються
префіксованими роллю: записи operator задовольняють лише запити operator, а ролі не-operator
і далі потребують областей дії під власним рольовим префіксом.

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

## Фреймінг

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

Повну модель області дії operator, перевірки під час схвалення та семантику
спільного секрету див. у [Області дії operator](/uk/gateway/operator-scopes).

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

Методи RPC gateway, зареєстровані Plugin, можуть запитувати власну область дії operator, але
зарезервовані префікси адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди перетворюються на `operator.admin`.

Область дії методу є лише першою перевіркою. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команди додатково. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами Node: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують твердження про можливості під час підключення:

- `caps`: високорівневі категорії можливостей, як-от `camera`, `canvas`, `screen`,
  `location`, `voice` і `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **твердження** й застосовує серверні allowlist.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені Node повідомляють
  свій поточний час підключення як `lastSeenAtMs` із причиною `connect`; спаровані Node також можуть повідомляти
  тривку фонову присутність, коли довірена подія Node оновлює їхні метадані парування.

### Фонова подія активності Node

Node можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарований Node був
активним під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є тривкою лише для автентифікованих сесій пристроїв Node;
сесії без пристрою або без парування повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway можуть і далі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як тривке збереження присутності.

## Обмеження області дії широкомовних подій

Широкомовні WebSocket-події, які надсилає сервер, обмежуються областю дії, щоб сесії з областю дії лише для парування або лише для Node не отримували пасивно вміст сесій.

- **Кадри чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin широкомовні події `plugin.*`** обмежуються до `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються областю дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для кожного клієнта, щоб широкомовні події зберігали монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій після фільтрації за областю дії.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком для виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів Plugin/каналів. Трактуйте його як виявлення можливостей, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система й ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область дії читання operator.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator з областю дії admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується потоками relay і парування.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/Node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибору (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення вікон використання провайдера / залишку квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам'яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче живу перевірку ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів площини керування. Він може містити шляхи робочого простору, фрагменти пам'яті, відрендерений grounded markdown і кандидатів для глибокого просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення статусів вбудованих + bundled каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені wake-word тригери.
    - `voicewake.set` оновлює wake-word тригери й транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/thread, поза chat runner.
    - `logs.tail` повертає налаштований tail файлового журналу Gateway з керуванням cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.catalog` повертає доступний лише для читання каталог провайдерів Talk для мовлення, потокової транскрипції та голосу в реальному часі. Він містить ідентифікатори провайдерів, мітки, налаштований стан, відкриті ідентифікатори model/voice, канонічні режими, transports, стратегії brain і прапорці realtime audio/capability без повернення секретів провайдера або зміни глобальної конфігурації.
    - `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.session.create` створює сесію Talk, якою володіє Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` або `stt-tts/managed-room`. `brain: "direct-tools"` потребує `operator.admin`.
    - `talk.session.join` перевіряє токен сесії managed-room, за потреби емітить події `session.ready` або `session.replaced` і повертає метадані room/session плюс нещодавні події Talk без plaintext токена або збереженого хеша токена.
    - `talk.session.appendAudio` додає base64 PCM вхідний аудіо до realtime relay і transcription сесій, якими володіє Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` і `talk.session.cancelTurn` керують життєвим циклом turn у managed-room із відхиленням застарілих turn до очищення стану.
    - `talk.session.cancelOutput` зупиняє аудіовихід асистента, насамперед для VAD-gated barge-in у Gateway relay сесіях.
    - `talk.session.submitToolResult` завершує виклик provider tool, емітований realtime relay сесією, якою володіє Gateway.
    - `talk.session.close` закриває relay, transcription або managed-room сесію, якою володіє Gateway, і емітить термінальні події Talk.
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.client.create` створює realtime provider сесію, якою володіє клієнт, через `webrtc` або `provider-websocket`, тоді як Gateway володіє конфігурацією, обліковими даними, інструкціями та політикою інструментів.
    - `talk.client.toolCall` дає realtime transports, якими володіє клієнт, пересилати виклики provider tool до політики Gateway. Перший підтримуваний інструмент — `openclaw_agent_consult`; клієнти отримують run id і чекають звичайних подій життєвого циклу чату перед надсиланням специфічного для провайдера результату інструмента.
    - `talk.event` — це єдиний канал подій Talk для realtime, transcription, STT/TTS, managed-room, telephony і meeting adapters.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв'язує активні SecretRefs і замінює стан runtime секретів лише за повного успіху.
    - `secrets.resolve` розв'язує призначення секретів, націлені на command, для конкретного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірений payload конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повний payload конфігурації.
    - `config.schema` повертає live payload схеми конфігурації, який використовують Control UI та CLI tooling: schema, `uiHints`, version і generation metadata, включно з metadata схеми Plugin + channel, коли runtime може їх завантажити. Схема містить metadata полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, включно з вкладеними object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає path-scoped lookup payload для одного шляху конфігурації: нормалізований path, shallow schema node, matched hint + `hintPath` і immediate child summaries для UI/CLI drill-down. Lookup schema nodes зберігають user-facing docs і common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child summaries відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, плюс matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує restart лише тоді, коли саме оновлення завершилось успішно; викликачі із сесією можуть включити `continuationMessage`, щоб startup відновив один follow-up turn агента через restart continuation queue. Оновлення package-manager примусово виконують non-deferred, no-cooldown update restart після package swap, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований update restart sentinel, включно з post-restart running version, коли доступно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та runtime metadata.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив'язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap файлами робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають зведення артефактів, отриманих із transcript, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розв'язують сесію-власника на стороні сервера й повертають лише transcript media з відповідним provenance; небезпечні або локальні URL sources повертають unsupported downloads замість завантаження на стороні сервера.
    - `environments.list` і `environments.status` відкривають доступне лише для читання виявлення Gateway-local і node середовищ для SDK clients.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, коли доступно.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, включно з metadata `agentRuntime` для кожного рядка, коли налаштовано agent runtime backend.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS client.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/message для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних session keys.
    - `sessions.describe` повертає один рядок сесії Gateway для exact session key.
    - `sessions.resolve` розв'язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов'язковий `runId` або передати лише `runId` для активних runs, які Gateway може розв'язати до сесії.
    - `sessions.patch` оновлює metadata/overrides сесії та повідомляє розв'язану canonical model плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтам UI: inline directive tags вилучаються з видимого тексту, plain-text tool-call XML payloads (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і truncated tool-call blocks) та leaked ASCII/full-width model control tokens вилучаються, pure silent-token assistant rows на кшталт точних `NO_REPLY` / `no_reply` пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає pending і approved paired devices.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами device-pairing.
    - `device.token.rotate` ротує paired device token у межах його approved role і caller scope.
    - `device.token.revoke` відкликає paired device token у межах його approved role і caller scope.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення Node і bootstrap verification.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює мітку paired Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для invoke request.
    - `node.event` переносить події, що походять від Node, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` — це API черги connected-node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected nodes.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди ретрансляції вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills і інструменти">
    - Автоматизація: `wake` планує негайне або під час наступного heartbeat вставлення тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject` та інші події чату лише для
  транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: трансляція запиту виклику вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: змінено конфігурацію тригера ключового слова пробудження.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення
  exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення
  plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок автоматичного дозволу.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд
  runtime для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати типовий робочий простір агента.
  - `scope` контролює, на яку поверхню спрямовано основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають провайдер-орієнтовані нативні імена,
      коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, як-от `/model` і `/m`.
  - `nativeName` містить провайдер-орієнтоване нативне ім’я команди, якщо воно існує.
  - `provider` є необов’язковим і впливає лише на нативне іменування та доступність нативних команд plugin.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів runtime для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактично доступний у runtime
  інвентар інструментів для сесії.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений контекст runtime із сесії на серверному боці замість прийняття
    наданого викликачем контексту автентифікації або доставки.
  - Відповідь має область дії сесії та відображає те, що активна розмова може використовувати прямо зараз,
    включно з core, plugin і інструментами каналів.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` є обов’язковим. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` є необов’язковими.
  - Якщо присутні і `sessionKey`, і `agentId`, визначений агент сесії має збігатися з
    `agentId`.
  - Відповідь є конвертом, орієнтованим на SDK, із полями `ok`, `toolName`, необов’язковим `output` і типізованими
    полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не
    обходять конвеєр політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати типовий робочий простір агента.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill у каталог `skills/` типового робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    типовому робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Представлення `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Опущено або `"default"`: поточна поведінка runtime. Якщо `agents.defaults.models` налаштовано, відповіддю є дозволений каталог; інакше відповіддю є повний каталог Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає жодних налаштованих рядків моделей.
- `"all"`: повний каталог Gateway з обходом `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти операторів вирішують це, викликаючи `exec.approval.resolve` (потребує області `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переспрямовані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та остаточним схваленим переспрямуванням `system.run`, Gateway
  відхиляє запуск замість довіри зміненому payload.

## Резервна доставка агенту

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: невизначені або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сесії, коли зовнішній маршрут доставки неможливо визначити (наприклад, внутрішні/webchat сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в protocol v3 і є очікуваним базовим рівнем для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити спільний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                        | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження швидкого повтору після закриття device-token | `250` ms                                  | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Закриття через тайм-аут tick              | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з передаванням ідентичності, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect із
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect
  зі спільним секретом; не відкривайте цей режим на публічному/ненадійному ingress.
- Після pairing Gateway видає **device token**, обмежений роллю з’єднання
  + scopes. Його повертають у `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно
  використовувати збережений затверджений набір scope для цього токена. Це
  зберігає вже наданий доступ read/probe/status і не дає повторним підключенням
  непомітно звужуватися до вужчого неявного scope лише для admin.
- Складання автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди передається, коли встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для окремого пристрою
    (за ключем `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище
    варіантів не визначив `auth.token`. Спільний токен або будь-який визначений
    device token пригнічує його.
  - Автопідвищення збереженого device token під час одноразової повторної спроби
    `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є bootstrap handoff tokens.
  Зберігайте їх лише тоді, коли connect використовував bootstrap-автентифікацію
  на довіреному транспорті, як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей запитаний
  викликачем набір scope лишається авторитетним; кешовані scopes повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен
  для окремого пристрою.
- Device tokens можна rotate/revoke через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає metadata ротації. Він віддзеркалює замінний
  bearer token лише для викликів із того самого пристрою, які вже
  автентифіковані цим device token, щоб клієнти лише з токеном могли зберегти
  заміну перед повторним підключенням. Ротації shared/admin не віддзеркалюють
  bearer token.
- Видача, ротація та відкликання токенів лишаються обмеженими затвердженим набором
  ролей, записаним у pairing-записі цього пристрою; зміна токена не може
  розширити або націлитися на роль пристрою, яку pairing approval ніколи не надавав.
- Для paired-device token sessions керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: non-admin викликачі можуть
  видаляти/revoke/rotate лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scope
  цільового operator token щодо поточних session scopes викликача. Non-admin
  викликачі не можуть rotate або revoke ширший operator token, ніж уже мають.
- Збої автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для окремого пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати інструкції щодо дій оператора.

## Ідентичність пристрою + pairing

- Node-и мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  fingerprint keypair.
- Gateway видають токени на пристрій + роль.
- Pairing approvals потрібні для нових device IDs, якщо не ввімкнено локальне auto-approval.
- Pairing auto-approval зосереджене на прямих local loopback connects.
- OpenClaw також має вузький backend/container-local self-connect шлях для
  довірених shared-secret helper flows.
- Same-host tailnet або LAN connects усе ще вважаються віддаленими для pairing і
  потребують approval.
- WS-клієнти зазвичай передають ідентичність `device` під час `connect` (operator +
  node). Єдині device-less operator винятки — явні trust paths:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only insecure HTTP compatibility.
  - успішна автентифікація operator Control UI у `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, суттєве зниження безпеки).
  - direct-loopback `gateway-client` backend RPCs, автентифіковані спільним
    gateway token/password.
- Усі з’єднання мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для legacy клієнтів, які досі використовують pre-challenge signing behavior, `connect` тепер повертає
detail codes `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload не відповідає v2 payload.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана timestamp поза дозволеним skew.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає fingerprint публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/canonicalization публічного ключа не вдалися. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте v2 payload, що містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний signature payload — `v3`, який прив’язує `platform` і `deviceFamily`
  на додаток до полів device/client/role/scopes/token/nonce.
- Legacy `v2` signatures лишаються прийнятими для сумісності, але metadata pinning
  paired-device усе ще керує command policy під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-з’єднань.
- Клієнти можуть додатково закріпити fingerprint сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол надає **повний gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
TypeBox schemas у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
