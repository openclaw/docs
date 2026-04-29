---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'WebSocket-протокол Gateway: узгодження, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-29T09:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51647177913f9ba0bbbe4fffbe4e06ff120d5307d075f49cb99d363ac6ad0f11
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON payloads.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 KiB. Після успішного handshake клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери створюють події `payload.large`
  перед тим, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло
  повідомлення, вміст вкладень, сире тіло фрейму, токени, cookie або секретні значення.

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

Поки Gateway ще завершує запуск sidecars, запит `connect` може
повернути retryable помилку `UNAVAILABLE` з `details.reason`, встановленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цю відповідь
у межах загального бюджету підключення, а не показувати її як остаточну
помилку handshake.

`server`, `features`, `snapshot` і `policy` усі обов’язкові за схемою
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджену роль/scopes. `canvasHostUrl` є необов’язковим.

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

Довірені backend-клієнти того самого процесу (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть опускати `device` у прямих loopback-підключеннях,
коли автентифікуються спільним gateway token/password. Цей шлях зарезервований
для внутрішніх RPC площини керування та не дає застарілим базовим даним pairing
CLI/device блокувати локальну backend-роботу, зокрема оновлення сесій subagent.
Віддалені клієнти, клієнти browser-origin, клієнти вузлів і клієнти з явним
device-token/device-identity і надалі використовують звичайні перевірки pairing
і підвищення scope.

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

Під час довіреної передачі bootstrap `hello-ok.auth` може також містити додаткові
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

Для вбудованого bootstrap-потоку node/operator основний node token лишається
`scopes: []`, а будь-який переданий operator token лишається обмеженим bootstrap
allowlist оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap scope лишаються
role-prefixed: записи operator задовольняють лише запити operator, а ролям
не operator і надалі потрібні scopes під власним префіксом ролі.

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

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + scopes

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
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

Зареєстровані Plugin методи gateway RPC можуть запитувати власний operator scope, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди розв’язуються в `operator.admin`.

Scope методу є лише першим бар’єром. Деякі slash commands, до яких переходять через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час approval на додачу до
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами вузла не exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують claims можливостей під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: дрібні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **claims** і застосовує server-side allowlists.

## Presence

- `system-presence` повертає записи з ключем за device identity.
- Presence entries містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається як **operator** і **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені вузли повідомляють
  свій поточний час підключення як `lastSeenAtMs` з причиною `connect`; paired вузли також можуть повідомляти
  durable background presence, коли довірена подія вузла оновлює їхні pairing metadata.

### Подія живого стану вузла у фоні

Вузли можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що paired вузол був
alive під час background wake, не позначаючи його підключеним.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є закритим enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі trigger strings нормалізуються до
`background` gateway перед persistence. Подія є durable лише для автентифікованих node
device sessions; device-less або unpaired sessions повертають `handled: false`.

Успішні gateways повертають структурований результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateways усе ще можуть повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
підтверджений RPC, а не як durable presence persistence.

## Обмеження області трансляцій broadcast events

Server-pushed WebSocket broadcast events scope-gated так, щоб pairing-scoped або node-only sessions не отримували пасивно вміст сесії.

- **Фрейми чату, agent і tool-result** (зокрема streamed події `agent` і результати викликів інструментів) потребують щонайменше `operator.read`. Sessions без `operator.read` повністю пропускають ці фрейми.
- **Визначені Plugin broadcast-и `plugin.*`** обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються необмеженими, щоб стан транспорту був видимий для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast events** за замовчуванням scope-gated (fail-closed), якщо зареєстрований handler явно не послаблює їх.

Кожне клієнтське підключення зберігає власний per-client sequence number, тож broadcasts зберігають монотонний порядок на цьому socket, навіть коли різні клієнти бачать різні scope-filtered підмножини event stream.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади handshake/auth. Це
не згенерований dump — `hello-ok.features.methods` є консервативним
списком discovery, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів Plugin/channel. Розглядайте його як feature discovery, а не повне
перелічення `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає cached або щойно probed gateway health snapshot.
    - `diagnostics.stability` повертає нещодавній bounded diagnostic stability recorder. Він зберігає операційні metadata, як-от назви подій, лічильники, byte sizes, memory readings, queue/session state, назви channel/plugin і session ids. Він не зберігає текст чату, webhook bodies, outputs інструментів, raw request або response bodies, токени, cookies або secret values. Потрібен operator read scope.
    - `status` повертає gateway summary у стилі `/status`; чутливі поля містяться лише для operator clients з admin scope.
    - `gateway.identity.get` повертає gateway device identity, що використовується relay і pairing flows.
    - `system-presence` повертає поточний presence snapshot для підключених operator/node devices.
    - `system-event` додає system event і може оновлювати/транслювати presence context.
    - `last-heartbeat` повертає останню persisted heartbeat event.
    - `set-heartbeats` перемикає heartbeat processing на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений середовищем виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру пікера (спочатку `agents.defaults.models`, потім `models.providers.*.models`) або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення вікон використання провайдера / залишкової квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної памʼяті / кешованих embedding для активного робочого простору стандартного агента. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли викликач явно хоче виконати живий ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений попередній перегляд REM harness лише для читання для віддалених клієнтів control plane. Він може містити шляхи робочого простору, фрагменти памʼяті, відрендерений grounded markdown і кандидатів на глибоке просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає зведення стану вбудованих і постачаних у комплекті каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного провайдера вебканалу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий outbound-delivery RPC для надсилань, націлених на канал/обліковий запис/тред, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з керуванням курсором/лімітом і максимальною кількістю байтів.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` запускає одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розвʼязує активні SecretRefs і замінює runtime-стан секретів лише за повного успіху.
    - `secrets.resolve` розвʼязує призначення секретів, націлених на команди, для певного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує перевірений payload конфігурації.
    - `config.patch` обʼєднує часткове оновлення конфігурації.
    - `config.apply` перевіряє та замінює повний payload конфігурації.
    - `config.schema` повертає payload актуальної схеми конфігурації, який використовують Control UI та інструменти CLI: схему, `uiHints`, версію та метадані генерації, зокрема метадані схем Plugin і каналу, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, зокрема вкладені обʼєкти, wildcard, елементи масиву та гілки композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає payload пошуку в межах шляху для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `update.status` повертає останній кешований sentinel перезапуску після оновлення, зокрема версію, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Допоміжні засоби агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і runtime-метадані.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і привʼязкою робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає фінальний знімок, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, зокрема метадані `agentRuntime` для кожного рядка, коли налаштовано backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскриптів для певних ключів сесій.
    - `sessions.resolve` розвʼязує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання й спрямування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розвʼязану канонічну модель разом з ефективним `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізовано для відображення в UI-клієнтах: inline-теги директив вилучаються з видимого тексту, XML-payload викликів інструментів у plain-text (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), а також витоки ASCII/full-width керувальних токенів моделі вилучаються, суто silent-token рядки асистента, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої зі статусом очікування та схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі та scope викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його схваленої ролі та scope викликача.

  </Accordion>

  <Accordion title="Спарювання Node, invoke і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання node і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають відомий/підключений стан node.
    - `node.rename` оновлює мітку спареного node.
    - `node.invoke` пересилає команду до підключеного node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` передає події, що походять від node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped canvas-capability tokens.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного node.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною роботою в очікуванні для offline/disconnected nodes.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/повторне відтворення схвалень в очікуванні.
    - `exec.approval.waitDecision` очікує одне схвалення exec в очікуванні та повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec для gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують node-local політикою схвалення exec через relay-команди node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені Plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або на наступний heartbeat інʼєкцію wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject`, та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання node.
- `node.invoke.request`: трансляція запиту invoke для node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригера wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення Plugin.

### Допоміжні методи Node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню спрямована основна `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають provider-aware нативні назви,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить provider-aware нативну назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на нативне найменування плюс доступність
    нативних команд plugin.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime каталог інструментів для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective інвентар інструментів
  для сеансу.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime контекст із сеансу на серверному боці замість прийняття
    наданого викликачем контексту автентифікації або доставки.
  - Відповідь має область дії сеансу й відображає те, що активна розмова може використовувати просто зараз,
    включно з інструментами ядра, plugin і каналу.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар skill для агента.
  - `agentId` необов’язковий; опустіть його, щоб читати стандартний робочий простір агента.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у директорію `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    стандартному робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Опущено або `"default"`: поточна runtime поведінка. Якщо `agents.defaults.models` налаштовано, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру вибірника. Якщо `agents.defaults.models` налаштовано, вона все одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли налаштованих рядків моделей немає.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних вибірників моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти оператора вирішують це викликом `exec.approval.resolve` (потребує області `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим пересиланням `system.run`, 
  gateway відхиляє запуск замість довіри до зміненого payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сеансі, коли не вдається розв’язати зовнішній маршрут доставки (наприклад, внутрішні/webchat сеанси або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` знаходиться в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення
стабільні в protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                  | Джерело                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp після закриття device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття через tick-timeout               | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не стандартів до handshake.

## Автентифікація

- Автентифікація gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку автентифікації connect із
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect через спільний секрет;
  не відкривайте цей режим на публічний/недовірений ingress.
- Після pairing Gateway видає **device token** з областю дії для ролі з’єднання
  + scopes. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  схвалений набір scope для цього токена. Це зберігає доступ read/probe/status,
  який уже було надано, і уникає непомітного звуження повторних підключень до
  вужчої неявної admin-only області.
- Збирання автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений per-device token (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище не розв’язав
    `auth.token`. Спільний токен або будь-який розв’язаний device token пригнічує його.
  - Автопросування збереженого device token під час одноразового
    повтору `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не відповідає вимогам.
- Додаткові записи `hello-ok.auth.deviceTokens` є bootstrap handoff token.
  Зберігайте їх лише тоді, коли connect використовував bootstrap auth на довіреному транспорті,
  такому як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір scope залишається авторитетним; кешовані scopes лише
  повторно використовуються, коли клієнт повторно використовує збережений per-device token.
- Device tokens можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потребує області `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  device token, щоб token-only клієнти могли зберегти заміну перед
  повторним підключенням. Shared/admin ротації не віддзеркалюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими схваленим набором ролей,
  записаним у pairing entry цього пристрою; мутація токена не може розширити або
  спрямувати роль пристрою, яку pairing approval ніколи не надавав.
- Для paired-device token sessions керування пристроями має self-scoped область, якщо
  викликач також не має `operator.admin`: не-admin викликачі можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють цільовий набір scope
  токена оператора щодо поточних scopes сеансу викликача. Не-admin викликачі
  не можуть ротувати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати один обмежений повтор із кешованим per-device token.
  - Якщо цей повтор не вдається, клієнти мають зупинити автоматичні цикли повторного підключення та показати оператору вказівки щодо дій.

## Ідентичність пристрою + pairing

- Node-и мають містити стабільну ідентичність пристрою (`device.id`), отриману з
  відбитка пари ключів.
- Gateway-и видають токени для кожного пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібні схвалення сполучення, якщо не
  ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення сполучення зосереджене на прямих підключеннях через local loopback.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для сполучення та
  потребують схвалення.
- Клієнти WS зазвичай включають ідентичність `device` під час `connect` (оператор +
  node). Єдині винятки для оператора без пристрою — явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація Control UI оператора `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний обхід, суттєве зниження безпеки).
  - backend RPC-и `gateway-client` через direct-loopback, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристроїв

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Типові помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав із застарілим/неправильним nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу поза дозволеним відхиленням.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалися. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` досі приймаються для сумісності, але закріплення метаданих
  сполученого пристрою все ще керує політикою команд під час повторного підключення.

## TLS + закріплення

- TLS підтримується для підключень WS.
- Клієнти можуть за бажанням закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область застосування

Цей протокол надає **повний API gateway** (статус, канали, моделі, чат,
agent, сесії, nodes, схвалення тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол мосту](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
