---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або помилок підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-01T00:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da9ce755b941789ae6b9e866247c8bebb86e9a1530fb8cb258fb0650b24b8a
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
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні кадри та повільні вихідні буфери випускають події
  `payload.large` перед тим, як Gateway закриє або відкине відповідний кадр.
  Ці події зберігають розміри, ліміти, поверхні та безпечні коди причин. Вони
  не зберігають тіло повідомлення, вміст вкладень, сире тіло кадру, токени,
  cookie або секретні значення.

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

Поки Gateway ще завершує запуск sidecar-компонентів, запит `connect` може
повернути повторювану помилку `UNAVAILABLE` з `details.reason`, встановленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити таку відповідь
у межах свого загального бюджету підключення, а не показувати її як остаточний
збій рукостискання.

`server`, `features`, `snapshot` і `policy` усі є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і
повідомляє узгоджену роль/області дії. `canvasHostUrl` є необов’язковим.

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

Довірені серверні клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` для прямих підключень
local loopback, коли вони автентифікуються спільним токеном/паролем Gateway. Цей
шлях зарезервований для внутрішніх RPC площини керування й не дає застарілим
базовим станам спарювання CLI/пристрою блокувати локальну серверну роботу,
наприклад оновлення сесій субагентів. Віддалені клієнти, клієнти з браузерним
походженням, клієнти-вузли та явні клієнти з токеном пристрою/ідентичністю
пристрою й надалі використовують звичайні перевірки спарювання та підвищення
областей дії.

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
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим
дозволеним списком bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей дії bootstrap
лишаються префіксованими роллю: записи оператора задовольняють лише запити
оператора, а неоператорські ролі все одно потребують областей дії під власним
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

## Обрамлення

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

### Ролі

- `operator` = клієнт площини керування (CLI/інтерфейс/автоматизація).
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

Зареєстровані Plugin методи Gateway RPC можуть запитувати власну область дії
оператора, але зарезервовані префікси адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди зіставляються з
`operator.admin`.

Область дії методу є лише першою перевіркою. Деякі slash-команди, до яких
дістаються через `chat.send`, застосовують суворіші перевірки на рівні команди
поверх цього. Наприклад, постійні записи `/config set` і `/config unset`
потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення
поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують заявки на можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: дозволений список команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заявки** та застосовує серверні дозволені списки.

## Присутність

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб інтерфейси могли показувати один рядок на пристрій
  навіть коли він підключається і як **оператор**, і як **вузол**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спарені вузли також можуть повідомляти
  тривалу фонову присутність, коли довірена подія вузла оновлює їхні метадані спарювання.

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
`significant_location`, `manual` або `connect`. Невідомі рядки тригерів нормалізуються до
`background` Gateway перед збереженням. Подія є тривалою лише для автентифікованих сесій
пристроїв-вузлів; сесії без пристрою або без спарювання повертають `handled: false`.

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
підтверджений RPC, а не як тривале збереження присутності.

## Обмеження області дії трансляційних подій

Трансляційні події WebSocket, які надсилає сервер, обмежуються областями дії, щоб сесії з областю дії спарювання або лише вузлів не отримували пасивно вміст сесій.

- **Кадри чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin трансляції `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) лишаються необмеженими, щоб стан транспорту був видимим для кожної автентифікованої сесії.
- **Невідомі родини трансляційних подій** за замовчуванням обмежуються областю дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для кожного клієнта, тож трансляції зберігають монотонне впорядкування на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями дії.

## Поширені родини методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/каналів. Трактуйте його як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений діагностичний реєстратор стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з адміністративною областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яку використовують relay і потоки спарювання.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв операторів/вузлів.
    - `system-event` додає системну подію та може оновити/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку Heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений середовищем виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення використання вартості за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живу перевірку embedding-провайдера.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів control plane. Він може містити шляхи робочого простору, фрагменти пам’яті, відрендерений grounded markdown і кандидатів на deep promotion, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає використання у вигляді часового ряду для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення статусів вбудованих і комплектних каналів/Plugin.
    - `channels.logout` виходить із певного каналу/акаунта, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web-входу для поточного QR-сумісного провайдера вебканалу.
    - `web.login.wait` чекає завершення цього потоку QR/web-входу й запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS-вузол.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/акаунт/тред поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з курсором/лімітом і керуванням максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` задає/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` запускає одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно вирішує активні SecretRefs і замінює стан секретів у середовищі виконання лише за повного успіху.
    - `secrets.resolve` вирішує прив’язки секретів, націлені на команди, для певного набору команда/ціль.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує валідоване корисне навантаження конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` валідує та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: схема, `uiHints`, версія та метадані генерації, включно з метаданими схем plugin + каналу, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, виведені з тих самих міток і довідкового тексту, які використовує UI, включно з гілками композиції вкладених об’єктів, wildcard, елементів масиву та `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідний hint + `hintPath` і безпосередні зведення дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Дочірні зведення показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише коли саме оновлення завершилося успішно.
    - `update.status` повертає найновіший кешований sentinel перезапуску оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають майстер онбордингу через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та метаданими середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і зв’язуванням робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають зведення артефактів, отриманих із транскрипту, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити запусків і завдань вирішують сесію-власника на сервері та повертають лише медіа транскрипту з відповідним походженням; небезпечні або локальні URL-джерела повертають непідтримувані завантаження замість отримання на сервері.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` чекає завершення запуску й повертає термінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, включно з метаданими `agentRuntime` для кожного рядка, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для конкретних ключів сесій.
    - `sessions.resolve` вирішує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов’язковий `runId` або передати лише `runId` для активних запусків, які Gateway може зіставити із сесією.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє вирішену канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення в UI-клієнтах: inline directive tags вилучаються з видимого тексту, XML-корисні навантаження викликів інструментів у plain-text (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів) і витіклі ASCII/full-width model control tokens вилучаються, рядки асистента лише з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої в очікуванні та схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` обертає токен сполученого пристрою в межах його схваленої ролі та меж області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі та меж області викликача.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення вузлів і перевірку bootstrap.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени canvas-capability з обмеженою областю.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують durable роботою в очікуванні для offline/disconnected вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/повторне відтворення схвалень в очікуванні.
    - `exec.approval.waitDecision` чекає одне схвалення exec в очікуванні та повертає фінальне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди ретрансляції вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, skills та інструменти">
    - Автоматизація: `wake` планує негайну або під час наступного heartbeat ін’єкцію wake-тексту; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject`, та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична keepalive / liveness подія.
- `health`: оновлення знімка справності gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи Node

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд часу виконання для агента.
  - `agentId` необов'язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлено основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають нативні імена з урахуванням провайдера, коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, як-от `/model` і `/m`.
  - `nativeName` містить нативне ім'я команди з урахуванням провайдера, коли воно існує.
  - `provider` необов'язковий і впливає лише на нативне найменування та доступність нативних команд plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів часу виконання для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов'язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактично доступний у часі виконання інвентар інструментів для сесії.
  - `sessionKey` обов'язковий.
  - Gateway виводить довірений контекст часу виконання із сесії на серверному боці замість приймання наданого викликачем контексту автентифікації або доставки.
  - Відповідь обмежена сесією та відображає те, що активна розмова може використовувати прямо зараз, включно з core, plugin і каналними інструментами.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар skill для агента.
  - `agentId` необов'язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та очищені варіанти встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill у директорію `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у робочому просторі агента за замовчуванням.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Представлення `models.list`

`models.list` приймає необов'язковий параметр `view`:

- Не вказано або `"default"`: поточна поведінка часу виконання. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має перевагу. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти операторів вирішують це, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, gateway відхиляє запуск замість довіри до зміненого payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв'язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли неможливо розв'язати зовнішній маршрут доставки (наприклад, внутрішні/webchat-сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення стабільні в protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                      | Джерело                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет server/client) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` ms                                       | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Тайм-аут за замовчуванням `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                                                    |
| Закриття через тайм-аут tick              | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не значень за замовчуванням до handshake.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve (`gateway.auth.allowTailscale: true`) або non-loopback `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку connect auth із заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає shared-secret connect auth; не виставляйте цей режим на публічний/недовірений ingress.
- Після pairing Gateway видає **device token**, обмежений роллю підключення + scopes. Він повертається в `hello-ok.auth.deviceToken` і має зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений затверджений набір scope для цього token. Це зберігає вже наданий доступ read/probe/status і не дозволяє reconnect непомітно звузитися до неявного admin-only scope.
- Збирання connect auth на боці клієнта (`selectConnectAuth` у `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, коли встановлений.
  - `auth.token` заповнюється в порядку пріоритету: спершу явний спільний token, потім явний `deviceToken`, потім збережений per-device token (за ключем `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жодне з наведеного вище не розв'язало `auth.token`. Спільний token або будь-який розв'язаний device token пригнічує його.
  - Автоматичне підвищення збереженого device token під час одноразової повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoints** — loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://` без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є bootstrap handoff tokens. Зберігайте їх лише тоді, коли connect використовував bootstrap auth на довіреному транспорті, як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей запитаний викликачем набір scope залишається авторитетним; кешовані scopes повторно використовуються лише тоді, коли клієнт повторно використовує збережений per-device token.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і `device.token.revoke` (потребує scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він відлунює replacement bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим device token, щоб token-only клієнти могли зберегти свою заміну перед повторним підключенням. Shared/admin rotations не відлунюють bearer token.
- Випуск, ротація та відкликання token залишаються обмеженими затвердженим набором ролей, записаним у pairing entry цього пристрою; мутація token не може розширити або націлити роль пристрою, яку pairing approval ніколи не надавало.
- Для paired-device token sessions керування пристроями є self-scoped, якщо викликач також не має `operator.admin`: non-admin callers можуть видаляти/відкликати/ротувати лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scope цільового operator token відносно поточних scopes сесії викликача. Non-admin callers не можуть ротувати або відкликати ширший operator token, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим per-device token.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати настанови щодо дій оператора.

## Ідентичність пристрою + pairing

- Вузли мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібні схвалення сполучення, якщо не ввімкнено
  локальне автосхвалення.
- Автосхвалення сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях самопідключення в межах бекенда/локального контейнера для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості все одно вважаються віддаленими для сполучення й
  потребують схвалення.
- Клієнти WS зазвичай включають ідентичність `device` під час `connect` (оператор +
  вузол). Єдині винятки для оператора без пристрою — це явні шляхи довіри:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, суттєве зниження безпеки).
  - прямі loopback RPC бекенда `gateway-client`, автентифіковані за допомогою спільного
    токена/пароля Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Позначка часу підпису виходить за межі дозволеного відхилення. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Помилка формату/канонікалізації відкритого ключа.  |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додаток до полів пристрою/клієнта/ролі/областей дії/токена/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення
  метаданих сполученого пристрою й надалі керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для підключень WS.
- Клієнти можуть необов’язково закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол надає **повний API Gateway** (статус, канали, моделі, чат,
агент, сесії, вузли, схвалення тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
