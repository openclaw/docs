---
read_when:
    - Реалізація або оновлення клієнтів WS Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схем/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, керування версіями'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-07-03T09:58:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми й повільні вихідні буфери генерують події `payload.large`
  до того, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, обмеження, поверхні й безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло фрейму, токени, cookie або секретні
  значення.

## Рукостискання (connect)

Gateway → Клієнт (попередній виклик до підключення):

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

Поки Gateway ще завершує запуск допоміжних компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, установленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити таку відповідь
у межах свого загального бюджету підключення, а не показувати її як остаточний
збій рукостискання.

`server`, `features`, `snapshot` і `policy` усі обов’язкові за схемою
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджену роль/області дії. `pluginSurfaceUrls` необов’язковий і зіставляє назви
поверхонь Plugin, наприклад `canvas`, зі scoped розміщеними URL.

Scoped URL поверхонь Plugin можуть завершуватися. Вузли можуть викликати
`node.pluginSurface.refresh` з `{ "surface": "canvas" }`, щоб отримати свіжий
запис у `pluginSurfaceUrls`. Експериментальний рефакторинг Plugin Canvas не
підтримує застарілий шлях сумісності `canvasHostUrl`, `canvasCapability` або
`node.canvas.capability.refresh`; поточні нативні клієнти й gateway мають
використовувати поверхні Plugin.

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
`client.mode: "backend"`) можуть опускати `device` на прямих loopback-з’єднаннях, коли
автентифікуються спільним токеном/паролем gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й не дає застарілим базовим лініям
зв’язування CLI/пристрою блокувати локальну backend-роботу, як-от оновлення
сесій субагентів. Віддалені клієнти, клієнти browser-origin, клієнти-вузли й
явні клієнти токена пристрою/ідентичності пристрою й надалі використовують
звичайні перевірки зв’язування та підвищення області дії.

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

Вбудований bootstrap через QR/код налаштування є свіжим шляхом передавання на
мобільний пристрій. Успішне підключення базового коду налаштування повертає
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

Передавання оператору навмисно обмежене, щоб QR-онбординг міг запустити
мобільний операторський цикл без надання `operator.admin` або `operator.pairing`.
Воно містить `operator.talk.secrets`, щоб нативний клієнт міг прочитати
конфігурацію Talk, потрібну після bootstrap. Ширші admin-області й області
зв’язування потребують окремого затвердженого зв’язування оператора або потоку
токена. Клієнти мають зберігати `hello-ok.auth.deviceTokens` лише
коли connect використовував bootstrap-автентифікацію на довіреному транспорті, як-от `wss://` або
loopback/локальне зв’язування.

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

## Ролі + області дії

Повну модель областей дії оператора, перевірки під час затвердження й семантику
спільного секрету див. у [Області дії оператора](/uk/gateway/operator-scopes).

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
Коли секрети включено, клієнти мають читати активні облікові дані провайдера Talk
з `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
залишається у формі джерела й може бути об’єктом SecretRef або заредагованим рядком.

Зареєстровані Plugin методи gateway RPC можуть запитувати власну область дії оператора, але
зарезервовані основні admin-префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди вирішуються в `operator.admin`.

Область дії методу є лише першим бар’єром. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки рівня команди додатково. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час затвердження поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей, як-от `camera`, `canvas`, `screen`,
  `location`, `voice` і `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заяви** й застосовує server-side allowlist.

## Presence

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи Presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` із причиною `connect`; зв’язані вузли також можуть повідомляти
  стійку фонову Presence, коли довірена подія вузла оновлює їхні метадані зв’язування.

### Фонова подія активності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що зв’язаний вузол був
активний під час фонового пробудження, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є стійкою лише для автентифікованих сесій
пристроїв-вузлів; сесії без пристрою або без зв’язування повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway можуть усе ще повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як стійке збереження Presence.

## Обмеження областей дії broadcast-подій

Надіслані сервером broadcast-події WebSocket обмежуються областями дії, щоб сесії зі scoped зв’язуванням або лише вузлові сесії не отримували пасивно вміст сесії.

- **Фрейми чату, агента й результатів інструментів** (зокрема streamed події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб справність транспорту була видима кожній автентифікованій сесії.
- **Невідомі родини broadcast-подій** за замовчуванням обмежуються областю дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний поклієнтський порядковий номер, тому broadcasts зберігають монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні scope-filtered підмножини потоку подій.

## Поширені родини RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком discovery, побудованим з `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/каналу. Трактуйте його як feature discovery, а не як повний
перелік `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, необроблені тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область доступу читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для операторських клієнтів з областю доступу адміністратора.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, що використовується в потоках ретрансляції та сполучення.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв оператора/Node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання постачальників / зведення залишкових квот.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
      Передайте `agentId` для одного агента або `agentScope: "all"` для агрегування налаштованих агентів.
    - `doctor.memory.status` повертає готовність vector-memory / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче live-перевірку постачальника embedding. Клієнти, обізнані про Dreaming, також можуть передавати `{ "agentId": "agent-id" }`, щоб обмежити статистику сховища Dreaming вибраним робочим простором агента; пропуск `agentId` зберігає fallback до агента за замовчуванням і агрегує налаштовані робочі простори Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` і `doctor.memory.dedupeDreamDiary` приймають необов’язкові параметри `{ "agentId": "agent-id" }` для подань/дій Dreaming вибраного агента. Коли `agentId` пропущено, вони працюють із налаштованим робочим простором агента за замовчуванням.
    - `doctor.memory.remHarness` повертає обмежений попередній перегляд REM harness лише для читання для віддалених клієнтів control-plane. Він може включати шляхи робочого простору, фрагменти пам’яті, відрендерений grounded markdown і кандидатів на deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сесіями. Передайте `agentId` для одного
      агента або `agentScope: "all"` для спільного списку налаштованих агентів.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає вбудовані + bundled зведення стану каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, де канал підтримує вихід.
    - `web.login.start` запускає потік входу QR/web для поточного постачальника web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу QR/web і запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/thread поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу Gateway з керуванням cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.catalog` повертає каталог постачальників Talk лише для читання для мовлення, потокової транскрипції та голосу в реальному часі. Він включає канонічні ідентифікатори постачальників, registry aliases, labels, налаштований стан, необов’язковий результат `ready` на рівні групи, відкриті ідентифікатори моделей/голосів, канонічні режими, транспорти, brain strategies і прапорці realtime audio/capability без повернення секретів постачальника чи зміни глобальної конфігурації. Поточні Gateway встановлюють `ready` після застосування вибору постачальника під час виконання; клієнти мають вважати його відсутність неперевіреною для сумісності зі старішими Gateway.
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.session.create` створює сесію Talk, якою володіє Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` або `stt-tts/managed-room`. Для `stt-tts/managed-room` викликачі `operator.write`, які передають `sessionKey`, також мають передати `spawnedBy` для видимості scoped session-key; створення `sessionKey` без scope і `brain: "direct-tools"` потребують `operator.admin`.
    - `talk.session.join` перевіряє токен сесії managed-room, за потреби випускає події `session.ready` або `session.replaced` і повертає метадані кімнати/сесії плюс нещодавні події Talk без plaintext-токена або збереженого hash токена.
    - `talk.session.appendAudio` додає base64 PCM input audio до сесій realtime relay і transcription, якими володіє Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` і `talk.session.cancelTurn` керують життєвим циклом turn у managed-room з відхиленням stale-turn до очищення стану.
    - `talk.session.cancelOutput` зупиняє аудіовихід асистента, переважно для barge-in, gated через VAD, у сесіях Gateway relay.
    - `talk.session.submitToolResult` завершує виклик інструмента постачальника, випущений сесією realtime relay, якою володіє Gateway. Передайте `options: { willContinue: true }` для проміжного виводу інструмента, коли фінальний результат буде пізніше, або `options: { suppressResponse: true }`, коли результат інструмента має задовольнити виклик постачальника без запуску ще однієї realtime-відповіді асистента.
    - `talk.session.steer` надсилає голосове керування active-run у backed-by-agent сесію Talk, якою володіє Gateway. Приймає `{ sessionId, text, mode? }`, де `mode` — це `status`, `steer`, `cancel` або `followup`; пропущений режим класифікується зі spoken text.
    - `talk.session.close` закриває сесію relay, transcription або managed-room, якою володіє Gateway, і випускає термінальні події Talk.
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.client.create` створює realtime-сесію постачальника, якою володіє клієнт, використовуючи `webrtc` або `provider-websocket`, тоді як Gateway володіє конфігурацією, обліковими даними, інструкціями та політикою інструментів.
    - `talk.client.toolCall` дає змогу realtime-транспортам, якими володіє клієнт, пересилати виклики інструментів постачальника до політики Gateway. Перший підтримуваний інструмент — `openclaw_agent_consult`; клієнти отримують run id і очікують звичайних подій життєвого циклу чату перед надсиланням provider-specific результату інструмента.
    - `talk.client.steer` надсилає голосове керування active-run для realtime-транспортів, якими володіє клієнт. Gateway визначає активний embedded run із `sessionKey` і повертає структурований результат accepted/rejected замість мовчазного відкидання steering.
    - `talk.event` — єдиний канал подій Talk для realtime, transcription, STT/TTS, managed-room, telephony і meeting adapters.
    - `talk.speak` синтезує мовлення через активного постачальника мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного постачальника, fallback-постачальників і стан конфігурації постачальника.
    - `tts.providers` повертає видимий інвентар постачальників TTS.
    - `tts.enable` і `tts.disable` перемикають стан prefs TTS.
    - `tts.setProvider` оновлює бажаного постачальника TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів, націлені на команду, для конкретного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації. Деструктивна заміна масиву
      потребує відповідного шляху в `replacePaths`; вкладені масиви
      під записами масиву використовують шляхи `[]`, як-от `agents.list[].skills`.
    - `config.apply` перевіряє + замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає live-корисне навантаження схеми конфігурації, яке використовується Control UI та інструментами CLI: schema, `uiHints`, version і generation metadata, включно з plugin + channel schema metadata, коли runtime може їх завантажити. Схема включає метадані полів `title` / `description`, похідні від тих самих labels і help text, що використовуються UI, включно з гілками композиції nested object, wildcard, array-item і `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає path-scoped корисне навантаження lookup для одного шляху конфігурації: нормалізований path, shallow schema node, matched hint + `hintPath`, необов’язковий `reloadKind` і immediate child summaries для UI/CLI drill-down. `reloadKind` — одне з `restart`, `hot` або `none` і віддзеркалює planner перезавантаження конфігурації Gateway для запитаного шляху. Lookup schema nodes зберігають user-facing docs і common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child summaries відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, необов’язковий `reloadKind`, плюс matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує restart лише тоді, коли саме оновлення було успішним; викликачі із сесією можуть включити `continuationMessage`, щоб запуск продовжив один follow-up agent turn через restart continuation queue. Оновлення package-manager і supervised git-checkout updates із control plane використовують відокремлений managed-service handoff замість заміни package tree або зміни checkout/build output усередині live Gateway. Запущений handoff повертає `ok: true` з `result.reason: "managed-service-handoff-started"` і `handoff.status: "started"`; недоступні або невдалі handoffs повертають `ok: false` з `managed-service-handoff-unavailable` або `managed-service-handoff-failed`, плюс `handoff.command`, коли потрібне ручне оновлення shell. Недоступний handoff означає, що OpenClaw не має безпечної supervisor boundary або durable service identity, як-от `OPENCLAW_SYSTEMD_UNIT` для systemd. Під час запущеного handoff restart sentinel може коротко повідомляти `stats.reason: "restart-health-pending"`; continuation відкладається, доки CLI не перевірить перезапущений Gateway і не запише фінальний sentinel `ok`.
    - `update.status` оновлює та повертає останній update restart sentinel, включно з running version після restart, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента й робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і метадані середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують початковими файлами робочого простору, доступними для агента.
    - `tasks.list`, `tasks.get` і `tasks.cancel` надають клієнтам SDK і операторам доступ до журналу завдань Gateway.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають підсумки артефактів, отриманих із транскриптів, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити до запусків і завдань визначають належну сесію на стороні сервера й повертають лише медіа транскрипту з відповідним походженням; небезпечні або локальні джерела URL повертають непідтримувані завантаження замість отримання на стороні сервера.
    - `environments.list` і `environments.status` надають клієнтам SDK доступ лише для читання до локального для Gateway і вузлового виявлення середовища.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, зокрема метадані `agentRuntime` для кожного рядка, коли налаштовано бекенд середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події зміни сесій для поточного клієнта WS.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для конкретних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є варіантом переривання й скеровування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов’язковий `runId` або передати лише `runId` для активних запусків, які Gateway може зіставити із сесією.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розв’язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтами UI: вбудовані теги директив вилучаються з видимого тексту, текстові XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витеклі ASCII/повноширинні керувальні токени моделі вилучаються, рядки асистента лише з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надмірно великі рядки можуть замінюватися заповнювачами.
    - `chat.message.get` — це адитивний обмежений читач повного повідомлення для одного видимого запису транскрипту. Клієнти передають `sessionKey`, необов’язковий `agentId`, коли вибір сесії прив’язаний до агента, плюс `messageId` транскрипту, раніше показаний через `chat.history`, а Gateway повертає ту саму нормалізовану для відображення проєкцію без легкого обмеження обрізання історії, якщо збережений запис усе ще доступний і не є надмірно великим.
    - `chat.send` приймає одноразовий `fastMode: "auto"`, щоб використовувати швидкий режим для викликів моделі, розпочатих до автоматичної межі, а потім запускати пізніші повторні спроби, fallback, результати інструментів або продовжувальні виклики без швидкого режиму. Межа за замовчуванням становить 60 секунд і може налаштовуватися для кожної моделі через `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Викликач `chat.send` може передати одноразовий `fastAutoOnSeconds`, щоб перевизначити межу для цього запиту.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротирує токен сполученого пристрою в межах його схваленої ролі й області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі й області викликача.

  </Accordion>

  <Accordion title="Сполучення Node, виклик і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення Node і перевірку початкового налаштування.
    - `node.list` і `node.describe` повертають стан відомих/підключених Node.
    - `node.rename` оновлює мітку сполученого Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту виклику.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують довготривалою очікуваною роботою для offline/відключених Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec плюс пошук/повтор очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec у gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою схвалення exec через команди ретрансляції Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або на наступний Heartbeat введення тексту пробудження; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - `cron.run` залишається RPC у стилі додавання до черги для ручних запусків. Клієнти, яким потрібна семантика завершення, мають прочитати повернений `runId` і опитувати `cron.runs`.
    - `cron.runs` приймає необов’язковий непорожній фільтр `runId`, щоб клієнти могли стежити за одним поставленим у чергу ручним запуском без перегонів з іншими записами історії для того самого завдання.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject`, та інші події чату лише для транскрипту. У протоколі v4 delta-навантаження містять `deltaText`; `message` залишається накопиченим знімком асистента. Заміни не-префіксів установлюють `replace=true` і використовують `deltaText` як текст заміни.
- `session.message`, `session.operation` і `session.tool`: оновлення транскрипту, операції сесії в процесі виконання та потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка справності gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення Node.
- `node.invoke.request`: широкомовний запит виклику Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригера за словом пробудження змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення Plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок автоматичного дозволу.

### RPC журналу завдань

Клієнти-оператори можуть переглядати й скасовувати фонові записи завдань Gateway через RPC журналу завдань. Ці методи повертають санітизовані підсумки завдань, а не сирий стан середовища виконання.

- `tasks.list` потребує `operator.read`.
  - Параметри: необов’язковий `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` або `"timed_out"`) або масив цих статусів, необов’язковий `agentId`, необов’язковий `sessionKey`, необов’язковий `limit` від `1` до `500` і необов’язковий рядок `cursor`.
  - Результат: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` потребує `operator.read`.
  - Параметри: `{ "taskId": string }`.
  - Результат: `{ "task": TaskSummary }`.
  - Відсутні ідентифікатори завдань повертають форму помилки Gateway not-found.
- `tasks.cancel` потребує `operator.write`.
  - Параметри: `{ "taskId": string, "reason"?: string }`.
  - Результат:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` повідомляє, чи журнал мав відповідне завдання. `cancelled` повідомляє, чи середовище виконання прийняло або записало скасування.

`TaskSummary` містить `id`, `status` і необов’язкові метадані, як-от `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, часові позначки, прогрес, термінальний підсумок і санітизований текст помилки. `agentId` ідентифікує агента, який виконує завдання; `sessionKey` і `ownerKey` зберігають контекст запитувача й керування.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов'язковий; опустіть його, щоб читати типовий робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають provider-aware нативні назви,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware нативну назву команди, коли вона існує.
  - `provider` необов'язковий і впливає лише на нативне іменування та доступність
    нативних команд plugin.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime каталог інструментів для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов'язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів
  для сесії.
  - `sessionKey` обов'язковий.
  - Gateway отримує довірений runtime контекст із сесії на серверному боці замість приймання
    наданого викликачем контексту автентифікації або доставки.
  - Відповідь є прив'язаною до сесії, отриманою сервером проєкцією активного інвентарю,
    включно з core, plugin, каналом і вже виявленими інструментами MCP-сервера.
  - `tools.effective` є read-only для MCP: він може провести теплий MCP-каталог сесії через
    фінальну політику інструментів, але не створює MCP runtime, не підключає транспорти й не видає
    `tools/list`. Якщо відповідного теплого каталогу немає, відповідь може містити повідомлення, як-от
    `mcp-not-yet-connected`, `mcp-not-yet-listed` або `mcp-stale-catalog`.
  - Елементи ефективних інструментів використовують `source="core"`, `source="plugin"`, `source="channel"` або
    `source="mcp"`.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов'язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов'язкові.
  - Якщо присутні і `sessionKey`, і `agentId`, розв'язаний агент сесії має збігатися з
    `agentId`.
  - Core-обгортки лише для власника, як-от `cron`, `gateway` і `nodes`, потребують
    ідентичності owner/admin (`operator.admin`), хоча сам метод `tools.invoke`
    є `operator.write`.
  - Відповідь є орієнтованим на SDK конвертом з `ok`, `toolName`, необов'язковим `output` і типізованими
    полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` необов'язковий; опустіть його, щоб читати типовий робочий простір агента.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані варіанти встановлення без розкриття сирих значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих пошуку ClawHub.
- Оператори можуть викликати `skills.upload.begin`, `skills.upload.chunk` і
  `skills.upload.commit` (`operator.admin`), щоб підготувати приватний архів skill
  перед встановленням. Це окремий адміністративний шлях завантаження для довірених клієнтів,
  а не звичайний потік встановлення skill з ClawHub, і він типово вимкнений, якщо
  `skills.install.allowUploadedArchives` не ввімкнено.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    створює завантаження, прив'язане до цього slug і значення force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` додає байти за
    точним декодованим зміщенням.
  - `skills.upload.commit({ uploadId, sha256? })` перевіряє фінальний розмір і
    SHA-256. Commit лише завершує завантаження; він не встановлює skill.
  - Завантажені архіви skill є zip-архівами, що містять кореневий `SKILL.md`.
    Внутрішня назва каталогу архіву ніколи не вибирає ціль встановлення.
- Оператори можуть викликати `skills.install` (`operator.admin`) у трьох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у каталог `skills/` типового робочого простору агента.
  - Режим завантаження: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    встановлює зафіксоване завантаження в каталог `skills/<slug>`
    типового робочого простору агента. Slug і значення force мають збігатися з початковим
    запитом `skills.upload.begin`. Цей режим відхиляється, якщо
    `skills.install.allowUploadedArchives` не ввімкнено. Налаштування не
    впливає на встановлення з ClawHub.
  - Режим інсталятора Gateway: `{ name, installId, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
    Старіші клієнти все ще можуть надсилати `dangerouslyForceUnsafeInstall`; це поле
    застаріле, приймається лише для сумісності протоколу й ігнорується. Використовуйте
    `security.installPolicy` для рішень щодо встановлення, якими володіє оператор.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    типовому робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Представлення `models.list`

`models.list` приймає необов'язковий параметр `view`:

- Опущено або `"default"`: поточна поведінка runtime. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом, включно з динамічно виявленими моделями для записів `provider/*`. Інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, вона все одно має пріоритет, включно з provider-scoped виявленням для записів `provider/*`. Без allowlist відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики й інтерфейсів пошуку, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора розв'язують це, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою і фінальним схваленим пересиланням `system.run`, Gateway
  відхиляє запуск замість довіри до зміненого payload.

## Резервний варіант доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв'язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сесії, коли жоден зовнішній доставний маршрут не може бути розв'язаний (наприклад, внутрішні/webchat сесії або неоднозначні багатоканальні конфігурації).
- Фінальні результати `agent` можуть містити `result.deliveryStatus`, коли було
  запитано доставку, використовуючи ті самі статуси `sent`, `suppressed`, `partial_failed` і `failed`,
  що задокументовані для [`openclaw agent --json --deliver`](/uk/cli/agent#json-delivery-status).

## Версіонування

- `PROTOCOL_VERSION` розташований у `packages/gateway-protocol/src/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє діапазони, які
  не містять його поточний протокол. Поточні клієнти й сервери потребують
  протокол v4.
- Схеми й моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в межах протоколу v4 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет server/client) |
| Початкова затримка повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальна затримка повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Період grace для force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації підключення з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію
  підключення зі спільним секретом; не відкривайте цей режим на публічному/ненадійному вході.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю
  підключення + областями доступу. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений затверджений набір областей доступу для цього токена. Це зберігає доступ
  читання/перевірки/статусу, який уже було надано, і запобігає непомітному звуженню
  повторних підключень до неявної області доступу лише для адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, якщо встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спершу явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не
    визначив `auth.token`. Спільний токен або будь-який визначений токен пристрою
    пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Вбудоване bootstrap налаштування за кодом повертає для основного вузла
  `hello-ok.auth.deviceToken` плюс обмежений токен оператора в
  `hello-ok.auth.deviceTokens` для довіреної передачі на мобільний пристрій. Токен оператора
  містить `operator.talk.secrets` для читання нативної конфігурації Talk і
  не містить `operator.admin` та `operator.pairing`.
- Поки bootstrap за не-базовим кодом налаштування очікує на затвердження, деталі `PAIRING_REQUIRED`
  містять `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  і `pauseReconnect: false`. Клієнти мають продовжувати повторне підключення з тим самим
  bootstrap-токеном, доки запит не буде затверджено або токен не стане недійсним.
- Зберігайте `hello-ok.auth.deviceTokens` лише тоді, коли підключення використовувало bootstrap-автентифікацію
  через довірений транспорт, як-от `wss://` або loopback/локальне спарювання.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей доступу залишається авторитетним; кешовані області доступу
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область доступу `operator.pairing`). Ротація або
  відкликання вузла чи іншої не-операторської ролі також потребує `operator.admin`.
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Ротації зі спільним/адміністративним доступом не віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі спарювання цього пристрою; мутація токена не може розширити або
  націлитися на роль пристрою, яку затвердження спарювання ніколи не надавало.
- Для сесій токенів спарених пристроїв керування пристроями є самообмеженим, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть керувати лише
  токеном оператора для запису **власного** пристрою. Керування токенами вузла
  та інших не-операторських ролей доступне лише адміністратору, навіть для власного пристрою викликача.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей доступу цільового
  токена оператора відносно поточних областей доступу сесії викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (булеве значення)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба завершується невдало, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дії.
- `AUTH_SCOPE_MISMATCH` означає, що токен пристрою було розпізнано, але він не покриває
  запитані роль/області доступу. Клієнти не мають подавати це як поганий токен;
  запропонуйте оператору повторно спарити або затвердити вужчий/ширший контракт областей доступу.

## Ідентичність пристрою + спарювання

- Вузли мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateway видають токени на пристрій + роль.
- Затвердження спарювання потрібні для нових ID пристроїв, якщо локальне автоматичне затвердження
  не ввімкнене.
- Автоматичне затвердження спарювання зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для спарювання та
  потребують затвердження.
- WS-клієнти зазвичай містять ідентичність `device` під час `connect` (оператор +
  вузол). Єдині винятки для оператора без пристрою — явні шляхи довіри:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності небезпечного HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - backend RPC прямого-loopback `gateway-client` на зарезервованому внутрішньому
    допоміжному шляху.
- Пропуск ідентичності пристрою має наслідки для областей доступу. Коли операторське
  підключення без пристрою дозволене через явний шлях довіри, OpenClaw усе одно очищає
  самостійно оголошені області доступу до порожнього набору, якщо цей шлях не має іменованого
  винятку зі збереженням областей доступу. Методи, обмежені областями доступу, тоді завершуються помилкою
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` — це шлях break-glass зі збереженням областей доступу для Control UI.
  Він не надає області доступу довільним
  кастомним backend або CLI-подібним WebSocket-клієнтам.
- Зарезервований допоміжний шлях backend прямого-loopback `gateway-client` зберігає
  області доступу лише для внутрішніх локальних RPC control-plane; кастомні backend ID не
  отримують цього винятку.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписання до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав зі застарілим/неправильним nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу поза дозволеним відхиленням.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалася. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який містить nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додаток до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але прив’язування
  метаданих спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область доступу

Цей протокол відкриває **повний API Gateway** (статус, канали, моделі, чат,
агент, сесії, вузли, затвердження тощо). Точна поверхня визначена
схемами TypeBox у `packages/gateway-protocol/src/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
