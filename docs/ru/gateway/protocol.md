---
read_when:
    - Реализация или обновление WS-клиентов Gateway
    - Отладка несовпадений протокола или сбоев подключения
    - Повторная генерация схемы/моделей протокола
summary: 'Протокол WebSocket Gateway: рукопожатие, кадры, управление версиями'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-07-03T09:52:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Протокол Gateway WS — это **единая плоскость управления + транспорт узлов** для
OpenClaw. Все клиенты (CLI, веб-интерфейс, приложение macOS, узлы iOS/Android, безголовые
узлы) подключаются через WebSocket и объявляют свою **роль** + **область** во
время рукопожатия.

## Транспорт

- WebSocket, текстовые кадры с JSON-полезной нагрузкой.
- Первый кадр **должен** быть запросом `connect`.
- Кадры до подключения ограничены 64 KiB. После успешного рукопожатия клиенты
  должны соблюдать ограничения `hello-ok.policy.maxPayload` и
  `hello-ok.policy.maxBufferedBytes`. При включенной диагностике
  слишком большие входящие кадры и медленные исходящие буферы отправляют события
  `payload.large` до того, как gateway закрывает или отбрасывает затронутый кадр. Эти события сохраняют
  размеры, лимиты, поверхности и безопасные коды причин. Они не сохраняют тело
  сообщения, содержимое вложений, необработанное тело кадра, токены, cookies или секретные значения.

## Рукопожатие (connect)

Gateway → Клиент (challenge до подключения):

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
`"startup-sidecars"`, и `retryAfterMs`. Клиентам следует повторять такой ответ
в рамках общего бюджета подключения, а не показывать его как окончательный
сбой рукопожатия.

`server`, `features`, `snapshot` и `policy` обязательны по схеме
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` также обязателен и сообщает
согласованные роль/области. `pluginSurfaceUrls` необязателен и сопоставляет имена
поверхностей Plugin, такие как `canvas`, с областью действия размещенных URL.

URL поверхностей Plugin с областью действия могут истекать. Узлы могут вызвать
`node.pluginSurface.refresh` с `{ "surface": "canvas" }`, чтобы получить свежую
запись в `pluginSurfaceUrls`. Экспериментальный рефакторинг Canvas Plugin не
поддерживает устаревший путь совместимости `canvasHostUrl`, `canvasCapability` или
`node.canvas.capability.refresh`; текущие нативные клиенты и
gateway должны использовать поверхности Plugin.

Когда токен устройства не выдается, `hello-ok.auth` сообщает согласованные
разрешения без полей токена:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Доверенные backend-клиенты в том же процессе (`client.id: "gateway-client"`,
`client.mode: "backend"`) могут опускать `device` при прямых local loopback-подключениях, когда
они аутентифицируются общим токеном/паролем gateway. Этот путь зарезервирован
для внутренних RPC плоскости управления и не дает устаревшим базовым данным привязки CLI/устройства
блокировать локальную backend-работу, такую как обновления сессий subagent. Удаленные клиенты,
клиенты с browser-origin, клиенты-узлы и явные клиенты с device-token/device-identity
по-прежнему используют обычные проверки привязки и повышения области.

Когда токен устройства выдается, `hello-ok` также включает:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Встроенная начальная загрузка через QR/setup-code — это свежий путь передачи на мобильное устройство. Успешное
подключение с базовым setup-code возвращает основной токен узла и один ограниченный
токен оператора:

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

Передача оператору намеренно ограничена, чтобы QR-онбординг мог запустить
мобильный операторский цикл без выдачи `operator.admin` или `operator.pairing`.
Она включает `operator.talk.secrets`, чтобы нативный клиент мог прочитать конфигурацию Talk,
которая нужна ему после начальной загрузки. Более широкие области администратора и привязки требуют
отдельной одобренной привязки оператора или потока токенов. Клиентам следует сохранять
`hello-ok.auth.deviceTokens` только
когда connect использовал bootstrap-аутентификацию на доверенном транспорте, таком как `wss://` или
loopback/локальная привязка.

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

## Формат кадров

- **Запрос**: `{type:"req", id, method, params}`
- **Ответ**: `{type:"res", id, ok, payload|error}`
- **Событие**: `{type:"event", event, payload, seq?, stateVersion?}`

Методы с побочными эффектами требуют **ключей идемпотентности** (см. схему).

## Роли + области

Полную модель областей оператора, проверки во время одобрения и семантику
общего секрета см. в [Области оператора](/ru/gateway/operator-scopes).

### Роли

- `operator` = клиент плоскости управления (CLI/UI/автоматизация).
- `node` = хост возможностей (camera/screen/canvas/system.run).

### Области (operator)

Распространенные области:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` с `includeSecrets: true` требует `operator.talk.secrets`
(или `operator.admin`).
Когда секреты включены, клиентам следует читать учетные данные активного поставщика Talk
из `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
сохраняет форму источника и может быть объектом SecretRef или отредактированной строкой.

Зарегистрированные Plugin методы gateway RPC могут запрашивать собственную область оператора, но
зарезервированные основные admin-префиксы (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) всегда разрешаются в `operator.admin`.

Область метода — только первый шлюз. Некоторые slash-команды, достигнутые через
`chat.send`, применяют более строгие проверки уровня команды поверх него. Например, постоянные
записи `/config set` и `/config unset` требуют `operator.admin`.

`node.pair.approve` также имеет дополнительную проверку области во время одобрения поверх
базовой области метода:

- запросы без команд: `operator.pairing`
- запросы с командами узла не exec: `operator.pairing` + `operator.write`
- запросы, включающие `system.run`, `system.run.prepare` или `system.which`:
  `operator.pairing` + `operator.admin`

### Возможности/команды/разрешения (node)

Узлы объявляют claims возможностей во время подключения:

- `caps`: высокоуровневые категории возможностей, такие как `camera`, `canvas`, `screen`,
  `location`, `voice` и `talk`.
- `commands`: allowlist команд для invoke.
- `permissions`: детальные переключатели (например, `screen.record`, `camera.capture`).

Gateway рассматривает их как **claims** и применяет server-side allowlists.

## Presence

- `system-presence` возвращает записи, ключом которых является identity устройства.
- Записи Presence включают `deviceId`, `roles` и `scopes`, чтобы UI могли показывать одну строку на устройство
  даже когда оно подключается и как **operator**, и как **node**.
- `node.list` включает необязательные поля `lastSeenAtMs` и `lastSeenReason`. Подключенные узлы сообщают
  свое текущее время подключения как `lastSeenAtMs` с причиной `connect`; привязанные узлы также могут сообщать
  устойчивое фоновое Presence, когда доверенное событие узла обновляет их метаданные привязки.

### Фоновое событие активности узла

Узлы могут вызвать `node.event` с `event: "node.presence.alive"`, чтобы записать, что привязанный узел был
активен во время фонового пробуждения, не помечая его подключенным.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` — закрытое перечисление: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` или `connect`. Неизвестные строки trigger нормализуются в
`background` gateway до сохранения. Событие устойчиво только для аутентифицированных
сессий устройства-узла; сессии без устройства или без привязки возвращают `handled: false`.

Успешные gateway возвращают структурированный результат:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Старые gateway могут по-прежнему возвращать `{ "ok": true }` для `node.event`; клиентам следует рассматривать это как
подтвержденный RPC, а не как устойчивое сохранение Presence.

## Область broadcast-событий

Отправляемые сервером broadcast-события WebSocket ограничиваются по областям, чтобы сессии с областью привязки или только узловые сессии не получали пассивно содержимое сессии.

- **Кадры chat, agent и tool-result** (включая потоковые события `agent` и результаты вызовов инструментов) требуют как минимум `operator.read`. Сессии без `operator.read` полностью пропускают эти кадры.
- **Определенные Plugin broadcast-события `plugin.*`** ограничены `operator.write` или `operator.admin`, в зависимости от того, как Plugin зарегистрировал их.
- **События статуса и транспорта** (`heartbeat`, `presence`, `tick`, жизненный цикл подключения/отключения и т. д.) остаются без ограничений, чтобы состояние транспорта было наблюдаемым для каждой аутентифицированной сессии.
- **Неизвестные семейства broadcast-событий** по умолчанию ограничиваются по области (fail-closed), если зарегистрированный handler явно не ослабляет их.

Каждое клиентское подключение хранит собственный порядковый номер на клиента, поэтому broadcast-события сохраняют монотонный порядок на этом сокете, даже когда разные клиенты видят разные подмножества потока событий после фильтрации по областям.

## Распространенные семейства методов RPC

Публичная поверхность WS шире, чем приведенные выше примеры рукопожатия/аутентификации. Это
не сгенерированный дамп — `hello-ok.features.methods` является консервативным
списком discovery, построенным из `src/gateway/server-methods-list.ts` плюс загруженных
экспортов методов Plugin/каналов. Рассматривайте его как feature discovery, а не как полное
перечисление `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Система и идентификация">
    - `health` возвращает кэшированный или только что проверенный снимок состояния Gateway.
    - `diagnostics.stability` возвращает недавний ограниченный регистратор диагностической стабильности. Он хранит операционные метаданные, такие как имена событий, счетчики, размеры в байтах, показания памяти, состояние очереди/сеанса, имена каналов/Plugin и идентификаторы сеансов. Он не хранит текст чата, тела webhook, вывод инструментов, необработанные тела запросов или ответов, токены, cookies или секретные значения. Требуется область чтения оператора.
    - `status` возвращает сводку Gateway в стиле `/status`; чувствительные поля включаются только для операторских клиентов с областью администратора.
    - `gateway.identity.get` возвращает идентификатор устройства Gateway, используемый в потоках ретрансляции и сопряжения.
    - `system-presence` возвращает текущий снимок присутствия для подключенных операторских/узловых устройств.
    - `system-event` добавляет системное событие и может обновлять/транслировать контекст присутствия.
    - `last-heartbeat` возвращает последнее сохраненное событие heartbeat.
    - `set-heartbeats` включает или отключает обработку heartbeat на Gateway.

  </Accordion>

  <Accordion title="Модели и использование">
    - `models.list` возвращает каталог моделей, разрешенных во время выполнения. Передайте `{ "view": "configured" }` для настроенных моделей размером под список выбора (`agents.defaults.models` сначала, затем `models.providers.*.models`) или `{ "view": "all" }` для полного каталога.
    - `usage.status` возвращает сводки по окнам использования провайдера и оставшейся квоте.
    - `usage.cost` возвращает агрегированные сводки расходов за диапазон дат.
      Передайте `agentId` для одного агента или `agentScope: "all"` для агрегирования настроенных агентов.
    - `doctor.memory.status` возвращает готовность векторной памяти / кэшированных embedding для активного рабочего пространства агента по умолчанию. Передавайте `{ "probe": true }` или `{ "deep": true }` только когда вызывающий явно хочет выполнить живую проверку провайдера embedding. Клиенты, учитывающие Dreaming, также могут передавать `{ "agentId": "agent-id" }`, чтобы ограничить статистику хранилища Dreaming выбранным рабочим пространством агента; если `agentId` опущен, сохраняется fallback на агента по умолчанию и агрегируются настроенные рабочие пространства Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` и `doctor.memory.dedupeDreamDiary` принимают необязательные параметры `{ "agentId": "agent-id" }` для представлений/действий Dreaming выбранного агента. Если `agentId` опущен, они работают с настроенным рабочим пространством агента по умолчанию.
    - `doctor.memory.remHarness` возвращает ограниченный, доступный только для чтения предпросмотр REM harness для удаленных клиентов control plane. Он может включать пути рабочих пространств, фрагменты памяти, отрендеренный grounded markdown и кандидатов для глубокого продвижения, поэтому вызывающим требуется `operator.read`.
    - `sessions.usage` возвращает сводки использования по сеансам. Передайте `agentId` для одного
      агента или `agentScope: "all"`, чтобы перечислить настроенных агентов вместе.
    - `sessions.usage.timeseries` возвращает временной ряд использования для одного сеанса.
    - `sessions.usage.logs` возвращает записи журнала использования для одного сеанса.

  </Accordion>

  <Accordion title="Каналы и помощники входа">
    - `channels.status` возвращает сводки состояния встроенных и поставляемых каналов/Plugin.
    - `channels.logout` выполняет выход из конкретного канала/учетной записи, если канал поддерживает выход.
    - `web.login.start` запускает поток входа по QR/web для текущего провайдера web-канала с поддержкой QR.
    - `web.login.wait` ожидает завершения этого потока входа по QR/web и при успехе запускает канал.
    - `push.test` отправляет тестовый APNs push на зарегистрированный iOS-узел.
    - `voicewake.get` возвращает сохраненные триггеры wake-word.
    - `voicewake.set` обновляет триггеры wake-word и транслирует изменение.

  </Accordion>

  <Accordion title="Сообщения и журналы">
    - `send` — это прямой RPC для исходящей доставки, предназначенной для канала/учетной записи/потока, вне chat runner.
    - `logs.tail` возвращает настроенный хвост файлового журнала Gateway с управлением курсором/лимитом и максимальным числом байтов.

  </Accordion>

  <Accordion title="Разговор и TTS">
    - `talk.catalog` возвращает доступный только для чтения каталог провайдеров Talk для речи, потоковой транскрипции и realtime voice. Он включает канонические идентификаторы провайдеров, псевдонимы реестра, метки, настроенное состояние, необязательный результат `ready` на уровне группы, открытые идентификаторы моделей/голосов, канонические режимы, транспорты, стратегии brain и realtime audio/capability flags, не возвращая секреты провайдера и не изменяя глобальную конфигурацию. Текущие Gateway устанавливают `ready` после применения выбора runtime-провайдера; клиенты должны считать его отсутствие непроверенным для совместимости со старыми Gateway.
    - `talk.config` возвращает эффективную полезную нагрузку конфигурации Talk; `includeSecrets` требует `operator.talk.secrets` (или `operator.admin`).
    - `talk.session.create` создает принадлежащий Gateway сеанс Talk для `realtime/gateway-relay`, `transcription/gateway-relay` или `stt-tts/managed-room`. Для `stt-tts/managed-room` вызывающие с `operator.write`, которые передают `sessionKey`, также должны передать `spawnedBy` для scoped-видимости ключа сеанса; создание `sessionKey` без области и `brain: "direct-tools"` требуют `operator.admin`.
    - `talk.session.join` проверяет токен сеанса managed-room, при необходимости испускает события `session.ready` или `session.replaced` и возвращает метаданные комнаты/сеанса плюс недавние события Talk без открытого токена или сохраненного хэша токена.
    - `talk.session.appendAudio` добавляет входное аудио base64 PCM к принадлежащим Gateway сеансам realtime relay и transcription.
    - `talk.session.startTurn`, `talk.session.endTurn` и `talk.session.cancelTurn` управляют жизненным циклом хода managed-room с отклонением устаревшего хода до очистки состояния.
    - `talk.session.cancelOutput` останавливает аудиовывод assistant, прежде всего для VAD-gated barge-in в сеансах Gateway relay.
    - `talk.session.submitToolResult` завершает вызов инструмента провайдера, испущенный принадлежащим Gateway сеансом realtime relay. Передайте `options: { willContinue: true }` для промежуточного вывода инструмента, когда итоговый результат последует позже, или `options: { suppressResponse: true }`, когда результат инструмента должен удовлетворить вызов провайдера без запуска еще одного realtime-ответа assistant.
    - `talk.session.steer` отправляет голосовое управление активным запуском в принадлежащий Gateway сеанс Talk на базе агента. Он принимает `{ sessionId, text, mode? }`, где `mode` — `status`, `steer`, `cancel` или `followup`; опущенный режим классифицируется по произнесенному тексту.
    - `talk.session.close` закрывает принадлежащий Gateway сеанс relay, transcription или managed-room и испускает терминальные события Talk.
    - `talk.mode` устанавливает/транслирует текущее состояние режима Talk для клиентов WebChat/Control UI.
    - `talk.client.create` создает принадлежащий клиенту realtime-сеанс провайдера с использованием `webrtc` или `provider-websocket`, при этом Gateway владеет конфигурацией, учетными данными, инструкциями и политикой инструментов.
    - `talk.client.toolCall` позволяет принадлежащим клиенту realtime-транспортам пересылать вызовы инструментов провайдера в политику Gateway. Первый поддерживаемый инструмент — `openclaw_agent_consult`; клиенты получают идентификатор запуска и ждут обычных событий жизненного цикла чата перед отправкой результата инструмента, специфичного для провайдера.
    - `talk.client.steer` отправляет голосовое управление активным запуском для принадлежащих клиенту realtime-транспортов. Gateway разрешает активный встроенный запуск из `sessionKey` и возвращает структурированный результат accepted/rejected вместо молчаливого отбрасывания управления.
    - `talk.event` — единый канал событий Talk для realtime, transcription, STT/TTS, managed-room, telephony и meeting adapters.
    - `talk.speak` синтезирует речь через активного речевого провайдера Talk.
    - `tts.status` возвращает включенное состояние TTS, активного провайдера, fallback-провайдеров и состояние конфигурации провайдера.
    - `tts.providers` возвращает видимый список провайдеров TTS.
    - `tts.enable` и `tts.disable` переключают состояние настроек TTS.
    - `tts.setProvider` обновляет предпочитаемого провайдера TTS.
    - `tts.convert` выполняет одноразовое преобразование текста в речь.

  </Accordion>

  <Accordion title="Секреты, конфигурация, обновление и мастер">
    - `secrets.reload` заново разрешает активные SecretRefs и заменяет runtime-состояние секретов только при полном успехе.
    - `secrets.resolve` разрешает назначения секретов для целевой команды для конкретного набора command/target.
    - `config.get` возвращает текущий снимок конфигурации и хэш.
    - `config.set` записывает проверенную полезную нагрузку конфигурации.
    - `config.patch` объединяет частичное обновление конфигурации. Разрушительная замена
      массива требует указать затронутый путь в `replacePaths`; вложенные массивы
      под элементами массива используют пути `[]`, такие как `agents.list[].skills`.
    - `config.apply` проверяет и заменяет полную полезную нагрузку конфигурации.
    - `config.schema` возвращает живую полезную нагрузку схемы конфигурации, используемую Control UI и инструментами CLI: схему, `uiHints`, версию и метаданные генерации, включая метаданные схемы Plugin и канала, когда runtime может их загрузить. Схема включает метаданные полей `title` / `description`, полученные из тех же меток и справочного текста, что используются UI, включая вложенные объекты, wildcard, элементы массива и ветви композиции `anyOf` / `oneOf` / `allOf`, когда существует соответствующая документация поля.
    - `config.schema.lookup` возвращает полезную нагрузку поиска, ограниченную путем, для одного пути конфигурации: нормализованный путь, неглубокий узел схемы, совпавшую подсказку + `hintPath`, необязательный `reloadKind` и сводки непосредственных дочерних элементов для детализации в UI/CLI. `reloadKind` — одно из `restart`, `hot` или `none` и отражает планировщик перезагрузки конфигурации Gateway для запрошенного пути. Узлы схемы lookup сохраняют пользовательскую документацию и общие поля валидации (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числовые/строковые/массивные/объектные ограничения и флаги вроде `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Сводки дочерних элементов раскрывают `key`, нормализованный `path`, `type`, `required`, `hasChildren`, необязательный `reloadKind`, а также совпавшие `hint` / `hintPath`.
    - `update.run` запускает поток обновления Gateway и планирует перезапуск только когда само обновление успешно; вызывающие с сеансом могут включить `continuationMessage`, чтобы при запуске возобновился один последующий ход агента через очередь продолжения после перезапуска. Обновления package-manager и supervised git-checkout updates из control plane используют detached managed-service handoff вместо замены дерева пакета или изменения checkout/build output внутри работающего Gateway. Запущенный handoff возвращает `ok: true` с `result.reason: "managed-service-handoff-started"` и `handoff.status: "started"`; недоступные или неудачные handoff возвращают `ok: false` с `managed-service-handoff-unavailable` или `managed-service-handoff-failed`, плюс `handoff.command`, когда требуется ручное shell-обновление. Недоступный handoff означает, что у OpenClaw нет безопасной границы supervisor или устойчивой идентичности службы, например `OPENCLAW_SYSTEMD_UNIT` для systemd. Во время запущенного handoff restart sentinel может кратковременно сообщать `stats.reason: "restart-health-pending"`; продолжение откладывается, пока CLI не проверит перезапущенный Gateway и не запишет итоговый `ok` sentinel.
    - `update.status` обновляет и возвращает последний restart sentinel обновления, включая работающую версию после перезапуска, когда она доступна.
    - `wizard.start`, `wizard.next`, `wizard.status` и `wizard.cancel` открывают onboarding wizard через WS RPC.

  </Accordion>

  <Accordion title="Вспомогательные средства агента и рабочей области">
    - `agents.list` возвращает настроенные записи агентов, включая действующую модель и метаданные среды выполнения.
    - `agents.create`, `agents.update` и `agents.delete` управляют записями агентов и привязкой рабочей области.
    - `agents.files.list`, `agents.files.get` и `agents.files.set` управляют начальными файлами рабочей области, предоставляемыми агенту.
    - `tasks.list`, `tasks.get` и `tasks.cancel` предоставляют журнал задач Gateway клиентам SDK и операторам.
    - `artifacts.list`, `artifacts.get` и `artifacts.download` предоставляют сводки артефактов, полученные из транскрипта, и скачивания для явной области `sessionKey`, `runId` или `taskId`. Запросы запусков и задач определяют владеющую сессию на стороне сервера и возвращают только медиа транскрипта с совпадающим происхождением; небезопасные или локальные источники URL возвращают неподдерживаемые скачивания вместо загрузки на стороне сервера.
    - `environments.list` и `environments.status` предоставляют клиентам SDK доступное только для чтения обнаружение локальных для Gateway и Node окружений.
    - `agent.identity.get` возвращает действующую идентичность ассистента для агента или сессии.
    - `agent.wait` ожидает завершения запуска и возвращает терминальный снимок, когда он доступен.

  </Accordion>

  <Accordion title="Управление сессией">
    - `sessions.list` возвращает текущий индекс сессий, включая метаданные `agentRuntime` для каждой строки, когда настроен backend среды выполнения агента.
    - `sessions.subscribe` и `sessions.unsubscribe` переключают подписки на события изменения сессий для текущего клиента WS.
    - `sessions.messages.subscribe` и `sessions.messages.unsubscribe` переключают подписки на события транскрипта/сообщений для одной сессии.
    - `sessions.preview` возвращает ограниченные предварительные просмотры транскриптов для конкретных ключей сессий.
    - `sessions.describe` возвращает одну строку сессии Gateway для точного ключа сессии.
    - `sessions.resolve` разрешает или канонизирует цель сессии.
    - `sessions.create` создает новую запись сессии.
    - `sessions.send` отправляет сообщение в существующую сессию.
    - `sessions.steer` — вариант прерывания и направления для активной сессии.
    - `sessions.abort` прерывает активную работу для сессии. Вызывающий клиент может передать `key` плюс необязательный `runId` или передать только `runId` для активных запусков, которые Gateway может разрешить в сессию.
    - `sessions.patch` обновляет метаданные/переопределения сессии и сообщает разрешенную каноническую модель плюс действующий `agentRuntime`.
    - `sessions.reset`, `sessions.delete` и `sessions.compact` выполняют обслуживание сессии.
    - `sessions.get` возвращает полную сохраненную строку сессии.
    - Выполнение чата по-прежнему использует `chat.history`, `chat.send`, `chat.abort` и `chat.inject`. `chat.history` нормализован для отображения в клиентах UI: встроенные теги директив удаляются из видимого текста, текстовые XML-полезные нагрузки вызовов инструментов (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и усеченные блоки вызовов инструментов) и просочившиеся ASCII/полноширинные токены управления моделью удаляются, чистые строки ассистента с тихими токенами, такие как точные `NO_REPLY` / `no_reply`, опускаются, а слишком большие строки могут заменяться заполнителями.
    - `chat.message.get` — добавочный ограниченный читатель полного сообщения для одной видимой записи транскрипта. Клиенты передают `sessionKey`, необязательный `agentId`, когда выбор сессии ограничен областью агента, плюс `messageId` транскрипта, ранее предоставленный через `chat.history`, а Gateway возвращает ту же нормализованную для отображения проекцию без легковесного ограничения усечения истории, когда сохраненная запись все еще доступна и не является слишком большой.
    - `chat.send` принимает `fastMode: "auto"` для одного хода, чтобы использовать быстрый режим для вызовов модели, начатых до автоматического отсечения, а затем запускать более поздние повторные попытки, резервные вызовы, результаты инструментов или продолжения без быстрого режима. По умолчанию отсечение равно 60 секундам и может настраиваться для каждой модели через `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Вызывающий `chat.send` может передать `fastAutoOnSeconds` для одного хода, чтобы переопределить отсечение для этого запроса.

  </Accordion>

  <Accordion title="Сопряжение устройств и токены устройств">
    - `device.pair.list` возвращает ожидающие и одобренные сопряженные устройства.
    - `device.pair.approve`, `device.pair.reject` и `device.pair.remove` управляют записями сопряжения устройств.
    - `device.token.rotate` ротирует токен сопряженного устройства в пределах его одобренной роли и области вызывающего клиента.
    - `device.token.revoke` отзывает токен сопряженного устройства в пределах его одобренной роли и области вызывающего клиента.

  </Accordion>

  <Accordion title="Сопряжение Node, вызов и ожидающая работа">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` и `node.pair.verify` охватывают сопряжение Node и проверку начальной настройки.
    - `node.list` и `node.describe` возвращают известное/подключенное состояние Node.
    - `node.rename` обновляет метку сопряженного Node.
    - `node.invoke` пересылает команду подключенному Node.
    - `node.invoke.result` возвращает результат запроса вызова.
    - `node.event` переносит события, исходящие от Node, обратно в gateway.
    - `node.pending.pull` и `node.pending.ack` — API очереди подключенного Node.
    - `node.pending.enqueue` и `node.pending.drain` управляют устойчивой ожидающей работой для offline/отключенных Node.

  </Accordion>

  <Accordion title="Семейства подтверждений">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` и `exec.approval.resolve` охватывают одноразовые запросы подтверждения exec, а также поиск/повтор ожидающих подтверждений.
    - `exec.approval.waitDecision` ожидает одно ожидающее подтверждение exec и возвращает итоговое решение (или `null` при тайм-ауте).
    - `exec.approvals.get` и `exec.approvals.set` управляют снимками политики подтверждения exec в gateway.
    - `exec.approvals.node.get` и `exec.approvals.node.set` управляют локальной для Node политикой подтверждения exec через команды ретрансляции Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` и `plugin.approval.resolve` охватывают потоки подтверждений, определенные Plugin.

  </Accordion>

  <Accordion title="Автоматизация, Skills и инструменты">
    - Автоматизация: `wake` планирует немедленную или следующую по Heartbeat инъекцию текста пробуждения; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` управляют запланированной работой.
    - `cron.run` остается RPC в стиле постановки в очередь для ручных запусков. Клиентам, которым нужна семантика завершения, следует читать возвращенный `runId` и опрашивать `cron.runs`.
    - `cron.runs` принимает необязательный непустой фильтр `runId`, чтобы клиенты могли отслеживать один поставленный в очередь ручной запуск без гонки с другими записями истории для того же задания.
    - Skills и инструменты: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Общие семейства событий

- `chat`: обновления чата UI, такие как `chat.inject`, и другие события чата,
  относящиеся только к транскрипту. В протоколе v4 полезные нагрузки дельт
  несут `deltaText`; `message` остается накопительным снимком ассистента.
  Замены не-префиксов задают `replace=true` и используют `deltaText` как текст
  замены.
- `session.message`, `session.operation` и `session.tool`: обновления
  транскрипта, выполняемой операции сессии и потока событий для подписанной
  сессии.
- `sessions.changed`: индекс сессий или метаданные изменились.
- `presence`: обновления снимка присутствия системы.
- `tick`: периодическое событие keepalive / liveness.
- `health`: обновление снимка состояния gateway.
- `heartbeat`: обновление потока событий Heartbeat.
- `cron`: событие изменения запуска/задания Cron.
- `shutdown`: уведомление о завершении работы gateway.
- `node.pair.requested` / `node.pair.resolved`: жизненный цикл сопряжения Node.
- `node.invoke.request`: широковещательный запрос вызова Node.
- `device.pair.requested` / `device.pair.resolved`: жизненный цикл сопряженного устройства.
- `voicewake.changed`: конфигурация триггера по слову пробуждения изменена.
- `exec.approval.requested` / `exec.approval.resolved`: жизненный цикл
  подтверждения exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: жизненный цикл
  подтверждения Plugin.

### Вспомогательные методы Node

- Node могут вызывать `skills.bins`, чтобы получить текущий список исполняемых
  файлов Skills для проверок автоматического разрешения.

### RPC журнала задач

Клиенты-операторы могут просматривать и отменять фоновые записи задач Gateway через
RPC журнала задач. Эти методы возвращают очищенные сводки задач, а не необработанное
состояние среды выполнения.

- `tasks.list` требует `operator.read`.
  - Параметры: необязательный `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` или `"timed_out"`) или массив этих статусов,
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
  - `found` сообщает, была ли в журнале соответствующая задача. `cancelled`
    сообщает, приняла ли среда выполнения отмену или записала ее.

`TaskSummary` включает `id`, `status` и необязательные метаданные, такие как `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, временные метки, ход выполнения,
терминальную сводку и очищенный текст ошибки. `agentId` идентифицирует агента,
выполняющего задачу; `sessionKey` и `ownerKey` сохраняют контекст запрашивающего
и управления.

### Вспомогательные методы оператора

- Операторы могут вызывать `commands.list` (`operator.read`), чтобы получить инвентарь команд среды выполнения для агента.
  - `agentId` необязателен; не указывайте его, чтобы читать рабочую область агента по умолчанию.
  - `scope` управляет тем, на какую поверхность нацелено основное `name`:
    - `text` возвращает основной текстовый токен команды без начального `/`
    - `native` и путь по умолчанию `both` возвращают нативные имена с учетом провайдера, когда они доступны
  - `textAliases` содержит точные slash-алиасы, такие как `/model` и `/m`.
  - `nativeName` содержит нативное имя команды с учетом провайдера, если оно существует.
  - `provider` необязателен и влияет только на нативное именование и доступность нативных команд Plugin.
  - `includeArgs=false` исключает сериализованные метаданные аргументов из ответа.
- Операторы могут вызывать `tools.catalog` (`operator.read`), чтобы получить каталог инструментов среды выполнения для агента. Ответ включает сгруппированные инструменты и метаданные происхождения:
  - `source`: `core` или `plugin`
  - `pluginId`: владелец Plugin, когда `source="plugin"`
  - `optional`: является ли инструмент Plugin необязательным
- Операторы могут вызывать `tools.effective` (`operator.read`), чтобы получить фактически действующий в среде выполнения инвентарь инструментов для сеанса.
  - `sessionKey` обязателен.
  - Gateway выводит доверенный контекст среды выполнения из сеанса на стороне сервера, а не принимает предоставленный вызывающей стороной контекст auth или доставки.
  - Ответ представляет собой ограниченную сеансом, выведенную сервером проекцию активного инвентаря, включая core, Plugin, канал и уже обнаруженные инструменты MCP-сервера.
  - `tools.effective` доступен только для чтения для MCP: он может провести каталог MCP прогретого сеанса через итоговую политику инструментов, но не создает среды выполнения MCP, не подключает транспорты и не выполняет `tools/list`. Если подходящего прогретого каталога нет, ответ может включать уведомление, например `mcp-not-yet-connected`, `mcp-not-yet-listed` или `mcp-stale-catalog`.
  - Записи эффективных инструментов используют `source="core"`, `source="plugin"`, `source="channel"` или `source="mcp"`.
- Операторы могут вызывать `tools.invoke` (`operator.write`), чтобы вызвать один доступный инструмент через тот же путь политики Gateway, что и `/tools/invoke`.
  - `name` обязателен. `args`, `sessionKey`, `agentId`, `confirm` и `idempotencyKey` необязательны.
  - Если присутствуют и `sessionKey`, и `agentId`, разрешенный агент сеанса должен совпадать с `agentId`.
  - Core-обертки только для владельца, такие как `cron`, `gateway` и `nodes`, требуют идентичности владельца/администратора (`operator.admin`), хотя сам метод `tools.invoke` имеет `operator.write`.
  - Ответ представляет собой envelope для SDK с полями `ok`, `toolName`, необязательным `output` и типизированными полями `error`. Отказы approval или политики возвращают `ok:false` в payload, а не обходят pipeline политики инструментов Gateway.
- Операторы могут вызывать `skills.status` (`operator.read`), чтобы получить видимый инвентарь skill для агента.
  - `agentId` необязателен; не указывайте его, чтобы читать рабочую область агента по умолчанию.
  - Ответ включает eligibility, отсутствующие требования, проверки config и очищенные варианты установки без раскрытия необработанных секретных значений.
- Операторы могут вызывать `skills.search` и `skills.detail` (`operator.read`) для метаданных обнаружения ClawHub.
- Операторы могут вызывать `skills.upload.begin`, `skills.upload.chunk` и `skills.upload.commit` (`operator.admin`), чтобы подготовить приватный архив skill перед установкой. Это отдельный административный путь upload для доверенных клиентов, а не обычный поток установки skill из ClawHub, и он по умолчанию отключен, если не включен `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    создает upload, привязанный к этому slug и значению force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` добавляет байты с точного декодированного offset.
  - `skills.upload.commit({ uploadId, sha256? })` проверяет итоговый размер и SHA-256. Commit только завершает upload; он не устанавливает skill.
  - Загруженные архивы skill являются zip-архивами, содержащими корневой `SKILL.md`. Внутреннее имя директории архива никогда не выбирает целевое место установки.
- Операторы могут вызывать `skills.install` (`operator.admin`) в трех режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` устанавливает папку skill в директорию `skills/` рабочей области агента по умолчанию.
  - Режим upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    устанавливает зафиксированный upload в директорию `skills/<slug>` рабочей области агента по умолчанию. Slug и значение force должны совпадать с исходным запросом `skills.upload.begin`. Этот режим отклоняется, если не включен `skills.install.allowUploadedArchives`. Настройка не влияет на установки ClawHub.
  - Режим установщика Gateway: `{ name, installId, timeoutMs? }`
    запускает объявленное действие `metadata.openclaw.install` на хосте Gateway.
    Старые клиенты все еще могут отправлять `dangerouslyForceUnsafeInstall`; это поле устарело, принимается только для совместимости протокола и игнорируется. Используйте `security.installPolicy` для install-решений, которыми владеет оператор.
- Операторы могут вызывать `skills.update` (`operator.admin`) в двух режимах:
  - Режим ClawHub обновляет один отслеживаемый slug или все отслеживаемые установки ClawHub в рабочей области агента по умолчанию.
  - Режим config исправляет значения `skills.entries.<skillKey>`, такие как `enabled`, `apiKey` и `env`.

### Представления `models.list`

`models.list` принимает необязательный параметр `view`:

- Не указан или `"default"`: текущее поведение среды выполнения. Если настроен `agents.defaults.models`, ответом будет разрешенный каталог, включая динамически обнаруженные модели для записей `provider/*`. В противном случае ответом будет полный каталог Gateway.
- `"configured"`: поведение размера picker. Если настроен `agents.defaults.models`, он по-прежнему имеет приоритет, включая обнаружение в рамках провайдера для записей `provider/*`. Без allowlist ответ использует явные записи `models.providers.*.models`, возвращаясь к полному каталогу только когда настроенных строк моделей нет.
- `"all"`: полный каталог Gateway с обходом `agents.defaults.models`. Используйте это для диагностик и интерфейсов обнаружения, а не для обычных picker моделей.

## Exec approvals

- Когда exec-запрос требует approval, Gateway рассылает `exec.approval.requested`.
- Клиенты оператора разрешают его вызовом `exec.approval.resolve` (требуется scope `operator.approvals`).
- Для `host=node` `exec.approval.request` должен включать `systemRunPlan` (канонические `argv`/`cwd`/`rawCommand`/метаданные сеанса). Запросы без `systemRunPlan` отклоняются.
- После approval перенаправленные вызовы `node.invoke system.run` повторно используют этот канонический `systemRunPlan` как authoritative контекст command/cwd/session.
- Если вызывающая сторона изменяет `command`, `rawCommand`, `cwd`, `agentId` или `sessionKey` между подготовкой и финальной одобренной пересылкой `system.run`, Gateway отклоняет запуск вместо доверия измененному payload.

## Резервный вариант доставки агента

- Запросы `agent` могут включать `deliver=true`, чтобы запросить исходящую доставку.
- `bestEffortDeliver=false` сохраняет строгое поведение: неразрешенные или только внутренние цели доставки возвращают `INVALID_REQUEST`.
- `bestEffortDeliver=true` разрешает fallback к выполнению только в сеансе, когда невозможно разрешить внешний доставляемый маршрут (например, внутренние/webchat-сеансы или неоднозначные многоканальные config).
- Итоговые результаты `agent` могут включать `result.deliveryStatus`, когда была запрошена доставка, используя те же статусы `sent`, `suppressed`, `partial_failed` и `failed`, которые задокументированы для [`openclaw agent --json --deliver`](/ru/cli/agent#json-delivery-status).

## Версионирование

- `PROTOCOL_VERSION` находится в `packages/gateway-protocol/src/version.ts`.
- Клиенты отправляют `minProtocol` + `maxProtocol`; сервер отклоняет диапазоны, которые не включают его текущий протокол. Текущие клиенты и серверы требуют protocol v4.
- Схемы + модели генерируются из определений TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константы клиента

Reference-клиент в `src/gateway/client.ts` использует эти значения по умолчанию. Значения стабильны в рамках protocol v4 и являются ожидаемой baseline для сторонних клиентов.

| Константа                                 | Значение по умолчанию                                 | Источник                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Тайм-аут запроса (на RPC)                 | `30_000` мс                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Тайм-аут preauth / connect-challenge      | `15_000` мс                                           | `src/gateway/handshake-timeouts.ts` (config/env могут увеличить парный бюджет server/client) |
| Начальный backoff повторного подключения  | `1_000` мс                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Максимальный backoff повторного подключения | `30_000` мс                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ограничение fast-retry после закрытия device-token | `250` мс                                      | `src/gateway/client.ts`                                                                    |
| Grace-период force-stop перед `terminate()` | `250` мс                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Тайм-аут по умолчанию `stopAndWait()`     | `1_000` мс                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Интервал tick по умолчанию (до `hello-ok`) | `30_000` мс                                          | `src/gateway/client.ts`                                                                    |
| Закрытие по tick-timeout                  | code `4000`, когда молчание превышает `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                            | `src/gateway/server-constants.ts`                                                          |

Сервер объявляет эффективные `policy.tickIntervalMs`, `policy.maxPayload` и `policy.maxBufferedBytes` в `hello-ok`; клиентам следует соблюдать эти значения, а не значения по умолчанию до handshake.

## Auth

- Аутентификация Gateway с общим секретом использует `connect.params.auth.token` или
  `connect.params.auth.password`, в зависимости от настроенного режима аутентификации.
- Режимы с идентификацией, такие как Tailscale Serve
  (`gateway.auth.allowTailscale: true`) или не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходят проверку аутентификации connect по
  заголовкам запроса вместо `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` полностью пропускает аутентификацию connect
  с общим секретом; не открывайте этот режим на публичном или недоверенном входе.
- После сопряжения Gateway выдает **токен устройства**, ограниченный ролью
  подключения + областями доступа. Он возвращается в `hello-ok.auth.deviceToken`, и
  клиент должен сохранять его для будущих подключений.
- Клиенты должны сохранять основной `hello-ok.auth.deviceToken` после любого
  успешного подключения.
- Повторное подключение с этим **сохраненным** токеном устройства также должно
  повторно использовать сохраненный набор одобренных областей доступа для этого
  токена. Это сохраняет уже выданный доступ на чтение/проверку/статус и не дает
  повторным подключениям незаметно схлопнуться до более узкой неявной области
  только администратора.
- Сборка клиентской аутентификации connect (`selectConnectAuth` в
  `src/gateway/client.ts`):
  - `auth.password` независим и всегда передается, когда задан.
  - `auth.token` заполняется в порядке приоритета: сначала явный общий токен,
    затем явный `deviceToken`, затем сохраненный токен конкретного устройства
    (ключуется по `deviceId` + `role`).
  - `auth.bootstrapToken` отправляется только когда ни один из вариантов выше не
    дал `auth.token`. Общий токен или любой найденный токен устройства подавляет
    его.
  - Автоматическое повышение сохраненного токена устройства при одноразовой
    повторной попытке `AUTH_TOKEN_MISMATCH` разрешено **только для доверенных
    конечных точек** — loopback или `wss://` с закрепленным `tlsFingerprint`.
    Публичный `wss://` без закрепления не подходит.
- Встроенный bootstrap по setup-коду возвращает основной
  `hello-ok.auth.deviceToken` Node плюс ограниченный токен оператора в
  `hello-ok.auth.deviceTokens` для доверенной передачи на мобильное устройство.
  Токен оператора включает `operator.talk.secrets` для чтения нативной
  конфигурации Talk и исключает `operator.admin` и `operator.pairing`.
- Пока bootstrap по не-базовому setup-коду ожидает одобрения, детали `PAIRING_REQUIRED`
  включают `recommendedNextStep: "wait_then_retry"`, `retryable: true` и
  `pauseReconnect: false`. Клиенты должны продолжать переподключаться с тем же
  bootstrap-токеном, пока запрос не будет одобрен или токен не станет недействительным.
- Сохраняйте `hello-ok.auth.deviceTokens` только когда подключение использовало
  bootstrap-аутентификацию на доверенном транспорте, таком как `wss://` или
  loopback/local pairing.
- Если клиент передает **явный** `deviceToken` или явные `scopes`, запрошенный
  вызывающей стороной набор областей доступа остается авторитетным; кэшированные
  области доступа повторно используются только когда клиент повторно использует
  сохраненный токен конкретного устройства.
- Токены устройств можно ротировать/отзывать через `device.token.rotate` и
  `device.token.revoke` (требуется область доступа `operator.pairing`). Ротация
  или отзыв токена Node либо другой не-операторской роли также требует
  `operator.admin`.
- `device.token.rotate` возвращает метаданные ротации. Он возвращает заменяющий
  bearer-токен только для вызовов с того же устройства, которые уже
  аутентифицированы этим токеном устройства, чтобы клиенты только с токеном могли
  сохранить замену перед переподключением. Ротации через общий/админский доступ
  не возвращают bearer-токен.
- Выдача, ротация и отзыв токенов остаются ограничены одобренным набором ролей,
  записанным в записи сопряжения этого устройства; изменение токена не может
  расширить или выбрать роль устройства, которую одобрение сопряжения никогда не
  выдавало.
- Для токен-сессий сопряженных устройств управление устройствами ограничено
  самим устройством, если у вызывающей стороны нет `operator.admin`: вызывающие
  стороны без прав администратора могут управлять только токеном оператора для
  записи **своего** устройства. Управление токенами Node и других не-операторских
  ролей доступно только администратору, даже для собственного устройства
  вызывающей стороны.
- `device.token.rotate` и `device.token.revoke` также проверяют набор областей
  доступа целевого токена оператора относительно текущих областей доступа сессии
  вызывающей стороны. Вызывающие стороны без прав администратора не могут
  ротировать или отзывать более широкий токен оператора, чем тот, которым они
  уже обладают.
- Сбои аутентификации включают `error.details.code` плюс подсказки по восстановлению:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведение клиента для `AUTH_TOKEN_MISMATCH`:
  - Доверенные клиенты могут выполнить одну ограниченную повторную попытку с
    кэшированным токеном конкретного устройства.
  - Если эта повторная попытка завершается ошибкой, клиенты должны остановить
    автоматические циклы переподключения и показать оператору указания к действию.
- `AUTH_SCOPE_MISMATCH` означает, что токен устройства был распознан, но не
  покрывает запрошенную роль/области доступа. Клиенты не должны показывать это
  как неверный токен; предложите оператору повторно выполнить сопряжение или
  одобрить более узкий/широкий контракт областей доступа.

## Идентичность устройства + сопряжение

- Nodes должны включать стабильную идентичность устройства (`device.id`),
  полученную из отпечатка пары ключей.
- Gateways выдают токены для каждой пары устройство + роль.
- Одобрения сопряжения требуются для новых идентификаторов устройств, если не
  включено локальное автоодобрение.
- Автоодобрение сопряжения сосредоточено на прямых подключениях local loopback.
- OpenClaw также имеет узкий backend/container-local путь самоподключения для
  доверенных вспомогательных потоков с общим секретом.
- Подключения через tailnet того же хоста или LAN по-прежнему считаются
  удаленными для сопряжения и требуют одобрения.
- WS-клиенты обычно включают идентичность `device` во время `connect` (operator +
  node). Единственные исключения для оператора без устройства — явные доверенные
  пути:
  - `gateway.controlUi.allowInsecureAuth=true` для совместимости небезопасного HTTP только на localhost.
  - успешная аутентификация оператора Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, серьезное снижение безопасности).
  - прямые loopback RPC `gateway-client` backend на зарезервированном внутреннем
    вспомогательном пути.
- Отсутствие идентичности устройства влияет на области доступа. Когда операторское
  подключение без устройства разрешено через явный доверенный путь, OpenClaw все
  равно очищает самозаявленные области доступа до пустого набора, если у этого
  пути нет именованного исключения для сохранения областей доступа. Методы,
  защищенные областями доступа, затем завершаются ошибкой `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` — это break-glass путь
  Control UI с сохранением областей доступа. Он не выдает области доступа
  произвольным пользовательским backend- или CLI-образным WebSocket-клиентам.
- Зарезервированный прямой loopback вспомогательный путь `gateway-client` backend
  сохраняет области доступа только для внутренних локальных RPC уровня управления;
  пользовательские backend-идентификаторы не получают это исключение.
- Все подключения должны подписывать выданный сервером nonce `connect.challenge`.

### Диагностика миграции аутентификации устройства

Для устаревших клиентов, которые все еще используют поведение подписи до challenge, `connect` теперь возвращает
detail-коды `DEVICE_AUTH_*` в `error.details.code` со стабильным `error.details.reason`.

Распространенные сбои миграции:

| Сообщение                   | details.code                     | details.reason           | Значение                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клиент пропустил `device.nonce` (или отправил пустое значение). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клиент подписал с устаревшим/неверным nonce.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Полезная нагрузка подписи не соответствует payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Подписанная временная метка вне допустимого отклонения. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не совпадает с отпечатком публичного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/каноникализация публичного ключа не прошли проверку. |

Цель миграции:

- Всегда ждите `connect.challenge`.
- Подписывайте payload v2, который включает серверный nonce.
- Отправляйте тот же nonce в `connect.params.device.nonce`.
- Предпочтительная payload подписи — `v3`, которая привязывает `platform` и `deviceFamily`
  в дополнение к полям device/client/role/scopes/token/nonce.
- Устаревшие подписи `v2` остаются принимаемыми для совместимости, но закрепление
  метаданных сопряженного устройства по-прежнему управляет политикой команд при
  переподключении.

## TLS + закрепление

- TLS поддерживается для WS-подключений.
- Клиенты могут опционально закреплять отпечаток сертификата Gateway (см. конфиг
  `gateway.tls` плюс `gateway.remote.tlsFingerprint` или CLI `--tls-fingerprint`).

## Область доступа

Этот протокол открывает **полный API Gateway** (статус, каналы, модели, чат,
агент, сессии, Nodes, одобрения и т. д.). Точная поверхность определена
схемами TypeBox в `packages/gateway-protocol/src/schema.ts`.

## Связанное

- [Протокол Bridge](/ru/gateway/bridge-protocol)
- [Ранбук Gateway](/ru/gateway)
