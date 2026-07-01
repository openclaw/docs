---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-07-01T15:30:00Z"
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

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб перелічувати або шукати Skills ClawHub. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного списку ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub підтримує сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза публічною поверхнею API.

Скорочення web slug розв’язуються між сімействами реєстру, але клієнти API мають використовувати
канонічні URL-адреси, повернуті кінцевими точками читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується за IP.
- Автентифіковані запити (дійсний Bearer token): застосовується за кошиком користувача.
- Якщо token відсутній або недійсний, поведінка повертається до застосування за IP.
- Автентифіковані кінцеві точки запису не мають повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні tokens, недійсні/відкликані tokens і
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли пояснити користувачам, що їх заблокувало.

- Читання: 3000/хв на IP, 12000/хв на key
- Запис: 300/хв на IP, 3000/хв на key
- Завантаження: 1200/хв на IP, 6000/хв на key (кінцеві точки завантаження)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизовано: `RateLimit-Limit`, `RateLimit-Reset`
- На `429`: `X-RateLimit-Remaining: 0` і `RateLimit-Remaining: 0`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди епохи Unix
- `RateLimit-Reset`: секунди до скидання (затримка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок бюджету, коли присутній.
  Успішні шардинговані запити пропускають цей заголовок замість повернення приблизного глобального значення.
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
- Використовуйте backoff із jitter, щоб уникати синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP:

- Використовує довірені заголовки IP клієнта, зокрема `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені forwarded headers.
- ClawHub використовує довірені forwarding headers, щоб ідентифікувати IP клієнтів на edge.
- Якщо довірений IP клієнта недоступний, анонімні запити використовують fallback buckets,
  обмежені лише видом rate-limit. Ці fallback buckets не включають
  надані викликачем paths, slugs, package names, versions, query strings або інші
  параметри артефактів.

## Відповіді з помилками

Публічні відповіді з помилками v1 є простим текстом із `content-type: text/plain; charset=utf-8`.
Це включає помилки валідації (`400`), відсутні публічні ресурси (`404`), помилки автентифікації та
дозволів (`401`/`403`), обмеження частоти (`429`) і заблоковані завантаження. Клієнти
мають читати тіло відповіді як зрозумілий людині рядок. Невідомі параметри запиту
ігноруються для сумісності, але розпізнані параметри запиту з недійсними значеннями повертають
`400`.

## Публічні кінцеві точки (без auth)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число
- `highlightedOnly` (необов’язково): `true`, щоб фільтрувати до виділених Skills
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язково): застарілий alias для `nonSuspiciousOnly`

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

- Результати повертаються в порядку релевантності (embedding similarity + exact slug/name token boosts + невеликий popularity prior).
- Релевантність сильніша за популярність. Точний збіг slug або display-name token може випередити менш точний збіг із набагато сильнішим engagement.
- ASCII text токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий `map` token, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно й обмежується. Skills із високим engagement можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може прибрати Skill із публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Рекомендації щодо видимості для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у display name, summary і tags. Використовуйте окремий slug token лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slugs стають redirect aliases, але канонічна URL-адреса, відображений slug і майбутні search digests використовують новий slug.
- Rename aliases зберігають розв’язання для старих URL-адрес та інсталяцій, які розв’язуються через реєстр, але пошукове ранжування базується на канонічних метаданих Skill після індексації перейменування. Наявна статистика залишається зі Skill.
- Якщо Skill несподівано невидимий, спочатку перевірте стан модерації за допомогою `clawhub inspect @owner/slug`, увійшовши в систему, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язково): ціле число (1–200)
- `cursor` (необов’язково): cursor пагінації для будь-якого сортування не `trending`
- `sort` (необов’язково): `updated` (типово), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), застарілі install aliases `installsCurrent`/`installs`/`installsAllTime` мапляться на `downloads`, `trending`
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язково): застарілий alias для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали engagement і recency.
- `trending` ранжує за інсталяціями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для crawls нових Skills; `updated` змінюється, коли наявні Skills публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі cursor може повертати менше ніж `limit` елементів на сторінці, бо підозрілі Skills фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити пагінацію, коли він присутній. Коротка сторінка сама по собі не означає кінець результатів.

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

- Старі slugs, створені flows перейменування/злиття власника, розв’язуються до канонічного Skill.
- `metadata.os`: обмеження OS, оголошені у frontmatter Skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: Nix system targets (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо Skill не має метаданих платформи.
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

- Власники й модератори можуть отримувати доступ до деталей модерації для прихованих Skills.
- Публічні викликачі отримують `200` лише для вже позначених видимих Skills.
- Evidence редагується для публічних викликачів і містить raw snippets лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Повідомити про Skill для перевірки модератором. Звіти є на рівні Skill, необов’язково пов’язані
з версією, і потрапляють у чергу звітів про Skill.

Auth:

- Потребує API token.

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

Кінцева точка модератора/admin для приймання звітів про Skill.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `confirmed`, `dismissed` або `all`
- `limit` (необов’язково): ціле число (1-200)
- `cursor` (необов’язково): cursor пагінації

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

Кінцева точка модератора/admin для вирішення або повторного відкриття звітів про Skill.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` потрібен для `confirmed` і `dismissed`; його можна пропустити під час
встановлення `status` назад на `open`. Передайте `finalAction: "hide"` з triaged
report, щоб приховати Skill у тому самому придатному для аудиту workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): cursor пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список files.

- `version.security` включає нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки security scan для версії Skill.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати tagged version (наприклад, `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки, а також деталі, специфічні для сканера.
- `security.hasScanResult` дорівнює `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні навички, отриманий з найновішої версії.
- Під час запиту історичної версії перевіряйте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж вважати `moderation` і `security` контекстом тієї самої версії.

### `POST /api/v1/skills/-/scan`

Автентифікований endpoint подання для нових завдань ClawScan.

Локальні сканування завантажених файлів більше не підтримуються. Запити з
`multipart/form-data` або `{ "source": { "kind": "upload" } }` повертають `410`.

Опубліковані сканування використовують JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примітки:

- Корисні навантаження запитів на сканування та звіти для завантаження видаляються зі сховища запитів на сканування після завершення періоду зберігання.
- Опубліковані сканування потребують доступу до керування власника/видавця або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записують результати назад лише коли `update: true` і сканування успішно завершується.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування асинхронні. Ручні запити на сканування мають вищий пріоритет за звичайну роботу публікації/зворотного заповнення, але завершення все одно залежить від доступності воркерів.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікований endpoint опитування для поданого сканування.

- Повертає статус queued/running/succeeded/failed.
- Повертає `queue.queuedAhead` і `queue.position`, доки запит у черзі, щоб клієнти могли показати, скільки пріоритезованих ручних сканувань попереду цього запиту. Дуже великі черги обмежуються й повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікований endpoint архіву звіту.

- Потребує успішно завершеного сканування; незавершені сканування повертають `409`.
- Повертає ZIP із `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікований endpoint архіву збереженого звіту для поданих версій.

- Потребує доступу до керування власника/видавця для навички або plugin, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точно поданої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань plugin/пакетів.
- Повертає ту саму форму ZIP, що й завантаження запитів на сканування.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму форму корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакетного завдання лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки картки навички, який використовується `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): визначити версію з тегом (наприклад, `latest`).

Примітки:

- `ok` дорівнює `true` лише тоді, коли вибрана версія має згенеровану картку навички, не заблокована модерацією як шкідливе ПЗ, а перевірка ClawScan є чистою.
- Ідентичність навички, ідентичність видавця та метадані вибраної версії є полями верхнього рівня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб shell-автоматизація могла читати їх без розпакування вкладених обгорток.
- `security` — це вердикт ClawScan/security верхнього рівня. Автоматизація має орієнтуватися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканерів, як-от `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей вилучено, і цей ключ завжди дорівнює `null`.
- `provenance` дорівнює `server-resolved-github-import` лише тоді, коли ClawHub визначив і зберіг GitHub репозиторій/ref/commit/path під час публікації або імпорту; інакше він дорівнює `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Повертає поточні компактні вердикти безпеки для точних версій навичок. Цей
endpoint колекції призначений для клієнтів, які вже знають, які встановлені
версії навичок ClawHub їм потрібно відображати, наприклад OpenClaw Control UI.

Запит:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примітки:

- `items` має містити 1-100 унікальних пар `{ slug, version }`.
- Результати надаються для кожного елемента; одна відсутня навичка або версія не призводить до невдачі всієї відповіді.
- Відповідь містить лише дані безпеки. Вона не містить даних картки навички, статусу згенерованої картки, списків файлів артефактів або докладних корисних навантажень сканерів.
- `security.signals` містить лише допоміжні докази на рівні статусу; використовуйте `/scan` або сторінку аудиту безпеки ClawHub для повних деталей сканерів.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей вилучено, і цей ключ завжди дорівнює `null`.
- Відсутність картки навички не впливає на `ok`, `decision` або `reasons` цього endpoint; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли вам потрібен конверт перевірки картки однієї навички, `/card`, коли вам потрібен згенерований markdown картки, і `/scan`, коли вам потрібні докладні дані сканера.

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

- Типово використовується найновіша версія.
- Обмеження розміру файлу: 200KB.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- Skills
- кодових Plugin
- пакетних Plugin

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `updated` (типово), `recommended`, `trending`, `downloads`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії Plugin. Підтримується лише коли
  запит обмежено пакетами Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Керовані категорії та
  застарілі псевдоніми фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованою родиною.
- Записи Skills залишаються прив’язаними до реєстру Skills і все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` все ще призначено лише для випусків code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі серед Skills + пакетів Plugin.

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1–100)
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії Plugin. Підтримується лише коли
  запит обмежено пакетами Plugin. Керовані категорії та застарілі псевдоніми
  фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

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
- `sort` (необов’язковий): `recommended` (типово), `trending`, `downloads`, `updated`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії Plugin. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі псевдоніми фільтрів v1 залишаються прийнятними на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` перетворюються на `tools`.
- `observability` і `deployment` перетворюються на `gateway`.
- `dev-tools` перетворюється на `runtime`.

`trending` — це семиденна таблиця лідерів установок/завантажень, яка не використовує загальні підсумки за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` вона доступна лише для Plugin; використовуйте
`/api/v1/skills?sort=trending` для каталогу Skills.

Застарілі псевдоніми не приймаються як збережені або оголошені авторами значення категорій.

### `GET /api/v1/skills/export`

Масовий експорт найновіших публічних Skills для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа Unix у мілісекундах для `updatedAt` Skills.
- `endDate` (обов’язковий): верхня межа Unix у мілісекундах для `updatedAt` Skills.
- `limit` (необов’язковий): ціле число (1-250), типово `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований Skill має корінь у `{publisher}/{slug}/`.
- Розміщені Skills містять файли найновішої збереженої версії та перелічені в
  `_manifest.json` із `sourceRef: "public-clawhub"`.
- Поточні Skills, прив’язані до GitHub, зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` із `sourceRef: "public-github"`, репозиторієм, комітом, шляхом,
  хешем вмісту та URL архіву. Вони не містять вихідних файлів, розміщених у ClawHub.
- Кожен Skill містить `_export_skill_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включається, коли окремі Skills або файли не вдалося
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
- `limit` (необов’язковий): ціле число (1-250), типово `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.
- `family` (необов’язковий): `code-plugin` або `bundle-plugin`. Якщо пропущено, це означає обидві
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
- Результати повертаються в порядку релевантності й наразі не мають пагінації.
- Елементи керування сортуванням у браузерному UI для пошуку Plugin перевпорядковують завантажені результати за релевантністю,
  відповідно до поточної поведінки перегляду `/skills`.

### `GET /api/v1/packages/{name}`

Повертає детальні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета та всіх релізів.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора організації-видавця,
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
верифікацією, метаданими артефакта та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого формату або
  `npm-pack` для релізів на основі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` є застарілими метаданими сумісності для старих клієнтів. Воно
  хешує точні байти ZIP, які повертає `/api/v1/packages/{name}/download`.
  Сучасним клієнтам слід використовувати `version.artifact.sha256`, що ідентифікує
  канонічний артефакт релізу.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan`
  включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точне зведення безпеки та довіри для релізу пакета для клієнтів
встановлення. Це публічна поверхня споживання OpenClaw для вирішення, чи можна
встановити розв’язаний реліз.

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
- `trust.scanStatus` є ефективним статусом довіри, отриманим із вхідних даних сканерів
  і ручної модерації релізу.
- `trust.moderationState` може бути null. Він дорівнює `null`, коли ручної модерації релізу
  не існує.
- `trust.blockedFromDownload` є сигналом блокування встановлення. OpenClaw та інші
  клієнти встановлення мають блокувати встановлення, коли це значення дорівнює `true`, замість
  повторного виведення правил блокування з полів сканера або модерації.
- `trust.reasons` є списком пояснень для користувача та аудиту. Коди причин
  є стабільними, компактними рядками, такими як `manual:quarantined`, `scan:malicious`,
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри все ще очікують завершення.
- `trust.stale` означає, що зведення довіри було обчислено із застарілих вхідних даних і
  має розглядатися як таке, що потребує оновлення перед рішенням дозволу з високою впевненістю.

Примітки:

- Ця кінцева точка є точною до версії. Клієнти мають викликати її після розв’язання
  версії пакета, яку вони мають намір встановити, а не лише після читання останніх
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації для власників/модераторів.
  Вона розкриває рішення щодо встановлення та публічне пояснення, а не
  ідентичності репортерів, тіла звітів, приватні докази чи внутрішні часові лінії
  перевірки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані резолвера артефакта для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілу ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і застарілу URL сумісності ZIP.
- Це поверхня резолвера OpenClaw; вона уникає вгадування формату архіву зі
  спільної URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях резолвера.

Примітки:

- Версії ClawPack передають потоком точні завантажені байти npm-pack `.tgz`.
- Застарілі ZIP-версії перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик обмеження частоти завантаження.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність останньої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
- джерельний репозиторій і походження коміту
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

Кінцева точка модератора для переліку офіційних рядків міграції Plugin OpenClaw.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `phase` (необов’язковий): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, або
  `all` (типово).
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

Адміністративна кінцева точка для створення або оновлення офіційного рядка міграції Plugin.

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

- `bundledPluginId` нормалізується до нижнього регістру та є стабільним ключем upsert.
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутнім для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Це не змінює OpenClaw і не генерує
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язковий): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, поміщені в карантин, відкликані або повідомлені релізи.
- `blocked`: поміщені в карантин, відкликані або шкідливі релізи.
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

Повідомити про пакет для перевірки модератором. Звіти мають рівень пакета, необов’язково
пов’язані з версією. Вони подаються в чергу модерації, але самі по собі не приховують автоматично й
не блокують завантаження; модератори мають використовувати модерацію релізів, щоб
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

Ендпойнт модератора/адміністратора для приймання звітів про пакети.

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

Ендпойнт власника/модератора для видимості модерації пакета.

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

Ендпойнт модератора/адміністратора для вирішення або повторного відкриття звітів про пакети.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` потрібен для `confirmed` і `dismissed`; його можна опустити під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію релізу в
тому самому придатному для аудиту робочому процесі.

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

Ендпойнт модератора/адміністратора для перевірки релізу пакета.

Запит:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Підтримувані стани:

- `approved`: перевірено вручну й дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в карантині та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис у журналі аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній реліз.
- Використовує кошик ліміту читання, а не кошик завантажень.
- Двійкові файли повертають `415`.
- Ліміт розміру файлу: 200 КБ.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть бути приховані в інших місцях.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній реліз.
- Skills перенаправляють до `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не передає потоково файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвером.
- Метадані лише реєстру не впроваджуються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає сумісний з npm packument для версій пакетів на базі ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball npm-pack ClawPack.
- Застарілі версії лише ZIP навмисно опущені.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують сумісні з npm
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument пакетів з областю видимості підтримують як `/api/npm/@scope/name`, так і
  закодований шлях запиту npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Передає потоково точні байти завантаженого tarball ClawPack для клієнтів дзеркала npm.

Примітки:

- Використовує кошик ліміту завантажень.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані integrity/shasum npm.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний шістнадцятковий sha256 відбитка пакета

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії skill або повертає передачу на джерело GitHub для
поточного skill на базі GitHub зі скануванням `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тега (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- М’яко видалені версії повертають `410`.
- Передачі skill на базі GitHub не проксіюють і не дзеркалять байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є шлюзом і не включається як метадані
  успішного payload.
- Статистика завантажень рахується як унікальні ідентичності за день UTC (`userId`, коли API-токен дійсний, інакше IP).

## Ендпойнти автентифікації (Bearer-токен)

Усі ендпойнти потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob `files[]`.
- JSON body з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Коли воно присутнє, API розв’язує цього
  видавця на стороні сервера й вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявний
  skill може перейти до цього власника, якщо актор є адміністратором/власником у
  поточного й цільового видавців. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потрібна автентифікація Bearer-токеном.
- Потрібен `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blob `files` або одне посилання на tarball
  `clawpack`. `clawpack` може бути blob `.tgz` або storage id, поверненим потоком
  upload-url. Публікації staged storage-id також мають включати
  `clawpackUploadTicket`, повернений із цією URL-адресою завантаження.
- Використовуйте або `files`, або `clawpack`, але ніколи обидва в одному запиті.
- JSON body і надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18 МБ. Tarball ClawPack можуть
  використовувати потік upload-url до ліміту tarball 120 МБ.
- Необов’язкове поле payload: `ownerHandle`. Коли воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження `.tgz` ClawPack мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих commit джерела,
  метаданих схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише видавець організації `openclaw` і особисті видавці поточних учасників організації `openclaw`
  можуть публікувати в канал `official`.
- Публікації від імені іншого все одно перевіряють право на official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М’яко видаляє / відновлює skill (власник, модератор або адміністратор).

Необов’язковий JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли `reason` присутній, він зберігається як примітка модерації skill і копіюється в журнал аудиту.
М’які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли це завершення строку застосовується.
Приховування модератором/адміністратором і вилучення з міркувань безпеки не спливають у такий спосіб.

Відповідь видалення:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди статусу:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/користувача не знайдено
- `500`: внутрішня помилка сервера

### `POST /api/v1/users/publisher`

Лише для адміністратора. Забезпечує існування видавця організації для handle. Якщо handle все ще вказує на
застарілого спільного користувача/особистого видавця, ендпойнт спершу мігрує його у видавця організації.
Для новоствореної організації надайте `memberHandle`; чинний адміністратор не додається як учасник.
`memberRole` типово має значення `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане self-serve створення видавця організації. Створює нового видавця організації та додає
викликача як власника. Цей ендпойнт не мігрує наявні користувацькі/особисті handle і не
позначає видавця як довіреного/офіційного.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle вже використовується видавцем, користувачем або особистим видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slugs і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними placeholder-пакетами без рядків релізів, тому той самий
власник згодом може опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністратора. Відновлює особистого видавця для перевіреного replacement GitHub OAuth principal
без редагування рядків облікового запису Convex Auth. Запит має називати обидва незмінні ідентифікатори
облікового запису провайдера GitHub; змінні handle використовуються лише як захист, видимий оператору.

Кінцева точка за замовчуванням працює в режимі пробного запуску. Застосування відновлення потребує `dryRun: false` і
`confirmIdentityVerified: true` після того, як персонал незалежно перевірить безперервність між обома
суб'єктами GitHub. Відновлення завершується безпечною відмовою, якщо поточний особистий
видавець користувача призначення має навички, пакети або джерела навичок GitHub.
Відновлення також мігрує застарілі поля `ownerUserId` для навичок відновленого видавця,
псевдонімів слагів навичок, пакетів, попереджень інспектора пакетів і похідних рядків пошукового дайджесту, щоб
шляхи прямого власника узгоджувалися з новими повноваженнями видавця. Активне резервування захищеного handle
для відновленого handle також перепризначається користувачу-заміни, щоб пізніша
синхронізація профілю не могла відновити конкуруючі повноваження попереднього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спершу використовувати відновлювану міграцію власника.
Джерела навичок GitHub мають область дії видавця та повідомляються як перевірені, а не переписуються.

- Тіло: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Відповідь: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Кінцеві точки керування слагами власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидві кінцеві точки вимагають автентифікації за API-токеном і працюють лише для власника навички.
- `rename` зберігає попередній слаг як псевдонім переспрямування.
- `merge` приховує вихідний запис і переспрямовує вихідний слаг до цільового запису.

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

Заблокувати користувача та безповоротно видалити належні йому навички (лише модератор/адміністратор).

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

Розблокувати користувача та відновити відповідні навички (лише адміністратор).

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
вмісту (лише адміністратор). За замовчуванням виконується пробний запуск, якщо `dryRun` не дорівнює `false`.

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

Список або пошук користувачів (лише адміністратор).

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

## Застарілі кінцеві точки CLI (застаріло)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

План вилучення див. у `DEPRECATIONS.md`.

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації пакетів,
які на цьому етапі передають tarball ClawPack, мають надсилати отриманий ідентифікатор сховища як
`clawpack`, а повернений квиток як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, рекомендовано)
- `/.well-known/clawdhub.json` (застаріло)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви розгортаєте самостійно, обслуговуйте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
