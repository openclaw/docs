---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-07-04T04:02:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (типово).

Усі шляхи v1 розташовані під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб показувати список або шукати ClawHub skills. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного запису ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза поверхнею публічного API.

Вебскорочення slug розв'язуються між сімействами реєстру, але клієнти API мають використовувати
канонічні URL-адреси, повернені кінцевими точками читання, замість реконструювання пріоритету
маршрутів.

## Обмеження швидкості

Модель застосування:

- Анонімні запити: застосовується за IP.
- Автентифіковані запити (дійсний Bearer token): застосовується за кошиком користувача.
- Якщо token відсутній або недійсний, поведінка повертається до застосування за IP.
- Автентифіковані кінцеві точки запису не повинні повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні tokens, недійсні/відкликані tokens і
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли повідомити користувачам, що їх заблокувало.

- Читання: 3000/хв на IP, 12000/хв на ключ
- Запис: 300/хв на IP, 3000/хв на ключ
- Завантаження: 1200/хв на IP, 6000/хв на ключ (кінцеві точки завантаження)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизовані: `RateLimit-Limit`, `RateLimit-Reset`
- На `429`: `X-RateLimit-Remaining: 0` і `RateLimit-Remaining: 0`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди епохи Unix
- `RateLimit-Reset`: секунди до скидання (затримка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок бюджету, коли присутній.
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
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть з `X-RateLimit-Reset`).

Джерело IP:

- Використовує довірені заголовки IP клієнта, зокрема `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені переспрямовані заголовки.
- ClawHub використовує довірені forwarding headers для ідентифікації IP клієнтів на edge.
- Якщо довірений IP клієнта недоступний, анонімні запити використовують резервні кошики,
  обмежені лише типом rate-limit. Ці резервні кошики не включають
  надані викликачем шляхи, slugs, назви пакетів, версії, query strings або інші
  параметри артефактів.

## Відповіді з помилками

Публічні відповіді v1 з помилками є plain text з `content-type: text/plain; charset=utf-8`.
Це включає помилки валідації (`400`), відсутні публічні ресурси (`404`), помилки автентифікації та
дозволів (`401`/`403`), обмеження швидкості (`429`) і заблоковані завантаження. Клієнти
мають читати тіло відповіді як зрозумілий людині рядок. Невідомі query parameters
ігноруються для сумісності, але розпізнані query parameters з недійсними значеннями повертають
`400`.

## Публічні кінцеві точки (без auth)

### `GET /api/v1/search`

Query params:

- `q` (обов'язково): рядок запиту
- `limit` (необов'язково): integer
- `highlightedOnly` (необов'язково): `true`, щоб відфільтрувати до highlighted skills
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати suspicious (`flagged.suspicious`) skills
- `nonSuspicious` (необов'язково): застарілий alias для `nonSuspiciousOnly`

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
- Релевантність сильніша за популярність. Точний збіг token у slug або display-name може випередити менш точний збіг із набагато сильнішим engagement.
- Текст ASCII токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий token `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно і має верхню межу. Skills з високим engagement можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Suspicious або hidden moderation state може прибрати skill з публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Рекомендації щодо discoverability для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у display name, summary і tags. Використовуйте окремий slug token лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише для переслідування одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slugs стають redirect aliases, але canonical URL, displayed slug і майбутні search digests використовують новий slug.
- Rename aliases зберігають resolution для старих URL-адрес і встановлень, які розв'язуються через registry, але пошукове ранжування базується на canonical skill metadata після індексації перейменування. Наявна статистика залишається зі skill.
- Якщо skill несподівано невидимий, спочатку перевірте moderation state за допомогою `clawhub inspect @owner/slug` після входу, перш ніж змінювати metadata, пов'язані з ранжуванням.

### `GET /api/v1/skills`

Query params:

- `limit` (необов'язково): integer (1–200)
- `cursor` (необов'язково): pagination cursor для будь-якого сортування не `trending`
- `sort` (необов'язково): `updated` (типово), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), застарілі install aliases `installsCurrent`/`installs`/`installsAllTime` map to `downloads`, `trending`
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати suspicious (`flagged.suspicious`) skills
- `nonSuspicious` (необов'язково): застарілий alias для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали engagement і recency.
- `trending` ранжує за installs за останні 7 днів (на основі telemetry).
- `createdAt` стабільний для обходів new-skill; `updated` змінюється, коли наявні skills публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі cursor можуть повертати менше ніж `limit` елементів на сторінці, оскільки suspicious skills фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити pagination, коли він присутній. Коротка сторінка сама по собі не означає кінець результатів.

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

- Старі slugs, створені потоками owner rename/merge, розв'язуються до canonical skill.
- `metadata.os`: обмеження ОС, оголошені у frontmatter skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цілі систем Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо skill не має platform metadata.
- `moderation` включається лише коли skill позначено або його переглядає owner.

### `GET /api/v1/skills/{slug}/moderation`

Повертає структурований moderation state.

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

- Owners і moderators можуть отримувати доступ до moderation details для hidden skills.
- Публічні викликачі отримують `200` лише для вже flagged visible skills.
- Evidence редагується для публічних викликачів і включає raw snippets лише для owners/moderators.

### `POST /api/v1/skills/{slug}/report`

Повідомити про skill для перегляду модератором. Reports діють на рівні skill, необов'язково пов'язані
з version, і потрапляють до черги skill report.

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

Кінцева точка moderator/admin для приймання skill reports.

Query params:

- `status` (необов'язково): `open` (типово), `confirmed`, `dismissed` або `all`
- `limit` (необов'язково): integer (1-200)
- `cursor` (необов'язково): pagination cursor

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

Кінцева точка moderator/admin для вирішення або повторного відкриття skill reports.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов'язковий для `confirmed` і `dismissed`; його можна пропустити під час
встановлення `status` назад на `open`. Передайте `finalAction: "hide"` із triaged
report, щоб приховати skill у тому самому auditable workflow.

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (необов'язково): integer
- `cursor` (необов'язково): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає version metadata + список files.

- `version.security` включає normalized scan verification status і scanner details
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає security scan verification details для skill version.

Query params:

- `version` (необов'язково): specific version string.
- `tag` (необов'язково): resolve a tagged version (наприклад `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки, а також деталі, специфічні для сканера.
- `security.hasScanResult` має значення `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні навички, отриманий із найновішої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж розглядати `moderation` і `security` як один і той самий контекст версії.

### `POST /api/v1/skills/-/scan`

Автентифікована кінцева точка надсилання для нових завдань ClawScan.

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

- Корисні навантаження запитів сканування та звіти, доступні для завантаження, видаляються зі сховища запитів сканування після завершення періоду зберігання.
- Опубліковані сканування потребують доступу керування власника/видавця або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записуються назад лише тоді, коли `update: true` і сканування успішно завершується.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування є асинхронними. Ручні запити сканування мають пріоритет над звичайною роботою публікації/зворотного заповнення, але завершення все одно залежить від доступності worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікована кінцева точка опитування для надісланого сканування.

- Повертає статус queued/running/succeeded/failed.
- Повертає `queue.queuedAhead` і `queue.position` під час перебування в черзі, щоб клієнти могли показати, скільки пріоритетних ручних сканувань стоять перед запитом. Дуже великі черги обмежуються та повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікована кінцева точка архіву звіту.

- Потребує успішно завершеного сканування; нетермінальні сканування повертають `409`.
- Повертає ZIP з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікована кінцева точка архіву збереженого звіту для надісланих версій.

- Потребує доступу керування власника/видавця до навички або plugin, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точної надісланої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань plugin/пакетів.
- Повертає ту саму структуру ZIP, що й завантаження запитів сканування.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму структуру корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакетної обробки лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки картки навички, який використовується `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): рядок конкретної версії.
- `tag` (необов’язково): визначити версію з тегом (наприклад, `latest`).

Примітки:

- `ok` має значення `true` лише тоді, коли вибрана версія має згенеровану картку навички, не заблокована модерацією як шкідливе ПЗ, а перевірка ClawScan є чистою.
- Ідентичність навички, ідентичність видавця та метадані вибраної версії є полями верхнього рівня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб shell-автоматизація могла читати їх без розпакування вкладених обгорток.
- `security` — це вердикт ClawScan/безпеки верхнього рівня. Автоматизація має орієнтуватися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканера, такі як `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей вилучено, і цей ключ завжди має значення `null`.
- `provenance` має значення `server-resolved-github-import` лише тоді, коли ClawHub визначив і зберіг GitHub repo/ref/commit/path під час публікації або імпорту; інакше це `unavailable`.

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

- `items` має містити 1–100 унікальних пар `{ slug, version }`.
- Результати надаються для кожного елемента; одна відсутня навичка або версія не призводить до збою всієї відповіді.
- Відповідь містить лише дані безпеки. Вона не включає дані картки навички, статус згенерованої картки, списки файлів артефактів або докладні корисні навантаження сканера.
- `security.signals` містить лише допоміжні докази на рівні статусу; використовуйте `/scan` або сторінку аудиту безпеки ClawHub для повних деталей сканера.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер наявності реєстру залежностей вилучено, і цей ключ завжди має значення `null`.
- Відсутність картки навички не впливає на `ok`, `decision` або `reasons` цієї кінцевої точки; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли потрібен конверт перевірки картки навички для однієї навички, `/card`, коли потрібен згенерований Markdown картки, і `/scan`, коли потрібні докладні дані сканера.

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

- `path` (обов’язковий)
- `version` (необов’язковий)
- `tag` (необов’язковий)

Примітки:

- Типово використовується найновіша версія.
- Обмеження розміру файлу: 200 КБ.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- Skills
- кодових плагінів
- пакетних плагінів

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `updated` (типово), `recommended`, `trending`, `downloads`, застарілий аліас `installs`
- `category` (необов’язковий): фільтр категорії плагінів. Підтримується лише коли
  запит обмежено пакетами плагінів (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Контрольовані категорії та
  застарілі аліаси фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Некоректні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються аліасами з фіксованим сімейством.
- Записи Skills і надалі базуються на реєстрі Skills та все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` досі призначений лише для випусків code-plugin і bundle-plugin.
- Анонімні клієнти бачать лише публічні канали пакетів.
- Автентифіковані клієнти можуть бачити приватні пакети видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований клієнт може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі Skills + пакетів плагінів.

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1–100)
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії плагінів. Підтримується лише коли
  запит обмежено пакетами плагінів. Контрольовані категорії та застарілі аліаси
  фільтрів v1 задокументовано в `GET /api/v1/plugins`.

Примітки:

- Некоректні значення для `family`, `channel`, `isOfficial`, `featured` або
  `highlightedOnly` повертають `400`. Невідомі параметри запиту ігноруються.
- Анонімні клієнти бачать лише публічні канали пакетів.
- Автентифіковані клієнти можуть шукати приватні пакети видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований клієнт може читати.

### `GET /api/v1/plugins`

Огляд каталогу лише плагінів серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `recommended` (типово), `trending`, `downloads`, `updated`, застарілий аліас `installs`
- `category` (необов’язковий): фільтр категорії плагінів. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі аліаси фільтрів v1 і надалі приймаються на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` розв’язуються в `tools`.
- `observability` і `deployment` розв’язуються в `gateway`.
- `dev-tools` розв’язується в `runtime`.

`trending` — це семиденна таблиця лідерів установлень/завантажень, яка не використовує загальні показники за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` вона застосовується лише до плагінів; використовуйте
`/api/v1/skills?sort=trending` для каталогу Skills.

Застарілі аліаси не приймаються як збережені або оголошені автором значення категорій.

### `GET /api/v1/skills/export`

Масовий експорт найновіших публічних Skills для офлайн-аналізу.

Автентифікація:

- Потрібен токен API.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа в мілісекундах Unix для `updatedAt` Skills.
- `endDate` (обов’язковий): верхня межа в мілісекундах Unix для `updatedAt` Skills.
- `limit` (необов’язковий): ціле число (1-250), типово `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований Skill має корінь у `{publisher}/{slug}/`.
- Розміщені Skills містять файли найновішої збереженої версії та перелічені в
  `_manifest.json` із `sourceRef: "public-clawhub"`.
- Поточні Skills із джерелом у GitHub зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` із `sourceRef: "public-github"`, репозиторієм, комітом, шляхом,
  хешем вмісту та URL архіву. Вони не містять вихідні файли, розміщені в ClawHub.
- Кожен Skill містить `_export_skill_meta.json`.
- `_manifest.json` завжди включено в корені ZIP.
- `_errors.json` включено, коли окремі Skills або файли не вдалося
  експортувати.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Масовий експорт найновіших публічних випусків плагінів для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа Unix у мілісекундах для `updatedAt` плагіна.
- `endDate` (обов’язковий): верхня межа Unix у мілісекундах для `updatedAt` плагіна.
- `limit` (необов’язковий): ціле число (1-250), типово `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.
- `family` (необов’язковий): `code-plugin` або `bundle-plugin`. Якщо пропущено, означає обидві
  родини плагінів.

Відповідь:

- Тіло: ZIP-архів.
- Кожен експортований плагін має корінь у `{family}/{packageName}/`.
- Кожен експортований плагін містить збережені файли найновішого випуску.
- Метадані експорту для кожного плагіна зберігаються в
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включено, коли окремі плагіни або файли не вдалося
  експортувати.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Пошук лише плагінів серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1-100)
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії плагіна. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примітки:

- Застарілі псевдоніми фільтрів v1, задокументовані в `GET /api/v1/plugins`, також
  приймаються.
- Фільтрація за категорією є справжнім API-фільтром, підкріпленим рядками дайджесту
  категорій плагінів, а не переписуванням пошукового запиту.
- Результати повертаються в порядку релевантності й наразі не мають пагінації.
- Елементи керування сортуванням у браузерному UI для пошуку плагінів перевпорядковують завантажені релевантні результати,
  відповідно до поточної поведінки перегляду `/skills`.

### `GET /api/v1/packages/{name}`

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть вирішуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `DELETE /api/v1/packages/{name}`

М’яко видаляє пакет і всі випуски.

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
  `npm-pack` для випусків на основі ClawPack.
- Випуски ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` є застарілими метаданими сумісності для старих клієнтів. Воно
  хешує точні байти ZIP, повернуті `/api/v1/packages/{name}/download`.
  Сучасним клієнтам слід використовувати `version.artifact.sha256`, який ідентифікує
  канонічний артефакт випуску.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan`
  включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точний підсумок безпеки й довіри для випуску пакета для клієнтів
інсталяції. Це публічна поверхня споживання OpenClaw для вирішення, чи можна
встановити вирішений випуск.

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
  вирішений пакет реєстру.
- `release.releaseId`, `release.version` і `release.createdAt` ідентифікують
  точний випуск, який було оцінено.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` і `release.npmTarballName` присутні, коли вони відомі для
  артефакту випуску.
- `trust.scanStatus` — ефективний статус довіри, отриманий із вхідних даних сканера
  та ручної модерації випуску.
- `trust.moderationState` може бути null. Воно дорівнює `null`, коли ручної модерації випуску
  немає.
- `trust.blockedFromDownload` — сигнал блокування інсталяції. OpenClaw та інші
  клієнти інсталяції мають блокувати встановлення, коли це значення дорівнює `true`, замість
  повторного виведення правил блокування з полів сканера або модерації.
- `trust.reasons` — список пояснень для користувача й аудиту. Коди причин
  є стабільними, компактними рядками, як-от `manual:quarantined`, `scan:malicious`
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри все ще очікують завершення.
- `trust.stale` означає, що підсумок довіри було обчислено із застарілих вхідних даних і
  його слід вважати таким, що потребує оновлення перед рішенням дозволу з високою впевненістю.

Примітки:

- Ця кінцева точка є точною до версії. Клієнти мають викликати її після вирішення
  версії пакета, яку вони мають намір інсталювати, а не лише після читання найновіших
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації власника/модератора.
  Вона надає рішення щодо інсталяції та публічне пояснення, а не
  ідентичності репортерів, тіла звітів, приватні докази чи внутрішні часові лінії
  рев’ю.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані резолвера артефакту для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і URL сумісності із застарілим ZIP.
- Це поверхня резолвера OpenClaw; вона уникає вгадування формату архіву зі
  спільного URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях резолвера.

Примітки:

- Версії ClawPack передають потоком точні байти завантаженого npm-pack `.tgz`.
- Застарілі ZIP-версії переспрямовують на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик обмеження швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність найновішої версії
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

Кінцева точка модератора для переліку рядків міграції офіційних плагінів OpenClaw.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `phase` (необов’язковий): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` або
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

Адміністративна кінцева точка для створення або оновлення рядка міграції офіційного плагіна.

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
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг рев’ю випусків пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язковий): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, карантиновані, відкликані або зарепортовані випуски.
- `blocked`: карантиновані, відкликані або шкідливі випуски.
- `manual`: будь-який випуск із ручним перевизначенням модерації.
- `all`: будь-який випуск із ручним перевизначенням, нечистим станом сканування або звітом про пакет.

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

Повідомляє про пакет для рев’ю модератором. Звіти мають рівень пакета й необов’язково
пов’язані з версією. Вони потрапляють до черги модерації, але самі по собі не приховують автоматично
і не блокують завантаження; модераторам слід використовувати модерацію випусків, щоб
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

- `status` (необов'язково): `open` (типово), `confirmed`, `dismissed` або `all`
- `limit` (необов'язково): ціле число (1-100)
- `cursor` (необов'язково): курсор пагінації

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
  адміністратора.

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

`note` обов'язкове для `confirmed` і `dismissed`; його можна пропустити під час
встановлення `status` назад на `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію релізу в тому
самому аудійованому робочому процесі.

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

- `approved`: вручну перевірено та дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в карантині та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис до журналу аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає сирий текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов'язково)
- `version` (необов'язково)
- `tag` (необов'язково)

Примітки:

- Типово використовується останній реліз.
- Використовує кошик ліміту швидкості читання, а не кошик завантаження.
- Бінарні файли повертають `415`.
- Обмеження розміру файлу: 200 КБ.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть бути утримані в іншому місці.
- Приватні пакети повертають `404`, якщо викликач не може читати власного видавця.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов'язково)
- `tag` (необов'язково)

Примітки:

- Типово використовується останній реліз.
- Skills переспрямовують на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише для ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише з реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів на основі ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball ClawPack npm-pack.
- Застарілі версії лише з ZIP навмисно пропущені.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument пакетів зі scope підтримують як `/api/npm/@scope/name`, так і npm
  закодований шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує кошик ліміту швидкості завантаження.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов'язково)
- `hash` (обов'язково): 64-символьний hex sha256 відбитка bundle

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії навички або повертає передавання до джерела GitHub для
поточної навички на основі GitHub зі скануванням `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов'язково)
- `version` (необов'язково): рядок semver
- `tag` (необов'язково): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- М'яко видалені версії повертають `410`.
- Передавання навичок на основі GitHub не проксіює й не дзеркалить байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є умовою допуску й не включається як метадані
  успішного payload.
- Статистика завантажень рахується як унікальні ідентичності на день UTC (`userId`, коли API-токен дійсний, інакше IP).

## Кінцеві точки автентифікації (Bearer token)

Усі кінцеві точки потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob `files[]`.
- JSON body з `files` (на основі storageId) також приймається.
- Необов'язкове поле payload: `ownerHandle`. Коли воно наявне, API розв'язує цього
  видавця на сервері й вимагає, щоб actor мав доступ до видавця.
- Необов'язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявна
  навичка може перейти до цього власника, якщо actor є адміністратором/власником у обох
  видавців: поточного й цільового. Без цього явного погодження зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потрібна автентифікація Bearer token.
- Потрібен `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blob `files` або одне посилання на tarball
  `clawpack`. `clawpack` може бути blob `.tgz` або storage id, повернений потоком
  upload-url. Публікації staged storage-id також мають включати
  `clawpackUploadTicket`, повернений із цією URL завантаження.
- Використовуйте або `files`, або `clawpack`, але ніколи обидва в одному запиті.
- JSON body і надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18 МБ. Tarball ClawPack можуть
  використовувати потік upload-url до ліміту tarball 120 МБ.
- Необов'язкове поле payload: `ownerHandle`. Коли воно наявне, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих коміту
  джерела, метаданих схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов'язковими метаданими.
- Лише видавець org `openclaw` і персональні видавці поточних учасників org `openclaw`
  можуть публікувати в канал `official`.
- Публікації від імені іншого власника все одно перевіряють придатність до official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М'яко видаляє / відновлює навичку (власник, модератор або адміністратор).

Необов'язковий JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли `reason` наявний, він зберігається як примітка модерації навички й копіюється в журнал аудиту.
М'які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк дії.
Приховування модератором/адміністратором і безпекові видалення не спливають таким чином.

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

Лише для адміністраторів. Забезпечує існування org-видавця для handle. Якщо handle усе ще вказує на
застарілого спільного користувача/персонального видавця, кінцева точка спочатку мігрує його в org-видавця.
Для новоствореної org надайте `memberHandle`; чинний адміністратор не додається як учасник.
`memberRole` типово дорівнює `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане self-serve створення org-видавця. Створює нового org-видавця й додає
викликача як власника. Ця кінцева точка не мігрує наявні користувацькі/персональні handle і
не позначає видавця як довіреного/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle вже використовується видавцем, користувачем або персональним видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністраторів. Резервує кореневі slug і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними placeholder-пакетами без рядків релізів, щоб той самий
власник міг пізніше опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністраторів. Відновлює персонального видавця для перевіреного замінного principal GitHub OAuth
без редагування рядків облікових записів Convex Auth. Запит має називати обидва незмінні
ідентифікатори облікових записів провайдера GitHub; змінні handle використовуються лише як operator-facing запобіжник.

Кінцева точка за замовчуванням працює в режимі пробного запуску. Застосування відновлення потребує `dryRun: false` і
`confirmIdentityVerified: true` після того, як персонал незалежно перевірить безперервність між обома
GitHub principals. Відновлення завершується закритою відмовою, якщо поточний персональний
видавець цільового користувача має навички, пакети або джерела навичок GitHub.
Відновлення також переносить застарілі поля `ownerUserId` для навичок відновленого видавця,
псевдонімів слагів навичок, пакетів, попереджень інспектора пакетів і похідних рядків пошукового дайджесту, щоб
шляхи прямого власника узгоджувалися з новими повноваженнями видавця. Активне резервування захищеного дескриптора
для відновленого дескриптора також перепризначається користувачу-заміннику, щоб подальша
синхронізація профілю не могла відновити конкуруючі повноваження попереднього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спочатку використати відновлювану міграцію власника.
Джерела навичок GitHub мають область видимості видавця й повідомляються як перевірені, а не переписані.

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

- Обидві кінцеві точки потребують автентифікації API-токеном і працюють лише для власника навички.
- `rename` зберігає попередній слаг як псевдонім перенаправлення.
- `merge` приховує вихідний запис і перенаправляє вихідний слаг на цільовий запис.

### Кінцеві точки передавання власності

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

Заблокувати користувача й остаточно видалити належні йому навички (лише модератор/адміністратор).

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

Розблокувати користувача й відновити придатні навички (лише адміністратор).

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
вмісту (лише адміністратор). За замовчуванням працює в режимі пробного запуску, якщо `dryRun` не дорівнює `false`.

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

Показати список користувачів або виконати пошук користувачів (лише адміністратор).

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

## Застарілі кінцеві точки CLI (не рекомендовано)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Див. `DEPRECATIONS.md` щодо плану видалення.

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації пакетів,
які готують tarball ClawPack, мають надсилати отриманий ідентифікатор сховища як
`clawpack`, а повернений квиток як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви розгортаєте самостійно, обслуговуйте цей файл (або явно встановіть `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
