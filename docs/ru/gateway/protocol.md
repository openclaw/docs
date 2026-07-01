---
read_when:
    - Реализация или обновление WS-клиентов Gateway
    - Отладка несоответствий протокола или сбоев подключения
    - Повторная генерация схемы/моделей протокола
summary: 'Протокол WebSocket Gateway: рукопожатие, фреймы, версионирование'
title: Gateway protocol
x-i18n:
    generated_at: "2026-07-01T08:23:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS является **единой плоскостью управления + транспортом узлов** для
OpenClaw. Все клиенты (CLI, веб-UI, приложение macOS, узлы iOS/Android, headless-
узлы) подключаются через WebSocket и объявляют свои **role** + **scope** во
время handshake.

## Транспорт

- WebSocket, текстовые фреймы с JSON-полезной нагрузкой.
- Первый фрейм **должен** быть запросом `connect`.
- Pre-connect-фреймы ограничены 64 KiB. После успешного handshake клиенты
  должны соблюдать ограничения `hello-ok.policy.maxPayload` и
  `hello-ok.policy.maxBufferedBytes`. При включенной диагностике
  слишком большие входящие фреймы и медленные исходящие буферы генерируют события
  `payload.large` до того, как gateway закроет или отбросит затронутый фрейм.
  Эти события сохраняют размеры, лимиты, поверхности и безопасные коды причин.
  Они не сохраняют тело сообщения, содержимое вложений, сырое тело фрейма,
  токены, cookies или секретные значения.

## Handshake (connect)

Gateway → Клиент (pre-connect challenge):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Клиент → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

Gateway → Клиент:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
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

Пока Gateway еще завершает запуск sidecar-компонентов, запрос `connect` может
вернуть повторяемую ошибку `UNAVAILABLE` с `details.reason`, установленным в
`"startup-sidecars"`, и `retryAfterMs`. Клиенты должны повторить такой ответ
в пределах своего общего бюджета подключения, а не показывать его как
финальный сбой handshake.

`server`, `features`, `snapshot` и `policy` обязательны по схеме
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` также обязателен и сообщает
согласованные role/scopes. `pluginSurfaceUrls` необязателен и сопоставляет имена
поверхностей Plugin, например `canvas`, с scoped hosted URLs.

Scoped URLs поверхностей Plugin могут истекать. Узлы могут вызвать
`node.pluginSurface.refresh` с `{ "surface": "canvas" }`, чтобы получить свежую
запись в `pluginSurfaceUrls`. Экспериментальный рефакторинг Canvas Plugin не
поддерживает устаревший путь совместимости `canvasHostUrl`, `canvasCapability` или
`node.canvas.capability.refresh`; текущие native-клиенты и gateways должны
использовать поверхности Plugin.

Когда токен устройства не выдан, `hello-ok.auth` сообщает согласованные
разрешения без полей токенов:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Доверенные backend-клиенты в том же процессе (`client.id: "gateway-client"`,
`client.mode: "backend"`) могут опускать `device` при прямых loopback-подключениях,
когда они аутентифицируются общим токеном/паролем gateway. Этот путь
зарезервирован для внутренних RPC плоскости управления и не позволяет устаревшим
CLI/device pairing baselines блокировать локальную backend-работу, например
обновления сессий subagent. Удаленные клиенты, browser-origin-клиенты,
node-клиенты и клиенты с явным device-token/device-identity по-прежнему
используют обычные проверки pairing и scope-upgrade.

Когда токен устройства выдан, `hello-ok` также включает:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Встроенная bootstrap-передача через QR/setup-code — это новый путь передачи на
мобильное устройство. Успешное подключение с baseline setup-code возвращает
первичный токен узла плюс один ограниченный токен оператора:

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

Передача оператору намеренно ограничена, чтобы QR onboarding мог запустить
мобильный operator loop без выдачи `operator.admin` или `operator.pairing`.
Она включает `operator.talk.secrets`, чтобы native-клиент мог прочитать
конфигурацию Talk, необходимую ему после bootstrap. Более широкие scopes
администрирования и pairing требуют отдельного одобренного operator pairing или
потока токенов. Клиенты должны сохранять `hello-ok.auth.deviceTokens` только
когда connect использовал bootstrap auth на доверенном транспорте, таком как
`wss://` или loopback/local pairing.

### Пример узла

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

## Фрейминг

- **Запрос**: `{type:"req", id, method, params}`
- **Ответ**: `{type:"res", id, ok, payload|error}`
- **Событие**: `{type:"event", event, payload, seq?, stateVersion?}`

Методы с побочными эффектами требуют **idempotency keys** (см. схему).

## Роли + scopes

Полную модель operator scope, проверки во время approval и семантику
shared-secret см. в разделе [Operator scopes](/ru/gateway/operator-scopes).

### Роли

- `operator` = клиент плоскости управления (CLI/UI/автоматизация).
- `node` = хост возможностей (camera/screen/canvas/system.run).

### Scopes (operator)

Распространенные scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` с `includeSecrets: true` требует `operator.talk.secrets`
(или `operator.admin`).
Когда secrets включены, клиенты должны читать учетные данные активного
провайдера Talk из `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
остается в исходной форме и может быть объектом SecretRef или отредактированной
строкой.

RPC-методы gateway, зарегистрированные Plugin, могут запрашивать собственный
operator scope, но зарезервированные префиксы администрирования ядра
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) всегда разрешаются в
`operator.admin`.

Scope метода — только первый gate. Некоторые slash commands, доступные через
`chat.send`, применяют поверх него более строгие проверки на уровне команды.
Например, постоянные записи `/config set` и `/config unset` требуют
`operator.admin`.

`node.pair.approve` также имеет дополнительную проверку scope во время approval
поверх базового scope метода:

- запросы без команд: `operator.pairing`
- запросы с non-exec командами узла: `operator.pairing` + `operator.write`
- запросы, включающие `system.run`, `system.run.prepare` или `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (узел)

Узлы объявляют claims возможностей во время connect:

- `caps`: высокоуровневые категории возможностей, такие как `camera`, `canvas`, `screen`,
  `location`, `voice` и `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: детализированные переключатели (например, `screen.record`, `camera.capture`).

Gateway рассматривает их как **claims** и применяет server-side allowlists.

## Presence

- `system-presence` возвращает записи, ключом которых является identity устройства.
- Записи presence включают `deviceId`, `roles` и `scopes`, чтобы UI могли показывать одну строку на устройство,
  даже когда оно подключается и как **operator**, и как **node**.
- `node.list` включает необязательные поля `lastSeenAtMs` и `lastSeenReason`. Подключенные узлы сообщают
  текущее время своего подключения как `lastSeenAtMs` с причиной `connect`; paired-узлы также могут сообщать
  durable background presence, когда доверенное событие узла обновляет их pairing metadata.

### Фоновое событие alive узла

Узлы могут вызвать `node.event` с `event: "node.presence.alive"`, чтобы записать, что paired-узел был
alive во время background wake, не помечая его подключенным.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` — закрытый enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` или `connect`. Неизвестные строки trigger нормализуются gateway в
`background` перед сохранением. Событие durable только для аутентифицированных node
device sessions; сессии без устройства или без pairing возвращают `handled: false`.

Успешные gateways возвращают структурированный результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Более старые gateways могут все еще возвращать `{ "ok": true }` для `node.event`; клиенты должны считать это
подтвержденным RPC, а не durable persistence presence.

## Scoping широковещательных событий

Широковещательные события WebSocket, отправляемые сервером, scope-gated, чтобы сессии с pairing scope или node-only не получали пассивно содержимое сессии.

- **Фреймы chat, agent и tool-result** (включая streamed события `agent` и результаты tool call) требуют как минимум `operator.read`. Сессии без `operator.read` полностью пропускают эти фреймы.
- **Определенные Plugin широковещания `plugin.*`** gated на `operator.write` или `operator.admin`, в зависимости от того, как Plugin зарегистрировал их.
- **События статуса и транспорта** (`heartbeat`, `presence`, `tick`, жизненный цикл connect/disconnect и т. д.) остаются неограниченными, чтобы состояние транспорта было видно каждой аутентифицированной сессии.
- **Неизвестные семейства широковещательных событий** по умолчанию scope-gated (fail-closed), если зарегистрированный handler явно не ослабляет их.

Каждое клиентское подключение хранит собственный per-client sequence number, поэтому широковещания сохраняют монотонный порядок на этом socket, даже когда разные клиенты видят разные scope-filtered подмножества потока событий.

## Распространенные семейства RPC-методов

Публичная WS-поверхность шире, чем приведенные выше примеры handshake/auth. Это
не сгенерированный дамп — `hello-ok.features.methods` является консервативным
списком discovery, построенным из `src/gateway/server-methods-list.ts` плюс
загруженные экспорты методов Plugin/channel. Рассматривайте его как feature discovery, а не как полное
перечисление `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Система и идентификация">
    - `health` возвращает кэшированный или только что проверенный снимок состояния gateway.
    - `diagnostics.stability` возвращает недавний ограниченный регистратор диагностической стабильности. Он хранит операционные метаданные, такие как имена событий, счетчики, размеры в байтах, показания памяти, состояние очередей/сеансов, имена каналов/плагинов и идентификаторы сеансов. Он не хранит текст чатов, тела webhook, вывод инструментов, необработанные тела запросов или ответов, токены, cookie или секретные значения. Требуется область доступа оператора на чтение.
    - `status` возвращает сводку gateway в стиле `/status`; чувствительные поля включаются только для операторских клиентов с областью доступа администратора.
    - `gateway.identity.get` возвращает идентификатор устройства gateway, используемый потоками ретрансляции и сопряжения.
    - `system-presence` возвращает текущий снимок присутствия для подключенных операторских/node-устройств.
    - `system-event` добавляет системное событие и может обновлять/транслировать контекст присутствия.
    - `last-heartbeat` возвращает последнее сохраненное событие heartbeat.
    - `set-heartbeats` переключает обработку heartbeat на gateway.

  </Accordion>

  <Accordion title="Модели и использование">
    - `models.list` возвращает каталог моделей, разрешенных средой выполнения. Передайте `{ "view": "configured" }` для настроенных моделей размера пикера (`agents.defaults.models` сначала, затем `models.providers.*.models`) или `{ "view": "all" }` для полного каталога.
    - `usage.status` возвращает окна использования провайдеров и сводки оставшейся квоты.
    - `usage.cost` возвращает агрегированные сводки расходов за диапазон дат.
      Передайте `agentId` для одного агента или `agentScope: "all"` для агрегации настроенных агентов.
    - `doctor.memory.status` возвращает готовность векторной памяти / кэшированных эмбеддингов для активного рабочего пространства агента по умолчанию. Передавайте `{ "probe": true }` или `{ "deep": true }` только когда вызывающая сторона явно хочет выполнить живую проверку провайдера эмбеддингов. Клиенты, учитывающие Dreaming, также могут передать `{ "agentId": "agent-id" }`, чтобы ограничить статистику хранилища Dreaming выбранным рабочим пространством агента; если `agentId` не указан, сохраняется резервный вариант агента по умолчанию и агрегируются настроенные рабочие пространства Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` и `doctor.memory.dedupeDreamDiary` принимают необязательные параметры `{ "agentId": "agent-id" }` для представлений/действий Dreaming выбранного агента. Если `agentId` не указан, они работают с настроенным рабочим пространством агента по умолчанию.
    - `doctor.memory.remHarness` возвращает ограниченный, доступный только для чтения предпросмотр REM harness для удаленных клиентов плоскости управления. Он может включать пути рабочих пространств, фрагменты памяти, отрендеренный grounded markdown и кандидатов на глубокое продвижение, поэтому вызывающим сторонам требуется `operator.read`.
    - `sessions.usage` возвращает сводки использования по сеансам. Передайте `agentId` для одного
      агента или `agentScope: "all"`, чтобы вывести настроенных агентов вместе.
    - `sessions.usage.timeseries` возвращает использование временных рядов для одного сеанса.
    - `sessions.usage.logs` возвращает записи журнала использования для одного сеанса.

  </Accordion>

  <Accordion title="Каналы и помощники входа">
    - `channels.status` возвращает сводки состояния встроенных + поставляемых в комплекте каналов/плагинов.
    - `channels.logout` выполняет выход из конкретного канала/учетной записи, если канал поддерживает выход.
    - `web.login.start` запускает поток входа через QR/web для текущего провайдера web-канала с поддержкой QR.
    - `web.login.wait` ожидает завершения этого потока входа через QR/web и при успехе запускает канал.
    - `push.test` отправляет тестовый APNs push на зарегистрированный iOS-узел.
    - `voicewake.get` возвращает сохраненные триггеры wake-word.
    - `voicewake.set` обновляет триггеры wake-word и транслирует изменение.

  </Accordion>

  <Accordion title="Сообщения и журналы">
    - `send` — это прямой RPC исходящей доставки для отправок, нацеленных на канал/учетную запись/тред, вне chat runner.
    - `logs.tail` возвращает хвост настроенного файлового журнала gateway с управлением курсором/лимитом и максимальным числом байтов.

  </Accordion>

  <Accordion title="Talk и TTS">
    - `talk.catalog` возвращает доступный только для чтения каталог провайдеров Talk для речи, потоковой транскрипции и голоса в реальном времени. Он включает идентификаторы провайдеров, метки, состояние настройки, раскрытые идентификаторы моделей/голосов, канонические режимы, транспорты, стратегии brain и флаги аудио/возможностей реального времени, не возвращая секреты провайдеров и не изменяя глобальную конфигурацию.
    - `talk.config` возвращает эффективную полезную нагрузку конфигурации Talk; `includeSecrets` требует `operator.talk.secrets` (или `operator.admin`).
    - `talk.session.create` создает сеанс Talk, принадлежащий Gateway, для `realtime/gateway-relay`, `transcription/gateway-relay` или `stt-tts/managed-room`. Для `stt-tts/managed-room` вызывающие стороны с `operator.write`, которые передают `sessionKey`, также должны передать `spawnedBy` для ограниченной видимости ключа сеанса; создание `sessionKey` без области и `brain: "direct-tools"` требуют `operator.admin`.
    - `talk.session.join` проверяет токен сеанса managed-room, при необходимости испускает события `session.ready` или `session.replaced` и возвращает метаданные комнаты/сеанса плюс недавние события Talk без открытого токена или сохраненного хеша токена.
    - `talk.session.appendAudio` добавляет входное аудио PCM в base64 к принадлежащим Gateway сеансам ретрансляции реального времени и транскрипции.
    - `talk.session.startTurn`, `talk.session.endTurn` и `talk.session.cancelTurn` управляют жизненным циклом хода managed-room с отклонением устаревшего хода до очистки состояния.
    - `talk.session.cancelOutput` останавливает аудиовывод ассистента, главным образом для VAD-gated barge-in в сеансах ретрансляции Gateway.
    - `talk.session.submitToolResult` завершает вызов инструмента провайдера, испущенный принадлежащим Gateway сеансом ретрансляции реального времени. Передайте `options: { willContinue: true }` для промежуточного вывода инструмента, когда затем последует финальный результат, или `options: { suppressResponse: true }`, когда результат инструмента должен удовлетворить вызов провайдера без запуска еще одного ответа ассистента в реальном времени.
    - `talk.session.steer` отправляет голосовое управление активным запуском в принадлежащий Gateway сеанс Talk, поддерживаемый агентом. Он принимает `{ sessionId, text, mode? }`, где `mode` — `status`, `steer`, `cancel` или `followup`; если режим не указан, он классифицируется по произнесенному тексту.
    - `talk.session.close` закрывает принадлежащий Gateway сеанс ретрансляции, транскрипции или managed-room и испускает терминальные события Talk.
    - `talk.mode` задает/транслирует текущее состояние режима Talk для клиентов WebChat/Control UI.
    - `talk.client.create` создает принадлежащий клиенту сеанс провайдера реального времени с использованием `webrtc` или `provider-websocket`, при этом Gateway владеет конфигурацией, учетными данными, инструкциями и политикой инструментов.
    - `talk.client.toolCall` позволяет принадлежащим клиенту транспортам реального времени передавать вызовы инструментов провайдера политике Gateway. Первый поддерживаемый инструмент — `openclaw_agent_consult`; клиенты получают идентификатор запуска и ожидают обычных событий жизненного цикла чата перед отправкой специфичного для провайдера результата инструмента.
    - `talk.client.steer` отправляет голосовое управление активным запуском для принадлежащих клиенту транспортов реального времени. Gateway определяет активный встроенный запуск по `sessionKey` и возвращает структурированный результат accepted/rejected вместо молчаливого отбрасывания управления.
    - `talk.event` — единый канал событий Talk для адаптеров реального времени, транскрипции, STT/TTS, managed-room, телефонии и встреч.
    - `talk.speak` синтезирует речь через активного речевого провайдера Talk.
    - `tts.status` возвращает состояние включения TTS, активного провайдера, резервных провайдеров и состояние конфигурации провайдера.
    - `tts.providers` возвращает видимый инвентарь провайдеров TTS.
    - `tts.enable` и `tts.disable` переключают состояние настроек TTS.
    - `tts.setProvider` обновляет предпочтительного провайдера TTS.
    - `tts.convert` выполняет одноразовое преобразование текста в речь.

  </Accordion>

  <Accordion title="Секреты, конфигурация, обновление и мастер">
    - `secrets.reload` заново разрешает активные SecretRefs и заменяет состояние секретов среды выполнения только при полном успехе.
    - `secrets.resolve` разрешает назначения секретов, нацеленные на команды, для конкретного набора команд/целей.
    - `config.get` возвращает текущий снимок конфигурации и хеш.
    - `config.set` записывает проверенную полезную нагрузку конфигурации.
    - `config.patch` объединяет частичное обновление конфигурации. Разрушительная замена
      массива требует указания затронутого пути в `replacePaths`; вложенные массивы
      внутри элементов массива используют пути `[]`, например `agents.list[].skills`.
    - `config.apply` проверяет + заменяет полную полезную нагрузку конфигурации.
    - `config.schema` возвращает текущую полезную нагрузку схемы конфигурации, используемую Control UI и инструментами CLI: схему, `uiHints`, версию и метаданные генерации, включая метаданные схемы плагина + канала, когда среда выполнения может их загрузить. Схема включает метаданные полей `title` / `description`, полученные из тех же меток и справочного текста, которые используются UI, включая ветви композиции вложенных объектов, wildcard, элементов массива и `anyOf` / `oneOf` / `allOf`, когда существует соответствующая документация поля.
    - `config.schema.lookup` возвращает полезную нагрузку поиска с областью пути для одного пути конфигурации: нормализованный путь, поверхностный узел схемы, совпавшую подсказку + `hintPath`, необязательный `reloadKind` и сводки непосредственных дочерних элементов для детального просмотра UI/CLI. `reloadKind` — одно из `restart`, `hot` или `none` и отражает планировщик перезагрузки конфигурации Gateway для запрошенного пути. Узлы схемы поиска сохраняют пользовательскую документацию и общие поля валидации (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, границы чисел/строк/массивов/объектов и флаги вроде `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Дочерние сводки раскрывают `key`, нормализованный `path`, `type`, `required`, `hasChildren`, необязательный `reloadKind`, а также совпавшие `hint` / `hintPath`.
    - `update.run` запускает поток обновления gateway и планирует перезапуск только если само обновление прошло успешно; вызывающие стороны с сеансом могут включить `continuationMessage`, чтобы при запуске был возобновлен один последующий ход агента через очередь продолжения после перезапуска. Обновления через менеджер пакетов и контролируемые обновления git-checkout из плоскости управления используют отсоединенную передачу managed-service вместо замены дерева пакета или изменения checkout/build-вывода внутри живого Gateway. Запущенная передача возвращает `ok: true` с `result.reason: "managed-service-handoff-started"` и `handoff.status: "started"`; недоступные или неудачные передачи возвращают `ok: false` с `managed-service-handoff-unavailable` или `managed-service-handoff-failed`, плюс `handoff.command`, когда требуется ручное обновление через shell. Недоступная передача означает, что OpenClaw не имеет безопасной границы supervisor или устойчивой служебной идентичности, например `OPENCLAW_SYSTEMD_UNIT` для systemd. Во время запущенной передачи restart sentinel может кратко сообщать `stats.reason: "restart-health-pending"`; продолжение откладывается, пока CLI не проверит перезапущенный Gateway и не запишет финальный sentinel `ok`.
    - `update.status` обновляет и возвращает последний restart sentinel обновления, включая выполняемую версию после перезапуска, если она доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` и `wizard.cancel` предоставляют onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Помощники агента и рабочей области">
    - `agents.list` возвращает настроенные записи агентов, включая фактическую модель и метаданные среды выполнения.
    - `agents.create`, `agents.update` и `agents.delete` управляют записями агентов и привязкой рабочей области.
    - `agents.files.list`, `agents.files.get` и `agents.files.set` управляют bootstrap-файлами рабочей области, предоставляемыми агенту.
    - `tasks.list`, `tasks.get` и `tasks.cancel` предоставляют журнал задач Gateway клиентам SDK и операторам.
    - `artifacts.list`, `artifacts.get` и `artifacts.download` предоставляют сводки артефактов, полученных из транскрипта, и загрузки для явной области `sessionKey`, `runId` или `taskId`. Запросы запусков и задач разрешают принадлежащую им сессию на стороне сервера и возвращают только медиа транскрипта с совпадающим происхождением; небезопасные или локальные источники URL возвращают неподдерживаемые загрузки вместо получения данных на стороне сервера.
    - `environments.list` и `environments.status` предоставляют клиентам SDK доступное только для чтения обнаружение локальных для Gateway и узловых окружений.
    - `agent.identity.get` возвращает фактическую идентичность ассистента для агента или сессии.
    - `agent.wait` ожидает завершения запуска и возвращает терминальный снимок, когда он доступен.

  </Accordion>

  <Accordion title="Управление сессиями">
    - `sessions.list` возвращает текущий индекс сессий, включая метаданные `agentRuntime` для каждой строки, когда настроен backend среды выполнения агента.
    - `sessions.subscribe` и `sessions.unsubscribe` переключают подписки на события изменения сессий для текущего клиента WS.
    - `sessions.messages.subscribe` и `sessions.messages.unsubscribe` переключают подписки на события транскрипта/сообщений для одной сессии.
    - `sessions.preview` возвращает ограниченные предпросмотры транскриптов для конкретных ключей сессий.
    - `sessions.describe` возвращает одну строку сессии Gateway для точного ключа сессии.
    - `sessions.resolve` разрешает или канонизирует цель сессии.
    - `sessions.create` создает новую запись сессии.
    - `sessions.send` отправляет сообщение в существующую сессию.
    - `sessions.steer` — вариант прерывания и управления для активной сессии.
    - `sessions.abort` прерывает активную работу для сессии. Вызывающий код может передать `key` плюс необязательный `runId` или передать только `runId` для активных запусков, которые Gateway может разрешить в сессию.
    - `sessions.patch` обновляет метаданные/переопределения сессии и сообщает разрешенную каноническую модель плюс фактический `agentRuntime`.
    - `sessions.reset`, `sessions.delete` и `sessions.compact` выполняют обслуживание сессий.
    - `sessions.get` возвращает полную сохраненную строку сессии.
    - Выполнение чата по-прежнему использует `chat.history`, `chat.send`, `chat.abort` и `chat.inject`. `chat.history` нормализуется для отображения UI-клиентам: встроенные теги директив удаляются из видимого текста, plain-text XML-полезные нагрузки вызовов инструментов (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и усеченные блоки вызовов инструментов) и просочившиеся ASCII/полноширинные управляющие токены модели удаляются, строки ассистента только с беззвучными токенами, такие как точные `NO_REPLY` / `no_reply`, опускаются, а слишком большие строки могут заменяться заполнителями.
    - `chat.message.get` — аддитивный ограниченный читатель полного сообщения для одной видимой записи транскрипта. Клиенты передают `sessionKey`, необязательный `agentId`, когда выбор сессии ограничен агентом, плюс `messageId` транскрипта, ранее показанный через `chat.history`, а Gateway возвращает ту же нормализованную для отображения проекцию без легковесного лимита усечения истории, когда сохраненная запись все еще доступна и не слишком велика.
    - `chat.send` принимает одноразовый `fastMode: "auto"`, чтобы использовать быстрый режим для вызовов модели, начатых до автоматического порога, а затем запускать последующие повторы, fallback-вызовы, результаты инструментов или продолжения без быстрого режима. Порог по умолчанию составляет 60 секунд и может настраиваться для каждой модели через `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Вызывающий `chat.send` код может передать одноразовый `fastAutoOnSeconds`, чтобы переопределить порог для этого запроса.

  </Accordion>

  <Accordion title="Сопряжение устройств и токены устройств">
    - `device.pair.list` возвращает ожидающие и одобренные сопряженные устройства.
    - `device.pair.approve`, `device.pair.reject` и `device.pair.remove` управляют записями сопряжения устройств.
    - `device.token.rotate` ротирует токен сопряженного устройства в пределах его одобренной роли и области вызывающего кода.
    - `device.token.revoke` отзывает токен сопряженного устройства в пределах его одобренной роли и области вызывающего кода.

  </Accordion>

  <Accordion title="Сопряжение узлов, вызов и ожидающая работа">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` и `node.pair.verify` охватывают сопряжение узлов и bootstrap-проверку.
    - `node.list` и `node.describe` возвращают состояние известных/подключенных узлов.
    - `node.rename` обновляет метку сопряженного узла.
    - `node.invoke` пересылает команду подключенному узлу.
    - `node.invoke.result` возвращает результат для запроса вызова.
    - `node.event` передает события, исходящие от узла, обратно в gateway.
    - `node.pending.pull` и `node.pending.ack` — API очереди подключенного узла.
    - `node.pending.enqueue` и `node.pending.drain` управляют долговечной ожидающей работой для офлайн/отключенных узлов.

  </Accordion>

  <Accordion title="Семейства подтверждений">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` и `exec.approval.resolve` охватывают одноразовые запросы подтверждения exec, а также поиск/повтор ожидающих подтверждений.
    - `exec.approval.waitDecision` ожидает одно ожидающее подтверждение exec и возвращает итоговое решение (или `null` при тайм-ауте).
    - `exec.approvals.get` и `exec.approvals.set` управляют снимками политики подтверждений exec для gateway.
    - `exec.approvals.node.get` и `exec.approvals.node.set` управляют локальной для узла политикой подтверждений exec через команды ретрансляции узла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` и `plugin.approval.resolve` охватывают потоки подтверждений, определенные plugin.

  </Accordion>

  <Accordion title="Автоматизация, skills и инструменты">
    - Автоматизация: `wake` планирует немедленную или выполняемую при следующем heartbeat вставку wake-текста; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` управляют запланированной работой.
    - `cron.run` остается RPC в стиле постановки в очередь для ручных запусков. Клиенты, которым нужна семантика завершения, должны читать возвращенный `runId` и опрашивать `cron.runs`.
    - `cron.runs` принимает необязательный непустой фильтр `runId`, чтобы клиенты могли отслеживать один поставленный в очередь ручной запуск без гонки с другими записями истории для той же задачи.
    - Skills и инструменты: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Распространенные семейства событий

- `chat`: обновления UI-чата, такие как `chat.inject`, и другие события чата
  только для транскрипта. В протоколе v4 delta-полезные нагрузки содержат `deltaText`; `message` остается
  накопительным снимком ассистента. Замены не по префиксу устанавливают `replace=true`
  и используют `deltaText` как текст замены.
- `session.message`, `session.operation` и `session.tool`: обновления транскрипта,
  выполняющейся операции сессии и потока событий для подписанной
  сессии.
- `sessions.changed`: индекс сессий или метаданные изменились.
- `presence`: обновления снимка присутствия системы.
- `tick`: периодическое событие keepalive / проверки активности.
- `health`: обновление снимка состояния gateway.
- `heartbeat`: обновление потока событий heartbeat.
- `cron`: событие изменения запуска/задачи cron.
- `shutdown`: уведомление о завершении работы gateway.
- `node.pair.requested` / `node.pair.resolved`: жизненный цикл сопряжения узла.
- `node.invoke.request`: широковещательный запрос вызова узла.
- `device.pair.requested` / `device.pair.resolved`: жизненный цикл сопряженного устройства.
- `voicewake.changed`: конфигурация триггера wake-word изменилась.
- `exec.approval.requested` / `exec.approval.resolved`: жизненный цикл подтверждения exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: жизненный цикл подтверждения plugin.

### Вспомогательные методы узлов

- Узлы могут вызывать `skills.bins`, чтобы получить текущий список исполняемых файлов skill
  для проверок автоматического разрешения.

### RPC журнала задач

Клиенты-операторы могут просматривать и отменять записи фоновых задач Gateway через
RPC журнала задач. Эти методы возвращают очищенные сводки задач, а не необработанное
состояние среды выполнения.

- `tasks.list` требует `operator.read`.
  - Параметры: необязательный `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` или `"timed_out"`) или массив таких статусов,
    необязательный `agentId`, необязательный `sessionKey`, необязательный `limit` от `1` до
    `500` и необязательная строка `cursor`.
  - Результат: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` требует `operator.read`.
  - Параметры: `{ "taskId": string }`.
  - Результат: `{ "task": TaskSummary }`.
  - Отсутствующие идентификаторы задач возвращают форму ошибки not-found Gateway.
- `tasks.cancel` требует `operator.write`.
  - Параметры: `{ "taskId": string, "reason"?: string }`.
  - Результат:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` сообщает, была ли в журнале совпадающая задача. `cancelled`
    сообщает, приняла ли среда выполнения отмену или записала ее.

`TaskSummary` включает `id`, `status` и необязательные метаданные, такие как `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, временные метки, прогресс,
терминальную сводку и очищенный текст ошибки. `agentId` идентифицирует агента,
выполняющего задачу; `sessionKey` и `ownerKey` сохраняют контекст запрашивающего
и управления.

### Вспомогательные методы оператора

- Операторы могут вызвать `commands.list` (`operator.read`), чтобы получить инвентарь команд среды выполнения для агента.
  - `agentId` необязателен; опустите его, чтобы читать рабочую область агента по умолчанию.
  - `scope` управляет тем, на какую поверхность нацеливается основное `name`:
    - `text` возвращает основной текстовый токен команды без начального `/`
    - `native` и путь по умолчанию `both` возвращают нативные имена с учетом провайдера, когда они доступны
  - `textAliases` содержит точные слэш-псевдонимы, такие как `/model` и `/m`.
  - `nativeName` содержит нативное имя команды с учетом провайдера, когда оно существует.
  - `provider` необязателен и влияет только на нативное именование и доступность нативных команд plugin.
  - `includeArgs=false` исключает сериализованные метаданные аргументов из ответа.
- Операторы могут вызвать `tools.catalog` (`operator.read`), чтобы получить каталог инструментов среды выполнения для агента. Ответ включает сгруппированные инструменты и метаданные происхождения:
  - `source`: `core` или `plugin`
  - `pluginId`: владелец plugin, когда `source="plugin"`
  - `optional`: является ли инструмент plugin необязательным
- Операторы могут вызвать `tools.effective` (`operator.read`), чтобы получить фактически действующий инвентарь инструментов среды выполнения для сеанса.
  - `sessionKey` обязателен.
  - Gateway выводит доверенный контекст среды выполнения из сеанса на стороне сервера вместо принятия предоставленного вызывающим кодом контекста аутентификации или доставки.
  - Ответ представляет собой серверную проекцию активного инвентаря в области сеанса, включая ядро, plugin, канал и уже обнаруженные инструменты серверов MCP.
  - `tools.effective` доступен только для чтения для MCP: он может спроецировать прогретый каталог MCP сеанса через итоговую политику инструментов, но не создает среды выполнения MCP, не подключает транспорты и не выдает `tools/list`. Если подходящий прогретый каталог отсутствует, ответ может включать уведомление, такое как `mcp-not-yet-connected`, `mcp-not-yet-listed` или `mcp-stale-catalog`.
  - Элементы эффективных инструментов используют `source="core"`, `source="plugin"`, `source="channel"` или `source="mcp"`.
- Операторы могут вызвать `tools.invoke` (`operator.write`), чтобы вызвать один доступный инструмент через тот же путь политики Gateway, что и `/tools/invoke`.
  - `name` обязателен. `args`, `sessionKey`, `agentId`, `confirm` и `idempotencyKey` необязательны.
  - Если присутствуют и `sessionKey`, и `agentId`, разрешенный агент сеанса должен соответствовать `agentId`.
  - Обертки ядра только для владельца, такие как `cron`, `gateway` и `nodes`, требуют идентичность владельца/администратора (`operator.admin`), хотя сам метод `tools.invoke` является `operator.write`.
  - Ответ представляет собой конверт для SDK с полями `ok`, `toolName`, необязательным `output` и типизированными полями `error`. Отказы из-за одобрения или политики возвращают `ok:false` в полезной нагрузке, а не обходят конвейер политики инструментов Gateway.
- Операторы могут вызвать `skills.status` (`operator.read`), чтобы получить видимый инвентарь Skills для агента.
  - `agentId` необязателен; опустите его, чтобы читать рабочую область агента по умолчанию.
  - Ответ включает пригодность, отсутствующие требования, проверки конфигурации и санитизированные варианты установки без раскрытия необработанных секретных значений.
- Операторы могут вызвать `skills.search` и `skills.detail` (`operator.read`) для метаданных обнаружения ClawHub.
- Операторы могут вызвать `skills.upload.begin`, `skills.upload.chunk` и `skills.upload.commit` (`operator.admin`), чтобы подготовить приватный архив Skills перед установкой. Это отдельный административный путь загрузки для доверенных клиентов, а не обычный поток установки Skills из ClawHub, и он отключен по умолчанию, если не включен `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    создает загрузку, привязанную к этому slug и значению force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` добавляет байты по точному декодированному смещению.
  - `skills.upload.commit({ uploadId, sha256? })` проверяет итоговый размер и SHA-256. Commit только завершает загрузку; он не устанавливает Skills.
  - Загруженные архивы Skills являются zip-архивами, содержащими корневой `SKILL.md`. Внутреннее имя каталога архива никогда не выбирает цель установки.
- Операторы могут вызвать `skills.install` (`operator.admin`) в трех режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` устанавливает папку Skills в каталог `skills/` рабочей области агента по умолчанию.
  - Режим загрузки: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    устанавливает зафиксированную загрузку в каталог `skills/<slug>` рабочей области агента по умолчанию. Slug и значение force должны соответствовать исходному запросу `skills.upload.begin`. Этот режим отклоняется, если `skills.install.allowUploadedArchives` не включен. Настройка не влияет на установки ClawHub.
  - Режим установщика Gateway: `{ name, installId, timeoutMs? }`
    запускает объявленное действие `metadata.openclaw.install` на хосте Gateway. Старые клиенты все еще могут отправлять `dangerouslyForceUnsafeInstall`; это поле устарело, принимается только для совместимости протокола и игнорируется. Используйте `security.installPolicy` для решений установки, которыми владеет оператор.
- Операторы могут вызвать `skills.update` (`operator.admin`) в двух режимах:
  - Режим ClawHub обновляет один отслеживаемый slug или все отслеживаемые установки ClawHub в рабочей области агента по умолчанию.
  - Режим конфигурации исправляет значения `skills.entries.<skillKey>`, такие как `enabled`, `apiKey` и `env`.

### Представления `models.list`

`models.list` принимает необязательный параметр `view`:

- Опущен или `"default"`: текущее поведение среды выполнения. Если настроено `agents.defaults.models`, ответом является разрешенный каталог, включая динамически обнаруженные модели для записей `provider/*`. Иначе ответом является полный каталог Gateway.
- `"configured"`: поведение размером для средства выбора. Если настроено `agents.defaults.models`, оно все равно имеет приоритет, включая обнаружение в области провайдера для записей `provider/*`. Без списка разрешений ответ использует явные записи `models.providers.*.models`, откатываясь к полному каталогу только когда настроенные строки моделей отсутствуют.
- `"all"`: полный каталог Gateway, обходящий `agents.defaults.models`. Используйте это для диагностики и пользовательских интерфейсов обнаружения, а не для обычных средств выбора моделей.

## Одобрения exec

- Когда запрос exec требует одобрения, Gateway транслирует `exec.approval.requested`.
- Клиенты операторов разрешают его вызовом `exec.approval.resolve` (требуется область `operator.approvals`).
- Для `host=node` `exec.approval.request` должен включать `systemRunPlan` (канонические `argv`/`cwd`/`rawCommand`/метаданные сеанса). Запросы без `systemRunPlan` отклоняются.
- После одобрения перенаправленные вызовы `node.invoke system.run` повторно используют этот канонический `systemRunPlan` как авторитетный контекст команды/cwd/сеанса.
- Если вызывающий код изменяет `command`, `rawCommand`, `cwd`, `agentId` или `sessionKey` между подготовкой и окончательной одобренной пересылкой `system.run`, Gateway отклоняет запуск вместо доверия измененной полезной нагрузке.

## Резервная доставка агента

- Запросы `agent` могут включать `deliver=true`, чтобы запросить исходящую доставку.
- `bestEffortDeliver=false` сохраняет строгое поведение: неразрешенные или только внутренние цели доставки возвращают `INVALID_REQUEST`.
- `bestEffortDeliver=true` разрешает откат к выполнению только в сеансе, когда невозможно разрешить внешний доставляемый маршрут (например, внутренние/webchat-сеансы или неоднозначные многоканальные конфигурации).
- Итоговые результаты `agent` могут включать `result.deliveryStatus`, когда доставка была запрошена, используя те же статусы `sent`, `suppressed`, `partial_failed` и `failed`, которые задокументированы для [`openclaw agent --json --deliver`](/ru/cli/agent#json-delivery-status).

## Версионирование

- `PROTOCOL_VERSION` находится в `packages/gateway-protocol/src/version.ts`.
- Клиенты отправляют `minProtocol` + `maxProtocol`; сервер отклоняет диапазоны, которые не включают его текущий протокол. Текущим клиентам и серверам требуется протокол v4.
- Схемы и модели генерируются из определений TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константы клиента

Эталонный клиент в `src/gateway/client.ts` использует эти значения по умолчанию. Значения стабильны в протоколе v4 и являются ожидаемой базовой линией для сторонних клиентов.

| Константа                                 | Значение по умолчанию                                | Источник                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Тайм-аут запроса (на RPC)                 | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` мс                                          | `src/gateway/handshake-timeouts.ts` (config/env могут увеличить парный бюджет сервера/клиента) |
| Начальная задержка повторного подключения | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Макс. задержка повторного подключения     | `30_000` мс                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ограничение быстрого повтора после закрытия device-token | `250` мс                               | `src/gateway/client.ts`                                                                    |
| Льготный период force-stop перед `terminate()` | `250` мс                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Тайм-аут по умолчанию `stopAndWait()`     | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Интервал tick по умолчанию (до `hello-ok`) | `30_000` мс                                         | `src/gateway/client.ts`                                                                    |
| Закрытие по тайм-ауту tick                | код `4000`, когда молчание превышает `tickIntervalMs * 2` | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                           | `src/gateway/server-constants.ts`                                                          |

Сервер объявляет эффективные `policy.tickIntervalMs`, `policy.maxPayload` и `policy.maxBufferedBytes` в `hello-ok`; клиенты должны соблюдать эти значения, а не значения по умолчанию до рукопожатия.

## Аутентификация

- Аутентификация Gateway с общим секретом использует `connect.params.auth.token` или
  `connect.params.auth.password`, в зависимости от настроенного режима аутентификации.
- Режимы с идентификацией, такие как Tailscale Serve
  (`gateway.auth.allowTailscale: true`) или не-loopback
  `gateway.auth.mode: "trusted-proxy"`, выполняют проверку аутентификации connect по
  заголовкам запроса вместо `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` полностью пропускает connect-аутентификацию
  с общим секретом; не выставляйте этот режим на публичный или недоверенный ingress.
- После сопряжения Gateway выдает **токен устройства**, ограниченный ролью подключения
  и областями доступа. Он возвращается в `hello-ok.auth.deviceToken`, и клиент должен
  сохранять его для будущих подключений.
- Клиенты должны сохранять основной `hello-ok.auth.deviceToken` после любого
  успешного подключения.
- Повторное подключение с этим **сохраненным** токеном устройства должно также
  повторно использовать сохраненный набор одобренных областей доступа для этого
  токена. Это сохраняет уже предоставленный доступ на чтение, проверку и статус
  и не дает повторным подключениям незаметно сужаться до неявной области доступа
  только администратора.
- Сборка аутентификации подключения на стороне клиента (`selectConnectAuth` в
  `src/gateway/client.ts`):
  - `auth.password` ортогонален и всегда передается, когда задан.
  - `auth.token` заполняется в порядке приоритета: сначала явный общий токен,
    затем явный `deviceToken`, затем сохраненный токен конкретного устройства
    (по ключу `deviceId` + `role`).
  - `auth.bootstrapToken` отправляется только когда ни один из вариантов выше
    не разрешился в `auth.token`. Общий токен или любой разрешенный токен
    устройства подавляет его.
  - Автоматическое повышение сохраненного токена устройства при одноразовой
    повторной попытке `AUTH_TOKEN_MISMATCH` разрешено **только для доверенных
    конечных точек** — loopback или `wss://` с закрепленным `tlsFingerprint`.
    Публичный `wss://` без закрепления не подходит.
- Встроенная bootstrap-процедура с кодом настройки возвращает
  `hello-ok.auth.deviceToken` основного узла плюс ограниченный токен оператора в
  `hello-ok.auth.deviceTokens` для доверенной передачи на мобильное устройство.
  Токен оператора включает `operator.talk.secrets` для чтения нативной
  конфигурации Talk и исключает `operator.admin` и `operator.pairing`.
- Пока не-базовая bootstrap-процедура с кодом настройки ожидает одобрения, сведения
  `PAIRING_REQUIRED` включают `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` и `pauseReconnect: false`. Клиенты должны продолжать
  повторные подключения с тем же bootstrap-токеном, пока запрос не будет одобрен
  или токен не станет недействительным.
- Сохраняйте `hello-ok.auth.deviceTokens` только когда подключение использовало
  bootstrap-аутентификацию через доверенный транспорт, такой как `wss://`, или
  loopback/local-сопряжение.
- Если клиент предоставляет **явный** `deviceToken` или явные `scopes`, этот
  запрошенный вызывающей стороной набор областей доступа остается авторитетным;
  кэшированные области доступа повторно используются только когда клиент повторно
  использует сохраненный токен конкретного устройства.
- Токены устройств можно ротировать или отзывать через `device.token.rotate` и
  `device.token.revoke` (требуется область доступа `operator.pairing`). Ротация
  или отзыв узла либо другой не-операторской роли также требует `operator.admin`.
- `device.token.rotate` возвращает метаданные ротации. Он отражает замещающий
  bearer-токен только для вызовов с того же устройства, которые уже
  аутентифицированы этим токеном устройства, чтобы клиенты только с токеном могли
  сохранить замену перед повторным подключением. Ротации с общим или
  admin-токеном не отражают bearer-токен.
- Выпуск, ротация и отзыв токенов остаются ограниченными одобренным набором ролей,
  записанным в записи сопряжения этого устройства; изменение токена не может
  расширить или выбрать роль устройства, которую одобрение сопряжения никогда
  не предоставляло.
- Для сессий с токеном сопряженного устройства управление устройством
  самоограничено, если у вызывающей стороны нет `operator.admin`: вызывающие
  стороны без прав администратора могут управлять только токеном оператора для
  записи **своего** устройства. Управление токенами узла и других не-операторских
  ролей доступно только администратору, даже для собственного устройства вызывающей
  стороны.
- `device.token.rotate` и `device.token.revoke` также проверяют набор областей
  доступа целевого токена оператора относительно текущих областей доступа сессии
  вызывающей стороны. Вызывающие стороны без прав администратора не могут
  ротировать или отзывать более широкий токен оператора, чем тот, который у них
  уже есть.
- Сбои аутентификации включают `error.details.code` плюс подсказки по восстановлению:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведение клиента для `AUTH_TOKEN_MISMATCH`:
  - Доверенные клиенты могут выполнить одну ограниченную повторную попытку с
    кэшированным токеном конкретного устройства.
  - Если эта повторная попытка завершается неудачно, клиенты должны остановить
    автоматические циклы повторного подключения и показать оператору рекомендации
    по действиям.
- `AUTH_SCOPE_MISMATCH` означает, что токен устройства был распознан, но не
  покрывает запрошенные роль или области доступа. Клиенты не должны представлять
  это как недействительный токен; предложите оператору повторно выполнить
  сопряжение или одобрить более узкий/широкий контракт областей доступа.

## Идентичность устройства + сопряжение

- Узлы должны включать стабильную идентичность устройства (`device.id`),
  полученную из отпечатка пары ключей.
- Gateways выдают токены для пары устройство + роль.
- Одобрения сопряжения требуются для новых ID устройств, если не включено
  локальное автоодобрение.
- Автоодобрение сопряжения сосредоточено на прямых подключениях через local loopback.
- OpenClaw также имеет узкий backend/container-local путь самоподключения для
  доверенных вспомогательных потоков с общим секретом.
- Подключения из tailnet или LAN на том же хосте все равно считаются удаленными
  для сопряжения и требуют одобрения.
- WS-клиенты обычно включают идентичность `device` во время `connect` (оператор +
  узел). Единственные исключения оператора без устройства — явные доверенные пути:
  - `gateway.controlUi.allowInsecureAuth=true` для совместимости небезопасного HTTP только на localhost.
  - успешная аутентификация оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серьезное снижение безопасности).
  - backend RPC прямого-loopback `gateway-client` по зарезервированному внутреннему
    вспомогательному пути.
- Пропуск идентичности устройства влияет на области доступа. Когда подключение
  оператора без устройства разрешено через явный доверенный путь, OpenClaw все
  равно очищает самозаявленные области доступа до пустого набора, если у этого
  пути нет именованного исключения сохранения областей доступа. Методы с проверкой
  областей доступа затем завершаются с ошибкой `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` — это путь break-glass
  Control UI с сохранением областей доступа. Он не предоставляет области доступа
  произвольным пользовательским backend- или CLI-образным WebSocket-клиентам.
- Зарезервированный вспомогательный backend-путь прямого-loopback `gateway-client`
  сохраняет области доступа только для внутренних локальных RPC плоскости
  управления; пользовательские backend ID не получают это исключение.
- Все подключения должны подписывать nonce `connect.challenge`, предоставленный сервером.

### Диагностика миграции аутентификации устройства

Для устаревших клиентов, которые все еще используют поведение подписи до challenge, `connect` теперь возвращает
детальные коды `DEVICE_AUTH_*` в `error.details.code` со стабильным `error.details.reason`.

Распространенные сбои миграции:

| Сообщение                   | details.code                     | details.reason           | Значение                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клиент пропустил `device.nonce` (или отправил пустое значение). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клиент подписал устаревший/неверный nonce.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Полезная нагрузка подписи не соответствует полезной нагрузке v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Подписанная временная метка вне допустимого сдвига. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не соответствует отпечатку открытого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/каноникализация открытого ключа не прошли проверку. |

Цель миграции:

- Всегда дожидайтесь `connect.challenge`.
- Подписывайте полезную нагрузку v2, которая включает серверный nonce.
- Отправляйте тот же nonce в `connect.params.device.nonce`.
- Предпочтительная полезная нагрузка подписи — `v3`, которая связывает `platform` и `deviceFamily`
  в дополнение к полям устройства/клиента/роли/областей доступа/токена/nonce.
- Устаревшие подписи `v2` продолжают приниматься для совместимости, но закрепление
  метаданных сопряженного устройства по-прежнему управляет политикой команд при
  повторном подключении.

## TLS + закрепление

- TLS поддерживается для WS-подключений.
- Клиенты могут при желании закрепить отпечаток сертификата Gateway (см. конфигурацию
  `gateway.tls` плюс `gateway.remote.tlsFingerprint` или CLI `--tls-fingerprint`).

## Область доступа

Этот протокол предоставляет **полный API Gateway** (статус, каналы, модели, чат,
агент, сессии, узлы, одобрения и т. д.). Точная поверхность определена схемами
TypeBox в `packages/gateway-protocol/src/schema.ts`.

## Связанные материалы

- [Протокол Bridge](/ru/gateway/bridge-protocol)
- [Runbook Gateway](/ru/gateway)
