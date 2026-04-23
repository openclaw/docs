---
read_when:
    - Налагодження повторних подій завершення node exec
    - Робота над дедуплікацією Heartbeat/системних подій
summary: Нотатки розслідування щодо дубльованого впровадження завершення асинхронного exec
title: Розслідування дубльованого завершення асинхронного exec
x-i18n:
    generated_at: "2026-04-23T21:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09fd2d851f3102be7b0182b5ba4d8ed0bf9a7ce380d71b1ecaa302a59ec2a2c2
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Область

- Session: `agent:main:telegram:group:-1003774691294:topic:1`
- Симптом: те саме завершення асинхронного exec для session/run `keen-nexus` було двічі записане в LCM як ходи користувача.
- Мета: визначити, чи найімовірніше це дубльоване впровадження в session, чи звичайний повтор вихідної доставки.

## Висновок

Найімовірніше це **дубльоване впровадження в session**, а не суто повтор вихідної доставки.

Найсильніша прогалина на боці gateway знаходиться в **шляху завершення node exec**:

1. Завершення exec на боці вузла випромінює `exec.finished` із повним `runId`.
2. Gateway `server-node-events` перетворює це на системну подію й запитує Heartbeat.
3. Запуск Heartbeat впроваджує блок drained system event у prompt агента.
4. Вбудований runner зберігає цей prompt як новий хід користувача в transcript session.

Якщо той самий `exec.finished` з будь-якої причини (replay, reconnect duplicate, upstream resend, duplicated producer) двічі досягає gateway для того самого `runId`, OpenClaw наразі **не має перевірки ідемпотентності за ключем `runId`/`contextKey`** на цьому шляху. Друга копія стане другим користувацьким повідомленням із тим самим вмістом.

## Точний шлях коду

### 1. Producer: подія завершення node exec

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` випромінює `node.event` із подією `exec.finished`.
  - Payload містить `sessionKey` і повний `runId`.

### 2. Вхід подій у Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Обробляє `exec.finished`.
  - Будує текст:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Ставить його в чергу через:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Одразу запитує wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Слабкість дедуплікації системних подій

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` пригнічує лише **послідовний дублікат тексту**:
    - `if (entry.lastText === cleaned) return false`
  - Він зберігає `contextKey`, але **не** використовує `contextKey` для ідемпотентності.
  - Після drain дедуплікація скидається.

Це означає, що replay-нутий `exec.finished` із тим самим `runId` може бути знову прийнятий пізніше, хоча код уже мав стабільного кандидата для ідемпотентності (`exec:<runId>`).

### 4. Обробка wake не є основним джерелом дублювання

- `src/infra/heartbeat-wake.ts:79-117`
  - Wake-и коалесуються за `(agentId, sessionKey)`.
  - Дубльовані запити wake для тієї самої цілі згортаються в один pending wake entry.

Через це **лише дублювання обробки wake** є слабшим поясненням, ніж дубльований вхід подій.

### 5. Heartbeat споживає подію і перетворює її на вхід prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight переглядає pending system events і класифікує запуски exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` спустошує чергу для session.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Drained-блок system event додається на початок body prompt агента.

### 6. Точка впровадження в transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` надсилає повний prompt до вбудованої session PI.
  - Саме в цій точці prompt, похідний від завершення, стає збереженим ходом користувача.

Тож щойно ту саму системну подію двічі перебудовано в prompt, дубльовані користувацькі повідомлення в LCM стають очікуваними.

## Чому суто повтор вихідної доставки менш імовірний

У heartbeat runner існує реальний шлях помилки вихідної доставки:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Спочатку генерується відповідь.
  - Вихідна доставка відбувається пізніше через `deliverOutboundPayloads(...)`.
  - Помилка там повертає `{ status: "failed" }`.

Однак для того самого елемента черги system event цього **самого по собі недостатньо**, щоб пояснити дубльовані ходи користувача:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Черга system event уже drained до вихідної доставки.

Тож channel send retry сам по собі не відтворив би той самий елемент черги подій. Він може пояснити відсутню/невдалу зовнішню доставку, але сам по собі — не друге ідентичне користувацьке повідомлення в session.

## Вторинна, менш упевнена можливість

У runner агента існує цикл повного retry запуску:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Деякі transient failure можуть повторно запустити весь run і знову надіслати той самий `commandBody`.

Це може продублювати збережений користувацький prompt **у межах того самого виконання відповіді**, якщо prompt уже був доданий до того, як спрацювала умова retry.

Я оцінюю це нижче, ніж дубльований вхід `exec.finished`, тому що:

- спостережуваний розрив становив близько 51 секунди, що більше схоже на другий wake/хід, ніж на retry у межах процесу;
- у звіті вже згадуються повторні збої надсилання повідомлень, що більше вказує на окремий пізніший хід, ніж на негайний retry моделі/runtime.

## Гіпотеза кореневої причини

Гіпотеза з найвищою впевненістю:

- завершення `keen-nexus` пройшло через **шлях подій node exec**.
- Той самий `exec.finished` був двічі доставлений до `server-node-events`.
- Gateway прийняв обидва, тому що `enqueueSystemEvent(...)` не виконує дедуплікацію за `contextKey` / `runId`.
- Кожна прийнята подія запустила heartbeat і була впроваджена як хід користувача в transcript PI.

## Запропоноване маленьке хірургічне виправлення

Якщо потрібне виправлення, найменша зміна з високою цінністю така:

- зробити так, щоб ідемпотентність exec/system-event враховувала `contextKey` на короткому горизонті, принаймні для точних повторів `(sessionKey, contextKey, text)`;
- або додати окрему дедуплікацію в `server-node-events` для `exec.finished` за ключем `(sessionKey, runId, kind event)`.

Це напряму заблокує replay-нуті дублікати `exec.finished` до того, як вони перетворяться на ходи session.
