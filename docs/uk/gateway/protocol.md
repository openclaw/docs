---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket для Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-07T13:18:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженнями.
- Перший фрейм **обов’язково** має бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери генерують події
  `payload.large` до того, як gateway закриє або відкине відповідний фрейм. Ці
  події зберігають розміри, ліміти, поверхні та безпечні коди причин. Вони не
  зберігають тіло повідомлення, вміст вкладень, сире тіло фрейму, токени,
  cookies або секретні значення.

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
    "minProtocol": 4,
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
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цей запит у
межах загального бюджету підключення замість того, щоб показувати це як
остаточний збій handshake.

`server`, `features`, `snapshot` і `policy` усі є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і
повідомляє узгоджені роль/області дії. `pluginSurfaceUrls` є необов’язковим і
зіставляє назви поверхонь plugin, як-от `canvas`, з обмеженими за областю дії
розміщеними URL.

URL поверхонь plugin з областями дії можуть спливати. Вузли можуть викликати
`node.pluginSurface.refresh` з `{ "surface": "canvas" }`, щоб отримати свіжий
запис у `pluginSurfaceUrls`. Експериментальний рефакторинг Canvas plugin не
підтримує застарілий шлях сумісності `canvasHostUrl`, `canvasCapability` або
`node.canvas.capability.refresh`; поточні нативні клієнти й gateways мають
використовувати поверхні plugin.

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
`client.mode: "backend"`) можуть опускати `device` для прямих підключень
loopback, коли вони автентифікуються спільним токеном/паролем gateway. Цей шлях
зарезервовано для внутрішніх RPC площини керування, і він не дає застарілим
базовим станам парування CLI/пристрою блокувати локальну backend-роботу, як-от
оновлення сесій підagentів. Віддалені клієнти, клієнти з browser-origin,
клієнти вузлів і явні клієнти з токеном пристрою/ідентичністю пристрою й далі
використовують звичайні перевірки парування та підвищення області дії.

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
`operator.talk.secrets`, `operator.write`). Перевірки областей дії bootstrap
лишаються роль-префіксними: записи оператора задовольняють лише запити
оператора, а неоператорські ролі й далі потребують областей дії під власним
рольовим префіксом.

### Приклад Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Повну модель областей дії оператора, перевірки під час схвалення та семантику
спільних секретів див. у [Області дії оператора](/uk/gateway/operator-scopes).

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

Зареєстровані plugin RPC-методи gateway можуть запитувати власну операторську
область дії, але зарезервовані основні admin-префікси (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди вирішуються як
`operator.admin`.

Область дії методу є лише першим бар’єром. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки рівня команди поверх цього.
Наприклад, постійні записи `/config set` і `/config unset` потребують
`operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час
схвалення поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (вузол)

Вузли оголошують претензії на можливості під час підключення:

- `caps`: високорівневі категорії можливостей, як-от `camera`, `canvas`, `screen`,
  `location`, `voice` і `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **претензії** та застосовує server-side allowlists.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI міг показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спаровані вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані парування.

### Фонова подія alive вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарований вузол був
alive під час фонового пробудження, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` gateway перед збереженням. Подія є тривалою лише для автентифікованих сесій
пристроїв вузлів; сесії без пристрою або без парування повертають `handled: false`.

Успішні gateways повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateways можуть і далі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження областями дії для broadcast-подій

Серверні broadcast-події WebSocket обмежуються областями дії, щоб pairing-scoped або node-only сесії не отримували пасивно вміст сесій.

- **Фрейми чату, agent і результатів інструментів** (включно зі streamed подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Визначені plugin broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin` залежно від того, як plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимий кожній автентифікованій сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний sequence number на клієнта, тому broadcasts зберігають монотонне впорядкування на цьому socket, навіть коли різні клієнти бачать різні scope-filtered підмножини потоку подій.

## Поширені сімейства RPC-методів

Публічна WS-поверхня ширша за наведені вище приклади handshake/auth. Це
не згенерований dump — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів plugin/channel. Трактуйте його як виявлення функцій, а не як
повний перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений snapshot стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений recorder стабільності діагностики. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черг/сесій, назви channel/plugin та id сесій. Він не зберігає текст чату, тіла webhook, вихідні дані інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область дії operator read.
    - `status` повертає summary gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яку використовують потоки relay і pairing.
    - `system-presence` повертає поточний snapshot присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/broadcast контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених середовищем виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спершу, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера та зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність vector-memory / кешованих embedding для активного робочого простору стандартного агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче live-перевірку embedding-провайдера.
    - `doctor.memory.remHarness` повертає обмежений read-only попередній перегляд REM harness для віддалених клієнтів control-plane. Він може містити шляхи робочого простору, фрагменти памʼяті, відрендерений grounded markdown і кандидатів для deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сесіями.
    - `sessions.usage.timeseries` повертає використання часових рядів для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і bundled каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-процес входу для поточного QR-сумісного провайдера вебканалу.
    - `web.login.wait` очікує завершення цього QR/web-процесу входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим outbound-delivery RPC для надсилань, націлених на канал/обліковий запис/тред, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу Gateway з керуванням курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.catalog` повертає read-only каталог провайдерів Talk для мовлення, потокової транскрипції та голосу в реальному часі. Він містить id провайдерів, мітки, стан налаштування, відкриті id моделей/голосів, канонічні режими, транспорти, brain-стратегії та прапорці аудіо/можливостей реального часу, не повертаючи секрети провайдерів і не змінюючи глобальну конфігурацію.
    - `talk.config` повертає ефективне config-навантаження Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.session.create` створює Talk-сесію, якою володіє Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` або `stt-tts/managed-room`. `brain: "direct-tools"` потребує `operator.admin`.
    - `talk.session.join` перевіряє токен managed-room сесії, надсилає події `session.ready` або `session.replaced` за потреби та повертає метадані кімнати/сесії плюс нещодавні події Talk без plaintext-токена або збереженого хеша токена.
    - `talk.session.appendAudio` додає base64 PCM вхідне аудіо до realtime relay і transcription сесій, якими володіє Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` і `talk.session.cancelTurn` керують життєвим циклом ходу managed-room з відхиленням застарілого ходу до очищення стану.
    - `talk.session.cancelOutput` зупиняє аудіовихід асистента, переважно для VAD-gated barge-in у Gateway relay сесіях.
    - `talk.session.submitToolResult` завершує виклик інструмента провайдера, випущений realtime relay сесією, якою володіє Gateway.
    - `talk.session.close` закриває relay, transcription або managed-room сесію, якою володіє Gateway, і надсилає термінальні події Talk.
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.client.create` створює realtime-сесію провайдера, якою володіє клієнт, використовуючи `webrtc` або `provider-websocket`, тоді як Gateway володіє конфігурацією, обліковими даними, інструкціями та політикою інструментів.
    - `talk.client.toolCall` дає змогу realtime-транспортам, якими володіє клієнт, пересилати виклики інструментів провайдера до політики Gateway. Перший підтримуваний інструмент — `openclaw_agent_consult`; клієнти отримують run id і очікують звичайних подій життєвого циклу чату перед надсиланням специфічного для провайдера результату інструмента.
    - `talk.event` є єдиним каналом подій Talk для realtime, transcription, STT/TTS, managed-room, telephony і meeting adapters.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback-провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розвʼязує активні SecretRefs і замінює runtime-стан секретів лише за повного успіху.
    - `secrets.resolve` розвʼязує command-target призначення секретів для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене config-навантаження.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повне config-навантаження.
    - `config.schema` повертає live config schema payload, який використовують Control UI і CLI tooling: schema, `uiHints`, version і metadata generation, включно з metadata schema Plugin + channel, коли runtime може її завантажити. Schema містить metadata полів `title` / `description`, отриману з тих самих міток і тексту довідки, що й UI, включно з вкладеним object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає path-scoped lookup payload для одного шляху конфігурації: нормалізований шлях, shallow schema node, matched hint + `hintPath` і immediate child summaries для UI/CLI drill-down. Lookup schema nodes зберігають user-facing docs і common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child summaries відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно; викликачі із сесією можуть включити `continuationMessage`, щоб запуск відновив один наступний хід агента через restart continuation queue. Оновлення через package manager примусово виконують non-deferred, no-cooldown restart після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований update restart sentinel, включно з версією, що працює після перезапуску, якщо вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер онбордингу через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та runtime-метаданими.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і привʼязкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають зведення артефактів і завантаження, отримані з транскрипту, для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розвʼязують власницьку сесію на серверному боці та повертають лише transcript media з відповідним provenance; небезпечні або локальні URL-джерела повертають unsupported downloads замість server-side fetching.
    - `environments.list` і `environments.status` відкривають read-only виявлення локальних для Gateway і вузлових середовищ для клієнтів SDK.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, включно з метаданими `agentRuntime` для кожного рядка, коли налаштовано agent runtime backend.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесії для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для конкретних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` розвʼязує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є варіантом interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необовʼязковий `runId`, або передати лише `runId` для активних run, які Gateway може розвʼязати до сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розвʼязану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення UI-клієнтам: inline directive tags вилучаються з видимого тексту, plain-text tool-call XML payloads (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і truncated tool-call blocks) та leaked ASCII/full-width model control tokens вилучаються, суто silent-token assistant rows, як-от точні `NO_REPLY` / `no_reply`, опускаються, а oversized rows можуть бути замінені placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає pending і approved paired devices.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують records сполучення пристроїв.
    - `device.token.rotate` ротує paired device token у межах його approved role і caller scope bounds.
    - `device.token.revoke` відкликає paired device token у межах його approved role і caller scope bounds.

  </Accordion>

  <Accordion title="Сполучення вузлів, invoke і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення вузлів і bootstrap verification.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку paired node.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для invoke request.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.pending.pull` і `node.pending.ack` є API черги connected-node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected nodes.

  </Accordion>

  <Accordion title="Сімейства затверджень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на затвердження exec, а також пошук/повторне відтворення очікуваних затверджень.
    - `exec.approval.waitDecision` очікує на одне очікуване затвердження exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики затвердження exec для Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою затвердження exec через команди ретрансляції Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки затверджень.

  </Accordion>

  <Accordion title="Автоматизація, Skills і інструменти">
    - Автоматизація: `wake` планує негайну або під час наступного Heartbeat інʼєкцію тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills і інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI чату, як-от `chat.inject` та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про завершення роботи Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення Node.
- `node.invoke.request`: трансляція запиту виклику Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: змінено конфігурацію тригера wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл затвердження exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл затвердження plugin.

### Допоміжні методи Node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill для перевірок автоматичного дозволу.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-інвентар команд для агента.
  - `agentId` необовʼязковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають нативні імена з урахуванням провайдера, коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить нативне імʼя команди з урахуванням провайдера, коли воно існує.
  - `provider` необовʼязковий і впливає лише на нативне іменування та доступність нативних команд plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необовʼязковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний інвентар інструментів для сесії.
  - `sessionKey` обовʼязковий.
  - Gateway виводить довірений runtime-контекст із сесії на боці сервера замість приймати наданий викликачем контекст автентифікації або доставлення.
  - Відповідь привʼязана до сесії та відображає те, що активна розмова може використовувати просто зараз, включно з core, plugin і channel інструментами.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обовʼязковий. `args`, `sessionKey`, `agentId`, `confirm` і `idempotencyKey` необовʼязкові.
  - Якщо наявні і `sessionKey`, і `agentId`, визначений агент сесії має збігатися з `agentId`.
  - Відповідь є зверненим до SDK конвертом із полями `ok`, `toolName`, необовʼязковим `output` і типізованими полями `error`. Відмови через затвердження або політику повертають `ok:false` у payload, а не обходять конвеєр політик інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар skills для агента.
  - `agentId` необовʼязковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та очищені параметри встановлення без розкриття необроблених значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill у директорію `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у стандартному робочому просторі агента.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необовʼязковий параметр `view`:

- Пропущено або `"default"`: поточна runtime-поведінка. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, воно все одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише коли немає жодних налаштованих рядків моделей.
- `"all"`: повний каталог Gateway з обходом `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Затвердження exec

- Коли запит exec потребує затвердження, Gateway транслює `exec.approval.requested`.
- Клієнти операторів вирішують це, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після затвердження переслані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач мутує `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` між підготовкою та остаточним затвердженим пересиланням `system.run`, Gateway відхиляє запуск замість довіряти мутованому payload.

## Резервна доставка агентом

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозвʼязані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, коли не вдається визначити зовнішній доставний маршрут (наприклад, внутрішні/webchat сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Клієнтські константи

Еталонний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення стабільні в межах protocol v4 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                  | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` мс                                          | `src/gateway/handshake-timeouts.ts` (config/env може збільшити спарений бюджет сервера/клієнта) |
| Початкова затримка повторного підключення | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальна затримка повторного підключення | `30_000` мс                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` мс                                      | `src/gateway/client.ts`                                                                    |
| Період grace force-stop перед `terminate()` | `250` мс                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` мс                                          | `src/gateway/client.ts`                                                                    |
| Закриття за tick-timeout                  | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не стандартних значень до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з передаванням ідентичності, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення через
  заголовки запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення зі спільним секретом;
  не відкривайте цей режим для публічного/ненадійного ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений роллю підключення
  та scopes. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір scopes для цього токена. Це зберігає доступ для читання/проб/status,
  який уже було надано, і не дає повторним підключенням непомітно звузитися до
  вужчого неявного scope лише для адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автопідвищення збереженого токена пристрою під час одноразової повторної спроби
    `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не відповідає вимогам.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth на довіреному транспорті,
  як-от `wss://` або loopback/локальне сполучення.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Ротації зі спільним/адміністративним доступом не віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі сполучення цього пристрою; мутація токена не може розширити або
  націлити роль пристрою, яку схвалення сполучення ніколи не надавало.
- Для сесій токенів сполучених пристроїв керування пристроями є самообмеженим, якщо
  викликач також не має `operator.admin`: неадміністраторські викликачі можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes
  токена оператора щодо поточних scopes сесії викликача. Неадміністраторські викликачі
  не можуть ротувати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли перепідключення та показати оператору вказівки щодо дій.

## Ідентичність пристрою + сполучення

- Nodes мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка keypair.
- Gateways видають токени на пристрій + роль.
- Схвалення сполучення потрібні для нових ідентифікаторів пристроїв, якщо не ввімкнено локальне автосхвалення.
- Автосхвалення сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях backend/container-local самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN все одно вважаються віддаленими для сполучення та
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (оператор +
  node). Єдині винятки для оператора без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only сумісності з небезпечним HTTP.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback backend RPCs `gateway-client`, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає v2 payload.         |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана timestamp поза дозволеним skew.         |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалася. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте v2 payload, який містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning
  метаданих сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть опціонально закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
