---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: handshake, фрейми, версіювання'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-07-03T17:42:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область** під час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери генерують події
  `payload.large` перед тим, як gateway закриє або відкине відповідний фрейм.
  Ці події зберігають розміри, обмеження, поверхні та безпечні коди причин.
  Вони не зберігають тіло повідомлення, вміст вкладень, сире тіло фрейму,
  токени, cookie або секретні значення.

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
    "maxProtocol": 4,
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
    "protocol": 4,
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

Поки Gateway ще завершує запуск sidecar-компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, встановленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цей відгук
у межах свого загального бюджету підключення, а не показувати його як
остаточний збій рукостискання.

`server`, `features`, `snapshot` і `policy` є обов'язковими за схемою
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` також обов'язковий і повідомляє
узгоджені роль/області. `pluginSurfaceUrls` є необов'язковим і зіставляє назви
поверхонь плагінів, як-от `canvas`, з обмеженими за областю hosted URL.

URL поверхонь плагінів з обмеженою областю можуть спливати. Вузли можуть викликати
`node.pluginSurface.refresh` з `{ "surface": "canvas" }`, щоб отримати свіжий
запис у `pluginSurfaceUrls`. Експериментальний рефакторинг плагіна Canvas не
підтримує застарілий шлях сумісності `canvasHostUrl`, `canvasCapability` або
`node.canvas.capability.refresh`; поточні нативні клієнти та gateway мають
використовувати поверхні плагінів.

Коли токен пристрою не видано, `hello-ok.auth` повідомляє узгоджені
дозволи без полів токенів:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` для прямих loopback-з'єднань,
коли вони автентифікуються спільним gateway-токеном/паролем. Цей шлях
зарезервований для внутрішніх RPC площини керування та не дає застарілим
базовим прив'язкам CLI/пристрою блокувати локальну backend-роботу, як-от
оновлення сесій subagent. Віддалені клієнти, клієнти з browser-origin,
клієнти-вузли та явні клієнти з токеном пристрою/ідентичністю пристрою
й надалі використовують звичайні перевірки прив'язки та підвищення області.

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

Вбудоване початкове налаштування через QR/setup-code є свіжим шляхом передачі
на мобільний пристрій. Успішне підключення з базовим setup-code повертає
основний токен вузла плюс один обмежений токен оператора:

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

Передачу оператора навмисно обмежено, щоб QR-онбординг міг запустити
мобільний operator loop і завершити нативне налаштування без надання областей
зміни прив'язки або `operator.admin`. Вона містить `operator.talk.secrets`, щоб
нативний клієнт міг прочитати потрібну йому конфігурацію Talk після початкового
налаштування. Ширший доступ до прив'язки й адміністрування потребує окремого
схваленого прив'язування оператора або потоку токена. Клієнти мають зберігати
`hello-ok.auth.deviceTokens` лише
коли підключення використовувало bootstrap-автентифікацію через довірений
транспорт, як-от `wss://` або loopback/локальну прив'язку.

### Приклад вузла

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

## Ролі + області

Повну модель областей оператора, перевірки під час схвалення та семантику
спільних секретів див. у [Області оператора](/uk/gateway/operator-scopes).

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області (operator)

Поширені області:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).
Коли секрети включено, клієнти мають читати облікові дані активного
провайдера Talk з `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
залишається у формі джерела та може бути об'єктом SecretRef або редагованим рядком.

Зареєстровані плагінами RPC-методи gateway можуть запитувати власну область
оператора, але зарезервовані core-префікси адміністрування (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди розв'язуються в `operator.admin`.

Область методу є лише першим бар'єром. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команди додатково.
Наприклад, постійні записи `/config set` і `/config unset` потребують
`operator.admin`.

`node.pair.approve` також має додаткову перевірку області під час схвалення
поверх базової області методу:

- запити без команд: `operator.pairing`
- запити з non-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (node)

Вузли оголошують заявки на можливості під час підключення:

- `caps`: високорівневі категорії можливостей, як-от `camera`, `canvas`, `screen`,
  `location`, `voice` і `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **заявки** та застосовує server-side allowlist.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов'язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; прив'язані вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані прив'язки.

### Фонова подія живого вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що прив'язаний вузол був
живим під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є тривалою лише для автентифікованих
сесій пристроїв-вузлів; сесії без пристрою або без прив'язки повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway все ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження області broadcast-подій

Broadcast-події WebSocket, які надсилає сервер, обмежуються областями, щоб сесії з областю прив'язки або лише вузлові сесії не отримували пасивно вміст сесій.

- **Фрейми чату, агента й результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують принаймні `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені плагінами broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як плагін їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі родини broadcast-подій** за замовчуванням обмежуються областями (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний поклієнтський порядковий номер, тож broadcast-події зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій після фільтрації за областю.

## Поширені родини RPC-методів

Публічна WS-поверхня ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим з `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів плагінів/каналів. Розглядайте його як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область доступу для читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів оператора з областю доступу адміністратора.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують потоки ретрансляції та сполучення.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв оператора/Node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення вікон використання провайдера/залишку квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
      Передайте `agentId` для одного агента або `agentScope: "all"`, щоб агрегувати налаштованих агентів.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче виконати живий ping провайдера embedding. Клієнти, сумісні з Dreaming, також можуть передати `{ "agentId": "agent-id" }`, щоб обмежити статистику сховища Dreaming вибраним робочим простором агента; якщо `agentId` опущено, зберігається резервний варіант агента за замовчуванням і агрегуються налаштовані робочі простори Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` і `doctor.memory.dedupeDreamDiary` приймають необов’язкові параметри `{ "agentId": "agent-id" }` для переглядів/дій Dreaming вибраного агента. Якщо `agentId` опущено, вони працюють із налаштованим робочим простором агента за замовчуванням.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів control plane. Він може містити шляхи робочого простору, фрагменти пам’яті, відрендерений grounded markdown і кандидатів на deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сесіями. Передайте `agentId` для одного
      агента або `agentScope: "all"`, щоб перелічити налаштованих агентів разом.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих + bundled каналів/Plugin.
    - `channels.logout` виходить із конкретного каналу/акаунта, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web входу для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку QR/web входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/акаунт/тред, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу Gateway з елементами керування курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.catalog` повертає доступний лише для читання каталог провайдерів Talk для мовлення, потокової транскрипції та голосу в реальному часі. Він містить канонічні ідентифікатори провайдерів, псевдоніми реєстру, мітки, налаштований стан, необов’язковий результат `ready` на рівні групи, відкриті ідентифікатори моделей/голосів, канонічні режими, транспорти, brain strategies і realtime audio/capability flags без повернення секретів провайдера чи зміни глобальної конфігурації. Поточні Gateways встановлюють `ready` після застосування вибору провайдера під час виконання; клієнти мають трактувати його відсутність як неперевірений стан для сумісності зі старішими Gateways.
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.session.create` створює сесію Talk, якою володіє Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` або `stt-tts/managed-room`. Для `stt-tts/managed-room` викликачі `operator.write`, які передають `sessionKey`, також мають передати `spawnedBy` для області видимості ключа сесії; створення `sessionKey` без області та `brain: "direct-tools"` потребують `operator.admin`.
    - `talk.session.join` перевіряє токен сесії managed-room, за потреби емiтує події `session.ready` або `session.replaced` і повертає метадані кімнати/сесії разом із нещодавніми подіями Talk без токена у відкритому тексті або збереженого хешу токена.
    - `talk.session.appendAudio` додає вхідне PCM-аудіо base64 до сесій realtime relay і transcription, якими володіє Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` і `talk.session.cancelTurn` керують життєвим циклом turn у managed-room із відхиленням застарілого turn до очищення стану.
    - `talk.session.cancelOutput` зупиняє аудіовихід асистента, передусім для VAD-gated barge-in у сесіях Gateway relay.
    - `talk.session.submitToolResult` завершує виклик інструмента провайдера, емітований realtime relay сесією, якою володіє Gateway. Передайте `options: { willContinue: true }` для проміжного виводу інструмента, коли фінальний результат буде пізніше, або `options: { suppressResponse: true }`, коли результат інструмента має задовольнити виклик провайдера без запуску ще однієї відповіді realtime assistant.
    - `talk.session.steer` надсилає голосове керування active-run у сесію Talk з агентом, якою володіє Gateway. Він приймає `{ sessionId, text, mode? }`, де `mode` — це `status`, `steer`, `cancel` або `followup`; опущений режим класифікується зі сказаного тексту.
    - `talk.session.close` закриває relay, transcription або managed-room сесію, якою володіє Gateway, і емітує термінальні події Talk.
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.client.create` створює realtime сесію провайдера, якою володіє клієнт, використовуючи `webrtc` або `provider-websocket`, тоді як Gateway володіє конфігурацією, обліковими даними, інструкціями та політикою інструментів.
    - `talk.client.toolCall` дає змогу realtime transport, якими володіє клієнт, пересилати виклики інструментів провайдера до політики Gateway. Перший підтримуваний інструмент — `openclaw_agent_consult`; клієнти отримують ідентифікатор run і очікують звичайних подій життєвого циклу чату перед поданням результату інструмента, специфічного для провайдера.
    - `talk.client.steer` надсилає голосове керування active-run для realtime transport, якими володіє клієнт. Gateway визначає активний embedded run із `sessionKey` і повертає структурований прийнятий/відхилений результат замість мовчазного відкидання steering.
    - `talk.event` — єдиний канал подій Talk для адаптерів realtime, transcription, STT/TTS, managed-room, telephony і meeting.
    - `talk.speak` синтезує мовлення через активного мовного провайдера Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів для цільової команди для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації. Деструктивна заміна масиву
      потребує відповідного шляху в `replacePaths`; вкладені масиви
      в елементах масиву використовують шляхи `[]`, як-от `agents.list[].skills`.
    - `config.apply` перевіряє + замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: schema, `uiHints`, version і метадані генерації, включно з метаданими схем Plugin + channel, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, виведені з тих самих міток і довідкового тексту, що використовуються UI, включно з вкладеними гілками композиції object, wildcard, array-item і `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження lookup, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, неглибокий вузол схеми, відповідний hint + `hintPath`, необов’язковий `reloadKind` і негайні зведення дочірніх елементів для drill-down в UI/CLI. `reloadKind` є одним із `restart`, `hot` або `none` і віддзеркалює планувальник перезавантаження конфігурації Gateway для запитаного шляху. Вузли lookup-схеми зберігають користувацьку документацію та загальні поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Дочірні зведення відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, необов’язковий `reloadKind`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення успішне; викликачі із сесією можуть включити `continuationMessage`, щоб startup відновив один follow-up turn агента через restart continuation queue. Оновлення package-manager і контрольовані оновлення git-checkout із control plane використовують відокремлену передачу managed-service замість заміни package tree або зміни checkout/build output всередині живого Gateway. Запущена передача повертає `ok: true` з `result.reason: "managed-service-handoff-started"` і `handoff.status: "started"`; недоступні або невдалі передачі повертають `ok: false` з `managed-service-handoff-unavailable` або `managed-service-handoff-failed`, а також `handoff.command`, коли потрібне ручне shell-оновлення. Недоступна передача означає, що OpenClaw не має безпечної межі supervisor або сталої ідентичності service, як-от `OPENCLAW_SYSTEMD_UNIT` для systemd. Під час запущеної передачі restart sentinel може коротко повідомляти `stats.reason: "restart-health-pending"`; продовження відкладається, доки CLI не перевірить перезапущений Gateway і не запише фінальний sentinel `ok`.
    - `update.status` оновлює та повертає останній restart sentinel оновлення, включно з версією, що працює після перезапуску, якщо вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Допоміжні засоби агентів і робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і метадані середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують початковими файлами робочого простору, доступними для агента.
    - `tasks.list`, `tasks.get` і `tasks.cancel` надають журнал завдань Gateway клієнтам SDK та оператора.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають зведення артефактів, отриманих зі стенограми, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити запусків і завдань визначають сеанс-власник на боці сервера та повертають лише медіа стенограми з відповідним походженням; небезпечні або локальні джерела URL повертають непідтримувані завантаження замість отримання на боці сервера.
    - `environments.list` і `environments.status` надають клієнтам SDK доступне лише для читання виявлення локальних для Gateway середовищ і середовищ вузлів.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
    - `agent.wait` очікує завершення запуску та повертає термінальний знімок, якщо він доступний.

  </Accordion>

  <Accordion title="Керування сеансами">
    - `sessions.list` повертає поточний індекс сеансів, зокрема метадані `agentRuntime` для кожного рядка, коли налаштовано бекенд середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сеансів для поточного клієнта WS.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події стенограми/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди стенограм для конкретних ключів сеансів.
    - `sessions.describe` повертає один рядок сеансу Gateway для точного ключа сеансу.
    - `sessions.resolve` визначає або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` є варіантом переривання й скеровування для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу. Викликач може передати `key` та необов’язковий `runId` або передати лише `runId` для активних запусків, які Gateway може зіставити із сеансом.
    - `sessions.patch` оновлює метадані/перевизначення сеансу та повідомляє визначену канонічну модель разом з ефективним `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансів.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтами UI: вбудовані теги директив вилучаються з видимого тексту, текстові XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витеклі ASCII/повноширинні токени керування моделлю вилучаються, суто беззвучні рядки асистента з токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть замінюватися заповнювачами.
    - `chat.message.get` є додатковим обмеженим читачем повного повідомлення для одного видимого запису стенограми. Клієнти передають `sessionKey`, необов’язковий `agentId`, коли вибір сеансу обмежений агентом, а також `messageId` стенограми, раніше показаний через `chat.history`, і Gateway повертає ту саму нормалізовану для відображення проєкцію без легкого обмеження обрізання історії, якщо збережений запис усе ще доступний і не є завеликим.
    - `chat.send` приймає одноразовий `fastMode: "auto"`, щоб використовувати швидкий режим для викликів моделі, розпочатих до автоматичної межі, а потім запускати пізніші повторні спроби, резервні варіанти, результати інструментів або продовження без швидкого режиму. Типова межа становить 60 секунд і може налаштовуватися для кожної моделі через `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Викликач `chat.send` може передати одноразовий `fastAutoOnSeconds`, щоб перевизначити межу для цього запиту.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої зі сполученням у стані очікування та схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його схваленої ролі та області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі та області викликача.

  </Accordion>

  <Accordion title="Сполучення вузлів, invoke і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення вузлів і перевірку початкового налаштування.
    - `node.list` і `node.describe` повертають відомий/підключений стан вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.pending.pull` і `node.pending.ack` є API черги підключених вузлів.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною роботою в очікуванні для офлайн/відключених вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/відтворення схвалень у стані очікування.
    - `exec.approval.waitDecision` очікує на одне схвалення exec у стані очікування та повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди ретрансляції вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або під час наступного Heartbeat впровадження тексту пробудження; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - `cron.run` залишається RPC у стилі додавання до черги для ручних запусків. Клієнти, яким потрібна семантика завершення, мають читати повернений `runId` і опитувати `cron.runs`.
    - `cron.runs` приймає необов’язковий непорожній фільтр `runId`, щоб клієнти могли відстежувати один поставлений у чергу ручний запуск без перегонів з іншими записами історії для того самого завдання.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject` та інші події чату лише зі стенограми. У протоколі v4 навантаження дельти містять `deltaText`; `message` залишається накопиченим знімком асистента. Заміни, що не є префіксами, встановлюють `replace=true` і використовують `deltaText` як текст заміни.
- `session.message`, `session.operation` і `session.tool`: оновлення стенограми, операції сеансу в процесі виконання та потоку подій для підписаного сеансу.
- `sessions.changed`: індекс сеансів або метадані змінилися.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / перевірки живучості.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурація тригера слова пробудження змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи вузлів

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок автоматичного дозволу.

### RPC журналу завдань

Клієнти оператора можуть переглядати й скасовувати записи фонових завдань Gateway через RPC журналу завдань. Ці методи повертають очищені зведення завдань, а не сирий стан середовища виконання.

- `tasks.list` вимагає `operator.read`.
  - Параметри: необов’язковий `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` або `"timed_out"`) чи масив таких статусів, необов’язковий `agentId`, необов’язковий `sessionKey`, необов’язковий `limit` від `1` до `500` і необов’язковий рядок `cursor`.
  - Результат: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` вимагає `operator.read`.
  - Параметри: `{ "taskId": string }`.
  - Результат: `{ "task": TaskSummary }`.
  - Відсутні ідентифікатори завдань повертають форму помилки Gateway not-found.
- `tasks.cancel` вимагає `operator.write`.
  - Параметри: `{ "taskId": string, "reason"?: string }`.
  - Результат:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` повідомляє, чи журнал мав відповідне завдання. `cancelled` повідомляє, чи середовище виконання прийняло або записало скасування.

`TaskSummary` містить `id`, `status` і необов’язкові метадані, як-от `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, часові мітки, прогрес, термінальне зведення та очищений текст помилки. `agentId` визначає агента, який виконує завдання; `sessionKey` і `ownerKey` зберігають контекст запитувача та керування.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд runtime
  для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати робочу область агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлена основна `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають нативні назви з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash aliases, як-от `/model` і `/m`.
  - `nativeName` містить нативну назву команди з урахуванням провайдера, коли вона існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність нативних команд Plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів runtime для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний для runtime інвентар інструментів
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст runtime із сесії на серверному боці, а не приймає
    наданий викликачем контекст автентифікації чи доставки.
  - Відповідь є серверно виведеною проєкцією активного інвентарю в межах сесії,
    включно з core, Plugin, каналом і вже виявленими інструментами MCP-сервера.
  - `tools.effective` є лише для читання щодо MCP: він може проєктувати прогрітий MCP-каталог сесії через
    фінальну політику інструментів, але не створює MCP runtime-и, не підключає транспорти й не надсилає
    `tools/list`. Якщо відповідного прогрітого каталогу немає, відповідь може містити сповіщення, як-от
    `mcp-not-yet-connected`, `mcp-not-yet-listed` або `mcp-stale-catalog`.
  - Записи фактичних інструментів використовують `source="core"`, `source="plugin"`, `source="channel"` або
    `source="mcp"`.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов’язкові.
  - Якщо присутні і `sessionKey`, і `agentId`, розв’язаний агент сесії має відповідати
    `agentId`.
  - Core-обгортки лише для власника, як-от `cron`, `gateway` і `nodes`, потребують
    ідентичності власника/адміністратора (`operator.admin`), хоча сам метод
    `tools.invoke` має `operator.write`.
  - Відповідь є envelope для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими
    полями `error`. Відмови схвалення або політики повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill-ів для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати робочу область агента за замовчуванням.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.upload.begin`, `skills.upload.chunk` і
  `skills.upload.commit` (`operator.admin`), щоб підготувати приватний архів skill
  перед його встановленням. Це окремий адміністративний шлях завантаження для довірених клієнтів,
  а не звичайний потік встановлення skill із ClawHub, і за замовчуванням він вимкнений, якщо
  `skills.install.allowUploadedArchives` не ввімкнено.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    створює завантаження, прив’язане до цього slug і значення force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` додає байти за
    точним декодованим зміщенням.
  - `skills.upload.commit({ uploadId, sha256? })` перевіряє фінальний розмір і
    SHA-256. Commit лише фіналізує завантаження; він не встановлює skill.
  - Завантажені архіви skill є zip-архівами, що містять кореневий `SKILL.md`. Внутрішня
    назва директорії архіву ніколи не вибирає ціль встановлення.
- Оператори можуть викликати `skills.install` (`operator.admin`) у трьох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у директорію `skills/` робочої області агента за замовчуванням.
  - Режим завантаження: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    встановлює закомічене завантаження в директорію `skills/<slug>`
    робочої області агента за замовчуванням. Slug і значення force мають відповідати початковому
    запиту `skills.upload.begin`. Цей режим відхиляється, якщо
    `skills.install.allowUploadedArchives` не ввімкнено. Налаштування не
    впливає на встановлення з ClawHub.
  - Режим інсталятора Gateway: `{ name, installId, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
    Старіші клієнти все ще можуть надсилати `dangerouslyForceUnsafeInstall`; це поле
    застаріле, приймається лише для сумісності протоколу й ігнорується. Використовуйте
    `security.installPolicy` для рішень щодо встановлення, якими володіє оператор.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочій області агента за замовчуванням.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Опущено або `"default"`: поточна поведінка runtime. Якщо налаштовано `agents.defaults.models`, відповідь є дозволеним каталогом, включно з динамічно виявленими моделями для записів `provider/*`. Інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо налаштовано `agents.defaults.models`, він усе одно має пріоритет, включно з виявленням у межах провайдера для записів `provider/*`. Без allowlist відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker-ів моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора розв’язують це викликом `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, Gateway
  відхиляє запуск замість довіри до зміненого payload.

## Fallback доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли неможливо розв’язати зовнішній маршрут доставки (наприклад, внутрішні/webchat-сесії або неоднозначні багатоканальні конфігурації).
- Фінальні результати `agent` можуть містити `result.deliveryStatus`, коли доставку було
  запитано, з використанням тих самих статусів `sent`, `suppressed`, `partial_failed` і `failed`,
  які задокументовані для [`openclaw agent --json --deliver`](/uk/cli/agent#json-delivery-status).

## Версіонування

- `PROTOCOL_VERSION` міститься в `packages/gateway-protocol/src/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє діапазони, які
  не містять його поточного протоколу. Поточні клієнти й сервери потребують
  протокол v4.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення є
стабільними в межах протоколу v4 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                      | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити спарений бюджет server/client) |
| Початковий backoff перепідключення        | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff перепідключення      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp після закриття device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Grace force-stop перед `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Тайм-аут за замовчуванням `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | код `4000`, коли тиша перевищує `tickIntervalMs * 2`  | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує фактичні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не значень за замовчуванням до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентифікацією, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення через
  заголовки запиту замість `connect.params.auth.*`.
- Приватний вхід `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення
  зі спільним секретом; не відкривайте цей режим на публічному або недовіреному вході.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю підключення
  + scopes. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір scopes для цього токена. Це зберігає доступ до читання/перевірки/статусу,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  вужчого неявного scope лише адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди передається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Вбудоване bootstrap-завантаження через код налаштування повертає основний токен вузла
  `hello-ok.auth.deviceToken` плюс обмежений операторський токен у
  `hello-ok.auth.deviceTokens` для довіреної передачі на мобільний пристрій. Операторський токен
  включає `operator.talk.secrets` для читання нативної конфігурації Talk, але
  виключає scopes мутації спарювання та `operator.admin`.
- Поки небазове bootstrap-завантаження через код налаштування очікує затвердження, деталі `PAIRING_REQUIRED`
  містять `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  і `pauseReconnect: false`. Клієнти мають продовжувати повторні підключення з тим самим
  bootstrap-токеном, доки запит не буде затверджено або токен не стане недійсним.
- Зберігайте `hello-ok.auth.deviceTokens` лише тоді, коли підключення використовувало bootstrap-автентифікацію
  на довіреному транспорті, як-от `wss://` або loopback/локальне спарювання.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes лише
  повторно використовуються, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`). Ротація або
  відкликання вузла чи іншої неоператорської ролі також потребує `operator.admin`.
- `device.token.rotate` повертає метадані ротації. Він повторює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Спільні/адміністративні ротації не повторюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі спарювання цього пристрою; мутація токена не може розширити або
  націлити роль пристрою, яку затвердження спарювання ніколи не надавало.
- Для сесій токенів спарених пристроїв керування пристроями є самообмеженим, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть керувати лише
  операторським токеном для запису **власного** пристрою. Керування токенами вузла та іншими
  неоператорськими токенами доступне лише адміністратору, навіть для власного пристрою викликача.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scopes цільового операторського
  токена щодо поточних scopes сесії викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший операторський токен, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати оператору вказівки щодо дії.
- `AUTH_SCOPE_MISMATCH` означає, що токен пристрою було розпізнано, але він не покриває
  запитані роль/scopes. Клієнти не мають подавати це як поганий токен;
  запропонуйте оператору повторно спарити або затвердити вужчий/ширший контракт scopes.

## Ідентичність пристрою + спарювання

- Вузли мають включати стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка keypair.
- Gateway видають токени для кожного пристрою + ролі.
- Затвердження спарювання потрібні для нових ідентифікаторів пристроїв, якщо не ввімкнено
  локальне автоматичне затвердження.
- Автоматичне затвердження спарювання зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для спарювання та
  потребують затвердження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (оператор +
  вузол). Єдині винятки для операторів без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності небезпечного HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback backend RPC `gateway-client` на зарезервованому внутрішньому
    допоміжному шляху.
- Пропуск ідентичності пристрою має наслідки для scopes. Коли підключення оператора без пристрою
  дозволяється через явний довірений шлях, OpenClaw усе одно очищає
  самозаявлені scopes до порожнього набору, якщо цей шлях не має іменованого
  винятку збереження scopes. Методи, обмежені scopes, тоді завершуються помилкою
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` — це аварійний шлях збереження scopes
  для Control UI. Він не надає scopes довільним
  власним backend- або CLI-подібним WebSocket-клієнтам.
- Зарезервований прямий loopback допоміжний backend-шлях `gateway-client` зберігає
  scopes лише для внутрішніх локальних control-plane RPC; власні backend ID не
  отримують цього винятку.
- Усі підключення мають підписувати наданий сервером одноразовий номер `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожній). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілий/неправильний nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає v2 payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного відхилення. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалися. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте v2 payload, який містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів пристрою/клієнта/ролі/scopes/токена/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол відкриває **повний API Gateway** (статус, канали, моделі, чат,
агент, сесії, вузли, затвердження тощо). Точну поверхню визначають
схеми TypeBox у `packages/gateway-protocol/src/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
