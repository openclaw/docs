---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстр
summary: Довідник HTTP API (публічні ендпоїнти + ендпоїнти CLI + автентифікація).
x-i18n:
    generated_at: "2026-07-04T10:58:34Z"
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

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб перелічувати або шукати Skills ClawHub. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, повертайте користувачів посиланням до канонічного запису ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза публічною поверхнею API.

Скорочення веб-slug розв’язуються між сімействами реєстру, але клієнти API мають використовувати
канонічні URL-адреси, повернуті кінцевими точками читання, замість відтворення пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовуються для кожної IP-адреси.
- Автентифіковані запити (чинний Bearer token): застосовуються для кошика користувача.
- Якщо токен відсутній або недійсний, поведінка повертається до застосування за IP-адресою.
- Автентифіковані кінцеві точки запису не мають повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб клієнти
  CLI могли повідомити користувачам, що їх заблокувало.

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
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок бюджету, коли присутній.
  Успішні шардовані запити пропускають цей заголовок замість повернення приблизного глобального значення.
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

Поради для клієнтів:

- Якщо `Retry-After` існує, зачекайте стільки секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP-адреси:

- Використовує довірені заголовки IP-адреси клієнта, зокрема `cf-connecting-ip`, лише коли
  розгортання явно вмикає довірені forwarded-заголовки.
- ClawHub використовує довірені forwarding-заголовки, щоб ідентифікувати IP-адреси клієнтів на edge.
- Якщо довірена IP-адреса клієнта недоступна, анонімні запити використовують fallback-кошики,
  обмежені лише видом rate-limit. Ці fallback-кошики не включають
  надані викликачем шляхи, slug, назви пакетів, версії, рядки запиту чи інші
  параметри артефактів.

## Відповіді з помилками

Публічні відповіді з помилками v1 є звичайним текстом із `content-type: text/plain; charset=utf-8`.
Це охоплює помилки валідації (`400`), відсутні публічні ресурси (`404`), помилки автентифікації та
дозволів (`401`/`403`), обмеження частоти (`429`) і заблоковані завантаження. Клієнти
мають читати тіло відповіді як зрозумілий людині рядок. Невідомі параметри запиту
ігноруються для сумісності, але розпізнані параметри запиту з недійсними значеннями повертають
`400`.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число
- `highlightedOnly` (необов’язковий): `true`, щоб фільтрувати лише до виділених Skills
- `nonSuspiciousOnly` (необов’язковий): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язковий): застарілий псевдонім для `nonSuspiciousOnly`

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

- Результати повертаються в порядку релевантності (подібність embedding + підсилення точних токенів slug/назви + невеликий пріоритет популярності).
- Релевантність сильніша за популярність. Точний збіг токена slug або display-name може випередити менш точний збіг зі значно сильнішою взаємодією.
- ASCII-текст токенізується на межах слів і пунктуації. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Популярність масштабується логарифмічно та обмежується. Skills із високою взаємодією можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може прибрати Skill із публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Поради щодо доступності для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у display name, summary і tags. Використовуйте окремий токен slug лише тоді, коли він також є стабільною ідентичністю, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slug стають redirect-псевдонімами, але канонічна URL-адреса, відображуваний slug і майбутні пошукові дайджести використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес і встановлень, що розв’язуються через реєстр, але ранжування пошуку базується на канонічних метаданих Skill після індексації перейменування. Наявна статистика залишається зі Skill.
- Якщо Skill несподівано невидимий, спершу перевірте стан модерації за допомогою `clawhub inspect @owner/slug`, увійшовши в систему, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–200)
- `cursor` (необов’язковий): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язковий): `updated` (за замовчуванням), `recommended` (псевдонім: `default`), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), застарілі псевдоніми встановлень `installsCurrent`/`installs`/`installsAllTime` відповідають `downloads`, `trending`
- `nonSuspiciousOnly` (необов’язковий): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов’язковий): застарілий псевдонім для `nonSuspiciousOnly`

Недійсні значення `sort` повертають `400`.

Примітки:

- `recommended` використовує сигнали взаємодії та нещодавності.
- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових Skills; `updated` змінюється, коли наявні Skills перевидаються.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора можуть повертати менше ніж `limit` елементів на сторінці, бо підозрілі Skills фільтруються після отримання сторінки.
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

- Старі slug, створені потоками перейменування/об’єднання власника, розв’язуються до канонічного Skill.
- `metadata.os`: обмеження ОС, оголошені у frontmatter Skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цілі системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо Skill не має метаданих платформи.
- `moderation` включається лише коли Skill позначено прапорцем або власник його переглядає.

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

Повідомити про Skill для перегляду модератором. Звіти є рівня Skill, необов’язково пов’язані
з версією, і надходять до черги звітів Skill.

Автентифікація:

- Потребує API-токен.

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

- `status` (необов’язковий): `open` (за замовчуванням), `confirmed`, `dismissed` або `all`
- `limit` (необов’язковий): ціле число (1-200)
- `cursor` (необов’язковий): курсор пагінації

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

`note` потрібен для `confirmed` і `dismissed`; його можна пропустити, коли
встановлюєте `status` назад на `open`. Передайте `finalAction: "hide"` із тріажованим
звітом, щоб приховати Skill у тому самому придатному для аудиту workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язковий): ціле число
- `cursor` (необов’язковий): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` включає нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступні.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки безпекового сканування для версії Skill.

Параметри запиту:

- `version` (необов’язковий): конкретний рядок версії.
- `tag` (необов’язковий): розв’язати позначену тегом версію (наприклад, `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки та деталі, специфічні для сканера.
- `security.hasScanResult` має значення `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні skill, отриманий із найновішої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж трактувати `moderation` і `security` як той самий контекст версії.

### `POST /api/v1/skills/-/scan`

Автентифікована кінцева точка подання для нових завдань ClawScan.

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

- Корисні навантаження запитів сканування та звіти для завантаження видаляються зі сховища запитів сканування після завершення вікна зберігання.
- Опубліковані сканування потребують доступу до керування власника/видавця або повноважень модератора/адміністратора платформи.
- Опубліковані сканування записують результати назад лише коли `update: true` і сканування успішно завершується.
- Відповідь має статус `202` з `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Завдання сканування асинхронні. Ручні запити сканування мають пріоритет над звичайною роботою публікації/зворотного заповнення, але завершення все одно залежить від доступності воркерів.

### `GET /api/v1/skills/-/scan/{scanId}`

Автентифікована кінцева точка опитування для поданого сканування.

- Повертає статус queued/running/succeeded/failed.
- Повертає `queue.queuedAhead` і `queue.position` під час перебування в черзі, щоб клієнти могли показувати, скільки пріоритетних ручних сканувань перебуває попереду запиту. Дуже великі черги обмежуються й повідомляються з `queuedAheadIsEstimate: true`.
- Коли доступно, `report` містить розділи `clawscan`, `skillspector`, `staticAnalysis` і `virustotal`.
- Невдалі завдання сканування повертають `status: "failed"` з `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Автентифікована кінцева точка архіву звіту.

- Потребує успішно завершеного сканування; нетермінальні сканування повертають `409`.
- Повертає ZIP із `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Автентифікована кінцева точка збереженого архіву звіту для поданих версій.

- Потребує доступу до керування власника/видавця для skill або plugin, або повноважень модератора/адміністратора платформи.
- Повертає збережені результати сканування для точної поданої версії, включно із заблокованими або прихованими версіями.
- `kind` за замовчуванням має значення `skill`; використовуйте `kind=plugin` для сканувань plugin/пакета.
- Повертає ту саму форму ZIP, що й завантаження запитів сканування.

### `POST /api/v1/skills/-/scan/batch`

Канонічний маршрут пакетного повторного сканування лише для адміністраторів. Він приймає ту саму форму корисного навантаження, що й застарілий `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонічний маршрут статусу пакета лише для адміністраторів. Він приймає `{ "jobIds": ["..."] }` і повертає ті самі агреговані лічильники, що й застарілий `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Повертає конверт перевірки Skill Card, який використовується `clawhub skill verify`.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати теговану версію (наприклад, `latest`).

Примітки:

- `ok` має значення `true` лише тоді, коли вибрана версія має згенеровану Skill Card, не заблокована модерацією як шкідливе ПЗ, а перевірка ClawScan чиста.
- Ідентичність skill, ідентичність видавця та метадані вибраної версії є полями конверта верхнього рівня (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), щоб автоматизація shell могла читати їх без розпакування вкладених обгорток.
- `security` — це вердикт ClawScan/безпеки верхнього рівня. Автоматизація має орієнтуватися на `ok`, `decision`, `reasons` і `security.status`.
- `security.signals` містить допоміжні докази сканерів, як-от `staticScan`, `virusTotal` і `skillSpector`.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди дорівнює `null`.
- `provenance` має значення `server-resolved-github-import` лише тоді, коли ClawHub розв’язав і зберіг репозиторій/ref/commit/path GitHub під час публікації або імпорту; інакше має значення `unavailable`.

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
- Відповідь містить лише дані безпеки. Вона не містить даних Skill Card, статусу згенерованої картки, списків файлів артефактів або докладних корисних навантажень сканерів.
- `security.signals` містить лише допоміжні докази на рівні статусу; використовуйте `/scan` або сторінку аудиту безпеки ClawHub для повних деталей сканера.
- `security.signals.dependencyRegistry` збережено для сумісності відповіді v1, але сканер існування реєстру залежностей виведено з експлуатації, і цей ключ завжди дорівнює `null`.
- Відсутність Skill Card не впливає на `ok`, `decision` або `reasons` цієї кінцевої точки; клієнти мають читати встановлений `skill-card.md` локально, коли їм потрібен вміст картки.
- Використовуйте `/verify`, коли потрібен конверт перевірки Skill Card для одного skill, `/card`, коли потрібен згенерований markdown картки, і `/scan`, коли потрібні докладні дані сканера.

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

- За замовчуванням використовується найновіша версія.
- Обмеження розміру файлу: 200 КБ.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- навичок
- кодових плагінів
- пакетних плагінів

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `updated` (за замовчуванням), `recommended`, `trending`, `downloads`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії плагіна. Підтримується лише коли
  запит обмежено пакетами плагінів (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` або кінцевими точками пакетів із
  `family=code-plugin`/`family=bundle-plugin`). Керовані категорії та
  застарілі псевдоніми фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` або `sort` повертають `400`. Невідомі параметри запиту ігноруються.
- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованою родиною.
- Записи навичок і надалі підтримуються реєстром навичок і все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` і надалі призначено лише для випусків code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі серед навичок і пакетів плагінів.

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число (1–100)
- `family` (необов’язковий): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язковий): `official`, `community` або `private`
- `isOfficial` (необов’язковий): `true` або `false`
- `category` (необов’язковий): фільтр категорії плагіна. Підтримується лише коли
  запит обмежено пакетами плагінів. Керовані категорії та застарілі псевдоніми
  фільтрів v1 задокументовано в розділі `GET /api/v1/plugins`.

Примітки:

- Недійсні значення для `family`, `channel`, `isOfficial`, `featured` або
  `highlightedOnly` повертають `400`. Невідомі параметри запиту ігноруються.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/plugins`

Перегляд каталогу лише плагінів серед пакетів code-plugin і bundle-plugin.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації
- `isOfficial` (необов’язковий): `true` або `false`
- `sort` (необов’язковий): `recommended` (за замовчуванням), `trending`, `downloads`, `updated`, застарілий псевдонім `installs`
- `category` (необов’язковий): фільтр категорії плагіна. Поточні значення:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Застарілі псевдоніми фільтрів v1 і надалі приймаються на кінцевих точках читання:

- `mcp-tooling`, `data` і `automation` розв’язуються в `tools`.
- `observability` і `deployment` розв’язуються в `gateway`.
- `dev-tools` розв’язується в `runtime`.

`trending` — це семиденний рейтинг встановлень/завантажень, і він не використовує загальні підсумки за весь час.
На уніфікованій кінцевій точці `/api/v1/packages` він застосовується лише до плагінів; використовуйте
`/api/v1/skills?sort=trending` для каталогу навичок.

Застарілі псевдоніми не приймаються як збережені або оголошені автором значення категорій.

### `GET /api/v1/skills/export`

Масовий експорт найновіших публічних навичок для офлайн-аналізу.

Автентифікація:

- Потрібен API-токен.

Параметри запиту:

- `startDate` (обов’язковий): нижня межа в мілісекундах Unix для `updatedAt` навички.
- `endDate` (обов’язковий): верхня межа в мілісекундах Unix для `updatedAt` навички.
- `limit` (необов’язковий): ціле число (1-250), за замовчуванням `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.

Відповідь:

- Тіло: ZIP-архів.
- Кожна експортована навичка має корінь у `{publisher}/{slug}/`.
- Розміщені навички містять файли найновішої збереженої версії та перелічені в
  `_manifest.json` із `sourceRef: "public-clawhub"`.
- Поточні навички, підтримувані GitHub, зі скануванням `clean` або `suspicious` містять
  `_source_handoff.json` із `sourceRef: "public-github"`, репозиторієм, комітом, шляхом,
  хешем вмісту та URL архіву. Вони не містять вихідних файлів, розміщених у ClawHub.
- Кожна навичка містить `_export_skill_meta.json`.
- `_manifest.json` завжди включено в корінь ZIP.
- `_errors.json` включається, коли окремі навички або файли не вдалося
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
- `limit` (необов’язковий): ціле число (1-250), типово `250`.
- `cursor` (необов’язковий): курсор пагінації з попередньої відповіді.
- `family` (необов’язковий): `code-plugin` або `bundle-plugin`. Якщо пропущено, означає обидві
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

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-публікатора.

### `DELETE /api/v1/packages/{name}`

М’яко видаляє пакет і всі релізи.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора організації-публікатора,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–100)
- `cursor` (необов’язковий): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати власника-публікатора.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, зокрема метадані файлів, сумісність,
перевірку, метадані артефакта та дані сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого формату або
  `npm-pack` для релізів на основі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash` — застарілі метадані сумісності для старих клієнтів. Вони
  хешують точні байти ZIP, повернуті `/api/v1/packages/{name}/download`.
  Сучасним клієнтам слід використовувати `version.artifact.sha256`, який ідентифікує
  канонічний артефакт релізу.
- `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються,
  коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-публікатора.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Повертає точний підсумок безпеки та довіри релізу пакета для клієнтів
інсталяції. Це публічна поверхня споживання OpenClaw для вирішення, чи можна
інсталювати розв’язаний реліз.

Автентифікація:

- Публічна кінцева точка читання. Токен власника, публікатора, модератора або адміністратора
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
- `trust.scanStatus` — ефективний статус довіри, виведений із вхідних даних сканера
  та ручної модерації релізу.
- `trust.moderationState` може бути null. Він дорівнює `null`, коли ручної модерації релізу
  немає.
- `trust.blockedFromDownload` — сигнал блокування інсталяції. OpenClaw та інші
  клієнти інсталяції повинні блокувати інсталяцію, коли це значення `true`, замість
  повторного виведення правил блокування з полів сканера чи модерації.
- `trust.reasons` — список пояснень для користувача й аудиту. Коди причин
  є стабільними, компактними рядками, такими як `manual:quarantined`, `scan:malicious`
  і `package:malicious`.
- `trust.pending` означає, що один або кілька вхідних сигналів довіри ще очікують завершення.
- `trust.stale` означає, що підсумок довіри було обчислено із застарілих вхідних даних і
  його слід вважати таким, що потребує оновлення перед рішенням про дозвіл із високою впевненістю.

Примітки:

- Ця кінцева точка є точною до версії. Клієнти повинні викликати її після розв’язання
  версії пакета, яку мають намір інсталювати, а не лише після читання найновіших
  метаданих пакета.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-публікатора.
- Ця кінцева точка навмисно вужча за кінцеві точки модерації для власників/модераторів.
  Вона розкриває рішення щодо інсталяції та публічне пояснення, а не
  ідентичності репортерів, тіла звітів, приватні докази чи внутрішні часові лінії
  перевірки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані резолвера артефакта для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і застарілий URL сумісності ZIP.
- Це поверхня резолвера OpenClaw; вона уникає вгадування формату архіву зі
  спільного URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях резолвера.

Примітки:

- Версії ClawPack передають потоком точні завантажені байти npm-pack `.tgz`.
- Застарілі версії ZIP перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик обмеження швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність найновішої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
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

- `bundledPluginId` нормалізується до нижнього регістру та є стабільним ключем upsert.
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутнім для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Воно не змінює OpenClaw і не генерує
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язковий): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язковий): ціле число (1-100)
- `cursor` (необов’язковий): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, поміщені в карантин, відкликані або зарепортені релізи.
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

Повідомляє про пакет для перевірки модератором. Звіти мають рівень пакета, необов’язково
пов’язані з версією. Вони надходять до черги модерації, але самі собою не приховують автоматично й не
блокують завантаження; модератори повинні використовувати модерацію релізів, щоб
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

Модераторський/адміністративний endpoint для приймання звітів про пакети.

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

Endpoint власника/модератора для видимості модерації пакета.

Автентифікація:

- Потрібен API-токен власника пакета, учасника видавця, модератора або
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

Модераторський/адміністративний endpoint для вирішення або повторного відкриття звітів про пакети.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` потрібен для `confirmed` і `dismissed`; його можна пропустити, коли
`status` знову встановлюється на `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` із підтвердженим звітом, щоб застосувати модерацію релізу в тому
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

Модераторський/адміністративний endpoint для перевірки релізу пакета.

Запит:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Підтримувані стани:

- `approved`: перевірено вручну й дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в карантині та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис журналу аудиту.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файла пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Використовує кошик обмеження частоти читання, а не кошик завантажень.
- Двійкові файли повертають `415`.
- Обмеження розміру файла: 200KB.
- Очікування сканування VirusTotal не блокує читання; шкідливі релізи все ще можуть утримуватися в інших місцях.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Skills перенаправляються на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності resolver.
- Метадані лише з registry не вставляються в завантажений архів.
- Очікування сканування VirusTotal не блокує завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів на основі ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball ClawPack npm-pack.
- Застарілі версії лише ZIP навмисно пропущено.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument пакетів зі scope підтримує і `/api/npm/@scope/name`, і npm-кодований
  шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує кошик обмеження частоти завантажень.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального fingerprint із відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний hex sha256 fingerprint бандла

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує ZIP розміщеної версії skill або повертає передавання керування до джерела GitHub для
поточного skill на основі GitHub зі скануванням `clean` або `suspicious` і без розміщеної
версії.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тега (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- Soft-deleted версії повертають `410`.
- Передавання керування для skill на основі GitHub не проксіює й не дзеркалює байти. JSON-відповідь
  містить `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  і `archiveUrl`; стан сканування/поточний стан є gate і не включається як метадані
  успішного payload.
- Статистика завантажень рахується як унікальні ідентичності за день UTC (`userId`, коли API-токен дійсний, інакше IP).

## Endpoints автентифікації (Bearer token)

Усі endpoints потребують:

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
  видавця на сервері та вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявний
  skill може перейти до цього власника, якщо актор є адміністратором/власником і в поточного,
  і в цільового видавця. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потрібна автентифікація Bearer token.
- Потрібен `multipart/form-data`.
- Дозволені поля форми: `payload`, повторювані blob `files` або одне посилання на tarball `clawpack`.
  `clawpack` може бути blob `.tgz` або storage id, поверненим потоком upload-url.
  Публікації з staged storage-id також мають містити
  `clawpackUploadTicket`, повернений із цим URL завантаження.
- Використовуйте або `files`, або `clawpack`, ніколи обидва в одному запиті.
- JSON bodies і надані викликачем метадані `payload.files` / `payload.artifact`
  відхиляються.
- Прямі multipart-запити публікації обмежені 18MB. Tarball ClawPack можуть
  використовувати потік upload-url до ліміту tarball 120MB.
- Необов’язкове поле payload: `ownerHandle`. Коли воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих коміту джерела,
  метаданих schema конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише видавець організації `openclaw` і особисті видавці поточних учасників організації `openclaw`
  можуть публікувати в каналі `official`.
- Публікації від імені іншого користувача все одно перевіряють право на official-channel щодо облікового запису цільового власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / відновлення skill (власник, модератор або адміністратор).

Необов’язковий JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли `reason` присутній, він зберігається як примітка модерації skill і копіюється в журнал аудиту.
Soft delete, ініційований власником, резервує slug на 30 днів, після чого slug може заявити
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

Лише для адміністратора. Гарантує існування видавця організації для handle. Якщо handle все ще вказує на
застарілого спільного користувача/особистого видавця, endpoint спочатку мігрує його у видавця організації.
Для новоствореної організації надайте `memberHandle`; діючий адміністратор не додається як учасник.
`memberRole` за замовчуванням має значення `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Автентифіковане self-serve створення видавця організації. Створює нового видавця організації та додає
викликача як власника. Цей endpoint не мігрує наявні користувацькі/особисті handles і
не позначає видавця як довіреного/офіційного.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Повертає `409`, коли handle уже використовується видавцем, користувачем або особистим видавцем.

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slugs і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними placeholder-пакетами без рядків релізів, тому той самий
власник може пізніше опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Лише для адміністратора. Відновлює особистого видавця для перевіреного замінного GitHub OAuth principal
без редагування рядків облікових записів Convex Auth. Запит має вказувати обидва незмінні
ідентифікатори облікових записів GitHub provider; змінювані handles використовуються лише як видимий оператору захист.

Кінцева точка за замовчуванням працює в режимі пробного запуску. Застосування відновлення потребує `dryRun: false` і
`confirmIdentityVerified: true` після того, як співробітники незалежно перевірять безперервність між обома
суб’єктами GitHub. Відновлення завершується закритою відмовою, якщо поточний особистий
видавець користувача призначення має skills, packages або джерела GitHub skill.
Відновлення також переносить застарілі поля `ownerUserId` для skills відновленого видавця,
псевдонімів slug skill, packages, попереджень інспектора package та похідних рядків дайджесту пошуку, щоб
шляхи прямого власника узгоджувалися з новим повноваженням видавця. Активне резервування захищеного handle
для відновленого handle також перепризначається користувачу-заміні, щоб подальша
синхронізація профілю не могла відновити конкуруюче повноваження колишнього користувача. Кожна основна таблиця обмежена
100 рядками на транзакцію застосування; більші відновлення мають спочатку використати відновлювану міграцію власника.
Джерела GitHub skill мають область дії видавця й повідомляються як перевірені, а не переписуються.

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
- `rename` зберігає попередній slug як псевдонім перенаправлення.
- `merge` приховує вихідний запис і перенаправляє вихідний slug до цільового запису.

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

Забанити користувача й жорстко видалити належні йому skills (лише moderator/admin).

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

Розбанити користувача й відновити придатні skills (лише admin).

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

Змінити збережену причину наявного бану без розбанювання або відновлення
вмісту (лише admin). За замовчуванням працює в режимі пробного запуску, якщо `dryRun` не дорівнює `false`.

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

Змінити роль користувача (лише admin).

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

Перелічити або шукати користувачів (лише admin).

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

`POST /api/cli/upload-url` повертає `uploadUrl` і `uploadTicket`. Публікації package,
які готують tarball ClawPack, мають надсилати отриманий storage id як
`clawpack`, а повернений ticket як `clawpackUploadTicket`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви розгортаєте самостійно, обслуговуйте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
