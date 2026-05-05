---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-05T14:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a08b13cf1ff837baeaedee9a642c5bd47d5322d8c16262ea2f0d14f03a3eb400
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS є **єдиною площиною керування + транспортом Node** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, Node iOS/Android, безголові
Node) підключаються через WebSocket і оголошують свою **роль** + **область дії** під
час handshake.

## Транспорт

- WebSocket, текстові фрейми з JSON payload.
- Перший фрейм **має** бути запитом `connect`.
- Фрейми до підключення обмежені 64 КіБ. Після успішного handshake клієнти
  мають дотримуватися лімітів `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надмірно великі вхідні фрейми та повільні вихідні буфери emit `payload.large` події
  до того, як gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, surface і безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, необроблене тіло фрейму, токени, cookies або секретні значення.

## Handshake (connect)

Gateway → Клієнт (challenge до підключення):

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
повернути retryable помилку `UNAVAILABLE` із `details.reason`, встановленим у
`"startup-sidecars"`, і `retryAfterMs`. Клієнти мають повторити цю відповідь
у межах свого загального бюджету підключення, а не показувати її як terminal
помилку handshake.

`server`, `features`, `snapshot` і `policy` усі обов’язкові за schema
(`src/gateway/protocol/schema/frames.ts`). `auth` також обов’язковий і повідомляє
узгоджені role/scopes. `canvasHostUrl` необов’язковий.

Коли device token не видано, `hello-ok.auth` повідомляє узгоджені
permissions без token fields:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені same-process backend clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть пропускати `device` на прямих local loopback підключеннях, коли
вони автентифікуються спільним gateway token/password. Цей шлях зарезервований
для internal control-plane RPCs і не дає застарілим CLI/device pairing baselines
блокувати локальну backend роботу, таку як оновлення subagent session. Remote clients,
browser-origin clients, node clients і явні device-token/device-identity
clients і далі використовують звичайні pairing та scope-upgrade checks.

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

Під час trusted bootstrap handoff `hello-ok.auth` може також містити додаткові
bounded role entries у `deviceTokens`:

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

Для вбудованого bootstrap flow node/operator основний node token залишається
`scopes: []`, а будь-який переданий operator token залишається обмеженим bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap scope checks залишаються
role-prefixed: записи operator задовольняють лише operator requests, а non-operator
roles і далі потребують scopes під власним role prefix.

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

## Фреймування

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **idempotency keys** (див. schema).

## Ролі + scopes

Повну модель operator scope, approval-time checks і shared-secret
semantics див. у [Operator scopes](/uk/gateway/operator-scopes).

### Ролі

- `operator` = клієнт площини керування (CLI/UI/automation).
- `node` = capability host (camera/screen/canvas/system.run).

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

Plugin-registered gateway RPC methods можуть запитувати власний operator scope, але
зарезервовані core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди resolve до `operator.admin`.

Method scope є лише першим gate. Деякі slash commands, доступні через
`chat.send`, застосовують суворіші command-level checks поверх цього. Наприклад, persistent
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову approval-time scope check поверх
base method scope:

- запити без command: `operator.pairing`
- запити з non-exec node commands: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують capability claims під час connect:

- `caps`: high-level capability categories.
- `commands`: command allowlist для invoke.
- `permissions`: granular toggles (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **claims** і застосовує server-side allowlists.

## Presence

- `system-presence` повертає записи, keyed by device identity.
- Presence entries містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок для кожного device
  навіть коли він підключається як **operator** і **node**.
- `node.list` містить необов’язкові поля `lastSeenAtMs` і `lastSeenReason`. Підключені Node повідомляють
  свій поточний connection time як `lastSeenAtMs` з причиною `connect`; paired nodes можуть також повідомляти
  durable background presence, коли trusted node event оновлює їхні pairing metadata.

### Фонова alive-подія Node

Node можуть викликати `node.event` з `event: "node.presence.alive"`, щоб записати, що paired node був
alive під час background wake без позначення його як connected.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` є closed enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` або `connect`. Невідомі trigger strings нормалізуються до
`background` gateway перед persistence. Подія durable лише для authenticated node
device sessions; device-less або unpaired sessions повертають `handled: false`.

Успішні gateways повертають structured result:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старіші gateways можуть і далі повертати `{ "ok": true }` для `node.event`; клієнти мають трактувати це як
acknowledged RPC, а не як durable presence persistence.

## Обмеження області дії broadcast event

Server-pushed WebSocket broadcast events scope-gated, щоб pairing-scoped або node-only sessions не отримували пасивно session content.

- **Chat, agent і tool-result frames** (включно зі streamed `agent` events і tool call results) потребують щонайменше `operator.read`. Sessions без `operator.read` повністю пропускають ці frames.
- **Plugin-defined `plugin.*` broadcasts** gated до `operator.write` або `operator.admin`, залежно від того, як plugin їх registered.
- **Status and transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle тощо) залишаються unrestricted, щоб transport health залишався observable для кожної authenticated session.
- **Unknown broadcast event families** за замовчуванням scope-gated (fail-closed), якщо registered handler явно їх не relaxes.

Кожне client connection зберігає власний per-client sequence number, тому broadcasts зберігають monotonic ordering на цьому socket, навіть коли різні clients бачать різні scope-filtered subsets потоку events.

## Поширені сімейства RPC methods

Публічна WS surface ширша за наведені вище приклади handshake/auth. Це
не generated dump — `hello-ok.features.methods` є conservative
discovery list, побудованим із `src/gateway/server-methods-list.ts` плюс loaded
plugin/channel method exports. Трактуйте його як feature discovery, а не повний
enumeration `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система й ідентичність">
    - `health` повертає cached або freshly probed gateway health snapshot.
    - `diagnostics.stability` повертає recent bounded diagnostic stability recorder. Він зберігає operational metadata, такі як event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names і session ids. Він не зберігає chat text, webhook bodies, tool outputs, raw request або response bodies, tokens, cookies чи secret values. Потрібен operator read scope.
    - `status` повертає `/status`-style gateway summary; sensitive fields включаються лише для admin-scoped operator clients.
    - `gateway.identity.get` повертає gateway device identity, що використовується relay і pairing flows.
    - `system-presence` повертає current presence snapshot для connected operator/node devices.
    - `system-event` додає system event і може оновлювати/broadcast presence context.
    - `last-heartbeat` повертає latest persisted heartbeat event.
    - `set-heartbeats` перемикає heartbeat processing на gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених середовищем виконання. Передайте `{ "view": "configured" }` для налаштованих моделей розміру вибірника (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає вікна використання провайдера / зведення залишкової квоти.
    - `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам'яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише тоді, коли виклик явно потребує живого ping провайдера embedding.
    - `doctor.memory.remHarness` повертає обмежений попередній перегляд REM harness лише для читання для віддалених клієнтів control plane. Він може включати шляхи робочого простору, фрагменти пам'яті, відрендерений обґрунтований Markdown і кандидатів на глибоке просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих і bundled каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає QR/web потік входу для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього QR/web потоку входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push на зареєстрований iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з cursor/limit і керуванням max-byte.

  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, fallback-провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий інвентар провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення тексту на мовлення.

  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та майстер">
    - `secrets.reload` повторно розв'язує активні SecretRefs і замінює runtime-стан секретів лише за повного успіху.
    - `secrets.resolve` розв'язує призначення секретів, націлені на команду, для конкретного набору команда/ціль.
    - `config.get` повертає поточний знімок конфігурації та hash.
    - `config.set` записує валідоване корисне навантаження конфігурації.
    - `config.patch` об'єднує часткове оновлення конфігурації.
    - `config.apply` валідує та замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає live корисне навантаження схеми конфігурації, яке використовують Control UI та інструменти CLI: схему, `uiHints`, версію та метадані генерації, включно з метаданими схем Plugin і каналів, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, включно з вкладеним об'єктом, wildcard, елементом масиву та гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження пошуку в межах шляху для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і безпосередні зведення дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі numeric/string/array/object і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Дочірні зведення показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` виконує потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення успішне; викликачі із сесією можуть включити `continuationMessage`, щоб startup відновив один наступний хід агента через чергу продовження після перезапуску. Оновлення через package manager примусово виконують невідкладений перезапуск після оновлення без cooldown після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований restart sentinel оновлення, включно з версією, що працює після перезапуску, коли вона доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають доступ до майстра onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, включно з ефективною моделлю та runtime-метаданими.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив'язкою робочих просторів.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` відкривають доступ до зведень артефактів, отриманих із transcript, і завантажень для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розв'язують сесію-власника на серверному боці та повертають лише transcript-медіа з відповідним provenance; небезпечні або локальні джерела URL повертають непідтримувані завантаження замість server-side отримання.
    - `environments.list` і `environments.status` відкривають SDK-клієнтам доступ лише для читання до виявлення локальних для Gateway і Node середовищ.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає terminal snapshot, коли він доступний.

  </Accordion>

  <Accordion title="Керування сесією">
    - `sessions.list` повертає поточний індекс сесій, включно з метаданими `agentRuntime` для кожного рядка, коли налаштований backend середовища виконання агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` розв'язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є варіантом interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов'язковий `runId`, або передати лише `runId` для активних run, які Gateway може розв'язати до сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розв'язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення UI-клієнтам: inline directive tags вилучаються з видимого тексту, plain-text XML-корисні навантаження tool-call (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками tool-call) та витоки ASCII/full-width model control tokens вилучаються, чисті рядки асистента з silent-token, як-от точні `NO_REPLY` / `no_reply`, опускаються, а завеликі рядки можуть бути замінені placeholders.

  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані й затверджені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його затвердженої ролі та меж scope викликача.
    - `device.token.revoke` відкликає токен спареного пристрою в межах його затвердженої ролі та меж scope викликача.

  </Accordion>

  <Accordion title="Спарювання Node, invoke і очікувана робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють спарювання Node та перевірку bootstrap.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює мітку спареного Node.
    - `node.invoke` пересилає команду підключеному Node.
    - `node.invoke.result` повертає результат для invoke-запиту.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює scoped токени canvas-capability.
    - `node.pending.pull` і `node.pending.ack` є API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують durable очікуваною роботою для offline/disconnected Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/replay очікуваних схвалень.
    - `exec.approval.waitDecision` очікує одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec у gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою схвалення exec через relay-команди Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені Plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або на наступний Heartbeat впровадження wake-тексту; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, такі як `chat.inject` та інші chat-події лише transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни cron run/job.
- `shutdown`: сповіщення про shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання Node.
- `node.invoke.request`: трансляція запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурація тригера wake-word змінилася.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення Plugin.

### Методи-помічники Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill для перевірок auto-allow.

### Методи-помічники оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд середовища виконання для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - `scope` керує тим, на яку поверхню націлюється основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають нативні імена з урахуванням провайдера, коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить нативне ім’я команди з урахуванням провайдера, коли воно існує.
  - `provider` є необов’язковим і впливає лише на нативне іменування та доступність нативних команд plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів середовища виконання для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактично доступний у середовищі виконання інвентар інструментів для сеансу.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений контекст середовища виконання із сеансу на серверному боці замість приймання наданого викликачем контексту автентифікації або доставлення.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати просто зараз, включно з інструментами core, plugin і каналу.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` є обов’язковим. `args`, `sessionKey`, `agentId`, `confirm` і
    `idempotencyKey` є необов’язковими.
  - Якщо присутні і `sessionKey`, і `agentId`, визначений агент сеансу має відповідати
    `agentId`.
  - Відповідь є конвертом для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не обходять конвеєр політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар skill для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб прочитати стандартний робочий простір агента.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття необроблених секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill у каталог `skills/` стандартного робочого простору агента.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у стандартному робочому просторі агента.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна поведінка середовища виконання. Якщо налаштовано `agents.defaults.models`, відповідь є дозволеним каталогом; інакше відповідь є повним каталогом Gateway.
- `"configured"`: поведінка розміру вибирача. Якщо налаштовано `agents.defaults.models`, він все одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та UI виявлення, а не для звичайних вибирачів моделей.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти операторів вирішують це викликом `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переспрямовані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сеансу.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним схваленим переспрямуванням `system.run`, Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервне доставлення агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідне доставлення.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставлення повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє fallback до виконання лише в сеансі, коли неможливо визначити зовнішній маршрут доставлення (наприклад, внутрішні сеанси/webchat або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Клієнтські константи

Еталонний клієнт у `src/gateway/client.ts` використовує ці стандартні значення. Значення є стабільними в межах протоколу v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Стандартне значення                                  | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Тайм-аут запиту (на RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env може збільшити парний бюджет сервера/клієнта) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp після закриття device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Стандартний тайм-аут `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Закриття за tick-timeout                  | code `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і
`policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень,
а не стандартних значень до handshake.

## Auth

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентифікацією, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect із
  заголовків запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect
  зі спільним секретом; не відкривайте цей режим для публічного/ненадійного ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений роллю підключення
  + областями доступу. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір областей доступу для цього токена. Це зберігає доступ для читання/перевірки/статусу,
  який уже було надано, і не дає повторним підключенням непомітно звужуватися до
  вужчої неявної області доступу лише для адміністратора.
- Складання клієнтської автентифікації connect (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди передається, коли заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для окремого пристрою (за ключем
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених кінцевих точок** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без закріплення не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію через довірений транспорт,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт передає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей доступу залишається авторитетним; кешовані області доступу
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для окремого пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область доступу `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він віддзеркалює замінний
  bearer-токен лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти свою заміну перед
  повторним підключенням. Ротації зі спільного/адміністративного доступу не віддзеркалюють bearer-токен.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим набором ролей,
  записаним у записі сполучення цього пристрою; зміна токена не може розширити або
  націлитися на роль пристрою, яку затвердження сполучення ніколи не надавало.
- Для сесій токенів сполучених пристроїв керування пристроями має власну область дії, якщо
  викликач також не має `operator.admin`: викликачі без прав адміністратора можуть видаляти/відкликати/ротувати
  лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір областей доступу цільового операторського
  токена відносно поточних областей доступу сесії викликача. Викликачі без прав адміністратора
  не можуть ротувати або відкликати ширший операторський токен, ніж той, який вони вже мають.
- Збої автентифікації містять `error.details.code` та підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для окремого пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати вказівки для дій оператора.

## Ідентичність пристрою + сполучення

- Nodes мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка пари ключів.
- Gateways видають токени для кожного пристрою + ролі.
- Затвердження сполучення потрібні для нових ідентифікаторів пристроїв, якщо не ввімкнено локальне авто-затвердження.
- Авто-затвердження сполучення зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях самопідключення для
  довірених допоміжних потоків зі спільним секретом.
- Підключення same-host tailnet або LAN усе ще вважаються віддаленими для сполучення та
  потребують затвердження.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки оператора без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback backend RPC `gateway-client`, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які досі використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав зі застарілим/неправильним nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана часова мітка виходить за межі дозволеного відхилення. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонікалізація публічного ключа не вдалася. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додаток до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` залишаються прийнятими для сумісності, але pinning метаданих
  сполученого пристрою все ще керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область доступу

Цей протокол відкриває **повний API gateway** (статус, канали, моделі, чат,
агент, сесії, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
