---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-03T00:43:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS-протокол є **єдиною площиною керування + транспортом Node** для
OpenClaw. Усі клієнти (CLI, веб UI, застосунок macOS, iOS/Android Node,
безголові Node) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час handshake.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні кадри та повільні вихідні буфери створюють події `payload.large`
  перед тим, як gateway закриє або відкине відповідний кадр. Ці події зберігають
  розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло кадру, токени, cookies або секретні значення.

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
повернути помилку `UNAVAILABLE`, яку можна повторити, з `details.reason`, заданим як
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цю відповідь
у межах свого загального бюджету підключення, а не показувати її як кінцевий
збій handshake.

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджені роль/області дії. `canvasHostUrl` необов’язковий.

Коли device token не видано, `hello-ok.auth` повідомляє узгоджені
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
`client.mode: "backend"`) можуть опускати `device` у прямих loopback-підключеннях, коли
автентифікуються спільним токеном/паролем gateway. Цей шлях зарезервований
для внутрішніх RPC площини керування й не дає застарілим базовим станам сполучення CLI/device
блокувати локальну backend-роботу, як-от оновлення сесій subagent. Віддалені клієнти,
клієнти з browser-origin, клієнти Node і явні клієнти device-token/device-identity
надалі використовують звичайні перевірки сполучення та підвищення області дії.

Коли device token видано, `hello-ok` також містить:

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

Для вбудованого bootstrap-потоку Node/operator основний токен Node залишається
`scopes: []`, а будь-який переданий operator-токен залишається обмеженим allowlist
bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-перевірки областей дії залишаються
префіксованими роллю: operator-записи задовольняють лише operator-запити, а ролі
не operator надалі потребують областей дії під власним префіксом ролі.

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

## Формат кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області дії

Повну модель областей дії operator, перевірки під час схвалення та семантику
спільного секрету див. у [Області дії operator](/uk/gateway/operator-scopes).

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

Зареєстровані Plugin RPC-методи gateway можуть запитувати власну operator-область дії, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди розв’язуються в `operator.admin`.

Область дії методу є лише першим бар’єром. Деякі slash-команди, доступні через
`chat.send`, застосовують суворіші перевірки рівня команди поверх нього. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час схвалення поверх
базової області дії методу:

- запити без команд: `operator.pairing`
- запити з командами Node не exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Можливості/команди/дозволи (Node)

Node оголошують твердження про можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: granular-перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **твердження** і застосовує server-side allowlist.

## Присутність

- `system-presence` повертає записи, ключовані ідентичністю device.
- Записи присутності містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на device
  навіть коли він підключається і як **operator**, і як **Node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені Node повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; спарені Node також можуть повідомляти
  durable background-присутність, коли довірена подія Node оновлює їхні metadata сполучення.

### Подія фонового alive для Node

Node можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що спарений Node був
alive під час фонового wake без позначення його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі рядки trigger нормалізуються gateway до
`background` перед збереженням. Подія є durable лише для автентифікованих device-сесій Node;
сесії без device або без сполучення повертають `handled: false`.

Успішні gateway повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateway все ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як durable-збереження присутності.

## Обмеження області дії broadcast-подій

Server-pushed WebSocket broadcast-події обмежуються областями дії, щоб pairing-scoped або node-only сесії пасивно не отримували вміст сесій.

- **Кадри chat, agent і результатів інструментів** (включно зі streamed `agent` подіями та результатами tool call) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Plugin-визначені broadcast-події `plugin.*`** обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються необмеженими, щоб transport health була видимою для кожної автентифікованої сесії.
- **Невідомі родини broadcast-подій** за замовчуванням обмежуються областями дії (fail-closed), якщо зареєстрований handler явно не послаблює їх.

Кожне клієнтське підключення зберігає власний per-client порядковий номер, тож broadcasts зберігають монотонний порядок на цьому socket, навіть коли різні клієнти бачать різні scope-filtered підмножини потоку подій.

## Поширені сімейства RPC-методів

Публічна WS-поверхня ширша за наведені вище приклади handshake/auth. Це
не згенерований dump — `hello-ok.features.methods` є консервативним
списком discovery, побудованим із `src/gateway/server-methods-list.ts` плюс завантажених
експортів методів Plugin/channel. Сприймайте його як feature discovery, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений health snapshot gateway.
    - `diagnostics.stability` повертає нещодавній bounded diagnostic stability recorder. Він зберігає operational metadata, як-от назви подій, лічильники, розміри в байтах, показники пам’яті, стан queue/session, назви channel/plugin і ids сесій. Він не зберігає текст chat, тіла webhook, outputs інструментів, сирі тіла request або response, токени, cookies або secret values. Потрібна operator read scope.
    - `status` повертає `/status`-style summary gateway; sensitive fields включаються лише для operator-клієнтів з admin scope.
    - `gateway.identity.get` повертає ідентичність device gateway, що використовується потоками relay і pairing.
    - `system-presence` повертає поточний presence snapshot для підключених operator/node devices.
    - `system-event` додає system event і може оновлювати/broadcast presence context.
    - `last-heartbeat` повертає останню persisted heartbeat event.
    - `set-heartbeats` перемикає heartbeat processing на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених середовищем виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (спочатку `agents.defaults.models`, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / підсумки залишкової квоти.
    - `usage.cost` повертає агреговані підсумки вартості використання для діапазону дат.
    - `doctor.memory.status` повертає готовність векторної памʼяті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений, доступний лише для читання попередній перегляд REM harness для віддалених клієнтів control plane. Він може містити шляхи робочого простору, фрагменти памʼяті, відтворений grounded markdown і кандидатів на глибоке просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає підсумки використання за сесіями.
    - `sessions.usage.timeseries` повертає використання часових рядів для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає підсумки стану вбудованих і комплектних каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web-потік входу для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web-потоку входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push зареєстрованому iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим outbound-delivery RPC для надсилань поза chat runner, націлених на канал/обліковий запис/тред.
    - `logs.tail` повертає налаштований tail файлового журналу Gateway з елементами керування cursor/limit і max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback-провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно resolve активні SecretRefs і замінює стан секретів середовища виконання лише після повного успіху.
    - `secrets.resolve` resolve призначення секретів для цільових команд для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірений payload конфігурації.
    - `config.patch` обʼєднує часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повний payload конфігурації.
    - `config.schema` повертає live payload схеми конфігурації, який використовують Control UI та CLI tooling: схема, `uiHints`, версія та метадані генерації, зокрема метадані схем Plugin і каналів, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих labels і help text, що використовуються UI, зокрема гілки вкладених обʼєктів, wildcard, array-item і композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає path-scoped lookup payload для одного шляху конфігурації: нормалізований шлях, shallow schema node, matched hint + `hintPath` і immediate child summaries для UI/CLI drill-down. Lookup schema nodes зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds і flags на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child summaries показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також matched `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише коли саме оновлення успішне. Оновлення package-manager примусово виконують non-deferred, no-cooldown restart після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований update restart sentinel, зокрема версію, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і метадані середовища виконання.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і привʼязкою робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, доступними для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають підсумки артефактів, отриманих із транскрипта, та завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task resolve власну сесію на стороні сервера та повертають лише медіа транскрипта з відповідним provenance; unsafe або local URL sources повертають unsupported downloads замість server-side fetching.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, зокрема метадані `agentRuntime` за рядками, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипта/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для конкретних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` resolve або canonicalize ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є варіантом interrupt-and-steer для активної сесії.
    - `sessions.abort` abort активної роботи для сесії. Викликач може передати `key` плюс необовʼязковий `runId`, або передати лише `runId` для активних runs, які Gateway може resolve до сесії.
    - `sessions.patch` оновлює метадані/overrides сесії та повідомляє resolved canonical model плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату все ще використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` display-normalized для UI-клієнтів: inline directive tags вилучаються з visible text, plain-text tool-call XML payloads (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і truncated tool-call blocks) та leaked ASCII/full-width model control tokens вилучаються, pure silent-token assistant rows на кшталт точних `NO_REPLY` / `no_reply` пропускаються, а oversized rows можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає pending і approved paired devices.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` rotate токен paired device у межах його approved role і caller scope bounds.
    - `device.token.revoke` відкликає токен paired device у межах його approved role і caller scope bounds.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення Node і bootstrap verification.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює label paired Node.
    - `node.invoke` forwarding команди до підключеного Node.
    - `node.invoke.result` повертає результат для invoke request.
    - `node.event` переносить події, що походять із Node, назад у gateway.
    - `node.canvas.capability.refresh` refresh scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` є API черги connected-node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable pending work для offline/disconnected Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити exec approval плюс lookup/replay pending approvals.
    - `exec.approval.waitDecision` очікує одне pending exec approval і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики exec approval Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою exec approval через команди node relay.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені Plugin потоки approval.

  </Accordion>

  <Accordion title="Автоматизація, Skills і інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat інʼєкцію wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують scheduled work.
    - Skills і інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші transcript-only chat
  events.
- `session.message` і `session.tool`: оновлення transcript/event-stream для
  subscribed session.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення snapshot присутності системи.
- `tick`: періодична keepalive / liveness подія.
- `health`: оновлення snapshot стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення Node.
- `node.invoke.request`: broadcast запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл paired-device.
- `voicewake.changed`: конфігурацію wake-word trigger змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл exec approval.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл Plugin approval.

### Допоміжні методи Node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для auto-allow checks.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-інвентар команд для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають provider-aware нативні назви, коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, як-от `/model` і `/m`.
  - `nativeName` містить provider-aware нативну назву команди, коли така існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність нативних команд Plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний інвентар інструментів для сеансу.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сеансу на боці сервера замість приймання наданого викликачем контексту автентифікації або доставки.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати прямо зараз, включно з інструментами ядра, Plugin і каналу.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і `idempotencyKey` необов’язкові.
  - Якщо присутні і `sessionKey`, і `agentId`, визначений агент сеансу має збігатися з `agentId`.
  - Відповідь є конвертом, орієнтованим на SDK, з полями `ok`, `toolName`, необов’язковим `output` і типізованими полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не обходять конвеєр політик інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та санітизовані параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює теку навички в каталог `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у стандартному робочому просторі агента.
  - Режим конфігурації змінює значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна runtime-поведінка. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру picker. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, обходячи `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних picker моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора вирішують це, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сеансі, коли неможливо визначити зовнішній доставний маршрут (наприклад, внутрішні/вебчат-сеанси або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення стабільні в protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                  | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Обмеження fast-retry після закриття device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | code `4000`, коли мовчання перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не стандартів до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентифікацією, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації під час підключення за
  заголовками запиту замість `connect.params.auth.*`.
- Приватний вхідний `gateway.auth.mode: "none"` повністю пропускає автентифікацію підключення
  зі спільним секретом; не відкривайте цей режим на публічному або ненадійному вході.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю підключення
  + областями доступу. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений затверджений набір областей доступу для цього токена. Це зберігає доступ до
  читання/перевірки/статусу, який уже було надано, і запобігає непомітному звуженню
  повторних підключень до неявної області лише для адміністратора.
- Складання автентифікації підключення на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є незалежним і завжди передається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для окремого пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію через довірений транспорт,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей доступу залишається авторитетним; кешовані області доступу
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для окремого пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область доступу `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він дублює замінний
  bearer-токен лише для викликів з того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти, які працюють лише з токеном, могли зберегти заміну перед
  повторним підключенням. Ротації зі спільним/адміністративним доступом не дублюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі спарювання цього пристрою; зміна токена не може розширити або
  націлити роль пристрою, яку затвердження спарювання ніколи не надавало.
- Для сеансів токенів спарених пристроїв керування пристроєм обмежене власним контекстом, якщо
  викликач також не має `operator.admin`: викликачи без прав адміністратора можуть видаляти/відкликати/ротувати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір областей доступу токена оператора
  щодо поточних областей доступу сеансу викликача. Викликачи без прав адміністратора
  не можуть ротувати або відкликати ширший токен оператора, ніж уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (логічне значення)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для окремого пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати вказівки щодо дій оператора.

## Ідентичність пристрою + спарювання

- Вузли мають включати стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка ключової пари.
- Gateway видають токени для кожного пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібні затвердження спарювання, якщо не ввімкнене
  локальне автозатвердження.
- Автозатвердження спарювання зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький шлях локального самопідключення backend/container для
  довірених допоміжних потоків зі спільним секретом.
- Підключення того самого хоста через tailnet або LAN усе одно вважаються віддаленими для спарювання та
  потребують затвердження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (оператор +
  вузол). Єдині винятки для оператора без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності небезпечного HTTP лише на localhost.
  - успішна автентифікація оператора Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний обхід, серйозне зниження безпеки).
  - backend RPC-и `gateway-client` через direct-loopback, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного відхилення. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалися. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте навантаження v2, яке містить nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив'язує `platform` і `deviceFamily`
  на додачу до полів пристрою/клієнта/ролі/областей доступу/токена/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але закріплення метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API Gateway** (статус, канали, моделі, чат,
агент, сеанси, вузли, затвердження тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов'язане

- [Протокол мосту](/uk/gateway/bridge-protocol)
- [Операційний посібник Gateway](/uk/gateway)
