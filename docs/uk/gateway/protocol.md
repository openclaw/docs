---
read_when:
    - Впровадження або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket для Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-28T11:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab961f1ec245e93f5f88a641f558124c36c4c828ba66ff3a2ccd41ba1f12b646
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
- Кадри до підключення обмежені 64 КіБ. Після успішного рукостискання клієнтам
  слід дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надмірно великі вхідні кадри та повільні вихідні буфери генерують події
  `payload.large` перед тим, як Gateway закриє або відкине відповідний кадр.
  Ці події зберігають розміри, обмеження, поверхні та безпечні коди причин.
  Вони не зберігають тіло повідомлення, вміст вкладень, необроблене тіло кадру,
  токени, cookie або секретні значення.

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

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
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

Довірені клієнти бекенду в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` для прямих loopback-підключень,
коли автентифікуються спільним токеном/паролем Gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування, і він запобігає тому, щоб застарілі базові
дані сполучення CLI/пристрою блокували локальну роботу бекенду, як-от оновлення
сеансів субагентів. Віддалені клієнти, клієнти з браузерним origin, клієнти-вузли
та явні клієнти з токеном пристрою/ідентичністю пристрою все ще використовують
звичайні перевірки сполучення й підвищення областей дії.

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
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим списком
дозволів оператора bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей дії bootstrap
залишаються префіксованими роллю: записи оператора задовольняють лише запити
оператора, а неоператорським ролям і далі потрібні області дії з власним
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

## Фреймінг

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

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

Зареєстровані Plugin методи Gateway RPC можуть запитувати власну область дії
оператора, але зарезервовані префікси адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди розв’язуються до
`operator.admin`.

Область дії методу є лише першою перевіркою. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команди додатково. Наприклад,
постійні записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення
поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (node)

Вузли оголошують претензії на можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **претензії** та застосовує серверні списки дозволів.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб інтерфейси могли показувати один рядок на пристрій
  навіть коли він підключається і як **оператор**, і як **вузол**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; сполучені вузли також можуть повідомляти
  тривку фонову присутність, коли довірена подія вузла оновлює їхні метадані сполучення.

### Фонова подія життєздатності вузла

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що сполучений вузол був
активним під час фонового пробудження, не позначаючи його як підключений.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки тригерів Gateway нормалізує до
`background` перед збереженням. Подія є тривкою лише для автентифікованих сеансів пристроїв-вузлів;
сеанси без пристрою або без сполучення повертають `handled: false`.

Успішні Gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші Gateway можуть усе ще повертати `{ "ok": true }` для `node.event`; клієнтам слід трактувати це як
підтверджений RPC, а не як тривке збереження присутності.

## Обмеження областей дії широкомовних подій

Широкомовні WebSocket-події, які сервер надсилає клієнтам, обмежуються областями дії, щоб сеанси з областю дії сполучення або лише вузлові сеанси пасивно не отримували вміст сеансів.

- **Кадри чату, агента та результатів інструментів** (включно зі стримованими подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сеанси без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin широкомовлення `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються необмеженими, щоб стан транспорту був видимим для кожного автентифікованого сеансу.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для кожного клієнта, щоб широкомовлення зберігали монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні відфільтровані за областями дії підмножини потоку подій.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/каналів. Трактуйте його як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і ідентифікатори сеансів. Він не зберігає текст чату, тіла webhook, виводи інструментів, необроблені тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область дії читання оператора.
    - `status` повертає зведення Gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з областю дії admin.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, що використовується потоками relay і сполучення.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв оператора/вузла.
    - `system-event` додає системну подію та може оновлювати/широкомовно передавати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на Gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений під час виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спочатку, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення вікон використання провайдера/залишкової квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного стандартного робочого простору агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче live ping провайдера embedding.
    - `sessions.usage` повертає зведення використання за сеансами.
    - `sessions.usage.timeseries` повертає часовий ряд використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих + комплектних каналів/Plugin.
    - `channels.logout` виходить із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного web-провайдера каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web-потоку входу та в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push на зареєстрований вузол iOS.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим outbound-delivery RPC для надсилань, націлених на канал/обліковий запис/тред, поза chat runner.
    - `logs.tail` повертає налаштований фрагмент файлу журналу Gateway з керуванням cursor/limit і max-byte.

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
    - `secrets.reload` повторно розв'язує активні SecretRefs і замінює runtime-стан секретів лише за повного успіху.
    - `secrets.resolve` розв'язує призначення секретів для цільових команд для певного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують інструменти Control UI та CLI: schema, `uiHints`, version і метадані generation, включно з метаданими схеми plugin + каналу, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, включно з вкладеними object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований path, неглибокий вузол schema, matched hint + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля перевірки (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів надають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочої області">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив'язкою робочої області.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap робочої області, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
    - `agent.wait` очікує завершення запуску та повертає кінцевий знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сеансом">
    - `sessions.list` повертає поточний індекс сеансів.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сеансів для поточного клієнта WS.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для певних ключів сеансів.
    - `sessions.resolve` розв'язує або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` є варіантом interrupt-and-steer для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу.
    - `sessions.patch` оновлює метадані/перевизначення сеансу.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансу.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтами UI: inline directive tags вилучаються з видимого тексту, plain-text XML-корисні навантаження tool-call (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками tool-call) та витеклі ASCII/full-width токени керування моделі вилучаються, рядки асистента лише з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі та меж області дії викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його схваленої ролі та меж області дії викликача.

  </Accordion>

  <Accordion title="Спарювання вузлів, виклик і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку спареного вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює токени scoped canvas-capability.
    - `node.pending.pull` і `node.pending.ack` є API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною очікуваною роботою для offline/disconnected вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/повтор очікуваних схвалень.
    - `exec.approval.waitDecision` очікує одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалень exec для Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою схвалень exec через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat ін'єкцію wake-тексту; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject` та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/event-stream для підписаного сеансу.
- `sessions.changed`: індекс сеансів або метадані змінилися.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична keepalive / liveness подія.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/job Cron.
- `shutdown`: сповіщення про вимкнення Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурація тригерів wake-word змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи вузлів

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи операторів

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` є необов'язковим; опустіть його, щоб читати робочу область агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлюється основний `name`:
    - `text` повертає основний токен текстової команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають provider-aware native назви
      коли доступні
  - `textAliases` містить точні slash aliases, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware native назву команди, коли така існує.
  - `provider` є необов'язковим і впливає лише на native naming та доступність native plugin
    команд.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime catalog інструментів для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов'язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective
  інвентар інструментів для сеансу.
  - `sessionKey` є обов'язковим.
  - Gateway виводить довірений runtime-контекст із сеансу на боці сервера замість приймати
    auth або delivery context, надані викликачем.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати зараз,
    включно з core, plugin і channel tools.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` є необов'язковим; опустіть його, щоб читати робочу область агента за замовчуванням.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    sanitized install options без розкриття raw secret values.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих discovery ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у директорію `skills/` робочої області агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочій області агента за замовчуванням.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Представлення `models.list`

`models.list` приймає необов'язковий параметр `view`:

- Не вказано або `"default"`: поточна поведінка runtime. Якщо налаштовано `agents.defaults.models`, відповіддю є дозволений каталог; інакше відповіддю є повний каталог Gateway.
- `"configured"`: поведінка розміру picker. Якщо налаштовано `agents.defaults.models`, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних picker моделей.

## Затвердження exec

- Коли запит exec потребує затвердження, gateway транслює `exec.approval.requested`.
- Клієнти оператора вирішують це, викликаючи `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після затвердження переадресовані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальною затвердженою переадресацією `system.run`, gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Fallback доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв'язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сесії, коли не вдається розв'язати жодний зовнішній маршрут доставки (наприклад, внутрішні/webchat-сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення є
стабільними в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                     | Джерело                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp швидкого повтору після закриття device-token | `250` ms                                     | `src/gateway/client.ts`                                    |
| Grace force-stop перед `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень
замість значень за замовчуванням до handshake.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect зі спільним секретом;
  не відкривайте цей режим у публічному/недовіреному ingress.
- Після pairing Gateway видає **device token** із прив'язкою до ролі підключення
  + scopes. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  затверджений набір scopes для цього token. Це зберігає вже наданий доступ
  read/probe/status і уникає тихого звуження повторних підключень до
  вужчого неявного scope лише адміністратора.
- Складання автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється за пріоритетом: спочатку явний спільний token,
    потім явний `deviceToken`, потім збережений token для пристрою (ключований за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не розв'язав
    `auth.token`. Спільний token або будь-який розв'язаний device token пригнічує його.
  - Автоматичне підвищення збереженого device token під час одноразового
    повтору `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є bootstrap handoff token.
  Зберігайте їх лише тоді, коли connect використовував bootstrap-автентифікацію через довірений transport,
  такий як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scopes залишається авторитетним; кешовані scopes лише
  повторно використовуються, коли клієнт повторно використовує збережений token для пристрою.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  device token, щоб клієнти лише з token могли зберегти заміну перед
  повторним підключенням. Ротації shared/admin не віддзеркалюють bearer token.
- Видача, ротація та відкликання token залишаються обмеженими затвердженим набором ролей,
  записаним у pairing-записі цього пристрою; мутація token не може розширити або
  націлити роль пристрою, яку pairing approval ніколи не надавав.
- Для сесій paired-device token керування пристроями є self-scoped, якщо
  викликач також не має `operator.admin`: не-admin викликачі можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scopes operator
  token проти поточних scopes сесії викликача. Не-admin викликачі
  не можуть ротувати або відкликати ширший operator token, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати один обмежений повтор із кешованим token для пристрою.
  - Якщо цей повтор не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору настанови щодо дії.

## Ідентичність пристрою + pairing

- Nodes мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка keypair.
- Gateways видають tokens на пристрій + роль.
- Pairing approvals потрібні для нових device IDs, якщо не ввімкнено локальне auto-approval.
- Pairing auto-approval зосереджено на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local self-connect шлях для
  довірених helper-потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для pairing і
  потребують approval.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки operator без device — явні trust paths:
  - `gateway.controlUi.allowInsecureAuth=true` для localhost-only сумісності з insecure HTTP.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серйозне зниження безпеки).
  - direct-loopback backend RPC `gateway-client`, автентифіковані спільним
    gateway token/password.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для legacy-клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
detail-коди `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожній). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав зі stale/неправильним nonce.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає v2 payload.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана timestamp поза допустимим skew.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку public key.     |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося форматування/канонікалізація public key. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте payload v2, який містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив'язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Legacy-підписи `v2` залишаються прийнятими для сумісності, але pinning metadata paired-device
  усе ще керує command policy під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть необов'язково закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей protocol відкриває **повний gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов'язане

- [Протокол моста](/uk/gateway/bridge-protocol)
- [Операційний довідник Gateway](/uk/gateway)
