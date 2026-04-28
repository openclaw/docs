---
read_when:
    - Реалізація або оновлення клієнтів шлюзового WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-27T14:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: db234f3b04b5a2c3b1a5f4c12f6b551efcdf616968b65b83abba88f86059a339
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS — це **єдина площина керування + транспорт вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, macOS app, вузли iOS/Android, headless
вузли) підключаються через WebSocket і під час рукостискання оголошують свою
**роль** + **область**.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженням.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностику ввімкнено,
  надто великі вхідні кадри та повільні вихідні буфери генерують події
  `payload.large` до того, як gateway закриє підключення або відкине відповідний кадр.
  Ці події містять розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають
  тіло повідомлення, вміст вкладень, необроблене тіло кадру, токени, cookies або секретні значення.

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

`server`, `features`, `snapshot` і `policy` — усі обов’язкові за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
узгоджені роль/області. `canvasHostUrl` є необов’язковим.

Якщо токен пристрою не видається, `hello-ok.auth` повідомляє узгоджені
дозволи без полів токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені внутрішньопроцесні backend-клієнти (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` на прямих local loopback-з’єднаннях, якщо
вони автентифікуються за допомогою спільного токена/пароля gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й він не дає застарілим базовим станам CLI/парування пристроїв
блокувати локальну backend-роботу, наприклад оновлення сеансів підагентів. Віддалені клієнти,
клієнти з походженням із браузера, вузлові клієнти та явні клієнти з токеном пристрою/ідентичністю пристрою
і надалі використовують звичайні перевірки парування та підвищення областей.

Коли видається токен пристрою, `hello-ok` також містить:

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

Для вбудованого bootstrap-потоку node/operator основний токен вузла залишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим списком дозволених областей bootstrap-оператора
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей bootstrap залишаються
прив’язаними до префікса ролі: записи оператора задовольняють лише запити оператора, а ролі,
що не є оператором, як і раніше потребують областей під префіксом власної ролі.

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

## Формат кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області

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

RPC-методи Gateway, зареєстровані Plugin, можуть вимагати власну область operator, але
зарезервовані префікси адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зводяться до `operator.admin`.

Область методу — це лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, поверх цього застосовують суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області під час схвалення поверх
базової області методу:

- запити без команд: `operator.pairing`
- запити з невиконавчими командами вузла: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway сприймає їх як **заяви** і застосовує серверні списки дозволів.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження областей для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються за областями, щоб сеанси
лише з областями парування або лише для вузлів не отримували пасивно вміст сеансів.

- **Кадри чату, агента та результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сеанси без `operator.read` повністю пропускають ці кадри.
- **Широкомовні події `plugin.*`**, визначені Plugin, обмежуються до `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану та транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан транспорту залишався видимим для кожного автентифікованого сеансу.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються за областями (fail-closed), якщо зареєстрований обробник явно не послаблює ці обмеження.

Кожне клієнтське з’єднання має власний порядковий номер для цього клієнта, тому широкомовні події
зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини
потоку подій, відфільтровані за областями.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс експортів методів завантажених
Plugin/каналів. Розглядайте його як виявлення можливостей, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений записувач діагностичної стабільності. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і ідентифікатори сеансів. Він не зберігає текст чату, тіла Webhook, вивід інструментів, необроблені тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібна область читання operator.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з admin-областю.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується потоками relay і парування.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених у runtime.
    - `usage.status` повертає зведення вікон використання провайдера/залишку квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає стан готовності векторної пам’яті / кешованих ембедингів для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликальник явно хоче живу перевірку провайдера ембедингів.
    - `sessions.usage` повертає зведення використання по сеансах.
    - `sessions.usage.timeseries` повертає часовий ряд використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і комплектних каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web-входу для поточного вебканального провайдера з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку QR/web-входу та в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push до зареєстрованого вузла iOS.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це RPC прямої вихідної доставки для надсилання, націленого на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає хвіст налаштованого файлового журналу gateway з керуванням cursor/limit і максимальним числом байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне конфігураційне навантаження Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного мовленнєвого провайдера Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий перелік провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно визначає активні SecretRefs і змінює стан секретів у runtime лише за умови повного успіху.
    - `secrets.resolve` визначає призначення секретів для цільової команди для конкретного набору команда/ціль.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене конфігураційне навантаження.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє й замінює повне конфігураційне навантаження.
    - `config.schema` повертає навантаження живої схеми конфігурації, яке використовують Control UI і інструменти CLI: схема, `uiHints`, версія та метадані генерації, зокрема метадані схем Plugin і каналів, коли runtime може їх завантажити. Схема включає метадані полів `title` / `description`, похідні від тих самих міток і довідкового тексту, які використовує UI, зокрема для вкладених об’єктів, wildcard, елементів масиву та гілок композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають призначену для користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення було успішним.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, зокрема версію після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають wizard первинного налаштування через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і підключенням робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність помічника для агента або сеансу.
    - `agent.wait` очікує завершення запуску й повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сеансами">
    - `sessions.list` повертає поточний індекс сеансів.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події змін сеансів для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події транскрипту/повідомлень для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для конкретних ключів сеансів.
    - `sessions.resolve` визначає або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` — це варіант переривання й спрямування для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу.
    - `sessions.patch` оновлює метадані/перевизначення сеансу.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансів.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення в UI-клієнтах: вбудовані теги директив вилучаються з видимого тексту, XML-навантаження викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витеклі ASCII/повноширинні керівні токени моделі вилучаються, чисті рядки помічника з беззвучними токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки можуть бути замінені заповнювачами.

  </Accordion>

  <Accordion title="Парування пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувальні та схвалені парні пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами парування пристроїв.
    - `device.token.rotate` змінює токен парного пристрою в межах схваленої ролі та обмежень областей викликальника.
    - `device.token.revoke` відкликає токен парного пристрою в межах схваленої ролі та обмежень областей викликальника.

  </Accordion>

  <Accordion title="Парування вузлів, invoke та очікувальна робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють парування вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку парного вузла.
    - `node.invoke` пересилає команду до підключеного вузла.
    - `node.invoke.result` повертає результат запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas, обмежені областю.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують надійною очікувальною роботою для офлайн-/відключених вузлів.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/повторення очікувальних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікувальне схвалення exec і повертає остаточне рішення (або `null` за тайм-аутом).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec у gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через команди relay вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або на наступний Heartbeat вприскування тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, як-от `chat.inject` та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  сеансу, на який оформлено підписку.
- `sessions.changed`: змінився індекс сеансів або їхні метадані.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / контролю доступності.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл парування вузла.
- `node.invoke.request`: широкомовний запит invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл парного пристрою.
- `voicewake.changed`: змінено конфігурацію тригерів wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок автоматичного дозволу.

### Допоміжні методи operator

- Operator можуть викликати `commands.list` (`operator.read`), щоб отримати перелік
  команд runtime для агента.
  - `agentId` є необов’язковим; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлена основна `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають names з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить name команди з урахуванням провайдера, коли він існує.
  - `provider` є необов’язковим і впливає лише на native naming, а також на доступність native
    команд plugin.
  - `includeArgs=false` виключає серіалізовані метадані аргументів із відповіді.
- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів runtime для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний перелік інструментів runtime
  для сеансу.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений контекст runtime із сеансу на стороні сервера замість приймання
    auth або контексту доставки, переданих викликальником.
  - Відповідь обмежена сеансом і відображає, що активна розмова може використовувати просто зараз,
    зокрема core-, plugin- та канальні інструменти.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  перелік Skills для агента.
  - `agentId` є необов’язковим; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття необроблених секретних значень.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config вносить зміни у значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Operator-клієнти виконують підтвердження, викликаючи `exec.approval.resolve` (потребує області `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликальник змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним пересиланням схваленого `system.run`, gateway
  відхиляє запуск замість того, щоб довіряти зміненому навантаженню.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: невизначені або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сеансу, якщо не вдається визначити зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сеансів або неоднозначних багатоканальних конфігурацій).

## Версіонування

- `PROTOCOL_VERSION` знаходиться в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Ці значення
стабільні в межах протоколу v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                             | Джерело                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)         | `30_000` мс                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` мс                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff для повторного підключення | `1_000` мс                                        | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff для повторного підключення | `30_000` мс                                     | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття через device-token | `250` мс                                      | `src/gateway/client.ts`                                    |
| Пауза graceful stop перед `terminate()`   | `250` мс                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут за замовчуванням для `stopAndWait()` | `1_000` мс                                         | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` мс                                       | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує фактичні значення `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації під час connect на основі
  заголовків запиту, а не `connect.params.auth.*`.
- Приватний ingress із `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect через спільний секрет; не відкривайте цей режим у публічному або ненадійному ingress.
- Після парування Gateway видає **токен пристрою**, обмежений роллю + областями
  цього підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  бути збережений клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений набір схвалених областей для цього токена. Це зберігає доступ на
  читання/перевірку/перегляд стану, який уже було надано, і не дає повторним підключенням
  непомітно звузитися до вужчої неявної області лише для admin.
- Побудова auth під час connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (ключ:
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене лише для **довірених endpoint** —
    loopback або `wss://` із зафіксованим `tlsFingerprint`. Публічний `wss://`
    без фіксації не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-auth через довірений транспорт,
  такий як `wss://` або loopback/local pairing.
- Якщо клієнт передає **явний** `deviceToken` або явні `scopes`, цей
  набір областей, запитаний викликальником, залишається авторитетним; кешовані області повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна змінювати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потребує області `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він повертає токен-носій
  заміни лише для викликів із того самого пристрою, уже автентифікованих
  цим токеном пристрою, щоб клієнти, які працюють лише з токеном, могли зберегти заміну до
  повторного підключення. Ротації через shared/admin не повертають токен-носій.
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у записі парування цього пристрою; зміна токена не може розширити або
  націлитися на роль пристрою, яку ніколи не було схвалено під час парування.
- Для сеансів токенів парних пристроїв керування пристроєм є самообмеженим, якщо
  викликальник також не має `operator.admin`: викликальники без admin можуть видаляти/відкликати/змінювати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей
  цільового operator-токена щодо поточних областей сеансу викликальника. Викликальники без admin
  не можуть змінювати або відкликати ширший operator-токен, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдалася, клієнти мають припинити цикли автоматичного повторного підключення й показати оператору вказівки щодо подальших дій.

## Ідентичність пристрою + парування

- Вузли мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні схвалення парування, якщо не ввімкнено локальне
  автосхвалення.
- Автосхвалення парування зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях self-connect backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення через tailnet або LAN на тому самому хості все одно вважаються віддаленими для парування й
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки для operator без device — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator у Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback-`gateway-client` backend RPC, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підпису до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Часова мітка підпису виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалася перевірка формату/канонізації публічного ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте навантаження v2, яке містить серверний nonce.
- Надсилайте той самий nonce в `connect.params.device.nonce`.
- Бажаним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і надалі приймаються для сумісності, але закріплення метаданих
  парного пристрою, як і раніше, керує політикою команд під час повторного підключення.

## TLS + фіксація

- Для WS-підключень підтримується TLS.
- Клієнти за бажанням можуть фіксувати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`,
  а також `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API gateway** (status, канали, моделі, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
