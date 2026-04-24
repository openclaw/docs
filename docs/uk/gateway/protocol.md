---
read_when:
    - Реалізація або оновлення WS-клієнтів gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: handshake, фрейми, версіонування'
title: протокол Gateway
x-i18n:
    generated_at: "2026-04-24T18:10:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS — це **єдина control plane + node transport** для
OpenClaw. Усі клієнти (CLI, web UI, застосунок macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свою **role** та **scope** під
час handshake.

## Transport

- WebSocket, текстові фрейми з JSON payload.
- Перший фрейм **має** бути запитом `connect`.
- Розмір фреймів до підключення обмежено 64 KiB. Після успішного handshake клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностика ввімкнена,
  надто великі вхідні фрейми та повільні вихідні буфери генерують події
  `payload.large` до того, як gateway закриє з’єднання або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, сире тіло фрейма, токени, cookies або секретні значення.

## Handshake (connect)

Gateway → Client (виклик до підключення):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджені role/scopes, коли вони доступні, і містить `deviceToken`,
коли gateway його видає.

Коли device token не видається, `hello-ok.auth` все одно може повідомляти про узгоджені
permissions:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Коли device token видається, `hello-ok` також містить:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час trusted bootstrap handoff `hello-ok.auth` також може містити додаткові
обмежені записи role у `deviceTokens`:

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

Для вбудованого bootstrap flow node/operator основний node token лишається з
`scopes: []`, а будь-який переданий operator token лишається обмеженим списком
дозволених bootstrap-операторів (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap scope залишаються
прив’язаними до префікса role: записи operator задовольняють лише запити operator, а ролі,
що не є operator, усе ще потребують scopes під префіксом власної role.

### Приклад Node

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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **idempotency keys** (див. схему).

## Roles + scopes

### Roles

- `operator` = клієнт control plane (CLI/UI/automation).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Scopes (operator)

Поширені scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

Методи Gateway RPC, зареєстровані Plugin, можуть запитувати власний operator scope, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope методу — лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, застосовують додаткові, суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами node, що не є exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують claims можливостей під час підключення:

- `caps`: категорії можливостей верхнього рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: деталізовані перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **claims** і застосовує allowlist на боці сервера.

## Presence

- `system-presence` повертає записи, ключовані за identity пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається одночасно як **operator** і **node**.

## Scope для broadcast event

Серверні WebSocket broadcast event захищені scopes, щоб сесії лише з pairing scope або лише node пасивно не отримували вміст сесій.

- **Фрейми chat, agent і tool-result** (зокрема потокові події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Broadcast `plugin.*`, визначені Plugin**, захищені `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й transport** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан transport лишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast event** типово обмежуються scopes (fail-closed), якщо зареєстрований обробник явно не послаблює ці обмеження.

Кожне клієнтське з’єднання має власний номер послідовності для клієнта, тож broadcast зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scope.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша за наведені вище приклади handshake/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, зібраним із `src/gateway/server-methods-list.ts` плюс експортів методів завантажених plugin/channel. Сприймайте це як виявлення можливостей, а не повний перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений health snapshot gateway.
    - `diagnostics.stability` повертає недавній обмежений recorder стабільності діагностики. Він зберігає операційні метадані, як-от назви подій, кількість, розміри в байтах, показники пам’яті, стан черг/сесій, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів чи відповідей, токени, cookies або секретні значення. Потрібен scope operator read.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів зі scope admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується relay і потоками pairing.
    - `system-presence` повертає поточний snapshot presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених у runtime.
    - `usage.status` повертає зведення вікон використання провайдера/залишкової квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає готовність vector-memory / embedding для активного робочого простору default agent.
    - `sessions.usage` повертає зведення використання по сесіях.
    - `sessions.usage.timeseries` повертає timeseries використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення статусу вбудованих і bundled channel/plugin.
    - `channels.logout` виходить із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає flow входу QR/web для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього flow входу QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push на зареєстрований вузол iOS.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це RPC прямої вихідної доставки для надсилань, націлених на канал/обліковий запис/гілку, поза chat runner.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway з керуванням cursor/limit і максимальним числом байтів.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає effective payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` установлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий inventory провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` запускає одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно визначає активні SecretRefs і замінює стан секретів у runtime лише за повного успіху.
    - `secrets.resolve` визначає призначення секретів для командних цілей для конкретного набору command/target.
    - `config.get` повертає поточний snapshot конфігурації та hash.
    - `config.set` записує валідований payload конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідовує та замінює повний payload конфігурації.
    - `config.schema` повертає payload live schema конфігурації, який використовується Control UI та інструментами CLI: schema, `uiHints`, версію та метадані генерації, зокрема метадані schema plugin + channel, коли runtime може їх завантажити. Schema містить метадані полів `title` / `description`, похідні від тих самих міток і тексту довідки, що використовуються в UI, зокрема для вкладених об’єктів, wildcard, елементів масивів і гілок композиції `anyOf` / `oneOf` / `allOf`, коли для відповідної документації полів вони існують.
    - `config.schema.lookup` повертає payload lookup, обмежений шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол schema, відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів для drill-down в UI/CLI. Вузли schema lookup зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає процес оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.
  </Accordion>

  <Accordion title="Помічники для agent і workspace">
    - `agents.list` повертає налаштовані записи agent.
    - `agents.create`, `agents.update` і `agents.delete` керують записами agent і wiring workspace.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap workspace, доступними для agent.
    - `agent.identity.get` повертає effective identity помічника для agent або сесії.
    - `agent.wait` очікує завершення запуску та повертає terminal snapshot, коли він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/message для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сесій.
    - `sessions.resolve` визначає або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання chat і далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення для UI-клієнтів: inline directive tags прибираються з видимого тексту, payload XML викликів інструментів у plain-text (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і усічені блоки викликів інструментів) та витеклі ASCII/full-width токени керування моделлю прибираються, суто assistant-рядки з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки можуть бути замінені placeholders.
  </Accordion>

  <Accordion title="Pairing пристроїв і device tokens">
    - `device.pair.list` повертає очікувані й схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами pairing пристроїв.
    - `device.token.rotate` ротує token спареного пристрою в межах схвалених role та scope.
    - `device.token.revoke` відкликає token спареного пристрою.
  </Accordion>

  <Accordion title="Pairing Node, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють pairing Node та bootstrap verification.
    - `node.list` і `node.describe` повертають стан відомих/підключених Node.
    - `node.rename` оновлює мітку спареного Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped tokens можливостей canvas.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключених Node.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для offline/disconnected Node.
  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також lookup/replay відкладених схвалень.
    - `exec.approval.waitDecision` очікує рішення щодо одного відкладеного схвалення exec і повертає фінальне рішення (або `null` за тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують snapshots політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою схвалення exec для node через команди relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне за Heartbeat введення тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення chat для UI, як-от `chat.inject` та інші події chat лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення snapshot system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення health snapshot gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing Node.
- `node.invoke.request`: трансляція запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригера wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення Plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи operator

- Operator можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-
  inventory команд для agent.
  - `agentId` є необов’язковим; опустіть його, щоб читати workspace default agent.
  - `scope` керує тим, на яку поверхню націлено основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають names, обізнані про провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить native name, обізнане про провайдера, коли воно існує.
  - `provider` є необов’язковим і впливає лише на native naming плюс доступність native
    команд Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime catalog інструментів для
  agent. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective
  inventory інструментів для сесії.
  - `sessionKey` є обов’язковим.
  - Gateway виводить trusted runtime context із сесії на боці сервера замість приймати
    auth або delivery context, надані викликачем.
  - Відповідь прив’язана до сесії та відображає те, що активна розмова може використовувати просто зараз,
    зокрема інструменти core, Plugin і channel.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  inventory Skills для agent.
  - `agentId` є необов’язковим; опустіть його, щоб читати workspace default agent.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих секретних значень.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill до каталогу `skills/` workspace default agent.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    workspace default agent.
  - Режим конфігурації змінює значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують рішення, викликаючи `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним пересиланням схваленого `system.run`,
  gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка agent

- Запити `agent` можуть містити `deliver=true` для запиту вихідної доставки.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в межах сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сесій або неоднозначних конфігурацій із кількома каналами).

## Versioning

- `PROTOCOL_VERSION` знаходиться в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Schemas + models генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Ці значення
стабільні в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Типове значення                                      | Джерело                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)         | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` мс                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` мс                                        | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device token | `250` мс                                           | `src/gateway/client.ts`                                    |
| Пауза примусової зупинки перед `terminate()` | `250` мс                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` мс                                          | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Сервер оголошує effective `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не типових значень до handshake.

## Автентифікація

- Автентифікація gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect через
  заголовки запиту, а не через `connect.params.auth.*`.
- Приватний вхідний трафік `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect через спільний секрет;
  не відкривайте цей режим для публічного/ненадійного вхідного трафіку.
- Після pairing Gateway видає **device token**, обмежений role + scopes
  з’єднання. Він повертається в `hello-ok.auth.deviceToken` і має
  бути збережений клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після кожного
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  набір схвалених scopes для цього token. Це зберігає вже наданий доступ на
  читання/probe/status і запобігає тихому звуженню повторних підключень до
  вужчого неявного scope лише admin.
- Формування клієнтської автентифікації connect (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний shared token,
    потім явний `deviceToken`, далі збережений token для пристрою (ключується за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Shared token або будь-який визначений device token його пригнічують.
  - Автопідвищення збереженого device token під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене лише **довіреними endpoints** —
    loopback або `wss://` із зафіксованим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це bootstrap handoff tokens.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth на довіреному transport,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір scopes, запитаний викликачем, залишається авторитетним; кешовані scopes повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений token для пристрою.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача/ротація token завжди обмежується схваленим набором role, записаним
  у записі pairing цього пристрою; ротація token не може розширити пристрій до
  role, яку схвалення pairing ніколи не надавало.
- Для сесій token спареного пристрою керування пристроями обмежується самим пристроєм, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір operator scopes щодо
  поточних scopes сесії викликача. Викликачі без admin не можуть ротувати token до
  ширшого набору operator scopes, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим token для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати вказівки для дій operator.

## Ідентичність пристрою та pairing

- Node мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  fingerprint пари ключів.
- Gateway видають tokens для кожного пристрою + role.
- Для нових device ID потрібні схвалення pairing, якщо не ввімкнено локальне auto-approval.
- Auto-approval pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях self-connect для локального backend/container
  для довірених helper flow зі shared-secret.
- Підключення tailnet або LAN на тому самому хості все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може не включати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише для localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі з’єднання мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції device auth

Для застарілих клієнтів, які все ще використовують поведінку підпису до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                  | details.code                     | details.reason           | Значення                                            |
| ---------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.      |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.           |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана часова мітка поза межами допустимого skew. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає fingerprint публічного ключа. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонізація публічного ключа не пройшли перевірку. |

Ціль міграції:

- Завжди чекайте `connect.challenge`.
- Підписуйте payload v2, який містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятними для сумісності, але pinning метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS і pinning

- TLS підтримується для WS-з’єднань.
- Клієнти можуть за бажанням фіксувати fingerprint сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
