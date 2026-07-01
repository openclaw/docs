---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстр
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-07-01T13:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розташовані під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` зберігаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання для переліку або пошуку Skills ClawHub. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, посилайте користувачів назад на канонічний запис ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дублювати прихований, приватний або заблокований модерацією вміст поза поверхнею публічного API.

Веб-скорочення slug розв’язуються між сімействами реєстру, але клієнтам API слід використовувати
канонічні URL-адреси, повернуті кінцевими точками читання, замість відтворення пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується для кожної IP-адреси.
- Автентифіковані запити (дійсний Bearer token): застосовується для кошика користувача.
- Якщо token відсутній або недійсний, поведінка повертається до застосування за IP.
- Автентифіковані кінцеві точки запису не повинні повертати лише `Unauthorized`, коли
  сервер знає причину. Відсутні tokens, недійсні/відкликані tokens і
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб клієнти
  CLI могли повідомити користувачам, що їх заблокувало.

- Читання: 3000/хв на IP, 12000/хв на ключ
- Запис: 300/хв на IP, 3000/хв на ключ
- Завантаження: 1200/хв на IP, 6000/хв на ключ (кінцеві точки завантаження)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизовано: `RateLimit-Limit`, `RateLimit-Reset`
- На `429`: `X-RateLimit-Remaining: 0` і `RateLimit-Remaining: 0`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди Unix epoch
- `RateLimit-Reset`: секунди до скидання (затримка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок бюджету, якщо присутній.
  Успішні шардовані запити опускають цей заголовок замість повернення приблизного глобального значення.
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

Настанови для клієнтів:

- Якщо існує `Retry-After`, зачекайте стільки секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть з `X-RateLimit-Reset`).

Джерело IP:

- Використовує довірені заголовки IP клієнта, включно з `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені перенаправлені заголовки.
- ClawHub використовує довірені перенаправлені заголовки для ідентифікації IP клієнтів на edge.
- Якщо довірена IP клієнта недоступна, анонімні запити використовують резервні кошики,
  обмежені лише типом обмеження частоти. Ці резервні кошики не включають
  надані викликачем шляхи, slugs, назви пакетів, версії, рядки запиту або інші
  параметри артефактів.

## Відповіді з помилками

Публічні відповіді про помилки v1 є plain text із `content-type: text/plain; charset=utf-8`.
Це включає помилки валідації (`400`), відсутні публічні ресурси (`404`), помилки автентифікації та
дозволів (`401`/`403`), обмеження частоти (`429`) і заблоковані завантаження. Клієнтам
слід читати тіло відповіді як зрозумілий людині рядок. Невідомі параметри запиту
ігноруються для сумісності, але розпізнані параметри запиту з недійсними значеннями повертають
`400`.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число
- `highlightedOnly` (необов’язково): `true`, щоб фільтрувати до виділених Skills
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
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

- Результати повертаються в порядку релевантності (embedding similarity + підсилення точних slug/name token + невеликий пріоритет популярності).
- Релевантність сильніша за популярність. Точний збіг token slug або display-name може випередити слабший збіг із набагато сильнішою залученістю.
- ASCII-текст токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий token `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно й обмежується. Skills із високою залученістю можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може вилучити skill з публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Настанови щодо видимості для видавців:

- Розміщуйте терміни, які користувачі буквально шукатимуть, у display name, summary і tags. Використовуйте окремий token slug лише тоді, коли він також є стабільною ідентичністю, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slugs стають псевдонімами перенаправлення, але канонічна URL-адреса, відображений slug і майбутні дайджести пошуку використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес та інсталяцій, які розв’язуються через реєстр, але ранжування пошуку базується на канонічних метаданих skill після індексації перейменування. Наявна статистика залишається зі skill.
- Якщо skill несподівано невидимий, спочатку перевірте стан модерації за допомогою `clawhub inspect @owner/slug`, увійшовши в систему, перед зміною метаданих, пов’язаних із ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язково): ціле число (1–200)
- `cursor` (необов’язково): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язково): `updated` (за замовчуванням), `recommended` (псевдонім: `default`), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), застарілі псевдоніми інсталяцій `installsCurrent`/`installs`/`installsAllTime` відповідають `downloads`, `trending`
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язково): застарілий псевдонім для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали залученості та нещодавності.
- `trending` ранжує за інсталяціями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових Skills; `updated` змінюється, коли наявні Skills публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора можуть повертати менше ніж `limit` елементів на сторінці, оскільки підозрілі Skills фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити пагінацію, якщо він присутній. Коротка сторінка сама по собі не означає кінець результатів.

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

- Старі slugs, створені потоками перейменування/об’єднання власника, розв’язуються до канонічного skill.
- `metadata.os`: обмеження ОС, оголошені у frontmatter skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цільові системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо skill не має метаданих платформи.
- `moderation` включається лише тоді, коли skill позначено або його переглядає власник.

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

- Власники й модератори можуть отримувати доступ до деталей модерації для прихованих Skills.
- Публічні викликачі отримують `200` лише для вже позначених видимих Skills.
- Докази редагуються для публічних викликачів і містять необроблені фрагменти лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Поскаржитися на skill для перевірки модератором. Скарги діють на рівні skill, необов’язково пов’язані
з версією, і надходять до черги скарг на skill.

Автентифікація:

- Потрібен API token.

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

Кінцева точка модератора/адміністратора для приймання скарг на skill.

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

Кінцева точка модератора/адміністратора для вирішення або повторного відкриття скарг на skill.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов’язковий для `confirmed` і `dismissed`; його можна опустити під час
встановлення `status` назад на `open`. Передайте `finalAction: "hide"` із розглянутою
скаргою, щоб приховати skill у тому самому придатному для аудиту workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` включає нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), якщо доступні.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки безпекового сканування для версії skill.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати позначену тегом версію (наприклад, `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується остання версія.
- Містить нормалізований статус перевірки та специфічні для сканера деталі.
- `security.hasScanResult` дорівнює `true` лише тоді, коли сканер сформував остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні навички, отриманий з останньої версії.
- Під час запиту історичної версії перевіряйте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж розглядати `moderation` і `security` як один контекст версії.

### `POST /api/v1/skills/-/scan`

Автентифікований endpoint надсилання для нових завдань ClawScan.

Локальні сканування завантажень більше не підтримуються. Запити з
`multipart/form-data` або `{ "source": { "kind": "upload" } }` повертають `410`.

Опубліковані сканування використовують JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примітки:

- Корисні навантаження запитів на сканування та звіти для завантаження спливають зі сховища запитів на сканування після періоду зберігання.
- Опубліковані сканування потребують управлінського доступу власника/видавця або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записують результат назад лише коли `update: true` і сканування успішно завершується.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування є асинхронними. Ручні запити на сканування мають пріоритет над звичайною роботою публікації/зворотного заповнення, але завершення все одно залежить від доступності worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікований endpoint опитування для надісланого сканування.

- Повертає статус queued/running/succeeded/failed.
- Повертає `queue.queuedAhead` і `queue.position`, поки запит у черзі, щоб клієнти могли показувати, скільки пріоритезованих ручних сканувань стоїть перед цим запитом. Дуже великі черги обмежуються й повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікований endpoint архіву звіту.

- Потребує успішно завершеного сканування; нетермінальні сканування повертають `409`.
- Повертає ZIP з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікований endpoint збереженого архіву звіту для надісланих версій.

- Потребує управлінського доступу власника/видавця до навички або plugin, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точної надісланої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань plugin/пакета.
- Повертає ту саму форму ZIP, що й завантаження запитів на сканування.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму форму корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакета лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки картки навички, який використовує `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): визначає позначену тегом версію (наприклад, `latest`).

Примітки:

- `ok` дорівнює `true` лише тоді, коли вибрана версія має згенеровану картку навички, не заблокована модерацією як malware, а перевірка ClawScan чиста.
- Ідентичність навички, ідентичність видавця та метадані вибраної версії є полями верхнього рівня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб автоматизація shell могла читати їх без розпаковування вкладених оболонок.
- `security` — це вердикт ClawScan/security верхнього рівня. Автоматизація має орієнтуватися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканерів, як-от `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди дорівнює `null`.
- `provenance` має значення `server-resolved-github-import` лише тоді, коли ClawHub визначив і зберіг GitHub repo/ref/commit/path під час публікації або імпорту; інакше це `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Повертає поточні компактні вердикти безпеки для точних версій навичок. Цей
endpoint колекції призначений для клієнтів, які вже знають, які встановлені
версії навичок ClawHub їм потрібно показати, наприклад OpenClaw Control UI.

Запит:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примітки:

- `items` має містити 1–100 унікальних пар `{ slug, version }`.
- Результати повертаються для кожного елемента; одна відсутня навичка або версія не призводить до помилки всієї відповіді.
- Відповідь стосується лише безпеки. Вона не містить даних картки навички, статусу згенерованої картки, списків файлів артефактів або докладних корисних навантажень сканерів.
- `security.signals` містить лише допоміжні докази на рівні статусу; використовуйте `/scan` або сторінку security-audit у ClawHub для повних деталей сканерів.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди дорівнює `null`.
- Відсутність картки навички не впливає на `ok`, `decision` або `reasons` цього endpoint; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли потрібен конверт перевірки картки навички для однієї навички, `/card`, коли потрібен згенерований markdown картки, і `/scan`, коли потрібні докладні дані сканерів.

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

Повертає необроблений текстовий вміст.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується найновіша версія.
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
- `sort` (необов’язково): `updated` (за замовчуванням), `recommended`, `trending`, `downloads`, застарілий псевдонім `installs`
- `category` (необов’язково): фільтр категорії plugin. Підтримується лише тоді, коли
  запит обмежено пакетами plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Керовані категорії та
  застарілі псевдоніми фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованою родиною.
- Записи skill і далі підтримуються реєстром skill і все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` досі призначено лише для випусків code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети для видавців, до яких вони належать, у результатах списку/пошуку.
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
  запит обмежено пакетами plugin. Керовані категорії та застарілі псевдоніми
  фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured` або
  `highlightedOnly` повертають `400`. Невідомі параметри запиту ігноруються.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети для видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/plugins`

Перегляд каталогу лише для Plugin серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації
- `isOfficial` (необов’язково): `true` або `false`
- `sort` (необов’язково): `recommended` (за замовчуванням), `trending`, `downloads`, `updated`, застарілий псевдонім `installs`
- `category` (необов’язково): фільтр категорії plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі псевдоніми фільтрів v1 і далі приймаються на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` перетворюються на `tools`.
- `observability` і `deployment` перетворюються на `gateway`.
- `dev-tools` перетворюється на `runtime`.

`trending` — це рейтинг установлень/завантажень за сім днів, який не використовує загальні підсумки за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` він застосовується лише до Plugin; використовуйте
`/api/v1/skills?sort=trending` для каталогу skill.

Застарілі псевдоніми не приймаються як збережені або оголошені автором значення категорій.

### `GET /api/v1/skills/export`

Масовий експорт найновіших публічних skills для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язково): нижня межа в мілісекундах Unix для `updatedAt` skill.
- `endDate` (обов’язково): верхня межа в мілісекундах Unix для `updatedAt` skill.
- `limit` (необов’язково): ціле число (1-250), за замовчуванням `250`.
- `cursor` (необов’язково): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований skill має корінь у `{publisher}/{slug}/`.
- Розміщені skills містять найновіші файли збереженої версії та перелічені в
  `_manifest.json` із `sourceRef: "public-clawhub"`.
- Поточні skills на основі GitHub зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` із `sourceRef: "public-github"`, репозиторієм, комітом, шляхом,
  хешем вмісту та URL архіву. Вони не містять вихідних файлів, розміщених у ClawHub.
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

- `startDate` (обов’язковий): нижня межа Unix у мілісекундах для `updatedAt` Plugin.
- `endDate` (обов’язковий): верхня межа Unix у мілісекундах для `updatedAt` Plugin.
- `limit` (необов’язковий): ціле число (1-250), за замовчуванням `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.
- `family` (необов’язковий): `code-plugin` або `bundle-plugin`. Якщо пропущено, це означає обидва
  сімейства Plugin.

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

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1-100)
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії Plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примітки:

- Також приймаються застарілі псевдоніми фільтрів v1, задокументовані в `GET /api/v1/plugins`.
- Фільтрація за категоріями є справжнім API-фільтром, що спирається на рядки дайджесту категорій Plugin,
  а не переписуванням пошукового запиту.
- Результати повертаються в порядку релевантності й наразі не мають пагінації.
- Елементи керування сортуванням у браузерному UI для пошуку Plugin перевпорядковують завантажені релевантні результати,
  відповідно до поточної поведінки перегляду `/skills`.

### `GET /api/v1/packages/{name}`

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета та всіх релізів.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора видавця-організації,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, включно з метаданими файлів, сумісністю,
перевіркою, метаданими артефакту та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого світу або
  `npm-pack` для релізів на основі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` є застарілими метаданими сумісності для старих клієнтів. Він
  хешує точні байти ZIP, що повертаються `/api/v1/packages/{name}/download`.
  Сучасним клієнтам слід використовувати `version.artifact.sha256`, який ідентифікує
  канонічний артефакт релізу.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються,
  коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точне зведення безпеки й довіри релізу пакета для клієнтів
інсталяції. Це публічна поверхня споживання OpenClaw для визначення, чи можна
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
  `release.npmShasum` і `release.npmTarballName` наявні, коли вони відомі для
  артефакту релізу.
- `trust.scanStatus` є ефективним статусом довіри, отриманим із вхідних даних сканера
  та ручної модерації релізу.
- `trust.moderationState` може бути null. Він має значення `null`, коли ручної модерації релізу
  не існує.
- `trust.blockedFromDownload` є сигналом блокування інсталяції. OpenClaw та інші
  клієнти інсталяції мають блокувати інсталяцію, коли це значення дорівнює `true`, замість
  повторного виведення правил блокування з полів сканера або модерації.
- `trust.reasons` є списком пояснень для користувача й аудиту. Коди причин
  є стабільними компактними рядками, як-от `manual:quarantined`, `scan:malicious`
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри ще очікують завершення.
- `trust.stale` означає, що зведення довіри було обчислено із застарілих вхідних даних і
  має вважатися таким, що потребує оновлення перед дозволом із високою впевненістю.

Примітки:

- Ця кінцева точка є точною до версії. Клієнти мають викликати її після розв’язання
  версії пакета, яку вони мають намір інсталювати, а не просто після читання найновіших
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації для власників/модераторів.
  Вона розкриває рішення щодо інсталяції та публічне пояснення, а не
  особи репортерів, тіла звітів, приватні докази або внутрішні часові шкали
  перевірки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані розв’язувача артефакту для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і URL сумісності із застарілим ZIP.
- Це поверхня розв’язувача OpenClaw; вона уникає вгадування формату архіву зі
  спільного URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях розв’язувача.

Примітки:

- Версії ClawPack передають потоком точні завантажені байти npm-pack `.tgz`.
- Застарілі ZIP-версії переспрямовують на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик ліміту частоти завантаження.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- офіційний статус каналу
- доступність найновішої версії
- доступність артефакту ClawPack npm-pack
- дайджест артефакту
- походження репозиторію джерел і коміту
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

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `phase` (необов’язковий): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` або
  `all` (за замовчуванням).
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

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

Кінцева точка адміністратора для створення або оновлення рядка міграції офіційного Plugin.

Автентифікація:

- Потрібен API-токен користувача-адміністратора.

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

- `bundledPluginId` нормалізується до нижнього регістру й є стабільним ключем upsert.
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутнім для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Воно не змінює OpenClaw і не генерує
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язковий): `open` (за замовчуванням), `blocked`, `manual` або `all`
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

Значення статусів:

- `open`: підозрілі, зловмисні, очікувані, ізольовані, відкликані або зарепортовані релізи.
- `blocked`: ізольовані, відкликані або зловмисні релізи.
- `manual`: будь-який реліз із ручним перевизначенням модерації.
- `all`: будь-який реліз із ручним перевизначенням, не чистим станом сканування або звітом про пакет.

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

Повідомити про пакет для перевірки модератором. Звіти належать до рівня пакета й необов’язково
пов’язуються з версією. Вони потрапляють у чергу модерації, але самі собою не приховують автоматично
та не блокують завантаження; модераторам слід використовувати модерацію релізів, щоб
схвалювати, ізолювати або відкликати артефакти.

Автентифікація:

- Потрібен API-токен.

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

`note` обов’язкове для `confirmed` і `dismissed`; його можна опустити під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію релізу в тому
самому аудитовному робочому процесі.

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

- `approved`: вручну перевірено й дозволено.
- `quarantined`: заблоковано до подальших дій.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Карантиновані та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис у журнал аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується найновіший реліз.
- Використовує ліміт швидкості читання, а не ліміт завантажень.
- Бінарні файли повертають `415`.
- Обмеження розміру файлу: 200KB.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть утримуватися в інших місцях.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується найновіший реліз.
- Skills переспрямовуються до `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише реєстру не впроваджуються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакета на основі ClawPack.

Примітки:

- У списку є лише версії із завантаженими tarball-файлами ClawPack npm-pack.
- Застарілі версії лише з ZIP навмисно опущено.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument для scoped-пакетів підтримують як `/api/npm/@scope/name`, так і npm
  encoded шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує ліміт швидкості завантажень.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний hex sha256 відбитка bundle

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії skill або повертає передавання до джерела GitHub для
поточної skill на основі GitHub зі скануванням `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва tag (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується найновіша версія.
- Soft-deleted версії повертають `410`.
- Передавання skill на основі GitHub не проксіюють і не дзеркалять байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є шлюзом і не входить до метаданих
  payload успішної відповіді.
- Статистика завантажень рахується як унікальні ідентичності за день UTC (`userId`, коли API-токен дійсний, інакше IP).

## Кінцеві точки автентифікації (Bearer token)

Усі кінцеві точки потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blobs `files[]`.
- JSON body з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, API розв’язує цього
  видавця на боці сервера й вимагає, щоб actor мав доступ видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявна
  skill може перейти до цього власника, якщо actor є адміністратором/власником і в
  поточному, і в цільовому видавцях. Без цього opt-in зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потрібна автентифікація Bearer token.
- Потрібен `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blobs `files` або одне посилання на tarball
  `clawpack`. `clawpack` може бути blob `.tgz` або storage id, повернутим
  upload-url flow. Staged публікації storage-id також повинні містити
  `clawpackUploadTicket`, повернений із цим upload URL.
- Використовуйте або `files`, або `clawpack`, ніколи обидва в одному запиті.
- JSON bodies і надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18MB. Tarball ClawPack можуть
  використовувати upload-url flow до ліміту tarball 120MB.
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основне про валідацію:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` повинні
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих source repo, метаданих source commit,
  метаданих config schema, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише видавець org `openclaw` і персональні видавці поточних учасників org `openclaw`
  можуть публікувати в канал `official`.
- Публікації від імені іншого власника все одно перевіряють придатність official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / відновлення skill (власник, модератор або адміністратор).

Необов’язковий JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Якщо `reason` присутнє, воно зберігається як примітка модерації skill і копіюється в журнал аудиту.
Soft delete, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь delete містить `slugReservedUntil`, коли застосовується цей строк дії.
Приховування модератором/адміністратором і вилучення з міркувань безпеки не завершуються таким чином.

Відповідь delete:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди стану:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/user not found
- `500`: internal server error

### `POST /api/v1/users/publisher`

Лише для адміністраторів. Забезпечує існування org-видавця для handle. Якщо handle все ще вказує на
застарілого спільного користувача/персонального видавця, кінцева точка спочатку мігрує його в org-видавця.
Для новоствореної org надайте `memberHandle`; поточний адміністратор не додається як учасник.
`memberRole` типово має значення `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане self-serve створення org-видавця. Створює нового org-видавця й додає
викликача як owner. Ця кінцева точка не мігрує наявні user/personal handles і не
позначає видавця як trusted/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle уже використовується видавцем, користувачем або персональним видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністраторів. Резервує кореневі slugs і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними пакетами-заповнювачами без рядків релізів, тому той самий
власник зможе пізніше опублікувати реальний реліз code-plugin або bundle-plugin під цією назвою.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністраторів. Відновлює персонального видавця для перевіреного замінного GitHub OAuth principal
без редагування рядків облікового запису Convex Auth. Запит має назвати обидва immutable GitHub
provider account ids; mutable handles використовуються лише як guard для оператора.

Кінцева точка за замовчуванням працює в режимі пробного запуску. Застосування відновлення потребує `dryRun: false` і
`confirmIdentityVerified: true` після того, як персонал незалежно перевірить безперервність між обома
суб’єктами GitHub. Відновлення завершується закритою відмовою, якщо поточний особистий
видавець цільового користувача має skills, packages або джерела GitHub skill.
Відновлення також мігрує застарілі поля `ownerUserId` для skills відновленого видавця,
псевдонімів slug skill, packages, попереджень інспектора package і похідних рядків пошукового digest, щоб
шляхи прямого власника узгоджувалися з новим повноваженням видавця. Активне резервування захищеного handle
для відновленого handle також перепризначається користувачу-замінику, щоб подальша
синхронізація профілю не могла відновити конкуруюче повноваження попереднього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спершу використовувати відновлювану міграцію власника.
Джерела GitHub skill мають область дії видавця та позначаються як перевірені, а не переписуються.

- Тіло: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Відповідь: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Кінцеві точки керування slug власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидві кінцеві точки потребують автентифікації API-токеном і працюють лише для власника skill.
- `rename` зберігає попередній slug як псевдонім переспрямування.
- `merge` приховує вихідний запис і переспрямовує вихідний slug до цільового запису.

### Кінцеві точки передавання власності

- `POST /api/v1/skills/{slug}/transfer`
  - Тіло: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Відповідь: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Відповідь (прийняти/відхилити/скасувати): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма відповіді: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Заблокувати користувача й остаточно видалити належні йому skills (лише модератор/адміністратор).

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

Розблокувати користувача й відновити придатні skills (лише адміністратор).

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

Змінити збережену причину наявного блокування без розблокування або відновлення
контенту (лише адміністратор). За замовчуванням використовується пробний запуск, якщо `dryRun` не дорівнює `false`.

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

Перелічити або знайти користувачів (лише адміністратор).

Параметри запиту:

- `q` (необов’язково): пошуковий запит
- `query` (необов’язково): псевдонім для `q`
- `limit` (необов’язково): максимальна кількість результатів (за замовчуванням 20, максимум 200)

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

Додати/видалити зірку (виділення). Обидві кінцеві точки ідемпотентні.

Відповіді:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Застарілі кінцеві точки CLI (припиняються)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Див. `DEPRECATIONS.md` щодо плану видалення.

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації package,
які готують tarball ClawPack, мають надіслати отриманий ідентифікатор сховища як
`clawpack`, а повернений квиток як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви самостійно розгортаєте сервіс, надайте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
