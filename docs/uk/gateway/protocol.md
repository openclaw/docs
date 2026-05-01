---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-01T08:21:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b80ee7d9a36f78b05b8ca83d70baf6ec53fc907ca25e8b4c2ab39350ff95c54
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні кадри та повільні вихідні буфери створюють події
  `payload.large` перед тим, як Gateway закриє або відкине відповідний кадр.
  Ці події зберігають розміри, обмеження, поверхні та безпечні коди причин.
  Вони не зберігають тіло повідомлення, вміст вкладень, сире тіло кадру,
  токени, cookies або секретні значення.

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

Поки Gateway ще завершує запуск побічних процесів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, установленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цю відповідь
у межах свого загального бюджету підключення, а не показувати її як остаточний
збій рукостискання.

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і
повідомляє узгоджену роль/області дії. `canvasHostUrl` є необов’язковим.

Коли токен пристрою не видано, `hello-ok.auth` повідомляє узгоджені дозволи
без полів токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` для прямих loopback-з’єднань,
коли вони автентифікуються спільним токеном/паролем Gateway. Цей шлях
зарезервований для внутрішніх RPC площини керування і не дає застарілим
базовим станам сполучення CLI/пристрою блокувати локальну backend-роботу,
таку як оновлення сеансів субагентів. Віддалені клієнти, клієнти з браузерним
походженням, клієнти-вузли та явні клієнти з токеном пристрою/ідентичністю
пристрою й далі використовують звичайні перевірки сполучення та підвищення
області дії.

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

Для вбудованого bootstrap-потоку вузол/оператор основний токен вузла
залишається з `scopes: []`, а будь-який переданий операторський токен
залишається обмеженим allowlist bootstrap-оператора (`operator.approvals`,
`operator.read`, `operator.talk.secrets`, `operator.write`). Перевірки областей
дії bootstrap залишаються префіксованими роллю: операторські записи
задовольняють лише операторські запити, а неоператорські ролі все ще потребують
областей дії з префіксом власної ролі.

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

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власну операторську
область дії, але зарезервовані основні префікси адміністратора (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди перетворюються на
`operator.admin`.

Область дії методу є лише першою перевіркою. Деякі slash-команди, доступні
через `chat.send`, застосовують суворіші перевірки рівня команди поверх цього.
Наприклад, сталі записи `/config set` і `/config unset` потребують
`operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час
затвердження поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з node-командами не для exec: `operator.pairing` + `operator.write`
- запити, які містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують заявки на можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для виклику.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **заявки** і забезпечує server-side allowlist.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається одночасно як **operator** і **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` із причиною `connect`; сполучені вузли також можуть повідомляти
  сталу фонову присутність, коли довірена подія вузла оновлює їхні метадані сполучення.

### Фонова подія активності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що сполучений вузол був
активним під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються до
`background` Gateway перед збереженням. Подія є сталою лише для автентифікованих node-сеансів
пристрою; сеанси без пристрою або без сполучення повертають `handled: false`.

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
підтверджений RPC, а не як стале збереження присутності.

## Обмеження області дії broadcast-подій

Broadcast-події WebSocket, які надсилає сервер, обмежуються областями дії, щоб сеанси з областю дії сполучення або лише вузлами не отримували пасивно вміст сеансів.

- **Кадри чату, агента та результатів інструментів** (включно зі streamed-подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сеанси без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб справність транспорту була видимою для кожного автентифікованого сеансу.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються областю дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для кожного клієнта, тому broadcast-події зберігають монотонний порядок у цьому socket навіть тоді, коли різні клієнти бачать різні підмножини потоку подій після фільтрації за областями дії.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів Plugin/каналів. Трактуйте його як виявлення функцій, а не
повний перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і ідентифікатори сеансів. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна операторська область дії read.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для операторських клієнтів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують потоки relay і сполучення.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію і може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання. Передайте `{ "view": "configured" }` для стислого для вибірника списку налаштованих моделей (спочатку `agents.defaults.models`, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення щодо вікон використання провайдера та залишкової квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної памʼяті / кешованих embedding для активного робочого простору типового агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів control-plane. Він може містити шляхи робочого простору, фрагменти памʼяті, відрендерений grounded markdown і кандидатів на deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сеансами.
    - `sessions.usage.timeseries` повертає часовий ряд використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення статусу вбудованих і комплектних каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного web-провайдера каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web-потоку входу та в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC для вихідної доставки, націлений на канал/обліковий запис/тред, для надсилань поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з елементами керування cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` вимагає `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розвʼязує активні SecretRefs і замінює стан секретів під час виконання лише в разі повного успіху.
    - `secrets.resolve` розвʼязує призначення секретів для цільових команд для певного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: schema, `uiHints`, version і метадані generation, зокрема метадані схеми plugin + channel, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, зокрема вкладені обʼєкти, wildcard, елементи масиву та гілки композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Дочірні зведення показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає останній кешований restart sentinel оновлення, зокрема поточну версію після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер онбордингу через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і метадані середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і привʼязкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають зведення артефактів і завантаження, отримані з транскрипту, для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розвʼязують власний сеанс на боці сервера та повертають лише медіа транскрипту з відповідним походженням; небезпечні або локальні URL-джерела повертають непідтримувані завантаження замість завантаження на боці сервера.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
    - `agent.wait` очікує завершення run і повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сеансами">
    - `sessions.list` повертає поточний індекс сеансів, зокрема метадані `agentRuntime` для кожного рядка, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сеансів для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для певних ключів сеансів.
    - `sessions.resolve` розвʼязує або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` — це варіант interrupt-and-steer для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу. Викликач може передати `key` плюс необовʼязковий `runId` або передати лише `runId` для активних run, які Gateway може розвʼязати до сеансу.
    - `sessions.patch` оновлює метадані/перевизначення сеансу та повідомляє розвʼязану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансів.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення UI-клієнтам: inline directive tags вилучаються з видимого тексту, plain-text XML payloads викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та leaked ASCII/full-width model control tokens вилучаються, чисті silent-token рядки асистента, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надмірно великі рядки можуть замінюватися placeholder.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі та області викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його схваленої ролі та області викликача.

  </Accordion>

  <Accordion title="Спарювання Node, invoke і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` покривають спарювання вузлів і перевірку bootstrap.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку спареного вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують надійно збереженою очікуваною роботою для офлайн/відключених вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` покривають одноразові запити схвалення exec, а також пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди relay вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` покривають потоки схвалень, визначені plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або під час наступного heartbeat інʼєкцію тексту wake; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
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
- `cron`: подія зміни run/job cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання вузлів.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Методи-помічники Node

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для перевірок auto-allow.

### Методи-помічники оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають native-імена з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить native-ім’я команди з урахуванням провайдера, коли воно існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність native-команд Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний
  інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сесії на серверному боці замість прийняття
    auth або контексту доставки, наданого викликачем.
  - Відповідь обмежена сесією та відображає те, що активна розмова може використовувати прямо зараз,
    включно з core, Plugin і channel-інструментами.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через
  той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` необов’язкові.
  - Якщо наявні і `sessionKey`, і `agentId`, визначений агент сесії має збігатися з
    `agentId`.
  - Відповідь є envelope для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими
    `error`. Відмови через погодження або політику повертають `ok:false` у payload, а не
    обходять pipeline політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих discovery у ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку Skills у директорію `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    стандартному робочому просторі агента.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна runtime-поведінка. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає жодних налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, оминаючи `agents.defaults.models`. Використовуйте це для діагностики та discovery UI, а не для звичайних picker моделей.

## Погодження exec

- Коли exec-запит потребує погодження, Gateway транслює `exec.approval.requested`.
- Операторські клієнти вирішують це, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після погодження переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як authoritative контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним погодженим forward `system.run`, Gateway
  відхиляє запуск замість того, щоб довіряти зміненому payload.

## Fallback доставки агентом

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли неможливо визначити зовнішній доставний маршрут (наприклад, внутрішні/webchat-сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Референсний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення
стабільні в protocol v3 і є очікуваною baseline для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                  | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env може збільшити спільний server/client budget) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp після закриття device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Grace force-stop перед `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень
замість стандартних значень до handshake.

## Auth

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення за
  заголовками запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення зі спільним секретом; не відкривайте цей режим для публічного/ненадійного ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений роллю підключення
  + scopes. Він повертається в `hello-ok.auth.deviceToken` і має бути
  збережений клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  набір схвалених scopes для цього токена. Це зберігає доступ read/probe/status,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  вужчого неявного scope лише для адміністратора.
- Клієнтське складання автентифікації підключення (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли його задано.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для окремого пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  як-от `wss://` або loopback/локальне сполучення.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes використовуються повторно лише
  тоді, коли клієнт повторно використовує збережений токен для окремого пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює replacement
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Ротації shared/admin не віддзеркалюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у записі сполучення цього пристрою; зміна токена не може розширити або
  націлитися на роль пристрою, яку ніколи не надавало схвалення сполучення.
- Для токен-сесій сполучених пристроїв керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/ротувати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes токена
  оператора щодо поточних scopes сесії викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для окремого пристрою.
  - Якщо ця повторна спроба зазнає невдачі, клієнти мають припинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дій.

## Ідентичність пристрою + сполучення

- Nodes мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateways видають токени для кожного пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібні схвалення сполучення, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях self-connect для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з same-host tailnet або LAN все одно розглядаються як віддалені для сполучення та
  потребують схвалення.
- WS-клієнти зазвичай додають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки оператора без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only insecure HTTP-сумісності.
  - успішна автентифікація operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback `gateway-client` backend RPCs, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілий/неправильний nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу поза дозволеним зсувом.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа зазнали невдачі. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, що містить nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але pinning метаданих
  сполученого пристрою все ще керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть опційно закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
