---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-29T04:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 713a72b15f029aad00a4c6427fefeef08643aee830f23eac05e53b50f43d048c
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Перший кадр **обов’язково** має бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні кадри та повільні вихідні буфери створюють події `payload.large`
  до того, як gateway закриє або відкине відповідний кадр. Ці події зберігають
  розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло кадру, токени, cookie або секретні
  значення.

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
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджену роль/області дії. `canvasHostUrl` необов’язковий.

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
`client.mode: "backend"`) можуть опускати `device` на прямих loopback-з’єднаннях,
коли вони автентифікуються спільним токеном/паролем gateway. Цей шлях
зарезервовано для внутрішніх RPC площини керування, і він не дає застарілим
базовим даним спарювання CLI/пристрою блокувати локальну backend-роботу, як-от
оновлення сеансів під агентів. Віддалені клієнти, клієнти з браузерним origin,
клієнти-вузли та явні клієнти з токеном пристрою/ідентичністю пристрою й надалі
використовують звичайні перевірки спарювання та підвищення областей дії.

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
bootstrap-списком дозволів оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-перевірки областей дії
лишаються з префіксом ролі: записи оператора задовольняють лише запити
оператора, а неоператорським ролям усе ще потрібні області дії під власним
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

## Кадрування

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

Зареєстровані Plugin методи Gateway RPC можуть запитувати власну область дії
оператора, але зарезервовані префікси адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) завжди зводяться до `operator.admin`.

Область дії методу є лише першою перевіркою. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки на рівні команди поверх цього.
Наприклад, постійні записи `/config set` і `/config unset` потребують
`operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час
затвердження поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (вузол)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заявки** та застосовує серверні списки дозволів.

## Присутність

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  час свого поточного підключення як `lastSeenAtMs` з причиною `connect`; спарені вузли також можуть повідомляти
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
`significant_location`, `manual` або `connect`. Невідомі рядки trigger gateway нормалізує до
`background` перед збереженням. Подія є стійкою лише для автентифікованих
сеансів пристроїв-вузлів; сеанси без пристрою або без спарювання повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway усе ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як стійке збереження присутності.

## Області дії широкомовних подій

Широкомовні події WebSocket, що надсилаються сервером, обмежуються областями дії, щоб сеанси, обмежені спарюванням або лише вузлом, не отримували пасивно вміст сеансу.

- **Кадри чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сеанси без `operator.read` повністю пропускають ці кадри.
- **Визначені Plugin широкомовні події `plugin.*`** обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) лишаються необмеженими, щоб справність транспорту була видимою кожному автентифікованому сеансу.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення зберігає власний порядковий номер для клієнта, щоб широкомовлення зберігали монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні відфільтровані за областями дії підмножини потоку подій.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним списком
виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс експортів
методів завантажених Plugin/каналів. Сприймайте його як виявлення можливостей,
а не як повний перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` повертає кешований або щойно перевірений знімок справності gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і ідентифікатори сеансів. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область дії читання оператора.
    - `status` повертає підсумок gateway у стилі `/status`; чутливі поля включаються лише для клієнтів-операторів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується потоками relay і спарювання.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію й може оновити/поширити контекст присутності.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` перемикає обробку heartbeat на gateway.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` повертає дозволений середовищем виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спершу, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдерів/підсумки залишку квоти.
    - `usage.cost` повертає агреговані підсумки вартості використання за діапазон дат.
    - `doctor.memory.status` повертає готовність vector-memory / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping провайдера embedding.
    - `sessions.usage` повертає підсумки використання за сеансами.
    - `sessions.usage.timeseries` повертає часовий ряд використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення статусів вбудованих і комплектних каналів/plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web-входу для поточного постачальника web-каналу з підтримкою QR.
    - `web.login.wait` чекає на завершення цього потоку QR/web-входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Обмін повідомленнями та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з керуванням cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` задає/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного постачальника мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного постачальника, резервних постачальників і стан конфігурації постачальника.
    - `tts.providers` повертає видимий інвентар постачальників TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного постачальника TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно вирішує активні SecretRefs і замінює стан runtime-секретів лише за повного успіху.
    - `secrets.resolve` вирішує призначення секретів для цільових команд для певного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує валідоване навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідує та замінює повне навантаження конфігурації.
    - `config.schema` повертає активне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: schema, `uiHints`, version і метадані generation, включно з метаданими схеми plugin + channel, коли runtime може її завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, включно з вкладеним object, wildcard, array-item і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і безпосередні зведення дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів відкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає найновіший кешований sentinel перезапуску оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та runtime-метаданими.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують початковими файлами робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність assistant для агента або сесії.
    - `agent.wait` чекає завершення запуску та повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для певних ключів сесій.
    - `sessions.resolve` вирішує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання та скеровування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення клієнтам UI: inline-теги директив вилучаються з видимого тексту, plain-text XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витеклі ASCII/full-width токени керування моделі вилучаються, суто silent-token рядки assistant, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає pending і approved спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його approved role і caller scope.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його approved role і caller scope.

  </Accordion>

  <Accordion title="Спарювання node, виклик і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання node і bootstrap verification.
    - `node.list` і `node.describe` повертають стан відомих/підключених node.
    - `node.rename` оновлює мітку спареного node.
    - `node.invoke` пересилає команду до підключеного node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять із node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени scoped canvas-capability.
    - `node.pending.pull` і `node.pending.ack` — це API черги connected-node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/відтворення pending approval.
    - `exec.approval.waitDecision` чекає на одне pending exec approval і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики gateway exec approval.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою exec approval через node relay commands.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють plugin-defined потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat ін’єкцію wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject`, та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення transcript/event-stream для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання node.
- `node.invoke.request`: трансляція запиту invoke node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригера wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл exec approval.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл plugin approval.

### Допоміжні методи node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-інвентар команд для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню спрямовано основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають provider-aware native names, коли вони доступні
  - `textAliases` переносить точні slash aliases, як-от `/model` і `/m`.
  - `nativeName` переносить provider-aware native command name, коли він існує.
  - `provider` є необов’язковим і впливає лише на native naming, а також доступність native plugin command.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів для сесії.
  - `sessionKey` є обов’язковим.
  - gateway виводить довірений runtime-контекст із сесії на боці сервера замість приймання caller-supplied auth або delivery context.
  - Відповідь обмежена сесією та відображає те, що активна розмова може використовувати прямо зараз, включно з інструментами core, plugin і channel.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар skill для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить eligibility, відсутні requirements, config checks і sanitized install options без розкриття raw secret values.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на host gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один tracked slug або всі tracked встановлення ClawHub у робочому просторі агента за замовчуванням.
  - Режим конфігурації патчить значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна поведінка під час виконання. Якщо налаштовано `agents.defaults.models`, відповіддю буде дозволений каталог; інакше відповіддю буде повний каталог Gateway.
- `"configured"`: поведінка, розрахована на розмір засобу вибору. Якщо налаштовано `agents.defaults.models`, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли налаштованих рядків моделей немає.
- `"all"`: повний каталог Gateway в обхід `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних засобів вибору моделей.

## Затвердження exec

- Коли запит exec потребує затвердження, gateway транслює `exec.approval.requested`.
- Клієнти оператора вирішують його викликом `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після затвердження переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та остаточним затвердженим пересиланням `system.run`, gateway
  відхиляє запуск замість довіри зміненому корисному навантаженню.

## Резервний варіант доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сеансі, коли неможливо визначити зовнішній маршрут доставки (наприклад, внутрішні/вебчат-сеанси або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Значення
стабільні в protocol v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                                                   |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| Час очікування запиту (на RPC)            | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Час очікування preauth / connect-challenge | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початкова затримка повторного підключення | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Максимальна затримка повторного підключення | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Обмеження швидкої повторної спроби після закриття через токен пристрою | `250` ms | `src/gateway/client.ts`                                                                   |
| Пільговий період force-stop перед `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Типовий час очікування `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Типовий інтервал такту (до `hello-ok`)    | `30_000` ms                                          | `src/gateway/client.ts`                                                                   |
| Закриття через тайм-аут такту             | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                         |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації підключення з
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення зі спільним секретом;
  не відкривайте цей режим на публічному/ненадійному ingress.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю з’єднання
  + областями. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір областей для цього токена. Це зберігає доступ читання/перевірки/статусу,
  який уже було надано, і запобігає непомітному звуженню повторних підключень до
  вужчої неявної області лише для адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не відповідає вимогам.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей лишається авторитетним; кешовані області лише
  повторно використовуються, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти заміну перед
  повторним підключенням. Спільні/адміністративні ротації не віддзеркалюють bearer-токен.
- Випуск, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі спарювання цього пристрою; зміна токена не може розширити або
  націлити роль пристрою, яку затвердження спарювання ніколи не надавало.
- Для сеансів токенів спарених пристроїв керування пристроями має самостійну область, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/обертати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей цільового operator
  token щодо поточних областей сеансу викликача. Викликачі без прав адміністратора
  не можуть обертати або відкликати ширший operator token, ніж уже мають.
- Збої автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати оператору рекомендації щодо дій.

## Ідентичність пристрою + спарювання

- Node мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateway видають токени на пристрій + роль.
- Затвердження спарювання потрібні для нових ідентифікаторів пристроїв, якщо локальне автоматичне затвердження
  не ввімкнено.
- Автоматичне затвердження спарювання зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях самопідключення всередині backend/container для
  довірених helper-потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще розглядаються як віддалені для спарювання і
  потребують затвердження.
- WS-клієнти зазвичай містять ідентичність `device` під час `connect` (operator +
  node). Єдині винятки для операторів без пристрою — явні довірчі шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback backend RPC `gateway-client`, автентифіковані спільним
    токеном/паролем gateway.
- Усі з’єднання мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристроїв

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписаний timestamp виходить за межі дозволеного skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалися. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який містить nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення metadata
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-з’єднань.
- Клієнти можуть за потреби закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  разом із `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Обсяг

Цей протокол надає **повний API Gateway** (статус, канали, моделі, чат,
агент, сесії, вузли, схвалення тощо). Точну поверхню визначено схемами
TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
