---
read_when:
    - Реалізація або оновлення клієнтів шлюзу WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-27T12:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cca49f3c8612e719ad97e1748cb263e8824e0e4c59548ba0809cb0bc095f363
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, веб-інтерфейс, застосунок macOS, вузли iOS/Android, headless-вузли)
підключаються через WebSocket і оголошують свою **роль** + **область дії** під
час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-корисним навантаженням.
- Перший фрейм **має** бути запитом `connect`.
- Розмір фреймів до підключення обмежений 64 KiB. Після успішного рукостискання клієнти
  повинні дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери породжують події `payload.large`
  до того, як шлюз закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, сире тіло фрейму, токени, cookie або секретні значення.

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

`server`, `features`, `snapshot` і `policy` є обов’язковими згідно зі схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також є обов’язковим і повідомляє
узгоджені роль/області дії. `canvasHostUrl` є необов’язковим.

Коли токен пристрою не видається, `hello-ok.auth` повідомляє узгоджені
дозволи без полів токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти того ж процесу (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` у прямих loopback-підключеннях, якщо
вони автентифікуються за допомогою спільного токена/пароля Gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й дає змогу уникнути того, щоб застарілі базові значення
спарювання CLI/пристрою блокували локальну backend-роботу, як-от оновлення сесій субагентів. Віддалені клієнти,
клієнти з походженням із браузера, клієнти вузлів і явні клієнти з токеном пристрою/ідентичністю пристрою
усе ще використовують звичайні перевірки спарювання та підвищення області дії.

Коли токен пристрою видається, `hello-ok` також містить:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час передавання довіреного bootstrap `hello-ok.auth` також може містити додаткові
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

Для вбудованого bootstrap-потоку вузол/оператор первинний токен вузла лишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим списком
дозволених bootstrap-областей оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap-областей дії лишаються
прив’язаними до префікса ролі: записи оператора задовольняють лише запити оператора, а ролям,
що не є оператором, усе ще потрібні області дії під префіксом їхньої власної ролі.

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

## Фреймування

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами вимагають **ключі ідемпотентності** (див. схему).

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

`talk.config` з `includeSecrets: true` вимагає `operator.talk.secrets`
(або `operator.admin`).

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власну область дії оператора, але
зарезервовані основні admin-префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область дії методу — лише перший рівень перевірки. Деякі slash-команди, доступні через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з командами вузла, що не належать до exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **заявлені можливості** й застосовує списки дозволів на боці сервера.

## Presence

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть якщо він підключається і як **operator**, і як **node**.

## Обмеження областю дії для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються областями дії, щоб сесії лише з областю спарювання або лише вузлові сесії пасивно не отримували вміст сесій.

- **Фрейми чату, агента та результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Широкомовні `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються без обмежень, щоб стан транспорту залишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються областю дії (режим fail-closed), якщо зареєстрований обробник явно не послаблює це.

Кожне клієнтське підключення підтримує власний порядковий номер на клієнта, тому широкомовні повідомлення зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями дії.

## Поширені сімейства RPC-методів

Публічна WS-поверхня ширша, ніж наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, зібраним із `src/gateway/server-methods-list.ts` плюс експортованих методів завантажених Plugin/каналів. Розглядайте це як виявлення можливостей, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає недавній обмежений записувач діагностичної стабільності. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin та ідентифікатори сесій. Він не зберігає текст чату, тіла Webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область дії operator read.
    - `status` повертає підсумок Gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з admin-областю дії.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, яка використовується потоками relay і pairing.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання.
    - `usage.status` повертає підсумки вікон використання провайдера/залишкової квоти.
    - `usage.cost` повертає агреговані підсумки вартості використання для діапазону дат.
    - `doctor.memory.status` повертає стан готовності векторної пам’яті / кешованих ембедингів для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче живу перевірку провайдера ембедингів.
    - `sessions.usage` повертає підсумки використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає підсумки стану вбудованих і включених каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису там, де канал підтримує вихід.
    - `web.login.start` запускає QR-/веб-потік входу для поточного провайдера вебканалу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR-/веб-потоку входу та в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push до зареєстрованого вузла iOS.
    - `voicewake.get` повертає збережені тригери слів активації.
    - `voicewake.set` оновлює тригери слів активації та транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC доставки назовні для надсилань, націлених на канал/обліковий запис/гілку, поза виконувачем чату.
    - `logs.tail` повертає tail налаштованого файлового журналу Gateway з контролем cursor/limit і max-byte.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` вимагає `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активний провайдер мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно резолвить активні SecretRefs і замінює стан секретів під час виконання лише в разі повного успіху.
    - `secrets.resolve` резолвить призначення секретів, націлені на команди, для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує валідований конфігураційний payload.
    - `config.patch` зливає часткове оновлення конфігурації.
    - `config.apply` валідовує й замінює повний конфігураційний payload.
    - `config.schema` повертає payload схеми живої конфігурації, який використовують Control UI та інструменти CLI: схема, `uiHints`, версія та метадані генерації, включно з метаданими схем Plugin + каналів, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих міток і довідкового тексту, які використовує UI, зокрема для вкладених об’єктів, wildcard, елементів масиву та гілок композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає payload пошуку з обмеженням шляхом для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, зіставлену підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також зіставлені `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення було успішним.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, включно з версією, що працює після перезапуску, якщо вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.
  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, доступними для агента.
    - `agent.identity.get` повертає ефективну ідентичність помічника для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, якщо він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події змін сесії для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події стенограми/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди стенограм для конкретних ключів сесій.
    - `sessions.resolve` резолвить або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання й коригування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/override сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив прибираються з видимого тексту, XML-payload викликів інструментів у plain text (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і усічені блоки викликів інструментів) та витоки ASCII/full-width токенів керування моделлю прибираються, чисті рядки помічника з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані й схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі та меж області дії викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його схваленої ролі та меж області дії викликача.
  </Accordion>

  <Accordion title="Спарювання вузлів, invoke і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку спареного вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas з обмеженням областю дії.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою очікуваною роботою для офлайнових/відключених вузлів.
  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють разові запити схвалення exec, а також пошук/повторення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або на наступний Heartbeat введення тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші події чату,
  пов’язані лише зі стенограмою.
- `session.message` і `session.tool`: оновлення стенограми/потоку подій для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / перевірки життєздатності.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання вузла.
- `node.invoke.request`: широкомовний запит invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: змінилася конфігурація тригерів слів активації.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення Plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати
  інвентар команд середовища виконання для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлено основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають обізнані з провайдером native-імена,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить обізнану з провайдером native-назву команди, коли вона існує.
  - `provider` є необов’язковим і впливає лише на native-іменування та доступність native-команд
    Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів середовища виконання для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний інвентар інструментів середовища виконання
  для сесії.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений контекст середовища виконання із сесії на боці сервера, а не приймає
    автентифікацію або контекст доставки, надані викликачем.
  - Відповідь прив’язана до сесії й відображає те, що активна розмова може використовувати прямо зараз,
    зокрема інструменти core, Plugin і каналів.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill до каталогу `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим конфігурації змінює значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти-оператори виконують підтвердження викликом `exec.approval.resolve` (потрібна область дії `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним схваленим пересиланням `system.run`, шлюз
  відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: невизначені або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в межах сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сесій або неоднозначних конфігурацій кількох каналів).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Референсний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Вони
стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                              | Джерело                                                    |
| ------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                    | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                   | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge       | `10_000` ms                                            | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення  | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення| `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` ms                                             | `src/gateway/client.ts`                                    |
| Пільговий інтервал force-stop перед `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick               | код `4000`, коли тиша перевищує `tickIntervalMs * 2`  | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                             | `src/gateway/server-constants.ts`                          |

Сервер оголошує фактичні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти повинні дотримуватися цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація Gateway за спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect через
  заголовки запиту замість `connect.params.auth.*`.
- Приватний ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect зі спільним секретом; не виставляйте цей режим у публічний/недовірений ingress.
- Після спарювання Gateway видає **токен пристрою** з обмеженням за роллю підключення + областями дії. Він повертається в `hello-ok.auth.deviceToken`, і клієнт повинен зберігати його для майбутніх підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також повинно повторно використовувати
  збережений схвалений набір областей дії для цього токена. Це зберігає вже наданий доступ на
  читання/перевірку/стан і запобігає тихому звуженню повторних підключень до
  вужчої неявної області дії лише admin.
- Збирання автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається, лише коли жоден із варіантів вище не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт передає **явний** `deviceToken` або явні `scopes`, цей запитаний викликачем
  набір областей дії лишається авторитетним; кешовані області дії повторно використовуються лише тоді,
  коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристрою можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область дії `operator.pairing`).
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у записі спарювання цього пристрою; зміна токена не може розширити
  або націлитися на роль пристрою, яку схвалення спарювання ніколи не надавало.
- Для сесій із токеном спареного пристрою керування пристроєм обмежується самим пристроєм, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей дії
  цільового operator-токена відносно поточних областей дії сесії викликача. Викликачі без admin
  не можуть ротувати або відкликати ширший operator-токен, ніж той, який вони вже мають.
- Збої автентифікації містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдасться, клієнти повинні зупинити автоматичні цикли повторного підключення й показати інструкції щодо дій оператора.

## Ідентичність пристрою + спарювання

- Вузли повинні включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібні схвалення спарювання, якщо не ввімкнено локальне auto-approval.
- Auto-approval спарювання зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях локального самопідключення backend/контейнера для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості все одно вважаються віддаленими для спарювання та
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки для operator без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна operator-автентифікація Control UI для `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - backend-RPC `gateway-client` на прямому loopback, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які досі використовують поведінку підписування до виклику challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу поза дозволеним відхиленням.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося виконати форматування/канонізацію відкритого ключа. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріплювати відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
