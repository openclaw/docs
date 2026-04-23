---
read_when:
    - Реалізація схвалення pairing Node без UI macOS
    - Додавання потоків CLI для схвалення віддалених Node
    - Розширення протоколу gateway керуванням Node
summary: Керований Gateway pairing Node (варіант B) для iOS та інших віддалених Node
title: Керований Gateway pairing
x-i18n:
    generated_at: "2026-04-23T20:54:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865a8cc4005b41bc6c093c2f020db4f8108684f58a05fda9fa40770e38073782
    source_path: gateway/pairing.md
    workflow: 15
---

# Керований Gateway pairing (варіант B)

У керованому Gateway pairing саме **Gateway** є джерелом істини щодо того, які Node
мають право приєднуватися. UI (macOS app, майбутні клієнти) — це лише frontend-и, які
схвалюють або відхиляють очікувані запити.

**Важливо:** WS Node використовують **device pairing** (role `node`) під час `connect`.
`node.pair.*` — це окреме сховище pairing і воно **не** керує handshake WS.
Цей процес використовують лише клієнти, які явно викликають `node.pair.*`.

## Поняття

- **Pending request**: Node попросив приєднатися; потрібне схвалення.
- **Paired node**: схвалений Node із виданим auth token.
- **Transport**: endpoint Gateway WS пересилає запити, але не вирішує
  питання членства. (Підтримку legacy TCP bridge видалено.)

## Як працює pairing

1. Node підключається до Gateway WS і запитує pairing.
2. Gateway зберігає **pending request** і генерує `node.pair.requested`.
3. Ви схвалюєте або відхиляєте запит (CLI або UI).
4. Після схвалення Gateway видає **новий token** (під час re-pair токени ротуються).
5. Node перепідключається, використовуючи token, і тепер вважається “paired”.

Pending requests автоматично спливають через **5 хвилин**.

## Процес CLI (дружній до headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` показує paired/connected Node і їхні capabilities.

## Поверхня API (протокол gateway)

Події:

- `node.pair.requested` — генерується, коли створюється новий pending request.
- `node.pair.resolved` — генерується, коли запит схвалено/відхилено/строк дії минув.

Методи:

- `node.pair.request` — створити або повторно використати pending request.
- `node.pair.list` — показати pending + paired Node (`operator.pairing`).
- `node.pair.approve` — схвалити pending request (видає token).
- `node.pair.reject` — відхилити pending request.
- `node.pair.verify` — перевірити `{ nodeId, token }`.

Примітки:

- `node.pair.request` є ідемпотентним для Node: повторні виклики повертають той самий
  pending request.
- Повторні запити для того самого Node у стані pending також оновлюють збережені метадані Node
  і останній allowlisted declared command snapshot для видимості оператору.
- Схвалення **завжди** генерує свіжий token; `node.pair.request` ніколи не повертає token.
- Запити можуть містити `silent: true` як підказку для flow автоматичного схвалення.
- `node.pair.approve` використовує declared commands pending request для застосування
  додаткових scopes схвалення:
  - запит без команд: `operator.pairing`
  - запит команд без exec: `operator.pairing` + `operator.write`
  - запит `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Важливо:

- Pairing Node — це процес довіри/ідентичності плюс видача token.
- Він **не** фіксує живу поверхню команд Node для кожного Node.
- Живі команди Node походять від того, що Node оголошує під час connect після
  застосування глобальної політики команд Node gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Політика allow/ask `system.run` для кожного Node живе на самому Node в
  `exec.approvals.node.*`, а не в записі pairing.

## Блокування команд Node (2026.3.31+)

<Warning>
**Несумісна зміна:** Починаючи з `2026.3.31`, команди Node вимкнено, доки pairing Node не буде схвалено. Самого лише device pairing більше недостатньо, щоб відкрити оголошені команди Node.
</Warning>

Коли Node підключається вперше, pairing запитується автоматично. Доки запит pairing не буде схвалено, усі очікувані команди Node від цього Node фільтруються й не виконуються. Щойно довіру буде встановлено через схвалення pairing, оголошені команди Node стануть доступними відповідно до звичайної політики команд.

Це означає:

- Node, які раніше покладалися лише на device pairing для відкриття команд, тепер мають завершити node pairing.
- Команди, поставлені в чергу до схвалення pairing, відкидаються, а не відкладаються.

## Межі довіри подій Node (2026.3.31+)

<Warning>
**Несумісна зміна:** Запуски, ініційовані Node, тепер залишаються в межах зменшеної довіреної поверхні.
</Warning>

Зведення, ініційовані Node, і пов’язані події сесії обмежені передбаченою довіреною поверхнею. Потоки, керовані сповіщеннями або запущені Node, які раніше покладалися на ширший доступ до host або session tool, можуть потребувати коригування. Це посилення гарантує, що події Node не зможуть ескалювати до доступу до інструментів рівня host поза межами довіри, дозволеними для цього Node.

## Автоматичне схвалення (macOS app)

macOS app за бажанням може спробувати **silent approval**, коли:

- запит позначено як `silent`, і
- app може перевірити SSH-з’єднання з хостом gateway від імені того самого користувача.

Якщо silent approval не вдається, відбувається повернення до звичайного запиту “Approve/Reject”.

## Автоматичне схвалення оновлення метаданих

Коли вже paired пристрій перепідключається лише зі змінами нечутливих метаданих
(наприклад, display name або підказок про платформу клієнта), OpenClaw вважає
це `metadata-upgrade`. Silent auto-approval є вузьким: воно застосовується лише до
довірених локальних перепідключень CLI/helper, які вже довели володіння
спільним token або password через loopback. Клієнти Browser/Control UI та віддалені
клієнти, як і раніше, використовують явний процес повторного схвалення. Підвищення scope
(read до write/admin) і зміни public key **не** підпадають під автоматичне схвалення
`metadata-upgrade` — для них зберігаються явні запити на повторне схвалення.

## Helper-и pairing через QR

`/pair qr` відображає payload pairing як структуроване медіа, щоб мобільні й
browser-клієнти могли сканувати його напряму.

Видалення пристрою також очищає всі застарілі pending pairing requests для цього
id пристрою, тому `nodes pending` не показує осиротілі рядки після відкликання.

## Локальність і forwarded headers

Gateway pairing вважає з’єднання loopback лише тоді, коли збігаються і raw socket,
і будь-які докази від upstream proxy. Якщо запит надходить через loopback, але
містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, які
вказують на нелокальне походження, такі докази з forwarded headers скасовують
твердження про локальність loopback. Тоді шлях pairing вимагає явного схвалення
замість тихого трактування запиту як підключення з того самого хоста. Еквівалентне правило
для operator auth див. в [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth).

## Зберігання (локальне, приватне)

Стан pairing зберігається в каталозі стану Gateway (типово `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Якщо ви перевизначаєте `OPENCLAW_STATE_DIR`, тека `nodes/` переміщується разом із ним.

Примітки щодо безпеки:

- Tokens — це секрети; ставтеся до `paired.json` як до чутливого файлу.
- Ротація token вимагає повторного схвалення (або видалення запису Node).

## Поведінка транспорту

- Transport є **безстановим**; він не зберігає інформацію про членство.
- Якщо Gateway офлайн або pairing вимкнено, Node не можуть виконати pairing.
- Якщо Gateway працює у віддаленому режимі, pairing усе одно відбувається зі сховищем віддаленого Gateway.
