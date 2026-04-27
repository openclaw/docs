---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-27T09:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9e076c0624d750497aa3d2aa6f9e2add0ce6b11080490aafde61cf8eb663a95
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS — це **єдина площина керування + транспорт вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свою **роль** + **область** під час
рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженням.
- Першим фреймом **має** бути запит `connect`.
- До підключення фрейми обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо ввімкнено діагностику,
  надто великі вхідні фрейми та повільні вихідні буфери генерують події
  `payload.large` до того, як gateway закриє або відкине відповідний фрейм.
  Ці події зберігають розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, тіло сирого фрейму, токени, cookie або секретні значення.

## Рукостискання (`connect`)

Gateway → клієнт (виклик до підключення):

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

Gateway → клієнт:

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` і `policy` є обов’язковими згідно зі схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджену роль/області, коли вони доступні, і містить `deviceToken`,
коли gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти про узгоджені
дозволи:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені клієнти backend у тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` у прямих loopback-з’єднаннях, якщо
вони автентифікуються за допомогою спільного токена/пароля gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування та не дозволяє застарілим базовим станам CLI/сполучення пристроїв
блокувати локальну backend-роботу, наприклад оновлення сесій підлеглих агентів. Віддалені клієнти,
клієнти з походженням у браузері, клієнти вузлів і явні клієнти з токеном пристрою/ідентичністю пристрою
і надалі використовують звичайні перевірки сполучення та підвищення області.

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

Для вбудованого bootstrap-потоку node/operator основний токен вузла лишається
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим списком дозволених областей bootstrap-оператора
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей bootstrap і надалі
залишаються з префіксом ролі: записи оператора задовольняють лише запити оператора, а ролі, що не є оператором,
і надалі потребують областей під власним префіксом ролі.

### Приклад node

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

Методи gateway RPC, зареєстровані Plugin, можуть запитувати власну область оператора, але
зарезервовані префікси адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область методу — це лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, додатково застосовують суворіші перевірки на рівні команд. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області під час схвалення поверх
базової області методу:

- запити без команд: `operator.pairing`
- запити з командами вузла, що не є exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують свої заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **заявлені можливості** і забезпечує виконання серверних списків дозволу.

## Присутність

- `system-presence` повертає записи, згруповані за ідентичністю пристрою.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть якщо він підключається одночасно як **operator** і **node**.

## Обмеження областями для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються областями, щоб сесії лише з областю pairing або лише для node не отримували пасивно вміст сесій.

- **Фрейми chat, agent і результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Широкомовні повідомлення `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан транспорту лишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** типово обмежуються областями (fail-closed), якщо тільки зареєстрований обробник явно не послаблює це.

Кожне клієнтське з’єднання має власний порядковий номер для кожного клієнта, тож широкомовні повідомлення зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша, ніж наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів plugin/channel. Сприймайте це як виявлення можливостей, а не як повне
перелікування `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає недавній обмежений реєстратор стабільності діагностики. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і ідентифікатори сесій. Він не зберігає текст чату, тіла Webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область читання оператора.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator з областю admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується в потоках relay і pairing.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених у runtime.
    - `usage.status` повертає зведення вікон використання постачальника/залишку квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / embeddings для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає зведення використання по сесіях.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає зведення стану вбудованих + комплектних каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису там, де канал підтримує вихід.
    - `web.login.start` запускає потік входу QR/web для поточного постачальника вебканалу, що підтримує QR.
    - `web.login.wait` очікує завершення цього потоку входу QR/web і після успіху запускає канал.
    - `push.test` надсилає тестовий APNs push до зареєстрованого вузла iOS.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC доставлення вихідних повідомлень для надсилання в конкретний канал/обліковий запис/гілку поза виконавцем чату.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway із керуванням cursor/limit і максимальним обсягом у байтах.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного постачальника мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного постачальника, резервних постачальників і стан конфігурації постачальника.
    - `tts.providers` повертає видимий інвентар постачальників TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного постачальника TTS.
    - `tts.convert` виконує одноразове перетворення тексту в мовлення.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно визначає активні SecretRefs і змінює секретний стан runtime лише за повного успіху.
    - `secrets.resolve` визначає призначення секретів для цільової команди для конкретного набору команда/ціль.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне навантаження конфігурації.
    - `config.schema` повертає навантаження схеми активної конфігурації, яке використовують Control UI та інструменти CLI: схему, `uiHints`, версію та метадані генерації, включно з метаданими схеми plugin + channel, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих міток і тексту довідки, що використовуються UI, включно з вкладеними об’єктами, wildcard, елементами масиву та гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає навантаження пошуку в межах шляху для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення було успішним.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.
  </Accordion>

  <Accordion title="Допоміжні засоби агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і підключенням робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, доступними для агента.
    - `agent.identity.get` повертає ефективну ідентичність помічника для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, коли він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події змін сесії для поточного клієнта WS.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскрипту для конкретних ключів сесії.
    - `sessions.resolve` визначає або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання та спрямування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив видаляються з видимого тексту, XML-навантаження викликів інструментів у звичайному тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і усіченими блоками викликів інструментів) та витеклі ASCII/повноширинні керівні токени моделі видаляються, рядки помічника, що складаються лише з тихих токенів, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надмірно великі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої, очікувані на схвалення, і схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його схваленої ролі та меж областей виклику.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої ролі та меж областей виклику.
  </Accordion>

  <Accordion title="Сполучення вузлів, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють сполучення вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas в межах області.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключених вузлів.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для офлайн/відключених вузлів.
  </Accordion>

  <Accordion title="Сімейства схвалення">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють разові запити схвалення exec, а також пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне на Heartbeat вбудовування тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, такі як `chat.inject` та інші події чату,
  що стосуються лише транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / перевірки доступності.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: широкомовний запит invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-
  інвентар команд для агента.
  - `agentId` необов’язковий; не передавайте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` визначає, яку поверхню націлює основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають native-імена з урахуванням постачальника,
      коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, такі як `/model` і `/m`.
  - `nativeName` містить native-ім’я з урахуванням постачальника, коли воно існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність native-
    команд plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний
  інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст runtime із сесії на стороні сервера замість приймати
    автентифікацію чи контекст доставки, надані викликачем.
  - Відповідь обмежена сесією і відображає те, що активна розмова може використовувати прямо зараз,
    включно з інструментами core, plugin і channel.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` необов’язковий; не передавайте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить відповідність умовам, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` установлює
    папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим конфігурації вносить зміни до значень `skills.entries.<skillKey>`, таких як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують підтвердження, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та остаточним пересиланням схваленого `system.run`,
  gateway відхиляє виконання замість того, щоб довіряти зміненому навантаженню.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: невизначені або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сесій або неоднозначних конфігурацій із кількома каналами).

## Версіонування

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
сталі в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                              | Джерело                                                    |
| ------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                    | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)          | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge       | `10_000` ms                                            | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff перепідключення         | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff перепідключення       | `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Обмеження fast-retry після закриття device-token | `250` ms                                         | `src/gateway/client.ts`                                    |
| Пауза перед примусовим `terminate()`       | `250` ms                                               | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням  | `1_000` ms                                             | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick               | код `4000`, коли тиша перевищує `tickIntervalMs * 2`   | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                             | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect через
  заголовки запиту замість `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для private-ingress повністю пропускає автентифікацію connect зі спільним секретом; не виставляйте цей режим у публічний/недовірений ingress.
- Після pairing Gateway видає **токен пристрою**, обмежений роллю + областями з’єднання.
  Він повертається в `hello-ok.auth.deviceToken` і має зберігатися
  клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Під час повторного підключення з цим **збереженим** токеном пристрою також слід повторно використовувати
  збережений набір схвалених областей для цього токена. Це зберігає вже наданий
  доступ на читання/перевірку/стан і не дозволяє повторним підключенням непомітно звузитися до
  вужчої неявної області лише admin.
- Формування автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище способів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежується **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію через довірений транспорт,
  такий як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір областей, запитаний викликачем, лишається авторитетним; кешовані області повторно використовуються лише тоді,
  коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область `operator.pairing`).
- Видача, ротація та відкликання токенів лишаються обмеженими схваленим набором ролей,
  записаним у записі pairing цього пристрою; зміна токена не може розширити
  або націлитися на роль пристрою, яку pairing ніколи не схвалював.
- Для paired-device token-сесій керування пристроєм обмежується власним контекстом, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/ротувати лише **власний**
  запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей цільового operator-
  токена щодо поточних областей сесії викликача. Викликачі без admin
  не можуть ротувати або відкликати ширший operator-токен, ніж вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу із кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають припинити автоматичні цикли перепідключення та показати інструкції для дій оператора.

## Ідентичність пристрою + pairing

- Вузли мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видають токени для кожного пристрою + ролі.
- Для нових ID пристроїв потрібні схвалення pairing, якщо не ввімкнено локальне auto-approval.
- Auto-approval pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення через tailnet або LAN на тому самому хості все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Клієнти WS зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки для operator без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback `gateway-client` backend RPC, автентифіковані спільним
    токеном/паролем gateway.
- Усі з’єднання мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                    | details.code                     | details.reason           | Значення                                           |
| ------------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`         | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`         | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписався застарілим/неправильним nonce.   |
| `device signature invalid`      | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`      | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу виходить за межі дозволеного зміщення. |
| `device identity mismatch`      | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid`     | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалася перевірка формату/канонізації відкритого ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте навантаження v2, яке містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning метаданих paired-device
  однаково контролює політику команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-з’єднань.
- Клієнти можуть за бажанням закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API gateway** (стан, канали, моделі, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
