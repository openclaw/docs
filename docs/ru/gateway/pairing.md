---
read_when:
    - Реализация подтверждений сопряжения узлов без UI macOS
    - Добавление потоков CLI для одобрения удаленных узлов
    - Расширение протокола Gateway управлением Node
summary: Сопряжение узлов под управлением Gateway (вариант B) для iOS и других удаленных узлов
title: Сопряжение, управляемое Gateway
x-i18n:
    generated_at: "2026-06-28T22:59:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

В pairing, которым владеет Gateway, **Gateway** является источником истины для того, каким узлам
разрешено присоединяться. UI (приложение macOS, будущие клиенты) — это только фронтенды, которые
одобряют или отклоняют ожидающие запросы.

**Важно:** WS-узлы используют **device pairing** (роль `node`) во время `connect`.
`node.pair.*` — это отдельное хранилище pairing и оно **не** ограничивает WS handshake.
Этот flow используют только клиенты, которые явно вызывают `node.pair.*`.

## Концепции

- **Ожидающий запрос**: узел запросил присоединение; требуется одобрение.
- **Сопряженный узел**: одобренный узел с выданным auth token.
- **Транспорт**: WS endpoint Gateway пересылает запросы, но не принимает решение
  о членстве. (Поддержка устаревшего TCP bridge удалена.)

## Как работает pairing

1. Узел подключается к Gateway WS и запрашивает pairing.
2. Gateway сохраняет **ожидающий запрос** и отправляет `node.pair.requested`.
3. Вы одобряете или отклоняете запрос (CLI или UI).
4. При одобрении Gateway выдает **новый токен** (токены ротируются при повторном pairing).
5. Узел переподключается с использованием токена и теперь считается «paired».

Ожидающие запросы автоматически истекают через **5 минут**.

## Workflow CLI (подходит для headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` показывает сопряженные/подключенные узлы и их capabilities.

## Поверхность API (gateway protocol)

События:

- `node.pair.requested` - отправляется при создании нового ожидающего запроса.
- `node.pair.resolved` - отправляется, когда запрос одобрен/отклонен/истек.

Методы:

- `node.pair.request` - создать или повторно использовать ожидающий запрос.
- `node.pair.list` - вывести ожидающие + сопряженные узлы (`operator.pairing`).
- `node.pair.approve` - одобрить ожидающий запрос (выдает токен).
- `node.pair.reject` - отклонить ожидающий запрос.
- `node.pair.remove` - удалить сопряженный узел. Для pairings, подкрепленных устройством, это
  отзывает роль `node` у устройства: изменяет `devices/paired.json` и
  инвалидирует/отключает node-role sessions этого устройства. Устройство со **смешанными ролями**
  (например, у него также есть `operator`) сохраняет свою строку и теряет только роль `node`;
  строка устройства только с ролью node удаляется. Также удаляется любая совпадающая устаревшая
  gateway-owned node pairing entry. Authz: `operator.pairing` может удалять
  строки non-operator node; вызывающему с device-token, который отзывает **собственную** роль node на
  устройстве со смешанными ролями, дополнительно нужен `operator.admin`.
- `node.pair.verify` - проверить `{ nodeId, token }`.

Примечания:

- `node.pair.request` идемпотентен для каждого узла: повторные вызовы возвращают тот же
  ожидающий запрос.
- Повторные запросы для того же ожидающего узла также обновляют сохраненные метаданные узла
  и последний allowlisted snapshot объявленных команд для видимости оператора.
- Одобрение **всегда** генерирует свежий токен; `node.pair.request` никогда не возвращает токен.
- Уровни scope оператора и проверки во время одобрения кратко описаны в
  [Scopes оператора](/ru/gateway/operator-scopes).
- Запросы могут включать `silent: true` как подсказку для flow автоодобрения.
- `node.pair.approve` использует объявленные команды ожидающего запроса, чтобы применять
  дополнительные scopes одобрения:
  - запрос без команд: `operator.pairing`
  - запрос команды без exec: `operator.pairing` + `operator.write`
  - запрос `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node pairing — это trust and identity flow плюс выдача токена. Он **не** закрепляет live command surface узла для каждого узла.

- Live node commands берутся из того, что узел объявляет при подключении после применения глобальной политики команд узлов Gateway (`gateway.nodes.allowCommands` и `denyCommands`).
- Per-node `system.run` allow and ask policy находится на узле в `exec.approvals.node.*`, а не в записи pairing.

</Warning>

## Ограничение команд узла (2026.3.31+)

<Warning>
**Критическое изменение:** Начиная с `2026.3.31`, команды узла отключены, пока node pairing не будет одобрен. Одного device pairing больше недостаточно, чтобы раскрыть объявленные команды узла.
</Warning>

Когда узел подключается впервые, pairing запрашивается автоматически. Пока запрос pairing не одобрен, все ожидающие команды узла от этого узла фильтруются и не будут выполняться. После установления доверия через одобрение pairing объявленные команды узла становятся доступными с учетом обычной политики команд.

Это означает:

- Узлы, которые раньше полагались только на device pairing для раскрытия команд, теперь должны завершить node pairing.
- Команды, поставленные в очередь до одобрения pairing, отбрасываются, а не откладываются.

## Границы доверия событий узла (2026.3.31+)

<Warning>
**Критическое изменение:** Запуски, инициированные узлом, теперь остаются на сокращенной trusted surface.
</Warning>

Сводки, инициированные узлом, и связанные события сессии ограничены предназначенной trusted surface. Flows, управляемые уведомлениями или запускаемые узлом, которые раньше полагались на более широкий доступ к инструментам хоста или сессии, могут потребовать корректировки. Это усиление защиты гарантирует, что события узла не смогут повысить права до доступа к инструментам уровня хоста сверх того, что допускает trust boundary узла.

Долговременные обновления присутствия узла следуют той же identity boundary. Событие `node.presence.alive`
принимается только от аутентифицированных device sessions узла и обновляет метаданные pairing только тогда, когда
идентичность device/node уже paired. Самостоятельно объявленных значений `client.id` недостаточно для записи
last-seen state.

## Автоодобрение (приложение macOS)

Приложение macOS может опционально попытаться выполнить **silent approval**, когда:

- запрос помечен как `silent`, и
- приложение может проверить SSH-подключение к хосту gateway с использованием того же пользователя.

Если silent approval завершается неудачно, используется обычный prompt «Approve/Reject».

## Автоодобрение устройств Trusted-CIDR

WS device pairing для `role: node` по умолчанию остается ручным. Для частных
сетей узлов, где Gateway уже доверяет сетевому пути, операторы могут
явно включить это с помощью CIDR или точных IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Security boundary:

- Отключено, когда `gateway.nodes.pairing.autoApproveCidrs` не задан.
- Режима blanket LAN или private-network auto-approve не существует.
- Подходит только свежий `role: node` device pairing без запрошенных scopes.
- Клиенты Operator, browser, Control UI и WebChat остаются ручными.
- Апгрейды роли, scope, метаданных и public key остаются ручными.
- Пути same-host loopback trusted-proxy header не подходят, потому что этот
  путь может быть spoofed локальными вызывающими.

## Автоодобрение metadata-upgrade

Когда уже сопряженное устройство переподключается только с нечувствительными изменениями метаданных
(например, отображаемое имя или подсказки о платформе клиента), OpenClaw рассматривает
это как `metadata-upgrade`. Silent auto-approval имеет узкую область применения: он применяется только
к доверенным non-browser local reconnects, которые уже доказали владение локальными
или общими учетными данными, включая same-host native app reconnects после изменений
метаданных версии ОС. Browser/Control UI clients и remote clients по-прежнему
используют явный flow повторного одобрения. Scope upgrades (read to write/admin) и
изменения public key **не** подходят для metadata-upgrade auto-approval -
они остаются явными запросами повторного одобрения.

## QR helpers для pairing

`/pair qr` отображает pairing payload как структурированные media, чтобы mobile и
browser clients могли сканировать его напрямую.

Удаление устройства также очищает устаревшие ожидающие pairing requests для этого
device id, поэтому `nodes pending` не показывает orphaned rows после revoke.

## Локальность и forwarded headers

Gateway pairing считает соединение loopback только когда и raw socket,
и любые upstream proxy evidence совпадают. Если запрос приходит через loopback, но
содержит `Forwarded`, любые `X-Forwarded-*` или `X-Real-IP` header evidence, эти
forwarded-header evidence дисквалифицируют утверждение loopback locality. Затем путь pairing
требует явного одобрения вместо silent трактовки запроса как same-host connect. См.
[Trusted Proxy Auth](/ru/gateway/trusted-proxy-auth) для эквивалентного правила в operator auth.

## Хранилище (локальное, приватное)

Состояние pairing хранится в state directory Gateway (по умолчанию `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Если вы переопределяете `OPENCLAW_STATE_DIR`, папка `nodes/` перемещается вместе с ним.

Примечания по безопасности:

- Токены являются секретами; считайте `paired.json` чувствительным.
- Ротация токена требует повторного одобрения (или удаления записи узла).

## Поведение транспорта

- Транспорт **stateless**; он не хранит membership.
- Если Gateway offline или pairing отключен, узлы не могут выполнить pairing.
- Если Gateway находится в remote mode, pairing все равно происходит относительно хранилища remote Gateway.

## Связанные материалы

- [Channel pairing](/ru/channels/pairing)
- [Узлы](/ru/nodes)
- [Devices CLI](/ru/cli/devices)
