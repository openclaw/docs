---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Діагностика невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-11T20:39:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS-протокол є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свої **роль** + **область дії** під час
handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери генерують події `payload.large`
  перед тим, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
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
повернути придатну для повтору помилку `UNAVAILABLE`, де `details.reason` має значення
`"startup-sidecars"` і вказано `retryAfterMs`. Клієнти мають повторювати таку відповідь
у межах загального бюджету підключення, а не показувати її як остаточний
збій handshake.

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
узгоджену роль/області дії. `pluginSurfaceUrls` є необов’язковим і зіставляє назви
поверхонь plugin, як-от `canvas`, з обмеженими за областю дії hosted URL.

Обмежені за областю дії URL поверхонь plugin можуть завершуватися. Вузли можуть викликати
`node.pluginSurface.refresh` з `{ "surface": "canvas" }`, щоб отримати свіжий
запис у `pluginSurfaceUrls`. Експериментальний рефакторинг Canvas plugin не
підтримує застарілий шлях сумісності `canvasHostUrl`, `canvasCapability` або
`node.canvas.capability.refresh`; поточні нативні клієнти та gateway мають використовувати поверхні plugin.

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
`client.mode: "backend"`) можуть не вказувати `device` у прямих loopback-підключеннях, коли
автентифікуються зі спільним gateway-токеном/паролем. Цей шлях зарезервований
для внутрішніх RPC площини керування і не дає застарілим базовим станам прив’язки CLI/пристрою
блокувати локальну backend-роботу, наприклад оновлення сесій subagent. Віддалені клієнти,
клієнти з browser-origin, клієнти вузлів і явні клієнти з device-token/device-identity
надалі використовують звичайні перевірки прив’язки та підвищення області дії.

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
bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей дії bootstrap лишаються
роль-префіксними: записи оператора задовольняють лише запити оператора, а ролі, що не є операторами,
надалі потребують областей дії під власним префіксом ролі.

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

## Фреймінг

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

Повну модель областей дії оператора, перевірки під час схвалення та семантику спільних секретів
див. у [Області дії оператора](/uk/gateway/operator-scopes).

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

Зареєстровані plugin методи Gateway RPC можуть запитувати власну область дії оператора, але
зарезервовані префікси адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зводяться до `operator.admin`.

Область дії методу є лише першим шлюзом. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команд поверх цього. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з non-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня, як-от `camera`, `canvas`, `screen`,
  `location`, `voice` і `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заявки** і забезпечує серверні allowlist.

## Присутність

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; прив’язані вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані прив’язки.

### Фонова подія активності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб зафіксувати, що прив’язаний вузол був
активний під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є тривалою лише для автентифікованих сесій пристроїв вузлів;
сесії без пристрою або без прив’язки повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway можуть досі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження областей дії broadcast-подій

Broadcast-події WebSocket, які надсилає сервер, обмежуються областями дії, щоб сесії з областю дії прив’язки або лише вузлові сесії не отримували пасивно вміст сесій.

- **Фрейми чату, агента та результатів інструментів** (включно зі streamed подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені plugin broadcast `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються без обмежень, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі сімейства broadcast-подій** типово обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для кожного клієнта, тож broadcast зберігають монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями дії.

## Поширені сімейства RPC-методів

Публічна WS-поверхня ширша за наведені вище приклади handshake/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів plugin/channel. Трактуйте його як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черг/сесій, назви channel/plugin і ids сесій. Він не зберігає текст чату, тіла webhook, виходи інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібна область дії читання оператора.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яку використовують потоки relay і pairing.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію і може оновлювати/broadcast контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений під час виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера та зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих вбудовувань для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче живий ping провайдера вбудовувань.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів площини керування. Він може містити шляхи робочого простору, фрагменти пам’яті, відрендерений обґрунтований markdown і кандидатів на глибоке просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сеансами.
    - `sessions.usage.timeseries` повертає часові ряди використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і bundled каналів/плагінів.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного web-провайдера каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web-потоку входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований tail файлового журналу Gateway з елементами керування курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.catalog` повертає доступний лише для читання каталог провайдерів Talk для мовлення, потокової транскрипції та голосу в реальному часі. Він містить ідентифікатори провайдерів, мітки, налаштований стан, відкриті ідентифікатори моделей/голосів, канонічні режими, транспорти, стратегії мозку та прапорці аудіо/можливостей у реальному часі, не повертаючи секрети провайдерів і не змінюючи глобальну конфігурацію.
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.session.create` створює сеанс Talk, яким володіє Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` або `stt-tts/managed-room`. `brain: "direct-tools"` потребує `operator.admin`.
    - `talk.session.join` перевіряє токен сеансу managed-room, за потреби надсилає події `session.ready` або `session.replaced` і повертає метадані кімнати/сеансу разом з останніми подіями Talk без відкритого тексту токена або збереженого хеша токена.
    - `talk.session.appendAudio` додає вхідний base64 PCM-аудіо до relay і транскрипційних сеансів у реальному часі, якими володіє Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` і `talk.session.cancelTurn` керують життєвим циклом ходу managed-room з відхиленням застарілого ходу до очищення стану.
    - `talk.session.cancelOutput` зупиняє аудіовихід асистента, переважно для VAD-керованого втручання в relay-сеансах Gateway.
    - `talk.session.submitToolResult` завершує виклик інструмента провайдера, згенерований relay-сеансом у реальному часі, яким володіє Gateway. Передайте `options: { willContinue: true }` для проміжного виводу інструмента, коли за ним буде фінальний результат, або `options: { suppressResponse: true }`, коли результат інструмента має задовольнити виклик провайдера без запуску ще однієї відповіді асистента в реальному часі.
    - `talk.session.close` закриває relay-, транскрипційний або managed-room сеанс, яким володіє Gateway, і надсилає кінцеві події Talk.
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.client.create` створює клієнтський сеанс провайдера реального часу з використанням `webrtc` або `provider-websocket`, тоді як Gateway володіє конфігурацією, обліковими даними, інструкціями та політикою інструментів.
    - `talk.client.toolCall` дає змогу клієнтським транспортам реального часу пересилати виклики інструментів провайдера до політики Gateway. Перший підтримуваний інструмент — `openclaw_agent_consult`; клієнти отримують run id і очікують звичайних подій життєвого циклу чату перед поданням результату інструмента, специфічного для провайдера.
    - `talk.event` — це єдиний канал подій Talk для адаптерів реального часу, транскрипції, STT/TTS, managed-room, телефонії та зустрічей.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів, націлені на команду, для конкретного набору команди/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає live корисне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: schema, `uiHints`, version і generation metadata, включно з метаданими схем Plugin і каналів, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, що використовуються UI, включно з вкладеними об’єктами, wildcard, елементами масиву та гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і короткі зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають документацію для користувача та поширені поля перевірки (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі чисел/рядків/масивів/об’єктів і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення успішне; викликачі із сеансом можуть додати `continuationMessage`, щоб під час запуску відновився один наступний хід агента через чергу продовження після перезапуску. Оновлення package-manager примусово виконують невідкладений перезапуск після оновлення без cooldown після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований restart sentinel оновлення, включно з версією, що працює після перезапуску, якщо вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та метаданими runtime.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і зв’язуванням робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `tasks.list`, `tasks.get` і `tasks.cancel` відкривають ledger завдань Gateway для SDK та клієнтів-операторів.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають похідні від transcript зведення артефактів і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розв’язують сеанс-власник на боці сервера та повертають лише transcript media з відповідним provenance; небезпечні або локальні URL-джерела повертають непідтримувані завантаження замість fetching на боці сервера.
    - `environments.list` і `environments.status` відкривають доступне лише для читання виявлення локальних для Gateway і вузлових середовищ для клієнтів SDK.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
    - `agent.wait` очікує завершення run і повертає кінцевий snapshot, коли він доступний.

  </Accordion>

  <Accordion title="Керування сеансами">
    - `sessions.list` повертає поточний індекс сеансів, включно з метаданими `agentRuntime` для кожного рядка, коли налаштовано backend runtime агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сеансів для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сеансів.
    - `sessions.describe` повертає один рядок сеансу Gateway для точного ключа сеансу.
    - `sessions.resolve` розв’язує або канонікалізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` — це варіант переривання та скеровування для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу. Викликач може передати `key` плюс необов’язковий `runId` або передати лише `runId` для активних runs, які Gateway може розв’язати до сеансу.
    - `sessions.patch` оновлює метадані/перевизначення сеансу та повідомляє розв’язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансу.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтам UI: inline directive tags вилучаються з видимого тексту, plain-text XML payloads викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) і leaked ASCII/full-width model control tokens вилучаються, суто silent-token рядки асистента, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Парування пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені paired devices.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами device-pairing.
    - `device.token.rotate` ротує токен paired device в межах його схваленої ролі та області викликача.
    - `device.token.revoke` відкликає токен paired device в межах його схваленої ролі та області викликача.

  </Accordion>

  <Accordion title="Парування вузлів, invoke і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють парування вузлів і перевірку bootstrap.
    - `node.list` і `node.describe` повертають відомий/підключений стан вузла.
    - `node.rename` оновлює мітку paired node.
    - `node.invoke` пересилає команду до підключеного вузла.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою pending work для offline/disconnected вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення виконання, а також пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення виконання й повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення виконання gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення виконання через команди ретрансляції вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне під час heartbeat додавання тексту пробудження; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject` та інші події чату
  лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  підписаного сеансу.
- `sessions.changed`: індекс сеансів або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни виконання/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: широкомовний запит виклику вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригера слова пробудження змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення виконання.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок автоматичного дозволу.

### RPC журналу завдань

Клієнти операторів можуть переглядати й скасовувати записи фонових завдань Gateway через
RPC журналу завдань. Ці методи повертають очищені зведення завдань, а не сирий
стан runtime.

- `tasks.list` потребує `operator.read`.
  - Параметри: необов'язковий `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` або `"timed_out"`) чи масив таких статусів,
    необов'язковий `agentId`, необов'язковий `sessionKey`, необов'язковий `limit` від `1` до
    `500` і необов'язковий рядок `cursor`.
  - Результат: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` потребує `operator.read`.
  - Параметри: `{ "taskId": string }`.
  - Результат: `{ "task": TaskSummary }`.
  - Відсутні ідентифікатори завдань повертають форму помилки not-found Gateway.
- `tasks.cancel` потребує `operator.write`.
  - Параметри: `{ "taskId": string, "reason"?: string }`.
  - Результат:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` повідомляє, чи журнал мав відповідне завдання. `cancelled`
    повідомляє, чи runtime прийняв або зафіксував скасування.

`TaskSummary` містить `id`, `status` і необов'язкові метадані, як-от `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, часові позначки, прогрес,
термінальне зведення та очищений текст помилки.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов'язковий; опустіть його, щоб читати типовий робочий простір агента.
  - `scope` керує тим, на яку поверхню націлено основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають нативні імена з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, як-от `/model` і `/m`.
  - `nativeName` містить нативну назву команди з урахуванням провайдера, коли така існує.
  - `provider` необов'язковий і впливає лише на нативне іменування та доступність
    нативних команд plugin.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи інструмент plugin є необов'язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати ефективний для runtime
  інвентар інструментів для сеансу.
  - `sessionKey` обов'язковий.
  - Gateway виводить довірений runtime-контекст із сеансу на серверному боці замість приймання
    наданого викликачем контексту автентифікації чи доставки.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати прямо зараз,
    включно з core, plugin та інструментами каналів.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики gateway, що й `/tools/invoke`.
  - `name` обов'язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов'язкові.
  - Якщо присутні і `sessionKey`, і `agentId`, розв'язаний агент сеансу має збігатися з
    `agentId`.
  - Відповідь є конвертом для SDK з полями `ok`, `toolName`, необов'язковим `output` і типізованими
    полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` необов'язковий; опустіть його, щоб читати типовий робочий простір агента.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.upload.begin`, `skills.upload.chunk` і
  `skills.upload.commit` (`operator.admin`), щоб підготувати приватний архів skill
  перед його встановленням. Це окремий адміністративний шлях завантаження для довірених клієнтів,
  а не звичайний потік встановлення skill з ClawHub, і за замовчуванням він вимкнений, якщо
  `skills.install.allowUploadedArchives` не ввімкнено.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    створює завантаження, прив'язане до цього slug і значення force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` додає байти за
    точним декодованим зміщенням.
  - `skills.upload.commit({ uploadId, sha256? })` перевіряє фінальний розмір і
    SHA-256. Commit лише завершує завантаження; він не встановлює skill.
  - Завантажені архіви skill є zip-архівами, що містять кореневий `SKILL.md`. Внутрішня
    назва каталогу архіву ніколи не вибирає ціль встановлення.
- Оператори можуть викликати `skills.install` (`operator.admin`) у трьох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у каталог `skills/` типового робочого простору агента.
  - Режим завантаження: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    встановлює зафіксоване завантаження в каталог `skills/<slug>`
    типового робочого простору агента. Slug і значення force мають збігатися з початковим
    запитом `skills.upload.begin`. Цей режим відхиляється, якщо
    `skills.install.allowUploadedArchives` не ввімкнено. Налаштування не
    впливає на встановлення з ClawHub.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    типовому робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов'язковий параметр `view`:

- Опущено або `"default"`: поточна поведінка runtime. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом, включно з динамічно виявленими моделями для записів `provider/*`. Інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе ще має пріоритет, включно з виявленням у межах провайдера для записів `provider/*`. Без allowlist відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення виконання

- Коли запит виконання потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти операторів розв'язують його, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переадресовані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, gateway
  відхиляє виконання замість довіри до зміненого payload.

## Резервний варіант доставки агентом

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв'язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в сеансі, коли неможливо розв'язати зовнішній маршрут доставки (наприклад, внутрішні/webchat-сеанси або неоднозначні багатоканальні конфігурації).
- Фінальні результати `agent` можуть містити `result.deliveryStatus`, коли доставку було
  запитано, використовуючи ті самі статуси `sent`, `suppressed`, `partial_failed` і `failed`,
  що задокументовані для [`openclaw agent --json --deliver`](/uk/cli/agent#json-delivery-status).

## Версіонування

- `PROTOCOL_VERSION` розташовано в `src/gateway/protocol/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє діапазони, які
  не включають його поточний протокол. Нативні клієнти використовують нижню межу v3, щоб
  адитивні клієнти v4 усе ще могли досягати gateway v3.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
стабільні в межах protocol v4 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Типове значення                                       | Джерело                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env може збільшити парний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження швидкого повтору після закриття через device-token | `250` ms                              | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через тайм-аут tick              | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення
  через заголовки запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію
  підключення зі спільним секретом; не виставляйте цей режим у публічний/ненадійний ingress.
- Після pairing Gateway видає **device token**, обмежений роллю підключення
  + scopes. Його повертають у `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  схвалений набір scopes для цього токена. Це зберігає доступ для read/probe/status,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  неявного scope лише для адміністратора.
- Формування автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли його задано.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен окремого пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із варіантів вище не визначив
    `auth.token`. Спільний токен або будь-який визначений device token пригнічує його.
  - Автоматичне підвищення збереженого device token під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth через довірений транспорт,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен окремого пристрою.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані
  цим device token, тож клієнти лише з токеном можуть зберегти свою заміну перед
  повторним підключенням. Shared/admin ротації не віддзеркалюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у pairing-записі цього пристрою; зміна токена не може розширити або
  націлити роль пристрою, яку pairing-approval ніколи не надавав.
- Для сесій paired-device token керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: неадміністративні викликачі можуть видаляти/відкликати/ротувати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes
  operator token щодо поточних scopes сесії викликача. Неадміністративні викликачі
  не можуть ротувати або відкликати ширший operator token, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном окремого пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дії.
- `AUTH_SCOPE_MISMATCH` означає, що device token було розпізнано, але він не покриває
  запитану роль/scopes. Клієнти не мають подавати це як поганий токен;
  запропонуйте оператору виконати re-pair або схвалити вужчий/ширший контракт scopes.

## Ідентичність пристрою + pairing

- Nodes мають включати стабільну ідентичність пристрою (`device.id`), отриману з
  fingerprint пари ключів.
- Gateways видають токени для кожного пристрою + ролі.
- Pairing approvals потрібні для нових device IDs, якщо не ввімкнено локальне auto-approval.
- Pairing auto-approval зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях самопідключення для
  довірених helper flows зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для pairing і
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки operator без пристрою — явні trust paths:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності небезпечного HTTP лише на localhost.
  - успішна автентифікація operator Control UI для `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - backend RPCs прямого loopback `gateway-client`, автентифіковані спільним
    gateway token/password.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристроїв

Для legacy clients, які досі використовують поведінку підписування до challenge, `connect` тепер повертає
detail codes `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписаний timestamp поза дозволеним skew.         |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає fingerprint відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося перевірити формат/canonicalization відкритого ключа. |

Ціль міграції:

- Завжди чекайте `connect.challenge`.
- Підписуйте payload v2, який містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив'язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Legacy-підписи `v2` залишаються прийнятими для сумісності, але pinning metadata paired-device
  усе ще керує command policy під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-з'єднань.
- Клієнти можуть необов'язково закріпити fingerprint сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов'язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
