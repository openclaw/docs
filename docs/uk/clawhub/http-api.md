---
read_when:
    - Додавання/зміна кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-07-03T23:40:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розміщені під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб перелічувати або шукати навички ClawHub. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного запису ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза поверхнею публічного API.

Скорочені web-slug адреси розв’язуються між сімействами реєстру, але клієнти API мають використовувати
канонічні URL-адреси, повернуті кінцевими точками читання, замість відтворення пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується для кожної IP-адреси.
- Автентифіковані запити (дійсний Bearer-токен): застосовується для кошика користувача.
- Якщо токен відсутній або недійсний, поведінка повертається до застосування за IP-адресою.
- Автентифіковані кінцеві точки запису не мають повертати лише `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли повідомити користувачам, що саме їх заблокувало.

- Читання: 3000/хв на IP-адресу, 12000/хв на ключ
- Запис: 300/хв на IP-адресу, 3000/хв на ключ
- Завантаження: 1200/хв на IP-адресу, 6000/хв на ключ (кінцеві точки завантаження)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизовані: `RateLimit-Limit`, `RateLimit-Reset`
- На `429`: `X-RateLimit-Remaining: 0` і `RateLimit-Remaining: 0`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди Unix epoch
- `RateLimit-Reset`: секунди до скидання (затримка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишковий бюджет, коли наявний.
  Успішні шардовані запити пропускають цей заголовок замість повернення приблизного глобального значення.
- `Retry-After`: секунди очікування перед повторною спробою (затримка) на `429`

Приклад відповіді `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Рекомендації для клієнтів:

- Якщо `Retry-After` існує, зачекайте стільки секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP:

- Використовує довірені заголовки IP-адреси клієнта, зокрема `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені переслані заголовки.
- ClawHub використовує довірені заголовки пересилання, щоб визначати IP-адреси клієнтів на edge.
- Якщо довірена IP-адреса клієнта недоступна, анонімні запити використовують резервні кошики,
  обмежені лише видом обмеження частоти. Ці резервні кошики не містять
  наданих викликачем шляхів, slug, назв пакетів, версій, рядків запиту чи інших
  параметрів артефактів.

## Відповіді з помилками

Публічні відповіді v1 з помилками є звичайним текстом із `content-type: text/plain; charset=utf-8`.
Це охоплює помилки валідації (`400`), відсутні публічні ресурси (`404`), помилки автентифікації та
дозволів (`401`/`403`), обмеження частоти (`429`) і заблоковані завантаження. Клієнти
мають читати тіло відповіді як зручний для людини рядок. Невідомі параметри запиту
ігноруються для сумісності, але розпізнані параметри запиту з недійсними значеннями повертають
`400`.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число
- `highlightedOnly` (необов’язково): `true`, щоб відфільтрувати до виділених навичок
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) навички
- `nonSuspicious` (необов’язково): застарілий псевдонім для `nonSuspiciousOnly`

Відповідь:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Примітки:

- Результати повертаються в порядку релевантності (подібність embedding + точні підсилення токенів slug/назви + невеликий пріоритет популярності).
- Релевантність сильніша за популярність. Точний збіг токена slug або відображуваної назви може випередити менш точний збіг із набагато сильнішою залученістю.
- ASCII-текст токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно й обмежується. Навички з високою залученістю можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може прибрати навичку з публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Рекомендації щодо знаходження видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, до відображуваної назви, короткого опису й тегів. Використовуйте окремий токен slug лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slug стають псевдонімами перенаправлення, але канонічна URL-адреса, відображуваний slug і майбутні пошукові дайджести використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес і встановлень, які розв’язуються через реєстр, але пошукове ранжування ґрунтується на канонічних метаданих навички після індексації перейменування. Наявна статистика залишається з навичкою.
- Якщо навичка неочікувано невидима, спочатку перевірте стан модерації за допомогою `clawhub inspect @owner/slug`, увійшовши в систему, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язково): ціле число (1–200)
- `cursor` (необов’язково): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язково): `updated` (за замовчуванням), `recommended` (псевдонім: `default`), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), застарілі псевдоніми встановлень `installsCurrent`/`installs`/`installsAllTime` зіставляються з `downloads`, `trending`
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) навички
- `nonSuspicious` (необов’язково): застарілий псевдонім для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали залученості та свіжості.
- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових навичок; `updated` змінюється, коли наявні навички публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора можуть повертати менше ніж `limit` елементів на сторінці, бо підозрілі навички фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити пагінацію, коли він наявний. Коротка сторінка сама по собі не означає кінець результатів.

Відповідь:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Відповідь:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Примітки:

- Старі slug, створені потоками перейменування/злиття власника, розв’язуються в канонічну навичку.
- `metadata.os`: обмеження ОС, оголошені у frontmatter навички (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цілі системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо навичка не має метаданих платформи.
- `moderation` включається лише тоді, коли навичку позначено або її переглядає власник.

### `GET /api/v1/skills/{slug}/moderation`

Повертає структурований стан модерації.

Відповідь:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Примітки:

- Власники й модератори можуть отримувати доступ до деталей модерації для прихованих навичок.
- Публічні викликачі отримують `200` лише для вже позначених видимих навичок.
- Докази редагуються для публічних викликачів і містять необроблені фрагменти лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Поскаржитися на навичку для перевірки модератором. Скарги стосуються рівня навички, необов’язково пов’язані
з версією, і потрапляють до черги скарг на навички.

Автентифікація:

- Потрібен API-токен.

Запит:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Відповідь:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Кінцева точка модератора/адміністратора для приймання скарг на навички.

Параметри запиту:

- `status` (необов’язково): `open` (за замовчуванням), `confirmed`, `dismissed` або `all`
- `limit` (необов’язково): ціле число (1-200)
- `cursor` (необов’язково): курсор пагінації

Відповідь:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Кінцева точка модератора/адміністратора для розв’язання або повторного відкриття скарг на навички.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов’язковий для `confirmed` і `dismissed`; його можна пропустити, коли
`status` повертається до `open`. Передайте `finalAction: "hide"` з розглянутою
скаргою, щоб приховати навичку в тому самому придатному для аудиту workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` містить нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки сканування безпеки для версії навички.

Параметри запиту:

- `version` (необов’язково): рядок конкретної версії.
- `tag` (необов’язково): розв’язати позначену тегом версію (наприклад, `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки, а також деталі, специфічні для сканера.
- `security.hasScanResult` має значення `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні навички, отриманий із найновішої версії.
- Під час запиту історичної версії перевіряйте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж вважати `moderation` і `security` контекстом тієї самої версії.

### `POST /api/v1/skills/-/scan`

Автентифікована кінцева точка подання для нових завдань ClawScan.

Сканування локальних завантажень більше не підтримуються. Запити з використанням
`multipart/form-data` або `{ "source": { "kind": "upload" } }` повертають `410`.

Опубліковані сканування використовують JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примітки:

- Корисні навантаження запитів на сканування та завантажувані звіти видаляються зі сховища запитів на сканування після закінчення періоду зберігання.
- Опубліковані сканування потребують доступу власника/видавця до керування або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записують результати назад лише коли `update: true` і сканування успішно завершується.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування виконуються асинхронно. Ручні запити на сканування мають пріоритет над звичайною роботою публікації/зворотного заповнення, але завершення все одно залежить від доступності воркерів.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікована кінцева точка опитування для поданого сканування.

- Повертає статус у черзі/виконується/успішно/невдало.
- Повертає `queue.queuedAhead` і `queue.position`, поки запит у черзі, щоб клієнти могли показати, скільки пріоритетних ручних сканувань стоїть попереду цього запиту. Дуже великі черги обмежуються та повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікована кінцева точка архіву звіту.

- Потребує успішно завершеного сканування; незавершені сканування повертають `409`.
- Повертає ZIP з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікована кінцева точка збереженого архіву звіту для поданих версій.

- Потребує доступу власника/видавця до керування навичкою або плагіном, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точно поданої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань плагінів/пакетів.
- Повертає ту саму форму ZIP, що й завантаження запитів на сканування.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму форму корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакета лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки Skill Card, який використовується `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати версію з тегом (наприклад, `latest`).

Примітки:

- `ok` має значення `true` лише тоді, коли вибрана версія має згенеровану Skill Card, не заблокована модерацією як шкідлива та перевірка ClawScan є чистою.
- Ідентичність навички, ідентичність видавця та метадані вибраної версії є полями верхнього рівня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб shell-автоматизація могла читати їх без розпаковування вкладених обгорток.
- `security` — це вердикт ClawScan/безпеки верхнього рівня. Автоматизація має орієнтуватися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканерів, як-от `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди має значення `null`.
- `provenance` має значення `server-resolved-github-import` лише тоді, коли ClawHub розв’язав і зберіг репозиторій GitHub/ref/commit/path під час публікації або імпорту; інакше має значення `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Повертає поточні компактні вердикти безпеки для точних версій навичок. Ця
кінцева точка колекції призначена для клієнтів, які вже знають, які встановлені
версії навичок ClawHub їм потрібно відобразити, наприклад OpenClaw Control UI.

Запит:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примітки:

- `items` має містити 1-100 унікальних пар `{ slug, version }`.
- Результати повертаються для кожного елемента; одна відсутня навичка або версія не спричиняє збій усієї відповіді.
- Відповідь стосується лише безпеки. Вона не містить даних Skill Card, статусу згенерованої картки, списків файлів артефактів або детальних корисних навантажень сканера.
- `security.signals` містить лише допоміжні докази на рівні статусу; використовуйте `/scan` або сторінку аудиту безпеки ClawHub для повних деталей сканера.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди має значення `null`.
- Відсутність Skill Card не впливає на `ok`, `decision` або `reasons` цієї кінцевої точки; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли потрібен конверт перевірки Skill Card для однієї навички, `/card`, коли потрібен згенерований markdown картки, і `/scan`, коли потрібні детальні дані сканера.

Відповідь:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Повертає сирий текстовий вміст.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується найновіша версія.
- Обмеження розміру файлу: 200 КБ.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- skills
- code plugins
- bundle plugins

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `sort` (необов’язково): `updated` (типово), `recommended`, `trending`, `downloads`, застарілий псевдонім `installs`
- `category` (необов’язково): фільтр категорії plugin. Підтримується лише тоді, коли
  запит обмежено пакетами plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Керовані категорії та
  застарілі псевдоніми фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованим сімейством.
- Записи skills залишаються підкріпленими реєстром skills і досі можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` і надалі призначений лише для релізів code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі серед skills + пакетів plugin.

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число (1–100)
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `category` (необов’язково): фільтр категорії plugin. Підтримується лише тоді, коли
  запит обмежено пакетами plugin. Керовані категорії та застарілі
  псевдоніми фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured` або
  `highlightedOnly` повертають `400`. Невідомі параметри запиту ігноруються.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/plugins`

Перегляд каталогу лише Plugin серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації
- `isOfficial` (необов’язково): `true` або `false`
- `sort` (необов’язково): `recommended` (типово), `trending`, `downloads`, `updated`, застарілий псевдонім `installs`
- `category` (необов’язково): фільтр категорії plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі псевдоніми фільтрів v1 і надалі приймаються на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` розпізнаються як `tools`.
- `observability` і `deployment` розпізнаються як `gateway`.
- `dev-tools` розпізнається як `runtime`.

`trending` — це семиденна таблиця лідерів встановлень/завантажень і не використовує загальні підсумки за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` це лише для plugin; використовуйте
`/api/v1/skills?sort=trending` для каталогу skills.

Застарілі псевдоніми не приймаються як збережені або заявлені авторами значення категорій.

### `GET /api/v1/skills/export`

Масовий експорт найновіших публічних skills для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язково): нижня межа Unix у мілісекундах для `updatedAt` skill.
- `endDate` (обов’язково): верхня межа Unix у мілісекундах для `updatedAt` skill.
- `limit` (необов’язково): ціле число (1-250), типово `250`.
- `cursor` (необов’язково): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований skill має корінь у `{publisher}/{slug}/`.
- Розміщені skills містять файли найновішої збереженої версії та перелічені в
  `_manifest.json` із `sourceRef: "public-clawhub"`.
- Поточні skills на основі GitHub зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` із `sourceRef: "public-github"`, репозиторієм, комітом, шляхом,
  хешем вмісту та URL архіву. Вони не містять вихідні файли, розміщені на ClawHub.
- Кожен skill містить `_export_skill_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включено, коли окремі skills або файли не вдалося
  експортувати.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Масовий експорт найновіших публічних релізів Plugin для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язково): нижня межа Unix у мілісекундах для Plugin `updatedAt`.
- `endDate` (обов’язково): верхня межа Unix у мілісекундах для Plugin `updatedAt`.
- `limit` (необов’язково): ціле число (1-250), типово `250`.
- `cursor` (необов’язково): курсор пагінації з попередньої відповіді.
- `family` (необов’язково): `code-plugin` або `bundle-plugin`. Якщо пропущено, означає обидві
  родини Plugin.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований Plugin має корінь у `{family}/{packageName}/`.
- Кожен експортований Plugin містить збережені файли найновішого релізу.
- Метадані експорту для кожного Plugin зберігаються в
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включено, коли окремі Plugin або файли не вдалося
  експортувати.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Пошук лише Plugin серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число (1-100)
- `isOfficial` (необов’язково): `true` або `false`
- `category` (необов’язково): фільтр категорії Plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примітки:

- Застарілі псевдоніми фільтрів v1, задокументовані в `GET /api/v1/plugins`, також
  приймаються.
- Фільтрування за категорією є справжнім API-фільтром, що спирається на рядки дайджесту категорій Plugin,
  а не переписуванням пошукового запиту.
- Результати повертаються в порядку релевантності й наразі не мають пагінації.
- Елементи керування сортуванням у браузерному UI для пошуку Plugin перевпорядковують завантажені результати релевантності,
  відповідно до поточної поведінки перегляду `/skills`.

### `GET /api/v1/packages/{name}`

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `DELETE /api/v1/packages/{name}`

М’яко видаляє пакет і всі релізи.

Примітки:

- Потребує API-токен власника пакета, власника/адміністратора видавця-організації,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, включно з метаданими файлів, сумісністю,
верифікацією, метаданими артефакта та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого світу або
  `npm-pack` для релізів на основі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` — застарілі метадані сумісності для старих клієнтів. Вони
  хешують точні байти ZIP, повернені `/api/v1/packages/{name}/download`.
  Сучасні клієнти мають використовувати `version.artifact.sha256`, який ідентифікує
  канонічний артефакт релізу.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються,
  коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точний підсумок безпеки й довіри релізу пакета для клієнтів
інсталяції. Це публічна поверхня споживання OpenClaw для вирішення, чи можна
інсталювати розв’язаний реліз.

Автентифікація:

- Публічна кінцева точка читання. Токен власника, видавця, модератора або адміністратора
  не потрібен.

Відповідь:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Поля відповіді:

- `package.name`, `package.displayName` і `package.family` ідентифікують
  розв’язаний пакет реєстру.
- `release.releaseId`, `release.version` і `release.createdAt` ідентифікують
  точний реліз, який було оцінено.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` і `release.npmTarballName` присутні, коли вони відомі для
  артефакта релізу.
- `trust.scanStatus` — ефективний статус довіри, виведений із вхідних даних сканерів
  і ручної модерації релізу.
- `trust.moderationState` може бути null. Він дорівнює `null`, коли немає ручної
  модерації релізу.
- `trust.blockedFromDownload` — сигнал блокування інсталяції. OpenClaw та інші
  клієнти інсталяції мають блокувати інсталяцію, коли це значення дорівнює `true`, замість
  повторного виведення правил блокування з полів сканера або модерації.
- `trust.reasons` — список пояснень для користувача й аудиту. Коди причин
  є стабільними компактними рядками, як-от `manual:quarantined`, `scan:malicious`
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри ще очікують завершення.
- `trust.stale` означає, що підсумок довіри було обчислено на основі застарілих вхідних даних і
  його слід вважати таким, що потребує оновлення перед рішенням дозволу з високою впевненістю.

Примітки:

- Ця кінцева точка є точною до версії. Клієнти мають викликати її після розв’язання
  версії пакета, яку вони збираються інсталювати, а не лише після читання найновіших
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації для власників/модераторів.
  Вона розкриває рішення щодо інсталяції та публічне пояснення, а не
  особи репортерів, тіла звітів, приватні докази чи внутрішні часові шкали
  рев’ю.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані розв’язувача артефакта для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і застарілу URL сумісності ZIP.
- Це поверхня розв’язувача OpenClaw; вона уникає вгадування формату архіву зі
  спільної URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях розв’язувача.

Примітки:

- Версії ClawPack потоково передають точні байти завантаженого npm-pack `.tgz`.
- Застарілі версії ZIP перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує бакет обмеження швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність найновішої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
- походження репозиторію джерела й коміту
- метадані сумісності OpenClaw
- цільові хости
- стан сканування

Відповідь:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Кінцева точка модератора для переліку рядків міграції офіційних Plugin OpenClaw.

Автентифікація:

- Потребує API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `phase` (необов’язково): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` або
  `all` (типово).
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Відповідь:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Адміністративна кінцева точка для створення або оновлення рядка міграції офіційного Plugin.

Автентифікація:

- Потребує API-токен адміністратора.

Тіло запиту:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Примітки:

- `bundledPluginId` нормалізується до нижнього регістру та є стабільним ключем upsert.
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутнім для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Воно не змінює OpenClaw і не генерує
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг рев’ю релізів пакетів.

Автентифікація:

- Потребує API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, поміщені в карантин, відкликані або повідомлені релізи.
- `blocked`: релізи, поміщені в карантин, відкликані або шкідливі.
- `manual`: будь-який реліз із ручним перевизначенням модерації.
- `all`: будь-який реліз із ручним перевизначенням, нечистим станом сканування або звітом про пакет.

Відповідь:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Повідомляє про пакет для рев’ю модератором. Звіти мають рівень пакета й можуть бути необов’язково
пов’язані з версією. Вони потрапляють у чергу модерації, але самі собою не приховують автоматично
й не блокують завантаження; модератори мають використовувати модерацію релізів, щоб
схвалювати, поміщати в карантин або відкликати артефакти.

Автентифікація:

- Потребує API-токен.

Запит:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Відповідь:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Кінцева точка модератора/адміністратора для приймання звітів про пакети.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `confirmed`, `dismissed` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Відповідь:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Кінцева точка власника/модератора для видимості модерації пакета.

Автентифікація:

- Потрібен API-токен власника пакета, учасника видавця, модератора або
  користувача-адміністратора.

Відповідь:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Кінцева точка модератора/адміністратора для вирішення або повторного відкриття звітів про пакети.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` обов’язковий для `confirmed` і `dismissed`; його можна пропустити, коли
`status` повертається до `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію релізу в тому
самому аудитованому робочому процесі.

Відповідь:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Кінцева точка модератора/адміністратора для перевірки релізу пакета.

Запит:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Підтримувані стани:

- `approved`: перевірено вручну та дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в стані карантину або відкликання повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис журналу аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає сирий текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній реліз.
- Використовує кошик ліміту читання, а не кошик завантажень.
- Бінарні файли повертають `415`.
- Обмеження розміру файлу: 200KB.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть бути приховані деінде.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній реліз.
- Skills перенаправляються на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише для ZIP. Він не стримить файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів, підкріплених ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball-файлами ClawPack npm-pack.
- Застарілі версії лише з ZIP навмисно пропущені.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument-и scoped-пакетів підтримують як `/api/npm/@scope/name`, так і npm-овий
  закодований шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Стримить точні байти завантаженого tarball-файлу ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує кошик ліміту завантажень.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального fingerprint із відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний hex sha256 fingerprint комплекту

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії навички або повертає передавання джерела GitHub для
поточної навички, підкріпленої GitHub, зі сканом `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- М’яко видалені версії повертають `410`.
- Передавання навичок, підкріплених GitHub, не проксіює і не дзеркалює байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є бар’єром і не включається як метадані
  payload успіху.
- Статистика завантажень рахується як унікальні ідентичності за UTC-день (`userId`, коли API-токен чинний, інакше IP).

## Кінцеві точки автентифікації (Bearer token)

Усі кінцеві точки потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob-ами `files[]`.
- JSON-тіло з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Коли воно наявне, API резолвить цього
  видавця на сервері та вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` разом з `ownerHandle`, наявна
  навичка може перейти до цього власника, якщо актор є адміністратором/власником у
  поточного й цільового видавців. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потребує автентифікації Bearer token.
- Потребує `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blob-и `files` або одне посилання на tarball
  `clawpack`. `clawpack` може бути blob-ом `.tgz` або storage id, поверненим
  потоком upload-url. Публікації зі staged storage-id також мають містити
  `clawpackUploadTicket`, повернений із цим URL завантаження.
- Використовуйте або `files`, або `clawpack`, але ніколи обидва в одному запиті.
- JSON-тіла та надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18MB. Tarball-файли ClawPack можуть
  використовувати потік upload-url до ліміту tarball 120MB.
- Необов’язкове поле payload: `ownerHandle`. Коли воно наявне, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих коміту
  джерела, метаданих config schema, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише видавець org `openclaw` і особисті видавці поточних учасників org `openclaw`
  можуть публікувати в канал `official`.
- Публікації від імені когось усе ще перевіряють право на official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М’яко видалити / відновити навичку (власник, модератор або адміністратор).

Необов’язкове JSON-тіло:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли `reason` наявний, він зберігається як нотатка модерації навички та копіюється в журнал аудиту.
М’які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк.
Приховування модератором/адміністратором і безпекові видалення не спливають таким чином.

Відповідь видалення:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди стану:

- `200`: ok
- `401`: неавторизовано
- `403`: заборонено
- `404`: навичку/користувача не знайдено
- `500`: внутрішня помилка сервера

### `POST /api/v1/users/publisher`

Лише для адміністратора. Забезпечує існування org-видавця для handle. Якщо handle все ще вказує на
застарілого спільного користувача/особистого видавця, кінцева точка спершу мігрує його в org-видавця.
Для новоствореної org надайте `memberHandle`; активний адміністратор не додається як учасник.
`memberRole` типово дорівнює `owner`.

- Тіло: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане самостійне створення org-видавця. Створює нового org-видавця та додає
викликача як власника. Ця кінцева точка не мігрує наявні користувацькі/особисті handle-и і
не позначає видавця як довіреного/офіційного.

- Тіло: `{ "handle": "opik", "displayName": "Opik" }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle уже використовується видавцем, користувачем або особистим видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slug-и та назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними пакетами-заповнювачами без рядків релізів, тому той самий
власник може пізніше опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Тіло: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністратора. Відновлює особистого видавця для перевіреного замінного principal GitHub OAuth
без редагування рядків облікових записів Convex Auth. Запит має назвати обидва незмінні GitHub
provider account ids; змінні handle-и використовуються лише як захист для оператора.

Кінцева точка за замовчуванням працює як пробний запуск. Застосування відновлення потребує `dryRun: false` і
`confirmIdentityVerified: true` після того, як персонал незалежно перевірить безперервність між обома
суб'єктами GitHub. Відновлення закривається з помилкою, якщо поточний персональний
видавець користувача призначення має навички, пакети або джерела навичок GitHub.
Відновлення також мігрує застарілі поля `ownerUserId` для навичок відновленого видавця,
псевдонімів слагів навичок, пакетів, попереджень інспектора пакетів і похідних рядків пошукового дайджесту, щоб
шляхи прямого власника узгоджувалися з новими повноваженнями видавця. Активне резервування захищеного хендла
для відновленого хендла також перепризначається користувачу-заміні, щоб подальша
синхронізація профілю не могла відновити конкуруючі повноваження колишнього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спершу використати відновлювану міграцію власника.
Джерела навичок GitHub мають область дії видавця й повідомляються як перевірені, а не перезаписані.

- Тіло: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Відповідь: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Кінцеві точки керування слагом власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидві кінцеві точки потребують автентифікації API-токеном і працюють лише для власника навички.
- `rename` зберігає попередній слаг як псевдонім перенаправлення.
- `merge` приховує вихідний запис і перенаправляє вихідний слаг до цільового запису.

### Кінцеві точки передавання права власності

- `POST /api/v1/skills/{slug}/transfer`
  - Тіло: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Відповідь: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Відповідь (прийняття/відхилення/скасування): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма відповіді: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Забанити користувача й остаточно видалити навички, якими він володіє (лише модератор/адміністратор).

Тіло:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

або

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Відповідь:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Зняти бан із користувача й відновити придатні навички (лише адміністратор).

Тіло:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

або

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Відповідь:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Змінити збережену причину наявного бану без зняття бану або відновлення
вмісту (лише адміністратор). За замовчуванням працює як пробний запуск, якщо `dryRun` не дорівнює `false`.

Тіло:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

або

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Відповідь:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Змінити роль користувача (лише адміністратор).

Тіло:

```json
{ "handle": "user_handle", "role": "moderator" }
```

або

```json
{ "userId": "users_...", "role": "admin" }
```

Відповідь:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Перелічити або шукати користувачів (лише адміністратор).

Параметри запиту:

- `q` (необов'язково): пошуковий запит
- `query` (необов'язково): псевдонім для `q`
- `limit` (необов'язково): максимальна кількість результатів (за замовчуванням 20, максимум 200)

Відповідь:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Додати/прибрати зірку (виділення). Обидві кінцеві точки ідемпотентні.

Відповіді:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Застарілі кінцеві точки CLI (нерекомендовані)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Див. `DEPRECATIONS.md` щодо плану видалення.

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації пакетів,
які розміщують tar-архів ClawPack, мають надсилати отриманий ідентифікатор сховища як
`clawpack`, а повернений квиток як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, рекомендовано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви розгортаєте самостійно, надайте цей файл (або явно встановіть `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
