---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або помилок підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket для Gateway: початкове узгодження, кадри, версіювання'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-05-02T13:34:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

The Gateway WS protocol is the **single control plane + node transport** for
OpenClaw. All clients (CLI, web UI, macOS app, iOS/Android nodes, headless
nodes) connect over WebSocket and declare their **role** + **scope** at
handshake time.

## Transport

- WebSocket, text frames with JSON payloads.
- First frame **must** be a `connect` request.
- Pre-connect frames are capped at 64 KiB. After a successful handshake, clients
  should follow the `hello-ok.policy.maxPayload` and
  `hello-ok.policy.maxBufferedBytes` limits. With diagnostics enabled,
  oversized inbound frames and slow outbound buffers emit `payload.large` events
  before the gateway closes or drops the affected frame. These events keep
  sizes, limits, surfaces, and safe reason codes. They do not keep the message
  body, attachment contents, raw frame body, tokens, cookies, or secret values.

## Handshake (connect)

Gateway → Client (pre-connect challenge):

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

While the Gateway is still finishing startup sidecars, the `connect` request can
return a retryable `UNAVAILABLE` error with `details.reason` set to
`"startup-sidecars"` and `retryAfterMs`. Clients should retry that response
within their overall connection budget instead of surfacing it as a terminal
handshake failure.

`server`, `features`, `snapshot`, and `policy` are all required by the schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is also required and reports
the negotiated role/scopes. `canvasHostUrl` is optional.

When no device token is issued, `hello-ok.auth` reports the negotiated
permissions without token fields:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Trusted same-process backend clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) may omit `device` on direct loopback connections when
they authenticate with the shared gateway token/password. This path is reserved
for internal control-plane RPCs and keeps stale CLI/device pairing baselines from
blocking local backend work such as subagent session updates. Remote clients,
browser-origin clients, node clients, and explicit device-token/device-identity
clients still use the normal pairing and scope-upgrade checks.

When a device token is issued, `hello-ok` also includes:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

During trusted bootstrap handoff, `hello-ok.auth` may also include additional
bounded role entries in `deviceTokens`:

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

For the built-in node/operator bootstrap flow, the primary node token stays
`scopes: []` and any handed-off operator token stays bounded to the bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap scope checks stay
role-prefixed: operator entries only satisfy operator requests, and non-operator
roles still need scopes under their own role prefix.

### Node example

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

Side-effecting methods require **idempotency keys** (see schema).

## Roles + scopes

### Roles

- `operator` = control plane client (CLI/UI/automation).
- `node` = capability host (camera/screen/canvas/system.run).

### Scopes (operator)

Common scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` with `includeSecrets: true` requires `operator.talk.secrets`
(or `operator.admin`).

Plugin-registered gateway RPC methods may request their own operator scope, but
reserved core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) always resolve to `operator.admin`.

Method scope is only the first gate. Some slash commands reached through
`chat.send` apply stricter command-level checks on top. For example, persistent
`/config set` and `/config unset` writes require `operator.admin`.

`node.pair.approve` also has an extra approval-time scope check on top of the
base method scope:

- commandless requests: `operator.pairing`
- requests with non-exec node commands: `operator.pairing` + `operator.write`
- requests that include `system.run`, `system.run.prepare`, or `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declare capability claims at connect time:

- `caps`: high-level capability categories.
- `commands`: command allowlist for invoke.
- `permissions`: granular toggles (e.g. `screen.record`, `camera.capture`).

The Gateway treats these as **claims** and enforces server-side allowlists.

## Presence

- `system-presence` returns entries keyed by device identity.
- Presence entries include `deviceId`, `roles`, and `scopes` so UIs can show a single row per device
  even when it connects as both **operator** and **node**.
- `node.list` includes optional `lastSeenAtMs` and `lastSeenReason` fields. Connected nodes report
  their current connection time as `lastSeenAtMs` with reason `connect`; paired nodes can also report
  durable background presence when a trusted node event updates their pairing metadata.

### Node background alive event

Nodes may call `node.event` with `event: "node.presence.alive"` to record that a paired node was
alive during a background wake without marking it connected.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is a closed enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, or `connect`. Unknown trigger strings are normalized to
`background` by the gateway before persistence. The event is durable only for authenticated node
device sessions; device-less or unpaired sessions return `handled: false`.

Successful gateways return a structured result:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Older gateways may still return `{ "ok": true }` for `node.event`; clients should treat that as an
acknowledged RPC, not as durable presence persistence.

## Broadcast event scoping

Server-pushed WebSocket broadcast events are scope-gated so that pairing-scoped or node-only sessions do not passively receive session content.

- **Chat, agent, and tool-result frames** (including streamed `agent` events and tool call results) require at least `operator.read`. Sessions without `operator.read` skip these frames entirely.
- **Plugin-defined `plugin.*` broadcasts** are gated to `operator.write` or `operator.admin`, depending on how the plugin registered them.
- **Status and transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, etc.) remain unrestricted so transport health stays observable to every authenticated session.
- **Unknown broadcast event families** are scope-gated by default (fail-closed) unless a registered handler explicitly relaxes them.

Each client connection keeps its own per-client sequence number so broadcasts preserve monotonic ordering on that socket even when different clients see different scope-filtered subsets of the event stream.

## Common RPC method families

The public WS surface is broader than the handshake/auth examples above. This
is not a generated dump — `hello-ok.features.methods` is a conservative
discovery list built from `src/gateway/server-methods-list.ts` plus loaded
plugin/channel method exports. Treat it as feature discovery, not a full
enumeration of `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` returns the cached or freshly probed gateway health snapshot.
    - `diagnostics.stability` returns the recent bounded diagnostic stability recorder. It keeps operational metadata such as event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names, and session ids. It does not keep chat text, webhook bodies, tool outputs, raw request or response bodies, tokens, cookies, or secret values. Operator read scope is required.
    - `status` returns the `/status`-style gateway summary; sensitive fields are included only for admin-scoped operator clients.
    - `gateway.identity.get` returns the gateway device identity used by relay and pairing flows.
    - `system-presence` returns the current presence snapshot for connected operator/node devices.
    - `system-event` appends a system event and can update/broadcast presence context.
    - `last-heartbeat` returns the latest persisted heartbeat event.
    - `set-heartbeats` toggles heartbeat processing on the gateway.

  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає дозволений під час виконання каталог моделей. Передайте `{ "view": "configured" }` для налаштованих моделей розміру picker (`agents.defaults.models` спочатку, потім `models.providers.*.models`), або `{ "view": "all" }` для повного каталогу.
    - `usage.status` повертає зведення вікон використання провайдера / залишку квоти.
    - `usage.cost` повертає агреговані зведення витрат за діапазон дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / кешованих embedding для активного робочого простору агента за замовчуванням. Передавайте `{ "probe": true }` або `{ "deep": true }` лише коли викликач явно хоче живий ping до embedding-провайдера.
    - `doctor.memory.remHarness` повертає обмежений, лише для читання попередній перегляд REM harness для віддалених клієнтів площини керування. Він може містити шляхи робочого простору, фрагменти пам’яті, відрендерений grounded markdown і кандидатів для глибокого просування, тому викликачам потрібен `operator.read`.
    - `sessions.usage` повертає зведення використання за сесіями.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

  </Accordion>

  <Accordion title="Канали та помічники входу">
    - `channels.status` повертає зведення стану вбудованих + включених у комплект каналів/Plugin.
    - `channels.logout` виконує вихід із певного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік QR/web входу для поточного QR-сумісного провайдера вебканалу.
    - `web.login.wait` очікує завершення цього потоку QR/web входу та запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.

  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` є прямим RPC вихідної доставки для надсилань, націлених на канал/обліковий запис/потік, поза chat runner.
    - `logs.tail` повертає налаштований хвіст файлового журналу gateway з керуванням cursor/limit і max-byte.

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
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів, націлені на команду, для конкретного набору команди/цілі.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене корисне навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає живе корисне навантаження схеми конфігурації, яке використовують інструменти Control UI і CLI: схему, `uiHints`, версію та метадані генерації, зокрема метадані схем Plugin + каналу, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, отримані з тих самих міток і довідкового тексту, які використовує UI, зокрема вкладений об’єкт, wildcard, елемент масиву та гілки композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає корисне навантаження пошуку з областю шляху для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і безпосередні зведення дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, межі для чисел/рядків/масивів/об’єктів і прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише коли саме оновлення успішне. Оновлення менеджера пакетів примусово виконують невідкладений перезапуск оновлення без cooldown після заміни пакета, щоб старий процес Gateway не продовжував lazy-loading із заміненого дерева `dist`.
    - `update.status` повертає останній кешований sentinel перезапуску оновлення, зокрема поточну версію після перезапуску, якщо доступно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають майстер onboarding через WS RPC.

  </Accordion>

  <Accordion title="Помічники агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів, зокрема ефективну модель і runtime-метадані.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і прив’язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують початковими файлами робочого простору, відкритими для агента.
    - `artifacts.list`, `artifacts.get` і `artifacts.download` надають зведення артефактів, отриманих із transcript, і завантаження для явної області `sessionKey`, `runId` або `taskId`. Запити run і task розв’язують сесію-власника на сервері та повертають лише медіа transcript із відповідним походженням; небезпечні або локальні URL-джерела повертають непідтримувані завантаження замість отримання на сервері.
    - `agent.identity.get` повертає ефективну ідентичність асистента для агента або сесії.
    - `agent.wait` очікує завершення run і повертає кінцевий знімок, коли доступно.

  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій, зокрема метадані `agentRuntime` для кожного рядка, коли налаштовано runtime backend агента.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сесій.
    - `sessions.describe` повертає один рядок сесії Gateway для точного ключа сесії.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` є варіантом interrupt-and-steer для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії. Викликач може передати `key` плюс необов’язковий `runId`, або передати лише `runId` для активних run, які Gateway може розв’язати до сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії та повідомляє розв’язану канонічну модель плюс ефективний `agentRuntime`.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату все ще використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` display-normalized для UI-клієнтів: inline directive tags вилучаються з видимого тексту, plain-text XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витіклі ASCII/full-width токени керування моделлю вилучаються, чисті рядки асистента з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися placeholders.

  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої в очікуванні та затверджені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` ротує токен сполученого пристрою в межах його затвердженої ролі та області викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його затвердженої ролі та області викликача.

  </Accordion>

  <Accordion title="Сполучення Node, invoke і робота в очікуванні">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` і `node.pair.verify` охоплюють сполучення Node і bootstrap verification.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює мітку сполученого Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени canvas-capability з областю дії.
    - `node.pending.pull` і `node.pending.ack` є API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною роботою в очікуванні для offline/disconnected Node.

  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити схвалення exec, а також пошук/відтворення схвалень в очікуванні.
    - `exec.approval.waitDecision` очікує на одне схвалення exec в очікуванні та повертає остаточне рішення (або `null` у разі timeout).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою схвалення exec через команди ретрансляції Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють визначені Plugin потоки схвалення.

  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або next-heartbeat ін’єкцію wake text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші події лише transcript
  чату.
- `session.message` і `session.tool`: оновлення transcript/event-stream для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка присутності системи.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка справності gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни cron run/job.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення Node.
- `node.invoke.request`: трансляція запиту invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл схвалення plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд середовища виконання для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочу область агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлена основна `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають нативні імена з урахуванням провайдера, коли вони доступні
  - `textAliases` містить точні slash aliases, як-от `/model` і `/m`.
  - `nativeName` містить нативну назву команди з урахуванням провайдера, коли вона існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність нативних команд Plugin.
  - `includeArgs=false` вилучає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів середовища виконання для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи інструмент Plugin є необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактично доступний у середовищі виконання інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст середовища виконання із сесії на боці сервера замість того, щоб приймати наданий викликачем контекст автентифікації або доставки.
  - Відповідь обмежена сесією і відображає те, що активна розмова може використовувати прямо зараз, зокрема інструменти ядра, Plugin і каналу.
- Оператори можуть викликати `tools.invoke` (`operator.write`), щоб викликати один доступний інструмент через той самий шлях політики Gateway, що й `/tools/invoke`.
  - `name` обов’язковий. `args`, `sessionKey`, `agentId`, `confirm` і `idempotencyKey` необов’язкові.
  - Якщо наявні і `sessionKey`, і `agentId`, розв’язаний агент сесії має збігатися з `agentId`.
  - Відповідь є конвертом для SDK з полями `ok`, `toolName`, необов’язковим `output` і типізованими полями `error`. Відмови через схвалення або політику повертають `ok:false` у payload, а не обходять конвеєр політики інструментів Gateway.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб прочитати робочу область агента за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та санітизовані параметри встановлення без розкриття сирих значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює папку skill до каталогу `skills/` робочої області агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у робочій області агента за замовчуванням.
  - Режим конфігурації виправляє значення `skills.entries.<skillKey>`, як-от `enabled`, `apiKey` і `env`.

### Подання `models.list`

`models.list` приймає необов’язковий параметр `view`:

- Пропущено або `"default"`: поточна поведінка середовища виконання. Якщо `agents.defaults.models` налаштовано, відповіддю буде дозволений каталог; інакше відповіддю буде повний каталог Gateway.
- `"configured"`: поведінка розміру засобу вибору. Якщо `agents.defaults.models` налаштовано, він усе одно має пріоритет. Інакше відповідь використовує явні записи `models.providers.*.models`, повертаючись до повного каталогу лише тоді, коли немає налаштованих рядків моделей.
- `"all"`: повний каталог Gateway, в обхід `agents.defaults.models`. Використовуйте це для діагностики та інтерфейсів виявлення, а не для звичайних засобів вибору моделей.

## Схвалення виконання

- Коли запит на виконання потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти оператора розв’язують це, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переспрямовані виклики `node.invoke system.run` повторно використовують цей канонічний `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` між підготовкою та фінальним схваленим переспрямуванням `system.run`, Gateway відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервний варіант доставки агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сесії, коли неможливо розв’язати зовнішній маршрут доставки (наприклад, внутрішні/webchat-сесії або неоднозначні багатоканальні конфігурації).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                 | За замовчуванням                                      | Джерело                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                        |
| Тайм-аут запиту (на RPC)                  | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                             |
| Тайм-аут preauth / connect-challenge      | `15_000` мс                                          | `src/gateway/handshake-timeouts.ts` (config/env можуть збільшити парний бюджет сервера/клієнта) |
| Початкова затримка повторного підключення | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                                                    |
| Максимальна затримка повторного підключення | `30_000` мс                                        | `src/gateway/client.ts` (`scheduleReconnect`)                                            |
| Обмеження швидкої повторної спроби після закриття device-token | `250` мс                            | `src/gateway/client.ts`                                                                  |
| Пільговий період force-stop перед `terminate()` | `250` мс                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                          |
| Тайм-аут за замовчуванням для `stopAndWait()` | `1_000` мс                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                               |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` мс                                  | `src/gateway/client.ts`                                                                  |
| Закриття через tick-timeout               | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                  |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                           | `src/gateway/server-constants.ts`                                                        |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не значень за замовчуванням до handshake.

## Автентифікація

- Автентифікація Gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect за
  заголовками запиту замість `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect
  зі спільним секретом; не відкривайте цей режим на публічному/недовіреному ingress.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю
  підключення + scopes. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має
  зберігати його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно
  використовувати збережений затверджений набір scopes для цього токена. Це зберігає
  доступ для читання/проби/статусу, який уже було надано, і не дає повторним
  підключенням непомітно звузитися до неявного scope лише для адміністратора.
- Формування автентифікації connect на стороні клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є незалежним і завжди передається, якщо заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для пристрою (ключований за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище
    варіантів не визначив `auth.token`. Спільний токен або будь-який визначений
    токен пристрою пригнічує його.
  - Автоматичне підвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoints** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` є токенами передачі bootstrap.
  Зберігайте їх лише тоді, коли connect використовував bootstrap-автентифікацію через
  довірений транспорт, як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей запитаний
  викликачем набір scopes залишається авторитетним; кешовані scopes повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен
  для пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- `device.token.rotate` повертає метадані ротації. Він дублює replacement
  bearer token лише для викликів із того самого пристрою, які вже автентифіковані цим
  токеном пристрою, щоб клієнти лише з токеном могли зберегти replacement перед
  повторним підключенням. Ротації shared/admin не дублюють bearer token.
- Видача, ротація та відкликання токенів залишаються обмеженими затвердженим
  набором ролей, записаним у pairing-записі цього пристрою; мутація токена не може
  розширити або націлити роль пристрою, яку схвалення pairing ніколи не надало.
- Для paired-device token sessions керування пристроями має self-scoped характер,
  якщо викликач також не має `operator.admin`: викликачі без прав адміністратора
  можуть видаляти/відкликати/ротувати лише запис **власного** пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scopes
  цільового operator token щодо поточних session scopes викликача. Викликачі без
  прав адміністратора не можуть ротувати або відкликати ширший operator token, ніж
  уже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть спробувати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати guidance щодо дій оператора.

## Ідентичність пристрою + спарювання

- Node-и мають містити стабільну ідентичність пристрою (`device.id`), похідну від
  fingerprint пари ключів.
- Gateways видають токени для кожного пристрою + ролі.
- Схвалення pairing потрібні для нових ID пристроїв, якщо не ввімкнене локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих підключеннях local loopback.
- OpenClaw також має вузький backend/container-local self-connect шлях для
  довірених helper flows зі спільним секретом.
- Підключення same-host tailnet або LAN усе одно вважаються віддаленими для pairing і
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині operator exceptions без пристрою — це явні trust paths:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з localhost-only insecure HTTP.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, суттєве зниження безпеки).
  - direct-loopback `gateway-client` backend RPCs, автентифіковані спільним
    gateway token/password.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для legacy clients, які досі використовують поведінку підписування до challenge, `connect` тепер повертає
detail codes `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені помилки міграції:

| Повідомлення                | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає v2 payload.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана timestamp поза дозволеним skew.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає fingerprint публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося обробити формат/канонікалізацію публічного ключа. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте v2 payload, який містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний signature payload — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Legacy `v2` signatures залишаються прийнятими для сумісності, але metadata pinning
  paired-device усе одно керує command policy під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити fingerprint сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол відкриває **повний gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
TypeBox schemas у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
