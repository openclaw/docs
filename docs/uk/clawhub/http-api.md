---
read_when:
    - Додавання/зміна кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні + CLI-ендпоїнти + автентифікація).
x-i18n:
    generated_at: "2026-07-03T01:02:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (типово).

Усі шляхи v1 розміщені під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб виводити список Skills ClawHub або шукати їх. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного запису ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся віддзеркалювати прихований, приватний або заблокований модерацією вміст поза поверхнею публічного API.

Веб-скорочення slug розв’язуються між сімействами реєстру, але клієнти API мають використовувати
канонічні URL-адреси, повернуті кінцевими точками читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується для кожної IP-адреси.
- Автентифіковані запити (дійсний токен Bearer): застосовується для кошика користувача.
- Якщо токен відсутній або недійсний, поведінка повертається до застосування за IP-адресою.
- Автентифіковані кінцеві точки запису не мають повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/заблоковані/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли повідомити користувачам, що їх заблокувало.

- Читання: 3000/хв на IP-адресу, 12000/хв на ключ
- Запис: 300/хв на IP-адресу, 3000/хв на ключ
- Завантаження: 1200/хв на IP-адресу, 6000/хв на ключ (кінцеві точки завантаження)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизовано: `RateLimit-Limit`, `RateLimit-Reset`
- На `429`: `X-RateLimit-Remaining: 0` і `RateLimit-Remaining: 0`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди епохи Unix
- `RateLimit-Reset`: секунди до скидання (затримка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишковий бюджет, коли наявний.
  Шардовані успішні запити пропускають цей заголовок замість повернення приблизного глобального значення.
- `Retry-After`: скільки секунд чекати перед повторною спробою (затримка) на `429`

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

Настанови для клієнта:

- Якщо `Retry-After` існує, зачекайте вказану кількість секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть з `X-RateLimit-Reset`).

Джерело IP:

- Використовує довірені заголовки IP клієнта, зокрема `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені переслані заголовки.
- ClawHub використовує довірені пересилальні заголовки для ідентифікації IP-адрес клієнтів на edge.
- Якщо довірена IP-адреса клієнта недоступна, анонімні запити використовують резервні кошики,
  обмежені лише типом обмеження частоти. Ці резервні кошики не включають
  надані викликачем шляхи, slugs, назви пакетів, версії, рядки запиту чи інші
  параметри артефактів.

## Відповіді з помилками

Публічні відповіді з помилками v1 є звичайним текстом із `content-type: text/plain; charset=utf-8`.
Це включає помилки валідації (`400`), відсутні публічні ресурси (`404`), збої автентифікації та
дозволів (`401`/`403`), обмеження частоти (`429`) і заблоковані завантаження. Клієнти
мають читати тіло відповіді як зрозумілий для людини рядок. Невідомі параметри запиту
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

- Результати повертаються в порядку релевантності (подібність embedding + підсилення точних токенів slug/назви + невеликий попередній коефіцієнт популярності).
- Релевантність сильніша за популярність. Точний збіг токена slug або відображуваної назви може ранжуватися вище за слабший збіг із набагато сильнішою залученістю.
- ASCII-текст токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно й обмежується. Skills із високою залученістю можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може вилучити Skill із публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Настанови щодо виявлюваності для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у відображувану назву, підсумок і теги. Використовуйте окремий токен slug лише тоді, коли він також є стабільною ідентичністю, яку ви хочете зберегти.
- Не перейменовуйте slug лише для того, щоб наздогнати один запит, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slugs стають псевдонімами перенаправлення, але канонічна URL-адреса, відображуваний slug і майбутні дайджести пошуку використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес та встановлень, які розв’язуються через реєстр, але ранжування пошуку базується на канонічних метаданих Skill після індексації перейменування. Наявна статистика залишається зі Skill.
- Якщо Skill несподівано невидимий, спочатку перевірте стан модерації за допомогою `clawhub inspect @owner/slug` після входу, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язково): ціле число (1–200)
- `cursor` (необов’язково): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язково): `updated` (типово), `recommended` (псевдонім: `default`), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), застарілі псевдоніми встановлень `installsCurrent`/`installs`/`installsAllTime` зіставляються з `downloads`, `trending`
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язково): застарілий псевдонім для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали залученості та нещодавності.
- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових Skills; `updated` змінюється, коли наявні Skills публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора можуть повертати менше ніж `limit` елементів на сторінці, бо підозрілі Skills фільтруються після отримання сторінки.
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

- Старі slugs, створені потоками перейменування/об’єднання власника, розв’язуються до канонічного Skill.
- `metadata.os`: обмеження ОС, оголошені у frontmatter Skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цільові системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` є `null`, якщо Skill не має метаданих платформи.
- `moderation` включається лише тоді, коли Skill позначено або його переглядає власник.

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

- Власники та модератори можуть отримувати доступ до деталей модерації для прихованих Skills.
- Публічні викликачі отримують `200` лише для вже позначених видимих Skills.
- Докази редагуються для публічних викликачів і містять сирі фрагменти лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Повідомте про Skill для перегляду модератором. Звіти діють на рівні Skill, необов’язково пов’язані
з версією, і потрапляють до черги звітів про Skill.

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

Кінцева точка модератора/адміністратора для приймання звітів про Skills.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `confirmed`, `dismissed` або `all`
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

Кінцева точка модератора/адміністратора для розв’язання або повторного відкриття звітів про Skills.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов’язковий для `confirmed` і `dismissed`; його можна пропустити під час
повернення `status` до `open`. Передайте `finalAction: "hide"` з розібраним
звітом, щоб приховати Skill у тому самому придатному для аудиту робочому процесі.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` містить нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки сканування безпеки для версії Skill.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати позначену тегом версію (наприклад, `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки та деталі, специфічні для сканера.
- `security.hasScanResult` має значення `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні skill, отриманий із найновішої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж розглядати `moderation` і `security` як один і той самий контекст версії.

### `POST /api/v1/skills/-/scan`

Автентифікована кінцева точка надсилання для нових завдань ClawScan.

Сканування локальних завантажень більше не підтримується. Запити з використанням
`multipart/form-data` або `{ "source": { "kind": "upload" } }` повертають `410`.

Опубліковані сканування використовують JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примітки:

- Корисні навантаження запитів сканування та звіти для завантаження видаляються зі сховища scan-request після завершення періоду зберігання.
- Опубліковані сканування потребують управлінського доступу власника/видавця або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записуються назад лише тоді, коли `update: true` і сканування завершується успішно.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування є асинхронними. Ручні запити сканування мають пріоритет перед звичайною роботою публікації/зворотного заповнення, але завершення все одно залежить від доступності воркерів.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікована кінцева точка опитування для надісланого сканування.

- Повертає статус queued/running/succeeded/failed.
- Повертає `queue.queuedAhead` і `queue.position`, поки запит у черзі, щоб клієнти могли показати, скільки пріоритетних ручних сканувань стоїть попереду цього запиту. Дуже великі черги обмежуються й повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікована кінцева точка архіву звіту.

- Потребує успішного сканування; не термінальні сканування повертають `409`.
- Повертає ZIP із `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікована кінцева точка архіву збереженого звіту для надісланих версій.

- Потребує управлінського доступу власника/видавця до skill або Plugin, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точної надісланої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань Plugin/пакетів.
- Повертає ту саму форму ZIP, що й завантаження scan-request.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму форму корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакета лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки Skill Card, який використовується `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): визначити позначену тегом версію (наприклад, `latest`).

Примітки:

- `ok` має значення `true` лише тоді, коли вибрана версія має згенеровану Skill Card, не заблокована модерацією як malware, і перевірка ClawScan чиста.
- Ідентичність skill, ідентичність видавця та метадані вибраної версії є полями верхнього рівня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб shell-автоматизація могла читати їх без розпакування вкладених обгорток.
- `security` — це вердикт ClawScan/security верхнього рівня. Автоматизація має спиратися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканерів, як-от `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей виведено з експлуатації, і цей ключ завжди має значення `null`.
- `provenance` має значення `server-resolved-github-import` лише тоді, коли ClawHub визначив і зберіг GitHub repo/ref/commit/path під час публікації або імпорту; інакше має значення `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Повертає поточні компактні вердикти безпеки для точних версій skill. Ця
кінцева точка колекції призначена для клієнтів, які вже знають, які встановлені
версії ClawHub skill їм потрібно відобразити, наприклад OpenClaw Control UI.

Запит:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примітки:

- `items` має містити 1-100 унікальних пар `{ slug, version }`.
- Результати надаються для кожного елемента; один відсутній skill або версія не призводить до помилки всієї відповіді.
- Відповідь стосується лише безпеки. Вона не містить даних Skill Card, статусу згенерованої картки, списків файлів артефактів або докладних корисних навантажень сканерів.
- `security.signals` містить лише допоміжні докази рівня статусу; використовуйте `/scan` або сторінку security-audit ClawHub для повних деталей сканера.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей виведено з експлуатації, і цей ключ завжди має значення `null`.
- Відсутність Skill Card не впливає на `ok`, `decision` або `reasons` цієї кінцевої точки; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли вам потрібен конверт перевірки Skill Card для одного skill, `/card`, коли вам потрібен згенерований markdown картки, і `/scan`, коли вам потрібні докладні дані сканера.

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

- `path` (обов’язковий)
- `version` (необов’язковий)
- `tag` (необов’язковий)

Примітки:

- За замовчуванням використовується остання версія.
- Обмеження розміру файлу: 200KB.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- skills
- code plugins
- bundle plugins

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `updated` (за замовчуванням), `recommended`, `trending`, `downloads`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії plugin. Підтримується лише коли
  запит обмежено пакетами plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Керовані категорії та
  застарілі псевдоніми фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованим сімейством.
- Записи Skills і надалі підтримуються реєстром Skills, і їх усе ще можна публікувати лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` усе ще призначений лише для випусків code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі Skills + пакетів plugin.

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1–100)
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії plugin. Підтримується лише коли
  запит обмежено пакетами plugin. Керовані категорії та застарілі псевдоніми
  фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured` або
  `highlightedOnly` повертають `400`. Невідомі параметри запиту ігноруються.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/plugins`

Перегляд каталогу лише Plugin серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `recommended` (за замовчуванням), `trending`, `downloads`, `updated`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі псевдоніми фільтрів v1 і надалі приймаються на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` зіставляються з `tools`.
- `observability` і `deployment` зіставляються з `gateway`.
- `dev-tools` зіставляється з `runtime`.

`trending` — це рейтинг встановлень/завантажень за сім днів, і він не використовує загальні показники за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` він стосується лише plugin; використовуйте
`/api/v1/skills?sort=trending` для каталогу Skills.

Застарілі псевдоніми не приймаються як збережені або оголошені автором значення категорії.

### `GET /api/v1/skills/export`

Масовий експорт останніх публічних Skills для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа в мілісекундах Unix для `updatedAt` Skills.
- `endDate` (обов’язковий): верхня межа в мілісекундах Unix для `updatedAt` Skills.
- `limit` (необов’язковий): ціле число (1-250), за замовчуванням `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований Skill має корінь у `{publisher}/{slug}/`.
- Розміщені Skills містять файли останньої збереженої версії та перелічені в
  `_manifest.json` з `sourceRef: "public-clawhub"`.
- Поточні Skills на базі GitHub зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` з `sourceRef: "public-github"`, репозиторій, коміт, шлях,
  хеш вмісту й URL архіву. Вони не містять вихідних файлів, розміщених у ClawHub.
- Кожен Skill містить `_export_skill_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включено, коли окремі Skills або файли не вдалося
  експортувати.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Масовий експорт останніх публічних релізів Plugin для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа Unix у мілісекундах для `updatedAt` Plugin.
- `endDate` (обов’язковий): верхня межа Unix у мілісекундах для `updatedAt` Plugin.
- `limit` (необов’язковий): ціле число (1-250), стандартно `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.
- `family` (необов’язковий): `code-plugin` або `bundle-plugin`. Якщо пропущено, означає обидві
  родини Plugin.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований Plugin має корінь у `{family}/{packageName}/`.
- Кожен експортований Plugin містить збережені файли останнього релізу.
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

- Застарілі псевдоніми фільтрів v1, задокументовані в `GET /api/v1/plugins`, також
  приймаються.
- Фільтрація за категорією є справжнім API-фільтром, що спирається на рядки дайджесту категорій Plugin,
  а не переписуванням пошукового запиту.
- Результати повертаються в порядку релевантності й наразі не підтримують пагінацію.
- Елементи керування сортуванням у браузерному UI для пошуку Plugin перевпорядковують завантажені результати за релевантністю,
  відповідаючи поточній поведінці перегляду `/skills`.

### `GET /api/v1/packages/{name}`

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета та всіх релізів.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора видавця організації,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, включно з метаданими файлів, сумісністю,
верифікацією, метаданими артефакту та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для пакетних архівів старого формату або
  `npm-pack` для релізів на базі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` — застарілі метадані сумісності для старих клієнтів. Він
  хешує точні байти ZIP, повернуті `/api/v1/packages/{name}/download`.
  Сучасним клієнтам слід використовувати `version.artifact.sha256`, який ідентифікує
  канонічний артефакт релізу.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan`
  включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точний підсумок безпеки й довіри релізу пакета для клієнтів
встановлення. Це публічна поверхня споживання OpenClaw для визначення, чи можна
встановлювати розв’язаний реліз.

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
  артефакту релізу.
- `trust.scanStatus` — ефективний статус довіри, виведений із вхідних даних сканерів
  і ручної модерації релізу.
- `trust.moderationState` може бути null. Він дорівнює `null`, коли немає ручної
  модерації релізу.
- `trust.blockedFromDownload` — сигнал блокування встановлення. OpenClaw та інші
  клієнти встановлення мають блокувати встановлення, коли це значення дорівнює `true`, замість
  повторного виведення правил блокування з полів сканера або модерації.
- `trust.reasons` — список пояснень для користувача й аудиту. Коди причин
  є стабільними компактними рядками, як-от `manual:quarantined`, `scan:malicious`
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри все ще очікують завершення.
- `trust.stale` означає, що підсумок довіри було обчислено із застарілих вхідних даних і
  перед рішенням про дозвіл із високою впевненістю його слід розглядати як такий, що потребує оновлення.

Примітки:

- Ця кінцева точка прив’язана до точної версії. Клієнти мають викликати її після розв’язання
  версії пакета, яку вони мають намір встановити, а не лише після читання останніх
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації для власників/модераторів.
  Вона розкриває рішення щодо встановлення та публічне пояснення, а не
  особи репортерів, тіла звітів, приватні докази чи внутрішні часові лінії
  перевірки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані резолвера артефакту для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і застарілу URL сумісності ZIP.
- Це поверхня резолвера OpenClaw; вона уникає вгадування формату архіву зі
  спільної URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях резолвера.

Примітки:

- Версії ClawPack потоково передають точні завантажені байти npm-pack `.tgz`.
- Застарілі ZIP-версії перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик ліміту швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність останньої версії
- доступність артефакту ClawPack npm-pack
- дайджест артефакту
- походження репозиторію джерела та коміту
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
  `all` (стандартно).
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

Адміністративна кінцева точка для створення або оновлення рядка міграції офіційного Plugin.

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

- `bundledPluginId` нормалізується до нижнього регістру і є стабільним ключем upsert.
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутнім для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Воно не змінює OpenClaw і не генерує
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язковий): `open` (стандартно), `blocked`, `manual` або `all`
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, поміщені в карантин, відкликані або повідомлені релізи.
- `blocked`: поміщені в карантин, відкликані або шкідливі релізи.
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

Повідомити про пакет для перевірки модератором. Звіти мають рівень пакета й необов’язково
пов’язуються з версією. Вони потрапляють до черги модерації, але самі собою не приховують автоматично
і не блокують завантаження; модераторам слід використовувати модерацію релізів, щоб
схвалювати, поміщати в карантин або відкликати артефакти.

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

- `status` (необов’язково): `open` (за замовчуванням), `confirmed`, `dismissed` або `all`
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

- Потрібен API-токен власника пакета, учасника-видавця, модератора або
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

`note` обов’язковий для `confirmed` і `dismissed`; його можна пропустити під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію релізу в тому
самому контрольованому робочому процесі.

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

- `approved`: перевірено вручну й дозволено.
- `quarantined`: заблоковано до подальшої перевірки.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Ізольовані та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис журналу аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає сирий текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Використовує ліміт швидкості читання, а не ліміт завантаження.
- Бінарні файли повертають `415`.
- Обмеження розміру файлу: 200 КБ.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть бути приховані в інших місцях.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Skills переспрямовують на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише з реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів на основі ClawPack.

Примітки:

- У списку є лише версії із завантаженими tarball-файлами ClawPack npm-pack.
- Застарілі версії лише ZIP навмисно пропущено.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument scoped-пакетів підтримує як `/api/npm/@scope/name`, так і
  закодований шлях запиту npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball-файлу ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує ліміт швидкості завантаження.
- Заголовки завантаження містять ClawHub SHA-256, а також метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний hex sha256 відбитка бандла

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії skill або повертає передачу до джерела GitHub для
поточної skill на основі GitHub зі скануванням `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- М’яко видалені версії повертають `410`.
- Передачі skills на основі GitHub не проксіюють і не дзеркалять байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є шлюзом і не включається як метадані
  успішного payload.
- Статистика завантажень рахується як унікальні ідентичності за UTC-день (`userId`, коли API-токен дійсний, інакше IP).

## Кінцеві точки автентифікації (Bearer-токен)

Усі кінцеві точки потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob-файлами `files[]`.
- JSON body з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Коли воно присутнє, API розв’язує цього
  видавця на сервері та вимагає від актора доступу до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` разом із `ownerHandle`,
  наявна skill може перейти до цього власника, якщо актор є адміністратором/власником і в
  поточного, і в цільового видавця. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потребує автентифікації Bearer-токеном.
- Потребує `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blob-файли `files` або одне посилання на
  tarball `clawpack`. `clawpack` може бути blob `.tgz` або storage id, повернений
  потоком upload-url. Публікації зі staged storage-id також мають містити
  `clawpackUploadTicket`, повернений із цим URL завантаження.
- Використовуйте або `files`, або `clawpack`, але ніколи обидва в одному запиті.
- JSON bodies і надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18 МБ. Tarball-файли ClawPack можуть
  використовувати потік upload-url до ліміту tarball 120 МБ.
- Необов’язкове поле payload: `ownerHandle`. Коли воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих коміту
  джерела, метаданих схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише видавець org `openclaw` і особисті видавці поточних учасників org `openclaw`
  можуть публікувати в канал `official`.
- Публікації від імені іншого власника все одно перевіряють право на official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М’яко видаляє / відновлює skill (власник, модератор або адміністратор).

Необов’язкове JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли присутній, `reason` зберігається як примітка модерації skill і копіюється в журнал аудиту.
М’які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може забрати
інший видавець. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк дії.
Приховування модератором/адміністратором і видалення з міркувань безпеки не спливають у такий спосіб.

Відповідь видалення:

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

Лише для адміністратора. Забезпечує існування org-видавця для handle. Якщо handle досі вказує на
застарілого спільного користувача/особистого видавця, кінцева точка спершу мігрує його в org-видавця.
Для новоствореної org надайте `memberHandle`; чинний адміністратор не додається як учасник.
`memberRole` за замовчуванням дорівнює `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане самообслуговуване створення org-видавця. Створює нового org-видавця й додає
викликача як власника. Ця кінцева точка не мігрує наявні користувацькі/особисті handles і не
позначає видавця як довіреного/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle вже використовується видавцем, користувачем або особистим видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slugs і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними пакетами-заповнювачами без рядків релізів, тож той самий
власник пізніше може опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністратора. Відновлює особистого видавця для перевіреного замінного principal GitHub OAuth
без редагування рядків облікових записів Convex Auth. Запит має називати обидва незмінні
ідентифікатори облікового запису GitHub provider; змінні handles використовуються лише як захист, видимий оператору.

Кінцева точка типово працює в режимі пробного запуску. Застосування відновлення вимагає `dryRun: false` і
`confirmIdentityVerified: true` після того, як персонал незалежно підтвердить безперервність між обома
суб’єктами GitHub. Відновлення завершується закритою відмовою, якщо поточний особистий
видавець користувача призначення має skills, packages або джерела GitHub skill.
Відновлення також мігрує застарілі поля `ownerUserId` для skills відновленого видавця,
псевдонімів slug skill, packages, попереджень інспектора package і похідних рядків пошукового дайджеста, щоб
шляхи прямого власника узгоджувалися з новими повноваженнями видавця. Активне резервування захищеного handle
для відновленого handle також перепризначається користувачу-заміні, щоб пізніша
синхронізація профілю не могла відновити конкуруючі повноваження попереднього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спершу використати відновлювану міграцію власника.
Джерела GitHub skill мають область дії видавця й повідомляються як перевірені, а не переписані.

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

- Обидві кінцеві точки вимагають автентифікації API-токеном і працюють лише для власника skill.
- `rename` зберігає попередній slug як псевдонім перенаправлення.
- `merge` приховує вихідний список і перенаправляє вихідний slug до цільового списку.

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

Заборонити користувача й остаточно видалити належні йому skills (лише модератор/адміністратор).

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

Зняти заборону з користувача й відновити придатні skills (лише адміністратор).

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

Змінити збережену причину наявної заборони без зняття заборони чи відновлення
вмісту (лише адміністратор). Типово використовується пробний запуск, якщо `dryRun` не дорівнює `false`.

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
- `limit` (необов’язково): максимальна кількість результатів (типово 20, максимум 200)

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

## Застарілі кінцеві точки CLI (нерекомендовані)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

План видалення див. у `DEPRECATIONS.md`.

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації package,
які розміщують tarball ClawPack, мають надіслати отриманий ідентифікатор сховища як
`clawpack`, а повернений ticket як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви розгортаєте власний хостинг, обслуговуйте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
