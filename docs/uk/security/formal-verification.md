---
permalink: /security/formal-verification/
read_when:
    - Перевірка гарантій або обмежень формальних моделей безпеки
    - Відтворення або оновлення перевірок моделей безпеки TLA+/TLC
summary: Машинно-перевірені моделі безпеки для шляхів OpenClaw з найвищим ризиком.
title: Формальна верифікація (моделі безпеки)
x-i18n:
    generated_at: "2026-04-23T21:11:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7ae72867b782eb77b999f79e6122bceba9e5ace3b4d65438176ec66519007c
    source_path: security/formal-verification.md
    workflow: 15
---

Ця сторінка відстежує **формальні моделі безпеки** OpenClaw (сьогодні TLA+/TLC; за потреби — й інші).

> Примітка: деякі старіші посилання можуть посилатися на попередню назву проєкту.

**Мета (північна зірка):** надати машинно-перевірений аргумент, що OpenClaw застосовує
свою задуману політику безпеки (авторизація, ізоляція сесій, обмеження tools і
безпечність конфігурації), за явно визначених припущень.

**Що це таке (сьогодні):** виконуваний, керований атакувальником **набір регресійних тестів безпеки**:

- Кожне твердження має виконувану model-check перевірку на скінченному просторі станів.
- Багато тверджень мають парну **негативну модель**, яка породжує counterexample trace для реалістичного класу багів.

**Чим це ще не є:** доказом того, що “OpenClaw безпечний у всіх аспектах” або що вся реалізація на TypeScript є правильною.

## Де знаходяться моделі

Моделі підтримуються в окремому репозиторії: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Важливі застереження

- Це **моделі**, а не повна реалізація на TypeScript. Між моделлю та кодом можливий drift.
- Результати обмежені простором станів, дослідженим TLC; “зелений” результат не означає безпеку за межами змодельованих припущень і меж.
- Деякі твердження спираються на явні припущення про середовище (наприклад, правильне розгортання, правильні вхідні дані конфігурації).

## Відтворення результатів

Сьогодні результати відтворюються шляхом локального клонування репозиторію моделей і запуску TLC (див. нижче). У майбутній ітерації можна було б запропонувати:

- моделі, що запускаються в CI, з публічними артефактами (counterexample traces, run logs)
- хостований workflow “запусти цю модель” для невеликих обмежених перевірок

Початок роботи:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Потрібна Java 11+ (TLC працює на JVM).
# Репозиторій містить pinned `tla2tools.jar` (інструменти TLA+) і надає `bin/tlc` + цілі Make.

make <target>
```

### Експозиція gateway і помилкова конфігурація відкритого gateway

**Твердження:** прив’язка за межами loopback без auth може зробити можливим віддалений компроміс / збільшує експозицію; token/password блокує неавторизованих атакувальників (у межах припущень моделі).

- Зелені запуски:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Червоні (очікувано):
  - `make gateway-exposure-v2-negative`

Див. також: `docs/gateway-exposure-matrix.md` у репозиторії моделей.

### Pipeline exec Node (можливість із найвищим ризиком)

**Твердження:** `exec host=node` вимагає (a) allowlist команд Node плюс оголошені команди і (b) live approval, коли це налаштовано; approvals токенізуються, щоб запобігти повторному використанню (у моделі).

- Зелені запуски:
  - `make nodes-pipeline`
  - `make approvals-token`
- Червоні (очікувано):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Сховище pairing (обмеження DM)

**Твердження:** запити pairing дотримуються TTL і обмежень на кількість pending requests.

- Зелені запуски:
  - `make pairing`
  - `make pairing-cap`
- Червоні (очікувано):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Обмеження ingress (mentions + обхід control-command)

**Твердження:** у group-контекстах, де потрібна згадка, неавторизована “control command” не може обійти обмеження на згадку.

- Зелене:
  - `make ingress-gating`
- Червоне (очікувано):
  - `make ingress-gating-negative`

### Ізоляція routing/session-key

**Твердження:** DM від різних peers не зливаються в одну сесію, якщо це явно не зв’язано/налаштовано.

- Зелене:
  - `make routing-isolation`
- Червоне (очікувано):
  - `make routing-isolation-negative`

## v1++: додаткові обмежені моделі (конкурентність, повторні спроби, коректність trace)

Це наступні моделі, які підвищують точність щодо реальних режимів збоїв (неатомарні оновлення, повторні спроби та fan-out повідомлень).

### Конкурентність / ідемпотентність сховища pairing

**Твердження:** сховище pairing має застосовувати `MaxPending` та ідемпотентність навіть за interleavings (тобто “check-then-write” має бути атомарним / заблокованим; refresh не повинен створювати дублікати).

Що це означає:

- За конкурентних запитів не можна перевищити `MaxPending` для каналу.
- Повторні запити/refresh для того самого `(channel, sender)` не повинні створювати дубльовані live pending rows.

- Зелені запуски:
  - `make pairing-race` (атомарна/заблокована перевірка обмеження)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Червоні (очікувано):
  - `make pairing-race-negative` (неатомарна cap-race begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Кореляція / ідемпотентність ingress trace

**Твердження:** ingestion має зберігати кореляцію trace під час fan-out і бути ідемпотентним за повторних спроб provider-а.

Що це означає:

- Коли одна зовнішня подія перетворюється на кілька внутрішніх повідомлень, кожна частина зберігає ту саму ідентичність trace/event.
- Повторні спроби не призводять до подвійної обробки.
- Якщо event ID provider-а відсутні, dedupe переходить до безпечного ключа fallback (наприклад, trace ID), щоб уникнути відкидання різних подій.

- Зелені:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Червоні (очікувано):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedence dmScope у routing + identityLinks

**Твердження:** routing має типово зберігати ізоляцію DM-сесій і зливати сесії лише тоді, коли це явно налаштовано (precedence каналу + identity links).

Що це означає:

- Перевизначення dmScope, специфічні для каналу, повинні мати пріоритет над глобальними типовими значеннями.
- identityLinks мають зливати лише в межах явно пов’язаних груп, а не між непов’язаними peers.

- Зелені:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Червоні (очікувано):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
